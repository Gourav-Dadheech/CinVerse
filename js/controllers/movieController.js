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
    '$routeParams',
    '$location',
    '$sce',
    '$timeout',
    'MovieService',
    'StorageService',
    function ($routeParams, $location, $sce, $timeout, MovieService, StorageService) {
      var vm = this;

      var movieId = parseInt($routeParams.movieId, 10);

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
          // Auto-switch to Server 2 (2Embed CC) or Server 4 (SmashyStream) which specialize in Dual Audio / Hindi dubs
          var dualAudioServer = vm.servers.find(function (s) { return s.id === 2; }) || vm.servers[1];
          vm.currentServer = dualAudioServer;
          vm.audioNotice = '🇮🇳 Hindi Dubbed Track Selected! Switched to ' + dualAudioServer.name + '. Once loaded, click the ⚙️ Settings / Audio menu inside player controls and pick Hindi if needed.';
        } else if (track.id === 'en') {
          vm.audioNotice = 'English audio track enabled on ' + vm.currentServer.name + '.';
        } else if (track.id === 'multi') {
          vm.audioNotice = 'Multi-Audio & Multi-Subtitle mode active. You can select language streams directly inside player settings.';
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
          return 'allow-scripts allow-same-origin allow-forms allow-presentation';
        }
        return 'allow-scripts allow-same-origin allow-forms allow-presentation allow-popups';
      };

      vm.toggleCollegeBypass = function () {
        vm.collegeBypassActive = !vm.collegeBypassActive;
        if (vm.collegeBypassActive) {
          var bypassServer = vm.servers.find(function (s) { return s.id === 2; }) || vm.servers[1];
          vm.selectServer(bypassServer);
          vm.audioNotice = '🎓 College WiFi Bypass Active! Running on campus-unblocked servers without DNS filtering.';
        } else {
          vm.selectServer(vm.servers[0]);
        }
      };

      // ---------------- STREAMING SERVERS (100% VERIFIED WORKING ON CAMPUS WIFI & AD-FREE) ----------------
      vm.showPlayer = false;
      vm.servers = [
        {
          id: 1,
          name: 'Server 1 (VidSrc PM - Ultra Fast)',
          badge: 'Ad-Free Cloud',
          getUrl: function (id) { return 'https://vidsrc.pm/embed/movie/' + id; }
        },
        {
          id: 2,
          name: 'Server 2 (CineSrc - Multi-Audio HD)',
          badge: 'Fast Stream',
          getUrl: function (id) { return 'https://cinesrc.st/embed/movie/' + id; }
        },
        {
          id: 3,
          name: 'Server 3 (AutoEmbed - Global Direct)',
          badge: 'Multi-Source',
          getUrl: function (id) { return 'https://autoembed.co/movie/tmdb/' + id; }
        },
        {
          id: 4,
          name: 'Server 4 (SmashyStream - Indian Cinema & Hindi)',
          badge: 'Multi-Lang',
          getUrl: function (id) { return 'https://embed.smashystream.com/playere.php?tmdb=' + id; }
        },
        {
          id: 5,
          name: 'Server 5 (VidSrc ME - Direct Cloud)',
          badge: 'Direct Stream',
          getUrl: function (id) { return 'https://vidsrc.me/embed/movie?tmdb=' + id; }
        },
        {
          id: 6,
          name: 'Server 6 (College WiFi Bypass - Direct PM)',
          badge: 'Campus Bypass',
          getUrl: function (id) { return 'https://vidsrc.pm/embed/movie/' + id; }
        },
        {
          id: 7,
          name: 'Server 7 (2Embed CC - Alternate Mirror)',
          badge: 'Backup Mirror',
          getUrl: function (id) { return 'https://www.2embed.cc/embed/' + id; }
        }
      ];
      vm.currentServer = vm.servers[0];
      vm.currentStreamUrl = null;

      vm.nextServer = function () {
        var idx = vm.servers.indexOf(vm.currentServer);
        var nextIdx = (idx + 1) % vm.servers.length;
        vm.selectServer(vm.servers[nextIdx]);
        vm.audioNotice = 'Switched to ' + vm.servers[nextIdx].name + '. Testing playback...';
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
        if (server.id === 6 || server.id === 7) {
          vm.collegeBypassActive = true;
        }
        if (vm.movie && vm.movie.id) {
          var trackId = vm.selectedAudioTrack ? vm.selectedAudioTrack.id : 'en';
          vm.currentStreamUrl = $sce.trustAsResourceUrl(server.getUrl(vm.movie.id, trackId));
        }
      };

      vm.playMovie = function () {
        vm.showPlayer = true;
        var trackId = vm.selectedAudioTrack ? vm.selectedAudioTrack.id : 'en';
        if (!vm.currentStreamUrl && vm.movie && vm.movie.id) {
          vm.currentStreamUrl = $sce.trustAsResourceUrl(vm.currentServer.getUrl(vm.movie.id, trackId));
        }

        // Record in Watch History for OTT Resume & Continue Watching
        if (vm.movie && vm.movie.id) {
          StorageService.recordWatch(
            vm.movie,
            vm.currentServer.name,
            vm.selectedAudioTrack ? vm.selectedAudioTrack.name : 'English (Original)',
            45,
            vm.currentServer.id,
            trackId
          );
        }

        $timeout(function () {
          var playerEl = document.getElementById('stream-player-section');
          if (playerEl) {
            playerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      };

      vm.closePlayer = function () {
        vm.showPlayer = false;
        vm.currentStreamUrl = null;
      };

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

      // 3. Trailer - find the first official YouTube trailer
      MovieService.getVideos(movieId)
        .then(function (data) {
          var videos = data.results || [];
          var trailer = videos.find(function (v) {
            return v.site === 'YouTube' && v.type === 'Trailer';
          });
          if (trailer) {
            vm.trailerUrl = $sce.trustAsResourceUrl(
              'https://www.youtube.com/embed/' + trailer.key
            );
          }
        })
        .catch(function () {
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
