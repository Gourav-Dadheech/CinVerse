/**
 * CinVerse Cricket Live API Bridge
 * Real-time match data scraper powered by Cricbuzz live JSON & RSC engine.
 * Fetches real active international, league (IPL), and domestic matches with live scores,
 * runs, wickets, overs, match status, venue, and teams.
 */
const https = require('https');

let liveCricketCache = null;
let lastScrapeTime = 0;
const CACHE_TTL_MS = 20 * 1000; // 20-second high-speed live cache

function getTeamFlag(name, shortCode) {
  const n = ((name || '') + ' ' + (shortCode || '')).toLowerCase();
  if (n.includes('india') || n.includes('ind')) return '🇮🇳';
  if (n.includes('australia') || n.includes('aus')) return '🇦🇺';
  if (n.includes('england') || n.includes('eng')) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  if (n.includes('south africa') || n.includes('rsa') || n.includes('sa')) return '🇿🇦';
  if (n.includes('new zealand') || n.includes('nz')) return '🇳🇿';
  if (n.includes('pakistan') || n.includes('pak')) return '🇵🇰';
  if (n.includes('sri lanka') || n.includes('sl')) return '🇱🇰';
  if (n.includes('bangladesh') || n.includes('ban') || n.includes('bcb')) return '🇧🇩';
  if (n.includes('afghanistan') || n.includes('afg')) return '🇦🇫';
  if (n.includes('west indies') || n.includes('wi')) return '🌴';
  if (n.includes('zimbabwe') || n.includes('zim')) return '🇿🇼';
  if (n.includes('ireland') || n.includes('ire')) return '🇮🇪';
  if (n.includes('netherlands') || n.includes('ned')) return '🇳🇱';
  if (n.includes('scotland') || n.includes('sco')) return '🏴󠁧󠁢󠁳󠁣󠁴󠁿';
  if (n.includes('namibia') || n.includes('nam')) return '🇳🇦';
  if (n.includes('nepal') || n.includes('nep')) return '🇳🇵';
  if (n.includes('usa') || n.includes('united states')) return '🇺🇸';
  if (n.includes('oman')) return '🇴🇲';
  if (n.includes('uae')) return '🇦🇪';
  if (n.includes('uganda') || n.includes('uga')) return '🇺🇬';
  if (n.includes('gambia') || n.includes('gm')) return '🇬🇲';
  if (n.includes('zambia') || n.includes('zmb')) return '🇿🇲';
  if (n.includes('nigeria') || n.includes('nga')) return '🇳🇬';
  if (n.includes('kenya') || n.includes('ken')) return '🇰🇪';
  if (n.includes('kuwait') || n.includes('kuw')) return '🇰🇼';
  if (n.includes('qatar') || n.includes('qat')) return '🇶🇦';
  if (n.includes('denmark') || n.includes('den')) return '🇩🇰';
  if (n.includes('chennai') || n.includes('csk')) return '💛';
  if (n.includes('mumbai') || n.includes('mi')) return '💙';
  if (n.includes('kolkata') || n.includes('kkr')) return '💜';
  if (n.includes('royal challengers') || n.includes('rcb')) return '❤️';
  if (n.includes('delhi') || n.includes('dc')) return '💙';
  if (n.includes('rajasthan') || n.includes('rr')) return '💖';
  if (n.includes('punjab') || n.includes('pbks')) return '🔴';
  if (n.includes('sunrisers') || n.includes('srh')) return '🧡';
  if (n.includes('lucknow') || n.includes('lsg')) return '🩵';
  if (n.includes('gujarat') || n.includes('gt')) return '⚡';
  return '🏏';
}

function formatScore(scoreObj, teamKey) {
  if (!scoreObj || !scoreObj[teamKey]) return { score: '', overs: '', runs: 0, wickets: 0 };
  const s = scoreObj[teamKey];
  const inngs = s.inngs1 || s.inngs2 || {};
  if (inngs.runs !== undefined) {
    const oversText = inngs.overs !== undefined ? inngs.overs + ' ov' : '';
    const scoreText = `${inngs.runs}/${inngs.wickets !== undefined ? inngs.wickets : 0}`;
    return {
      score: scoreText,
      overs: oversText,
      runs: inngs.runs || 0,
      wickets: inngs.wickets || 0
    };
  }
  return { score: '', overs: '', runs: 0, wickets: 0 };
}

