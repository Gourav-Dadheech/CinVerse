/* ============================================================
   CineVerse - routes.js
   Client-side routing configuration using ngRoute.
   Maps every URL path to a view template + controller.
   ============================================================ */

(function () {
  'use strict';

  angular.module('cineVerseApp').config([
    '$routeProvider',
    '$locationProvider',
    function ($routeProvider, $locationProvider) {

      $routeProvider

        // ---------------- HOME ----------------
        .when('/home', {
          templateUrl: 'views/home.html',
          controller: 'HomeController',
          controllerAs: 'homeCtrl'
        })

        // ---------------- SEARCH ----------------
        .when('/search', {
          templateUrl: 'views/search.html',
          controller: 'SearchController',
          controllerAs: 'searchCtrl',
          reloadOnSearch: true // re-run controller when ?q= changes
        })

        // ---------------- MOVIE DETAILS ----------------
        .when('/movie/:movieId', {
          templateUrl: 'views/movie.html',
          controller: 'MovieController',
          controllerAs: 'movieCtrl'
        })

        // ---------------- FAVORITES ----------------
        .when('/favorites', {
          templateUrl: 'views/favorites.html',
          controller: 'FavoriteController',
          controllerAs: 'favCtrl'
        })

        // ---------------- WATCHLIST ----------------
        .when('/watchlist', {
          templateUrl: 'views/watchlist.html',
          controller: 'WatchlistController',
          controllerAs: 'watchCtrl'
        })

        // ---------------- 404 NOT FOUND ----------------
        .when('/404', {
          templateUrl: 'views/notfound.html'
        })
        .when("/movie-match", {
    templateUrl: "views/movie-match.html",
    controller: "MovieMatchController",
    controllerAs: "vm"
})

        // ---------------- DEFAULT / FALLBACK ----------------
        .otherwise({
          redirectTo: '/home'
        });

      // Using hashbang mode (#!/) keeps this project runnable by simply
      // opening index.html in a browser or via a static file server,
      // with no server-side rewrite rules required.
      $locationProvider.hashPrefix('!');
    }
  ]);

})();
