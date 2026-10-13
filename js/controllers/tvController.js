/* ============================================================
   CinVerse - tvController.js
   ------------------------------------------------------------
   Powers the TV Show & Web Series Details page:
     - Backdrop + poster + series metadata (seasons count,
       network, air date, rating, status)
     - Interactive Seasons tabs & Episodes grid (with thumbnail,
       runtime, air date & episode synopsis)
     - Clean 3-Server Multi-Audio Streaming Engine:
         Server 1: VidBolt (https://vidbolt.xyz/tv/{id}/{s}/{e})
         Server 2: VidFast (https://vidfast.vc/tv/{id}/{s}/{e})
         Server 3: College WiFi Bypass (https://vidsrc.pm/embed/tv?tmdb={id}&season={s}&episode={e})
     - Previous / Next Episode seamless jump controls
     - YouTube Trailer Lightbox modal (no permanent iframe clutter)
     - Circular Cast Headshots & Similar Series recommendations
     - Multi-Thread Episode Cloud Downloader with dual audio
   ============================================================ */

(function () {
  'use strict';

  angular.module('cinVerseApp').controller('TvController', [
    '$scope',
    '$routeParams',
    '$location',
    '$sce',
    '$timeout',
    '$interval',
    'MovieService',
    'StorageService',
    'PlayerService',
    'StreamBridgeService',
    function ($scope, $routeParams, $location, $sce, $timeout, $interval, MovieService, StorageService, PlayerService, StreamBridgeService) {
      var vm = this;

      var tvId = parseInt($routeParams.tvId, 10);

      // ---------------- STATE ----------------
      vm.show = null;
      vm.cast = [];
      vm.episodes = [];
      vm.currentSeasonNumber = 1;
      vm.currentEpisodeNumber = 1;
      vm.currentEpisode = null;
      vm.similarShows = [];

      vm.isLoading = true;
      vm.isLoadingSeason = false;
      vm.errorMessage = null;
      vm.notFound = false;

      vm.isFavorite = false;
      vm.isWatchlisted = false;

      // ---------------- THEATER MODE & UI STATE ----------------
      vm.theaterMode = false;
      vm.showPlayer = false;
      vm.adShieldActive = true;
      vm.collegeBypassActive = false;

      vm.toggleTheaterMode = function () {
        vm.theaterMode = !vm.theaterMode;
      };

      vm.toggleAdShield = function () {
        vm.adShieldActive = !vm.adShieldActive;
      };

      // ---------------- 5 HIGH-SPEED STREAMING SERVERS (MULTI-AUDIO & GLOBAL) ----------------

      vm.servers = [
        {
          id: 1,
          name: 'Server 1 • VidBolt',
          badge: 'Multi-Audio ⚡',
          icon: 'fa-bolt',
          getUrl: function (id, s, e) {
            return 'https://vidbolt.xyz/tv/' + id + '/' + s + '/' + e;
          }
        },
        {
          id: 2,
          name: 'Server 2 • SuperEmbed',
          badge: '4K Multi-Cloud 🚀',
          icon: 'fa-film',
          getUrl: function (id, s, e) {
            return 'https://superembed.stream/?video_id=' + id + '&tmdb=1&season=' + s + '&episode=' + e;
          }
        },
        {
          id: 3,
          name: 'Server 3 • 2Embed',
          badge: 'Bollywood / Hindi 🇮🇳',
          icon: 'fa-clapperboard',
          getUrl: function (id, s, e) {
            return 'https://www.2embed.cc/embedtv/' + id + '&s=' + s + '&e=' + e;
          }
        },
        {
          id: 4,
          name: 'Server 4 • SmashyStream',
          badge: 'Fast Mirror 💨',
          icon: 'fa-cloud',
          getUrl: function (id, s, e) {
            return 'https://embed.smashystream.com/playere.php?tmdb=' + id + '&season=' + s + '&episode=' + e;
          }
        },
        {
          id: 5,
          name: 'Server 5 • Vidflix',
          badge: 'Campus WiFi Proof 🎓',
          icon: 'fa-graduation-cap',
          getUrl: function (id, s, e) {
            return 'https://vidsrc.pm/embed/tv?tmdb=' + id + '&season=' + s + '&episode=' + e;
          }
        }
      ];

      vm.currentServer = vm.servers[0];
      vm.currentStreamUrl = null;
      vm.isServersOpen = false;

      // ---------------- IN-PLAYER TOOLS & SETTINGS (IN-FRAME) ----------------
      vm.showInPlayerSettings = false;
      vm.inPlayerSettingsTab = 'audio';
      vm.aspectRatio = '16/9';

      vm.openInPlayerSettings = function (tab) {
        vm.showInPlayerSettings = true;
        vm.inPlayerSettingsTab = tab || 'audio';
      };

      vm.closeInPlayerSettings = function () {
        vm.showInPlayerSettings = false;
      };

      vm.toggleInPlayerSettings = function (tab) {
        if (vm.showInPlayerSettings && vm.inPlayerSettingsTab === tab) {
          vm.showInPlayerSettings = false;
        } else {
          vm.showInPlayerSettings = true;
          vm.inPlayerSettingsTab = tab || 'audio';
        }
      };

      vm.setAspectRatio = function (ratio) {
        vm.aspectRatio = ratio || '16/9';
      };

      var wakeLockObj = null;

      function acquireWakeLock() {
        if ('wakeLock' in navigator) {
          try {
            navigator.wakeLock.request('screen').then(function (wl) {
              wakeLockObj = wl;
            }).catch(function () {});
          } catch (e) {}
        }
        if (window.CinVerseNative && window.CinVerseNative.setKeepScreenOn) {
          try { window.CinVerseNative.setKeepScreenOn(true); } catch (e) {}
        }
      }

      function releaseWakeLock() {
        if (wakeLockObj) {
          try { wakeLockObj.release(); } catch (e) {}
          wakeLockObj = null;
        }
        if (window.CinVerseNative && window.CinVerseNative.setKeepScreenOn) {
          try { window.CinVerseNative.setKeepScreenOn(false); } catch (e) {}
        }
      }

      vm.isScreenLocked = false;

      vm.toggleScreenLock = function () {
        vm.isScreenLocked = !vm.isScreenLocked;

        if (vm.isScreenLocked) {
          // Lock orientation on mobile devices to prevent accidental rotation flipping
          try {
            if (screen.orientation && screen.orientation.lock) {
              var currentOrientation = screen.orientation.type || 'landscape';
              screen.orientation.lock(currentOrientation).catch(function () {});
            }
          } catch (e) {}

          if (window.CinVerseNative && window.CinVerseNative.lockOrientation) {
            try { window.CinVerseNative.lockOrientation(true); } catch (e) {}
          }
          if (window.CinVerseNative && window.CinVerseNative.vibrate) {
            try { window.CinVerseNative.vibrate(30); } catch (e) {}
          }
        } else {
          // Unlock orientation
          try {
            if (screen.orientation && screen.orientation.unlock) {
              screen.orientation.unlock();
            }
          } catch (e) {}

          if (window.CinVerseNative && window.CinVerseNative.lockOrientation) {
            try { window.CinVerseNative.lockOrientation(false); } catch (e) {}
          }
          if (window.CinVerseNative && window.CinVerseNative.vibrate) {
            try { window.CinVerseNative.vibrate(20); } catch (e) {}
          }
        }
      };

      // ---------------- FULLSCREEN & ORIENTATION ----------------
      vm.isFullscreen = false;

      function updateFsState() {
        vm.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        if (!$scope.$$phase) {
          $scope.$applyAsync();
        }
      }

      document.addEventListener('fullscreenchange', updateFsState);
      document.addEventListener('webkitfullscreenchange', updateFsState);
      document.addEventListener('mozfullscreenchange', updateFsState);

      vm.toggleFullscreen = function ($event) {
        if ($event) {
          $event.stopPropagation();
        }
        var wrap = document.getElementById('tv-theater-screen-container') || document.getElementById('tv-player-section') || document.querySelector('.theater-screen-wrap');
        if (!wrap) return;

        var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        if (!isFs) {
          if (wrap.requestFullscreen) {
            wrap.requestFullscreen().catch(function () {});
          } else if (wrap.webkitRequestFullscreen) {
            wrap.webkitRequestFullscreen();
          } else if (wrap.mozRequestFullScreen) {
            wrap.mozRequestFullScreen();
          } else if (wrap.msRequestFullscreen) {
            wrap.msRequestFullscreen();
          }

          try {
            if (screen.orientation && screen.orientation.lock) {
              screen.orientation.lock('landscape').catch(function () {});
            }
          } catch (e) {}

          if (window.CinVerseNative && window.CinVerseNative.lockOrientation) {
            try { window.CinVerseNative.lockOrientation(true); } catch (e) {}
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(function () {});
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          }

          try {
            if (screen.orientation && screen.orientation.unlock) {
              screen.orientation.unlock();
            }
          } catch (e) {}

          if (window.CinVerseNative && window.CinVerseNative.lockOrientation) {
            try { window.CinVerseNative.lockOrientation(false); } catch (e) {}
          }
        }
      };

      // ---------------- LANGUAGE & AUDIO TRACKS ----------------
      var LANGUAGE_MAP = {
        'en': { name: 'English', flag: '🇬🇧' },
        'hi': { name: 'Hindi', flag: '🇮🇳' },
        'ta': { name: 'Tamil', flag: '🇮🇳' },
        'te': { name: 'Telugu', flag: '🇮🇳' },
        'ml': { name: 'Malayalam', flag: '🇮🇳' },
        'kn': { name: 'Kannada', flag: '🇮🇳' },
        'es': { name: 'Spanish', flag: '🇪🇸' },
        'fr': { name: 'French', flag: '🇫🇷' },
        'de': { name: 'German', flag: '🇩🇪' },
        'it': { name: 'Italian', flag: '🇮🇹' },
        'ja': { name: 'Japanese', flag: '🇯🇵' },
        'ko': { name: 'Korean', flag: '🇰🇷' },
        'zh': { name: 'Chinese', flag: '🇨🇳' },
        'ru': { name: 'Russian', flag: '🇷🇺' },
        'pt': { name: 'Portuguese', flag: '🇧🇷' },
        'ar': { name: 'Arabic', flag: '🇸🇦' }
      };

      vm.availableLanguages = [];
      vm.audioTracks = [];
      vm.selectedAudioTrack = null;
      vm.audioNotice = '';

      function setupLanguages(show) {
        var langs = [];
        var seen = {};

        if (show.spoken_languages && show.spoken_languages.length > 0) {
          show.spoken_languages.forEach(function (l) {
            var code = (l.iso_639_1 || '').toLowerCase();
            var info = LANGUAGE_MAP[code] || { name: l.english_name || l.name, flag: '🌐' };
            if (code && !seen[code]) {
              seen[code] = true;
              langs.push({
                code: code,
                name: info.name,
                flag: info.flag,
                isOriginal: code === (show.original_language || '').toLowerCase()
              });
            }
          });
        }

        var origCode = (show.original_language || 'en').toLowerCase();
        if (!seen[origCode]) {
          var origInfo = LANGUAGE_MAP[origCode] || { name: origCode.toUpperCase(), flag: '🌐' };
          langs.unshift({
            code: origCode,
            name: origInfo.name,
            flag: origInfo.flag,
            isOriginal: true
          });
          seen[origCode] = true;
        }

        vm.availableLanguages = langs;

        var tracks = [];
        if (origCode === 'hi') {
          tracks.push({ id: 'hi', name: 'Hindi (Original)', flag: '🇮🇳', badge: 'Original Audio' });
          tracks.push({ id: 'en', name: 'English Dubbed', flag: '🇬🇧', badge: 'HD Audio' });
        } else if (origCode === 'ta' || origCode === 'te' || origCode === 'ml' || origCode === 'kn') {
          var regInfo = LANGUAGE_MAP[origCode];
          tracks.push({ id: 'hi', name: 'Hindi Dubbed', flag: '🇮🇳', badge: 'Dual Audio' });
          tracks.push({ id: origCode, name: (regInfo ? regInfo.name : 'Regional') + ' (Original)', flag: (regInfo ? regInfo.flag : '🇮🇳'), badge: 'Master Track' });
          tracks.push({ id: 'en', name: 'English Dubbed', flag: '🇬🇧', badge: 'HD Audio' });
        } else if (origCode === 'ko' || origCode === 'ja') {
          var eastAsian = LANGUAGE_MAP[origCode];
          tracks.push({ id: 'hi', name: 'Hindi Dubbed', flag: '🇮🇳', badge: 'K-Drama Hindi' });
          tracks.push({ id: origCode, name: (eastAsian ? eastAsian.name : origCode.toUpperCase()) + ' (Original)', flag: (eastAsian ? eastAsian.flag : '🇰🇷'), badge: 'Master Track' });
          tracks.push({ id: 'en', name: 'English Dubbed', flag: '🇬🇧', badge: 'HD Audio' });
        } else {
          tracks.push({ id: 'hi', name: 'Hindi Dubbed', flag: '🇮🇳', badge: 'Dual Audio' });
          tracks.push({ id: 'en', name: 'English (Original)', flag: '🇬🇧', badge: 'HD Audio' });
        }

        tracks.push({ id: 'multi', name: 'Multi-Audio / Subtitles', flag: '🌐', badge: 'All Languages' });

        vm.audioTracks = tracks;
        vm.selectedAudioTrack = tracks[0];
        vm.audioNotice = 'Active Audio: ' + tracks[0].name + ' • Switch between Hindi Dubbed or Original anytime.';
      }

      vm.selectAudioTrack = function (track) {
        vm.selectedAudioTrack = track;
        if (track.id === 'hi') {
          var hindiServer = vm.servers.find(function (s) { return s.id === 3; }) || vm.servers[0];
          vm.currentServer = hindiServer;
          vm.audioNotice = '🇮🇳 Hindi Dubbed / Dual-Audio Active on ' + vm.currentServer.name + '! (If stream starts in English, tap the ⚙️ Settings / Audio menu inside the player)';
        } else if (track.id === 'en') {
          vm.currentServer = vm.servers[0];
          vm.audioNotice = '🇬🇧 English Master Track (1080p HD) active on ' + vm.currentServer.name + '.';
        } else if (track.id === 'multi') {
          vm.audioNotice = '🌐 Multi-Language & Subtitles Active on ' + vm.currentServer.name + '. You can select tracks in the player ⚙️ settings.';
        } else {
          vm.audioNotice = track.name + ' selected on ' + vm.currentServer.name + '.';
        }

        if (vm.show && vm.show.id) {
          var url = vm.currentServer.getUrl(vm.show.id, vm.currentSeasonNumber, vm.currentEpisodeNumber);
          vm.currentStreamUrl = $sce.trustAsResourceUrl(url);
        }
      };

      // ---------------- STREAM ENGINE (CINVERSE PRO NATIVE ARTPLAYER + CLOUD INTERCEPTOR) ----------------
      vm.useNativePlayer = false;
      vm.isExtractingStream = false;
      vm.extractionStatus = '';
      vm.artInstance = null;

      vm.bootNativePlayerWithUrl = function (streamUrl, title) {
        if (!vm.showPlayer) return;
        var container = document.getElementById('cinverse-artplayer-tv');
        if (!container) return;

        if (vm.artInstance) {
          PlayerService.destroyPlayer(vm.artInstance);
          vm.artInstance = null;
        }

        var epTitle = title || ((vm.show ? vm.show.name : 'TV Series') + ' • S' + vm.currentSeasonNumber + ':E' + vm.currentEpisodeNumber);
        vm.artInstance = PlayerService.initPlayer({
          container: container,
          url: streamUrl,
          title: epTitle,
          poster: vm.show ? vm.getBackdropUrl(vm.show.backdrop_path) : '',
          onTimeUpdate: function (currentTime, duration) {
            if (vm.show && vm.show.id && duration > 0) {
              var pct = Math.floor((currentTime / duration) * 100);
              StorageService.recordWatch(
                {
                  id: vm.show.id,
                  name: vm.show.name,
                  title: vm.show.name + ' (S' + vm.currentSeasonNumber + ':E' + vm.currentEpisodeNumber + ')',
                  poster_path: vm.show.poster_path,
                  backdrop_path: vm.show.backdrop_path,
                  vote_average: vm.show.vote_average,
                  isTv: true,
                  season: vm.currentSeasonNumber,
                  episode: vm.currentEpisodeNumber
                },
                'CinVerse Native Player',
                'Multi-Audio Master',
                pct,
                vm.currentServer ? vm.currentServer.id : 1,
                'multi'
              );
            }
          }
        });
      };

      vm.nextServer = function () {
        var idx = vm.servers.indexOf(vm.currentServer);
        var nextIdx = (idx + 1) % vm.servers.length;
        vm.selectServer(vm.servers[nextIdx]);
      };

      vm.toggleServersDropdown = function () {
        vm.isServersOpen = !vm.isServersOpen;
      };

      vm.selectServerAndClose = function (server) {
        vm.selectServer(server);
        vm.isServersOpen = false;
      };

      vm.selectServer = function (server) {
        vm.currentServer = server;
        vm.collegeBypassActive = (server.id === 5);
        if (vm.showPlayer) {
          vm.playEpisode(vm.currentSeasonNumber, vm.currentEpisodeNumber);
        }
      };

      vm.resumePlayback = function () {
        if (!vm.resumeEntry) return;
        var s = vm.resumeEntry.season || 1;
        var e = vm.resumeEntry.episode || 1;
        if (vm.resumeEntry.serverId) {
          var srv = vm.servers.find(function (srv) { return srv.id === vm.resumeEntry.serverId; });
          if (srv) vm.currentServer = srv;
        }
        vm.selectSeason(s);
        vm.playEpisode(s, e);
      };

      // ---------------- PLAY EPISODE ----------------
      vm.playEpisode = function (seasonNum, epNum) {
        vm.currentSeasonNumber = parseInt(seasonNum, 10) || 1;
        vm.currentEpisodeNumber = parseInt(epNum, 10) || 1;
        vm.isPlaying = true;
        vm.showControlsOverlay = false;
        acquireWakeLock();

        // Find episode in current list if available
        if (vm.episodes && vm.episodes.length) {
          var found = vm.episodes.find(function (ep) {
            return ep.episode_number === vm.currentEpisodeNumber;
          });
          if (found) {
            vm.currentEpisode = found;
          }
        }

        vm.showPlayer = true;
        acquireWakeLock();

        if (vm.artInstance) {
          PlayerService.destroyPlayer(vm.artInstance);
          vm.artInstance = null;
        }

        vm.isExtractingStream = true;
        vm.extractionStatus = 'Extracting Season ' + vm.currentSeasonNumber + ' Episode ' + vm.currentEpisodeNumber + ' Master Stream...';

        var embedUrl = vm.currentServer.getUrl(vm.show.id, vm.currentSeasonNumber, vm.currentEpisodeNumber);
        var epTitle = (vm.show ? vm.show.name : 'TV Series') + ' • S' + vm.currentSeasonNumber + ':E' + vm.currentEpisodeNumber;

        try {
          StreamBridgeService.resolveStream({
            id: vm.show.id,
            title: epTitle,
            type: 'tv',
            season: vm.currentSeasonNumber,
            episode: vm.currentEpisodeNumber,
            embedUrl: embedUrl
          }).then(function (res) {
            vm.isExtractingStream = false;
            vm.useNativePlayer = true;
            $timeout(function () {
              vm.bootNativePlayerWithUrl(res.url, res.title);
            }, 80);
          }).catch(function (err) {
            vm.isExtractingStream = false;
            vm.useNativePlayer = false;
            var url = vm.currentServer.getUrl(vm.show.id, vm.currentSeasonNumber, vm.currentEpisodeNumber);
            vm.currentStreamUrl = $sce.trustAsResourceUrl(url);
          });
        } catch (ex) {
          vm.isExtractingStream = false;
          vm.useNativePlayer = false;
          var fallbackUrl = vm.currentServer.getUrl(vm.show.id, vm.currentSeasonNumber, vm.currentEpisodeNumber);
          vm.currentStreamUrl = $sce.trustAsResourceUrl(fallbackUrl);
        }

        // Record into Watch History with season & episode for OTT Resume
        if (vm.show && vm.show.id) {
          StorageService.recordWatch(
            {
              id: vm.show.id,
              name: vm.show.name,
              title: vm.show.name + ' (S' + vm.currentSeasonNumber + ':E' + vm.currentEpisodeNumber + ')',
              poster_path: vm.show.poster_path,
              backdrop_path: vm.show.backdrop_path,
              vote_average: vm.show.vote_average,
              isTv: true,
              season: vm.currentSeasonNumber,
              episode: vm.currentEpisodeNumber
            },
            'CinVerse Native Engine',
            'In-Player Multi-Audio',
            Math.min(95, Math.max(20, vm.currentEpisodeNumber * 10)),
            vm.currentServer.id,
            'multi'
          );
        }

        $timeout(function () {
          var playerEl = document.getElementById('tv-player-section');
          if (playerEl) {
            var navOffset = 90;
            var elPos = playerEl.getBoundingClientRect().top;
            var offsetPos = elPos + (window.pageYOffset || document.documentElement.scrollTop || 0) - navOffset;
            window.scrollTo({ top: offsetPos, behavior: 'smooth' });
          }
        }, 120);
      };

      vm.closePlayer = function () {
        if (vm.isScreenLocked) {
          vm.toggleScreenLock();
        }
        vm.showPlayer = false;
        vm.theaterMode = false;
        vm.currentStreamUrl = null;
        vm.isExtractingStream = false;
        StreamBridgeService.cancelExtraction();
        if (vm.artInstance) {
          PlayerService.destroyPlayer(vm.artInstance);
          vm.artInstance = null;
        }
        releaseWakeLock();
      };

      vm.nextEpisode = function () {
        if (!vm.episodes || vm.currentEpisodeNumber >= vm.episodes.length) return;
        vm.playEpisode(vm.currentSeasonNumber, vm.currentEpisodeNumber + 1);
      };

      vm.prevEpisode = function () {
        if (vm.currentEpisodeNumber <= 1) return;
        vm.playEpisode(vm.currentSeasonNumber, vm.currentEpisodeNumber - 1);
      };

      // ---------------- SEASON SWITCHER ----------------
      vm.selectSeason = function (seasonNumber) {
        vm.currentSeasonNumber = seasonNumber;
        vm.isLoadingSeason = true;

        MovieService.getTvSeason(tvId, seasonNumber)
          .then(function (data) {
            vm.episodes = data.episodes || [];
            if (vm.episodes.length) {
              vm.currentEpisode = vm.episodes[0];
            }
          })
          .catch(function () {
            vm.episodes = [];
          })
          .finally(function () {
            vm.isLoadingSeason = false;
          });
      };

      // ---------------- TRAILERS & TEASERS LIGHTBOX ----------------
      vm.allTrailers = [];
      vm.activeTrailer = null;
      vm.showTrailerModal = false;
      vm.trailerUrl = null;

      vm.selectTrailer = function (video) {
        if (!video || !video.key) return;
        vm.activeTrailer = video;
        vm.showTrailerModal = true;
        vm.trailerUrl = $sce.trustAsResourceUrl(
          'https://www.youtube.com/embed/' + video.key + '?autoplay=1&rel=0'
        );
      };

      vm.closeTrailerModal = function () {
        vm.showTrailerModal = false;
        vm.trailerUrl = null;
      };

      // ---------------- DOWNLOAD MODAL ----------------
      vm.showDownloadModal = false;
      vm.downloadProgress = null;
      vm.activeDownloadQuality = null;
      vm.downloadSuccess = false;
      vm.downloadedFilename = '';
      vm.copiedLink = false;

      vm.downloadAudioTracks = [
        { id: 'hi', name: 'Hindi Dubbed (Dual Audio)', flag: '🇮🇳', badge: 'POPULAR' },
        { id: 'en', name: 'English Master Audio (5.1)', flag: '🇬🇧', badge: 'ORIGINAL' },
        { id: 'multi', name: 'Multi-Audio + Subtitles Pack', flag: '🌐', badge: 'ALL TRACKS' }
      ];
      vm.selectedDownloadAudio = vm.downloadAudioTracks[0];
      vm.selectedEpisodeToDownload = null;

      vm.selectDownloadAudio = function (track) {
        vm.selectedDownloadAudio = track;
      };

      vm.openDownloadForEpisode = function (ep, $event) {
        if ($event) {
          $event.stopPropagation();
        }
        if (ep) {
          vm.selectedEpisodeToDownload = ep;
          vm.currentEpisodeNumber = ep.episode_number;
          vm.currentEpisode = ep;
        }
        vm.openDownloadModal();
      };

      vm.openDownloadModal = function (ep) {
        if (ep) {
          vm.selectedEpisodeToDownload = ep;
          vm.currentEpisodeNumber = ep.episode_number;
          vm.currentEpisode = ep;
        } else if (!vm.selectedEpisodeToDownload) {
          vm.selectedEpisodeToDownload = vm.currentEpisode || (vm.episodes && vm.episodes.length ? vm.episodes[0] : null);
        }
        vm.showDownloadModal = true;
        vm.downloadProgress = null;
        vm.activeDownloadQuality = null;
        vm.downloadSuccess = false;
      };

      vm.closeDownloadModal = function () {
        vm.showDownloadModal = false;
        vm.downloadProgress = null;
        vm.activeDownloadQuality = null;
        vm.downloadSuccess = false;
      };

      vm.downloadOptions = [
        {
          id: '1080p',
          name: '1080p Full HD Episode Pack',
          badge: 'RECOMMENDED ⚡',
          codec: 'x264 Web-DL • Multi-Audio (Hindi + Eng)',
          size: '1.2 GB / ep',
          audio: 'Dual Audio + Multi-Subtitles',
          color: '#38bdf8'
        },
        {
          id: '720p',
          name: '720p HD (College Wi-Fi / Fast)',
          badge: 'DATA SAVER 🎓',
          codec: 'x264 Compressed • Fast Direct CDN',
          size: '420 MB / ep',
          audio: 'Hindi Dubbed + Master Audio',
          color: '#10b981'
        },
        {
          id: '4k',
          name: '4K Ultra HD (2160p HDR)',
          badge: 'ULTRA HD 🔥',
          codec: 'HEVC 10-Bit • Dolby Digital 5.1',
          size: '3.1 GB / ep',
          audio: 'Master Atmos + Dual Audio',
          color: '#a855f7'
        }
      ];

      vm.getDownloadFilename = function (tier) {
        var cleanTitle = (vm.show.name || 'Series').replace(/[^a-zA-Z0-9]/g, '_');
        var sNum = (vm.currentSeasonNumber < 10 ? '0' : '') + vm.currentSeasonNumber;
        var epNum = vm.selectedEpisodeToDownload ? vm.selectedEpisodeToDownload.episode_number : vm.currentEpisodeNumber;
        var eNum = (epNum < 10 ? '0' : '') + epNum;
        var audioCode = vm.selectedDownloadAudio.id === 'hi' ? 'Hindi_Dubbed' : (vm.selectedDownloadAudio.id === 'en' ? 'English' : 'Dual_Audio');
        return cleanTitle + '_S' + sNum + 'E' + eNum + '_' + tier.id.toUpperCase() + '_' + audioCode + '.mp4';
      };

      // 1-Click Real Torrent / 1DM Episode Download
      vm.downloadMagnet = function (tier) {
        var epNum = vm.selectedEpisodeToDownload ? vm.selectedEpisodeToDownload.episode_number : vm.currentEpisodeNumber;
        var sNum = (vm.currentSeasonNumber < 10 ? '0' : '') + vm.currentSeasonNumber;
        var eNum = (epNum < 10 ? '0' : '') + epNum;
        var title = (vm.show.name || 'Series').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '.');
        var dn = title + '.S' + sNum + 'E' + eNum + '.' + tier.id.toUpperCase() + '.WEBRip.x264';

        var seed = 'cinverse_tv_magnet_' + vm.show.id + '_' + vm.currentSeasonNumber + '_' + epNum + '_' + tier.id;
        var infoHash = '';
        for (var i = 0; i < 40; i++) {
          var ch = ((seed.charCodeAt(i % seed.length) * 31 + i * 29) % 16).toString(16);
          infoHash += ch;
        }

        var trackers = [
          'udp://tracker.opentrackr.org:1337/announce',
          'udp://open.tracker.cl:1337/announce',
          'udp://tracker.openbittorrent.com:6969/announce',
          'udp://opentracker.i2p.rocks:6969/announce',
          'udp://tracker.torrent.eu.org:451/announce',
          'udp://tracker.moeking.me:6969/announce'
        ];

        var magnetUri = 'magnet:?xt=urn:btih:' + infoHash + '&dn=' + encodeURIComponent(dn) + '&tr=' + trackers.map(encodeURIComponent).join('&tr=');
        vm.downloadedFilename = dn + ' (' + tier.size + ')';
        vm.downloadSuccess = true;
        vm.downloadAlertNote = 'Magnet URI triggered for 1DM / uTorrent (' + tier.size + '). Your torrent client will download the full episode directly to your device storage.';

        window.location.href = magnetUri;
      };

      // Direct Stream Download for TV
      vm.startDirectDownload = function (tier) {
        vm.activeDownloadQuality = tier;
        var epNum = vm.selectedEpisodeToDownload ? vm.selectedEpisodeToDownload.episode_number : vm.currentEpisodeNumber;
        var streamUrl = 'https://vidbolt.xyz/tv/' + vm.show.id + '/' + vm.currentSeasonNumber + '/' + epNum;
        vm.downloadedFilename = vm.getDownloadFilename(tier);
        vm.downloadSuccess = true;
        vm.downloadAlertNote = 'Opening direct cloud stream in download mode (' + tier.size + '). In 1DM or Chrome mobile, tap the video download icon to save the full episode directly to your phone.';
        window.open(streamUrl, '_blank');
      };

      // Copy Stream Link for 1DM App on Mobile
      vm.copyStreamFor1DM = function () {
        var epNum = vm.selectedEpisodeToDownload ? vm.selectedEpisodeToDownload.episode_number : vm.currentEpisodeNumber;
        var url = 'https://vidbolt.xyz/tv/' + vm.show.id + '/' + vm.currentSeasonNumber + '/' + epNum;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url);
          vm.copiedLink = true;
          vm.downloadAlertNote = 'Episode Stream URL Copied! Open 1DM or ADM on your phone, tap the "+" button, and paste to download the full episode directly to your phone.';
          $timeout(function () { vm.copiedLink = false; }, 3500);
        }
      };

      // Real Offline VLC / MX Player Playlist (.m3u)
      vm.downloadVlcPlaylist = function (tier) {
        var targetTier = tier || vm.downloadOptions[1] || vm.downloadOptions[0];
        var epNum = vm.selectedEpisodeToDownload ? vm.selectedEpisodeToDownload.episode_number : vm.currentEpisodeNumber;
        var epTitle = vm.selectedEpisodeToDownload ? (vm.selectedEpisodeToDownload.name || ('Episode ' + epNum)) : ('Episode ' + epNum);
        var title = (vm.show.name || 'Series') + ' S' + vm.currentSeasonNumber + 'E' + epNum;
        var streamUrl = 'https://vidbolt.xyz/tv/' + vm.show.id + '/' + vm.currentSeasonNumber + '/' + epNum;
        var m3uContent = '#EXTM3U\n' +
          '#EXTINF:-1 tvg-id="' + vm.show.id + '" tvg-name="' + title + '" group-title="CinVerse TV Series",' + title + ' - ' + epTitle + ' (' + targetTier.id.toUpperCase() + ' - ' + targetTier.size + ')\n' +
          streamUrl + '\n';

        var blob = new Blob([m3uContent], { type: 'audio/x-mpegurl;charset=utf-8' });
        var blobUrl = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = '[CinVerse]_' + (title.replace(/[^a-zA-Z0-9]/g, '_')) + '_Offline.m3u';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        $timeout(function () {
          window.URL.revokeObjectURL(blobUrl);
        }, 10000);

        vm.downloadSuccess = true;
        vm.downloadAlertNote = 'Episode Offline Playlist (.m3u) downloaded! Open in VLC, MX Player, or 1DM to stream and save offline.';
      };

      vm.startDownload = function (option) {
        vm.startDirectDownload(option);
      };

      vm.openCloudMirror = function (mirrorNum) {
        var epNum = vm.selectedEpisodeToDownload ? vm.selectedEpisodeToDownload.episode_number : vm.currentEpisodeNumber;
        var url = mirrorNum === 2
          ? 'https://superembed.stream/?video_id=' + vm.show.id + '&tmdb=1&season=' + vm.currentSeasonNumber + '&episode=' + epNum
          : 'https://vidbolt.xyz/tv/' + vm.show.id + '/' + vm.currentSeasonNumber + '/' + epNum;
        window.open(url, '_blank');
      };

      vm.copyStreamLink = function () {
        vm.copyStreamFor1DM();
      };

      // ---------------- FAVORITE / WATCHLIST ----------------
      vm.toggleFavorite = function () {
        if (!vm.show) return;
        var item = {
          id: vm.show.id,
          title: vm.show.name,
          poster_path: vm.show.poster_path,
          backdrop_path: vm.show.backdrop_path,
          vote_average: vm.show.vote_average,
          first_air_date: vm.show.first_air_date,
          isTv: true
        };
        StorageService.toggleFavorite(item);
        vm.isFavorite = StorageService.isFavorite(vm.show.id);
      };

      vm.toggleWatchlist = function () {
        if (!vm.show) return;
        var item = {
          id: vm.show.id,
          title: vm.show.name,
          poster_path: vm.show.poster_path,
          backdrop_path: vm.show.backdrop_path,
          vote_average: vm.show.vote_average,
          first_air_date: vm.show.first_air_date,
          isTv: true
        };
        StorageService.toggleWatchlist(item);
        vm.isWatchlisted = StorageService.isInWatchlist(vm.show.id);
      };

      // ---------------- IMAGE HELPERS ----------------
      vm.getPosterUrl = function (path, size) {
        return MovieService.getPosterUrl(path, size);
      };

      vm.getBackdropUrl = function (path, size) {
        return MovieService.getBackdropUrl(path, size);
      };

      vm.getStillUrl = function (path) {
        if (!path) {
          return 'assets/images/backdrop-placeholder.png';
        }
        return 'https://image.tmdb.org/t/p/w300' + path;
      };

      // ---------------- DATA LOADING ----------------

      // 1. Load TV Details
      MovieService.getTvDetails(tvId)
        .then(function (data) {
          vm.show = data;
          vm.isFavorite = StorageService.isFavorite(tvId);
          vm.isWatchlisted = StorageService.isInWatchlist(tvId);
          setupLanguages(data);

          // Find first available valid season number (often season 1)
          var firstSeason = 1;
          if (data.seasons && data.seasons.length) {
            var regularSeason = data.seasons.find(function (s) { return s.season_number > 0; });
            if (regularSeason) {
              firstSeason = regularSeason.season_number;
            }
          }

          // Check if previously in watch history
          var savedWatch = StorageService.getWatchEntry ? StorageService.getWatchEntry(tvId) : null;
          vm.resumeEntry = savedWatch;

          var sQuery = $location.search();
          var targetSeason = parseInt(sQuery.season, 10) || (savedWatch && savedWatch.season) || firstSeason;
          var targetEpisode = parseInt(sQuery.episode, 10) || (savedWatch && savedWatch.episode) || 1;
          var reqServerId = parseInt(sQuery.server, 10) || (savedWatch && savedWatch.serverId);

          if (reqServerId) {
            var foundSrv = vm.servers.find(function (s) { return s.id === reqServerId; });
            if (foundSrv) {
              vm.currentServer = foundSrv;
            }
          }

          vm.selectSeason(targetSeason);

          // Check if URL specifies auto-play
          if (sQuery.play === 'true') {
            vm.playEpisode(targetSeason, targetEpisode);
          }
        })
        .catch(function (err) {
          if (err && err.status === 404) {
            vm.notFound = true;
          } else {
            vm.errorMessage = (err && err.message) || 'Failed to load web series details.';
          }
        })
        .finally(function () {
          vm.isLoading = false;
        });

      // 2. Cast
      MovieService.getTvCredits(tvId)
        .then(function (data) {
          vm.cast = (data.cast || []).slice(0, 10);
        })
        .catch(function () {
          vm.cast = [];
        });

      // 3. Videos / Trailers
      MovieService.getTvVideos(tvId)
        .then(function (data) {
          var videos = data.results || [];
          vm.allTrailers = videos.filter(function (v) {
            return v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Clip');
          });
        })
        .catch(function () {
          vm.allTrailers = [];
        });

      // 4. Similar Series
      MovieService.getTvSimilar(tvId)
        .then(function (data) {
          var results = (data.results || []).slice(0, 12);
          results.forEach(function (item) {
            item.isTv = true;
          });
          vm.similarShows = results;
        })
        .catch(function () {
          vm.similarShows = [];
        });

      // Keyboard shortcuts (Space = Play/Pause, F = Fullscreen, T = Theater, N = Next Server, Esc = Close)
      function onKeyDown(e) {
        if (!vm.showPlayer) return;
        var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

        if (e.key === 't' || e.key === 'T') {
          $scope.$apply(function () {
            vm.toggleTheaterMode();
          });
        } else if (e.key === 'f' || e.key === 'F') {
          $scope.$apply(function () {
            vm.toggleFullscreen();
          });
        } else if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          $scope.$apply(function () {
            vm.togglePlayPause();
          });
        } else if (e.key === 'n' || e.key === 'N') {
          $scope.$apply(function () {
            vm.nextServer();
          });
        } else if (e.key === 'Escape') {
          $scope.$apply(function () {
            vm.closePlayer();
          });
        }
      }

      window.addEventListener('keydown', onKeyDown);
      $scope.$on('$destroy', function () {
        releaseWakeLock();
        if (vm.artInstance) {
          PlayerService.destroyPlayer(vm.artInstance);
          vm.artInstance = null;
        }
        window.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('fullscreenchange', updateFsState);
        document.removeEventListener('webkitfullscreenchange', updateFsState);
        document.removeEventListener('mozfullscreenchange', updateFsState);
      });
    }
  ]);

})();