function scrapeCricbuzzLive() {
  return new Promise((resolve) => {
    const now = Date.now();
    if (liveCricketCache && (now - lastScrapeTime < CACHE_TTL_MS)) {
      return resolve(liveCricketCache);
    }

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      timeout: 7000
    };

    https.get('https://www.cricbuzz.com/cricket-match/live-scores', options, (res) => {
      let html = '';
      res.on('data', chunk => html += chunk);
      res.on('end', () => {
        try {
          const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          const matches = [];
          const seenMatchIds = new Set();

          let pos = 0;
          while ((pos = unescaped.indexOf('"matchInfo":', pos)) !== -1) {
            const start = pos + '"matchInfo":'.length;
            let depth = 0;
            let end = start;
            for (let i = start; i < unescaped.length; i++) {
              if (unescaped[i] === '{') depth++;
              else if (unescaped[i] === '}') {
                depth--;
                if (depth === 0) {
                  end = i + 1;
                  break;
                }
              }
            }
            const infoStr = unescaped.slice(start, end);
            pos = end;

            try {
              const info = JSON.parse(infoStr);
              if (info && info.matchId && !seenMatchIds.has(info.matchId)) {
                seenMatchIds.add(info.matchId);

                let scoreObj = null;
                const scoreTag = ',"matchScore":';
                if (unescaped.slice(end, end + scoreTag.length) === scoreTag) {
                  const sStart = end + scoreTag.length;
                  let sDepth = 0;
                  let sEnd = sStart;
                  for (let j = sStart; j < unescaped.length; j++) {
                    if (unescaped[j] === '{') sDepth++;
                    else if (unescaped[j] === '}') {
                      sDepth--;
                      if (sDepth === 0) {
                        sEnd = j + 1;
                        break;
                      }
                    }
                  }
                  try {
                    scoreObj = JSON.parse(unescaped.slice(sStart, sEnd));
                  } catch (e) {}
                }

                const rawState = (info.state || '').toLowerCase();
                let statusGroup = 'UPCOMING';
                let statusTag = '🟢 UPCOMING';

                if (rawState.includes('progress') || rawState.includes('toss') || rawState.includes('break') || rawState.includes('stumps') || rawState.includes('delay') || rawState.includes('rain')) {
                  statusGroup = 'LIVE';
                  statusTag = '🔴 LIVE • ' + (info.stateTitle || info.state || 'IN PLAY').toUpperCase();
                } else if (rawState.includes('complete') || rawState.includes('drawn') || rawState.includes('won') || rawState.includes('abandon')) {
                  statusGroup = 'COMPLETED';
                  statusTag = '⚪ COMPLETED';
                }

                const seriesName = info.seriesName || 'International Cricket Series';
                const sLower = seriesName.toLowerCase();
                let category = 'international';
                if (sLower.includes('ipl') || sLower.includes('league') || sLower.includes('bbl') || sLower.includes('psl') || sLower.includes('t20')) {
                  category = 'league';
                } else if (sLower.includes('trophy') || sLower.includes('ranji') || sLower.includes('domestic') || sLower.includes('cup')) {
                  category = 'domestic';
                }

                const t1 = info.team1 || {};
                const t2 = info.team2 || {};
                const team1Name = t1.teamName || 'Team 1';
                const team2Name = t2.teamName || 'Team 2';
                const team1Short = t1.teamSName || team1Name.slice(0, 4).toUpperCase();
                const team2Short = t2.teamSName || team2Name.slice(0, 4).toUpperCase();

                const team1ScoreData = formatScore(scoreObj, 'team1Score');
                const team2ScoreData = formatScore(scoreObj, 'team2Score');

                const venue = info.venueInfo ? (info.venueInfo.ground + (info.venueInfo.city ? ', ' + info.venueInfo.city : '')) : 'International Stadium';
                const statusText = info.status || (statusGroup === 'LIVE' ? 'Match in progress' : (statusGroup === 'UPCOMING' ? 'Scheduled' : 'Match Completed'));

                matches.push({
                  id: 'cricbuzz-' + info.matchId,
                  numericId: info.matchId,
                  sport: 'cricket',
                  format: (info.matchFormat || 'T20').toUpperCase(),
                  category: category,
                  status: statusGroup,
                  statusTag: statusTag,
                  badge: 'CRICBUZZ LIVE WIRE 📡',
                  tournament: seriesName + (info.matchDesc ? ' • ' + info.matchDesc : ''),
                  venue: venue,
                  dateLabel: info.startDate ? new Date(parseInt(info.startDate)).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Live Match',
                  streamTitle: `${team1Short} vs ${team2Short} • Live Broadcast`,
                  servers: [
                    { id: 1, name: 'Server 1 • Willow Cricket HD (Live Stadium Feed)', quality: '1080p 60FPS', url: 'https://d36r8jifhgsk5j.cloudfront.net/Willow_TV.m3u8', type: 'hls' },
                    { id: 2, name: 'Server 2 • Cricket Gold HD (Stadium Live Feed)', quality: '1080p HD', url: 'https://streams2.sofast.tv/ptnr-yupptv/title-cricketgold/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/b2048bb8-1686-4432-aa50-647245383e0c/manifest.m3u8', type: 'hls' },
                    { id: 3, name: 'Server 3 • Global Cricket Broadcast', quality: '1080p HD', url: 'https://www.youtube.com/embed/ebkwnpV6aOc?autoplay=1&mute=0', type: 'iframe' }
                  ],
                  teamA: {
                    name: team1Name,
                    code: team1Short,
                    flag: getTeamFlag(team1Name, team1Short),
                    score: team1ScoreData.score || (statusGroup === 'UPCOMING' ? 'Yet to bat' : '0/0'),
                    overs: team1ScoreData.overs,
                    runs: team1ScoreData.runs,
                    wickets: team1ScoreData.wickets
                  },
                  teamB: {
                    name: team2Name,
                    code: team2Short,
                    flag: getTeamFlag(team2Name, team2Short),
                    score: team2ScoreData.score || (statusGroup === 'UPCOMING' ? 'Yet to bat' : '0/0'),
                    overs: team2ScoreData.overs,
                    runs: team2ScoreData.runs,
                    wickets: team2ScoreData.wickets
                  },
                  equation: statusText,
                  situation: `${team1Short} vs ${team2Short} (${info.matchFormat || 'T20'}) at ${venue}`,
                  winPredictor: {
                    teamACode: team1Short,
                    teamAPct: 50,
                    teamBCode: team2Short,
                    teamBPct: 50,
                    trend: statusText
                  }
                });
              }
            } catch (err) {}
          }

          if (matches.length > 0) {
            // Sort: LIVE matches first, then UPCOMING, then COMPLETED
            const order = { 'LIVE': 0, 'UPCOMING': 1, 'COMPLETED': 2 };
            matches.sort((a, b) => (order[a.status] || 99) - (order[b.status] || 99));

            liveCricketCache = {
              success: true,
              scrapedAt: new Date().toISOString(),
              matchesCount: matches.length,
              matches: matches
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
  const data = await scrapeCricbuzzLive();
  if (res.setHeader) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate');
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
