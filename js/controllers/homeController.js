/* ============================================================
   CinVerse - homeController.js
   ------------------------------------------------------------
   Powers the Home page:
     - Hero Billboard Carousel (auto-rotating across Hollywood,
       Bollywood, Tollywood, and Latest Releases)
     - Trending, Popular, Top Rated, Upcoming sliders
     - Genre category badges
   ============================================================ */

(function () {
  'use strict';

  angular.module('cinVerseApp').controller('HomeController', [
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
        if (item.isTv || item.media_type === 'tv') {
          $location.path('/tv/' + item.id).search({
            play: 'true',
            season: item.season || 1,
            episode: item.episode || 1,
            server: item.serverId || 1,
            track: item.trackId || 'en'
          });
        } else {
          $location.path('/movie/' + item.id).search({
            play: 'true',
            server: item.serverId || 1,
            track: item.trackId || 'en'
          });
        }
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

      vm.addToWatchlist = function (movie) {
        if (!movie) return;
        StorageService.toggleWatchlist(movie);
      };

      // ---------------- STATE ----------------
      vm.heroMovies = [];
      vm.currentHeroIndex = 0;
      vm.currentHero = null;

      vm.trending = [];
      vm.top10 = [];
      vm.popular = [];
      vm.topRated = [];
      vm.upcoming = [];
      vm.indianMovies = [];
      vm.genres = [];

      // ---------------- STREAMING SERVICES (OTT PLATFORMS) ----------------
      vm.streamingServices = [
        {
          id: 'netflix',
          name: 'Netflix',
          color: '#E50914',
          glow: 'rgba(229, 9, 20, 0.4)',
          bgGradient: 'linear-gradient(135deg, rgba(229,9,20,0.15) 0%, rgba(10,12,18,0.9) 100%)',
          icon: 'fa-solid fa-play',
          tag: 'Originals & Worldwide Hits',
          providerId: '8',
          badge: 'NETFLIX'
        },
        {
          id: 'prime',
          name: 'Prime Video',
          color: '#00A8E1',
          glow: 'rgba(0, 168, 225, 0.4)',
          bgGradient: 'linear-gradient(135deg, rgba(0,168,225,0.15) 0%, rgba(10,12,18,0.9) 100%)',
          icon: 'fa-brands fa-amazon',
          tag: 'Blockbusters & Originals',
          providerId: '119',
          badge: 'PRIME'
        },
        {
          id: 'disney_hotstar',
          name: 'Disney+ Hotstar',
          color: '#38bdf8',
          glow: 'rgba(56, 189, 248, 0.4)',
          bgGradient: 'linear-gradient(135deg, rgba(17,60,207,0.2) 0%, rgba(10,12,18,0.9) 100%)',
          icon: 'fa-solid fa-star',
          tag: 'Marvel, Disney & India',
          providerId: '122',
          badge: 'DISNEY+ HOTSTAR'
        },
        {
          id: 'jiocinema',
          name: 'JioCinema',
          color: '#ec4899',
          glow: 'rgba(236, 72, 153, 0.4)',
          bgGradient: 'linear-gradient(135deg, rgba(225,29,72,0.2) 0%, rgba(10,12,18,0.9) 100%)',
          icon: 'fa-solid fa-tv',
          tag: 'Bollywood & Hindi Cinema',
          providerId: '220',
          badge: 'JIO CINEMA'
        },
        {
          id: 'hbomax',
          name: 'HBO Max',
          color: '#a855f7',
          glow: 'rgba(168, 85, 247, 0.4)',
          bgGradient: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(10,12,18,0.9) 100%)',
          icon: 'fa-solid fa-crown',
          tag: 'Iconic Masterpieces',
          providerId: '384',
          badge: 'MAX'
        },
        {
          id: 'appletv',
          name: 'Apple TV+',
          color: '#e2e8f0',
          glow: 'rgba(226, 232, 240, 0.3)',
          bgGradient: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(10,12,18,0.9) 100%)',
          icon: 'fa-brands fa-apple',
          tag: 'Critically Acclaimed',
          providerId: '350',
          badge: 'APPLE TV+'
        }
      ];

      vm.selectedOtt = vm.streamingServices[0];
      vm.ottFilter = 'all'; // 'all', 'movie', 'tv'
      vm.ottItems = [];
      vm.allOttMovies = [];
      vm.allOttSeries = [];
      vm.isLoadingOtt = false;

      vm.setOttFilter = function (filterType) {
        vm.ottFilter = filterType;
        if (filterType === 'movie') {
          vm.ottItems = vm.allOttMovies;
        } else if (filterType === 'tv') {
          vm.ottItems = vm.allOttSeries;
        } else {
          // 'all': interleave movies and series for a rich FLIQ TV experience
          var combined = [];
          var maxLen = Math.max(vm.allOttMovies.length, vm.allOttSeries.length);
          for (var i = 0; i < maxLen; i++) {
            if (vm.allOttMovies[i]) combined.push(vm.allOttMovies[i]);
            if (vm.allOttSeries[i]) combined.push(vm.allOttSeries[i]);
          }
          vm.ottItems = combined.slice(0, 16);
        }
      };

      vm.selectStreamingService = function (service) {
        if (!service) return;
        vm.selectedOtt = service;
        vm.isLoadingOtt = true;

        var movieReq = MovieService.getByWatchProvider(service.providerId, 'IN')
          .then(function (data) {
            var res = (data.results || []).slice(0, 12);
            res.forEach(function (m) { m.isTv = false; });
            vm.allOttMovies = res;
          })
          .catch(function () {
            vm.allOttMovies = (vm.popular || []).slice(0, 8);
          });

        var tvReq = MovieService.getByWatchProviderTv(service.providerId, 'IN')
          .then(function (data) {
            var res = (data.results || []).slice(0, 12);
            res.forEach(function (s) { s.isTv = true; });
            vm.allOttSeries = res;
          })
          .catch(function () {
            vm.allOttSeries = [];
          });

        Promise.all([movieReq, tvReq]).finally(function () {
          vm.setOttFilter(vm.ottFilter || 'all');
          vm.isLoadingOtt = false;
          $scope.$applyAsync();
        });
      };

      vm.onOttCardClick = function (service) {
        if (!service) return;
        if (vm.selectedOtt && vm.selectedOtt.id === service.id) {
          $location.path('/ott/' + service.id);
          return;
        }
        vm.selectStreamingService(service);
      };

      vm.openOttCatalog = function (serviceId) {
        $location.path('/ott/' + (serviceId || (vm.selectedOtt ? vm.selectedOtt.id : 'netflix')));
      };


      // ---------------- STUDIOS & FRANCHISES ----------------
      vm.franchises = [
        {
          id: 'marvel',
          name: 'MARVEL',
          subtitle: 'Marvel Cinematic Universe',
          tagline: 'Iron Man, Avengers, Spider-Man & Multiverse',
          color: '#E50914',
          glow: 'rgba(229, 9, 20, 0.45)',
          bgGradient: 'radial-gradient(circle at top, rgba(229,9,20,0.3) 0%, rgba(12,14,20,0.95) 80%)',
          icon: 'fa-solid fa-shield-halved',
          logoText: 'MARVEL',
          logoSub: 'STUDIOS'
        },
        {
          id: 'dc',
          name: 'DC STUDIOS',
          subtitle: 'Worlds of DC',
          tagline: 'The Batman, Dark Knight, Superman & Joker',
          color: '#3b82f6',
          glow: 'rgba(59, 130, 246, 0.45)',
          bgGradient: 'radial-gradient(circle at top, rgba(30,64,175,0.35) 0%, rgba(12,14,20,0.95) 80%)',
          icon: 'fa-solid fa-mask',
          logoText: 'DC',
          logoSub: 'STUDIOS'
        },
        {
          id: 'starwars',
          name: 'STAR WARS',
          subtitle: 'A Galaxy Far, Far Away',
          tagline: 'Skywalker Saga, Mandalorian & Jedi Legends',
          color: '#facc15',
          glow: 'rgba(250, 204, 21, 0.4)',
          bgGradient: 'radial-gradient(circle at top, rgba(202,138,4,0.3) 0%, rgba(12,14,20,0.95) 80%)',
          icon: 'fa-solid fa-jedi',
          logoText: 'STAR WARS',
          logoSub: 'LUCASFILM'
        },
        {
          id: 'pixar',
          name: 'DISNEY • PIXAR',
          subtitle: 'Heartwarming Animation',
          tagline: 'Toy Story, Inside Out, Coco & Classic Hits',
          color: '#2dd4bf',
          glow: 'rgba(45, 212, 191, 0.4)',
          bgGradient: 'radial-gradient(circle at top, rgba(13,148,136,0.3) 0%, rgba(12,14,20,0.95) 80%)',
          icon: 'fa-solid fa-wand-magic-sparkles',
          logoText: 'DISNEY • PIXAR',
          logoSub: 'ANIMATION'
        }
      ];

      vm.selectedFranchise = null;
      vm.franchiseMovies = [];
      vm.isLoadingFranchise = false;

      vm.selectFranchise = function (franchise) {
        if (!franchise) return;
        vm.selectedFranchise = franchise;
        vm.isLoadingFranchise = true;
        MovieService.getFranchiseMovies(franchise.id)
          .then(function (data) {
            vm.franchiseMovies = (data.results || []).slice(0, 12);
          })
          .catch(function () {
            vm.franchiseMovies = [];
          })
          .finally(function () {
            vm.isLoadingFranchise = false;
          });
      };

      vm.onFranchiseCardClick = function (franchise) {
        if (!franchise) return;
        $location.path('/franchise/' + franchise.id);
      };

      vm.openFranchiseHub = function (franchiseId) {
        $location.path('/franchise/' + (franchiseId || (vm.selectedFranchise ? vm.selectedFranchise.id : 'marvel')));
      };

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
          vm.top10 = vm.trending.slice(0, 10);
          buildHeroCarousel();
        })
        .catch(function (err) {
          vm.errorMessage = err.message;
        })
        .finally(function () {
          vm.isLoadingTrending = false;
        });

      // Pre-load initial OTT and Franchise rows
      vm.selectStreamingService(vm.selectedOtt);
      vm.selectFranchise(vm.selectedFranchise);

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
