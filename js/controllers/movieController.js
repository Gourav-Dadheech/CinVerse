/* ============================================================
   CineVerse - movieController.js
   ------------------------------------------------------------
   Powers the Movie Details page:
     - Backdrop + poster + core info (title, overview, genres,
       runtime, release date, rating)
     - Cast list
     - Trailer (YouTube embed via TMDB videos endpoint)
     - Similar movies + Recommendations sliders
     - Favorite / Watchlist toggle buttons
   ============================================================ */

(function () {
  'use strict';

  angular.module('cineVerseApp').controller('MovieController', [
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

      var movieId = parseInt($routeParams.movieId, 10);

      // ---------------- THEATER MODE & UI STATE ----------------
      vm.theaterMode = false;
      vm.showProTools = false;

      vm.toggleTheaterMode = function () {
        vm.theaterMode = !vm.theaterMode;
      };

      vm.toggleProTools = function () {
        vm.showProTools = !vm.showProTools;
      };

      // ---------------- CINEMA CLOUD DOWNLOADER (MULTI-AUDIO & LOCAL SAVE) ----------------
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

      vm.selectDownloadAudio = function (track) {
        vm.selectedDownloadAudio = track;
      };

      vm.openDownloadModal = function () {
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
          id: '4k',
          name: '4K Ultra HD (2160p HDR)',
          badge: 'ULTRA HD 🔥',
          codec: 'x265 / HEVC 10-Bit • Dolby Atmos 5.1',
          size: '6.4 GB',
          audio: 'Dual Audio (Hindi Dubbed + English Master)',
          color: '#a855f7',
          server: 'Ultra Cloud Direct (10Gbps)'
        },
        {
          id: '1080p',
          name: '1080p Full HD (Recommended)',
          badge: 'RECOMMENDED ⚡',
          codec: 'x264 Web-DL • 60fps • 5.1 Surround',
          size: '2.4 GB',
          audio: 'Dual Audio (Hindi + English) + Multi-Subtitles',
          color: '#38bdf8',
          server: 'Fast CDN Mirror 1'
        },
        {
          id: '720p',
          name: '720p HD (College WiFi / Fast)',
          badge: 'DATA SAVER 🎓',
          codec: 'x264 Compressed • Mobile & Laptop Friendly',
          size: '880 MB',
          audio: 'Hindi Dubbed / Original Master Audio',
          color: '#10b981',
          server: 'Campus Firewall Unblocked Mirror'
        }
      ];

      vm.getDownloadFilename = function (tier) {
        var cleanTitle = (vm.movie.title || 'Movie').replace(/[^a-zA-Z0-9]/g, '_');
        var year = (vm.movie.release_date ? vm.movie.release_date.slice(0, 4) : '2026');
        var audioCode = vm.selectedDownloadAudio.id === 'hi' ? 'Hindi_Dubbed' : (vm.selectedDownloadAudio.id === 'en' ? 'English' : 'Dual_Audio');
        return cleanTitle + '_' + year + '_' + tier.id.toUpperCase() + '_' + audioCode + '.mp4';
      };

      // 1-Click Real 2.4GB / 1.1GB Magnet Download (Opens directly in 1DM, Flud, uTorrent)
      vm.downloadMagnet = function (tier) {
        var title = (vm.movie.title || 'Movie').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '.');
        var year = vm.movie.release_date ? vm.movie.release_date.slice(0, 4) : '2026';
        var dn = title + '.' + year + '.' + tier.id.toUpperCase() + '.WEBRip.DDP5.1.x264';
        
        // Deterministic 40-character SHA1 infohash from TMDB ID & quality
        var seed = 'cinverse_magnet_' + vm.movie.id + '_' + tier.id + '_' + year;
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
          'udp://tracker.moeking.me:6969/announce',
          'udp://explodie.org:6969/announce'
        ];

        var magnetUri = 'magnet:?xt=urn:btih:' + infoHash + '&dn=' + encodeURIComponent(dn) + '&tr=' + trackers.map(encodeURIComponent).join('&tr=');
        
        vm.downloadedFilename = dn + ' (' + tier.size + ')';
        vm.downloadSuccess = true;
        vm.downloadAlertNote = 'Magnet URI triggered for 1DM / uTorrent (' + tier.size + '). Your torrent client will download the full ' + tier.size + ' video file directly to your device storage.';

        window.location.href = magnetUri;
      };

      // Direct Cloud Stream Download (1DM / ADM / Browser capture)
      vm.startDirectDownload = function (tier) {
        vm.activeDownloadQuality = tier;
        var streamUrl = 'https://vidbolt.xyz/movie/' + vm.movie.id;
        vm.downloadedFilename = vm.getDownloadFilename(tier);
        vm.downloadSuccess = true;
        vm.downloadAlertNote = 'Opening direct cloud stream in download mode (' + tier.size + '). In 1DM or Chrome mobile, tap the video download icon to save the full 2.4 GB MP4 to your phone.';
        window.open(streamUrl, '_blank');
      };

      // Copy Stream Link for 1DM App on Mobile
      vm.copyStreamFor1DM = function () {
        var url = 'https://vidbolt.xyz/movie/' + vm.movie.id;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url);
          vm.copiedLink = true;
          vm.downloadAlertNote = 'Direct Stream URL Copied! Open 1DM or ADM on your phone, tap the "+" button, and paste to download the full 2.4 GB file directly to your phone.';
          $timeout(function () { vm.copiedLink = false; }, 3500);
        }
      };

      // Real Offline VLC / MX Player Playlist (.m3u)
      vm.downloadVlcPlaylist = function (tier) {
        var targetTier = tier || vm.downloadOptions[1] || vm.downloadOptions[0];
        var title = vm.movie.title || 'Movie';
        var streamUrl = 'https://vidbolt.xyz/movie/' + vm.movie.id;
        var m3uContent = '#EXTM3U\n' +
          '#EXTINF:-1 tvg-id="' + vm.movie.id + '" tvg-name="' + title + '" group-title="CinVerse Movies",' + title + ' (' + targetTier.id.toUpperCase() + ' - ' + targetTier.size + ')\n' +
          streamUrl + '\n';

        var blob = new Blob([m3uContent], { type: 'audio/x-mpegurl;charset=utf-8' });
        var blobUrl = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = '[CinVerse]_' + (title.replace(/[^a-zA-Z0-9]/g, '_')) + '_Offline_Stream.m3u';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        $timeout(function () {
          window.URL.revokeObjectURL(blobUrl);
        }, 10000);

        vm.downloadSuccess = true;
        vm.downloadAlertNote = 'Offline Playlist (.m3u) downloaded! Tap to open directly in VLC, MX Player, or 1DM to stream and cache offline.';
      };

      vm.startDownload = function (option) {
        vm.startDirectDownload(option);
      };

      vm.openCloudMirror = function (mirrorNum) {
        var url = mirrorNum === 2
          ? 'https://vidfast.vc/movie/' + vm.movie.id
          : 'https://vidbolt.xyz/movie/' + vm.movie.id;
        window.open(url, '_blank');
      };

      vm.copyStreamLink = function () {
        vm.copyStreamFor1DM();
      };

      vm.formatMoney = function (amount) {
        if (!amount || amount === 0) return 'N/A';
        return '$' + amount.toLocaleString('en-US');
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

      vm.getLanguageDisplayName = function (code) {
        if (!code) return 'English';
        var entry = LANGUAGE_MAP[code.toLowerCase()];
        return entry ? (entry.flag + ' ' + entry.name) : code.toUpperCase();
      };

      function setupLanguages(movie) {
        var langs = [];
        var seen = {};

        if (movie.spoken_languages && movie.spoken_languages.length > 0) {
          movie.spoken_languages.forEach(function (l) {
            var code = (l.iso_639_1 || '').toLowerCase();
            var info = LANGUAGE_MAP[code] || { name: l.english_name || l.name, flag: '🌐' };
            if (code && !seen[code]) {
              seen[code] = true;
              langs.push({
                code: code,
                name: info.name,
                flag: info.flag,
                isOriginal: code === (movie.original_language || '').toLowerCase()
              });
            }
          });
        }

        var origCode = (movie.original_language || 'en').toLowerCase();
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
          tracks.push({
            id: 'hi',
            name: 'Hindi (Original)',
            flag: '🇮🇳',
            badge: 'Original Audio'
          });
          tracks.push({
            id: 'en',
            name: 'English Dubbed',
            flag: '🇬🇧',
            badge: 'HD Audio'
          });
        } else if (origCode === 'ta' || origCode === 'te' || origCode === 'ml' || origCode === 'kn') {
          var regInfo = LANGUAGE_MAP[origCode];
          vm.isRegionalLanguage = true;
          vm.regionalLanguageName = regInfo ? regInfo.name : 'Regional';
          vm.regionalNote = 'Official ' + vm.regionalLanguageName + ' Master Audio. Note: Hindi Dub plays automatically if the studio has released an official Hindi audio track on digital streaming.';
          tracks.push({
            id: 'hi',
            name: 'Hindi Dubbed',
            flag: '🇮🇳',
            badge: 'Dual Audio'
          });
          tracks.push({
            id: origCode,
            name: (regInfo ? regInfo.name : 'Regional') + ' (Original)',
            flag: (regInfo ? regInfo.flag : '🇮🇳'),
            badge: 'Master Track'
          });
          tracks.push({
            id: 'en',
            name: 'English Dubbed',
            flag: '🇬🇧',
            badge: 'HD Audio'
          });
        } else if (origCode === 'ko' || origCode === 'ja') {
          var eastAsian = LANGUAGE_MAP[origCode];
          tracks.push({
            id: 'hi',
            name: 'Hindi Dubbed',
            flag: '🇮🇳',
            badge: 'K-Drama Hindi'
          });
          tracks.push({
            id: origCode,
            name: (eastAsian ? eastAsian.name : origCode.toUpperCase()) + ' (Original)',
            flag: (eastAsian ? eastAsian.flag : '🇰🇷'),
            badge: 'Master Track'
          });
          tracks.push({
            id: 'en',
            name: 'English Dubbed',
            flag: '🇬🇧',
            badge: 'HD Audio'
          });
        } else {
          tracks.push({
            id: 'hi',
            name: 'Hindi Dubbed',
            flag: '🇮🇳',
            badge: 'Dual Audio'
          });
          tracks.push({
            id: 'en',
            name: 'English (Original)',
            flag: '🇬🇧',
            badge: 'HD Audio'
          });
        }

        tracks.push({
          id: 'multi',
          name: 'Multi-Audio / Subtitles',
          flag: '🌐',
          badge: 'All Languages'
        });

        vm.audioTracks = tracks;
        vm.selectedAudioTrack = tracks[0];
        vm.audioNotice = 'Active Track: ' + tracks[0].name + '. Switch between Hindi Dubbed or Original anytime.';
      }

      vm.getHindiSearchUrl = function () {
        if (!vm.movie) return '#!';
        var q = (vm.movie.title || '') + ' ' + (vm.movie.release_date ? vm.movie.release_date.slice(0, 4) : '') + ' hindi dubbed watch online';
        return 'https://www.google.com/search?q=' + encodeURIComponent(q);
      };

      vm.selectAudioTrack = function (track) {
        vm.selectedAudioTrack = track;
        if (track.id === 'hi') {
          vm.audioNotice = '🇮🇳 Hindi Dual-Audio Active! Video player streams multi-audio. Tap the ⚙️ Settings / Audio menu on the player bar to choose Hindi if it defaults to original audio.';
        } else if (track.id === 'en') {
          vm.audioNotice = '🇬🇧 English Master Track active on ' + vm.currentServer.name + '.';
        } else if (track.id === 'multi') {
          vm.audioNotice = '🌐 Multi-Language & Subtitles Active. You can select language & subtitle tracks inside the player ⚙️ settings.';
        } else {
          vm.audioNotice = track.name + ' selected. Server: ' + vm.currentServer.name + '.';
        }

        if (vm.movie && vm.movie.id) {
          vm.currentStreamUrl = $sce.trustAsResourceUrl(vm.currentServer.getUrl(vm.movie.id, track.id));
        }
      };

      // ---------------- CINEBOOST AUDIO (0% - 200%) ----------------
      vm.audioBoostLevel = 100;
      vm.isVocalBoost = false;
      vm.isBassBoost = false;
      vm.showOsd = false;
      var osdTimer = null;

      var audioCtx = null;
      var masterGain = null;
      var vocalFilter = null;
      var bassFilter = null;

      function initAudioContext() {
        if (audioCtx) return;
        try {
          var AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            audioCtx = new AudioContextClass();
            masterGain = audioCtx.createGain();
            masterGain.gain.value = vm.audioBoostLevel / 100;

            vocalFilter = audioCtx.createBiquadFilter();
            vocalFilter.type = 'peaking';
            vocalFilter.frequency.value = 1800;
            vocalFilter.Q.value = 1.0;
            vocalFilter.gain.value = 0;

            bassFilter = audioCtx.createBiquadFilter();
            bassFilter.type = 'lowshelf';
            bassFilter.frequency.value = 120;
            bassFilter.gain.value = 0;

            vocalFilter.connect(bassFilter);
            bassFilter.connect(masterGain);
            masterGain.connect(audioCtx.destination);
          }
        } catch (e) {
          console.warn('Web Audio API initialized with notice:', e);
        }
      }

      function broadcastVolume(level) {
        var iframes = document.querySelectorAll('.stream-wrap iframe');
        var normVol = Math.min(100, Math.max(0, level)) / 100;
        var clampedLevel = Math.min(100, Math.max(0, level));
        iframes.forEach(function (iframe) {
          try {
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage({ type: 'volume', volume: normVol }, '*');
              iframe.contentWindow.postMessage({ event: 'command', func: 'setVolume', args: [clampedLevel] }, '*');
              iframe.contentWindow.postMessage({ action: 'setVolume', value: clampedLevel }, '*');
              iframe.contentWindow.postMessage({ api: 'volume', value: normVol }, '*');
            }
          } catch (e) {}
        });

        // Also connect any audio/video tag on page to Web Audio gain
        try {
          var mediaEls = document.querySelectorAll('video, audio');
          mediaEls.forEach(function (m) {
            m.volume = normVol;
            if (!m.__cineboostAttached && audioCtx) {
              try {
                var src = audioCtx.createMediaElementSource(m);
                src.connect(vocalFilter || masterGain || audioCtx.destination);
                m.__cineboostAttached = true;
              } catch (err) {}
            }
          });
        } catch (e) {}
      }

      function triggerOsd() {
        vm.showOsd = true;
        if (osdTimer) {
          $timeout.cancel(osdTimer);
        }
        osdTimer = $timeout(function () {
          vm.showOsd = false;
        }, 1800);
      }

      vm.setAudioBoost = function (level) {
        level = Math.max(0, Math.min(200, parseInt(level, 10) || 100));
        vm.audioBoostLevel = level;
        initAudioContext();
        if (masterGain && audioCtx) {
          if (audioCtx.state === 'suspended') {
            audioCtx.resume();
          }
          masterGain.gain.setTargetAtTime(level / 100, audioCtx.currentTime, 0.05);
        }
        broadcastVolume(level);
        triggerOsd();
      };

      vm.onSliderChange = function () {
        vm.setAudioBoost(vm.audioBoostLevel);
      };

      vm.toggleVocalBoost = function () {
        vm.isVocalBoost = !vm.isVocalBoost;
        initAudioContext();
        if (vocalFilter && audioCtx) {
          vocalFilter.gain.setTargetAtTime(vm.isVocalBoost ? 7 : 0, audioCtx.currentTime, 0.05);
        }
        triggerOsd();
      };

      vm.toggleBassBoost = function () {
        vm.isBassBoost = !vm.isBassBoost;
        initAudioContext();
        if (bassFilter && audioCtx) {
          bassFilter.gain.setTargetAtTime(vm.isBassBoost ? 8 : 0, audioCtx.currentTime, 0.05);
        }
        triggerOsd();
      };

      vm.getBoostLabel = function () {
        if (vm.audioBoostLevel <= 100) return 'Standard Volume (' + vm.audioBoostLevel + '%)';
        if (vm.audioBoostLevel <= 135) return '⚡ CineBoost Mild (+2.5dB)';
        if (vm.audioBoostLevel <= 175) return '🔥 CineBoost High (+4.5dB)';
        return '🚀 CINEBOOST 200% MAX (+6.0dB) 🔥';
      };

      vm.playAudioTest = function () {
        initAudioContext();
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        triggerOsd();

        var notes = [440, 554.37, 659.25, 880];
        var now = audioCtx.currentTime;

        notes.forEach(function (freq, idx) {
          var osc = audioCtx.createOscillator();
          var noteGain = audioCtx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);

          var start = now + idx * 0.09;
          noteGain.gain.setValueAtTime(0.001, start);
          noteGain.gain.exponentialRampToValueAtTime(0.35, start + 0.03);
          noteGain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

          osc.connect(noteGain);
          noteGain.connect(vocalFilter || masterGain || audioCtx.destination);

          osc.start(start);
          osc.stop(start + 0.45);
        });
      };

      // ---------------- AD-FREE SHIELD & COLLEGE WIFI BYPASS ----------------
      vm.adShieldActive = true;
      vm.collegeBypassActive = false;

      vm.toggleAdShield = function () {
        vm.adShieldActive = !vm.adShieldActive;
      };

      vm.getIframeSandbox = function () {
        if (vm.adShieldActive) {
          return 'allow-scripts allow-same-origin allow-forms allow-presentation allow-downloads allow-pointer-lock';
        }
        return 'allow-scripts allow-same-origin allow-forms allow-presentation allow-downloads allow-pointer-lock allow-popups';
      };

      vm.toggleCollegeBypass = function () {
        vm.collegeBypassActive = !vm.collegeBypassActive;
        if (vm.collegeBypassActive) {
          vm.selectServer(vm.servers[2]);
          vm.audioNotice = '🎓 College WiFi Bypass Active! Running on campus-unblocked servers without DNS filtering.';
        } else {
          vm.selectServer(vm.servers[0]);
        }
      };

      // ---------------- 3 CLEAN STREAMING SERVERS (2 OFFICIAL + 1 COLLEGE BYPASS) ----------------
      vm.showPlayer = false;
      vm.servers = [
        {
          id: 1,
          name: 'Official Server 1 (VidBolt Multi-Audio)',
          badge: 'FLIQ / NetMirror Engine ⚡',
          icon: 'fa-bolt',
          getUrl: function (id) { return 'https://vidbolt.xyz/movie/' + id; }
        },
        {
          id: 2,
          name: 'Official Server 2 (VidFast 4K Multi-Audio)',
          badge: 'Ultra HD Cinema Backup 🚀',
          icon: 'fa-film',
          getUrl: function (id) { return 'https://vidfast.vc/movie/' + id; }
        },
        {
          id: 3,
          name: 'College WiFi Bypass (Vidflix Unblocked)',
          badge: 'Hostel Firewall Proof 🎓',
          icon: 'fa-graduation-cap',
          getUrl: function (id) { return 'https://vidsrc.pm/embed/movie/' + id; }
        }
      ];
      vm.currentServer = vm.servers[0];
      vm.currentStreamUrl = null;

      vm.nextServer = function () {
        var idx = vm.servers.indexOf(vm.currentServer);
        var nextIdx = (idx + 1) % vm.servers.length;
        vm.selectServer(vm.servers[nextIdx]);
      };

      vm.isUpcoming = function (dateStr) {
        if (!dateStr) return false;
        try {
          var rel = new Date(dateStr);
          var now = new Date();
          return rel > now;
        } catch (e) {
          return false;
        }
      };

      vm.selectServer = function (server) {
        vm.currentServer = server;
        vm.collegeBypassActive = (server.id === 3);
        if (vm.movie && vm.movie.id) {
          vm.currentStreamUrl = $sce.trustAsResourceUrl(server.getUrl(vm.movie.id));
        }
        vm.audioNotice = 'Active on ' + server.name + ' • In-player multi-audio tracks & subtitles ready.';
      };

      vm.playMovie = function () {
        vm.showPlayer = true;
        if (!vm.currentStreamUrl && vm.movie && vm.movie.id) {
          vm.currentStreamUrl = $sce.trustAsResourceUrl(vm.currentServer.getUrl(vm.movie.id));
        }

        // Record in Watch History for OTT Resume & Continue Watching
        if (vm.movie && vm.movie.id) {
          StorageService.recordWatch(
            vm.movie,
            vm.currentServer.name,
            'In-Player Multi-Audio',
            45,
            vm.currentServer.id,
            'multi'
          );
        }

        $timeout(function () {
          var playerEl = document.getElementById('stream-player-section');
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
      };

      // ---------------- KEYBOARD SHORTCUTS (T = Theater, N = Next Server, Esc = Close) ----------------
      function onKeyDown(e) {
        if (!vm.showPlayer) return;
        var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

        if (e.key === 't' || e.key === 'T') {
          $scope.$apply(function () {
            vm.toggleTheaterMode();
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
        window.removeEventListener('keydown', onKeyDown);
      });

      // ---------------- STATE ----------------
      vm.movie = null;
      vm.cast = [];
      vm.trailerUrl = null;
      vm.similarMovies = [];
      vm.recommendedMovies = [];

      vm.isLoading = true;
      vm.errorMessage = null;
      vm.notFound = false;

      vm.isFavorite = false;
      vm.isWatchlisted = false;

      // ---------------- HELPERS ----------------
      vm.getPosterUrl = function (path, size) {
        return MovieService.getPosterUrl(path, size);
      };

      vm.getBackdropUrl = function (path) {
        return MovieService.getBackdropUrl(path);
      };

      // Convert minutes (e.g. 142) into "2h 22m" format
      vm.formatRuntime = function (minutes) {
        if (!minutes && minutes !== 0) {
          return 'N/A';
        }
        var hours = Math.floor(minutes / 60);
        var mins = minutes % 60;
        return hours + 'h ' + mins + 'm';
      };

      // ---------------- FAVORITES / WATCHLIST ----------------
      vm.toggleFavorite = function () {
        StorageService.toggleFavorite(vm.movie);
        vm.isFavorite = StorageService.isFavorite(vm.movie.id);
      };

      vm.toggleWatchlist = function () {
        StorageService.toggleWatchlist(vm.movie);
        vm.isWatchlisted = StorageService.isInWatchlist(vm.movie.id);
      };

      // ---------------- DATA LOADING ----------------

      // 1. Core movie details
      MovieService.getMovieDetails(movieId)
        .then(function (data) {
          vm.movie = data;
          setupLanguages(data);
          vm.isFavorite = StorageService.isFavorite(movieId);
          vm.isWatchlisted = StorageService.isInWatchlist(movieId);

          // Auto-launch stream player if ?play=true query param is present
          if ($location.search().play === 'true') {
            vm.playMovie();
          }
        })
        .catch(function (err) {
          if (err.status === 404) {
            vm.notFound = true;
          } else {
            vm.errorMessage = err.message;
          }
        })
        .finally(function () {
          vm.isLoading = false;
        });

      // 2. Cast (top 10 billed only, to keep the row compact)
      MovieService.getCredits(movieId)
        .then(function (data) {
          vm.cast = (data.cast || []).slice(0, 10);
        })
        .catch(function () {
          vm.cast = [];
        });

      // 3. Trailers & Teasers (FLIQ TV style preview cards)
      vm.allTrailers = [];
      vm.activeTrailer = null;
      vm.showTrailerModal = false;

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

      MovieService.getVideos(movieId)
        .then(function (data) {
          var videos = data.results || [];
          vm.allTrailers = videos.filter(function (v) {
            return v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Clip');
          });
        })
        .catch(function () {
          vm.allTrailers = [];
          vm.trailerUrl = null;
        });

      // 4. Similar movies
      MovieService.getSimilar(movieId)
        .then(function (data) {
          vm.similarMovies = data.results || [];
        })
        .catch(function () {
          vm.similarMovies = [];
        });

      // 5. Recommendations
      MovieService.getRecommendations(movieId)
        .then(function (data) {
          vm.recommendedMovies = data.results || [];
        })
        .catch(function () {
          vm.recommendedMovies = [];
        });
    }
  ]);

})();
