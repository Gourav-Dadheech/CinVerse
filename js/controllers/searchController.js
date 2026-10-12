/* ============================================================
   CinVerse - searchController.js
   ------------------------------------------------------------
   Powers the Search page:
     - Live search-as-you-type (debounced)
     - Genre filter + sort filter
     - Movie results grid
     - "No Results" state
   ============================================================ */

(function () {
  'use strict';

  angular.module('cinVerseApp').controller('SearchController', [
    '$location',
    '$timeout',
    'MovieService',
    function ($location, $timeout, MovieService) {
      var vm = this;

      var debounceTimer = null;
      var DEBOUNCE_DELAY = 450; // ms

      // ---------------- STATE ----------------
      vm.query = ($location.search().q || '');
      vm.results = [];
      vm.genres = [];
      vm.selectedGenre = '';
      vm.sortOption = 'relevance';

      vm.isLoading = false;
      vm.hasSearched = false;
      vm.errorMessage = null;

      // ---------------- LOAD GENRES (for filter dropdown) ----------------
      MovieService.getGenres()
        .then(function (data) {
          vm.genres = data.genres || [];
        })
        .catch(function () {
          vm.genres = [];
        });

      // ---------------- CORE SEARCH LOGIC ----------------
      function performSearch() {
        var trimmedQuery = (vm.query || '').trim();

        if (trimmedQuery.length === 0) {
          vm.results = [];
          vm.hasSearched = false;
          return;
        }

        vm.isLoading = true;
        vm.errorMessage = null;

        MovieService.searchMovies(trimmedQuery)
          .then(function (data) {
            vm.results = data.results || [];
            vm.hasSearched = true;
          })
          .catch(function (err) {
            vm.errorMessage = err.message;
            vm.results = [];
          })
          .finally(function () {
            vm.isLoading = false;
          });
      }

      // Run an initial search immediately if a query arrived via URL (?q=)
      if (vm.query) {
        performSearch();
      }

      // ---------------- LIVE SEARCH (DEBOUNCED) ----------------
      // Triggered by ng-change on the search input in search.html
      vm.onQueryChange = function () {
        if (debounceTimer) {
          $timeout.cancel(debounceTimer);
        }
        debounceTimer = $timeout(performSearch, DEBOUNCE_DELAY);

        // Keep the URL in sync so searches are shareable/bookmarkable
        $location.search('q', vm.query || null).replace();
      };

      // ---------------- FILTERS ----------------

      // Applies client-side genre filtering + sorting to the raw results
      vm.filteredResults = function () {
        var list = vm.results.slice();

        if (vm.selectedGenre) {
          var genreId = parseInt(vm.selectedGenre, 10);
          list = list.filter(function (movie) {
            return movie.genre_ids && movie.genre_ids.indexOf(genreId) !== -1;
          });
        }

        switch (vm.sortOption) {
          case 'rating':
            list.sort(function (a, b) { return b.vote_average - a.vote_average; });
            break;
          case 'newest':
            list.sort(function (a, b) {
              return new Date(b.release_date || 0) - new Date(a.release_date || 0);
            });
            break;
          case 'title':
            list.sort(function (a, b) { return a.title.localeCompare(b.title); });
            break;
          default:
            // 'relevance' -> keep TMDB's original order
            break;
        }

        return list;
      };

      // Clears all filters back to defaults
      vm.resetFilters = function () {
        vm.selectedGenre = '';
        vm.sortOption = 'relevance';
      };
    }
  ]);

})();
