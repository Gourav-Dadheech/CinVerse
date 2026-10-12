/* ============================================================
   CinVerse - app.js
   Main AngularJS Module Definition
   This file bootstraps the entire application, wires up
   global config values (like the TMDB API key) and defines
   small "global" controllers used outside of routed views
   (Navbar, Scroll-to-top, global loading state).
   ============================================================ */

(function () {
  'use strict';

  /* ------------------------------------------------------------
     1. MODULE DEFINITION
     Dependencies:
       - ngRoute   -> for client side routing ($routeProvider)
       - ngAnimate -> for smooth enter/leave animations
     ------------------------------------------------------------ */
  angular.module('cinVerseApp', ['ngRoute', 'ngAnimate']);
  angular.module('cineVerseApp', ['cinVerseApp']);

  /* ------------------------------------------------------------
     2. GLOBAL APP CONFIGURATION (CONSTANTS)
     Keep the TMDB API key + base URLs in ONE place.
     Every service reads from this constant, nothing else
     should hard-code a URL or key.
     ------------------------------------------------------------ */
  angular.module('cinVerseApp').constant('APP_CONFIG', {
    // TODO: Replace with your own TMDB v4 Read Access Token. See README.md
    // This is sent as a "Bearer" token in the Authorization header,
    // NOT as a URL query parameter - keeps it out of logs/browser history.
    TMDB_READ_TOKEN: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxODhkYTFjMGMyYjRmZWJmMWU3MTg5MzlhNzBhYzhmNCIsIm5iZiI6MTc4NDgyMjEyMy44MTEsInN1YiI6IjZhNjIzOTZiNWUyNDRkNWFmYzQxNTc3NCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.zviydinWxjR35KhSte-PcVeTkCwLdiQgwFkvHjSHKKg',
    TMDB_BASE_URL: 'https://api.themoviedb.org/3',
    TMDB_IMAGE_BASE: 'https://image.tmdb.org/t/p',
    POSTER_SIZE: 'w500',
    BACKDROP_SIZE: 'original',
    DEFAULT_LANGUAGE: 'en-US'
  });

  /* ------------------------------------------------------------
     3. RUN BLOCK
     Runs once when the app bootstraps.
     - Sets up a global "appLoading" flag on rootScope so the
       spinner in index.html can react to route changes.
     - Handles route change errors -> redirect to 404.
     ------------------------------------------------------------ */
  angular.module('cinVerseApp').run([
    '$rootScope',
    '$location',
    function ($rootScope, $location) {

      // Global loading indicator, toggled on route transitions
      $rootScope.appLoading = false;

      $rootScope.$on('$routeChangeStart', function () {
        $rootScope.appLoading = true;
      });

      $rootScope.$on('$routeChangeSuccess', function () {
        $rootScope.appLoading = false;
        window.scrollTo(0, 0); // scroll to top on every page change
      });

      $rootScope.$on('$routeChangeError', function () {
        $rootScope.appLoading = false;
        $location.path('/404');
      });
    }
  ]);

  /* ------------------------------------------------------------
     4. NAVBAR CONTROLLER
     Controls the top navigation bar: mobile menu toggle,
     shrink-on-scroll effect, and the quick-search form.
     ------------------------------------------------------------ */
  angular.module('cinVerseApp').controller('NavbarController', [
    '$location',
    '$window',
    '$rootScope',
    '$timeout',
    'StorageService',
    'MovieService',
    function ($location, $window, $rootScope, $timeout, StorageService, MovieService) {
      var vm = this;

      vm.menuOpen = false;
      vm.isScrolled = false;
      vm.quickQuery = '';
      vm.suggestions = [];
      vm.showSuggestions = false;
      vm.isLoadingSuggestions = false;
      vm.mobileSearchOpen = false;

      var searchTimer = null;

      vm.getPosterUrl = function (path) {
        return MovieService.getPosterUrl(path, 'w92');
      };

      vm.toggleMobileSearch = function () {
        vm.mobileSearchOpen = !vm.mobileSearchOpen;
        if (vm.mobileSearchOpen) {
          vm.menuOpen = false;
          $timeout(function () {
            var input = $window.document.getElementById('navbarSearchInput');
            if (input) {
              input.focus();
            }
          }, 120);
        } else {
          vm.showSuggestions = false;
        }
      };

      vm.closeMobileSearch = function () {
        vm.mobileSearchOpen = false;
        vm.showSuggestions = false;
      };

      vm.onSearchFocus = function () {
        var q = (vm.quickQuery || '').trim();
        if (q.length >= 2) {
          vm.showSuggestions = true;
          if (!vm.suggestions || vm.suggestions.length === 0) {
            vm.onSearchInput();
          }
        }
      };

      vm.onSearchInput = function () {
        var q = (vm.quickQuery || '').trim();
        if (searchTimer) {
          $timeout.cancel(searchTimer);
        }
        if (q.length < 2) {
          vm.suggestions = [];
          vm.showSuggestions = false;
          vm.isLoadingSuggestions = false;
          return;
        }

        vm.isLoadingSuggestions = true;
        vm.showSuggestions = true;

        searchTimer = $timeout(function () {
          MovieService.searchMulti(q, 1)
            .then(function (data) {
              if ((vm.quickQuery || '').trim() === q) {
                var results = (data.results || []).filter(function (it) {
                  return it.media_type === 'movie' || it.media_type === 'tv';
                });
                results.forEach(function (it) {
                  it.isTv = (it.media_type === 'tv') || (!it.title && !!it.name);
                  it.displayTitle = it.title || it.name || 'Untitled';
                  it.displayDate = it.release_date || it.first_air_date || '';
                  it.targetUrl = it.isTv ? ('#!/tv/' + it.id) : ('#!/movie/' + it.id);
                });
                vm.suggestions = results.slice(0, 7);
              }
            })
            .catch(function () {
              vm.suggestions = [];
            })
            .finally(function () {
              vm.isLoadingSuggestions = false;
            });
        }, 180);
      };

      vm.selectSuggestion = function (item) {
        vm.showSuggestions = false;
        vm.mobileSearchOpen = false;
        vm.quickQuery = '';
        vm.suggestions = [];
        if (item && item.targetUrl) {
          var cleanPath = item.targetUrl.replace('#!', '');
          $location.url(cleanPath);
        }
      };

      vm.clearQuickSearch = function () {
        vm.quickQuery = '';
        vm.suggestions = [];
        vm.showSuggestions = false;
      };

      vm.closeSuggestions = function () {
        $timeout(function () {
          vm.showSuggestions = false;
        }, 300);
      };

      vm.userDropdownOpen = false;
      vm.showAuthModal = false;
      vm.authTab = 'login';
      vm.authError = '';

      vm.currentUser = StorageService.getCurrentUser();

      vm.loginForm = { email: '', password: '' };
      vm.registerForm = { name: '', email: '', password: '', avatar: '🎬' };
      vm.avatarChoices = ['🎬', '🍿', '⚡', '🔥', '👑', '🚀', '🧑‍💻', '🌟'];

      vm.toggleUserDropdown = function () {
        vm.userDropdownOpen = !vm.userDropdownOpen;
      };

      vm.openAuthModal = function (tab) {
        vm.authTab = tab === 'register' ? 'register' : 'login';
        vm.authError = '';
        vm.userDropdownOpen = false;
        vm.showAuthModal = true;
      };

      vm.closeAuthModal = function (e) {
        if (!e || (e.target && (e.target.classList.contains('auth-modal-backdrop') || e.target.classList.contains('btn-close-modal') || e.target.closest('.btn-close-modal')))) {
          vm.showAuthModal = false;
          vm.authError = '';
        }
      };

      vm.selectAvatar = function (avatar) {
        vm.registerForm.avatar = avatar;
      };

      vm.submitLogin = function () {
        vm.authError = '';
        if (!vm.loginForm.email) {
          vm.authError = 'Please enter your email.';
          return;
        }
        var res = StorageService.login(vm.loginForm.email, vm.loginForm.password);
        if (res.success) {
          vm.currentUser = res.user;
          vm.showAuthModal = false;
          vm.loginForm = { email: '', password: '' };
          $rootScope.$broadcast('userChanged', vm.currentUser);
        } else {
          vm.authError = res.message || 'Login failed.';
        }
      };

      vm.submitRegister = function () {
        vm.authError = '';
        if (!vm.registerForm.name || !vm.registerForm.email) {
          vm.authError = 'Please provide your name and email.';
          return;
        }
        var res = StorageService.register(
          vm.registerForm.name,
          vm.registerForm.email,
          vm.registerForm.password,
          vm.registerForm.avatar
        );
        if (res.success) {
          vm.currentUser = res.user;
          vm.showAuthModal = false;
          vm.registerForm = { name: '', email: '', password: '', avatar: '🎬' };
          $rootScope.$broadcast('userChanged', vm.currentUser);
        } else {
          vm.authError = res.message || 'Registration failed.';
        }
      };

      vm.logout = function () {
        StorageService.logout();
        vm.currentUser = null;
        vm.userDropdownOpen = false;
        $rootScope.$broadcast('userChanged', null);
      };

      // Toggle hamburger menu (mobile)
      vm.toggleMenu = function () {
        vm.menuOpen = !vm.menuOpen;
      };

      // Navigate to the search page carrying the typed query
      vm.goToSearch = function () {
        var query = (vm.quickQuery || '').trim();
        if (query.length === 0) {
          return;
        }
        vm.menuOpen = false;
        vm.mobileSearchOpen = false;
        vm.showSuggestions = false;
        $location.path('/search').search({ q: query });
      };

      vm.isActive = function (path) {
        var current = $location.path();
        if (path === '/home' && (current === '' || current === '/' || current === '/home')) {
          return true;
        }
        if (path && path !== '/home' && current.indexOf(path) === 0) {
          return true;
        }
        return current === path;
      };

      // Smooth scroll state update for navbar glass capsule transformation
      angular.element($window).on('scroll', function () {
        var shouldScrolled = ($window.pageYOffset || document.documentElement.scrollTop || 0) > 40;
        if (shouldScrolled !== vm.isScrolled) {
          vm.isScrolled = shouldScrolled;
          $rootScope.$applyAsync();
        }
      });
    }
  ]);

  /* ------------------------------------------------------------
     5. SCROLL CONTROLLER
     Powers the floating "Back to Top" button. Shows the
     button once the user scrolls past a threshold.
     ------------------------------------------------------------ */
  angular.module('cinVerseApp').controller('ScrollController', [
    '$window',
    '$rootScope',
    function ($window, $rootScope) {
      var vm = this;
      vm.showButton = false;

      angular.element($window).on('scroll', function () {
        var shouldShow = $window.pageYOffset > 500;
        if (shouldShow !== vm.showButton) {
          vm.showButton = shouldShow;
          $rootScope.$applyAsync();
        }
      });

      vm.scrollToTop = function () {
        $window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    }
  ]);

  /* ------------------------------------------------------------
     6. FOOTER ACCORDION SYNC (DESKTOP OPEN / MOBILE COMPACT)
     ------------------------------------------------------------ */
  function syncFooterAccordions() {
    var isDesktop = window.innerWidth >= 769;
    var accs = document.querySelectorAll('.footer-acc');
    for (var i = 0; i < accs.length; i++) {
      var acc = accs[i];
      if (isDesktop) {
        acc.setAttribute('open', '');
      } else if (!acc.dataset.userToggled) {
        acc.removeAttribute('open');
      }
    }
  }

  window.addEventListener('resize', syncFooterAccordions);
  document.addEventListener('DOMContentLoaded', syncFooterAccordions);

  // Mark accordion as manually opened/closed when user taps summary on mobile
  document.addEventListener('click', function (e) {
    var summary = e.target.closest('.footer-acc summary');
    if (summary && window.innerWidth < 769) {
      var parentAcc = summary.closest('.footer-acc');
      if (parentAcc) {
        parentAcc.dataset.userToggled = 'true';
      }
    }
  });

})();
