const https = require('https');

let liveCricketCache = null;
let lastScrapeTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60s memory cache

function scrapeLiveCricket() {
  return new Promise((resolve) => {
    if (liveCricketCache && (Date.now() - lastScrapeTime < CACHE_TTL_MS)) {
      return resolve(liveCricketCache);
    }

    const cricinfoRss = 'https://static.cricinfo.com/rss/livescores.xml';
    https.get(cricinfoRss, { timeout: 4000 }, (res) => {
      let xml = '';
      res.on('data', chunk => xml += chunk);
      res.on('end', () => {
        try {
          const items = [];
          const itemRegex = /<item>([\s\S]*?)<\/item>/g;
          let match;
          while ((match = itemRegex.exec(xml)) !== null) {
            const itemBlock = match[1];
            const titleMatch = itemBlock.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemBlock.match(/<title>(.*?)<\/title>/);
            const descMatch = itemBlock.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || itemBlock.match(/<description>(.*?)<\/description>/);
            const linkMatch = itemBlock.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/) || itemBlock.match(/<link>(.*?)<\/link>/);

            const title = titleMatch ? titleMatch[1].trim() : '';
            const desc = descMatch ? descMatch[1].trim() : '';
            const link = linkMatch ? linkMatch[1].trim() : '';

            if (title && (title.includes(' v ') || title.includes(' vs ') || title.includes('Won') || title.includes('lead') || title.includes('trail') || title.includes('/'))) {
              const teams = title.split(/ v | vs /i);
              items.push({
                rawTitle: title,
                team1: teams[0] ? teams[0].trim() : '',
                team2: teams[1] ? teams[1].trim() : '',
                description: desc,
                link: link,
                source: 'Cricinfo Live Web Scraper'
              });
            }
          }

          if (items.length > 0) {
            liveCricketCache = {
              success: true,
              scrapedAt: new Date().toISOString(),
              matchesCount: items.length,
              matches: items
            };
            lastScrapeTime = Date.now();
            return resolve(liveCricketCache);
          }
        } catch (e) {}

        resolve(liveCricketCache || { success: false, matches: [] });
      });
    }).on('error', () => {
      resolve(liveCricketCache || { success: false, matches: [] });
    });
  });
}

module.exports = async function handler(req, res) {
  const data = await scrapeLiveCricket();
  if (res.setHeader) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  }
  if (res.status && typeof res.status === 'function') {
    res.status(200).json(data);
  } else if (res.writeHead) {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify(data));
  }
};
