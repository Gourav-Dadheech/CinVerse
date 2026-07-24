/* ============================================================
   CineVerse - app.js
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
  angular.module('cineVerseApp', ['ngRoute', 'ngAnimate']);

  /* ------------------------------------------------------------
     2. GLOBAL APP CONFIGURATION (CONSTANTS)
     Keep the TMDB API key + base URLs in ONE place.
     Every service reads from this constant, nothing else
     should hard-code a URL or key.
     ------------------------------------------------------------ */
  angular.module('cineVerseApp').constant('APP_CONFIG', {
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
  angular.module('cineVerseApp').run([
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
  angular.module('cineVerseApp').controller('NavbarController', [
    '$location',
    '$window',
    function ($location, $window) {
      var vm = this;

      vm.menuOpen = false;
      vm.isScrolled = false;
      vm.quickQuery = '';

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
        $location.path('/search').search({ q: query });
      };

      // Shrink navbar background once user scrolls down
      angular.element($window).on('scroll', function () {
        vm.isScrolled = $window.pageYOffset > 40;
        // $applyAsync avoids the "digest already in progress" issue
        vm.isScrolled ? null : null;
      });
    }
  ]);

  /* ------------------------------------------------------------
     5. SCROLL CONTROLLER
     Powers the floating "Back to Top" button. Shows the
     button once the user scrolls past a threshold.
     ------------------------------------------------------------ */
  angular.module('cineVerseApp').controller('ScrollController', [
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

})();
