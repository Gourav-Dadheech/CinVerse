/**
 * Cinverse - musicDockController.js
 * Persistent Global Floating Music Dock Controller.
 * Mounts in index.html to provide uninterrupted background audio playback,
 * scrubbing, volume control, and expansion across all pages.
 */
(function () {
  'use strict';

  angular.module('cinVerseApp').controller('MusicDockController', [
    'MusicService',
    function (MusicService) {
      var vm = this;
      vm.music = MusicService;

      vm.onScrubClick = function ($event) {
        var track = $event.currentTarget;
        if (!track) return;
        var rect = track.getBoundingClientRect();
        var clickX = $event.clientX - rect.left;
        var pct = (clickX / rect.width) * 100;
        MusicService.seek(pct);
      };
    }
  ]);
})();
