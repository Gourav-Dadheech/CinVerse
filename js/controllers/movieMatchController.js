(function () {
  'use strict';

  angular.module('cineVerseApp')
    .controller('MovieMatchController', [
      '$timeout',
      '$window',
      '$animate',
      'MovieService',
      'StorageService',
      function ($timeout, $window, $animate, MovieService, StorageService) {

        var vm = this;

        // Disable ngAnimate on this wizard element so leaving questions
        // are removed immediately with zero lag or double-stacked overlap.
        $timeout(function () {
          var wizardEl = document.querySelector('.wizard-container') || document.querySelector('.movie-match-page');
          if ($animate && $animate.enabled && wizardEl) {
            $animate.enabled(angular.element(wizardEl), false);
          }
        }, 0);

        // ===========================
        // BASIC STATE
        // ===========================
        vm.step = 1;
        vm.loading = false;
        vm.results = [];

        // ===========================
        // USER ANSWERS
        // ===========================
        vm.answers = {
          mood: "",
          genre: "",
          industry: "",
          language: "",
          timeline: {},
          rating: ""
        };

        // ===========================
        // OPTIONS
        // ===========================
        vm.moods = [
          "😊 Happy",
          "😂 Funny",
          "❤️ Romantic",
          "😢 Emotional",
          "😱 Horror",
          "🔥 Action",
          "🤯 Mind-Blowing"
        ];

        vm.genres = [
          "Action",
          "Comedy",
          "RomCom ❤️😂",
          "Romance",
          "Sci-Fi",
          "Thriller",
          "Adventure",
          "Crime",
          "Drama",
          "Fantasy",
          "Animation",
          "Horror"
        ];

        vm.industries = [
          "Hollywood",
          "Bollywood",
          "Tollywood",
          "Korean",
          "Anime",
          "Any"
        ];

        vm.languages = [
          "English",
          "Hindi",
          "Tamil",
          "Telugu",
          "Malayalam",
          "Korean",
          "Japanese",
          "Any"
        ];

        vm.timelines = [
          {
            name: "🔥 Latest Releases",
            from: "2023-01-01",
            to: ""
          },
          {
            name: "🎬 New Generation",
            from: "2018-01-01",
            to: "2022-12-31"
          },
          {
            name: "📀 Modern Classics",
            from: "2010-01-01",
            to: "2017-12-31"
          },
          {
            name: "📼 2000s Hits",
            from: "2000-01-01",
            to: "2009-12-31"
          },
          {
            name: "🎞 90s Favorites",
            from: "1990-01-01",
            to: "1999-12-31"
          },
          {
            name: "🏛 Timeless Classics",
            from: "",
            to: "1989-12-31"
          },
          {
            name: "🌍 Any Era",
            from: "",
            to: ""
          }
        ];

        vm.ratings = [
          "Any",
          "6+",
          "7+",
          "8+"
        ];

        // ===========================
        // TMDB MAPPINGS
        // ===========================
        vm.genreMap = {
          "Action": 28,
          "Comedy": 35,
          "RomCom ❤️😂": "35,10749",
          "Romance": 10749,
          "Sci-Fi": 878,
          "Thriller": 53,
          "Adventure": 12,
          "Crime": 80,
          "Drama": 18,
          "Fantasy": 14,
          "Animation": 16,
          "Horror": 27
        };

        vm.languageMap = {
          "English": "en",
          "Hindi": "hi",
          "Tamil": "ta",
          "Telugu": "te",
          "Malayalam": "ml",
          "Korean": "ko",
          "Japanese": "ja",
          "Any": ""
        };

        vm.ratingMap = {
          "Any": 0,
          "6+": 6,
          "7+": 7,
          "8+": 8
        };

        // ===========================
        // HELPERS
        // ===========================
        vm.getPosterUrl = function (posterPath) {
          return MovieService.getPosterUrl(posterPath);
        };

        vm.formatRating = function (rating) {
          if (rating === undefined || rating === null || rating <= 0) {
            return "N/A";
          }
          return Number(rating).toFixed(1);
        };

        vm.formatYear = function (dateStr) {
          if (dateStr && typeof dateStr === 'string' && dateStr.length >= 4) {
            return dateStr.substring(0, 4);
          }
          return "TBA";
        };

        // Progress Calculation
        vm.getProgress = function () {
          if (vm.step > 6) return 100;
          return Math.round(((vm.step - 1) / 6) * 100);
        };

        // Validation for proceeding
        vm.canProceed = function () {
          switch (vm.step) {
            case 1:
              return !!vm.answers.mood;
            case 2:
              return !!vm.answers.genre;
            case 3:
              return !!vm.answers.industry;
            case 4:
              return !!vm.answers.language;
            case 5:
              return !!(vm.answers.timeline && vm.answers.timeline.name);
            case 6:
              return !!vm.answers.rating;
            default:
              return true;
          }
        };

        function scrollToTop() {
          $timeout(function () {
            $window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 50);
        }

        // ===========================
        // NAVIGATION
        // ===========================
        vm.next = function () {
          if (vm.step < 6 && vm.canProceed()) {
            vm.step++;
            scrollToTop();
          }
        };

        vm.back = function () {
          if (vm.step > 1) {
            vm.step--;
            scrollToTop();
          }
        };

        // Full reset
        vm.reset = function () {
          vm.step = 1;
          vm.loading = false;
          vm.results = [];
          vm.answers = {
            mood: "",
            genre: "",
            industry: "",
            language: "",
            timeline: {},
            rating: ""
          };
          scrollToTop();
        };

        // ===========================
        // FAVORITES / STORAGE INTEGRATION
        // ===========================
        vm.isFavorite = function (movieId) {
          return StorageService.isFavorite(movieId);
        };

        vm.toggleFavorite = function (movie) {
          if (!movie) return;
          StorageService.toggleFavorite(movie);
        };

        // ===========================
        // FIND MOVIES
        // ===========================
        vm.findMovies = function () {
          vm.loading = true;

          var filters = {
            genreId: vm.genreMap[vm.answers.genre],
            language: vm.languageMap[vm.answers.language],
            rating: vm.ratingMap[vm.answers.rating],
            releaseFrom: vm.answers.timeline ? vm.answers.timeline.from : "",
            releaseTo: vm.answers.timeline ? vm.answers.timeline.to : "",
            industry: vm.answers.industry,
            mood: vm.answers.mood
          };

          // Fetch TMDB concurrently with the smooth animation
          var fetchPromise = MovieService.discoverMovies(filters);
          var animationPromise = $timeout(function () {}, 1800);

          fetchPromise
            .then(function (response) {
              return animationPromise.then(function () {
                vm.results = (response && response.results) ? response.results : [];
                vm.loading = false;
                vm.step = 7;
                scrollToTop();
              });
            })
            .catch(function (error) {
              console.error("MovieMatch Error:", error);
              return animationPromise.then(function () {
                vm.results = [];
                vm.loading = false;
                vm.step = 7;
                scrollToTop();
              });
            });
        };

      }
    ]);
})();