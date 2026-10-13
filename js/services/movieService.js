/* ============================================================
   CinVerse - movieService.js
   ------------------------------------------------------------
   SINGLE SOURCE OF TRUTH for all TMDB API communication.
   No controller should ever call $http directly - everything
   goes through this service so the API layer stays swappable
   and easy to test/mock.
   ============================================================ */

(function () {
  'use strict';

  angular.module('cinVerseApp').factory('MovieService', [
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
         SMART QUERY FALLBACK HELPER
         Handles user typos, gender swaps ("actor" vs "actress"),
         stop-words ("is", "a", "an"), and keywords for accurate matching.
         ---------------------------------------------------------- */
      var STOP_WORDS = {
        'is': true, 'are': true, 'was': true, 'were': true, 'the': true,
        'a': true, 'an': true, 'in': true, 'on': true, 'at': true,
        'to': true, 'for': true, 'of': true, 'and': true, 'with': true,
        'from': true, 'it': true, 'that': true, 'this': true, 'my': true,
        'your': true, 'his': true, 'her': true, 'their': true
      };

      function generateSearchFallbacks(rawQuery) {
        var q = (rawQuery || '').trim().toLowerCase();
        if (!q) return [];
        var candidates = [];

        // 1. Swap gender/alias words safely without immediately reverting
        var syn = q.replace(/\b(actor|actress)\b/gi, function (m) {
          return m.toLowerCase() === 'actor' ? 'actress' : 'actor';
        }).replace(/\b(animes?|movies?|series|shows?|season\s*\d+)\b/gi, '').trim();

        // 2. If synonym or media type removal changed the query:
        if (syn && syn !== q) {
          var synTokens = syn.split(/[\s,.'"\-_:!?/()]+/).filter(Boolean);
          var synNonStop = synTokens.filter(function (t) { return !STOP_WORDS[t]; });
          if (synNonStop.length > 0) {
            candidates.push(synNonStop.join(' '));
          }
          candidates.push(syn);
        }

        // 3. Remove stop words from original query
        var tokens = q.split(/[\s,.'"\-_:!?/()]+/).filter(Boolean);
        var nonStop = tokens.filter(function (t) { return !STOP_WORDS[t]; });
        if (nonStop.length > 0 && nonStop.length < tokens.length) {
          candidates.push(nonStop.join(' '));
        }

        // 4. Prominent keyword pairs for multi-word queries (e.g. "classmate sexy", "overflow")
        if (syn && syn !== q) {
          var synTokens2 = syn.split(/[\s,.'"\-_:!?/()]+/).filter(Boolean);
          var synNonStop2 = synTokens2.filter(function (t) { return !STOP_WORDS[t]; });
          if (synNonStop2.length >= 3) {
            candidates.push(synNonStop2.slice(0, 2).join(' '));
            candidates.push([synNonStop2[0], synNonStop2[synNonStop2.length - 1]].join(' '));
            candidates.push(synNonStop2.slice(1).join(' '));
          }
        }

        if (nonStop.length >= 3) {
          candidates.push(nonStop.slice(0, 2).join(' '));
          candidates.push([nonStop[0], nonStop[nonStop.length - 1]].join(' '));
          candidates.push(nonStop.slice(1).join(' '));
        }

        // Unique deduplicated candidates excluding the exact original query
        var seen = {};
        seen[q] = true;
        return candidates.filter(function (item) {
          item = (item || '').trim();
          if (!item || seen[item]) return false;
          seen[item] = true;
          return true;
        });
      }

      function tryMultiFallbacks(fallbacks, index) {
        if (!fallbacks || index >= fallbacks.length) {
          return $q.resolve(null);
        }
        var candidate = fallbacks[index];
        return request('/search/multi', {
          query: candidate,
          page: 1,
          include_adult: true
        }).then(function (res) {
          if (res && res.results && res.results.length > 0) {
            return res;
          }
          return tryMultiFallbacks(fallbacks, index + 1);
        }).catch(function () {
          return tryMultiFallbacks(fallbacks, index + 1);
        });
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

      // Search movies by text query (with adult and anime content included)
      service.searchMovies = function (query, page) {
        return request('/search/movie', { query: query, page: page || 1, include_adult: true });
      };

      // Search TV shows / Anime series by text query
      service.searchTv = function (query, page) {
        return request('/search/tv', { query: query, page: page || 1, include_adult: true });
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
          include_adult: true,
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

      // ---------------------------------------------------------
      // TV SHOWS, WEB SERIES, ANIME & K-DRAMAS (FLIQ TV Engine)
      // ---------------------------------------------------------

      // Popular TV Shows / Web Series
      service.getPopularTv = function (page) {
        return request('/tv/popular', { page: page || 1 });
      };

      // Top Rated TV Shows
      service.getTopRatedTv = function (page) {
        return request('/tv/top_rated', { page: page || 1 });
      };

      // Trending TV Shows (this week)
      service.getTrendingTv = function () {
        return request('/trending/tv/week');
      };

      // Anime TV Series (Demon Slayer, Jujutsu Kaisen, Overflow, etc.)
      service.getAnimeShows = function (page) {
        return request('/discover/tv', {
          with_genres: '16',
          with_original_language: 'ja',
          include_adult: true,
          sort_by: 'popularity.desc',
          page: page || 1
        });
      };

      // K-Drama TV Series (Korean Drama)
      service.getKdramaShows = function (page) {
        return request('/discover/tv', {
          with_original_language: 'ko',
          sort_by: 'popularity.desc',
          page: page || 1
        });
      };

      // Full TV Show Details (includes number of seasons, episodes, networks)
      service.getTvDetails = function (tvId) {
        return request('/tv/' + tvId);
      };

      // Season Details with all episodes
      service.getTvSeason = function (tvId, seasonNumber) {
        return request('/tv/' + tvId + '/season/' + seasonNumber);
      };

      // Cast & Crew for TV Show
      service.getTvCredits = function (tvId) {
        return request('/tv/' + tvId + '/credits');
      };

      // Trailers & Videos for TV Show
      service.getTvVideos = function (tvId) {
        return request('/tv/' + tvId + '/videos');
      };

      // Similar TV Shows
      service.getTvSimilar = function (tvId) {
        return request('/tv/' + tvId + '/similar');
      };

      // TV Shows by Watch Provider (Netflix, Prime, Disney+, etc.)
      service.getByWatchProviderTv = function (providerId, region, page) {
        return request('/discover/tv', {
          with_watch_providers: providerId,
          watch_region: region || 'IN',
          sort_by: 'popularity.desc',
          page: page || 1
        }).then(function (res) {
          if (!res.results || res.results.length === 0) {
            return request('/discover/tv', {
              with_watch_providers: providerId,
              watch_region: 'US',
              sort_by: 'popularity.desc',
              page: page || 1
            });
          }
          return res;
        });
      };

      // Multi-search: searches across BOTH movies AND TV shows (with anime & adult support + smart fallbacks)
      service.searchMulti = function (query, page) {
        page = page || 1;
        var trimmed = (query || '').trim();
        if (!trimmed) {
          return $q.resolve({ results: [], total_results: 0 });
        }

        return request('/search/multi', {
          query: trimmed,
          page: page,
          include_adult: true
        }).then(function (data) {
          if (data && data.results && data.results.length > 0) {
            return data;
          }
          // If page 1 returns 0 results, trigger intelligent fallback sequence
          if (page === 1) {
            var fallbacks = generateSearchFallbacks(trimmed);
            return tryMultiFallbacks(fallbacks, 0).then(function (fbData) {
              if (fbData && fbData.results && fbData.results.length > 0) {
                return fbData;
              }
              // If still empty, check dedicated /search/tv endpoint as backup
              return request('/search/tv', {
                query: trimmed,
                page: 1,
                include_adult: true
              }).then(function (tvData) {
                if (tvData && tvData.results && tvData.results.length > 0) {
                  tvData.results.forEach(function (r) {
                    if (!r.media_type) r.media_type = 'tv';
                  });
                  return tvData;
                }
                return data;
              }).catch(function () {
                return data;
              });
            });
          }
          return data;
        });
      };

      // Curated & Dynamic Ecchi & 18+ Anime (Overflow, My Classmate's a Sexy Actress, Redo of Healer, etc.)
      service.getEcchiAnime = function (page) {
        page = page || 1;
        var featuredIds = [95897, 325473, 70998, 99071, 45950, 96444, 64706, 68005, 83103, 45998, 34742, 63187, 114477];
        if (page === 1) {
          var detailsPromises = featuredIds.map(function (id) {
            return service.getTvDetails(id).then(function (show) {
              if (show && show.id) {
                show.isTv = true;
                show.media_type = 'tv';
                return show;
              }
              return null;
            }).catch(function () { return null; });
          });
          return $q.all(detailsPromises).then(function (list) {
            var valid = list.filter(Boolean);
            return request('/discover/tv', {
              with_genres: '16',
              with_original_language: 'ja',
              include_adult: true,
              sort_by: 'popularity.desc',
              page: page
            }).then(function (res) {
              var disc = res.results || [];
              disc.forEach(function (d) { d.isTv = true; d.media_type = 'tv'; });
              var adultOnly = disc.filter(function (d) { return d.adult; });
              return { results: valid.concat(adultOnly) };
            }).catch(function () {
              return { results: valid };
            });
          });
        }
        return request('/discover/tv', {
          with_genres: '16',
          with_original_language: 'ja',
          include_adult: true,
          sort_by: 'popularity.desc',
          page: page
        }).then(function (res) {
          var list = res.results || [];
          list.forEach(function (d) { d.isTv = true; d.media_type = 'tv'; });
          return { results: list.filter(function (d) { return d.adult; }) };
        });
      };

      // Discover movies by OTT Streaming Provider (Netflix, Prime, Disney+ Hotstar, JioCinema, etc.)
      service.getByWatchProvider = function (providerId, region, page) {
        return request('/discover/movie', {
          with_watch_providers: providerId,
          watch_region: region || 'IN',
          sort_by: 'popularity.desc',
          page: page || 1
        }).then(function (res) {
          if (!res.results || res.results.length === 0) {
            // Relax region to US if regional provider list is sparse
            return request('/discover/movie', {
              with_watch_providers: providerId,
              watch_region: 'US',
              sort_by: 'popularity.desc',
              page: page || 1
            });
          }
          return res;
        });
      };

      // Discover movies by Studio / Franchise (Marvel, DC, Star Wars, Pixar, Harry Potter, Anime)
      service.getFranchiseMovies = function (franchiseKey, page, sortBy) {
        page = page || 1;
        sortBy = sortBy || 'popularity.desc';
        switch (franchiseKey) {
          case 'marvel':
            return request('/discover/movie', {
              with_companies: '420|7505',
              sort_by: sortBy,
              page: page
            });
          case 'dc':
            return request('/discover/movie', {
              with_companies: '429|9993|128064',
              sort_by: sortBy,
              page: page
            });
          case 'starwars':
            return request('/search/movie', {
              query: 'Star Wars',
              page: page
            });
          case 'pixar':
            return request('/discover/movie', {
              with_companies: '3',
              sort_by: sortBy,
              page: page
            });
          case 'harrypotter':
            return request('/search/movie', {
              query: 'Harry Potter',
              page: page
            });
          case 'anime':
            return request('/discover/movie', {
              with_genres: '16',
              with_original_language: 'ja',
              include_adult: true,
              sort_by: sortBy,
              page: page
            });
          default:
            return request('/search/movie', {
              query: franchiseKey,
              page: page
            });
        }
      };

      // Discover TV Shows / Web Series by Franchise
      service.getFranchiseTv = function (franchiseKey, page, sortBy) {
        page = page || 1;
        sortBy = sortBy || 'popularity.desc';
        switch (franchiseKey) {
          case 'marvel':
            return request('/discover/tv', {
              with_companies: '420|7505',
              without_genres: '16',
              sort_by: sortBy,
              page: page
            });
          case 'dc':
            return request('/discover/tv', {
              with_companies: '429|9993|128064',
              without_genres: '16',
              sort_by: sortBy,
              page: page
            });
          case 'starwars':
            return request('/discover/tv', {
              with_companies: '1',
              without_genres: '16',
              sort_by: sortBy,
              page: page
            });
          case 'pixar':
            return request('/discover/tv', {
              with_companies: '3',
              sort_by: sortBy,
              page: page
            });
          case 'harrypotter':
            return request('/search/tv', {
              query: 'Harry Potter',
              page: page
            });
          case 'anime':
            return request('/discover/tv', {
              with_genres: '16',
              with_original_language: 'ja',
              include_adult: true,
              sort_by: sortBy,
              page: page
            });
          default:
            return request('/search/tv', {
              query: franchiseKey,
              page: page
            });
        }
      };

      // Discover Animation & Cartoons (Series) by Franchise
      service.getFranchiseAnimation = function (franchiseKey, page) {
        page = page || 1;
        switch (franchiseKey) {
          case 'marvel':
            return request('/discover/tv', {
              with_companies: '420|7505',
              with_genres: '16',
              sort_by: 'popularity.desc',
              page: page
            });
          case 'dc':
            return request('/discover/tv', {
              with_companies: '429|9993|128064',
              with_genres: '16',
              sort_by: 'popularity.desc',
              page: page
            });
          case 'starwars':
            return request('/discover/tv', {
              with_companies: '1',
              with_genres: '16',
              sort_by: 'popularity.desc',
              page: page
            });
          case 'pixar':
            return request('/discover/movie', {
              with_companies: '3',
              with_genres: '16',
              sort_by: 'popularity.desc',
              page: page
            });
          case 'harrypotter':
            return request('/search/movie', {
              query: 'Fantastic Beasts',
              page: page
            });
          case 'anime':
            return request('/discover/tv', {
              with_genres: '16',
              with_original_language: 'ja',
              include_adult: true,
              sort_by: 'popularity.desc',
              page: page
            });
          default:
            return request('/discover/movie', {
              with_genres: '16',
              sort_by: 'popularity.desc',
              page: page
            });
        }
      };

      // Discover Animated Movies & Specials by Franchise
      service.getFranchiseAnimationMovies = function (franchiseKey, page) {
        page = page || 1;
        switch (franchiseKey) {
          case 'marvel':
            return request('/discover/movie', {
              with_companies: '420|7505',
              with_genres: '16',
              sort_by: 'popularity.desc',
              page: page
            });
          case 'dc':
            return request('/discover/movie', {
              with_companies: '429|9993|128064',
              with_genres: '16',
              sort_by: 'popularity.desc',
              page: page
            });
          case 'starwars':
            return request('/search/movie', {
              query: 'Star Wars LEGO',
              page: page
            });
          case 'pixar':
            return request('/discover/movie', {
              with_companies: '3',
              with_genres: '16',
              sort_by: 'popularity.desc',
              page: page
            });
          case 'harrypotter':
            return request('/search/movie', {
              query: 'LEGO Harry Potter',
              page: page
            });
          case 'anime':
            return request('/discover/movie', {
              with_genres: '16',
              with_original_language: 'ja',
              include_adult: true,
              sort_by: 'popularity.desc',
              page: page
            });
          default:
            return service.getFranchiseAnimation(franchiseKey, page);
        }
      };

      // Chronological Timeline Order
      service.getFranchiseTimeline = function (franchiseKey, page) {
        page = page || 1;
        switch (franchiseKey) {
          case 'marvel':
            return request('/discover/movie', {
              with_companies: '420|7505',
              'primary_release_date.gte': '2008-01-01',
              sort_by: 'primary_release_date.asc',
              page: page
            });
          case 'dc':
            return request('/discover/movie', {
              with_companies: '429|9993|128064',
              'primary_release_date.gte': '1989-01-01',
              sort_by: 'primary_release_date.asc',
              page: page
            });
          case 'starwars':
            return service.getCollection(10);
          case 'pixar':
            return request('/discover/movie', {
              with_companies: '3',
              sort_by: 'primary_release_date.asc',
              page: page
            });
          case 'harrypotter':
            return service.getCollection(1241);
          case 'anime':
            return request('/discover/movie', {
              with_genres: '16',
              with_original_language: 'ja',
              include_adult: true,
              sort_by: 'primary_release_date.asc',
              page: page
            });
          default:
            return service.getFranchiseMovies(franchiseKey, page, 'primary_release_date.asc');
        }
      };

      // Get official collection (e.g. Harry Potter Collection = 1241, Star Wars = 10, Fantastic Beasts = 435259)
      service.getCollection = function (collectionId) {
        return request('/collection/' + collectionId);
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
