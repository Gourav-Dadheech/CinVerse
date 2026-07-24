(function () {

    'use strict';

    angular.module('cineVerseApp')

    .controller('MovieMatchController', function ($timeout, MovieService) {

        var vm = this;

        // ===========================
        // BASIC STATE
        // ===========================

        vm.step = 1;
        vm.loading = false;
        vm.results = [];

        // ===========================
        // USER ANSWERS
        // ===========================

        vm.answers = {

            mood: "",
            genre: "",
            industry: "",
            language: "",
            timeline: {},
            rating: ""

        };

        // ===========================
        // OPTIONS
        // ===========================

        vm.moods = [

            "😊 Happy",
            "😂 Funny",
            "❤️ Romantic",
            "😢 Emotional",
            "😱 Horror",
            "🔥 Action",
            "🤯 Mind-Blowing"

        ];

        vm.genres = [

            "Action",
            "Comedy",
            "RomCom ❤️😂",
            "Romance",
            "Sci-Fi",
            "Thriller",
            "Adventure",
            "Crime",
            "Drama",
            "Fantasy",
            "Animation",
            "Horror"

        ];

        vm.industries = [

            "Hollywood",
            "Bollywood",
            "Tollywood",
            "Korean",
            "Anime",
            "Any"

        ];

        vm.languages = [

            "English",
            "Hindi",
            "Tamil",
            "Telugu",
            "Malayalam",
            "Korean",
            "Japanese",
            "Any"

        ];

        vm.timelines = [

            {
                name: "🔥 Latest Releases",
                from: "2023-01-01",
                to: ""
            },

            {
                name: "🎬 New Generation",
                from: "2018-01-01",
                to: "2022-12-31"
            },

            {
                name: "📀 Modern Classics",
                from: "2010-01-01",
                to: "2017-12-31"
            },

            {
                name: "📼 2000s Hits",
                from: "2000-01-01",
                to: "2009-12-31"
            },

            {
                name: "🎞 90s Favorites",
                from: "1990-01-01",
                to: "1999-12-31"
            },

            {
                name: "🏛 Timeless Classics",
                from: "",
                to: "1989-12-31"
            },

            {
                name: "🌍 Any Era",
                from: "",
                to: ""
            }

        ];

        vm.ratings = [

            "Any",
            "6+",
            "7+",
            "8+"

        ];

        // ===========================
        // TMDB MAPPINGS
        // ===========================

        vm.genreMap = {

            "Action": 28,
            "Comedy": 35,
            "RomCom ❤️😂": "35,10749",
            "Romance": 10749,
            "Sci-Fi": 878,
            "Thriller": 53,
            "Adventure": 12,
            "Crime": 80,
            "Drama": 18,
            "Fantasy": 14,
            "Animation": 16,
            "Horror": 27

        };

        vm.languageMap = {

            "English": "en",
            "Hindi": "hi",
            "Tamil": "ta",
            "Telugu": "te",
            "Malayalam": "ml",
            "Korean": "ko",
            "Japanese": "ja",
            "Any": ""

        };

        vm.ratingMap = {

            "Any": 0,
            "6+": 6,
            "7+": 7,
            "8+": 8

        };

        // ===========================
        // PROGRESS BAR
        // ===========================

        vm.getProgress = function () {

            return ((vm.step - 1) / 6) * 100;

        };

        // ===========================
        // VALIDATION
        // ===========================

        vm.canProceed = function () {

            switch (vm.step) {

                case 1:
                    return vm.answers.mood !== "";

                case 2:
                    return vm.answers.genre !== "";

                case 3:
                    return vm.answers.industry !== "";

                case 4:
                    return vm.answers.language !== "";

                case 5:
                    return vm.answers.timeline.name;

                case 6:
                    return vm.answers.rating !== "";

                default:
                    return true;

            }

        };
                // ===========================
        // NEXT
        // ===========================

        vm.next = function () {

            if (vm.step < 6 && vm.canProceed()) {

                vm.step++;

            }

        };

        // ===========================
        // BACK
        // ===========================

        vm.back = function () {

            if (vm.step > 1) {

                vm.step--;

            }

        };
vm.addFavorite = function(movie){

    var favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

    var exists = favorites.some(function(item){

        return item.id === movie.id;

    });

    if(!exists){

        favorites.push(movie);

        localStorage.setItem("favorites", JSON.stringify(favorites));

        alert(movie.title + " added to Favorites ❤️");

    }else{

        alert("Already in Favorites");

    }

};
        // ===========================
        // FIND MOVIES
        // ===========================

        vm.findMovies = function () {

            vm.loading = true;

            var filters = {

                genreId: vm.genreMap[vm.answers.genre],

                language: vm.languageMap[vm.answers.language],

                rating: vm.ratingMap[vm.answers.rating],

                releaseFrom: vm.answers.timeline.from,

                releaseTo: vm.answers.timeline.to,

                industry: vm.answers.industry,

                mood: vm.answers.mood

            };

            // Fake AI Loading Animation
            $timeout(function () {

                MovieService.discoverMovies(filters)

                    .then(function (response) {

                        vm.results = response.results || [];

                        vm.loading = false;

                        vm.step = 7;

                    })

                    .catch(function (error) {

                        console.error(error);

                        vm.loading = false;

                        alert("Unable to fetch movie recommendations.");

                    });

            }, 2500);

        };

    });

})();