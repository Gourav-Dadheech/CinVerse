/**
 * CinVerse - gamesController.js
 * Original AAA & Cloud Web Gaming Controller.
 * Features:
 *  - PC Exclusive Device Lock & Mobile Warning Filter
 *  - Fullscreen Cinema 4K Showcase Viewport with HTML5 Fullscreen API
 *  - 1-Click Launch Cloud Stream (Xbox Cloud, GeForce NOW, Boosteroid)
 *  - Category Filters (All, AAA Open World, Racing, FPS, Retro)
 *  - Live Gamepad API Integration (Xbox / PS / USB controller support)
 *  - Controls Legend Drawer (Xbox / PS Controller + Keyboard & Mouse)
 *  - Cloud Gaming FAQ / Free Access Guide Modal
 */
(function () {
  'use strict';

  angular.module('cinVerseApp').controller('GamesController', [
    '$scope',
    '$sce',
    '$window',
    '$timeout',
    'GamesService',
    function ($scope, $sce, $window, $timeout, GamesService) {
      var vm = this;

      vm.gamesService = GamesService;

      // Filter & Navigation States
      vm.activeCategory = 'all'; // 'all', 'aaa', 'racing', 'fps', 'retro'
      vm.searchQuery = '';

      // PC vs Mobile Device Lock
      vm.isMobileDevice = GamesService.isMobileDevice();
      vm.bypassMobileLock = false;

      vm.unlockMobileMode = function () {
        vm.bypassMobileLock = true;
      };

      // Guide Modal
      vm.showGuideModal = false;
      vm.openGuideModal = function () {
        vm.showGuideModal = true;
      };
      vm.closeGuideModal = function () {
        vm.showGuideModal = false;
      };

      // Gamepad Controller Tracking
      Object.defineProperty(vm, 'gamepadConnected', {
        get: function () {
          return GamesService.gamepadConnected;
        },
        enumerable: true,
        configurable: true
      });

      Object.defineProperty(vm, 'gamepadName', {
        get: function () {
          return GamesService.gamepadName || 'Wireless Controller';
        },
        enumerable: true,
        configurable: true
      });

      // Active Selected Game for Cinema Viewport
      Object.defineProperty(vm, 'activeGame', {
        get: function () {
          return GamesService.activeGame;
        },
        set: function (g) {
          GamesService.activeGame = g;
        },
        enumerable: true,
        configurable: true
      });

      // View Mode: 'trailer' (4K Showcase) or 'direct' (for WebGL playable games like Minecraft)
      vm.viewMode = 'trailer';

      // Trusted Resource URLs for iframe embeds
      vm.trustedTrailerUrl = null;
      vm.trustedEmbedUrl = null;

      function updateTrustedUrls() {
        if (vm.activeGame) {
          if (vm.activeGame.trailerEmbedUrl) {
            vm.trustedTrailerUrl = $sce.trustAsResourceUrl(vm.activeGame.trailerEmbedUrl);
          } else {
            vm.trustedTrailerUrl = null;
          }

          if (vm.activeGame.inBrowserEmbedUrl) {
            vm.trustedEmbedUrl = $sce.trustAsResourceUrl(vm.activeGame.inBrowserEmbedUrl);
            vm.viewMode = 'direct';
          } else {
            vm.trustedEmbedUrl = null;
            vm.viewMode = 'trailer';
          }
        }
      }
      updateTrustedUrls();

      // Controls HUD Drawer Toggle
      vm.showControlsHud = true;
      vm.toggleControlsHud = function () {
        vm.showControlsHud = !vm.showControlsHud;
      };

      // Select and launch game into Cinema Viewport
      vm.selectGame = function (game) {
        if (!game) return;
        vm.activeGame = game;
        updateTrustedUrls();

        // Smooth scroll to cinema viewport
        $timeout(function () {
          var el = document.getElementById('cinema-game-station-viewport');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 50);
      };

      // Switch View Mode
      vm.setViewMode = function (mode) {
        vm.viewMode = mode;
      };

      // Reload Active Game Frame
      vm.reloadGame = function () {
        var currentTrailer = vm.trustedTrailerUrl;
        var currentEmbed = vm.trustedEmbedUrl;
        vm.trustedTrailerUrl = null;
        vm.trustedEmbedUrl = null;
        $timeout(function () {
          updateTrustedUrls();
        }, 120);
      };

      // Fullscreen Cinema Mode
      vm.isFullscreen = false;

      function updateFullscreenStatus() {
        vm.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        var container = document.getElementById('cinema-game-theater-wrap');
        if (container) {
          if (vm.isFullscreen) {
            container.classList.add('is-fullscreen-theater');
          } else {
            container.classList.remove('is-fullscreen-theater');
          }
        }
        $scope.$applyAsync();
      }

      document.addEventListener('fullscreenchange', updateFullscreenStatus);
      document.addEventListener('webkitfullscreenchange', updateFullscreenStatus);
      document.addEventListener('mozfullscreenchange', updateFullscreenStatus);
      document.addEventListener('MSFullscreenChange', updateFullscreenStatus);

      $scope.$on('$destroy', function () {
        document.removeEventListener('fullscreenchange', updateFullscreenStatus);
        document.removeEventListener('webkitfullscreenchange', updateFullscreenStatus);
        document.removeEventListener('mozfullscreenchange', updateFullscreenStatus);
        document.removeEventListener('MSFullscreenChange', updateFullscreenStatus);
      });

      vm.toggleFullscreen = function () {
        var container = document.getElementById('cinema-game-theater-wrap');
        if (!container) return;

        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          if (container.requestFullscreen) {
            container.requestFullscreen();
          } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
          } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
        }
      };

      // Category filter handler
      vm.setCategory = function (cat) {
        vm.activeCategory = cat;
      };

      // Filtered Games List
      vm.getFilteredGames = function () {
        var list = GamesService.gamesCatalog;
        if (vm.activeCategory !== 'all') {
          list = list.filter(function (g) {
            return g.category === vm.activeCategory;
          });
        }
        if (vm.searchQuery && vm.searchQuery.trim().length > 0) {
          var q = vm.searchQuery.trim().toLowerCase();
          list = list.filter(function (g) {
            var matchTitle = g.title && g.title.toLowerCase().indexOf(q) !== -1;
            var matchSubtitle = g.subtitle && g.subtitle.toLowerCase().indexOf(q) !== -1;
            var matchPublisher = g.publisher && g.publisher.toLowerCase().indexOf(q) !== -1;
            var matchBadge = g.badge && g.badge.toLowerCase().indexOf(q) !== -1;
            return matchTitle || matchSubtitle || matchPublisher || matchBadge;
          });
        }
        return list;
      };

      // Count by category
      vm.getCategoryCount = function (cat) {
        if (cat === 'all') return GamesService.gamesCatalog.length;
        return GamesService.gamesCatalog.filter(function (g) {
          return g.category === cat;
        }).length;
      };

      // Direct Cloud Stream Launcher
      vm.launchCloudStream = function (game) {
        var targetGame = game || vm.activeGame;
        if (!targetGame || !targetGame.cloudPlayUrl) return;

        // Open in a focused high-performance window/tab
        var w = 1280;
        var h = 720;
        var left = (window.screen.width - w) / 2;
        var top = (window.screen.height - h) / 2;
        var specs = 'width=' + w + ',height=' + h + ',top=' + top + ',left=' + left + ',resizable=yes,scrollbars=no,status=no';

        try {
          var win = window.open(targetGame.cloudPlayUrl, '_blank', specs);
          if (!win || win.closed || typeof win.closed === 'undefined') {
            // Popup was blocked, fallback to standard tab
            window.open(targetGame.cloudPlayUrl, '_blank');
          }
        } catch (e) {
          window.open(targetGame.cloudPlayUrl, '_blank');
        }
      };
    }
  ]);
})();
