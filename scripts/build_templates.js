const fs = require('fs');

const templates = {
  'views/home.html': fs.readFileSync('views/home.html', 'utf8'),
  'views/search.html': fs.readFileSync('views/search.html', 'utf8'),
  'views/movie-match.html': fs.readFileSync('views/movie-match.html', 'utf8'),
  'views/movie.html': fs.readFileSync('views/movie.html', 'utf8'),
  'views/favorites.html': fs.readFileSync('views/favorites.html', 'utf8'),
  'views/watchlist.html': fs.readFileSync('views/watchlist.html', 'utf8'),
  'views/catalog.html': fs.readFileSync('views/catalog.html', 'utf8'),
  'views/tv.html': fs.readFileSync('views/tv.html', 'utf8'),
  'views/music.html': fs.readFileSync('views/music.html', 'utf8'),
  'views/sports.html': fs.readFileSync('views/sports.html', 'utf8'),
  'views/partials/movie-card.html': fs.readFileSync('views/partials/movie-card.html', 'utf8')
};

let code = '/* Pre-cached AngularJS Templates for 100% offline & fast routing */\n';
code += '(function() {\n  "use strict";\n  angular.module("cinVerseApp").run(["$templateCache", function($templateCache) {\n';

for (const [k, v] of Object.entries(templates)) {
  code += '    $templateCache.put(' + JSON.stringify(k) + ', ' + JSON.stringify(v) + ');\n';
}

code += '  }]);\n})();\n';

fs.writeFileSync('js/templates.js', code, 'utf8');
console.log('js/templates.js successfully updated! Total length:', code.length);
