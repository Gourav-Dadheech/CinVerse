/* ============================================================
   CinVerse - watchlistController.js
   ------------------------------------------------------------
   Powers the Watchlist page:
     - Lists all movies saved to the Watchlist (from localStorage)
     - Allows removing a movie from the Watchlist
   Note: kept as its own controller (separate from
   FavoriteController) since Favorites and Watchlist are
   distinct features with independent storage keys.
   ============================================================ */

(function () {
  'use strict';

  angular.module('cinVerseApp').controller('WatchlistController', [
    'StorageService',
    'MovieService',
    function (StorageService, MovieService) {
      var vm = this;

      // ---------------- STATE ----------------
      vm.watchlist = [];
      vm.isEmpty = true;

      // ---------------- LOAD WATCHLIST ----------------
      function loadWatchlist() {
        vm.watchlist = StorageService.getWatchlist();
        vm.isEmpty = vm.watchlist.length === 0;
      }

      loadWatchlist();

      // ---------------- HELPERS ----------------
      vm.getPosterUrl = function (path) {
        return MovieService.getPosterUrl(path);
      };

      vm.releaseYear = function (dateString) {
        return dateString ? dateString.substring(0, 4) : 'TBA';
      };

      // ---------------- ACTIONS ----------------

      // Remove a single movie from the watchlist and refresh
      vm.removeFromWatchlist = function (movieId) {
        StorageService.removeFromWatchlist(movieId);
        loadWatchlist();
      };

      // Clear the entire watchlist (with a simple confirm)
      vm.clearAllWatchlist = function () {
        var confirmed = window.confirm('Remove all movies from your Watchlist?');
        if (confirmed) {
          vm.watchlist.forEach(function (movie) {
            StorageService.removeFromWatchlist(movie.id);
          });
          loadWatchlist();
        }
      };
    }
  ]);

})();
