/* ============================================================
   CinVerse - playerGestures.js
   ------------------------------------------------------------
   Advanced MX Player / VLC Touch Gesture Directive
   - Vertical Swipe on LEFT (<=48%) -> Screen Brightness Control (20% - 130%)
   - Vertical Swipe on RIGHT (>=52%) -> Volume Control (0% - 200% CineBoost)
   - Double-Tap LEFT (<44%) -> Rewind 10s with Neon Wave Ripple
   - Double-Tap RIGHT (>56%) -> Forward 10s with Neon Wave Ripple
   - Single-Tap -> Toggle Floating HUD (Anti-Accidental Pause)
   - Works seamlessly across Android APK, Mobile Browsers & Desktop
   ============================================================ */

(function () {
  'use strict';

  angular.module('cinVerseApp').directive('playerGestures', [
    '$timeout',
    function ($timeout) {
      return {
        restrict: 'A',
        scope: {
          ctrl: '=playerGestures'
        },
        link: function (scope, element) {
          var el = element[0];
          var ctrl = scope.ctrl;
          if (!el || !ctrl) return;

          var startX = 0;
          var startY = 0;
          var startTime = 0;
          var isLeftZone = false;
          var isRightZone = false;
          var initialVal = 0;
          var activeGesture = null; // 'brightness' | 'volume' | null
          var lastTapTime = 0;
          var lastTapX = 0;

          function onTouchStart(e) {
            if (ctrl.isScreenLocked || !ctrl.gestureOverlayEnabled) return;
            var touch = e.touches[0];
            if (!touch) return;

            var rect = el.getBoundingClientRect();
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();

            var relX = rect.width ? ((startX - rect.left) / rect.width) : 0.5;
            isLeftZone = (relX <= 0.48);
            isRightZone = (relX >= 0.52);

            initialVal = isLeftZone ? (ctrl.brightnessLevel || 100) : (ctrl.volumeLevel || ctrl.audioBoostLevel || 100);
            activeGesture = null;
          }

          function onTouchMove(e) {
            if (ctrl.isScreenLocked || !ctrl.gestureOverlayEnabled) return;
            var touch = e.touches[0];
            if (!touch) return;

            var rect = el.getBoundingClientRect();
            var currentX = touch.clientX;
            var currentY = touch.clientY;
            var deltaX = currentX - startX;
            var deltaY = currentY - startY;

            // Detect vertical swipe intent
            if (!activeGesture) {
              if (Math.abs(deltaY) > 12 && Math.abs(deltaY) > Math.abs(deltaX) * 1.15) {
                if (isLeftZone) activeGesture = 'brightness';
                else if (isRightZone) activeGesture = 'volume';
              }
            }

            if (activeGesture === 'brightness') {
              if (e.cancelable) e.preventDefault();
              e.stopPropagation();
              var dragFraction = - (deltaY / (rect.height * 0.55));
              var newBrightness = Math.round(initialVal + (dragFraction * 100));
              newBrightness = Math.max(20, Math.min(130, newBrightness));
              ctrl.setBrightness(newBrightness);
              scope.$applyAsync();
            } else if (activeGesture === 'volume') {
              if (e.cancelable) e.preventDefault();
              e.stopPropagation();
              var dragFraction = - (deltaY / (rect.height * 0.55));
              var newVolume = Math.round(initialVal + (dragFraction * 120));
              newVolume = Math.max(0, Math.min(200, newVolume));
              ctrl.setVolume(newVolume);
              scope.$applyAsync();
            }
          }

          function onTouchEnd(e) {
            if (ctrl.isScreenLocked || !ctrl.gestureOverlayEnabled) return;

            if (activeGesture) {
              activeGesture = null;
              if (ctrl.hideGaugesSoon) ctrl.hideGaugesSoon();
              return;
            }

            var now = Date.now();
            var touch = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
            var currentX = touch ? touch.clientX : startX;
            var rect = el.getBoundingClientRect();
            var relX = rect.width ? ((currentX - rect.left) / rect.width) : 0.5;

            // Double tap seek (< 330ms and within 90px)
            if (now - lastTapTime < 330 && Math.abs(currentX - lastTapX) < 90) {
              if (relX < 0.44) {
                ctrl.doubleTapSeek(-10);
              } else if (relX > 0.56) {
                ctrl.doubleTapSeek(10);
              }
              lastTapTime = 0;
              scope.$applyAsync();
              return;
            }

            lastTapTime = now;
            lastTapX = currentX;

            // Single tap toggles HUD
            ctrl.onOverlayTap(e);
            scope.$applyAsync();
          }

          // Attach non-passive touch listeners
          el.addEventListener('touchstart', onTouchStart, { passive: true });
          el.addEventListener('touchmove', onTouchMove, { passive: false });
          el.addEventListener('touchend', onTouchEnd, { passive: true });

          // Mouse support for desktop gesture drag
          var isMouseDown = false;
          function onMouseDown(e) {
            if (e.target && e.target.closest && e.target.closest('.player-floating-hud')) return;
            if (ctrl.isScreenLocked || !ctrl.gestureOverlayEnabled) return;
            isMouseDown = true;
            var rect = el.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            var relX = rect.width ? ((startX - rect.left) / rect.width) : 0.5;
            isLeftZone = (relX <= 0.48);
            isRightZone = (relX >= 0.52);
            initialVal = isLeftZone ? (ctrl.brightnessLevel || 100) : (ctrl.volumeLevel || ctrl.audioBoostLevel || 100);
            activeGesture = null;
          }

          function onMouseMove(e) {
            if (!isMouseDown || ctrl.isScreenLocked || !ctrl.gestureOverlayEnabled) return;
            var rect = el.getBoundingClientRect();
            var deltaX = e.clientX - startX;
            var deltaY = e.clientY - startY;

            if (!activeGesture) {
              if (Math.abs(deltaY) > 15 && Math.abs(deltaY) > Math.abs(deltaX) * 1.15) {
                if (isLeftZone) activeGesture = 'brightness';
                else if (isRightZone) activeGesture = 'volume';
              }
            }

            if (activeGesture === 'brightness') {
              var dragFraction = - (deltaY / (rect.height * 0.55));
              var newBrightness = Math.round(initialVal + (dragFraction * 100));
              ctrl.setBrightness(Math.max(20, Math.min(130, newBrightness)));
              scope.$applyAsync();
            } else if (activeGesture === 'volume') {
              var dragFraction = - (deltaY / (rect.height * 0.55));
              var newVolume = Math.round(initialVal + (dragFraction * 120));
              ctrl.setVolume(Math.max(0, Math.min(200, newVolume)));
              scope.$applyAsync();
            }
          }

          function onMouseUp() {
            if (!isMouseDown) return;
            isMouseDown = false;
            if (activeGesture) {
              activeGesture = null;
              if (ctrl.hideGaugesSoon) ctrl.hideGaugesSoon();
            }
          }

          el.addEventListener('mousedown', onMouseDown);
          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);

          scope.$on('$destroy', function () {
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchmove', onTouchMove);
            el.removeEventListener('touchend', onTouchEnd);
            el.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
          });
        }
      };
    }
  ]);
})();
