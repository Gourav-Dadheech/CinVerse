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
    '$scope',
    '$location',
    '$timeout',
    'MovieService',
    function ($scope, $location, $timeout, MovieService) {
      var vm = this;

      var debounceTimer = null;
      var DEBOUNCE_DELAY = 350; // ms

      // ---------------- STATE ----------------
      vm.query = ($location.search().q || '');
      vm.results = [];
      vm.suggestions = [];
      vm.showSuggestions = false;
      vm.isLoadingSuggestions = false;
      vm.genres = [];
      vm.selectedGenre = '';
      vm.sortOption = 'relevance';

      vm.isLoading = false;
      vm.hasSearched = false;
      vm.errorMessage = null;

      vm.getPosterUrl = function (path) {
        return MovieService.getPosterUrl(path, 'w92');
      };

      vm.onInputFocus = function () {
        var q = (vm.query || '').trim();
        if (q.length >= 2) {
          vm.showSuggestions = true;
          if (!vm.suggestions || vm.suggestions.length === 0) {
            performSearch();
          }
        }
      };

      vm.closeSuggestions = function () {
        $timeout(function () {
          vm.showSuggestions = false;
        }, 280);
      };

      vm.selectSuggestion = function (item) {
        vm.showSuggestions = false;
        if (item && item.targetUrl) {
          var cleanPath = item.targetUrl.replace('#!', '');
          $location.url(cleanPath);
        }
      };

      vm.clearQuery = function () {
        vm.query = '';
        vm.suggestions = [];
        vm.showSuggestions = false;
        vm.results = [];
        vm.hasSearched = false;
        if (debounceTimer) {
          $timeout.cancel(debounceTimer);
        }
        $location.search('q', null).replace();
      };

      // ---------------- LOAD GENRES (for filter dropdown) ----------------
      MovieService.getGenres()
        .then(function (data) {
          vm.genres = data.genres || [];
        })
        .catch(function () {
          vm.genres = [];
        });

      // ---------------- CORE SEARCH LOGIC ----------------
      function formatItems(rawList) {
        return (rawList || []).filter(function (it) {
          return it.media_type === 'movie' || it.media_type === 'tv' || !it.media_type;
        }).map(function (it) {
          it.isTv = (it.media_type === 'tv') || (!it.title && !!it.name);
          it.displayTitle = it.title || it.name || 'Untitled';
          it.title = it.displayTitle;
          it.displayDate = it.release_date || it.first_air_date || '';
          it.release_date = it.displayDate;
          it.targetUrl = it.isTv ? ('#!/tv/' + it.id) : ('#!/movie/' + it.id);
          return it;
        });
      }

      function performSearch() {
        var trimmedQuery = (vm.query || '').trim();

        if (trimmedQuery.length === 0) {
          vm.results = [];
          vm.suggestions = [];
          vm.showSuggestions = false;
          vm.hasSearched = false;
          return;
        }

        vm.isLoading = true;
        vm.isLoadingSuggestions = true;
        vm.errorMessage = null;

        MovieService.searchMulti(trimmedQuery, 1)
          .then(function (data) {
            var items = formatItems(data.results);
            vm.results = items;
            vm.suggestions = items.slice(0, 6);
            vm.hasSearched = true;
            if ((vm.query || '').trim().length >= 2) {
              vm.showSuggestions = true;
            }
          })
          .catch(function () {
            // Fallback to plain searchMovies if multi-search fails
            return MovieService.searchMovies(trimmedQuery)
              .then(function (movieData) {
                var movieItems = formatItems(movieData.results);
                vm.results = movieItems;
                vm.suggestions = movieItems.slice(0, 6);
                vm.hasSearched = true;
              });
          })
          .catch(function (err) {
            vm.errorMessage = err.message || 'Search failed. Please try again.';
            vm.results = [];
            vm.suggestions = [];
          })
          .finally(function () {
            vm.isLoading = false;
            vm.isLoadingSuggestions = false;
          });
      }

      // Run an initial search immediately if a query arrived via URL (?q=)
      if (vm.query) {
        performSearch();
      }

      // ---------------- LIVE SEARCH (DEBOUNCED) ----------------
      // Triggered by ng-change on the search input in search.html
      vm.onQueryChange = function () {
        var q = (vm.query || '').trim();
        if (q.length < 2) {
          vm.suggestions = [];
          vm.showSuggestions = false;
        } else {
          vm.showSuggestions = true;
        }

        if (debounceTimer) {
          $timeout.cancel(debounceTimer);
        }
        debounceTimer = $timeout(performSearch, DEBOUNCE_DELAY);

        // Keep the URL in sync so searches are shareable/bookmarkable
        $location.search('q', vm.query || null).replace();
      };

      // Listen for query changes arriving via URL (e.g. from navbar search) without full route reload
      $scope.$on('$routeUpdate', function () {
        var urlQ = ($location.search().q || '').trim();
        if (urlQ !== (vm.query || '').trim()) {
          vm.query = urlQ;
          performSearch();
        }
      });

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
