/**
 * CinVerse - streamBridgeService.js
 * Universal Media Stream Interceptor & Bridge for Mobile and PC.
 *
 * MOBILE (Android Native):
 *  Uses WebViewClient.shouldInterceptRequest to capture raw .m3u8 / .mp4 streams
 *  from third-party embed hosts without displaying third-party ads or players.
 *
 * PC (Localhost & Web):
 *  Extracts direct streams via cloud provider APIs and background sniffers
 *  to feed native Artplayer with in-player audio switching and subtitles.
 */
(function () {
  'use strict';

  angular.module('cinVerseApp').service('StreamBridgeService', [
    '$q',
    '$timeout',
    '$http',
    '$rootScope',
    function ($q, $timeout, $http, $rootScope) {
      var self = this;

      // Active pending extraction deferred
      var currentDeferred = null;
      var activeExtractionTimer = null;

      /**
       * Check if running inside the Android Native CinVerse App
       */
      self.isNativeApp = function () {
        return !!(window.CinVerseNative &&
                  typeof window.CinVerseNative.isNativeApp === 'function' &&
                  window.CinVerseNative.isNativeApp());
      };

      /**
       * Global bridge listener registered for Android Native evaluateJavascript callbacks
       */
      window.CinVerseNativeBridgeListener = {
        onStreamExtracted: function (streamUrl, mediaTitle) {
          $rootScope.$applyAsync(function () {
            if (activeExtractionTimer) {
              $timeout.cancel(activeExtractionTimer);
              activeExtractionTimer = null;
            }
            if (currentDeferred) {
              currentDeferred.resolve({
                success: true,
                url: streamUrl,
                title: mediaTitle || '',
                engine: 'artplayer',
                source: 'Android Native Interceptor'
              });
              currentDeferred = null;
            }
          });
        },

        onStreamFailed: function (embedUrl, reason) {
          $rootScope.$applyAsync(function () {
            if (activeExtractionTimer) {
              $timeout.cancel(activeExtractionTimer);
              activeExtractionTimer = null;
            }
            if (currentDeferred) {
              currentDeferred.reject({
                success: false,
                embedUrl: embedUrl,
                reason: reason || 'Extraction failed',
                fallback: true
              });
              currentDeferred = null;
            }
          });
        }
      };

      /**
       * Cancel any currently active stream extraction
       */
      self.cancelExtraction = function () {
        if (activeExtractionTimer) {
          $timeout.cancel(activeExtractionTimer);
          activeExtractionTimer = null;
        }
        if (self.isNativeApp() && typeof window.CinVerseNative.cancelExtraction === 'function') {
          try {
            window.CinVerseNative.cancelExtraction();
          } catch (e) {
            console.warn('[StreamBridge] Cancel error:', e);
          }
        }
        if (currentDeferred) {
          currentDeferred.reject({ cancelled: true });
          currentDeferred = null;
        }
      };

      /**
       * Resolve video stream for the given media and server
       * @param {Object} opts { type: 'movie'|'tv', id, title, season, episode, embedUrl }
       * @returns {Promise<Object>} Stream resolution result
       */
      self.resolveStream = function (opts) {
        self.cancelExtraction();

        currentDeferred = $q.defer();
        var mediaTitle = opts.title || 'CinVerse Cinema';
        var embedUrl = opts.embedUrl || '';

        // ==========================================
        // 1. MOBILE ENVIRONMENT (Android Native APK)
        // ==========================================
        if (self.isNativeApp() && window.CinVerseNative && typeof window.CinVerseNative.extractStream === 'function') {
          try {
            // Safety timeout
            activeExtractionTimer = $timeout(function () {
              if (currentDeferred) {
                currentDeferred.reject({
                  success: false,
                  embedUrl: embedUrl,
                  reason: 'Mobile extraction timeout',
                  fallback: true
                });
                currentDeferred = null;
              }
            }, 19000);

            // Trigger native Android background interception
            window.CinVerseNative.extractStream(embedUrl, mediaTitle);
            return currentDeferred.promise;
          } catch (err) {
            console.error('[StreamBridge] Android Native extraction call failed:', err);
            // Fall through to standard streaming fallback
          }
        }

        // ==========================================
        // 2. PC / LOCALHOST / BROWSER ENVIRONMENT
        // ==========================================
        activeExtractionTimer = $timeout(function () {
          if (currentDeferred) {
            currentDeferred.reject({
              success: false,
              embedUrl: embedUrl,
              reason: 'pc_extraction_timeout',
              fallback: true
            });
            currentDeferred = null;
          }
        }, 2200);

        try {
          var apiPath = opts.type === 'tv'
            ? 'https://vidsrc.pm/api/vidora/v1/tv/' + opts.id + '/' + (opts.season || 1) + '/' + (opts.episode || 1)
            : 'https://vidsrc.pm/api/vidora/v1/movie/' + opts.id;

          $http({
            method: 'GET',
            url: apiPath,
            headers: {
              'x-player-key': 'f3b72e73c80c9a996574379798703796a1936efa3516a7105cb0e43048b46b5a'
            },
            timeout: 2000
          }).then(function (response) {
            if (activeExtractionTimer) {
              $timeout.cancel(activeExtractionTimer);
              activeExtractionTimer = null;
            }
            if (response.data && response.data.result && response.data.sources && response.data.sources.length > 0) {
              var rawStream = response.data.sources[0].url;
              if (rawStream && currentDeferred) {
                currentDeferred.resolve({
                  success: true,
                  url: rawStream,
                  title: response.data.title || mediaTitle,
                  tracks: response.data.sources[0].tracks || [],
                  engine: 'artplayer',
                  source: 'CinVerse Direct Stream'
                });
                currentDeferred = null;
                return;
              }
            }
            if (currentDeferred) {
              currentDeferred.reject({
                success: false,
                embedUrl: embedUrl,
                reason: 'direct_stream_unavailable',
                fallback: true
              });
              currentDeferred = null;
            }
          }).catch(function (error) {
            if (activeExtractionTimer) {
              $timeout.cancel(activeExtractionTimer);
              activeExtractionTimer = null;
            }
            if (currentDeferred) {
              currentDeferred.reject({
                success: false,
                embedUrl: embedUrl,
                reason: 'browser_sandbox',
                fallback: true
              });
              currentDeferred = null;
            }
          });
        } catch (ex) {
          if (activeExtractionTimer) {
            $timeout.cancel(activeExtractionTimer);
            activeExtractionTimer = null;
          }
          if (currentDeferred) {
            currentDeferred.reject({
              success: false,
              embedUrl: embedUrl,
              reason: 'extraction_exception',
              fallback: true
            });
            currentDeferred = null;
          }
        }

        return currentDeferred.promise;
      };
    }
  ]);
})();
