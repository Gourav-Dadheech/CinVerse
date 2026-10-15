/**
 * Cinverse - sportsController.js
 * CREX, Cricbuzz & ESPNcricinfo Style Cricket Hub & Global Sports Controller.
 * Features:
 * - Match Filtering by Status: ALL, LIVE (🔴), UPCOMING (🟢), COMPLETED (⚪)
 * - Match Filtering by Format: All, Test, T20, ODI
 * - CREX Match Center Interactive Hub:
 *   1. Live & Info (Win Predictor, At-The-Crease mini scorecard, Over tracker, Pitch & Weather)
 *   2. Detailed Scorecard (Innings switcher, Batting, Bowling, Extras, Fall of Wickets)
 *   3. Ball-by-Ball Commentary (Filters for all balls, wickets, boundaries)
 *   4. Squads & Playing XI (Captains, Wicketkeepers, Roles & Bench)
 *   5. Points Table (ICC World Test Championship & IPL 2026 Standings)
 * - Dedicated Match Live Broadcast Cinema (Multi-server 1080p stream for EACH respective match)
 * - Cricket News Station with full-featured editorial drawer
 */
(function () {
  'use strict';

  angular.module('cinVerseApp').controller('SportsController', [
    '$scope',
    '$timeout',
    '$interval',
    '$sce',
    'SportsService',
    function ($scope, $timeout, $interval, $sce, SportsService) {
      var vm = this;

      vm.sportsService = SportsService;

      // Filter States
      vm.statusFilter = 'all'; // 'all', 'LIVE', 'UPCOMING', 'COMPLETED'
      vm.formatFilter = 'all'; // 'all', 'TEST', 'T20', 'ODI'
      vm.categoryFilter = 'all'; // 'all', 'international', 'league', 'domestic'

      // Master Matches List & Real-Date Calendar Sync
      vm.todayFormatted = SportsService.todayFormatted;
      vm.isAutoSyncActive = true;
      Object.defineProperty(vm, 'backendScraperActive', {
        get: function () {
          return SportsService.backendScraperActive;
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(vm, 'matches', {
        get: function () {
          return SportsService.cricketMatches;
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(vm, 'cricketNews', {
        get: function () {
          return SportsService.cricketNews;
        },
        enumerable: true,
        configurable: true
      });
      vm.wtcPointsTable = SportsService.wtcPointsTable;
      vm.iplPointsTable = SportsService.iplPointsTable;

      // Active Match for CREX Match Center
      Object.defineProperty(vm, 'activeMatch', {
        get: function () {
          return SportsService.activeMatch || (SportsService.cricketMatches && SportsService.cricketMatches[0]);
        },
        set: function (match) {
          SportsService.activeMatch = match;
        },
        enumerable: true,
        configurable: true
      });
      vm.activeMatchTab = 'live'; // 'live', 'scorecard', 'commentary', 'squads', 'points'
      vm.selectedInningsIndex = 0;
      vm.commentaryFilter = 'all'; // 'all', 'wickets', 'boundaries'

      // Live Video Stream Theater (Plays respective match stream)
      vm.showLivePlayer = false;
      vm.currentServerIndex = 0;
      vm.trustedStreamUrl = null;
      vm.isHlsStream = false;
      vm.hlsInstance = null;

      // Active News Article Modal
      vm.selectedArticle = null;
      vm.showNewsModal = false;

      // Filter Handlers
      vm.setStatusFilter = function (status) {
        vm.statusFilter = status;
      };

      vm.setFormatFilter = function (format) {
        vm.formatFilter = format;
      };

      vm.setCategoryFilter = function (cat) {
        vm.categoryFilter = cat;
      };

      // Filtered Matches for Cards Carousel/Grid
      vm.getFilteredMatches = function () {
        return vm.matches.filter(function (m) {
          var matchStatus = vm.statusFilter === 'all' || m.status === vm.statusFilter;
          var matchFormat = vm.formatFilter === 'all' || m.format === vm.formatFilter;
          var matchCat = vm.categoryFilter === 'all' || m.category === vm.categoryFilter;
          return matchStatus && matchFormat && matchCat;
        });
      };

      // Match Counts for Filter Pills
      vm.getMatchCount = function (status) {
        if (status === 'all') return vm.matches.length;
        return vm.matches.filter(function (m) { return m.status === status; }).length;
      };

      // Open CREX Match Center
      vm.selectMatch = function (match) {
        if (!match) return;
        vm.activeMatch = match;
        vm.selectedInningsIndex = 0;
        vm.currentServerIndex = 0;
        SportsService.selectMatch(match);

        // If live player was open, update to this match's respective stream
        if (vm.showLivePlayer) {
          vm.playCurrentMatchStream();
        }

        // Smooth scroll to match center on mobile
        $timeout(function () {
          var el = document.getElementById('crex-match-center-hub');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 50);
      };

      // Watch Match Live Stream directly
      vm.watchMatchLive = function (match) {
        vm.selectMatch(match);
        vm.showLivePlayer = true;
        vm.playCurrentMatchStream();
      };

      vm.toggleLivePlayer = function () {
        vm.showLivePlayer = !vm.showLivePlayer;
        if (vm.showLivePlayer) {
          vm.playCurrentMatchStream();
        } else {
          vm.stopLivePlayer();
        }
      };

      // Internal Resilient Stream Loader for respective match
      vm.playCurrentMatchStream = function () {
        if (!vm.activeMatch || !vm.activeMatch.servers || !vm.activeMatch.servers.length) return;
        var srv = vm.activeMatch.servers[vm.currentServerIndex] || vm.activeMatch.servers[0];

        if (srv.type === 'hls' || srv.url.indexOf('.m3u8') !== -1) {
          vm.isHlsStream = true;
          vm.trustedStreamUrl = null;
          attachHlsStream(srv.url);
        } else {
          vm.isHlsStream = false;
          detachHlsStream();
          vm.trustedStreamUrl = $sce.trustAsResourceUrl(srv.url);
        }
      };

      function attachHlsStream(url) {
        $timeout(function () {
          var videoEl = document.getElementById('crex-live-match-video');
          if (!videoEl) return;

          detachHlsStream();

          if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 60
            });
            hls.loadSource(url);
            hls.attachMedia(videoEl);

            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
              var p = videoEl.play();
              if (p !== undefined) {
                p.catch(function () {
                  videoEl.muted = true;
                  videoEl.play().catch(function () {});
                });
              }
            });

            hls.on(window.Hls.Events.ERROR, function (event, data) {
              if (data.fatal) {
                switch (data.type) {
                  case window.Hls.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad();
                    break;
                  case window.Hls.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError();
                    break;
                  default:
                    // Auto cycle to next server of this respective match
                    if (vm.activeMatch && vm.activeMatch.servers && vm.activeMatch.servers.length > 1) {
                      vm.currentServerIndex = (vm.currentServerIndex + 1) % vm.activeMatch.servers.length;
                      vm.playCurrentMatchStream();
                    }
                    break;
                }
              }
            });

            vm.hlsInstance = hls;
          } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
            videoEl.src = url;
            videoEl.play().catch(function () {
              videoEl.muted = true;
              videoEl.play().catch(function () {});
            });
          }
        }, 80);
      }

      function detachHlsStream() {
        if (vm.hlsInstance) {
          try { vm.hlsInstance.destroy(); } catch (e) {}
          vm.hlsInstance = null;
        }
      }

      vm.stopLivePlayer = function () {
        detachHlsStream();
        var videoEl = document.getElementById('crex-live-match-video');
        if (videoEl) {
          try { videoEl.pause(); videoEl.src = ''; } catch (e) {}
        }
        vm.trustedStreamUrl = null;
      };

      vm.switchServer = function (index) {
        vm.currentServerIndex = index;
        vm.playCurrentMatchStream();
      };

      vm.setMatchTab = function (tab) {
        vm.activeMatchTab = tab;
        SportsService.setMatchTab(tab);
      };

      vm.selectInnings = function (index) {
        vm.selectedInningsIndex = index;
      };

      vm.setCommentaryFilter = function (filter) {
        vm.commentaryFilter = filter;
      };

      // Filtered Commentary
      vm.getFilteredCommentary = function () {
        if (!vm.activeMatch || !vm.activeMatch.commentary) return [];
        if (vm.commentaryFilter === 'wickets') {
          return vm.activeMatch.commentary.filter(function (c) { return c.isWicket; });
        }
        if (vm.commentaryFilter === 'boundaries') {
          return vm.activeMatch.commentary.filter(function (c) { return c.isBoundary; });
        }
        return vm.activeMatch.commentary;
      };

      // News Modal
      vm.openArticle = function (article) {
        vm.selectedArticle = article;
        vm.showNewsModal = true;
      };

      vm.closeNewsModal = function () {
        vm.showNewsModal = false;
        vm.selectedArticle = null;
      };

      // Auto-refresh match data every 5 seconds & sync dynamic calendar
      var refreshTimer = $interval(function () {
        vm.todayFormatted = SportsService.todayFormatted;

        if (vm.activeMatch) {
          var updated = vm.matches.find(function (m) { return m.id === vm.activeMatch.id; });
          if (updated) {
            // Keep dynamic properties updated without resetting servers or video state
            vm.activeMatch.score = updated.score;
            vm.activeMatch.equation = updated.equation;
            vm.activeMatch.currentOver = updated.currentOver;
            vm.activeMatch.striker = updated.striker;
            vm.activeMatch.nonStriker = updated.nonStriker;
            vm.activeMatch.winPredictor = updated.winPredictor;
          }
        }
      }, 5000);

      // Listen for midnight calendar rollover
      $scope.$on('sports:dayRollover', function () {
        vm.todayFormatted = SportsService.todayFormatted;
        vm.matches = SportsService.cricketMatches;
        vm.activeMatch = SportsService.activeMatch;
        if (vm.showLivePlayer) {
          vm.playCurrentMatchStream();
        }
      });

      $scope.$on('$destroy', function () {
        if (refreshTimer) {
          $interval.cancel(refreshTimer);
        }
        vm.stopLivePlayer();
      });
    }
  ]);
})();
