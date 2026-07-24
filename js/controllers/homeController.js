/* ============================================================
   CineVerse - homeController.js
   ------------------------------------------------------------
   Powers the Home page:
     - Hero banner (random trending movie)
     - Trending, Popular, Top Rated, Upcoming sliders
     - Genre category badges
   ============================================================ */

(function () {
  'use strict';

  angular.module('cineVerseApp').controller('HomeController', [
    'MovieService',
    function (MovieService) {
      var vm = this;

      // ---------------- STATE ----------------
      vm.heroMovie = null;
      vm.trending = [];
      vm.popular = [];
      vm.topRated = [];
      vm.upcoming = [];
      vm.indianMovies = [];
      vm.genres = [];

      vm.isLoadingHero = true;
      vm.isLoadingTrending = true;
      vm.isLoadingPopular = true;
      vm.isLoadingTopRated = true;
      vm.isLoadingUpcoming = true;
      vm.isLoadingIndian = true;

      vm.errorMessage = null;

      // ---------------- HELPERS ----------------

      // Picks a random movie from a list to feature in the hero banner
      function pickHeroMovie(list) {
        if (!list || list.length === 0) {
          return null;
        }
        var randomIndex = Math.floor(Math.random() * Math.min(list.length, 5));
        return list[randomIndex];
      }

      vm.getBackdropUrl = function (path) {
        return MovieService.getBackdropUrl(path);
      };

      vm.getPosterUrl = function (path) {
        return MovieService.getPosterUrl(path);
      };

      // Horizontal slider scroll helper (used by arrow buttons in home.html)
      vm.scrollSlider = function (sliderId, direction) {
        var track = document.getElementById(sliderId);
        if (!track) {
          return;
        }
        var scrollAmount = 320 * direction;
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      };

      // ---------------- DATA LOADING ----------------

      // Trending movies -> also feeds the hero banner
      MovieService.getTrending()
        .then(function (data) {
          vm.trending = data.results || [];
          vm.heroMovie = pickHeroMovie(vm.trending);
        })
        .catch(function (err) {
          vm.errorMessage = err.message;
        })
        .finally(function () {
          vm.isLoadingTrending = false;
          vm.isLoadingHero = false;
        });

      // Popular movies
      MovieService.getPopular()
        .then(function (data) {
          vm.popular = data.results || [];
        })
        .catch(function (err) {
          vm.errorMessage = err.message;
        })
        .finally(function () {
          vm.isLoadingPopular = false;
        });

      // Top rated movies
      MovieService.getTopRated()
        .then(function (data) {
          vm.topRated = data.results || [];
        })
        .catch(function (err) {
          vm.errorMessage = err.message;
        })
        .finally(function () {
          vm.isLoadingTopRated = false;
        });

      // Upcoming movies
      MovieService.getUpcoming()
        .then(function (data) {
          vm.upcoming = data.results || [];
        })
        .catch(function (err) {
          vm.errorMessage = err.message;
        })
        .finally(function () {
          vm.isLoadingUpcoming = false;
        });

      // Popular Indian movies (Bollywood + regional cinema) - for Indian audiences
      MovieService.getIndianMovies()
        .then(function (data) {
          vm.indianMovies = data.results || [];
        })
        .catch(function (err) {
          vm.errorMessage = err.message;
        })
        .finally(function () {
          vm.isLoadingIndian = false;
        });

      // Genre badges (used as quick-filter shortcuts to the search page)
      MovieService.getGenres()
        .then(function (data) {
          vm.genres = data.genres || [];
        })
        .catch(function () {
          // Non-critical - fail silently, badges just won't render
          vm.genres = [];
        });
    }
  ]);

})();
