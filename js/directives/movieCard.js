/* ============================================================
   CineVerse - movieCard.js
   ------------------------------------------------------------
   Reusable <movie-card> directive.
   Renders a poster, title, rating, and SERIES badge if it's
   a TV show/anime/k-drama. Dynamically links to #!/tv/:id or
   #!/movie/:id.
   ============================================================ */

(function () {
  'use strict';

  angular.module('cineVerseApp').directive('movieCard', [
    '$location',
    'MovieService',
    'StorageService',
    function ($location, MovieService, StorageService) {

      return {
        restrict: 'E',
        scope: {
          movie: '='
        },
        templateUrl: 'views/partials/movie-card.html',
        link: function (scope) {

          function updateCard(item) {
            if (!item) return;
            scope.isTv = (item.media_type === 'tv') || (!item.title && !!item.name) || !!item.isTv;
            scope.itemTitle = item.title || item.name || 'Untitled';
            scope.cardUrl = scope.isTv ? ('#!/tv/' + item.id) : ('#!/movie/' + item.id);
            scope.posterUrl = MovieService.getPosterUrl(item.poster_path);

            var dateStr = item.release_date || item.first_air_date || '';
            scope.releaseYear = dateStr ? dateStr.substring(0, 4) : 'TBA';

            scope.ratingDisplay = item.vote_average
              ? item.vote_average.toFixed(1)
              : 'N/A';

            scope.isFavorite = StorageService.isFavorite(item.id);
            scope.isWatchlisted = StorageService.isInWatchlist(item.id);
          }

          scope.$watch('movie', function (newVal) {
            if (newVal) {
              updateCard(newVal);
            }
          });

          // Direct play button handler (navigates with ?play=true)
          scope.playMovie = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            if (scope.movie && scope.movie.id) {
              var targetPath = scope.isTv ? ('/tv/' + scope.movie.id) : ('/movie/' + scope.movie.id);
              $location.path(targetPath).search({ play: 'true' });
            }
          };

          scope.heartPulse = false;
          scope.bookmarkPulse = false;

          scope.toggleFavorite = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            if (!scope.movie) return;

            StorageService.toggleFavorite(scope.movie);
            scope.isFavorite = StorageService.isFavorite(scope.movie.id);

            scope.heartPulse = true;
            setTimeout(function () {
              scope.$applyAsync(function () {
                scope.heartPulse = false;
              });
            }, 400);
          };

          scope.toggleWatchlist = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            if (!scope.movie) return;

            StorageService.toggleWatchlist(scope.movie);
            scope.isWatchlisted = StorageService.isInWatchlist(scope.movie.id);

            scope.bookmarkPulse = true;
            setTimeout(function () {
              scope.$applyAsync(function () {
                scope.bookmarkPulse = false;
              });
            }, 400);
          };

          if (scope.movie) {
            updateCard(scope.movie);
          }
        }
      };
    }
  ]);

})();
