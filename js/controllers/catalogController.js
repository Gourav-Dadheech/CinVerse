/* ============================================================
   CinVerse - catalogController.js
   ------------------------------------------------------------
   Powers:
     - /franchise/:franchiseId (Marvel, DC, Star Wars, Pixar)
     - /ott/:ottId (Netflix, Prime, Disney+, JioCinema, HBO Max, Apple TV+)
     - /shows (Web Series & TV Shows)
     - /anime (Anime Universe)
     - /kdrama (K-Drama Universe)
   Provides full multi-category filtering (All, Movies, Series,
   Cartoons & Animation, Timeline Order), pagination, and
   seamless card navigation to /movie/:id and /tv/:id.
   ============================================================ */

(function () {
  'use strict';

  angular.module('cinVerseApp').controller('CatalogController', [
    '$scope',
    '$routeParams',
    '$location',
    'MovieService',
    function ($scope, $routeParams, $location, MovieService) {
      var vm = this;

      var currentPath = $location.path();
      var ottId = ($routeParams.ottId || '').toLowerCase();
      var franchiseId = ($routeParams.franchiseId || '').toLowerCase();

      vm.isLoading = true;
      vm.isLoadingMore = false;
      vm.hasMore = true;
      vm.currentPage = 1;

      vm.allItems = [];
      vm.movieItems = [];
      vm.tvItems = [];
      vm.animationItems = [];
      vm.timelineItems = [];
      vm.filteredItems = [];

      vm.activeTab = 'all';
      vm.filterTabs = [
        { id: 'all', name: 'All Originals' },
        { id: 'movie', name: 'Movies', icon: 'fa-film' },
        { id: 'tv', name: 'Series', icon: 'fa-tv' }
      ];

      // Metadata definitions for Streaming Services (OTT)
      var OTT_METAS = {
        netflix: {
          title: 'NETFLIX',
          logo: 'assets/logos/netflix.svg',
          description: 'Stream Netflix original films, hit series, and global releases.',
          badge: 'Official Originals Catalog',
          providerId: '8',
          bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(229, 9, 20, 0.35) 0%, #07090E 80%)'
        },
        prime: {
          title: 'PRIME VIDEO',
          logo: 'assets/logos/prime.svg',
          description: 'Explore Amazon Originals, award-winning dramas, and blockbuster cinema.',
          badge: 'Amazon Studios Originals',
          providerId: '119',
          bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0, 168, 225, 0.35) 0%, #07090E 80%)'
        },
        disney_hotstar: {
          title: 'DISNEY+ HOTSTAR',
          logo: 'assets/logos/disney.svg',
          description: 'Stream Marvel Studios, Star Wars originals, Disney classics and Indian blockbusters.',
          badge: 'Hotstar & Disney Vault',
          providerId: '122',
          bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(56, 189, 248, 0.35) 0%, #07090E 80%)'
        },
        jiocinema: {
          title: 'JIOCINEMA',
          logo: 'assets/logos/jiocinema.svg',
          description: 'Stream Bollywood hit films, Hindi web originals, and HBO & Peacock exclusives.',
          badge: 'JioCinema Originals',
          providerId: '220',
          bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(236, 72, 153, 0.35) 0%, #07090E 80%)'
        },
        hbomax: {
          title: 'HBO MAX',
          logo: 'assets/logos/hbomax.svg',
          description: 'Stream legendary HBO originals, Warner Bros blockbusters, and iconic series.',
          badge: 'HBO Original Series',
          providerId: '384',
          bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(168, 85, 247, 0.35) 0%, #07090E 80%)'
        },
        appletv: {
          title: 'APPLE TV+',
          logo: 'assets/logos/appletv.svg',
          description: 'Stream critically acclaimed Apple Original films and groundbreaking series.',
          badge: 'Apple Original Releases',
          providerId: '350',
          bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255, 255, 255, 0.2) 0%, #07090E 80%)'
        }
      };

      // Metadata definitions for Cinematic Studios & Universes
      var FRANCHISE_METAS = {
        marvel: {
          id: 'marvel',
          title: 'MARVEL CINEMATIC UNIVERSE',
          logo: 'assets/logos/marvel.svg',
          description: 'Experience the complete Marvel Cinematic Universe, Multiverse sagas, Avengers blockbusters, live-action Disney+ series, and classic Marvel animated adventures in release & chronological timeline order.',
          badge: 'Marvel Studios Official Universe Hub',
          bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(229, 9, 20, 0.45) 0%, #07090E 80%)'
        },
        dc: {
          id: 'dc',
          title: 'WORLDS OF DC',
          logo: 'assets/logos/dc.svg',
          description: 'Explore the Dark Knight trilogy, Zack Snyder’s Justice League, The Batman, Peacemaker, Arrowverse series, and legendary DC animated universe masterpieces chronologically and by category.',
          badge: 'DC Studios Official Universe Hub',
          bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(30, 64, 175, 0.45) 0%, #07090E 80%)'
        },
        starwars: {
          id: 'starwars',
          title: 'STAR WARS SAGA',
          logo: 'assets/logos/starwars.svg',
          description: 'Travel to a galaxy far, far away with the complete 9-film Skywalker saga, Rogue One, The Mandalorian, Andor, Ahsoka, and The Clone Wars in release and chronological timeline order.',
          badge: 'Lucasfilm Official Universe Hub',
          bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(202, 138, 4, 0.4) 0%, #07090E 80%)'
        },
        pixar: {
          id: 'pixar',
          title: 'DISNEY • PIXAR',
          logo: 'assets/logos/pixar.svg',
          description: 'Discover heartwarming Pixar animated features, Toy Story, Inside Out, Coco, iconic shorts, and Disney+ series from Pixar Animation Studios.',
          badge: 'Pixar Animation Studios Vault',
          bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(13, 148, 136, 0.4) 0%, #07090E 80%)'
        }
      };

      // ---------------- HELPER: Deduplicate ----------------
      function dedupe(arr) {
        var seen = {};
        return (arr || []).filter(function (item) {
          if (!item || !item.id) return false;
          var key = (item.isTv ? 'tv-' : 'm-') + item.id;
          if (seen[key]) return false;
          seen[key] = true;
          return true;
        });
      }

      // ---------------- HELPER: Build Timeline Order ----------------
      function buildTimelineOrder(items) {
        return (items || []).slice().sort(function (a, b) {
          var dateA = (a.release_date || a.first_air_date || '9999-12-31').substring(0, 10);
          var dateB = (b.release_date || b.first_air_date || '9999-12-31').substring(0, 10);
          return dateA.localeCompare(dateB);
        });
      }

      // Determine catalog mode
      vm.mode = 'ott';
      if (currentPath.indexOf('/franchise') === 0 || franchiseId) {
        vm.mode = 'franchise';
        var fKey = franchiseId || 'marvel';
        var fMeta = FRANCHISE_METAS[fKey] || FRANCHISE_METAS.marvel;
        vm.currentMeta = angular.copy(fMeta);
        vm.franchiseId = fKey;
        vm.filterTabs = [
          { id: 'all', name: 'All Universe Titles', icon: 'fa-globe' },
          { id: 'movie', name: 'Movies', icon: 'fa-film' },
          { id: 'tv', name: 'Series', icon: 'fa-tv' },
          { id: 'animation', name: 'Cartoons & Animation', icon: 'fa-wand-magic-sparkles' },
          { id: 'timeline', name: 'Timeline Order', icon: 'fa-clock-rotate-left' }
        ];
      } else if (currentPath.indexOf('/shows') === 0) {
        vm.mode = 'shows';
        vm.currentMeta = {
          title: 'WEB SERIES & TV SHOWS',
          description: 'Stream trending web series, binge-worthy seasons, and global multi-episode releases.',
          badge: 'Series Catalog',
          bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(168, 85, 247, 0.3) 0%, #07090E 80%)'
        };
        vm.filterTabs = [
          { id: 'all', name: 'All Web Series' },
          { id: 'trending', name: 'Trending Today', icon: 'fa-fire' },
          { id: 'top_rated', name: 'Top Rated', icon: 'fa-star' },
          { id: 'indian', name: 'Indian Series', icon: 'fa-flag' }
        ];
      } else if (currentPath.indexOf('/anime') === 0) {
        vm.mode = 'anime';
        vm.currentMeta = {
          title: 'ANIME UNIVERSE',
          logo: 'assets/logos/anime.svg',
          description: 'Stream legendary shonen, dark fantasy, isekai, and new seasonal anime episodes with multi-audio.',
          badge: 'Official Anime Hub',
          bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(249, 115, 22, 0.35) 0%, #07090E 80%)'
        };
        vm.filterTabs = [
          { id: 'all', name: 'All Anime' },
          { id: 'tv', name: 'Anime Series', icon: 'fa-tv' },
          { id: 'movie', name: 'Anime Movies', icon: 'fa-film' }
        ];
      } else if (currentPath.indexOf('/kdrama') === 0) {
        vm.mode = 'kdrama';
        vm.currentMeta = {
          title: 'K-DRAMA UNIVERSE',
          description: 'Stream viral Korean dramas, heartwarming romances, suspense thrillers, and award-winning series.',
          badge: 'Korean Drama Catalog',
          bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(236, 72, 153, 0.35) 0%, #07090E 80%)'
        };
        vm.filterTabs = [
          { id: 'all', name: 'All K-Dramas' },
          { id: 'top_rated', name: 'Top Rated Hits', icon: 'fa-star' }
        ];
      } else {
        // OTT Platform Hub (Netflix, Prime, Disney+, etc.)
        vm.mode = 'ott';
        var meta = OTT_METAS[ottId] || OTT_METAS.netflix;
        vm.currentMeta = angular.copy(meta);
      }

      // ---------------- FILTERING ----------------
      vm.setFilterTab = function (tabId) {
        vm.activeTab = tabId;
        applyFilter();
      };

      function applyFilter() {
        if (vm.mode === 'franchise') {
          if (vm.activeTab === 'movie') {
            vm.filteredItems = vm.movieItems;
          } else if (vm.activeTab === 'tv') {
            vm.filteredItems = vm.tvItems;
          } else if (vm.activeTab === 'animation') {
            vm.filteredItems = vm.animationItems;
          } else if (vm.activeTab === 'timeline') {
            vm.filteredItems = vm.timelineItems;
          } else {
            // 'all': combined all titles
            vm.filteredItems = vm.allItems;
          }
        } else if (vm.mode === 'ott') {
          if (vm.activeTab === 'movie') {
            vm.filteredItems = vm.movieItems;
          } else if (vm.activeTab === 'tv') {
            vm.filteredItems = vm.tvItems;
          } else {
            // 'all': interleave movies and series for rich layout
            var combined = [];
            var maxLen = Math.max(vm.movieItems.length, vm.tvItems.length);
            for (var i = 0; i < maxLen; i++) {
              if (vm.movieItems[i]) combined.push(vm.movieItems[i]);
              if (vm.tvItems[i]) combined.push(vm.tvItems[i]);
            }
            vm.filteredItems = combined;
          }
        } else if (vm.mode === 'shows') {
          if (vm.activeTab === 'trending') {
            vm.filteredItems = vm.trendingTvItems || vm.allItems;
          } else if (vm.activeTab === 'top_rated') {
            vm.filteredItems = vm.topRatedTvItems || vm.allItems;
          } else if (vm.activeTab === 'indian') {
            vm.filteredItems = vm.indianTvItems || vm.allItems;
          } else {
            vm.filteredItems = vm.allItems;
          }
        } else if (vm.mode === 'anime') {
          if (vm.activeTab === 'tv') {
            vm.filteredItems = vm.tvItems;
          } else if (vm.activeTab === 'movie') {
            vm.filteredItems = vm.movieItems;
          } else {
            vm.filteredItems = vm.allItems;
          }
        } else if (vm.mode === 'kdrama') {
          vm.filteredItems = vm.allItems;
        }
      }

      // ---------------- DATA FETCHING ----------------
      function loadCatalog(page) {
        if (page === 1) {
          vm.isLoading = true;
        } else {
          vm.isLoadingMore = true;
        }

        var promises = [];

        if (vm.mode === 'franchise') {
          var fKey = vm.franchiseId || 'marvel';

          // 1. Fetch Movies
          var moviePromise = MovieService.getFranchiseMovies(fKey, page)
            .then(function (res) {
              var list = res.results || [];
              list.forEach(function (m) { m.isTv = false; });
              if (page === 1) {
                vm.movieItems = list;
              } else {
                vm.movieItems = dedupe(vm.movieItems.concat(list));
              }
            })
            .catch(function () {
              if (page === 1) vm.movieItems = [];
            });
          promises.push(moviePromise);

          // On initial page load, also fetch page 2 of movies concurrently for rich catalog
          if (page === 1) {
            promises.push(
              MovieService.getFranchiseMovies(fKey, 2).then(function (res) {
                var list = res.results || [];
                list.forEach(function (m) { m.isTv = false; });
                vm.movieItems = dedupe(vm.movieItems.concat(list));
              }).catch(function () {})
            );
          }

          // 2. Fetch Live-Action Series / Shows
          var tvPromise = MovieService.getFranchiseTv(fKey, page)
            .then(function (res) {
              var list = res.results || [];
              list.forEach(function (t) { t.isTv = true; });
              if (page === 1) {
                vm.tvItems = list;
              } else {
                vm.tvItems = dedupe(vm.tvItems.concat(list));
              }
            })
            .catch(function () {
              if (page === 1) vm.tvItems = [];
            });
          promises.push(tvPromise);

          // On initial page load, fetch page 2 of series if applicable
          if (page === 1 && (fKey === 'marvel' || fKey === 'dc' || fKey === 'anime')) {
            promises.push(
              MovieService.getFranchiseTv(fKey, 2).then(function (res) {
                var list = res.results || [];
                list.forEach(function (t) { t.isTv = true; });
                vm.tvItems = dedupe(vm.tvItems.concat(list));
              }).catch(function () {})
            );
          }

          // 3. Fetch Cartoons & Animated Series
          var animPromise = MovieService.getFranchiseAnimation(fKey, page)
            .then(function (res) {
              var list = res.results || [];
              list.forEach(function (a) {
                if (a.first_air_date !== undefined) a.isTv = true;
                else a.isTv = false;
              });
              if (page === 1) {
                vm.animationItems = list;
              } else {
                vm.animationItems = dedupe(vm.animationItems.concat(list));
              }
            })
            .catch(function () {
              if (page === 1) vm.animationItems = [];
            });
          promises.push(animPromise);

          // Also fetch Animated Movies (e.g. Spider-Verse, Lego Batman, animated features)
          if (MovieService.getFranchiseAnimationMovies) {
            promises.push(
              MovieService.getFranchiseAnimationMovies(fKey, page).then(function (res) {
                var list = res.results || [];
                list.forEach(function (a) {
                  if (a.first_air_date !== undefined) a.isTv = true;
                  else a.isTv = false;
                });
                vm.animationItems = dedupe(vm.animationItems.concat(list));
              }).catch(function () {})
            );
          }

          // 4. Special Official Collections
          if (page === 1) {
            if (fKey === 'starwars') {
              // Complete 9-film Skywalker Saga Collection
              promises.push(
                MovieService.getCollection(10).then(function (col) {
                  var parts = col.parts || [];
                  parts.forEach(function (m) { m.isTv = false; });
                  vm.movieItems = dedupe(parts.concat(vm.movieItems));
                }).catch(function () {})
              );
            }
          }

        } else if (vm.mode === 'ott') {
          var providerId = vm.currentMeta.providerId || '8';

          var moviePromise = MovieService.getByWatchProvider(providerId, 'IN', page)
            .then(function (res) {
              var list = res.results || [];
              list.forEach(function (m) { m.isTv = false; });
              if (page === 1) {
                vm.movieItems = list;
              } else {
                vm.movieItems = vm.movieItems.concat(list);
              }
            })
            .catch(function () {
              if (page === 1) vm.movieItems = [];
            });

          var tvPromise = MovieService.getByWatchProviderTv(providerId, 'IN', page)
            .then(function (res) {
              var list = res.results || [];
              list.forEach(function (t) { t.isTv = true; });
              if (page === 1) {
                vm.tvItems = list;
              } else {
                vm.tvItems = vm.tvItems.concat(list);
              }
            })
            .catch(function () {
              if (page === 1) vm.tvItems = [];
            });

          promises.push(moviePromise, tvPromise);

        } else if (vm.mode === 'shows') {
          var tvPromise = MovieService.getPopularTv(page)
            .then(function (res) {
              var list = res.results || [];
              list.forEach(function (t) { t.isTv = true; });
              if (page === 1) {
                vm.allItems = list;
              } else {
                vm.allItems = vm.allItems.concat(list);
              }
            });
          promises.push(tvPromise);

          if (page === 1) {
            promises.push(
              MovieService.getTrendingTv().then(function (res) {
                var list = res.results || [];
                list.forEach(function (t) { t.isTv = true; });
                vm.trendingTvItems = list;
              }),
              MovieService.getTopRatedTv(1).then(function (res) {
                var list = res.results || [];
                list.forEach(function (t) { t.isTv = true; });
                vm.topRatedTvItems = list;
              }),
              MovieService.getIndianSeries(1).then(function (res) {
                var list = res.results || [];
                list.forEach(function (t) { t.isTv = true; });
                vm.indianTvItems = list;
              })
            );
          }

        } else if (vm.mode === 'anime') {
          var animeTvPromise = MovieService.getAnimeShows(page)
            .then(function (res) {
              var list = res.results || [];
              list.forEach(function (t) { t.isTv = true; });
              if (page === 1) {
                vm.tvItems = list;
              } else {
                vm.tvItems = vm.tvItems.concat(list);
              }
            });

          var animeMoviePromise = MovieService.getFranchiseMovies('anime', page)
            .then(function (res) {
              var list = res.results || [];
              list.forEach(function (m) { m.isTv = false; });
              if (page === 1) {
                vm.movieItems = list;
              } else {
                vm.movieItems = vm.movieItems.concat(list);
              }
            });

          promises.push(animeTvPromise, animeMoviePromise);

        } else if (vm.mode === 'kdrama') {
          var kdramaPromise = MovieService.getKdramaShows(page)
            .then(function (res) {
              var list = res.results || [];
              list.forEach(function (t) { t.isTv = true; });
              if (page === 1) {
                vm.allItems = list;
              } else {
                vm.allItems = vm.allItems.concat(list);
              }
            });
          promises.push(kdramaPromise);
        }

        Promise.all(promises).then(function () {
          if (vm.mode === 'franchise') {
            vm.movieItems = dedupe(vm.movieItems);
            vm.tvItems = dedupe(vm.tvItems);
            vm.animationItems = dedupe(vm.animationItems);

            // Interleave movies, series, animation for rich 'All' view
            var combined = [];
            var maxLen = Math.max(vm.movieItems.length, vm.tvItems.length, vm.animationItems.length);
            for (var i = 0; i < maxLen; i++) {
              if (vm.movieItems[i]) combined.push(vm.movieItems[i]);
              if (vm.tvItems[i]) combined.push(vm.tvItems[i]);
              if (vm.animationItems[i]) combined.push(vm.animationItems[i]);
            }
            vm.allItems = dedupe(combined);

            // Build chronological release timeline order
            var allDated = (vm.movieItems.concat(vm.tvItems, vm.animationItems)).filter(function (it) {
              return it && (it.release_date || it.first_air_date);
            });
            vm.timelineItems = dedupe(buildTimelineOrder(allDated));

          } else if (vm.mode === 'anime') {
            vm.allItems = vm.tvItems.concat(vm.movieItems);
          }
          applyFilter();
        }).finally(function () {
          vm.isLoading = false;
          vm.isLoadingMore = false;
          $scope.$applyAsync();
        });
      }

      vm.loadMore = function () {
        vm.currentPage += 1;
        loadCatalog(vm.currentPage);
      };

      // Initial load
      loadCatalog(1);
    }
  ]);

})();
