/**
 * CinVerse - gamesService.js
 * AAA Cloud & Web Gaming Station.
 * Features:
 *  - Official AAA Blockbuster Catalog (Grand Theft Auto V, Forza Horizon 5, Cyberpunk 2077, Fortnite, Red Dead 2)
 *  - PC Exclusive Device Detection & Controller Hardware Bridge
 *  - Real 4K 60FPS Cinematic Gameplay Stream Preview
 *  - 1-Click Cloud Launch Deck (Xbox Cloud Gaming, GeForce NOW, Boosteroid)
 *  - Instant WebGL In-Browser Station (Minecraft Classic)
 */
(function () {
  'use strict';

  angular.module('cinVerseApp').service('GamesService', [
    '$rootScope',
    function ($rootScope) {
      var self = this;

      // ---------------- DEVICE DETECTION (PC VS MOBILE) ----------------
      self.isMobileDevice = function () {
        var ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
        var isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
        var isSmallScreen = window.innerWidth <= 768;
        return isMobileUA || isSmallScreen;
      };

      // ---------------- GAMEPAD CONTROLLER API BRIDGE ----------------
      self.gamepadConnected = false;
      self.gamepadName = '';

      function updateGamepadStatus() {
        if (!('getGamepads' in navigator)) return;
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        var found = false;
        for (var i = 0; i < gamepads.length; i++) {
          if (gamepads[i] && gamepads[i].connected) {
            found = true;
            self.gamepadConnected = true;
            self.gamepadName = gamepads[i].id ? gamepads[i].id.slice(0, 28) : 'Controller';
            break;
          }
        }
        if (!found) {
          self.gamepadConnected = false;
          self.gamepadName = '';
        }
        $rootScope.$applyAsync();
      }

      window.addEventListener('gamepadconnected', function (e) {
        self.gamepadConnected = true;
        self.gamepadName = e.gamepad ? (e.gamepad.id || 'Wireless Controller') : 'Controller';
        $rootScope.$applyAsync();
      });

      window.addEventListener('gamepaddisconnected', function () {
        updateGamepadStatus();
      });

      setInterval(updateGamepadStatus, 2500);

      // Determine GTA Web engine URL (Local proxy on localhost, direct sandboxed upstream in production)
      var gtaEngineUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? '/gta-web/' : 'https://fiveplay.lol/';

      // ---------------- ORIGINAL AAA BLOCKBUSTER CATALOG ----------------
      self.gamesCatalog = [
        // 1. GRAND THEFT AUTO V (GTA 5) - ROCKSTAR GAMES
        {
          id: 'gta-5-rockstar',
          title: 'Grand Theft Auto V (WebAssembly WebGPU Edition)',
          originalTitle: 'Grand Theft Auto V',
          publisher: 'Rockstar Games • Ported to WebAssembly / WebGPU',
          subtitle: 'Original GTA V Story & Sandbox Mode Running Directly Inside Web Browser (WASM64 + WebGPU)',
          category: 'aaa',
          badge: 'WASM64 WEBGPU ⚡',
          cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
          banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
          engine: 'WASM64 + WebGPU Direct Engine',
          fps: '60 FPS Direct Native',
          rating: '5.0',
          players: '190M+ Sold',
          isOriginalAaa: true,
          isInBrowserPlayable: true,
          inBrowserEmbedUrl: gtaEngineUrl,
          directPlayUrl: gtaEngineUrl,
          cloudPlatform: 'Ad-Free WebAssembly 64-bit WebGPU Engine',
          cloudPlayUrl: gtaEngineUrl,
          trailerEmbedUrl: gtaEngineUrl,
          desc: 'The viral WebAssembly 64-bit + WebGPU browser build of Grand Theft Auto V. Runs Story Mode and Los Santos Sandbox Mode directly in your PC browser with WebWorkers and WebGPU hardware rendering. No installation or cloud subscription required.',
          cloudSpecs: {
            resolution: '1280x720 to 1080p WebGPU',
            targetFps: '60 FPS',
            saveSync: 'Local IndexedDB / Storage',
            latency: '0ms (Direct Client WebAssembly)'
          },
          controls: [
            { key: 'Enter', desc: 'Select Story Mode (Prologue)' },
            { key: 'Spacebar', desc: 'Select Sandbox Mode (Full Los Santos Map)' },
            { key: '5', desc: 'Confirm GTA V Map in Sandbox Mode' },
            { key: 'W / A / S / D', desc: 'Move Character / Steer Vehicle' },
            { key: 'Mouse Left-Click', desc: 'Shoot Weapon / Punch (Click to capture mouse)' },
            { key: 'Mouse Right-Click', desc: 'Aim Crosshair (Esc releases mouse cursor)' },
            { key: 'F / Enter', desc: 'Enter / Steal Cars, Motorcycles & Aircraft' },
            { key: 'Shift', desc: 'Sprint / Handbrake Drift' },
            { key: '=', desc: 'Toggle Real-Time FPS Counter' }
          ]
        },

        // 2. FORZA HORIZON 5 - XBOX GAME STUDIOS
        {
          id: 'forza-horizon-5',
          title: 'Forza Horizon 5',
          originalTitle: 'Forza Horizon 5',
          publisher: 'Playground Games & Xbox Game Studios',
          subtitle: 'Original AAA Open-World Racing, 800+ Hypercars & Dynamic Mexico Biomes',
          category: 'racing',
          badge: 'FORZA OFFICIAL 🏎️',
          cover: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
          banner: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80',
          engine: 'ForzaTech Engine • Ray-Tracing Audio & Visuals',
          fps: '60 FPS 1080p HDR',
          rating: '4.9',
          players: '37M+ Drivers',
          isOriginalAaa: true,
          cloudPlatform: 'Xbox Cloud Gaming',
          cloudPlayUrl: 'https://www.xbox.com/play/games/forza-horizon-5/9NKX70BBC2TN',
          trailerEmbedUrl: 'https://www.youtube-nocookie.com/embed/FYH9n3Ov118?autoplay=1&mute=1&loop=1&playlist=FYH9n3Ov118&enablejsapi=1',
          desc: 'The official ultimate Horizon adventure across vibrant and ever-evolving landscapes of Mexico. Take wheel control of the world’s greatest hypercars (Mercedes-AMG ONE, Koenigsegg Jesko, Bugatti Chiron, Lamborghini Huracán). Drive through living deserts, lush jungles, historic cities, hidden ruins, pristine beaches, and a towering snow-capped volcano directly in your web browser.',
          cloudSpecs: {
            resolution: '1080p 60FPS HDR',
            targetFps: '60 FPS Locked',
            saveSync: 'Xbox Cloud Saves Sync',
            latency: '< 20ms Edge Gaming'
          },
          controls: [
            { key: 'W / Up Arrow', desc: 'Throttle / Full Acceleration' },
            { key: 'S / Down Arrow', desc: 'Brake / Reverse' },
            { key: 'A / D / Left-Right', desc: 'Steering Wheel Precision' },
            { key: 'Spacebar', desc: 'E-Brake Drift' },
            { key: 'C', desc: 'Cockpit, Hood & Chase Cameras' },
            { key: 'Xbox / PS Gamepad', desc: 'RT=Throttle, LT=Brake, Left Stick=Steer, A=Handbrake' }
          ]
        },

        // 3. FORTNITE: BATTLE ROYALE (100% FREE BROWSER STREAM - NO SUBSCRIPTION NEEDED)
        {
          id: 'fortnite-free-cloud',
          title: 'Fortnite: Battle Royale (Free Cloud Play)',
          originalTitle: 'Fortnite',
          publisher: 'Epic Games & Xbox Cloud',
          subtitle: 'Original AAA 100-Player Battle Royale, Chapter 5 Island & Zero Build — 100% FREE in Browser',
          category: 'fps',
          badge: '100% FREE CLOUD ⚡',
          cover: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&auto=format&fit=crop&q=80',
          banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
          engine: 'Unreal Engine 5.4 • Nanite & Lumen Lighting',
          fps: '60 FPS HD',
          rating: '4.8',
          players: '500M+ Registered',
          isOriginalAaa: true,
          cloudPlatform: 'Xbox Cloud Gaming (Free Tier - No Sub Required!)',
          cloudPlayUrl: 'https://www.xbox.com/play/games/fortnite/BT5P2X999VH2',
          trailerEmbedUrl: 'https://www.youtube-nocookie.com/embed/3w_m_oZ5k7M?autoplay=1&mute=1&loop=1&playlist=3w_m_oZ5k7M&enablejsapi=1',
          desc: 'Play the genuine, official Fortnite Battle Royale directly in your browser for 100% FREE! Microsoft and Epic Games provide free cloud streaming for Fortnite with NO Xbox Game Pass subscription and NO credit card required. Drop onto the island, battle in Zero Build mode, and claim Victory Royale on any PC or laptop.',
          cloudSpecs: {
            resolution: '1080p 60FPS Ultra',
            targetFps: '60 FPS',
            saveSync: 'Epic Games Account Sync',
            latency: '< 18ms Cloud Direct'
          },
          controls: [
            { key: 'W / A / S / D', desc: 'Movement & Sprint' },
            { key: 'Mouse Left-Click', desc: 'Fire Weapon / Swing Pickaxe' },
            { key: 'Mouse Right-Click', desc: 'Aim Down Sights (ADS)' },
            { key: 'Spacebar', desc: 'Jump / Mantle Obstacles' },
            { key: '1 - 5', desc: 'Inventory Weapon Slots' },
            { key: 'Gamepad', desc: 'Full Controller Support with Aim Assist' }
          ]
        },

        // 4. CYBERPUNK 2077: PHANTOM LIBERTY - CD PROJEKT RED
        {
          id: 'cyberpunk-2077',
          title: 'Cyberpunk 2077: Phantom Liberty',
          originalTitle: 'Cyberpunk 2077',
          publisher: 'CD PROJEKT RED',
          subtitle: 'Original AAA Cybernetic Sci-Fi RPG with Full Path-Tracing & Night City Freedom',
          category: 'aaa',
          badge: 'RAY TRACING 4K ⚡',
          cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
          banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
          engine: 'REDengine 4 • Overdrive Path Tracing',
          fps: '60 - 120 FPS Cloud',
          rating: '4.9',
          players: '25M+ Sold',
          isOriginalAaa: true,
          cloudPlatform: 'GeForce NOW & Boosteroid',
          cloudPlayUrl: 'https://play.geforcenow.com/',
          trailerEmbedUrl: 'https://www.youtube-nocookie.com/embed/kfph7fC_Ypk?autoplay=1&mute=1&loop=1&playlist=kfph7fC_Ypk&enablejsapi=1',
          desc: 'The official AAA futuristic open-world action-adventure RPG set in Night City. Play as V, a mercenary outlaw enhanced with cybernetic implants. Stream with NVIDIA GeForce NOW RTX 4080 servers delivering cinema-level ray tracing directly through your browser.',
          cloudSpecs: {
            resolution: 'Up to 4K 120FPS',
            targetFps: '60 - 120 FPS',
            saveSync: 'Steam, GOG & Epic Cloud',
            latency: '< 15ms Reflex'
          },
          controls: [
            { key: 'W / A / S / D', desc: 'Move & Dash' },
            { key: 'Mouse', desc: 'Aim & Fire Smart Weapons' },
            { key: 'F', desc: 'Interact / Talk / Cyberware' },
            { key: 'Tab', desc: 'Quickhack Scanner Mode' },
            { key: 'Gamepad', desc: 'DualSense & Xbox Haptic Support' }
          ]
        },

        // 5. RED DEAD REDEMPTION 2 - ROCKSTAR GAMES
        {
          id: 'red-dead-redemption-2',
          title: 'Red Dead Redemption 2',
          originalTitle: 'Red Dead Redemption 2',
          publisher: 'Rockstar Games',
          subtitle: 'Original AAA Wild West Masterpiece, Arthur Morgan Story & Van der Linde Gang',
          category: 'aaa',
          badge: 'MASTERPIECE 🤠',
          cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
          banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
          engine: 'Rockstar Advanced Game Engine (RAGE)',
          fps: '60 FPS Ultra HD',
          rating: '5.0',
          players: '65M+ Sold',
          isOriginalAaa: true,
          cloudPlatform: 'Boosteroid & GeForce NOW',
          cloudPlayUrl: 'https://boosteroid.com/',
          trailerEmbedUrl: 'https://www.youtube-nocookie.com/embed/eaW0tYpxyp0?autoplay=1&mute=1&loop=1&playlist=eaW0tYpxyp0&enablejsapi=1',
          desc: 'Winner of over 175 Game of the Year Awards. The epic tale of outlaw Arthur Morgan and the Van der Linde gang as they journey across the vast and rugged heartland of America at the dawn of the modern age. Stream directly in your browser.',
          cloudSpecs: {
            resolution: '1080p - 4K 60FPS',
            targetFps: '60 FPS',
            saveSync: 'Rockstar Social Club & Steam',
            latency: '< 25ms'
          },
          controls: [
            { key: 'W / A / S / D', desc: 'Walk, Run & Gallop Horse' },
            { key: 'Mouse Left-Click', desc: 'Shoot Revolver / Dead Eye' },
            { key: 'Mouse Right-Click', desc: 'Aim / Lock On Target' },
            { key: 'Tab', desc: 'Weapon Wheel Selection' },
            { key: 'Gamepad', desc: 'Full Controller Support' }
          ]
        },

        // 6. CALL OF DUTY: WARZONE - ACTIVISION
        {
          id: 'call-of-duty-warzone',
          title: 'Call of Duty: Warzone',
          originalTitle: 'Call of Duty: Warzone',
          publisher: 'Activision',
          subtitle: 'Original Massive Free-to-Play Battle Royale & Modern Warfare Gunplay',
          category: 'fps',
          badge: 'WARZONE FPS 🎯',
          cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
          banner: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=1200&auto=format&fit=crop&q=80',
          engine: 'IW 9.0 Tactical Engine',
          fps: '60 - 120 FPS 1080p',
          rating: '4.8',
          players: '100M+ Soldiers',
          isOriginalAaa: true,
          cloudPlatform: 'GeForce NOW & Xbox Cloud',
          cloudPlayUrl: 'https://www.xbox.com/play/games/call-of-duty/9WZDNCRFJ364',
          trailerEmbedUrl: 'https://www.youtube-nocookie.com/embed/0E44DdUwCY4?autoplay=1&mute=1&loop=1&playlist=0E44DdUwCY4&enablejsapi=1',
          desc: 'The official blockbuster tactical first-person combat experience. Drop into Urzikstan, loot high-tier weapon loadouts, contract bounty targets, fight for survival in the Gulag, and exfiltrate.',
          cloudSpecs: {
            resolution: '1080p 60-120 FPS',
            targetFps: '60 - 120 FPS',
            saveSync: 'Activision & Battle.net Account',
            latency: '< 15ms Esports Low Latency'
          },
          controls: [
            { key: 'W / A / S / D', desc: 'Tactical Sprint & Movement' },
            { key: 'Mouse Left-Click', desc: 'Fire Weapon' },
            { key: 'Mouse Right-Click', desc: 'Iron Sights & Sniper Scope' },
            { key: 'R', desc: 'Reload Weapon' },
            { key: 'C / Ctrl', desc: 'Slide & Crouch' },
            { key: 'Gamepad', desc: 'Full Xbox / PlayStation Controller Support' }
          ]
        },

        // 7. MINECRAFT CLASSIC: 3D VOXEL WEBGL (OFFICIAL MOJANG BROWSER EDITION)
        {
          id: 'minecraft-classic-web',
          title: 'Minecraft Classic: Official 3D Web Edition',
          originalTitle: 'Minecraft',
          publisher: 'Mojang Studios',
          subtitle: 'Official In-Browser 3D Sandbox Building & Infinite Voxel Creation',
          category: 'retro',
          badge: 'PLAYABLE WEB ⛏️',
          cover: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=800&auto=format&fit=crop&q=80',
          banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
          engine: 'Official Mojang WebGL Engine',
          fps: '60 FPS Native WebGL',
          rating: '5.0',
          players: '300M+ Builders',
          isOriginalAaa: false,
          isInBrowserPlayable: true,
          inBrowserEmbedUrl: 'https://classic.minecraft.net/',
          cloudPlatform: 'Official In-Browser Native WebGL',
          cloudPlayUrl: 'https://classic.minecraft.net/',
          trailerEmbedUrl: 'https://classic.minecraft.net/',
          desc: 'Play the genuine official Minecraft engine directly inside your web browser. Build, mine, generate worlds, and invite friends via direct link with zero install.',
          cloudSpecs: {
            resolution: 'Full Display Native Resolution',
            targetFps: '60 FPS Direct WebGL',
            saveSync: 'Instant In-Browser World Generation',
            latency: '0ms (Direct Native)'
          },
          controls: [
            { key: 'W / A / S / D', desc: 'Walk & Strafe' },
            { key: 'Spacebar', desc: 'Jump Over Blocks' },
            { key: 'Mouse Left-Click', desc: 'Mine / Break Blocks' },
            { key: 'Mouse Right-Click', desc: 'Place Selected Block' },
            { key: '1 - 9', desc: 'Select Block From Hotbar' },
            { key: 'B', desc: 'Open Blocks Menu' }
          ]
        }
      ];

      // Active selected game for the cinema theater viewport
      self.activeGame = self.gamesCatalog[0];

      self.selectGame = function (game) {
        if (!game) return;
        self.activeGame = game;
      };

      self.getGamesByCategory = function (category) {
        if (!category || category === 'all') return self.gamesCatalog;
        return self.gamesCatalog.filter(function (g) {
          return g.category === category;
        });
      };
    }
  ]);
})();
