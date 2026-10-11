/* ============================================================
   CineVerse - movieService.js
   ------------------------------------------------------------
   SINGLE SOURCE OF TRUTH for all TMDB API communication.
   No controller should ever call $http directly - everything
   goes through this service so the API layer stays swappable
   and easy to test/mock.
   ============================================================ */

(function () {
  'use strict';

  angular.module('cineVerseApp').factory('MovieService', [
    '$http',
    '$q',
    'APP_CONFIG',
    function ($http, $q, APP_CONFIG) {

      var service = {};

      /* ----------------------------------------------------------
         PRIVATE HELPER: buildUrl
         Appends the API key + language to every endpoint so we
         never forget them in individual calls.
         ---------------------------------------------------------- */
      function buildUrl(endpoint, extraParams) {
        var params = angular.extend(
          {
            language: APP_CONFIG.DEFAULT_LANGUAGE
          },
          extraParams || {}
        );

        var query = Object.keys(params)
          .map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
          })
          .join('&');

        return APP_CONFIG.TMDB_BASE_URL + endpoint + '?' + query;
      }

      /* ----------------------------------------------------------
         PRIVATE HELPER: request
         Wraps $http.get with unified error handling so every
         public method returns a clean, predictable promise.
         Auth is sent as a Bearer token in the Authorization header
         (TMDB v4 auth) rather than as a URL query parameter.
         ---------------------------------------------------------- */
      function request(endpoint, extraParams) {
        var deferred = $q.defer();
        var url = buildUrl(endpoint, extraParams);

        $http.get(url, {
          headers: {
            'Authorization': 'Bearer ' + APP_CONFIG.TMDB_READ_TOKEN,
            'Content-Type': 'application/json;charset=utf-8'
          }
        })
          .then(function (response) {
            deferred.resolve(response.data);
          })
          .catch(function (error) {
            // Normalize the error so controllers can show a friendly message
            var friendlyMessage = 'Unable to reach TMDB. Please check your connection.';
            if (error.status === 401) {
              friendlyMessage = 'Invalid or missing TMDB Read Access Token. Check APP_CONFIG.TMDB_READ_TOKEN in app.js.';
            }
            deferred.reject({
              message: friendlyMessage,
              status: error.status,
              raw: error
            });
          });

        return deferred.promise;
      }

      /* ----------------------------------------------------------
         PUBLIC METHODS
         ---------------------------------------------------------- */

      // Trending movies (this week)
      service.getTrending = function () {
        return request('/trending/movie/week');
      };

      // Popular movies
      service.getPopular = function (page) {
        return request('/movie/popular', { page: page || 1 });
      };

      // Top rated movies
      service.getTopRated = function (page) {
        return request('/movie/top_rated', { page: page || 1 });
      };

      // Upcoming movies
      service.getUpcoming = function (page) {
        return request('/movie/upcoming', { page: page || 1 });
      };

      // Full movie details (includes runtime, genres, release date etc.)
      service.getMovieDetails = function (movieId) {
        return request('/movie/' + movieId);
      };

      // Cast & crew for a movie
      service.getCredits = function (movieId) {
        return request('/movie/' + movieId + '/credits');
      };

      // Trailers / videos for a movie
      service.getVideos = function (movieId) {
        return request('/movie/' + movieId + '/videos');
      };

      // Similar movies
      service.getSimilar = function (movieId) {
        return request('/movie/' + movieId + '/similar');
      };

      // Recommended movies based on a given movie
      service.getRecommendations = function (movieId) {
        return request('/movie/' + movieId + '/recommendations');
      };

      // Search movies by text query
      service.searchMovies = function (query, page) {
        return request('/search/movie', { query: query, page: page || 1, include_adult: false });
      };

      // Full list of genres (used for filters + genre badges)
      service.getGenres = function () {
        return request('/genre/movie/list');
      };

      // Discover movies filtered by genre id
      service.discoverByGenre = function (genreId, page) {
        return request('/discover/movie', { with_genres: genreId, page: page || 1 });
      };
      // Smart Movie Match
      // ======================================================
      // Smart Movie Match
      // ======================================================

      service.discoverMovies = function (filters) {
        filters = filters || {};
        var params = {
          sort_by: "popularity.desc",
          include_adult: false,
          page: 1
        };

        // ------------------------
        // Genre & Anime Combination
        // ------------------------
        if (filters.industry === "Anime") {
          // Keep Anime genre (16 = Animation) while preserving user-selected genre if any
          params.with_genres = filters.genreId ? (filters.genreId + ",16") : "16";
        } else if (filters.genreId) {
          params.with_genres = filters.genreId;
        }

        // ------------------------
        // Industry & Language synergy
        // ------------------------
        // If user explicitly picked a language (other than "Any"), prioritize it
        if (filters.language) {
          params.with_original_language = filters.language;
        } else if (filters.industry) {
          // If language was "Any", use industry default
          switch (filters.industry) {
            case "Hollywood":
              params.with_original_language = "en";
              break;
            case "Bollywood":
              params.with_origin_country = "IN";
              params.with_original_language = "hi";
              break;
            case "Tollywood":
              params.with_origin_country = "IN";
              params.with_original_language = "te";
              break;
            case "Korean":
              params.with_original_language = "ko";
              break;
            case "Anime":
              params.with_original_language = "ja";
              break;
          }
        }

        // ------------------------
        // Rating (requires vote_count threshold to avoid obscure 1-vote films)
        // ------------------------
        if (filters.rating && filters.rating > 0) {
          params["vote_average.gte"] = filters.rating;
          params["vote_count.gte"] = 30;
        }

        // ------------------------
        // Timeline
        // ------------------------
        if (filters.releaseFrom) {
          params["primary_release_date.gte"] = filters.releaseFrom;
        }
        if (filters.releaseTo) {
          params["primary_release_date.lte"] = filters.releaseTo;
        }

        return request("/discover/movie", params)
          .then(function (res) {
            // If strict filters return 0 results, retry with relaxed rating/timeline
            // so the user never encounters an empty void
            if ((!res.results || res.results.length === 0) && (params["vote_average.gte"] || params["primary_release_date.gte"])) {
              var relaxed = angular.copy(params);
              delete relaxed["vote_average.gte"];
              delete relaxed["vote_count.gte"];
              delete relaxed["primary_release_date.gte"];
              delete relaxed["primary_release_date.lte"];
              return request("/discover/movie", relaxed);
            }
            return res;
          });
      };
      // ---------------------------------------------------------
      // INDIAN CINEMA (Bollywood + regional: Tamil, Telugu, etc.)
      // Uses TMDB's /discover endpoint filtered by country of
      // origin so this works for Indian audiences without
      // needing a separate API or hardcoded movie list.
      // ---------------------------------------------------------

      // Popular Indian movies (all languages - Hindi, Tamil, Telugu, etc.)
      service.getIndianMovies = function (page) {
        return request('/discover/movie', {
          with_origin_country: 'IN',
          sort_by: 'popularity.desc',
          page: page || 1
        });
      };

      // Popular Indian web series / TV shows
      service.getIndianSeries = function (page) {
        return request('/discover/tv', {
          with_origin_country: 'IN',
          sort_by: 'popularity.desc',
          page: page || 1
        });
      };

      /* ----------------------------------------------------------
         IMAGE URL HELPERS
         Centralizing this means if TMDB changes their CDN path
         structure, we only fix it here.
         ---------------------------------------------------------- */
      service.getPosterUrl = function (path, size) {
        if (!path) {
          return 'assets/images/poster-placeholder.png';
        }
        return APP_CONFIG.TMDB_IMAGE_BASE + '/' + (size || APP_CONFIG.POSTER_SIZE) + path;
      };

      service.getBackdropUrl = function (path, size) {
        if (!path) {
          return 'assets/images/backdrop-placeholder.png';
        }
        return APP_CONFIG.TMDB_IMAGE_BASE + '/' + (size || APP_CONFIG.BACKDROP_SIZE) + path;
      };

      return service;
    }
  ]);

})();
