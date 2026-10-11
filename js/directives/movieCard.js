/* ============================================================
   CineVerse - movieCard.js
   ------------------------------------------------------------
   Reusable <movie-card> directive.
   Renders a poster, title, rating and genre badge, plus quick
   favorite/watchlist action buttons with heart/bookmark
   animations. Used across Home, Search, Favorites and
   Watchlist views to avoid duplicating markup/logic.

   Usage:
   <movie-card movie="movieObject"></movie-card>
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

          // Direct play button handler (navigates to movie with ?play=true)
          scope.playMovie = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            if (scope.movie && scope.movie.id) {
              $location.path('/movie/' + scope.movie.id).search({ play: 'true' });
            }
          };

          // Poster image (falls back to placeholder inside the service)
          scope.posterUrl = MovieService.getPosterUrl(scope.movie.poster_path);

          // Extract just the year for a cleaner card display
          scope.releaseYear = scope.movie.release_date
            ? scope.movie.release_date.substring(0, 4)
            : 'TBA';

          // Rating rounded to 1 decimal place
          scope.ratingDisplay = scope.movie.vote_average
            ? scope.movie.vote_average.toFixed(1)
            : 'N/A';

          // Track favorite / watchlist state for icon styling
          scope.isFavorite = StorageService.isFavorite(scope.movie.id);
          scope.isWatchlisted = StorageService.isInWatchlist(scope.movie.id);

          // Used to trigger a short pulse animation on click
          scope.heartPulse = false;
          scope.bookmarkPulse = false;

          /* -------------------------------------------------
             Toggle favorite status + trigger heart animation
             ------------------------------------------------- */
          scope.toggleFavorite = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();

            StorageService.toggleFavorite(scope.movie);
            scope.isFavorite = StorageService.isFavorite(scope.movie.id);

            scope.heartPulse = true;
            setTimeout(function () {
              scope.$applyAsync(function () {
                scope.heartPulse = false;
              });
            }, 400);
          };

          /* -------------------------------------------------
             Toggle watchlist status + trigger bookmark animation
             ------------------------------------------------- */
          scope.toggleWatchlist = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();

            StorageService.toggleWatchlist(scope.movie);
            scope.isWatchlisted = StorageService.isInWatchlist(scope.movie.id);

            scope.bookmarkPulse = true;
            setTimeout(function () {
              scope.$applyAsync(function () {
                scope.bookmarkPulse = false;
              });
            }, 400);
          };
        }
      };
    }
  ]);

})();
