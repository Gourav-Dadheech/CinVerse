/* ============================================================
   CineVerse - favoriteController.js
   ------------------------------------------------------------
   Powers the Favorites page:
     - Lists all movies saved to Favorites (from localStorage)
     - Allows removing a movie from Favorites
   ============================================================ */

(function () {
  'use strict';

  angular.module('cineVerseApp').controller('FavoriteController', [
    'StorageService',
    'MovieService',
    function (StorageService, MovieService) {
      var vm = this;

      // ---------------- STATE ----------------
      vm.favorites = [];
      vm.isEmpty = true;

      // ---------------- LOAD FAVORITES ----------------
      function loadFavorites() {
        vm.favorites = StorageService.getFavorites();
        vm.isEmpty = vm.favorites.length === 0;
      }

      loadFavorites();

      // ---------------- HELPERS ----------------
      vm.getPosterUrl = function (path) {
        return MovieService.getPosterUrl(path);
      };

      vm.releaseYear = function (dateString) {
        return dateString ? dateString.substring(0, 4) : 'TBA';
      };

      // ---------------- ACTIONS ----------------

      // Remove a single movie from favorites and refresh the list
      vm.removeFavorite = function (movieId) {
        StorageService.removeFavorite(movieId);
        loadFavorites();
      };

      // Clear the entire favorites list (with a simple confirm)
      vm.clearAllFavorites = function () {
        var confirmed = window.confirm('Remove all movies from your Favorites?');
        if (confirmed) {
          vm.favorites.forEach(function (movie) {
            StorageService.removeFavorite(movie.id);
          });
          loadFavorites();
        }
      };
    }
  ]);

})();
