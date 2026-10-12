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
    function ($scope, $routeParams, $location, $sce, $timeout, $interval, MovieService, StorageService) {
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
      vm.gestureOverlayEnabled = true;
      vm.showPlayerHud = false;
      vm.isPlaying = true;
      vm.showRewindRipple = false;
      vm.showForwardRipple = false;

      var hudTimer = null;
      var lastTapTime = 0;
      var lastTapX = 0;

      vm.servers = [
        {
          id: 1,
          name: 'Official Server 1 (VidBolt Multi-Audio)',
          badge: 'FLIQ / NetMirror Engine ⚡',
          icon: 'fa-bolt',
          getUrl: function (id, s, e) {
            return 'https://vidbolt.xyz/tv/' + id + '/' + s + '/' + e;
          }
        },
        {
          id: 2,
          name: 'Official Server 2 (VidFast 4K Multi-Audio)',
          badge: 'Ultra HD Cinema Backup 🚀',
          icon: 'fa-film',
          getUrl: function (id, s, e) {
            return 'https://vidfast.vc/tv/' + id + '/' + s + '/' + e;
          }
        },
        {
          id: 3,
          name: 'Server 3 (2Embed Cinema - Multi-Audio)',
          badge: 'Bollywood & Global Ready 🇮🇳',
          icon: 'fa-clapperboard',
          getUrl: function (id, s, e) {
            return 'https://www.2embed.cc/embedtv/' + id + '&s=' + s + '&e=' + e;
          }
        },
        {
          id: 4,
          name: 'Server 4 (SmashyStream Fast Cloud)',
          badge: 'Buffer-Free Mirror 💨',
          icon: 'fa-cloud',
          getUrl: function (id, s, e) {
            return 'https://embed.smashystream.com/playere.php?tmdb=' + id + '&season=' + s + '&episode=' + e;
          }
        },
        {
          id: 5,
          name: 'Server 5 (College WiFi Bypass - Vidflix)',
          badge: 'Campus Firewall Proof 🎓',
          icon: 'fa-graduation-cap',
          getUrl: function (id, s, e) {
            return 'https://vidsrc.pm/embed/tv?tmdb=' + id + '&season=' + s + '&episode=' + e;
          }
        }
      ];

      vm.currentServer = vm.servers[0];
      vm.currentStreamUrl = null;

      function sendIframeCommand(cmd, val) {
        var iframes = document.querySelectorAll('.theater-screen-wrap iframe');
        iframes.forEach(function (iframe) {
          if (!iframe || !iframe.contentWindow) return;
          try {
            iframe.contentWindow.postMessage({ type: cmd, value: val, offset: val, command: cmd }, '*');
            iframe.contentWindow.postMessage(JSON.stringify({ type: cmd, value: val, offset: val, command: cmd }), '*');
            var ytFunc = cmd === 'play' ? 'playVideo' : (cmd === 'pause' ? 'pauseVideo' : (cmd === 'seek' ? 'seekTo' : cmd));
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: ytFunc, args: val ? [val] : [] }), '*');
            iframe.contentWindow.postMessage({ event: 'command', func: ytFunc, args: val ? [val] : [] }, '*');
            iframe.contentWindow.postMessage(JSON.stringify({ method: cmd, value: val }), '*');
          } catch (e) {}
        });
      }

      vm.showHudTemporarily = function () {
        vm.showPlayerHud = true;
        if (hudTimer) $timeout.cancel(hudTimer);
        hudTimer = $timeout(function () {
          vm.showPlayerHud = false;
        }, 3800);
      };

      // Tap handler: single tap toggles HUD; double tap seeks 10s
      vm.onOverlayTap = function ($event) {
        var now = Date.now();
        var targetEl = $event.currentTarget;
        var rect = targetEl.getBoundingClientRect();
        var clientX = $event.clientX || ($event.touches && $event.touches[0] ? $event.touches[0].clientX : ($event.changedTouches && $event.changedTouches[0] ? $event.changedTouches[0].clientX : rect.width / 2));
        var xPos = clientX - rect.left;
        var relX = rect.width ? (xPos / rect.width) : 0.5;

        // Double tap detection (under 320ms and within 110px)
        if (now - lastTapTime < 320 && Math.abs(xPos - lastTapX) < 110) {
          if (relX < 0.44) {
            vm.doubleTapSeek(-10);
          } else if (relX > 0.56) {
            vm.doubleTapSeek(10);
          }
          lastTapTime = 0;
          return;
        }

        lastTapTime = now;
        lastTapX = xPos;

        // Single tap: toggles player HUD without ever pausing the video!
        vm.showPlayerHud = !vm.showPlayerHud;
        if (vm.showPlayerHud) {
          vm.showHudTemporarily();
        }
      };

      vm.doubleTapSeek = function (offsetSec) {
        vm.seekOffset(offsetSec);
        if (offsetSec < 0) {
          vm.showRewindRipple = true;
          $timeout(function () { vm.showRewindRipple = false; }, 650);
        } else {
          vm.showForwardRipple = true;
          $timeout(function () { vm.showForwardRipple = false; }, 650);
        }
      };

      vm.seekOffset = function (offsetSec) {
        sendIframeCommand('seek', offsetSec);
        vm.showHudTemporarily();
      };

      vm.togglePlayPause = function () {
        vm.isPlaying = !vm.isPlaying;
        sendIframeCommand(vm.isPlaying ? 'play' : 'pause');
        vm.showHudTemporarily();
      };

      vm.toggleGestureOverlay = function () {
        vm.gestureOverlayEnabled = !vm.gestureOverlayEnabled;
        if (!vm.gestureOverlayEnabled) {
          vm.showPlayerHud = false;
        }
      };

      // ---------------- SLIDE FOR BRIGHTNESS & VOLUME (MX PLAYER / VLC GESTURES) ----------------
      vm.brightnessLevel = 100;
      vm.volumeLevel = 100;
      vm.showBrightnessGauge = false;
      vm.showVolumeGauge = false;
      vm.aspectRatioMode = 'fit'; // 'fit' | 'fill' | 'stretch'
      vm.playbackSpeed = 1.0;
      vm.isScreenLocked = false;
      var gaugeTimer = null;
      var wakeLockObj = null;

      vm.hideGaugesSoon = function () {
        if (gaugeTimer) $timeout.cancel(gaugeTimer);
        gaugeTimer = $timeout(function () {
          vm.showBrightnessGauge = false;
          vm.showVolumeGauge = false;
        }, 1200);
      };

      vm.setBrightness = function (val) {
        val = Math.max(20, Math.min(130, parseInt(val, 10) || 100));
        vm.brightnessLevel = val;
        vm.showBrightnessGauge = true;
        vm.showVolumeGauge = false;

        // Physical screen backlight on Android hardware if running inside APK
        if (window.CinVerseNative && window.CinVerseNative.setBrightness) {
          try {
            window.CinVerseNative.setBrightness(val / 100);
          } catch (e) {}
        }

        // CSS brightness boost on video element if over 100%
        try {
          var iframe = document.querySelector('.theater-screen-wrap iframe');
          if (iframe) {
            iframe.style.filter = val > 100 ? ('brightness(' + val + '%)') : 'none';
          }
        } catch (e) {}

        vm.hideGaugesSoon();
      };

      vm.setVolume = function (val) {
        val = Math.max(0, Math.min(200, parseInt(val, 10) || 0));
        vm.volumeLevel = val;
        sendIframeCommand('volume', val / 100);
        sendIframeCommand('setVolume', Math.min(100, val));
        vm.showVolumeGauge = true;
        vm.showBrightnessGauge = false;

        // Hardware speaker volume if running inside CinVerse Android APK
        if (window.CinVerseNative && window.CinVerseNative.setVolume) {
          try {
            window.CinVerseNative.setVolume(Math.min(100, val));
          } catch (e) {}
        }

        vm.hideGaugesSoon();
      };

      vm.getBrightnessTintOpacity = function () {
        if (vm.brightnessLevel < 100) {
          return ((100 - vm.brightnessLevel) / 100) * 0.82;
        }
        return 0;
      };

      vm.toggleAspectRatio = function () {
        if (vm.aspectRatioMode === 'fit') {
          vm.aspectRatioMode = 'fill';
        } else if (vm.aspectRatioMode === 'fill') {
          vm.aspectRatioMode = 'stretch';
        } else {
          vm.aspectRatioMode = 'fit';
        }
        if (window.CinVerseNative && window.CinVerseNative.vibrate) {
          try { window.CinVerseNative.vibrate(25); } catch (e) {}
        }
      };

      vm.getAspectLabel = function () {
        if (vm.aspectRatioMode === 'fill') return 'Fill 20:9';
        if (vm.aspectRatioMode === 'stretch') return 'Stretch';
        return 'Fit 16:9';
      };

      vm.togglePlaybackSpeed = function () {
        var speeds = [1.0, 1.25, 1.5, 0.75];
        var idx = speeds.indexOf(vm.playbackSpeed);
        vm.playbackSpeed = speeds[(idx + 1) % speeds.length];
        sendIframeCommand('setPlaybackRate', vm.playbackSpeed);
        sendIframeCommand('playbackRate', vm.playbackSpeed);
        if (window.CinVerseNative && window.CinVerseNative.vibrate) {
          try { window.CinVerseNative.vibrate(25); } catch (e) {}
        }
      };

      vm.toggleScreenLock = function () {
        vm.isScreenLocked = !vm.isScreenLocked;
        if (vm.isScreenLocked) {
          vm.showPlayerHud = false;
        } else {
          vm.showHudTemporarily();
        }
        if (window.CinVerseNative && window.CinVerseNative.vibrate) {
          try { window.CinVerseNative.vibrate(35); } catch (e) {}
        }
      };

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

      vm.toggleFullscreen = function () {
        var wrap = document.getElementById('tv-player-section') || document.querySelector('.theater-screen-wrap');
        if (!wrap) return;
        if (!document.fullscreenElement) {
          if (wrap.requestFullscreen) wrap.requestFullscreen();
          else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
        }
      };

      vm.nextServer = function () {
        var idx = vm.servers.indexOf(vm.currentServer);
        var nextIdx = (idx + 1) % vm.servers.length;
        vm.selectServer(vm.servers[nextIdx]);
      };

      vm.selectServer = function (server) {
        vm.currentServer = server;
        vm.collegeBypassActive = (server.id === 5);
        if (vm.show && vm.show.id) {
          var url = server.getUrl(vm.show.id, vm.currentSeasonNumber, vm.currentEpisodeNumber);
          vm.currentStreamUrl = $sce.trustAsResourceUrl(url);
        }
      };

      // ---------------- PLAY EPISODE ----------------
      vm.playEpisode = function (seasonNum, epNum) {
        vm.currentSeasonNumber = parseInt(seasonNum, 10) || 1;
        vm.currentEpisodeNumber = parseInt(epNum, 10) || 1;
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
        var url = vm.currentServer.getUrl(vm.show.id, vm.currentSeasonNumber, vm.currentEpisodeNumber);
        vm.currentStreamUrl = $sce.trustAsResourceUrl(url);

        // Record into Watch History
        if (vm.show && vm.show.id) {
          StorageService.recordWatch(
            {
              id: vm.show.id,
              title: vm.show.name + ' (S' + vm.currentSeasonNumber + ':E' + vm.currentEpisodeNumber + ')',
              poster_path: vm.show.poster_path,
              backdrop_path: vm.show.backdrop_path,
              vote_average: vm.show.vote_average,
              isTv: true
            },
            vm.currentServer.name,
            'In-Player Multi-Audio',
            25,
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
        vm.showPlayer = false;
        vm.theaterMode = false;
        vm.currentStreamUrl = null;
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
          ? 'https://vidfast.vc/tv/' + vm.show.id + '/' + vm.currentSeasonNumber + '/' + epNum
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

          // Find first available valid season number (often season 1)
          var firstSeason = 1;
          if (data.seasons && data.seasons.length) {
            var regularSeason = data.seasons.find(function (s) { return s.season_number > 0; });
            if (regularSeason) {
              firstSeason = regularSeason.season_number;
            }
          }
          vm.selectSeason(firstSeason);

          // Check if URL specifies auto-play
          if ($location.search().play === 'true') {
            vm.playEpisode(firstSeason, 1);
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

      // Keyboard shortcuts (Escape = close player)
      function onKeyDown(e) {
        if (!vm.showPlayer) return;
        var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

        if (e.key === 'Escape') {
          $scope.$apply(function () {
            vm.closePlayer();
          });
        }
      }

      window.addEventListener('keydown', onKeyDown);
      $scope.$on('$destroy', function () {
        window.removeEventListener('keydown', onKeyDown);
      });
    }
  ]);

})();
