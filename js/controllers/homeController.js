/* ============================================================
   CineVerse - homeController.js
   ------------------------------------------------------------
   Powers the Home page:
     - Hero Billboard Carousel (auto-rotating across Hollywood,
       Bollywood, Tollywood, and Latest Releases)
     - Trending, Popular, Top Rated, Upcoming sliders
     - Genre category badges
   ============================================================ */

(function () {
  'use strict';

  angular.module('cineVerseApp').controller('HomeController', [
    '$interval',
    '$scope',
    '$location',
    'MovieService',
    'StorageService',
    function ($interval, $scope, $location, MovieService, StorageService) {
      var vm = this;

      // ---------------- WATCH HISTORY / CONTINUE WATCHING ----------------
      vm.watchHistory = StorageService.getWatchHistory();

      vm.resumeMovie = function (item) {
        if (!item || !item.id) return;
        $location.path('/movie/' + item.id).search({
          play: 'true',
          server: item.serverId || 1,
          track: item.trackId || 'en'
        });
      };

      vm.removeFromHistory = function (e, movieId) {
        if (e) {
          e.stopPropagation();
          e.preventDefault();
        }
        vm.watchHistory = StorageService.removeFromHistory(movieId);
      };

      vm.clearHistory = function () {
        vm.watchHistory = StorageService.clearHistory();
      };

      // ---------------- STATE ----------------
      vm.heroMovies = [];
      vm.currentHeroIndex = 0;
      vm.currentHero = null;

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

      var heroTimer = null;

      // ---------------- HELPERS ----------------
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

      // ---------------- HERO SLIDER CAROUSEL LOGIC ----------------

      function updateCurrentHero() {
        if (vm.heroMovies && vm.heroMovies.length > 0) {
          vm.currentHero = vm.heroMovies[vm.currentHeroIndex];
        }
      }

      function startHeroTimer() {
        stopHeroTimer();
        heroTimer = $interval(function () {
          if (vm.heroMovies && vm.heroMovies.length > 1) {
            vm.currentHeroIndex = (vm.currentHeroIndex + 1) % vm.heroMovies.length;
            updateCurrentHero();
          }
        }, 5500);
      }

      function stopHeroTimer() {
        if (heroTimer) {
          $interval.cancel(heroTimer);
          heroTimer = null;
        }
      }

      function resetHeroTimer() {
        startHeroTimer();
      }

      vm.nextHero = function () {
        if (!vm.heroMovies || vm.heroMovies.length <= 1) return;
        vm.currentHeroIndex = (vm.currentHeroIndex + 1) % vm.heroMovies.length;
        updateCurrentHero();
        resetHeroTimer();
      };

      vm.prevHero = function () {
        if (!vm.heroMovies || vm.heroMovies.length <= 1) return;
        vm.currentHeroIndex = (vm.currentHeroIndex - 1 + vm.heroMovies.length) % vm.heroMovies.length;
        updateCurrentHero();
        resetHeroTimer();
      };

      vm.setHeroIndex = function (index) {
        if (index >= 0 && index < vm.heroMovies.length) {
          vm.currentHeroIndex = index;
          updateCurrentHero();
          resetHeroTimer();
        }
      };

      // Assembles a diverse hero carousel from Hollywood, Bollywood/Tollywood & Trending
      function buildHeroCarousel() {
        var carousel = [];

        // 1. Top Hollywood / Global Trending titles
        if (vm.trending && vm.trending.length > 0) {
          var t1 = angular.copy(vm.trending[0]);
          t1.tag = "🔥 Global Blockbuster";
          carousel.push(t1);

          if (vm.trending.length > 1) {
            var t2 = angular.copy(vm.trending[1]);
            t2.tag = "⚡ Trending This Week";
            carousel.push(t2);
          }
        }

        // 2. Top Indian Cinema (Bollywood / Tollywood) hits
        if (vm.indianMovies && vm.indianMovies.length > 0) {
          var in1 = angular.copy(vm.indianMovies[0]);
          in1.tag = "🇮🇳 Bollywood / Tollywood Hit";
          in1.isIndian = true;
          carousel.push(in1);

          if (vm.indianMovies.length > 1) {
            var in2 = angular.copy(vm.indianMovies[1]);
            in2.tag = "🎬 Indian Cinema Spotlight";
            in2.isIndian = true;
            carousel.push(in2);
          }
        }

        // 3. Popular hit
        if (vm.popular && vm.popular.length > 0) {
          var p1 = angular.copy(vm.popular[0]);
          if (!carousel.some(function (m) { return m.id === p1.id; })) {
            p1.tag = "👑 Worldwide Favorite";
            carousel.push(p1);
          }
        }

        // 4. Latest upcoming release
        if (vm.upcoming && vm.upcoming.length > 0) {
          var u1 = angular.copy(vm.upcoming[0]);
          if (!carousel.some(function (m) { return m.id === u1.id; })) {
            u1.tag = "✨ Latest Release";
            carousel.push(u1);
          }
        }

        vm.heroMovies = carousel;
        if (vm.heroMovies.length > 0) {
          vm.currentHeroIndex = 0;
          updateCurrentHero();
          startHeroTimer();
        }
        vm.isLoadingHero = false;
      }

      $scope.$on('$destroy', function () {
        stopHeroTimer();
      });

      // ---------------- DATA LOADING ----------------

      // 1. Trending movies
      MovieService.getTrending()
        .then(function (data) {
          vm.trending = data.results || [];
          buildHeroCarousel();
        })
        .catch(function (err) {
          vm.errorMessage = err.message;
        })
        .finally(function () {
          vm.isLoadingTrending = false;
        });

      // 2. Popular movies
      MovieService.getPopular()
        .then(function (data) {
          vm.popular = data.results || [];
          buildHeroCarousel();
        })
        .catch(function (err) {
          vm.errorMessage = err.message;
        })
        .finally(function () {
          vm.isLoadingPopular = false;
        });

      // 3. Top rated movies
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

      // 4. Upcoming movies
      MovieService.getUpcoming()
        .then(function (data) {
          vm.upcoming = data.results || [];
          buildHeroCarousel();
        })
        .catch(function (err) {
          vm.errorMessage = err.message;
        })
        .finally(function () {
          vm.isLoadingUpcoming = false;
        });

      // 5. Popular Indian movies (Bollywood + Tollywood)
      MovieService.getIndianMovies()
        .then(function (data) {
          vm.indianMovies = data.results || [];
          buildHeroCarousel();
        })
        .catch(function (err) {
          vm.errorMessage = err.message;
        })
        .finally(function () {
          vm.isLoadingIndian = false;
        });

      // 6. Genre badges
      MovieService.getGenres()
        .then(function (data) {
          vm.genres = data.genres || [];
        })
        .catch(function () {
          vm.genres = [];
        });

    }
  ]);
})();
