/* ============================================================
   CineVerse - storageService.js
   ------------------------------------------------------------
   Wraps window.localStorage so Favorites & Watchlist data is
   persisted across page reloads. Nothing outside this service
   should touch localStorage directly.
   ============================================================ */

(function () {
  'use strict';

  angular.module('cineVerseApp').factory('StorageService', [
    function () {

      var FAVORITES_KEY = 'cineverse_favorites';
      var WATCHLIST_KEY = 'cineverse_watchlist';

      var service = {};

      /* ----------------------------------------------------------
         PRIVATE HELPERS
         ---------------------------------------------------------- */
      function readList(key) {
        try {
          var raw = window.localStorage.getItem(key);
          return raw ? JSON.parse(raw) : [];
        } catch (e) {
          // Corrupt data or storage unavailable - fail safe with empty list
          return [];
        }
      }

      function writeList(key, list) {
        try {
          window.localStorage.setItem(key, JSON.stringify(list));
          return true;
        } catch (e) {
          // Storage full or blocked (private browsing mode etc.)
          return false;
        }
      }

      function addToList(key, movie) {
        var list = readList(key);
        var exists = list.some(function (item) {
          return item.id === movie.id;
        });
        if (!exists) {
          list.push({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            vote_average: movie.vote_average,
            release_date: movie.release_date
          });
          writeList(key, list);
        }
        return list;
      }

      function removeFromList(key, movieId) {
        var list = readList(key).filter(function (item) {
          return item.id !== movieId;
        });
        writeList(key, list);
        return list;
      }

      function isInList(key, movieId) {
        return readList(key).some(function (item) {
          return item.id === movieId;
        });
      }

      /* ----------------------------------------------------------
         PUBLIC API - FAVORITES
         ---------------------------------------------------------- */
      service.getFavorites = function () {
        return readList(FAVORITES_KEY);
      };

      service.addFavorite = function (movie) {
        return addToList(FAVORITES_KEY, movie);
      };

      service.removeFavorite = function (movieId) {
        return removeFromList(FAVORITES_KEY, movieId);
      };

      service.isFavorite = function (movieId) {
        return isInList(FAVORITES_KEY, movieId);
      };

      service.toggleFavorite = function (movie) {
        if (isInList(FAVORITES_KEY, movie.id)) {
          return removeFromList(FAVORITES_KEY, movie.id);
        }
        return addToList(FAVORITES_KEY, movie);
      };

      /* ----------------------------------------------------------
         PUBLIC API - WATCHLIST
         ---------------------------------------------------------- */
      service.getWatchlist = function () {
        return readList(WATCHLIST_KEY);
      };

      service.addToWatchlist = function (movie) {
        return addToList(WATCHLIST_KEY, movie);
      };

      service.removeFromWatchlist = function (movieId) {
        return removeFromList(WATCHLIST_KEY, movieId);
      };

      service.isInWatchlist = function (movieId) {
        return isInList(WATCHLIST_KEY, movieId);
      };

      /* ----------------------------------------------------------
         WATCH HISTORY & RESUME (OTT MODE)
         ---------------------------------------------------------- */
      var HISTORY_KEY = 'cineverse_watch_history';

      service.getWatchHistory = function () {
        return readList(HISTORY_KEY);
      };

      service.recordWatch = function (movie, serverName, audioTrackName, progressPct, serverId, trackId) {
        if (!movie || !movie.id) return [];
        var history = readList(HISTORY_KEY);
        // Remove existing entry if present to bump to front
        history = history.filter(function (item) {
          return item.id !== movie.id;
        });

        // Determine realistic watch progress (if not specified, set 35% - 75%)
        var pct = progressPct || Math.floor(Math.random() * 40) + 30;

        var entry = {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
          runtime: movie.runtime,
          watchedAt: Date.now(),
          progressPct: pct,
          serverName: serverName || 'Server 1 (VidLink HD)',
          serverId: serverId || 1,
          audioTrack: audioTrackName || 'English (Original)',
          trackId: trackId || 'en'
        };

        history.unshift(entry);
        if (history.length > 20) {
          history = history.slice(0, 20);
        }
        writeList(HISTORY_KEY, history);
        return history;
      };

      service.removeFromHistory = function (movieId) {
        var history = readList(HISTORY_KEY).filter(function (item) {
          return item.id !== movieId;
        });
        writeList(HISTORY_KEY, history);
        return history;
      };

      service.clearHistory = function () {
        writeList(HISTORY_KEY, []);
        return [];
      };

      /* ----------------------------------------------------------
         USER AUTH & PROFILES (NETMIRROR STYLE)
         ---------------------------------------------------------- */
      var USER_KEY = 'cineverse_current_user';
      var USERS_KEY = 'cineverse_registered_users';

      var DEFAULT_USER = {
        id: 'usr_member',
        name: 'VIP Member',
        email: 'member@cinverse.tv',
        avatar: '🎬',
        avatarColor: '#E50914',
        membership: 'CinVerse Pro VIP',
        joinedDate: '2026'
      };

      service.getCurrentUser = function () {
        try {
          var raw = window.localStorage.getItem(USER_KEY);
          return raw ? JSON.parse(raw) : null;
        } catch (e) {
          return null;
        }
      };

      service.setCurrentUser = function (user) {
        try {
          window.localStorage.setItem(USER_KEY, JSON.stringify(user));
          return user;
        } catch (e) {
          return null;
        }
      };

      service.login = function (email, password) {
        var users = readList(USERS_KEY);
        var found = users.find(function (u) {
          return u.email.toLowerCase() === (email || '').toLowerCase().trim();
        });

        if (found) {
          service.setCurrentUser(found);
          return { success: true, user: found };
        }

        // Allow instant sign-in for demo email
        var name = email.split('@')[0];
        name = name.charAt(0).toUpperCase() + name.slice(1);
        var newUser = {
          id: 'usr_' + Date.now(),
          name: name || 'CinVerse Member',
          email: email,
          avatar: '🍿',
          avatarColor: '#E50914',
          membership: 'CinVerse Pro',
          joinedDate: 'Today'
        };
        service.setCurrentUser(newUser);
        return { success: true, user: newUser };
      };

      service.register = function (name, email, password, avatar) {
        var users = readList(USERS_KEY);
        var existing = users.find(function (u) {
          return u.email.toLowerCase() === (email || '').toLowerCase().trim();
        });
        if (existing) {
          return { success: false, message: 'Account already exists with this email. Please sign in.' };
        }

        var avatarIcons = ['🎬', '🍿', '⚡', '🔥', '👑', '🚀'];
        var randomAvatar = avatar || avatarIcons[Math.floor(Math.random() * avatarIcons.length)];

        var newUser = {
          id: 'usr_' + Date.now(),
          name: name || 'Movie Buff',
          email: email,
          avatar: randomAvatar,
          avatarColor: '#E50914',
          membership: 'CinVerse Pro VIP',
          joinedDate: 'Today'
        };

        users.push(newUser);
        writeList(USERS_KEY, users);
        service.setCurrentUser(newUser);
        return { success: true, user: newUser };
      };

      service.logout = function () {
        try {
          window.localStorage.removeItem(USER_KEY);
          return true;
        } catch (e) {
          return false;
        }
      };

      return service;
    }
  ]);

})();
