/* ============================================================
   CineVerse - storageService.js
   ------------------------------------------------------------
   Wraps window.localStorage so Favorites & Watchlist data is
   persisted across page reloads. Nothing outside this service
   should touch localStorage directly.
   ============================================================ */

(function () {
  'use strict';

  angular.module('cineVerseApp').factory('StorageService', [
    function () {

      var FAVORITES_KEY = 'cineverse_favorites';
      var WATCHLIST_KEY = 'cineverse_watchlist';

      var service = {};

      /* ----------------------------------------------------------
         PRIVATE HELPERS
         ---------------------------------------------------------- */
      function readList(key) {
        try {
          var raw = window.localStorage.getItem(key);
          return raw ? JSON.parse(raw) : [];
        } catch (e) {
          // Corrupt data or storage unavailable - fail safe with empty list
          return [];
        }
      }

      function writeList(key, list) {
        try {
          window.localStorage.setItem(key, JSON.stringify(list));
          return true;
        } catch (e) {
          // Storage full or blocked (private browsing mode etc.)
          return false;
        }
      }

      function addToList(key, movie) {
        var list = readList(key);
        var exists = list.some(function (item) {
          return item.id === movie.id;
        });
        if (!exists) {
          list.push({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            vote_average: movie.vote_average,
            release_date: movie.release_date
          });
          writeList(key, list);
        }
        return list;
      }

      function removeFromList(key, movieId) {
        var list = readList(key).filter(function (item) {
          return item.id !== movieId;
        });
        writeList(key, list);
        return list;
      }

      function isInList(key, movieId) {
        return readList(key).some(function (item) {
          return item.id === movieId;
        });
      }

      /* ----------------------------------------------------------
         PUBLIC API - FAVORITES
         ---------------------------------------------------------- */
      service.getFavorites = function () {
        return readList(FAVORITES_KEY);
      };

      service.addFavorite = function (movie) {
        return addToList(FAVORITES_KEY, movie);
      };

      service.removeFavorite = function (movieId) {
        return removeFromList(FAVORITES_KEY, movieId);
      };

      service.isFavorite = function (movieId) {
        return isInList(FAVORITES_KEY, movieId);
      };

      service.toggleFavorite = function (movie) {
        if (isInList(FAVORITES_KEY, movie.id)) {
          return removeFromList(FAVORITES_KEY, movie.id);
        }
        return addToList(FAVORITES_KEY, movie);
      };

      /* ----------------------------------------------------------
         PUBLIC API - WATCHLIST
         ---------------------------------------------------------- */
      service.getWatchlist = function () {
        return readList(WATCHLIST_KEY);
      };

      service.addToWatchlist = function (movie) {
        return addToList(WATCHLIST_KEY, movie);
      };

      service.removeFromWatchlist = function (movieId) {
        return removeFromList(WATCHLIST_KEY, movieId);
      };

      service.isInWatchlist = function (movieId) {
        return isInList(WATCHLIST_KEY, movieId);
      };

      service.toggleWatchlist = function (movie) {
        if (isInList(WATCHLIST_KEY, movie.id)) {
          return removeFromList(WATCHLIST_KEY, movie.id);
        }
        return addToList(WATCHLIST_KEY, movie);
      };

      return service;
    }
  ]);

})();
