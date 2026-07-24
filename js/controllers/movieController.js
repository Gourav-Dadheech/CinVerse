/* ============================================================
   CineVerse - movieController.js
   ------------------------------------------------------------
   Powers the Movie Details page:
     - Backdrop + poster + core info (title, overview, genres,
       runtime, release date, rating)
     - Cast list
     - Trailer (YouTube embed via TMDB videos endpoint)
     - Similar movies + Recommendations sliders
     - Favorite / Watchlist toggle buttons
   ============================================================ */

(function () {
  'use strict';

  angular.module('cineVerseApp').controller('MovieController', [
    '$routeParams',
    '$sce',
    'MovieService',
    'StorageService',
    function ($routeParams, $sce, MovieService, StorageService) {
      var vm = this;

      var movieId = parseInt($routeParams.movieId, 10);

      // ---------------- STATE ----------------
      vm.movie = null;
      vm.cast = [];
      vm.trailerUrl = null;
      vm.similarMovies = [];
      vm.recommendedMovies = [];

      vm.isLoading = true;
      vm.errorMessage = null;
      vm.notFound = false;

      vm.isFavorite = false;
      vm.isWatchlisted = false;

      // ---------------- HELPERS ----------------
      vm.getPosterUrl = function (path, size) {
        return MovieService.getPosterUrl(path, size);
      };

      vm.getBackdropUrl = function (path) {
        return MovieService.getBackdropUrl(path);
      };

      // Convert minutes (e.g. 142) into "2h 22m" format
      vm.formatRuntime = function (minutes) {
        if (!minutes && minutes !== 0) {
          return 'N/A';
        }
        var hours = Math.floor(minutes / 60);
        var mins = minutes % 60;
        return hours + 'h ' + mins + 'm';
      };

      // ---------------- FAVORITES / WATCHLIST ----------------
      vm.toggleFavorite = function () {
        StorageService.toggleFavorite(vm.movie);
        vm.isFavorite = StorageService.isFavorite(vm.movie.id);
      };

      vm.toggleWatchlist = function () {
        StorageService.toggleWatchlist(vm.movie);
        vm.isWatchlisted = StorageService.isInWatchlist(vm.movie.id);
      };

      // ---------------- DATA LOADING ----------------

      // 1. Core movie details
      MovieService.getMovieDetails(movieId)
        .then(function (data) {
          vm.movie = data;
          vm.isFavorite = StorageService.isFavorite(movieId);
          vm.isWatchlisted = StorageService.isInWatchlist(movieId);
        })
        .catch(function (err) {
          if (err.status === 404) {
            vm.notFound = true;
          } else {
            vm.errorMessage = err.message;
          }
        })
        .finally(function () {
          vm.isLoading = false;
        });

      // 2. Cast (top 10 billed only, to keep the row compact)
      MovieService.getCredits(movieId)
        .then(function (data) {
          vm.cast = (data.cast || []).slice(0, 10);
        })
        .catch(function () {
          vm.cast = [];
        });

      // 3. Trailer - find the first official YouTube trailer
      MovieService.getVideos(movieId)
        .then(function (data) {
          var videos = data.results || [];
          var trailer = videos.find(function (v) {
            return v.site === 'YouTube' && v.type === 'Trailer';
          });
          if (trailer) {
            vm.trailerUrl = $sce.trustAsResourceUrl(
              'https://www.youtube.com/embed/' + trailer.key
            );
          }
        })
        .catch(function () {
          vm.trailerUrl = null;
        });

      // 4. Similar movies
      MovieService.getSimilar(movieId)
        .then(function (data) {
          vm.similarMovies = data.results || [];
        })
        .catch(function () {
          vm.similarMovies = [];
        });

      // 5. Recommendations
      MovieService.getRecommendations(movieId)
        .then(function (data) {
          vm.recommendedMovies = data.results || [];
        })
        .catch(function () {
          vm.recommendedMovies = [];
        });
    }
  ]);

})();
