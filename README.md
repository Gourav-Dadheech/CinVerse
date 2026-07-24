# 🎬 CineVerse

A modern, Netflix + IMDb inspired **Movie Recommendation Website** built entirely with **AngularJS 1.8.x**, vanilla **ES6 JavaScript**, **HTML5**, and **CSS3** — no React, no Vue, no Angular 2+, no TypeScript, no Bootstrap/Tailwind, no jQuery.

Powered by **The Movie Database (TMDB) API**.

---

## ✨ Project Description

CineVerse lets users discover trending, popular, top-rated, upcoming, and **Indian cinema** (Bollywood + regional) movies, search the full TMDB catalog in real time, view rich movie detail pages (cast, trailer, similar titles, recommendations), and build a personal **Favorites** and **Watchlist** — all persisted locally in the browser via `localStorage`.

The UI uses a dark, glassmorphism-inspired design language with smooth hover animations, skeleton loading states, horizontal movie sliders, and a fully responsive layout for desktop, tablet and mobile.

---

## 📁 Folder Structure

```
Movie-Recommendation/
│
├── index.html                 # App shell: navbar, ng-view outlet, footer, script tags
├── app.js                      # Module definition, APP_CONFIG constant, run block, Navbar/Scroll controllers
├── routes.js                   # $routeProvider configuration (ngRoute)
├── package.json                 # Documents npm-sourced AngularJS versions (no npm install needed to run)
│
├── css/
│   ├── style.css               # Global resets, variables, buttons, loaders, animations
│   ├── navbar.css              # Navigation bar styles
│   ├── home.css                # Hero banner, sliders, movie-card component styles
│   ├── movie.css               # Movie details page + favorites/watchlist card styles
│   ├── search.css              # Search page + filters
│   └── responsive.css          # Mobile/tablet media queries
│
├── js/
│   ├── lib/
│   │   ├── angular.min.js          # AngularJS 1.8.3 core (bundled locally, not CDN)
│   │   ├── angular-route.min.js    # ngRoute module (bundled locally)
│   │   └── angular-animate.min.js  # ngAnimate module (bundled locally)
│   │
│   ├── controllers/
│   │   ├── homeController.js       # Home page logic (hero, trending, popular, top rated, upcoming)
│   │   ├── movieController.js      # Movie details page logic (cast, trailer, similar, recommendations)
│   │   ├── searchController.js     # Live search + filters
│   │   ├── favoriteController.js   # Favorites page logic
│   │   └── watchlistController.js  # Watchlist page logic
│   │
│   ├── services/
│   │   ├── movieService.js         # ALL TMDB API calls go through this single service
│   │   └── storageService.js       # localStorage wrapper for Favorites & Watchlist
│   │
│   └── directives/
│       └── movieCard.js            # Reusable <movie-card> component (poster, rating, actions)
│
├── views/
│   ├── home.html
│   ├── movie.html
│   ├── search.html
│   ├── favorites.html
│   ├── watchlist.html
│   ├── notfound.html            # 404 page
│   └── partials/
│       └── movie-card.html      # Template used by the movieCard directive
│
├── assets/
│   ├── images/                  # poster-placeholder.png, backdrop-placeholder.png
│   └── icons/                   # favicon.png
│
└── README.md
```

---

## 📦 How AngularJS Is Loaded (No CDN Needed)

AngularJS core, `ngRoute`, and `ngAnimate` are **bundled locally** inside this project at `js/lib/` — they are NOT loaded from a CDN. `index.html` references them with plain relative paths:

```html
<script src="js/lib/angular.min.js"></script>
<script src="js/lib/angular-route.min.js"></script>
<script src="js/lib/angular-animate.min.js"></script>
```

This means the project runs **fully offline**, with zero dependency on any external CDN being reachable — no risk of it breaking due to a blocked domain, firewall, or ad-blocker.

**About `package.json`:** it documents that `angular@1.8.3`, `angular-route@1.8.3`, and `angular-animate@1.8.3` were sourced from the **npm registry** at these pinned versions — that's literally where the files in `js/lib/` came from. You do **not** need to run `npm install` for the project to work; the compiled files are already sitting in `js/lib/`. `package.json` exists purely as a documented paper trail of where those files came from, in case that's asked about.

(Only Google Fonts and Font Awesome icons still load from a CDN for styling — if those are ever blocked, the app still works fully, just with a plain system font and no icons.)

---

## 🚀 Installation

