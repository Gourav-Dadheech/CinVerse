/**
 * CinVerse - musicController.js
 * CinVerse Sound Studio & Next-Gen Audio Experience.
 * Features:
 *  - Bespoke Cyber-Luxury UI with Neon Turntable & Live Frequency Spectrum
 *  - Instant zero-delay audio playback with automatic synthesizer fallback
 *  - Custom Playlist Creator & Library Vault (stored in localStorage)
 *  - 1-Click Free MP3 Download to device
 *  - Search & Vibe Category Filtering (Cinema OSTs, Bollywood, Anime, Lo-Fi)
 *  - Karaoke Synced Lyrics with dynamic highlighting
 *  - Responsive bottom web player dock
 */
(function () {
  'use strict';

  angular.module('cinVerseApp').controller('MusicController', [
    '$scope',
    '$timeout',
    'MusicService',
    function ($scope, $timeout, MusicService) {
      var vm = this;

      vm.musicService = MusicService;
      vm.searchQuery = '';
      vm.activeSidebarTab = 'all'; // 'all', 'liked', or custom playlist id
      vm.selectedCustomPlaylist = null;
      vm.activeVibeFilter = 'all'; // 'all', 'ost', 'india', 'anime', 'chill', 'global', 'podcast'
      vm.sidebarChipFilter = 'all'; // 'all', 'playlists', 'artists', 'albums', 'podcasts'
      vm.showNowPlayingSidebar = true;
      vm.showLyricsModal = false;

      // Vibe Categories for Discovery Bar
      vm.vibeCategories = [
        { id: 'all', label: 'All Waves', icon: 'fa-bolt' },
        { id: 'ost', label: 'Cinema & Marvel OSTs', icon: 'fa-film' },
        { id: 'india', label: 'Bollywood Anthems', icon: 'fa-fire' },
        { id: 'anime', label: 'Anime Battle Hits', icon: 'fa-wand-magic-sparkles' },
        { id: 'chill', label: 'Cyber Lo-Fi Chill', icon: 'fa-moon' },
        { id: 'global', label: 'Global Top 50', icon: 'fa-earth-americas' },
        { id: 'podcast', label: 'Cinema Talk & Podcasts', icon: 'fa-microphone-lines' }
      ];

      // Quick 6-Pack Discovery Sound Cards
      vm.quickTiles = [
        {
          id: 'tile-1',
          title: 'Vision Quest Suite',
          subtitle: 'Marvel Cinematic Score',
          cover: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&auto=format&fit=crop&q=80',
          trackId: 'm1'
        },
        {
          id: 'tile-2',
          title: 'Liked Anthems',
          subtitle: 'Your Saved Collection',
          isLikedSquare: true
        },
        {
          id: 'tile-3',
          title: 'Portals Theme (Endgame)',
          subtitle: 'Alan Silvestri',
          cover: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80',
          trackId: 'm2'
        },
        {
          id: 'tile-4',
          title: 'Cornfield Chase',
          subtitle: 'Interstellar • Hans Zimmer',
          cover: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=400&auto=format&fit=crop&q=80',
          trackId: 'm3'
        },
        {
          id: 'tile-5',
          title: 'Tu Hain Toh',
          subtitle: 'Mr. & Mrs. Mahi Hit',
          cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
          trackId: 'sp-1'
        },
        {
          id: 'tile-6',
          title: 'Sajni (Laapataa Ladies)',
          subtitle: 'Arijit Singh Masterpiece',
          cover: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          trackId: 'sp-2'
        }
      ];

      // Curated 3D Vinyl Sleeve Albums Carousel
      vm.featuredAlbums = [
        {
          id: 'alb-1',
          title: 'Avengers & Marvel Universe',
          artist: 'Alan Silvestri, Christophe Beck',
          year: 'Marvel Studio Edition',
          cover: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80',
          trackId: 'm2'
        },
        {
          id: 'alb-2',
          title: 'Interstellar Original Score',
          artist: 'Hans Zimmer',
          year: 'Lossless Master',
          cover: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=500&auto=format&fit=crop&q=80',
          trackId: 'm3'
        },
        {
          id: 'alb-3',
          title: 'Aashiqui 2 Complete OST',
          artist: 'Mithoon, Ankit Tiwari',
          year: 'Timeless Bollywood',
          cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
          trackId: 'sp-3'
        },
        {
          id: 'alb-4',
          title: 'Jawan & Animal Anthems',
          artist: 'Anirudh Ravichander',
          year: 'High Energy Bass',
          cover: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=500&auto=format&fit=crop&q=80',
          trackId: 'i2'
        },
        {
          id: 'alb-5',
          title: 'Cyber Lo-Fi Night Drive',
          artist: 'CinVerse Sound Lab',
          year: 'Chillout & Focus',
          cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
          trackId: 'cl1'
        }
      ];

      // Playlist Modals
      vm.showCreatePlaylistModal = false;
      vm.newPlaylistName = '';
      vm.newPlaylistDesc = '';

      vm.showAddToPlaylistModal = false;
      vm.trackToAddToPlaylist = null;

      // Toast Feedback
      vm.toastMessage = '';
      var toastTimer = null;

      function showToast(msg) {
        vm.toastMessage = msg;
        if (toastTimer) $timeout.cancel(toastTimer);
        toastTimer = $timeout(function () {
          vm.toastMessage = '';
        }, 3200);
      }

      // Live Search Auto-Suggestions
      vm.searchSuggestions = [];
      vm.isSearching = false;
      vm.showSuggestions = false;
      var searchDebounceTimer = null;

      vm.onSearchInput = function () {
        if (searchDebounceTimer) $timeout.cancel(searchDebounceTimer);
        var q = (vm.searchQuery || '').trim();
        if (q.length < 2) {
          vm.searchSuggestions = [];
          vm.isSearching = false;
          vm.showSuggestions = false;
          return;
        }

        vm.isSearching = true;
        vm.showSuggestions = true;
        searchDebounceTimer = $timeout(function () {
          MusicService.searchGlobalTracks(q).then(function (results) {
            $scope.$applyAsync(function () {
              vm.searchSuggestions = results;
              vm.isSearching = false;
            });
          });
        }, 280);
      };

      vm.selectSuggestion = function (track) {
        vm.showSuggestions = false;
        vm.searchSuggestions = [];
        vm.searchQuery = '';

        // Match existing catalog track by id or title & artist
        var existing = MusicService.catalog.find(function (t) {
          return t.id === track.id || (
            t.title && track.title &&
            t.title.toLowerCase() === track.title.toLowerCase() &&
            t.artist && track.artist &&
            t.artist.toLowerCase() === track.artist.toLowerCase()
          );
        });
        if (!existing) {
          MusicService.catalog.unshift(track);
          existing = track;
        }
        MusicService.playTrack(existing, MusicService.catalog);
        showToast('Now Playing: ' + existing.title + ' • ' + existing.artist + ' 🎵');
      };

      vm.closeSuggestions = function () {
        $timeout(function () {
          vm.showSuggestions = false;
        }, 250);
      };

      // Filter Handlers
      vm.setVibeFilter = function (vibeId) {
        vm.activeVibeFilter = vibeId;
      };

      vm.setSidebarChipFilter = function (filter) {
        vm.sidebarChipFilter = filter;
      };

      vm.selectSidebarTab = function (tabId) {
        vm.activeSidebarTab = tabId;
        vm.selectedCustomPlaylist = null;
      };

      vm.selectCustomPlaylist = function (pl) {
        vm.activeSidebarTab = 'custom';
        vm.selectedCustomPlaylist = pl;
      };

      // Tile & Album Click
      vm.onTileClick = function (tile) {
        if (tile.isLikedSquare) {
          vm.selectSidebarTab('liked');
          return;
        }
        var found = MusicService.catalog.find(function (t) {
          return t.id === tile.trackId;
        });
        if (found) {
          MusicService.playTrack(found, MusicService.catalog);
        }
      };

      vm.onAlbumClick = function (album) {
        var found = MusicService.catalog.find(function (t) {
          return t.id === album.trackId;
        });
        if (found) {
          MusicService.playTrack(found, MusicService.catalog);
        }
      };

      // Toggle Right Studio Monitor
      vm.toggleNowPlayingSidebar = function () {
        vm.showNowPlayingSidebar = !vm.showNowPlayingSidebar;
      };

      // Lyrics Modal
      vm.openLyricsModal = function () {
        vm.showLyricsModal = true;
      };

      vm.closeLyricsModal = function () {
        vm.showLyricsModal = false;
      };

      // Filtered Track Listing
      vm.getDisplayedTracks = function () {
        var list = [];

        if (vm.activeSidebarTab === 'liked') {
          list = MusicService.getLikedTracks();
        } else if (vm.activeSidebarTab === 'custom' && vm.selectedCustomPlaylist) {
          list = vm.selectedCustomPlaylist.tracks || [];
        } else {
          list = MusicService.catalog;
        }

        // Vibe Filter
        if (vm.activeVibeFilter && vm.activeVibeFilter !== 'all') {
          list = list.filter(function (t) {
            return t.category === vm.activeVibeFilter;
          });
        }

        // Text Search
        if (vm.searchQuery && vm.searchQuery.trim().length > 0) {
          var q = vm.searchQuery.toLowerCase().trim();
          list = list.filter(function (t) {
            return (t.title && t.title.toLowerCase().indexOf(q) !== -1) ||
                   (t.artist && t.artist.toLowerCase().indexOf(q) !== -1) ||
                   (t.album && t.album.toLowerCase().indexOf(q) !== -1);
          });
        }

        return list;
      };

      // Current Playlist Header
      vm.getCurrentHeaderInfo = function () {
        if (vm.activeSidebarTab === 'liked') {
          return {
            type: 'SOUND VAULT',
            title: 'Liked Songs & Anthems',
            desc: 'Your personal pinned collection of favorites, high-fidelity soundtracks and cinema scores.',
            cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80',
            badge: 'FAVORITES ❤️',
            trackCount: MusicService.getLikedTracks().length
          };
        } else if (vm.activeSidebarTab === 'custom' && vm.selectedCustomPlaylist) {
          return {
            type: 'CUSTOM PLAYLIST',
            title: vm.selectedCustomPlaylist.name,
            desc: vm.selectedCustomPlaylist.desc || 'Custom curated soundtrack playlist by you.',
            cover: vm.selectedCustomPlaylist.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
            badge: 'YOUR PLAYLIST 🎧',
            trackCount: (vm.selectedCustomPlaylist.tracks || []).length
          };
        }

        return {
          type: 'CINVERSE STUDIO EDITORIAL',
          title: 'Master Audio Lounge',
          desc: 'Ultra HD Lossless streaming of blockbuster Bollywood anthems, Marvel suites, Interstellar, and Lo-Fi beats.',
          cover: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=500&auto=format&fit=crop&q=80',
          badge: 'STUDIO MASTER ⚡',
          trackCount: MusicService.catalog.length
        };
      };

      // Playlist Actions
      vm.openCreatePlaylistModal = function () {
        vm.newPlaylistName = '';
        vm.newPlaylistDesc = '';
        vm.showCreatePlaylistModal = true;
      };

      vm.closeCreatePlaylistModal = function () {
        vm.showCreatePlaylistModal = false;
      };

      vm.submitCreatePlaylist = function () {
        if (!vm.newPlaylistName || !vm.newPlaylistName.trim()) {
          vm.newPlaylistName = 'CinVerse Mix #' + (MusicService.playlists.length + 1);
        }
        var created = MusicService.createPlaylist(vm.newPlaylistName, vm.newPlaylistDesc);
        vm.showCreatePlaylistModal = false;
        vm.selectCustomPlaylist(created);
        showToast('Created playlist "' + created.name + '"!');
      };

      vm.deletePlaylist = function (pl, $event) {
        if ($event) $event.stopPropagation();
        if (confirm('Delete playlist "' + pl.name + '"?')) {
          MusicService.deletePlaylist(pl.id);
          vm.selectSidebarTab('all');
          showToast('Deleted playlist.');
        }
      };

      // Add to playlist
      vm.openAddToPlaylistModal = function (track, $event) {
        if ($event) $event.stopPropagation();
        vm.trackToAddToPlaylist = track;
        vm.showAddToPlaylistModal = true;
      };

      vm.closeAddToPlaylistModal = function () {
        vm.showAddToPlaylistModal = false;
        vm.trackToAddToPlaylist = null;
      };

      vm.addTrackToSpecificPlaylist = function (pl) {
        if (!vm.trackToAddToPlaylist) return;
        var added = MusicService.addTrackToPlaylist(pl.id, vm.trackToAddToPlaylist);
        vm.closeAddToPlaylistModal();
        if (added) {
          showToast('Added to "' + pl.name + '"!');
        } else {
          showToast('Track already in this playlist!');
        }
      };

      vm.removeTrackFromCurrentPlaylist = function (track, $event) {
        if ($event) $event.stopPropagation();
        if (vm.activeSidebarTab === 'custom' && vm.selectedCustomPlaylist) {
          MusicService.removeTrackFromPlaylist(vm.selectedCustomPlaylist.id, track.id);
          showToast('Removed from playlist.');
        }
      };

      // Playback Controls
      vm.playTrack = function (track) {
        var tracks = vm.getDisplayedTracks();
        MusicService.playTrack(track, tracks);
      };

      vm.playCurrentList = function () {
        var tracks = vm.getDisplayedTracks();
        if (tracks.length) {
          MusicService.playTrack(tracks[0], tracks);
        }
      };

      vm.isCurrentTrack = function (track) {
        return MusicService.currentTrack && MusicService.currentTrack.id === track.id;
      };

      vm.isCurrentPlaying = function (track) {
        return vm.isCurrentTrack(track) && MusicService.isPlaying;
      };

      vm.toggleTrackPlay = function (track, $event) {
        if ($event) $event.stopPropagation();
        if (vm.isCurrentTrack(track)) {
          MusicService.togglePlay();
        } else {
          vm.playTrack(track);
        }
      };

      // Likes
      vm.toggleLike = function (track, $event) {
        if ($event) $event.stopPropagation();
        MusicService.toggleLike(track);
        if (MusicService.isLiked(track.id)) {
          showToast('Saved to Liked Songs ❤️');
        } else {
          showToast('Removed from Liked Songs');
        }
      };

      vm.isLiked = function (trackId) {
        return MusicService.isLiked(trackId);
      };

      // 1-Click MP3 Download to Device
      vm.downloadTrack = function (track, $event) {
        if ($event) $event.stopPropagation();
        showToast('⬇️ Downloading "' + track.title + '" in 320kbps HD...');
        MusicService.downloadTrack(track);
      };
    }
  ]);
})();
