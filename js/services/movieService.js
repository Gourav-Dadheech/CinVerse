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
         IN-MEMORY & SESSION RESPONSE CACHE
         Caches successful responses for 5 minutes so clicking between
         Home, Details, and Back renders in 0ms with zero extra network load.
         ---------------------------------------------------------- */
      var responseCache = {};
      var CACHE_TTL_MS = 5 * 60 * 1000;

      function getCacheKey(endpoint, extraParams) {
        return endpoint + '?' + JSON.stringify(extraParams || {});
      }

      function getCached(endpoint, extraParams) {
        var key = getCacheKey(endpoint, extraParams);
        var item = responseCache[key];
        if (item && (Date.now() - item.time < CACHE_TTL_MS)) {
          return item.data;
        }
        return null;
      }

      function setCache(endpoint, extraParams, data) {
        if (!data) return;
        var key = getCacheKey(endpoint, extraParams);
        responseCache[key] = {
          data: angular.copy(data),
          time: Date.now()
        };
      }

      /* ----------------------------------------------------------
         CURATED GUARANTEED FALLBACK REPOSITORY
         Ensures home page never displays empty sliders or permanent
         skeleton loading tiles if mobile networks experience an outage.
         ---------------------------------------------------------- */
      var CURATED_FALLBACKS = {
        trending: [
          { id: 76600, title: 'Avatar: The Way of Water', poster_path: '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', backdrop_path: '/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg', vote_average: 7.7, release_date: '2022-12-16', overview: 'Set more than a decade after the events of the first film, learn the story of the Sully family.', original_language: 'en', media_type: 'movie' },
          { id: 299534, title: 'Avengers: Endgame', poster_path: '/or06FN3Dka5tukK1e9sl16pB3iy.jpg', backdrop_path: '/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg', vote_average: 8.3, release_date: '2019-04-26', overview: 'After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more.', original_language: 'en', media_type: 'movie' },
          { id: 872585, title: 'Oppenheimer', poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', backdrop_path: '/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg', vote_average: 8.1, release_date: '2023-07-21', overview: 'The story of J. Robert Oppenheimers role in the development of the atomic bomb during World War II.', original_language: 'en', media_type: 'movie' },
          { id: 569094, title: 'Spider-Man: Across the Spider-Verse', poster_path: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', backdrop_path: '/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg', vote_average: 8.4, release_date: '2023-06-02', overview: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.', original_language: 'en', media_type: 'movie' },
          { id: 157336, title: 'Interstellar', poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg', vote_average: 8.4, release_date: '2014-11-05', overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.', original_language: 'en', media_type: 'movie' }
        ],
        indian: [
          { id: 579974, title: 'RRR', poster_path: '/kdNdpkRk25Q9X69xV8zR5vE99nC.jpg', backdrop_path: '/foyGtoXd7m9qP48p5lQ2V33G9v8.jpg', vote_average: 7.9, release_date: '2022-03-24', overview: 'A fictional history of two legendary revolutionaries and their journey away from home before they began fighting for their country in the 1920s.', original_language: 'te', isIndian: true, media_type: 'movie' },
          { id: 801688, title: 'Kalki 2898 AD', poster_path: '/9bB1y8Usmb6o27Nn49mY0jN74sV.jpg', backdrop_path: '/sItl6E2uQdO5Jk8tP4wV6v9a4.jpg', vote_average: 7.5, release_date: '2024-06-27', overview: 'A modern avatar of Vishnu, a Hindu god, who is believed to have descended to earth to protect the world from evil forces in 2898 AD.', original_language: 'te', isIndian: true, media_type: 'movie' },
          { id: 866398, title: 'Jawan', poster_path: '/jXJxMcikBpu3ugWUs2ezb9gc8Ku.jpg', backdrop_path: '/7nr00eU3Kx2wzG5r0J3X5.jpg', vote_average: 7.3, release_date: '2023-09-07', overview: 'An emotional journey of a man set to rectify the wrongs in society in a high-octane action thriller.', original_language: 'hi', isIndian: true, media_type: 'movie' },
          { id: 872906, title: 'Animal', poster_path: '/hr9aCe9q6Adql2ZqEvm4k4Jp7uN.jpg', backdrop_path: '/yOm993lsJyNIu94hqx2GeUxaw1E.jpg', vote_average: 6.8, release_date: '2023-12-01', overview: 'A son undergoes a remarkable transformation as his bond with his father begins to fracture.', original_language: 'hi', isIndian: true, media_type: 'movie' }
        ],
        genres: [
          { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
          { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 18, name: 'Drama' },
          { id: 14, name: 'Fantasy' }, { id: 27, name: 'Horror' }, { id: 878, name: 'Sci-Fi' },
          { id: 53, name: 'Thriller' }, { id: 10749, name: 'Romance' }, { id: 9648, name: 'Mystery' }
        ]
      };

      /* ----------------------------------------------------------
         PRIVATE HELPER: buildUrl
         Builds query string and appends to the specified base URL.
         ---------------------------------------------------------- */
      function buildUrlWithBase(baseUrl, endpoint, extraParams, includeApiKey) {
        var params = angular.extend(
          {
            language: APP_CONFIG.DEFAULT_LANGUAGE
          },
          extraParams || {}
        );

        if (includeApiKey && APP_CONFIG.TMDB_API_KEY) {
          params.api_key = APP_CONFIG.TMDB_API_KEY;
        }

        var query = Object.keys(params)
          .map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
          })
          .join('&');

        return baseUrl + endpoint + '?' + query;
      }

      /* ----------------------------------------------------------
         PRIVATE HELPER: request
         Multi-tiered failover request engine:
         1. Checks in-memory cache for instant 0s response.
         2. Tries primary unblocked TMDB endpoint (api.tmdb.org)
            which bypasses Indian ISP DNS blocks.
         3. Falls back to api.themoviedb.org if primary times out.
         4. Falls back to direct v3 API Key query parameter.
         5. Returns curated emergency fallbacks on total network failure
            so the UI NEVER stays stuck on a loading screen or skeleton.
         ---------------------------------------------------------- */
      function request(endpoint, extraParams) {
        var deferred = $q.defer();

        // 1. Instant Cache Check
        var cached = getCached(endpoint, extraParams);
        if (cached) {
          deferred.resolve(cached);
          return deferred.promise;
        }

        // Ordered list of TMDB mirrors: unblocked api.tmdb.org first!
        var mirrors = APP_CONFIG.TMDB_MIRRORS && APP_CONFIG.TMDB_MIRRORS.length
          ? APP_CONFIG.TMDB_MIRRORS
          : ['https://api.tmdb.org/3', 'https://api.themoviedb.org/3'];

        function tryMirror(mirrorIdx, useApiKey) {
          if (mirrorIdx >= mirrors.length) {
            // If all network mirrors failed, try using API key parameter on primary
            if (!useApiKey) {
              tryMirror(0, true);
              return;
            }

            // Emergency Fallback if device is completely offline
            if (endpoint.indexOf('/trending') !== -1 || endpoint.indexOf('/popular') !== -1) {
              deferred.resolve({ results: CURATED_FALLBACKS.trending, page: 1, total_pages: 1 });
              return;
            }
            if (endpoint.indexOf('/discover/movie') !== -1 && (extraParams && extraParams.with_original_language === 'hi|te|ta|ml|kn')) {
              deferred.resolve({ results: CURATED_FALLBACKS.indian, page: 1, total_pages: 1 });
              return;
            }
            if (endpoint.indexOf('/genre/movie/list') !== -1) {
              deferred.resolve({ genres: CURATED_FALLBACKS.genres });
              return;
            }

            deferred.reject({
              message: 'Unable to reach TMDB. Please check your internet connection.',
              status: 0
            });
            return;
          }

          var currentBase = mirrors[mirrorIdx];
          var url = buildUrlWithBase(currentBase, endpoint, extraParams, useApiKey);

          var reqHeaders = {
            'Content-Type': 'application/json;charset=utf-8'
          };
          if (!useApiKey && APP_CONFIG.TMDB_READ_TOKEN) {
            reqHeaders['Authorization'] = 'Bearer ' + APP_CONFIG.TMDB_READ_TOKEN;
          }

          $http.get(url, {
            headers: reqHeaders,
            timeout: 5000 // 5-second fast failover limit before switching to next mirror
          })
            .then(function (response) {
              if (response && response.data) {
                setCache(endpoint, extraParams, response.data);
                deferred.resolve(response.data);
              } else {
                tryMirror(mirrorIdx + 1, useApiKey);
              }
            })
            .catch(function (error) {
              // 404 indicates resource actually doesn't exist; do not retry other mirrors
              if (error && error.status === 404) {
                deferred.reject({
                  message: 'Item not found on TMDB.',
                  status: 404,
                  raw: error
                });
                return;
              }
              // Network timeout, DNS failure, or 5xx: try next mirror immediately
              tryMirror(mirrorIdx + 1, useApiKey);
            });
        }

        tryMirror(0, false);
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