1. **Download / clone** this project folder to your machine.
2. Open `app.js` and replace the placeholder token:

   ```javascript
   angular.module('cineVerseApp').constant('APP_CONFIG', {
     TMDB_READ_TOKEN: 'YOUR_TMDB_V4_READ_ACCESS_TOKEN_HERE', // <-- paste your real token here
     ...
   });
   ```

3. That's it — no build tools, no `npm install`, no bundler required. This is a pure static AngularJS app.

> **Note:** AngularJS core, ngRoute, and ngAnimate are bundled locally in `js/lib/` (not loaded from a CDN), so the app works even on networks that block external CDNs, behind strict firewalls, or with aggressive ad-blocker extensions. Only Google Fonts and Font Awesome icons still load from a CDN — if those are blocked, the app still fully works, just with a fallback system font and no icons.

> **Why a Bearer token instead of an `api_key` query param?** `movieService.js` sends this token as an `Authorization: Bearer ...` header on every request instead of appending it to the URL. That keeps it out of browser history, server access logs, and any URL you might accidentally share — the recommended approach for TMDB's current (v4) auth.

---

## 🔑 How to Get a TMDB Read Access Token

1. Go to [https://www.themoviedb.org/](https://www.themoviedb.org/) and create a free account.
2. Once logged in, go to your account **Settings** → **API**.
3. Click **"Create"** / **"Request an API Key"** and choose **Developer**, then fill in the short application form (you can describe it as a personal/learning project).
4. Once approved, on the same API settings page copy the **"API Read Access Token"** (a long token starting with `eyJ...`) — this is the **v4 auth** token, separate from the shorter v3 `api_key`.
5. Paste it into `app.js` as `TMDB_READ_TOKEN`, as shown in the Installation section above.

---

## ▶️ How to Run

Because this project makes `XMLHttpRequest`/`fetch` calls to the TMDB API and uses `ng-include`/`templateUrl`, most browsers require it to be served over **http(s)** rather than opened directly as a `file://` path (to avoid CORS/CORB restrictions on local file access).

**Option A — VS Code Live Server (recommended for beginners)**
1. Install the "Live Server" extension in VS Code.
2. Right-click `index.html` → **Open with Live Server**.

**Option B — Python simple server**
```bash
cd Movie-Recommendation
python3 -m http.server 8080
```
Then open `http://localhost:8080` in your browser.

**Option C — Node http-server**
```bash
npm install -g http-server
cd Movie-Recommendation
http-server -p 8080
```

Once running, navigate to:
```
http://localhost:8080/#!/home
```

---

## 🧩 Key AngularJS Concepts Used

| Concept | Where |
|---|---|
| `ngRoute` / `$routeProvider` | `routes.js` — maps every URL to a view + controller |
| Controllers (`controllerAs`) | All files in `js/controllers/` |
| Services / Factories | `MovieService` (TMDB API), `StorageService` (localStorage) |
| Directives | `<movie-card>` reusable component |
| Dependency Injection | Explicit array annotation used everywhere (`['$http', function($http){...}]`) so the code survives minification |
| Promises (`$q`) | `MovieService` wraps every `$http` call in a normalized promise |
| `$routeParams` | Reading `:movieId` on the Movie Details page |
| `$location` | Search query syncing, redirects, quick-search |

---

## 🎨 Design System

- **Background:** `#0F172A`
- **Cards:** `#1E293B`
- **Accent:** `#E50914`
- **Text:** White / muted slate grays
- Glassmorphism cards, rounded corners, gradient overlays, skeleton loaders, hover-lift animations, and scroll-reveal transitions throughout.

---

## 🖼️ Screenshots

> _Add your own screenshots here once you run the project locally._

```
/screenshots/home.png
/screenshots/search.png
/screenshots/movie-details.png
/screenshots/favorites.png
/screenshots/watchlist.png
```

---

## 🔮 Future Improvements

- Add pagination / infinite scroll to the Search results grid
- User authentication + cloud-synced Favorites/Watchlist (instead of localStorage only)
- Add a "Continue Watching" / progress tracker section
- Multi-language support using `angular-translate`
- Add unit tests with Jasmine + Karma
- Dark/Light theme toggle
- Advanced filters (release year range, runtime, language)
- PWA support (offline caching of browsed movies)
- Indian web series / TV shows section (the service method `MovieService.getIndianSeries()` already exists and is ready to wire up — just needs a TV-show variant of the movie card and details page, since TMDB's TV API uses different field names like `name` and `first_air_date`)

---

## ⚠️ Disclaimer

This product uses the TMDB API but is not endorsed or certified by TMDB. Built purely for educational/demo purposes.
