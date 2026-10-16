/**
 * CinVerse - playerService.js
 * Native Video Player Service powered by Artplayer.js and Hls.js.
 * Provides a unified, premium, ad-free streaming experience matching FLIQ TV and NetMirror.
 */
(function () {
  'use strict';

  angular.module('cinVerseApp').service('PlayerService', ['$timeout', '$rootScope', function ($timeout, $rootScope) {
    var self = this;

    // Active player references
    self.activePlayer = null;

    /**
     * Check if HLS.js is supported in the current environment
     */
    self.isHlsSupported = function () {
      return typeof window.Hls !== 'undefined' && window.Hls.isSupported();
    };

    /**
     * High-quality verified public demonstration streams with multi-audio & subtitles
     */
    self.sampleStreams = [
      {
        id: 'tos',
        name: 'Tears of Steel (Sci-Fi • 4K Multi-Audio & Subtitles)',
        url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
        poster: 'assets/images/backdrop-placeholder.png',
        subtitles: [
          { default: true, html: 'English', url: 'https://artplayer.org/assets/sample/subtitle.vtt' }
        ]
      },
      {
        id: 'bbb',
        name: 'Big Buck Bunny (Animation • 1080p 60fps)',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        poster: 'assets/images/backdrop-placeholder.png',
        subtitles: []
      }
    ];

    /**
     * Initialize Artplayer with CinVerse branding, HLS.js integration,
     * custom controls, gestures, multi-audio switching, and subtitles.
     *
     * @param {Object} cfg Player configuration options
     * @returns {Artplayer} Artplayer instance
     */
    self.initPlayer = function (cfg) {
      if (typeof window.Artplayer === 'undefined') {
        console.error('[CinVerse Player] Artplayer library is not loaded.');
        return null;
      }

      // Destroy any existing player instance in this container
      if (self.activePlayer) {
        self.destroyPlayer(self.activePlayer);
        self.activePlayer = null;
      }

      var containerEl = typeof cfg.container === 'string'
        ? document.querySelector(cfg.container)
        : cfg.container;

      if (!containerEl) {
        console.error('[CinVerse Player] Target container element not found:', cfg.container);
        return null;
      }

      // Empty container before mount
      containerEl.innerHTML = '';

      var streamUrl = cfg.url || cfg.streamUrl || '';
      var isMp4 = typeof streamUrl === 'string' && streamUrl.toLowerCase().indexOf('.mp4') !== -1;
      var streamType = isMp4 ? 'mp4' : 'm3u8';

      // Build Artplayer instance
      var art = new window.Artplayer({
        container: containerEl,
        url: streamUrl,
        type: streamType,
        customType: {
          m3u8: function (video, url, artInstance) {
            if (self.isHlsSupported()) {
              if (artInstance.hls) {
                artInstance.hls.destroy();
              }
              var hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90
              });
              hls.loadSource(url);
              hls.attachMedia(video);
              artInstance.hls = hls;

              // Wire audio tracks once manifest is parsed
              hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                if (hls.audioTracks && hls.audioTracks.length > 1) {
                  var audioOptions = hls.audioTracks.map(function (track, index) {
                    return {
                      default: index === hls.audioTrack,
                      html: track.name || track.lang || ('Audio Track ' + (index + 1)),
                      value: index
                    };
                  });

                  // Add audio track selector to player settings
                  artInstance.setting.add({
                    name: 'audioTrack',
                    html: 'Audio Track',
                    width: 200,
                    tooltip: hls.audioTracks[hls.audioTrack] ? hls.audioTracks[hls.audioTrack].name : 'Default',
                    selector: audioOptions,
                    onSelect: function (item) {
                      hls.audioTrack = item.value;
                      return item.html;
                    }
                  });
                }
              });

              // Clean up HLS when Artplayer destroys
              artInstance.on('destroy', function () {
                hls.destroy();
              });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              // Safari native HLS playback
              video.src = url;
            } else {
              artInstance.notice.show = 'Unsupported video format';
            }
          }
        },
        title: cfg.title || 'CinVerse Pro Cinema',
        poster: cfg.poster || '',
        volume: 0.85,
        isLive: false,
        muted: false,
        autoplay: cfg.autoplay || false,
        pip: true,
        autoSize: false,
        autoMini: false,
        screenshot: true,
        setting: true,
        loop: false,
        flip: true,
        playbackRate: true,
        aspectRatio: true,
        fullscreen: true,
        fullscreenWeb: true,
        subtitleOffset: true,
        miniProgressBar: true,
        mutex: true,
        backdrop: true,
        playsInline: true,
        autoPlayback: true,
        airplay: true,
        theme: '#a855f7',
        lang: 'en',
        moreVideoAttr: {
          crossOrigin: 'anonymous',
          playsInline: 'true'
        },
        controls: [
          {
            position: 'left',
            index: 10,
            html: '<i class="fa-solid fa-rotate-left"></i>',
            tooltip: 'Rewind 10s',
            click: function () {
              art.currentTime = Math.max(0, art.currentTime - 10);
              art.notice.show = '-10s';
            }
          },
          {
            position: 'left',
            index: 11,
            html: '<i class="fa-solid fa-rotate-right"></i>',
            tooltip: 'Forward 10s',
            click: function () {
              art.currentTime = Math.min(art.duration, art.currentTime + 10);
              art.notice.show = '+10s';
            }
          }
        ],
        icons: {
          loading: '<div class="cinverse-player-loader"><div class="spinner"></div></div>'
        }
      });

      // Subtitle integration if subtitles are provided
      if (cfg.subtitles && cfg.subtitles.length > 0) {
        var defaultSub = cfg.subtitles.find(function (s) { return s.default; }) || cfg.subtitles[0];
        if (defaultSub && defaultSub.url) {
          art.subtitle.init({
            url: defaultSub.url,
            type: 'vtt',
            style: {
              color: '#ffffff',
              fontSize: '24px',
              textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.9)'
            }
          });
        }
      }

      // Event Listeners for progress saving & UI sync
      art.on('video:timeupdate', function () {
        if (cfg.onTimeUpdate && art.duration) {
          cfg.onTimeUpdate(art.currentTime, art.duration);
        }
      });

      art.on('ready', function () {
        if (cfg.onReady) {
          cfg.onReady(art);
        }
      });

      self.activePlayer = art;
      return art;
    };

    /**
     * Safely destroy an active player instance
     * @param {Artplayer} art Artplayer instance to destroy
     */
    self.destroyPlayer = function (art) {
      if (!art) art = self.activePlayer;
      if (art && typeof art.destroy === 'function') {
        try {
          if (art.hls) {
            art.hls.destroy();
            art.hls = null;
          }
          art.destroy(false);
        } catch (e) {
          console.warn('[CinVerse Player] Error destroying player:', e);
        }
      }
      if (self.activePlayer === art) {
        self.activePlayer = null;
      }
    };
  }]);
})();
