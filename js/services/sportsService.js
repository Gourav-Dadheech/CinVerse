/**
 * Cinverse - sportsService.js
 * CREX, Cricbuzz & ESPNcricinfo Style Cricket Hub & Global Sports Data Engine.
 * Features:
 * - Real-Time Match Center: Live scores, CRR/RRR, Win Predictor meter, Over tracker
 * - Multi-Tab Match Details: Live Overview, Full Innings Scorecards, Ball-by-Ball Commentary, Squads & Playing XI, Points Table
 * - Status Filters: ALL, LIVE (🔴), UPCOMING (🟢), COMPLETED (⚪)
 * - Format Filters: All, International, T20 Leagues (IPL), Domestic (Ranji)
 * - Tournament Standings: ICC World Test Championship (WTC) & IPL
 * - Live Simulated Score & Commentary Ticker
 * - Live Cricket News & Editorial Station
 */
(function () {
  'use strict';

  angular.module('cinVerseApp').service('SportsService', [
    '$http',
    '$interval',
    '$rootScope',
    function ($http, $interval, $rootScope) {
      var self = this;

      function formatDate(d) {
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      }

      function formatShort(d) {
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      }

      function addDays(d, n) {
        var res = new Date(d.getTime());
        res.setDate(res.getDate() + n);
        return res;
      }

      var now = new Date();
      self.todayFormatted = formatDate(now);

      // ---------------- CREX CRICKET MATCHES MASTER DATABASE ----------------
      var masterMatchesPool = [
        // 1. LIVE MATCH: South Africa vs Australia (1st Test, Centurion) • WTC 2025-27
        {
          id: 'crex-sa-aus-wtc',
          sport: 'cricket',
          format: 'TEST',
          category: 'international',
          status: 'LIVE',
          statusTag: '🔴 LIVE • DAY 2 TEA SESSION',
          badge: 'ICC WORLD TEST CHAMPIONSHIP 🏆',
          tournament: 'Australia tour of South Africa • 1st Test • ICC World Test Championship',
          venue: 'SuperSport Park, Centurion',
          dateLabel: 'Day 2 Tea • Live Report',
          streamTitle: 'South Africa vs Australia • 1st Test Centurion Live WTC Broadcast',
          servers: [
            { id: 1, name: 'Server 1 • Willow Cricket HD (Live Stadium Feed)', quality: '1080p 60FPS', url: 'https://d36r8jifhgsk5j.cloudfront.net/Willow_TV.m3u8', type: 'hls' },
            { id: 2, name: 'Server 2 • SuperSport Cricket HD (Official Broadcast)', quality: '1080p HD', url: 'https://www.youtube.com/embed/ebkwnpV6aOc?autoplay=1&mute=0', type: 'iframe' },
            { id: 3, name: 'Server 3 • Cricket Gold HD (Stadium Live Stream)', quality: '1080p HD', url: 'https://streams2.sofast.tv/ptnr-yupptv/title-cricketgold/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/b2048bb8-1686-4432-aa50-647245383e0c/manifest.m3u8', type: 'hls' }
          ],
          toss: 'South Africa won the toss and elected to bat first',
          pitchReport: 'Traditional Centurion surface with lively pace, steep bounce, and green grass cover. Seam movement pronounced in morning sessions; batting gets easier after lunch.',
          weather: '25°C • Mild Highveld sunshine • Humidity 48% • 10% Rain chance',
          teamA: {
            name: 'South Africa',
            code: 'SA',
            flag: '🇿🇦',
            score: '284 & 152/3',
            overs: '44.2 ov',
            runs: 152,
            wickets: 3,
            crr: '3.42'
          },
          teamB: {
            name: 'Australia',
            code: 'AUS',
            flag: '🇦🇺',
            score: '358',
            overs: '92.4 ov',
            runs: 358,
            wickets: 10,
            crr: '3.86'
          },
          equation: 'South Africa lead by 78 runs • Temba Bavuma 64*, Tristan Stubbs 48*',
          situation: 'Bavuma and Stubbs anchor resilient 86-run partnership after Cummins struck twice before lunch; Proteas looking to build 200+ target',
          winPredictor: {
            teamACode: 'SA',
            teamAPct: 48,
            teamBCode: 'AUS',
            teamBPct: 52,
            trend: 'Match in the balance; Australian quicks probing with reverse swing before tea'
          },
          currentOver: {
            overNum: 44,
            balls: ['0', '1', '4', '0', '0', '1']
          },
          striker: {
            name: 'Temba Bavuma (c)',
            runs: 64,
            balls: 118,
            fours: 7,
            sixes: 1,
            sr: '54.23'
          },
          nonStriker: {
            name: 'Tristan Stubbs',
            runs: 48,
            balls: 82,
            fours: 5,
            sixes: 0,
            sr: '58.53'
          },
          currentBowler: {
            name: 'Pat Cummins',
            overs: '14.2',
            maidens: 3,
            runs: 48,
            wickets: 2,
            econ: '3.34'
          },
          partnership: '86 runs (142 balls) • RR: 3.63',
          lastWicket: 'Aiden Markram c Smith b Starc 34 (62b, 4x4)',
          recentOversSummary: 'Last 5 ovs: 21 runs, 0 wkts (RR: 4.20)',
          headToHead: {
            played: 101,
            teamAWon: 26,
            teamBWon: 54,
            drawn: 21
          },
          innings: [
            {
              id: 'sa-inn-1',
              title: 'South Africa 1st Innings',
              score: '284/10',
              overs: '84.4',
              crr: '3.35',
              batting: [
                { name: 'Tony de Zorzi', dismissal: 'c Carey b Hazlewood', runs: 42, balls: 88, fours: 6, sixes: 0, sr: '47.72' },
                { name: 'Aiden Markram', dismissal: 'b Cummins', runs: 58, balls: 94, fours: 8, sixes: 1, sr: '61.70' },
                { name: 'Tristan Stubbs', dismissal: 'c Smith b Lyon', runs: 36, balls: 64, fours: 4, sixes: 0, sr: '56.25' },
                { name: 'Temba Bavuma (c)', dismissal: 'lbw b Starc', runs: 70, balls: 130, fours: 9, sixes: 0, sr: '53.84' },
                { name: 'David Bedingham', dismissal: 'c Head b Cummins', runs: 28, balls: 45, fours: 3, sixes: 1, sr: '62.22' },
                { name: 'Kyle Verreynne (wk)', dismissal: 'b Starc', runs: 18, balls: 32, fours: 2, sixes: 0, sr: '56.25' },
                { name: 'Marco Jansen', dismissal: 'c Carey b Hazlewood', runs: 22, balls: 38, fours: 3, sixes: 0, sr: '57.89' },
                { name: 'Keshav Maharaj', dismissal: 'b Lyon', runs: 4, balls: 10, fours: 0, sixes: 0, sr: '40.00' },
                { name: 'Kagiso Rabada', dismissal: 'not out', runs: 6, balls: 8, fours: 1, sixes: 0, sr: '75.00' }
              ],
              extras: '12 (b 4, lb 6, w 1, nb 1)',
              total: '284 (10 wkts, 84.4 Ov)',
              bowling: [
                { name: 'Mitchell Starc', overs: '19.4', maidens: 3, runs: 68, wickets: 3, econ: '3.45' },
                { name: 'Pat Cummins (c)', overs: '22.0', maidens: 4, runs: 74, wickets: 3, econ: '3.36' },
                { name: 'Josh Hazlewood', overs: '20.0', maidens: 5, runs: 62, wickets: 2, econ: '3.10' },
                { name: 'Nathan Lyon', overs: '23.0', maidens: 2, runs: 72, wickets: 2, econ: '3.13' }
              ],
              fallOfWickets: ['1-78 (de Zorzi)', '2-124 (Markram)', '3-162 (Stubbs)', '4-218 (Bavuma)', '5-242 (Bedingham)']
            },
            {
              id: 'aus-inn-1',
              title: 'Australia 1st Innings',
              score: '358/10',
              overs: '92.4',
              crr: '3.86',
              batting: [
                { name: 'Usman Khawaja', dismissal: 'c Verreynne b Rabada', runs: 62, balls: 122, fours: 7, sixes: 0, sr: '50.81' },
                { name: 'Steve Smith', dismissal: 'lbw b Maharaj', runs: 84, balls: 148, fours: 10, sixes: 1, sr: '56.75' },
                { name: 'Marnus Labuschagne', dismissal: 'c Stubbs b Jansen', runs: 46, balls: 92, fours: 5, sixes: 0, sr: '50.00' },
                { name: 'Travis Head', dismissal: 'c Markram b Rabada', runs: 72, balls: 84, fours: 9, sixes: 2, sr: '85.71' },
                { name: 'Mitchell Marsh', dismissal: 'c Bedingham b Jansen', runs: 38, balls: 46, fours: 4, sixes: 2, sr: '82.60' },
                { name: 'Alex Carey (wk)', dismissal: 'b Rabada', runs: 24, balls: 36, fours: 3, sixes: 0, sr: '66.66' },
                { name: 'Pat Cummins', dismissal: 'not out', runs: 16, balls: 22, fours: 2, sixes: 0, sr: '72.72' }
              ],
              extras: '16 (b 6, lb 8, w 2)',
              total: '358 (10 wkts, 92.4 Ov)',
              bowling: [
                { name: 'Kagiso Rabada', overs: '24.4', maidens: 4, runs: 88, wickets: 4, econ: '3.56' },
                { name: 'Marco Jansen', overs: '22.0', maidens: 3, runs: 76, wickets: 3, econ: '3.45' },
                { name: 'Keshav Maharaj', overs: '26.0', maidens: 4, runs: 92, wickets: 2, econ: '3.53' },
                { name: 'Lungi Ngidi', overs: '20.0', maidens: 2, runs: 88, wickets: 1, econ: '4.40' }
              ],
              fallOfWickets: ['1-84 (Khawaja)', '2-168 (Labuschagne)', '3-264 (Smith)', '4-298 (Head)', '5-332 (Marsh)']
            }
          ],
          commentary: [
            { over: '44.2', ball: '44.2', bowler: 'Nathan Lyon', batsman: 'Temba Bavuma', runs: 1, isBoundary: false, text: 'Tossed up outside off, Bavuma gets across and taps into the offside ring for a sensible single. Brings up the 50-run lead.' },
            { over: '44.1', ball: '44.1', bowler: 'Nathan Lyon', batsman: 'Temba Bavuma', runs: 0, isBoundary: false, text: 'Defended softly off the front foot into the pitch. Lyon searching for turn.' },
            { over: '43.6', ball: '43.6', bowler: 'Pat Cummins', batsman: 'Tristan Stubbs', runs: 4, isBoundary: true, isFour: true, text: 'FOUR! Cracking square cut! Cummins bangs it in short, Stubbs rocks back with lightning hands and flays it behind point!' },
            { over: '43.5', ball: '43.5', bowler: 'Pat Cummins', batsman: 'Tristan Stubbs', runs: 0, isBoundary: false, text: 'Beaten outside off! Extra bounce tests Stubbs on the backfoot, ball flies past the outside edge.' },
            { over: '43.4', ball: '43.4', bowler: 'Pat Cummins', batsman: 'Tristan Stubbs', runs: 1, isBoundary: false, text: 'Short of length on off stump, nudged off the hip to deep backward square for one.' }
          ],
          squads: {
            teamA: {
              name: 'South Africa Playing XI',
              playingXI: [
                { name: 'Temba Bavuma', role: 'Captain & Middle-Order', tag: '(c)' },
                { name: 'Aiden Markram', role: 'Opener & Off-Spinner' },
                { name: 'Tristan Stubbs', role: 'Top-Order Batter' },
                { name: 'David Bedingham', role: 'Middle-Order' },
                { name: 'Kyle Verreynne', role: 'Wicketkeeper', tag: '(wk)' },
                { name: 'Marco Jansen', role: 'All-Rounder & Left-Arm Fast' },
                { name: 'Kagiso Rabada', role: 'Strike Fast Bowler' },
                { name: 'Keshav Maharaj', role: 'Left-Arm Spinner' }
              ],
              bench: ['Ryan Rickelton', 'Nandre Burger', 'Gerald Coetzee']
            },
            teamB: {
              name: 'Australia Playing XI',
              playingXI: [
                { name: 'Pat Cummins', role: 'Captain & Fast Bowler', tag: '(c)' },
                { name: 'Usman Khawaja', role: 'Opening Batter' },
                { name: 'Marnus Labuschagne', role: 'Top-Order' },
                { name: 'Steve Smith', role: 'Middle-Order Batter' },
                { name: 'Travis Head', role: 'Aggressive Batter' },
                { name: 'Mitchell Marsh', role: 'All-Rounder' },
                { name: 'Alex Carey', role: 'Wicketkeeper', tag: '(wk)' },
                { name: 'Mitchell Starc', role: 'Left-Arm Fast' },
                { name: 'Nathan Lyon', role: 'Off-Spinner' }
              ],
              bench: ['Josh Inglis', 'Scott Boland', 'Todd Murphy']
            }
          }
        },

        // 2. LIVE MATCH: India tour of Australia (2nd T20I, Melbourne) • Super Series 2026
        {
          id: 'crex-ind-aus-t20',
          sport: 'cricket',
          format: 'T20',
          category: 'international',
          status: 'LIVE',
          statusTag: '🔴 LIVE • 2ND INNINGS THRILLER',
          badge: 'T20 SUPER SERIES 2026 ⚡',
          tournament: 'India tour of Australia • 2nd T20I • Melbourne Cricket Ground',
          venue: 'Melbourne Cricket Ground (MCG), Melbourne',
          dateLabel: 'Live Chase • 17.2 Overs',
          streamTitle: 'India vs Australia • 2nd T20I MCG Thriller Live Broadcast',
          servers: [
            { id: 1, name: 'Server 1 • Willow Cricket HD (Live T20 Feed)', quality: '1080p 60FPS', url: 'https://d36r8jifhgsk5j.cloudfront.net/Willow_TV.m3u8', type: 'hls' },
            { id: 2, name: 'Server 2 • Cricket Australia / Fox Sports Official Feed', quality: '1080p HD', url: 'https://www.youtube.com/embed/PorfJhrc6JY?autoplay=1&mute=0', type: 'iframe' },
            { id: 3, name: 'Server 3 • Cricket Gold HD (Stadium Live Stream)', quality: '1080p HD', url: 'https://streams2.sofast.tv/ptnr-yupptv/title-cricketgold/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/b2048bb8-1686-4432-aa50-647245383e0c/manifest.m3u8', type: 'hls' }
          ],
          toss: 'Australia won the toss and elected to field',
          pitchReport: 'True drop-in wicket with exceptional carry and pace. Vast MCG boundaries reward sharp running between the wickets.',
          weather: '22°C • Clear Melbourne evening • 12 km/h southerly breeze',
          teamA: {
            name: 'India',
            code: 'IND',
            flag: '🇮🇳',
            score: '192/5',
            overs: '20.0 ov',
            runs: 192,
            wickets: 5,
            crr: '9.60'
          },
          teamB: {
            name: 'Australia',
            code: 'AUS',
            flag: '🇦🇺',
            score: '168/4',
            overs: '17.2 ov',
            runs: 168,
            wickets: 4,
            crr: '9.69',
            target: 193
          },
          equation: 'Australia need 25 runs in 16 balls • Glenn Maxwell 42* (19), Tim David 24* (11)',
          situation: 'High-voltage finish under MCG lights; Bumrah has 1 over remaining, Arshdeep to bowl the 19th',
          winPredictor: {
            teamACode: 'IND',
            teamAPct: 56,
            teamBCode: 'AUS',
            teamBPct: 44,
            trend: 'Edge to India with Bumrah holding final over; Maxwell in explosive hitting rhythm'
          },
          currentOver: {
            overNum: 17,
            balls: ['1', '6', '0', '4', '2', '1']
          },
          striker: {
            name: 'Glenn Maxwell',
            runs: 42,
            balls: 19,
            fours: 3,
            sixes: 3,
            sr: '221.05'
          },
          nonStriker: {
            name: 'Tim David',
            runs: 24,
            balls: 11,
            fours: 2,
            sixes: 2,
            sr: '218.18'
          },
          currentBowler: {
            name: 'Jasprit Bumrah',
            overs: '3.2',
            maidens: 0,
            runs: 26,
            wickets: 2,
            econ: '7.80'
          },
          partnership: '52 runs (22 balls) • RR: 14.18',
          lastWicket: 'Travis Head c Rinku b Bumrah 68 (38b, 7x4, 4x6)',
          recentOversSummary: 'Last 3 ovs: 41 runs, 1 wkt (RR: 13.66)',
          headToHead: {
            played: 34,
            teamAWon: 21,
            teamBWon: 12,
            drawn: 1
          },
          innings: [
            {
              id: 'ind-inn-t20',
              title: 'India Innings',
              score: '192/5',
              overs: '20.0',
              crr: '9.60',
              batting: [
                { name: 'Abhishek Sharma', dismissal: 'c Inglis b Starc', runs: 32, balls: 18, fours: 4, sixes: 2, sr: '177.77' },
                { name: 'Yashasvi Jaiswal', dismissal: 'c David b Zampa', runs: 28, balls: 19, fours: 4, sixes: 1, sr: '147.36' },
                { name: 'Suryakumar Yadav (c)', dismissal: 'c Head b Ellis', runs: 76, balls: 41, fours: 6, sixes: 5, sr: '185.36' },
                { name: 'Hardik Pandya', dismissal: 'not out', runs: 42, balls: 22, fours: 3, sixes: 3, sr: '190.90' },
                { name: 'Rinku Singh', dismissal: 'not out', runs: 12, balls: 6, fours: 2, sixes: 0, sr: '200.00' }
              ],
              extras: '8 (w 5, nb 1, lb 2)',
              total: '192/5 (20.0 Ov)',
              bowling: [
                { name: 'Mitchell Starc', overs: '4.0', maidens: 0, runs: 38, wickets: 2, econ: '9.50' },
                { name: 'Nathan Ellis', overs: '4.0', maidens: 0, runs: 36, wickets: 1, econ: '9.00' },
                { name: 'Adam Zampa', overs: '4.0', maidens: 0, runs: 32, wickets: 1, econ: '8.00' },
                { name: 'Marcus Stoinis', overs: '4.0', maidens: 0, runs: 44, wickets: 1, econ: '11.00' }
              ],
              fallOfWickets: ['1-44 (Abhishek, 4.1 ov)', '2-82 (Jaiswal, 8.4 ov)', '3-164 (Surya, 17.2 ov)']
            }
          ],
          commentary: [
            { over: '17.2', ball: '17.2', bowler: 'Jasprit Bumrah', batsman: 'Glenn Maxwell', runs: 1, isBoundary: false, text: 'Pinpoint yorker at 145 clicks! Maxwell digs it out toward wide mid-on for a brisk single.' },
            { over: '17.1', ball: '17.1', bowler: 'Jasprit Bumrah', batsman: 'Tim David', runs: 1, isBoundary: false, text: 'Slower off-cutter on leg stump, nudged off the hips into deep square leg.' },
            { over: '16.6', ball: '16.6', bowler: 'Arshdeep Singh', batsman: 'Glenn Maxwell', runs: 6, isBoundary: true, isSix: true, text: 'SIX! Reverse scoop over third man! Pure audacious Maxwell genius, clears the rope by ten rows!' }
          ],
          squads: {
            teamA: {
              name: 'India Playing XI',
              playingXI: [
                { name: 'Suryakumar Yadav', role: 'Captain & Middle-Order', tag: '(c)' },
                { name: 'Abhishek Sharma', role: 'Opening Batter' },
                { name: 'Yashasvi Jaiswal', role: 'Opener' },
                { name: 'Hardik Pandya', role: 'All-Rounder' },
                { name: 'Sanju Samson', role: 'Wicketkeeper', tag: '(wk)' },
                { name: 'Rinku Singh', role: 'Finisher' },
                { name: 'Axar Patel', role: 'Spin All-Rounder' },
                { name: 'Jasprit Bumrah', role: 'Fast Bowler' },
                { name: 'Arshdeep Singh', role: 'Left-Arm Pacer' }
              ],
              bench: ['Tilak Varma', 'Ravi Bishnoi', 'Harshit Rana']
            },
            teamB: {
              name: 'Australia Playing XI',
              playingXI: [
                { name: 'Mitchell Marsh', role: 'Captain & All-Rounder', tag: '(c)' },
                { name: 'Travis Head', role: 'Opening Batter' },
                { name: 'Josh Inglis', role: 'Wicketkeeper', tag: '(wk)' },
                { name: 'Glenn Maxwell', role: 'All-Rounder' },
                { name: 'Marcus Stoinis', role: 'Power-Hitter' },
                { name: 'Tim David', role: 'Finisher' },
                { name: 'Mitchell Starc', role: 'Fast Bowler' },
                { name: 'Adam Zampa', role: 'Leg-Spinner' }
              ],
              bench: ['Nathan Ellis', 'Matthew Short', 'Sean Abbott']
            }
          }
        },

        // 3. UPCOMING MATCH: Sri Lanka tour of Pakistan (2nd Test, Rawalpindi) • WTC 2025-27
        {
          id: 'crex-pak-sl-wtc',
          sport: 'cricket',
          format: 'TEST',
          category: 'international',
          status: 'UPCOMING',
          statusTag: '🟢 TOMORROW • 10:00 AM PKT',
          badge: 'ICC WTC RAWALPINDI CLASH 🇵🇰',
          tournament: 'Sri Lanka tour of Pakistan • 2nd Test • ICC World Test Championship',
          venue: 'Rawalpindi Cricket Stadium, Rawalpindi',
          dateLabel: 'Tomorrow, 10:00 AM PKT',
          streamTitle: 'Pakistan vs Sri Lanka • 2nd Test Rawalpindi Live WTC Broadcast',
          servers: [
            { id: 1, name: 'Server 1 • Cricket Gold 1080p (Live Stadium Broadcast)', quality: '1080p 60FPS', url: 'https://streams2.sofast.tv/ptnr-yupptv/title-cricketgold/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/b2048bb8-1686-4432-aa50-647245383e0c/manifest.m3u8', type: 'hls' },
            { id: 2, name: 'Server 2 • PCB Official Test Match Feed', quality: '1080p HD', url: 'https://www.youtube.com/embed/SGB5st_pCSw?autoplay=1&mute=0', type: 'iframe' },
            { id: 3, name: 'Server 3 • Willow Cricket HD (Live Feed)', quality: '1080p HD', url: 'https://d36r8jifhgsk5j.cloudfront.net/Willow_TV.m3u8', type: 'hls' }
          ],
          toss: 'Toss scheduled tomorrow at 9:30 AM PKT',
          pitchReport: 'Fresh Rawalpindi pitch with live grass cover to encourage early seam movement before flattening out into a high-scoring surface.',
          weather: '27°C • Clear autumn skies in northern Pakistan • Low humidity',
          teamA: {
            name: 'Pakistan',
            code: 'PAK',
            flag: '🇵🇰',
            score: 'Yet to bat',
            overs: 'Starting Tomorrow'
          },
          teamB: {
            name: 'Sri Lanka',
            code: 'SL',
            flag: '🇱🇰',
            score: 'Yet to bat',
            overs: '10:00 AM PKT'
          },
          equation: 'Series decider begins tomorrow at 10:00 AM PKT • Shan Masood vs Dhananjaya de Silva',
          situation: 'Pakistan seeking home series victory following high-intensity training camp in Rawalpindi',
          winPredictor: {
            teamACode: 'PAK',
            teamAPct: 54,
            teamBCode: 'SL',
            teamBPct: 46,
            trend: 'Pakistan slight favorites on home turf with Naseem Shah and Shaheen Afridi back'
          },
          squads: {
            teamA: {
              name: 'Pakistan Squad',
              playingXI: [
                { name: 'Shan Masood', role: 'Captain', tag: '(c)' },
                { name: 'Abdullah Shafique', role: 'Opener' },
                { name: 'Babar Azam', role: 'Top-Order' },
                { name: 'Mohammad Rizwan', role: 'Wicketkeeper', tag: '(wk)' },
                { name: 'Salman Ali Agha', role: 'All-Rounder' },
                { name: 'Shaheen Afridi', role: 'Fast Bowler' },
                { name: 'Naseem Shah', role: 'Fast Bowler' }
              ],
              bench: ['Saim Ayub', 'Aamer Jamal', 'Mir Hamza']
            },
            teamB: {
              name: 'Sri Lanka Squad',
              playingXI: [
                { name: 'Dhananjaya de Silva', role: 'Captain', tag: '(c)' },
                { name: 'Dimuth Karunaratne', role: 'Opener' },
                { name: 'Pathum Nissanka', role: 'Top-Order' },
                { name: 'Kusal Mendis', role: 'Wicketkeeper', tag: '(wk)' },
                { name: 'Angelo Mathews', role: 'Veteran Middle-Order' },
                { name: 'Prabath Jayasuriya', role: 'Spin Bowler' }
              ],
              bench: ['Kamindu Mendis', 'Asitha Fernando', 'Vishwa Fernando']
            }
          }
        },

        // 4. UPCOMING MATCH: TATA IPL 2026 (El Clásico: MI vs CSK)
        {
          id: 'crex-csk-mi-ipl',
          sport: 'cricket',
          format: 'T20',
          category: 'league',
          status: 'UPCOMING',
          statusTag: '🟢 TOMORROW • 7:30 PM IST',
          badge: 'TATA IPL 2026 EL CLÁSICO 🔥',
          tournament: 'TATA IPL 2026 • Match 24 • Wankhede Stadium',
          venue: 'Wankhede Stadium, Mumbai',
          dateLabel: 'Tomorrow, 7:30 PM IST • Toss at 7:00 PM',
          streamTitle: 'Chennai Super Kings vs Mumbai Indians • IPL Clásico Live Broadcast',
          servers: [
            { id: 1, name: 'Server 1 • Willow Cricket HD (Live IPL Stream)', quality: '1080p 60FPS', url: 'https://d36r8jifhgsk5j.cloudfront.net/Willow_TV.m3u8', type: 'hls' },
            { id: 2, name: 'Server 2 • Official IPL Match Action Feed', quality: '1080p HD', url: 'https://www.youtube.com/embed/p2jmVH7Dj4c?autoplay=1&mute=0', type: 'iframe' },
            { id: 3, name: 'Server 3 • Cricket Gold 1080p (Live Stadium Broadcast)', quality: '1080p HD', url: 'https://streams2.sofast.tv/ptnr-yupptv/title-cricketgold/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/b2048bb8-1686-4432-aa50-647245383e0c/manifest.m3u8', type: 'hls' }
          ],
          toss: 'Toss scheduled tomorrow at 7:00 PM IST',
          pitchReport: 'True Wankhede batting surface with grass cover to assist new-ball seamers before evening dew makes chasing advantageous.',
          weather: '28°C • Clear Mumbai skies • Prime T20 evening conditions',
          teamA: {
            name: 'Mumbai Indians',
            code: 'MI',
            flag: '💙',
            score: 'Yet to bat',
            overs: 'Tomorrow 7:30 PM'
          },
          teamB: {
            name: 'Chennai Super Kings',
            code: 'CSK',
            flag: '💛',
            score: 'Yet to bat',
            overs: 'Starting XI'
          },
          equation: 'El Clásico rivalry renewed at Wankhede • Ruturaj Gaikwad vs Hardik Pandya • MS Dhoni in action',
          winPredictor: {
            teamACode: 'MI',
            teamAPct: 51,
            teamBCode: 'CSK',
            teamBPct: 49,
            trend: 'Neck and neck odds; MI home ground advantage balanced by CSK spin depth'
          },
          squads: {
            teamA: {
              name: 'Mumbai Indians Starting XI',
              playingXI: [
                { name: 'Hardik Pandya', role: 'Captain & All-Rounder', tag: '(c)' },
                { name: 'Rohit Sharma', role: 'Opening Batter' },
                { name: 'Suryakumar Yadav', role: 'Middle-Order Ace' },
                { name: 'Tilak Varma', role: 'Top-Order' },
                { name: 'Jasprit Bumrah', role: 'Strike Pacer' }
              ],
              bench: ['Tim David', 'Gerald Coetzee', 'Nuwan Thushara']
            },
            teamB: {
              name: 'Chennai Super Kings Starting XI',
              playingXI: [
                { name: 'Ruturaj Gaikwad', role: 'Captain & Opener', tag: '(c)' },
                { name: 'MS Dhoni', role: 'Wicketkeeper & Finisher', tag: '(wk)' },
                { name: 'Ravindra Jadeja', role: 'All-Rounder' },
                { name: 'Shivam Dube', role: 'Power-Hitter' },
                { name: 'Matheesha Pathirana', role: 'Death Bowler' }
              ],
              bench: ['Moeen Ali', 'Deepak Chahar', 'Tushar Deshpande']
            }
          }
        },

        // 5. COMPLETED MATCH: Ranji Trophy Elite Group A 2026-27 (Mumbai vs Maharashtra)
        {
          id: 'crex-mum-mah-ranji',
          sport: 'cricket',
          format: 'TEST',
          category: 'domestic',
          status: 'COMPLETED',
          statusTag: '⚪ YESTERDAY RESULT',
          badge: 'BCCI RANJI TROPHY 2026-27 🏆',
          tournament: 'Ranji Trophy Elite • Round 2 • Mumbai vs Maharashtra',
          venue: 'Sharad Pawar Cricket Academy, BKC Mumbai',
          dateLabel: 'Yesterday • Final Result',
          streamTitle: 'Mumbai vs Maharashtra • Ranji Trophy Elite Match Broadcast',
          servers: [
            { id: 1, name: 'Server 1 • DD Sports HD (BCCI Domestic Live Feed)', quality: '1080p HD', url: 'https://d3qs3d2rkhfqrt.cloudfront.net/out/v1/b17adfe543354fdd8d189b110617cddd/index.m3u8', type: 'hls' },
            { id: 2, name: 'Server 2 • BCCI Official Ranji Match Feed', quality: '1080p HD', url: 'https://www.youtube.com/embed/PdR1ldDBs1Q?autoplay=1&mute=0', type: 'iframe' },
            { id: 3, name: 'Server 3 • Willow Cricket HD (Live Stream)', quality: '1080p HD', url: 'https://d36r8jifhgsk5j.cloudfront.net/Willow_TV.m3u8', type: 'hls' }
          ],
          toss: 'Mumbai won toss and elected to bat',
          teamA: {
            name: 'Mumbai',
            code: 'MUM',
            flag: '🏏',
            score: '418 & 195/3d',
            overs: 'Won by 136 runs'
          },
          teamB: {
            name: 'Maharashtra',
            code: 'MAH',
            flag: '🏏',
            score: '262 & 215',
            overs: 'All Out'
          },
          equation: 'Mumbai won by 136 runs • Player of the Match: Shreyas Iyer (142 & 58*) • Tanush Kotian 6/64',
          situation: 'Mumbai claim 6 points with bonus bowling display; defend championship points table lead',
          winPredictor: {
            teamACode: 'MUM',
            teamAPct: 100,
            teamBCode: 'MAH',
            teamBPct: 0,
            trend: 'Match finished: Mumbai complete 136-run victory on Day 4'
          }
        },

        // 6. COMPLETED CHAMPIONSHIP MATCH: ICC Men's T20 World Cup 2026 Final (India vs New Zealand)
        {
          id: 'crex-t20-wc-final',
          sport: 'cricket',
          format: 'T20',
          category: 'international',
          status: 'COMPLETED',
          statusTag: '⚪ WORLD CHAMPIONS 2026',
          badge: 'ICC T20 WORLD CUP 2026 FINAL 🏆',
          tournament: 'ICC Men\'s T20 World Cup 2026 • Final • Narendra Modi Stadium',
          venue: 'Narendra Modi Stadium, Ahmedabad',
          dateLabel: 'Championship Final Result',
          streamTitle: 'India vs New Zealand • ICC T20 World Cup 2026 Final Historic Match Broadcast',
          servers: [
            { id: 1, name: 'Server 1 • Official ICC T20 World Cup 2026 Final Broadcast', quality: '1080p HD', url: 'https://www.youtube.com/embed/dAqiYPmojWs?autoplay=1&mute=0', type: 'iframe' },
            { id: 2, name: 'Server 2 • DD Sports HD (National Archive)', quality: '1080p HD', url: 'https://d3qs3d2rkhfqrt.cloudfront.net/out/v1/b17adfe543354fdd8d189b110617cddd/index.m3u8', type: 'hls' },
            { id: 3, name: 'Server 3 • Willow Cricket HD (World Cup Stream)', quality: '1080p HD', url: 'https://d36r8jifhgsk5j.cloudfront.net/Willow_TV.m3u8', type: 'hls' }
          ],
          toss: 'India won the toss and elected to bat first',
          teamA: {
            name: 'New Zealand',
            code: 'NZ',
            flag: '🇳🇿',
            score: '162/9',
            overs: '20.0 ov'
          },
          teamB: {
            name: 'India',
            code: 'IND',
            flag: '🇮🇳',
            score: '186/5',
            overs: '20.0 ov'
          },
          equation: 'India won by 24 runs & crowned ICC T20 World Cup 2026 Champions • Player of the Final: Jasprit Bumrah (3/16)',
          situation: 'India become first nation to win back-to-back T20 World Cups and claim historic 3rd title in front of 110,000 fans in Ahmedabad',
          winPredictor: {
            teamACode: 'IND',
            teamAPct: 100,
            teamBCode: 'NZ',
            teamBPct: 0,
            trend: 'Match Completed: India lift ICC T20 World Cup 2026 Trophy'
          }
        }
      ];

      // ---------------- DYNAMIC REAL-DATE SCHEDULE ENGINE ----------------
      self.cricketMatches = [];
      self.activeMatch = null;
      self.activeMatchTab = 'live'; // 'live', 'scorecard', 'commentary', 'squads', 'points'
      self.liveBridgeActive = false;

      self.refreshDailySchedule = function (forceActiveMatch) {
        var now = new Date();
        self.todayFormatted = formatDate(now);
        self.currentDateObj = now;

        // Day epoch: advances every 24 hours at midnight
        var dayEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
        var poolLength = masterMatchesPool.length;

        var todayPrimaryIdx = (dayEpoch) % poolLength;
        var todaySecondaryIdx = (dayEpoch + 1) % poolLength;
        var tomorrowIdx = (dayEpoch + 2) % poolLength;
        var dayAfterIdx = (dayEpoch + 3) % poolLength;
        var yesterdayIdx = (dayEpoch + 4) % poolLength;
        var olderPastIdx = (dayEpoch + 5) % poolLength;

        self.cricketMatches = masterMatchesPool.map(function (baseMatch, idx) {
          var m = angular.copy(baseMatch);

          if (idx === todayPrimaryIdx) {
            m.status = 'LIVE';
            m.statusTag = '🔴 LIVE TODAY • ' + (m.format === 'TEST' ? 'DAY SESSION' : 'MATCH IN PLAY');
            m.dateLabel = 'Today, ' + formatShort(now) + ' • Live';
            m.scheduleRank = 1;
          } else if (idx === todaySecondaryIdx) {
            m.status = 'LIVE';
            m.statusTag = '🔴 LIVE TODAY • ' + (m.format === 'T20' ? 'EVENING THRILLER' : 'SESSION 3');
            m.dateLabel = 'Today, ' + formatShort(now) + ' • Prime Live';
            m.scheduleRank = 2;
          } else if (idx === tomorrowIdx) {
            m.status = 'UPCOMING';
            m.statusTag = '🟢 TOMORROW • 7:30 PM';
            m.dateLabel = 'Tomorrow, ' + formatShort(addDays(now, 1)) + ' • 7:30 PM IST';
            m.scheduleRank = 3;
          } else if (idx === dayAfterIdx) {
            m.status = 'UPCOMING';
            m.statusTag = '🟢 UPCOMING';
            m.dateLabel = formatShort(addDays(now, 2)) + ' • 7:30 PM IST';
            m.scheduleRank = 4;
          } else if (idx === yesterdayIdx) {
            m.status = 'COMPLETED';
            m.statusTag = '⚪ YESTERDAY RESULT';
            m.dateLabel = 'Yesterday, ' + formatShort(addDays(now, -1)) + ' • Final';
            m.scheduleRank = 5;
          } else {
            m.status = 'COMPLETED';
            m.statusTag = '⚪ COMPLETED';
            m.dateLabel = formatShort(addDays(now, -2)) + ' • Final';
            m.scheduleRank = 6;
          }
          return m;
        });

        // Sort: LIVE first, then UPCOMING, then COMPLETED
        self.cricketMatches.sort(function (a, b) {
          return a.scheduleRank - b.scheduleRank;
        });

        if (forceActiveMatch || !self.activeMatch || !self.cricketMatches.some(function (m) { return m.id === self.activeMatch.id; })) {
          self.activeMatch = self.cricketMatches[0];
        } else {
          var current = self.cricketMatches.find(function (m) { return m.id === self.activeMatch.id; });
          if (current) {
            self.activeMatch = current;
          }
        }
      };

      // ---------------- LIVE CRICKET FEED BRIDGE (CRICINFO / OPEN FEED) ----------------
      self.fetchLiveNewsBridge = function () {
        var cricinfoRssUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://www.espncricinfo.com/rss/content/story/feeds/0.xml');

        $http.get(cricinfoRssUrl, { timeout: 4500 })
          .then(function (res) {
            if (res.data && res.data.items && res.data.items.length >= 3) {
              var liveArticles = res.data.items.slice(0, 4).map(function (item, index) {
                var cleanDesc = item.description ? item.description.replace(/<[^>]*>?/gm, '').trim() : '';
                return {
                  id: 'live-wire-' + index,
                  tag: 'LIVE CRICINFO WIRE • ' + (item.author ? item.author.toUpperCase() : 'EDITORIAL'),
                  title: item.title,
                  subtitle: cleanDesc.slice(0, 160) + '...',
                  source: 'ESPNcricinfo Global Wire',
                  timeAgo: 'Live synced today',
                  author: item.author || 'ESPNcricinfo Staff',
                  readTime: '4 min read',
                  cover: item.thumbnail || (self.cricketNews[index] ? self.cricketNews[index].cover : 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80'),
                  highlights: [
                    'Live breaking cricket coverage syndicated from ESPNcricinfo',
                    cleanDesc.slice(0, 120),
                    'Synced automatically by CinVerse Live Bridge'
                  ],
                  link: item.link
                };
              });

              self.cricketNews = liveArticles;
              self.liveBridgeActive = true;
              $rootScope.$applyAsync();
            }
          })
          .catch(function () {
            // Resilient fallback: retains curated editorial news
            self.liveBridgeActive = false;
          });
      };

      // ---------------- BACKEND LIVE CRICKET SCRAPER BRIDGE ----------------
      self.backendScraperActive = false;
      self.scrapedMatchesCount = 0;

      self.fetchBackendScrapedMatches = function () {
        $http.get('/api/cricket-live', { timeout: 4000 })
          .then(function (res) {
            if (res.data && res.data.success && res.data.matches && res.data.matches.length > 0) {
              self.backendScraperActive = true;
              self.scrapedMatchesCount = res.data.matches.length;

              // Filter out any existing scraped matches from cricketMatches
              var nonScraped = self.cricketMatches.filter(function (m) {
                return !m.id.startsWith('scraped-live-');
              });

              var scrapedCards = res.data.matches.map(function (m, idx) {
                var team1 = m.team1 || 'Team 1';
                var team2 = m.team2 || 'Team 2';
                var team1Code = team1.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 4).toUpperCase();
                var team2Code = team2.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 4).toUpperCase();
                var fmt = m.rawTitle.toLowerCase().includes('t20') ? 'T20' : (m.rawTitle.toLowerCase().includes('test') ? 'TEST' : 'ODI');

                return {
                  id: 'scraped-live-' + idx,
                  sport: 'cricket',
                  format: fmt,
                  category: 'international',
                  status: 'LIVE',
                  statusTag: '🔴 SCRAPED LIVE • REAL TIME',
                  badge: 'CRICINFO LIVE WEB SCRAPER 📡',
                  tournament: m.rawTitle,
                  venue: 'International Stadium • Live Scraper Wire',
                  dateLabel: 'Live Scraped Now • Real World',
                  streamTitle: m.rawTitle + ' • Live HD Broadcast',
                  servers: [
                    { id: 1, name: 'Server 1 • Willow Cricket HD (Live Stadium Stream)', quality: '1080p 60FPS', url: 'https://d36r8jifhgsk5j.cloudfront.net/Willow_TV.m3u8', type: 'hls' },
                    { id: 2, name: 'Server 2 • Cricket Gold HD (Stadium Live Feed)', quality: '1080p HD', url: 'https://streams2.sofast.tv/ptnr-yupptv/title-cricketgold/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/b2048bb8-1686-4432-aa50-647245383e0c/manifest.m3u8', type: 'hls' },
                    { id: 3, name: 'Server 3 • Global Cricket Broadcast', quality: '1080p HD', url: 'https://www.youtube.com/embed/ebkwnpV6aOc?autoplay=1&mute=0', type: 'iframe' }
                  ],
                  toss: 'Live match tracked in real time via backend web scraper (Cricinfo Live Wire)',
                  pitchReport: 'Evenly balanced track with true bounce and consistent carry for batters and bowlers.',
                  weather: 'Fair weather • Continuous scraper sync active',
                  teamA: {
                    name: team1,
                    code: team1Code,
                    flag: '🏏',
                    score: 'Live',
                    overs: 'In Play'
                  },
                  teamB: {
                    name: team2,
                    code: team2Code,
                    flag: '⚡',
                    score: 'Yet to bat',
                    overs: ''
                  },
                  equation: m.description || m.rawTitle,
                  situation: 'Live ongoing match tracked continuously by background web scraper with 60s memory cache',
                  winPredictor: {
                    teamACode: team1Code,
                    teamAPct: 50,
                    teamBCode: team2Code,
                    teamBPct: 50,
                    trend: 'Real-time scraper tracking active'
                  },
                  currentOver: {
                    overNum: 16,
                    balls: ['1', '0', '4', '1', '2', '0']
                  },
                  striker: { name: team1 + ' Batter', runs: 34, balls: 28, fours: 4, sixes: 1, sr: '121.4' },
                  nonStriker: { name: team1 + ' Partner', runs: 22, balls: 19, fours: 2, sixes: 0, sr: '115.7' },
                  currentBowler: { name: team2 + ' Bowler', overs: '3.4', maidens: 0, runs: 24, wickets: 1, econ: '6.54' },
                  partnership: '46 runs (38 balls)',
                  lastWicket: 'Top order bat c Keeper b Bowler 16',
                  recentOversSummary: 'Last 5 ovs: 36 runs, 1 wkt (RR: 7.20)',
                  scheduleRank: 0
                };
              });

              self.cricketMatches = scrapedCards.concat(nonScraped);
              $rootScope.$applyAsync();
            }
          })
          .catch(function () {
            self.backendScraperActive = false;
          });
      };

      // Initialize schedule & scrapers immediately
      self.refreshDailySchedule(true);
      self.fetchLiveNewsBridge();
      self.fetchBackendScrapedMatches();

      // Check daily rollover every 30 seconds
      var lastCheckedDay = new Date().getDate();
      $interval(function () {
        var currentDay = new Date().getDate();
        if (currentDay !== lastCheckedDay) {
          lastCheckedDay = currentDay;
          self.refreshDailySchedule(true);
          self.fetchLiveNewsBridge();
          self.fetchBackendScrapedMatches();
          $rootScope.$broadcast('sports:dayRollover');
        }
      }, 30000);

      // Periodically refresh live scraper every 60 seconds
      $interval(function () {
        self.fetchBackendScrapedMatches();
      }, 60000);

      // Periodically refresh news feed every 15 minutes
      $interval(function () {
        self.fetchLiveNewsBridge();
      }, 900000);

      // ---------------- ICC WORLD TEST CHAMPIONSHIP (WTC) POINTS TABLE ----------------
      self.wtcPointsTable = [
        { rank: 1, team: 'India', code: 'IND', flag: '🇮🇳', played: 12, won: 8, lost: 3, drawn: 1, points: 98, pct: '68.06%', form: 'W W W L W' },
        { rank: 2, team: 'Australia', code: 'AUS', flag: '🇦🇺', played: 12, won: 8, lost: 3, drawn: 1, points: 90, pct: '62.50%', form: 'W W L W D' },
        { rank: 3, team: 'Sri Lanka', code: 'SL', flag: '🇱🇰', played: 9, won: 5, lost: 4, drawn: 0, points: 60, pct: '55.56%', form: 'W W W L L' },
        { rank: 4, team: 'New Zealand', code: 'NZ', flag: '🇳🇿', played: 9, won: 4, lost: 5, drawn: 0, points: 48, pct: '44.44%', form: 'W L L W L' },
        { rank: 5, team: 'England', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', played: 18, won: 9, lost: 8, drawn: 1, points: 93, pct: '43.06%', form: 'L W W W L' },
        { rank: 6, team: 'South Africa', code: 'SA', flag: '🇿🇦', played: 6, won: 2, lost: 3, drawn: 1, points: 28, pct: '38.89%', form: 'W D L L W' },
        { rank: 7, team: 'Pakistan', code: 'PAK', flag: '🇵🇰', played: 9, won: 3, lost: 6, drawn: 0, points: 31, pct: '28.70%', form: 'W L L L L' },
        { rank: 8, team: 'Bangladesh', code: 'BAN', flag: '🇧🇩', played: 8, won: 3, lost: 5, drawn: 0, points: 33, pct: '30.56%', form: 'L L W W L' }
      ];

      // ---------------- IPL 2026 STANDINGS TABLE ----------------
      self.iplPointsTable = [
        { rank: 1, team: 'Kolkata Knight Riders', code: 'KKR', flag: '💜', played: 14, won: 10, lost: 3, nr: 1, points: 21, nrr: '+1.428', form: 'W W W D W' },
        { rank: 2, team: 'Sunrisers Hyderabad', code: 'SRH', flag: '🧡', played: 14, won: 9, lost: 5, nr: 0, points: 18, nrr: '+0.890', form: 'W W L W W' },
        { rank: 3, team: 'Rajasthan Royals', code: 'RR', flag: '💗', played: 14, won: 8, lost: 5, nr: 1, points: 17, nrr: '+0.273', form: 'L L L D W' },
        { rank: 4, team: 'Royal Challengers Bengaluru', code: 'RCB', flag: '❤️', played: 14, won: 7, lost: 7, nr: 0, points: 14, nrr: '+0.459', form: 'W W W W W' },
        { rank: 5, team: 'Chennai Super Kings', code: 'CSK', flag: '💛', played: 14, won: 7, lost: 7, nr: 0, points: 14, nrr: '+0.392', form: 'L W L W L' },
        { rank: 6, team: 'Delhi Capitals', code: 'DC', flag: '💙', played: 14, won: 7, lost: 7, nr: 0, points: 14, nrr: '-0.377', form: 'W L W L W' },
        { rank: 7, team: 'Lucknow Super Giants', code: 'LSG', flag: '🩵', played: 14, won: 7, lost: 7, nr: 0, points: 14, nrr: '-0.667', form: 'W L L L W' },
        { rank: 8, team: 'Gujarat Titans', code: 'GT', flag: '🔷', played: 14, won: 5, lost: 7, nr: 2, points: 12, nrr: '-1.063', form: 'D D W L L' },
        { rank: 9, team: 'Punjab Kings', code: 'PBKS', flag: '🔴', played: 14, won: 5, lost: 9, nr: 0, points: 10, nrr: '-0.353', form: 'L L W L W' },
        { rank: 10, team: 'Mumbai Indians', code: 'MI', flag: '💙', played: 14, won: 4, lost: 10, nr: 0, points: 8, nrr: '-0.318', form: 'L L W L L' }
      ];

      // ---------------- CRICKET NEWS & EDITORIAL (CRICINFO / CRICBUZZ GRADE) ----------------
      self.cricketNews = [
        {
          id: 'news-1',
          tag: 'ICC WTC 2025-27 • CENTURION CLASH',
          title: 'Temba Bavuma & Tristan Stubbs Lead Proteas Fightback at SuperSport Park',
          subtitle: 'South Africa withstand Pat Cummins\' early morning fire to build a crucial second-innings lead as Centurion pitch shows variable bounce.',
          source: 'CREX Insider • ESPNcricinfo',
          timeAgo: '15 mins ago',
          author: 'Firdose Moonda',
          readTime: '4 min read',
          cover: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
          highlights: [
            'Bavuma registers gritty 64* off 118 balls to guide South Africa past Australia\'s first-innings tally',
            'Pat Cummins claims 2/48 with reverse swing before tea interval',
            'South Africa aiming for 200+ target on Day 3 pitch'
          ]
        },
        {
          id: 'news-2',
          tag: 'T20 WORLD CUP 2026 CHAMPIONS',
          title: 'How Team India Built a Fearless T20 Dynasty to Defend Their World Crown',
          subtitle: 'From Ahmedabad to global dominance: Suryakumar Yadav, Hardik Pandya and Jasprit Bumrah solidify India\'s era as back-to-back World Champions.',
          source: 'Cricbuzz Editorial',
          timeAgo: '1 hour ago',
          author: 'Harsha Bhogle',
          readTime: '6 min read',
          cover: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80',
          highlights: [
            'India became first nation to win consecutive Men\'s T20 World Cups',
            'Jasprit Bumrah\'s 3/16 in the final hailed as modern bowling perfection',
            'Aggressive Powerplay template engineered by Gautam Gambhir transforms white-ball approach'
          ]
        },
        {
          id: 'news-3',
          tag: 'TATA IPL 2026 PREVIEW',
          title: 'IPL 2026 Season Analysis: Captaincy Transitions, RTM Strategies & Powerplay Metrics',
          subtitle: 'Franchises assemble ₹120 Crore super squads as Wankhede and Chepauk prepare for high-intensity blockbuster fixtures.',
          source: 'CREX Exchange Desk',
          timeAgo: '3 hours ago',
          author: 'Amol Karhadkar',
          readTime: '5 min read',
          cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
          highlights: [
            'CSK vs MI El Clásico ticket demand breaks digital booking records',
            'Two-bouncer rule and smart DRS technology implemented across all 74 matches',
            'All 10 teams finalize 25-man rosters ahead of opening weekend'
          ]
        },
        {
          id: 'news-4',
          tag: 'PAKISTAN VS SRI LANKA 2026',
          title: 'Rawalpindi Surface Ready for WTC Decider: Pace Early, Spin on Days 4 & 5',
          subtitle: 'Shan Masood and Dhananjaya de Silva hold pre-match press conferences ahead of crucial series decider in northern Pakistan.',
          source: 'ICC Media Desk',
          timeAgo: '5 hours ago',
          author: 'Osman Samiuddin',
          readTime: '3 min read',
          cover: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
          highlights: [
            'Rawalpindi pitch curator leaves 8mm grass to assist seamers in first session',
            'Shaheen Afridi and Naseem Shah confirmed in Pakistan 12-man shortlist',
            'Prabath Jayasuriya expected to lead Sri Lankan bowling attack'
          ]
        }
      ];

      // ---------------- LIVE SIMULATOR FOR CREX REAL-TIME UPDATES ----------------
      $interval(function () {
        // Increment live T20 match ball-by-ball
        var t20 = self.cricketMatches.find(function (m) { return m.id === 'crex-ind-aus-t20'; });
        if (t20 && t20.teamB && t20.teamB.runs < 187) {
          var ballRuns = [1, 2, 4, 1, 6, 0][Math.floor(Math.random() * 6)];
          t20.teamB.runs += ballRuns;
          t20.teamB.score = t20.teamB.runs + '/' + t20.teamB.wickets;

          if (t20.striker) {
            t20.striker.runs += ballRuns;
            t20.striker.balls += 1;
            t20.striker.sr = ((t20.striker.runs / t20.striker.balls) * 100).toFixed(1);
          }

          var runsNeeded = Math.max(0, 193 - t20.teamB.runs);
          t20.equation = 'Australia need ' + runsNeeded + ' runs to win • Maxwell & David at the crease';

          if (t20.winPredictor) {
            t20.winPredictor.teamBPct = Math.min(99, Math.max(10, t20.winPredictor.teamBPct + (ballRuns > 1 ? 2 : -1)));
            t20.winPredictor.teamAPct = 100 - t20.winPredictor.teamBPct;
          }

          // Add commentary ball
          if (t20.commentary && t20.commentary.length) {
            var overStr = '17.' + ((t20.striker.balls % 6) + 1);
            t20.commentary.unshift({
              over: overStr,
              ball: overStr,
              bowler: 'Jasprit Bumrah',
              batsman: t20.striker.name,
              runs: ballRuns,
              isBoundary: ballRuns >= 4,
              isFour: ballRuns === 4,
              isSix: ballRuns === 6,
              text: ballRuns === 6 ? 'SIX! Massive blow deep into the MCG Great Southern Stand! Clean strike!' :
                    (ballRuns === 4 ? 'FOUR! Precision placement finding the gap through extra cover!' :
                    (ballRuns === 0 ? 'Pace and precision! Toe-crushing yorker at 144 km/h.' : 'Pushed into the offside for ' + ballRuns + ' run(s).'))
            });
            if (t20.commentary.length > 25) {
              t20.commentary.pop();
            }
          }

          $rootScope.$applyAsync();
        }
      }, 7000);

      // Select active match for CREX Match Center
      self.selectMatch = function (match) {
        if (!match) return;
        self.activeMatch = match;
        self.activeMatchTab = 'live';
      };

      self.setMatchTab = function (tab) {
        self.activeMatchTab = tab;
      };
    }
  ]);
})();
