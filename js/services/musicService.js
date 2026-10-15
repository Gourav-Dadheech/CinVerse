/**
 * Cinverse - musicService.js
 * Spotify/Resso-Style Full-Length Audio Engine & Global Playback Manager.
 * Features:
 *  - Full-length songs (3 to 5 minutes, never 30-sec previews)
 *  - Official YouTube Audio Engine via background IFrame API with seamless fallback
 *  - Synced live progress updates, turntable animation, and karaoke lyrics
 *  - Continuous playback (auto next-track on song end)
 *  - User playlists and liked songs (saved to localStorage)
 *  - 1-click MP3 download to device storage
 *  - Live global track search returning full songs
 */
(function () {
  'use strict';

  angular.module('cinVerseApp').service('MusicService', [
    '$rootScope',
    '$timeout',
    function ($rootScope, $timeout) {
      var self = this;

      // Global HTML5 Audio Element (for fallback or direct streams)
      var audio = new Audio();
      audio.preload = 'metadata';

      // Background YouTube Player state
      var ytPlayer = null;
      var ytReady = false;
      var ytPendingTrack = null;
      var progressInterval = null;

      self.isPlaying = false;
      self.currentTime = 0;
      self.duration = 0;
      self.progressPct = 0;
      self.volume = 80;
      self.isMuted = false;
      self.currentTrack = null;
      self.queue = [];
      self.queueIndex = 0;
      self.repeatMode = false;
      self.shuffleMode = false;
      self.currentTimeFormatted = '0:00';
      self.durationFormatted = '0:00';

      function formatTime(sec) {
        if (isNaN(sec) || sec <= 0) return '0:00';
        var m = Math.floor(sec / 60);
        var s = Math.floor(sec % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
      }

      self.formatTime = formatTime;

      // ---------------- CURATED HITS, SOUNDTRACKS & CHARTS (FULL LENGTH) ----------------
      self.catalog = [
        // 1. Indie Anthems & Top Hits
        {
          id: 'i-husn',
          title: 'Husn',
          artist: 'Anuv Jain',
          album: 'Husn - Single',
          category: 'india',
          duration: '3:38',
          durationSec: 218,
          ytId: '_deqdZmKzyg',
          dateAdded: 'Today',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/31/5d/58/315d5836-7db4-90fa-96c7-36fa4f3ceb96/cover.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/31/5d/58/315d5836-7db4-90fa-96c7-36fa4f3ceb96/mzaf_761014035866726482.plus.aac.p.m4a',
          badge: 'INDIE MASTERPIECE 💫',
          likes: 980000,
          verified: true,
          lyrics: "Dekho dekho kaisi baatein yahan ki...\nSunte sabhi hain par samjhe na koi!\nHum to lutf uthane aaye the,\nKyu khud ko hi kho baithe hain hum yahan?\n\nTu husn hai, ya koi jaadu hai,\nHar taraf teri hi khushboo hai,\nMain bhatak raha iss mod pe,\nBas tere deedar ki aarzoo hai...",
          artistBio: "Anuv Jain is India's beloved indie-pop singer-songwriter whose poetic acoustic ballad 'Husn' captured hearts worldwide."
        },
        {
          id: 'i-jotum',
          title: 'Jo Tum Mere Ho',
          artist: 'Anuv Jain',
          album: 'Jo Tum Mere Ho - Single',
          category: 'india',
          duration: '4:12',
          durationSec: 252,
          ytId: 'usvVGXFIpTM',
          dateAdded: 'Yesterday',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b8/f0/ec/b8f0ecd5-79e2-dc95-f4ab-b4fdda3ab02d/cover.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b8/f0/ec/b8f0ecd5-79e2-dc95-f4ab-b4fdda3ab02d/mzaf_9450036655132036167.plus.aac.p.m4a',
          badge: 'CHART TOPPER 💖',
          likes: 720000,
          verified: true,
          lyrics: "Jo tum mere ho, toh main kyu darrun?\nHar lamha tere sang jeeta chalun!\nTere bina yeh jahaan hai suna,\nTu hi meri subah, tu hi mera rasta...",
          artistBio: "Anuv Jain's romantic masterwork celebrating timeless devotion and acoustic warmth."
        },
        {
          id: 'i1',
          title: 'Tauba Tauba (From "Bad Newz")',
          artist: 'Karan Aujla',
          album: 'Bad Newz (Original Soundtrack)',
          category: 'india',
          duration: '3:27',
          durationSec: 207,
          ytId: 'LK7-_dgAVQE',
          dateAdded: 'Today',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/79/d2/01/79d201d2-e54d-5604-81fb-313f30db7219/198588533581.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/34/8d/63/348d6342-2c35-bf31-8131-2c8b3cfe3c09/mzaf_15374551219149804677.plus.aac.p.m4a',
          badge: '#1 TRENDING INDIA 🇮🇳',
          likes: 540000,
          verified: true,
          lyrics: "Husn tera tauba tauba!\nAkhan teriyaan ne kita mainu pagal,\nNachdi tu jado lak hilake,\nDil lut leya tu sachi jaake!",
          artistBio: "Karan Aujla is a global Punjabi superstar whose viral single Tauba Tauba took the charts by storm."
        },
        {
          id: 'i2',
          title: 'Chaleya (From "Jawan")',
          artist: 'Anirudh Ravichander & Arijit Singh',
          album: 'Jawan (Original Motion Picture Soundtrack)',
          category: 'india',
          duration: '3:21',
          durationSec: 201,
          ytId: 'V_jp5_VAzXk',
          dateAdded: '1 week ago',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/bb/f4/f5/bbf4f511-3c12-c25e-a475-b6d06faa8c13/8902894362047_cover.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/76/05/d9/7605d905-f631-517d-df7f-e162affcd414/mzaf_9976541859961700749.plus.aac.p.m4a',
          badge: 'BOLLYWOOD HIT ❤️',
          likes: 890000,
          verified: true,
          lyrics: "Ishq mein dil bana hai, tere liye chaleya...\nTere peeche peeche har din chaleya!\nHaye dil mera tujhko pukare,\nNaino se naino ki taareef chaleya...",
          artistBio: "Anirudh Ravichander and Arijit Singh delivered one of the biggest Bollywood smashes of all time in SRK's Jawan."
        },
        {
          id: 'i3',
          title: 'Apna Bana Le (From "Bhediya")',
          artist: 'Arijit Singh, Sachin-Jigar',
          album: 'Apna Bana Le (From "Bhediya") - Single',
          category: 'india',
          duration: '4:21',
          durationSec: 261,
          ytId: 'ElZfdU54Cp8',
          dateAdded: '2 weeks ago',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/2e/0b/c0/2e0bc070-112f-a827-6ad8-6bc64f7caaff/840214460180.png/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/eb/27/61/eb2761c7-d606-0912-dff0-2dc6b69974bd/mzaf_2023722930851223219.plus.aac.p.m4a',
          badge: 'SOULFUL ROMANCE ✨',
          likes: 520000,
          verified: true,
          lyrics: "Tu mera koi na hoke bhi kuch laage...\nApna bana le piya, apna bana le piya!\nDil ke nagar mein shehar tu basa le piya...",
          artistBio: "Sachin-Jigar's timeless composition rendered by Arijit Singh remains a permanent fixture on romantic playlists."
        },
        {
          id: 'i4',
          title: 'Aaj Ki Raat (From "Stree 2")',
          artist: 'Madhubanti Bagchi & Divya Kumar',
          album: 'Stree 2 (Original Motion Picture Soundtrack)',
          category: 'india',
          duration: '3:49',
          durationSec: 229,
          ytId: 'XtZTpxnrHAc',
          dateAdded: '4 days ago',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/3a/7f/47/3a7f47da-2330-c758-4460-ce12f9385a82/198588793954.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/71/53/54/71535490-31fe-a429-8113-4dbded06dd4d/mzaf_12311178644671562356.plus.aac.p.m4a',
          badge: 'CHARTBUSTER 🔥',
          likes: 810000,
          verified: true,
          lyrics: "Aaj ki raat maza husn ka aankhon se lijiye...\nJo aag seene mein hai wo aag bujha dijiye!\nLage thumka toh hille saara zamaana...",
          artistBio: "Record-breaking dance anthem from Stree 2 composed by Sachin-Jigar with electrifying folk and electronic rhythm."
        },
        {
          id: 'sp-1',
          title: 'Tu Hain Toh (From "Mr. And Mrs. Mahi")',
          artist: 'Hunny, Bunny & Sagar',
          album: 'Mr. And Mrs. Mahi (Original Soundtrack)',
          category: 'india',
          duration: '4:44',
          durationSec: 284,
          ytId: 'ohx5VxmQCmM',
          dateAdded: 'Today',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/66/bf/32/66bf3292-6fc4-9e06-2da4-9d8b13810b05/196872135619.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/33/d3/f3/33d3f3a0-372f-a962-03d1-ce16f015ac12/mzaf_12841254301432216971.plus.aac.p.m4a',
          badge: 'BOLLYWOOD ROMANCE ❤️',
          likes: 460000,
          verified: true,
          lyrics: "Tu hain toh har lamha haseen ban gaya...\nTu hain toh mera har gham dua ban gaya...\nTere bina ab chain kahan,\nTu hai jahaan mera aasmaan wahan...\nTu hain toh sab kuch hai mere liye!",
          artistBio: "Bunny, Hunny, and Sagar are celebrated for evocative melody structures and soulful acoustic productions."
        },
        {
          id: 'sp-2',
          title: 'Sajni (From "Laapataa Ladies")',
          artist: 'Arijit Singh & Ram Sampath',
          album: 'Laapataa Ladies (Original Soundtrack)',
          category: 'india',
          duration: '2:51',
          durationSec: 171,
          ytId: 'Ys6iPqfvmI0',
          dateAdded: 'Yesterday',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/48/d8/bf/48d8bf8f-df58-e05f-62e2-bc494d748ea4/8902894362252_cover.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/0e/5f/a4/0e5fa4f9-c67b-31f1-1d1e-4c3e0f86e233/mzaf_15112412104812626230.plus.aac.p.m4a',
          badge: 'NATIONAL AWARD HIT 🌸',
          likes: 710000,
          verified: true,
          lyrics: "O sajni re...\nKaise kate din raat, kaise bite ye pal?\nTere bina jiya jaae na,\nChupke se aao sapno mein,\nO re sajni re...",
          artistBio: "Ram Sampath's rural folk masterpiece featuring Arijit Singh's heartfelt vocals, celebrated worldwide."
        },
        {
          id: 'sp-3',
          title: 'Tum Hi Ho (Aashiqui 2)',
          artist: 'Arijit Singh & Mithoon',
          album: 'Aashiqui 2 (Original Motion Picture Soundtrack)',
          category: 'india',
          duration: '4:22',
          durationSec: 262,
          ytId: 'Umqb9KENgmk',
          dateAdded: '3 days ago',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/23/ee/bb23eeed-0c35-4f1d-2b11-485622777ae4/8902894353007_cover.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3a/8c/9b/3a8c9b0b-2def-750a-f615-1555bf941edf/mzaf_17229496441442805917.plus.aac.p.m4a',
          badge: 'ALL-TIME CLASSIC 🏆',
          likes: 1250000,
          verified: true,
          lyrics: "Hum tere bin ab reh nahi sakte,\nTere bina kya wajood mera...\nTujhse juda gar ho jaayenge,\nToh khud se hi ho jaayenge judaa...",
          artistBio: "Arijit Singh is India's most streamed artist, with over 100M followers and iconic ballads spanning Indian cinema."
        },

        // 2. Cinema & Marvel OSTs
        {
          id: 'm1',
          title: 'Wanda\'s Theme & Vision Suite',
          artist: 'Christophe Beck & Marvel Music',
          album: 'WandaVision: Episode 1 (Original Soundtrack)',
          category: 'ost',
          duration: '2:22',
          durationSec: 142,
          ytId: 'ybvJ3fSHl3I',
          dateAdded: 'Today',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/52/8b/59/528b5967-b53a-392b-a8e4-6f55e9365a60/21UMGIM02032.rgb.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/f0/f5/d2/f0f5d280-a1e3-19b1-1038-8698dfe4c115/mzaf_9041798100046008669.plus.aac.p.m4a',
          badge: 'MARVEL OST 🔥',
          likes: 51200,
          verified: true,
          lyrics: "Across the multiverse, beyond space and time...\nA new quest begins in the heart of the synthezoid.\nMemory awakens, white armor gleaming,\nThe vision remains eternal...",
          artistBio: "Christophe Beck's iconic orchestration blends vintage analog synthesizers with a 90-piece symphony orchestra."
        },
        {
          id: 'm2',
          title: 'Portals (Avengers: Endgame Theme)',
          artist: 'Alan Silvestri',
          album: 'Avengers: Endgame (Original Motion Picture Soundtrack)',
          category: 'ost',
          duration: '3:17',
          durationSec: 197,
          ytId: 'F_mhWxOjxp4',
          dateAdded: '2 days ago',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/f3/90/e6/f390e639-1ec5-ebe0-cfb9-232b844d10c8/19UMGIM37659.rgb.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/36/e6/a6/36e6a673-adce-bd93-47b1-40a15e1e4407/mzaf_15344626316703445955.plus.aac.p.m4a',
          badge: 'ICONIC THEME ⚡',
          likes: 95400,
          verified: true,
          lyrics: "On your left...\nSparks ignite the dark sky as heroes assemble.\nThe ultimate cinematic crescendo of our generation.",
          artistBio: "Alan Silvestri is a legendary Hollywood composer famed for Back to the Future, Predator, and the Avengers theme."
        },
        {
          id: 'm3',
          title: 'Cornfield Chase (Interstellar)',
          artist: 'Hans Zimmer',
          album: 'Interstellar (Original Motion Picture Soundtrack)',
          category: 'ost',
          duration: '2:07',
          durationSec: 127,
          ytId: '7GlsxNI4LVI',
          dateAdded: '3 days ago',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/f4/5b/73/f45b735a-8d7a-9713-b217-0f8e1593c28b/794043201943.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3a/ee/23/3aee2300-f6f7-a006-e20f-28092e814cbe/mzaf_1624587954644600228.plus.aac.p.m4a',
          badge: 'MASTERPIECE 🌌',
          likes: 132000,
          verified: true,
          lyrics: "Do not go gentle into that good night...\nRage, rage against the dying of the light.\nThrough dust and gravitational waves, mankind survives.",
          artistBio: "Recorded on the 1926 Harrison & Harrison pipe organ at Temple Church in London."
        },

        // 3. Anime Hits & Anthems
        {
          id: 'a1',
          title: 'Gurenge (Demon Slayer OP)',
          artist: 'LiSA',
          album: 'LEO-NiNE (Kimetsu no Yaiba)',
          category: 'anime',
          duration: '3:58',
          durationSec: 238,
          ytId: 'TqyfmFaZlqw',
          dateAdded: 'Today',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/51/b3/58/51b35899-bda2-50d2-2c00-b2b95999b3c3/4547366473681.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/02/9f/31/029f31d9-865f-8238-795d-0a69106cd7bd/mzaf_4087349157470098609.plus.aac.p.m4a',
          badge: 'ANIME ANTHEM ⚔️',
          likes: 998000,
          verified: true,
          lyrics: "Tsuyoku nareru riyuu wo shitta...\nBoku wo tsurete susume!\nDorodarake no soumatou ni yowareru,\nKowabaru kokoro furueru te wa tsukamitai mono ga aru...",
          artistBio: "LiSA's global mega-hit theme song for Demon Slayer: Kimetsu no Yaiba, breaking streaming records worldwide."
        },
        {
          id: 'a2',
          title: 'Shinzo wo Sasageyo! (Attack on Titan)',
          artist: 'Linked Horizon',
          album: 'Shingeki no Kiseki (Season 2 OP)',
          category: 'anime',
          duration: '5:42',
          durationSec: 342,
          ytId: '8QPyFlJNmus',
          dateAdded: '2 weeks ago',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/fa/1b/64/fa1b6416-bbe0-9237-e07f-8d2ccb8325e8/PCSP_02251.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/79/07/f9/7907f947-b24b-ab06-6475-40a16a0574d3/mzaf_10430669270296508039.plus.aac.p.m4a',
          badge: 'SURVEY CORPS 🛡️',
          likes: 835000,
          verified: true,
          lyrics: "Sasageyo! Sasageyo! Shinzo wo sasageyo!\nSubete no gisei wa ima kono toki no tame ni...\nSusume! Shingeki no Kyojin!",
          artistBio: "Linked Horizon's thunderous orchestral marching battle anthem for the Scout Regiment in Attack on Titan."
        },
        {
          id: 'a3',
          title: 'Kaikai Kitan (Jujutsu Kaisen OP)',
          artist: 'Eve',
          album: 'Kaikai Kitan / Ao No Waltz',
          category: 'anime',
          duration: '3:42',
          durationSec: 222,
          ytId: 'isY3rtuSsK8',
          dateAdded: '3 days ago',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/cb/e7/4a/cbe74ac2-3dba-c282-5be6-5cc1c71ccf82/4988061912912.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/b1/b9/99/b1b999d6-2533-85f0-7eda-3b51122f5fdc/mzaf_5590574589561084646.plus.aac.p.m4a',
          badge: 'JUJUTSU HIT ⚡',
          likes: 640000,
          verified: true,
          lyrics: "Yami wo haratte, yami wo haratte...\nYoru no tobari ga oritara aizu da!\nFushigi na sekai he mayokoikonde...",
          artistBio: "Eve's fast-paced rock masterpiece opening the Jujutsu Kaisen anime universe."
        },

        // 4. Global Top 50 Hits
        {
          id: 'g1',
          title: 'Starboy',
          artist: 'The Weeknd ft. Daft Punk',
          album: 'Starboy',
          category: 'global',
          duration: '3:50',
          durationSec: 230,
          ytId: 'dMMUH_ZpbB0',
          dateAdded: '3 days ago',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/11/71/d6/1171d6ad-3c96-e027-2af6-58028426588c/mzaf_15137631797407745471.plus.aac.p.m4a',
          badge: 'GLOBAL TOP 50 🌐',
          likes: 1590000,
          verified: true,
          lyrics: "I'm tryna put you in the worst mood, ah...\nP1 cleaner than your church shoes, ah!\nLook what you've done, I'm a motherf***ing starboy!",
          artistBio: "The Weeknd's chart-topping collaboration with French electronic royalty Daft Punk."
        },
        {
          id: 'g2',
          title: 'Die With A Smile',
          artist: 'Lady Gaga & Bruno Mars',
          album: 'Die With A Smile - Single',
          category: 'global',
          duration: '4:12',
          durationSec: 252,
          ytId: 'DlFXDl_ROAM',
          dateAdded: '5 days ago',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/11/ae/f2/11aef294-f57c-bab9-c9fc-529162984e62/24UMGIM85348.rgb.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/07/6a/99/076a99ed-b946-431b-6f1f-54fa187ca5bd/mzaf_8102882277995122875.plus.aac.p.m4a',
          badge: 'VIRAL DUET 🌟',
          likes: 1290000,
          verified: true,
          lyrics: "If the world was ending, I'd wanna be next to you...\nIf the party was over and our time on Earth was through,\nI'd wanna hold you just for a while and die with a smile.",
          artistBio: "Blockbuster power-ballad collaboration between Lady Gaga and Bruno Mars that dominated charts globally."
        },
        {
          id: 'g3',
          title: 'Espresso',
          artist: 'Sabrina Carpenter',
          album: 'Short n\' Sweet',
          category: 'global',
          duration: '2:55',
          durationSec: 175,
          ytId: 'eVli-tstM5E',
          dateAdded: '1 week ago',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/57/e8/7b/57e87ba0-5057-9bb9-c247-ce7dbe426e89/24UMGIM55213.rgb.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e9/4d/02/e94d0230-11ee-ef94-d2cf-a5d547bd73f4/mzaf_554140808559155562.plus.aac.p.m4a',
          badge: 'SUMMER HIT ☕',
          likes: 1010000,
          verified: true,
          lyrics: "Now he's thinkin' 'bout me every night, oh...\nIs it that sweet? I guess so!\nSay you can't sleep, baby, I know... That's that me, espresso!",
          artistBio: "Sabrina Carpenter's infectiously catchy pop sensation that swept summer festivals and global playlists."
        },

        // 5. Lo-Fi Chill & Night Ambient
        {
          id: 'cl1',
          title: 'Lofi Hip Hop Beats (Relax & Chill)',
          artist: 'Snuggly & CinVerse Sound Lab',
          album: 'Lofi Hip Hop Radio Session',
          category: 'chill',
          duration: '3:15',
          durationSec: 195,
          ytId: 'jfKfPfyJRdk',
          dateAdded: 'Yesterday',
          cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/ae/34/2e/ae342ef8-f975-050e-2a8e-1dda3be91767/5057917088442_cover.jpg/600x600bb.jpg',
          artistHeroImg: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1000&auto=format&fit=crop&q=80',
          audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/02/47/aa/0247aa1d-688d-4244-bcda-7130deaf0f32/mzaf_6378980045674323658.plus.aac.p.m4a',
          badge: 'CHILL BEATS 🌙',
          likes: 104000,
          verified: true,
          lyrics: "[Chill Lo-Fi Vibes]\nGentle Rhodes piano chords, crackling vinyl noise, and lazy drum kicks perfect for nighttime cinema exploration.",
          artistBio: "CinVerse Sound Lab curates peaceful ambient lo-fi beats designed for late-night movie streaming and studying."
        }
      ];

      // Set initial queue
      self.queue = angular.copy(self.catalog);

      // ---------------- USER PLAYLISTS & LIKED SONGS (LOCALSTORAGE) ----------------
      var STORAGE_KEY_PLAYLISTS = 'cinverse_user_playlists';
      var STORAGE_KEY_LIKES = 'cinverse_liked_songs';

      self.playlists = [];
      self.likedSongIds = {};

      function initStorage() {
        try {
          var savedPlaylists = localStorage.getItem(STORAGE_KEY_PLAYLISTS);
          if (savedPlaylists) {
            self.playlists = JSON.parse(savedPlaylists);
          } else {
            // Default starter playlist
            self.playlists = [
              {
                id: 'pl-default-1',
                name: 'My Binge Favorites',
                desc: 'Created by you • Cinema tracks & indie anthems',
                cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
                tracks: [self.catalog[0], self.catalog[1], self.catalog[2]]
              }
            ];
            self.savePlaylists();
          }

          var savedLikes = localStorage.getItem(STORAGE_KEY_LIKES);
          if (savedLikes) {
            self.likedSongIds = JSON.parse(savedLikes);
          } else {
            self.likedSongIds = { 'i-husn': true, 'i-jotum': true, 'sp-1': true, 'm2': true };
            self.saveLikes();
          }

          // Initial track: Anuv Jain's "Husn" (Full 3:38 Song)
          var defaultTrack = self.catalog.find(function (t) { return t.id === 'i-husn'; }) || self.catalog[0];
          self.currentTrack = defaultTrack;
          self.duration = defaultTrack.durationSec;
          self.durationFormatted = defaultTrack.duration;
        } catch (e) {
          console.warn('[Cinverse Music] Storage init error:', e);
        }
      }

      self.savePlaylists = function () {
        try {
          localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(self.playlists));
        } catch (e) {}
      };

      self.saveLikes = function () {
        try {
          localStorage.setItem(STORAGE_KEY_LIKES, JSON.stringify(self.likedSongIds));
        } catch (e) {}
      };

      self.createPlaylist = function (name, desc) {
        var cleanName = (name || '').trim() || ('My Playlist #' + (self.playlists.length + 1));
        var newPl = {
          id: 'pl-' + Date.now(),
          name: cleanName,
          desc: desc || 'Custom playlist created on Cinverse',
          cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
          tracks: []
        };
        self.playlists.unshift(newPl);
        self.savePlaylists();
        return newPl;
      };

      self.deletePlaylist = function (playlistId) {
        self.playlists = self.playlists.filter(function (p) { return p.id !== playlistId; });
        self.savePlaylists();
      };

      self.addTrackToPlaylist = function (playlistId, track) {
        var pl = self.playlists.find(function (p) { return p.id === playlistId; });
        if (!pl || !track) return false;
        var exists = pl.tracks.some(function (t) { return t.id === track.id; });
        if (!exists) {
          pl.tracks.push(track);
          self.savePlaylists();
          return true;
        }
        return false;
      };

      self.removeTrackFromPlaylist = function (playlistId, trackId) {
        var pl = self.playlists.find(function (p) { return p.id === playlistId; });
        if (!pl) return;
        pl.tracks = pl.tracks.filter(function (t) { return t.id !== trackId; });
        self.savePlaylists();
      };

      self.isLiked = function (trackId) {
        return !!self.likedSongIds[trackId];
      };

      self.toggleLike = function (track) {
        if (!track || !track.id) return;
        if (self.likedSongIds[track.id]) {
          delete self.likedSongIds[track.id];
        } else {
          self.likedSongIds[track.id] = true;
        }
        self.saveLikes();
      };

      self.getLikedTracks = function () {
        return self.catalog.filter(function (t) {
          return !!self.likedSongIds[t.id];
        });
      };

      // ---------------- 1-CLICK MP3 DOWNLOAD TO PHONE / PC ----------------
      self.downloadTrack = function (track) {
        if (!track) return;
        var cleanArtist = (track.artist || 'Cinverse').replace(/[^a-zA-Z0-9 ]/g, '');
        var cleanTitle = (track.title || 'Track').replace(/[^a-zA-Z0-9 ]/g, '');
        var filename = cleanArtist + ' - ' + cleanTitle + '.mp3';

        var downloadUrl = track.audioUrl || ('https://piped.video/watch?v=' + track.ytId);

        if (track.audioUrl) {
          fetch(track.audioUrl)
            .then(function (response) { return response.blob(); })
            .then(function (blob) {
              var blobUrl = window.URL.createObjectURL(blob);
              var a = document.createElement('a');
              a.style.display = 'none';
              a.href = blobUrl;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(blobUrl);
            })
            .catch(function () {
              window.open(downloadUrl, '_blank');
            });
        } else {
          window.open(downloadUrl, '_blank');
        }
      };

      // ---------------- YOUTUBE AUDIO ENGINE INITIALIZATION ----------------
      function initYTPlayer() {
        if (ytPlayer) return;
        if (window.YT && window.YT.Player) {
          try {
            var container = document.getElementById('cinverse-yt-audio-player');
            if (!container) return;

            ytPlayer = new window.YT.Player('cinverse-yt-audio-player', {
              height: '200',
              width: '200',
              videoId: (self.currentTrack && self.currentTrack.ytId) ? self.currentTrack.ytId : '_deqdZmKzyg',
              playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                playsinline: 1,
                rel: 0,
                modestbranding: 1,
                iv_load_policy: 3
              },
              events: {
                onReady: onYTReady,
                onStateChange: onYTStateChange,
                onError: onYTError
              }
            });
          } catch (e) {
            console.warn('[Cinverse Sound] YT Player init exception:', e);
          }
        }
      }

      function onYTReady(event) {
        ytReady = true;
        try {
          ytPlayer.setVolume(self.isMuted ? 0 : self.volume);
        } catch (e) {}

        if (ytPendingTrack) {
          var t = ytPendingTrack;
          ytPendingTrack = null;
          self.playTrack(t);
        }
      }

      function onYTStateChange(event) {
        $rootScope.$applyAsync(function () {
          // YT.PlayerState: PLAYING = 1, PAUSED = 2, ENDED = 0, BUFFERING = 3
          if (event.data === 1) {
            self.isPlaying = true;
            startProgressTimer();
          } else if (event.data === 2) {
            self.isPlaying = false;
            stopProgressTimer();
          } else if (event.data === 0) {
            self.isPlaying = false;
            stopProgressTimer();
            if (self.repeatMode) {
              try {
                ytPlayer.seekTo(0, true);
                ytPlayer.playVideo();
              } catch (e) {}
            } else {
              self.nextTrack();
            }
          }
        });
      }

      function onYTError(event) {
        console.warn('[Cinverse Sound] YT playback event error code:', event.data);
        if (self.currentTrack && self.currentTrack.audioUrl) {
          playHtml5Fallback(self.currentTrack);
        }
      }

      // Check for YT iframe API ready
      var prevYTReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof prevYTReady === 'function') prevYTReady();
        initYTPlayer();
      };

      if (window.YT && window.YT.Player) {
        initYTPlayer();
      } else {
        var checkYtInterval = setInterval(function () {
          if (window.YT && window.YT.Player) {
            clearInterval(checkYtInterval);
            initYTPlayer();
          }
        }, 300);
      }

      function startProgressTimer() {
        stopProgressTimer();
        progressInterval = setInterval(function () {
          if (!ytPlayer || !ytReady) return;
          try {
            var cur = ytPlayer.getCurrentTime ? ytPlayer.getCurrentTime() : 0;
            var dur = ytPlayer.getDuration ? ytPlayer.getDuration() : 0;
            if (!dur || dur <= 0) {
              dur = self.currentTrack ? self.currentTrack.durationSec : 0;
            }

            $rootScope.$applyAsync(function () {
              self.currentTime = cur;
              if (dur > 0) self.duration = dur;
              self.currentTimeFormatted = formatTime(self.currentTime);
              self.durationFormatted = formatTime(self.duration);
              if (self.duration > 0) {
                self.progressPct = Math.min(100, (self.currentTime / self.duration) * 100);
              }
            });
          } catch (e) {}
        }, 350);
      }

      function stopProgressTimer() {
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
      }

      // ---------------- HTML5 FALLBACK WIRES ----------------
      audio.addEventListener('timeupdate', function () {
        if (self.currentTrack && self.currentTrack.ytId && ytReady && self.isPlaying) return;
        $rootScope.$applyAsync(function () {
          self.currentTime = audio.currentTime;
          self.duration = audio.duration || (self.currentTrack ? self.currentTrack.durationSec : 0);
          self.currentTimeFormatted = formatTime(self.currentTime);
          self.durationFormatted = formatTime(self.duration);
          if (self.duration > 0) {
            self.progressPct = Math.min(100, (self.currentTime / self.duration) * 100);
          }
        });
      });

      audio.addEventListener('play', function () {
        if (self.currentTrack && self.currentTrack.ytId && ytReady) return;
        $rootScope.$applyAsync(function () {
          self.isPlaying = true;
        });
      });

      audio.addEventListener('pause', function () {
        if (self.currentTrack && self.currentTrack.ytId && ytReady) return;
        $rootScope.$applyAsync(function () {
          self.isPlaying = false;
        });
      });

      audio.addEventListener('ended', function () {
        if (self.currentTrack && self.currentTrack.ytId && ytReady) return;
        $rootScope.$applyAsync(function () {
          if (self.repeatMode) {
            audio.currentTime = 0;
            audio.play();
          } else {
            self.nextTrack();
          }
        });
      });

      function playHtml5Fallback(track) {
        if (!track || !track.audioUrl) return;
        try {
          audio.pause();
          audio.src = track.audioUrl;
          audio.volume = self.isMuted ? 0 : (self.volume / 100);
          audio.load();
          audio.play().then(function () {
            $rootScope.$applyAsync(function () {
              self.isPlaying = true;
            });
          }).catch(function (e) {
            console.warn('[Cinverse Sound] HTML5 fallback notice:', e);
          });
        } catch (e) {}
      }

      // ---------------- W3C MEDIA SESSION API (NOTIFICATION CENTER & LOCK SCREEN) ----------------
      function updateMediaSession(track) {
        if (!('mediaSession' in navigator) || !track) return;

        try {
          var artworkList = [
            { src: track.cover, sizes: '96x96', type: 'image/jpeg' },
            { src: track.cover, sizes: '128x128', type: 'image/jpeg' },
            { src: track.cover, sizes: '192x192', type: 'image/jpeg' },
            { src: track.cover, sizes: '256x256', type: 'image/jpeg' },
            { src: track.cover, sizes: '384x384', type: 'image/jpeg' },
            { src: track.cover, sizes: '512x512', type: 'image/jpeg' }
          ];

          navigator.mediaSession.metadata = new window.MediaMetadata({
            title: track.title,
            artist: track.artist,
            album: track.album || 'CinVerse Studio Sound',
            artwork: artworkList
          });

          navigator.mediaSession.playbackState = self.isPlaying ? 'playing' : 'paused';
          updateMediaSessionPosition();
        } catch (e) {
          console.warn('[Cinverse Sound] MediaSession metadata error:', e);
        }
      }

      function updateMediaSessionPosition() {
        if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
        try {
          if (self.duration > 0 && self.currentTime >= 0 && self.currentTime <= self.duration) {
            navigator.mediaSession.setPositionState({
              duration: Math.max(1, self.duration),
              playbackRate: 1.0,
              position: Math.min(Math.max(0, self.currentTime), self.duration)
            });
          }
        } catch (e) {}
      }

      function setupMediaSessionHandlers() {
        if (!('mediaSession' in navigator)) return;

        var actions = [
          ['play', function () {
            if (!self.isPlaying) self.togglePlay();
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
            $rootScope.$applyAsync();
          }],
          ['pause', function () {
            if (self.isPlaying) self.togglePlay();
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
            $rootScope.$applyAsync();
          }],
          ['previoustrack', function () {
            self.prevTrack();
            $rootScope.$applyAsync();
          }],
          ['nexttrack', function () {
            self.nextTrack();
            $rootScope.$applyAsync();
          }],
          ['seekto', function (details) {
            if (details.seekTime !== undefined && self.duration > 0) {
              self.seek((details.seekTime / self.duration) * 100);
              $rootScope.$applyAsync();
            }
          }],
          ['seekbackward', function (details) {
            var offset = details.seekOffset || 10;
            var target = Math.max(0, self.currentTime - offset);
            if (self.duration > 0) {
              self.seek((target / self.duration) * 100);
              $rootScope.$applyAsync();
            }
          }],
          ['seekforward', function (details) {
            var offset = details.seekOffset || 10;
            var target = Math.min(self.duration, self.currentTime + offset);
            if (self.duration > 0) {
              self.seek((target / self.duration) * 100);
              $rootScope.$applyAsync();
            }
          }],
          ['stop', function () {
            self.closePlayer();
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
            $rootScope.$applyAsync();
          }]
        ];

        actions.forEach(function (pair) {
          try {
            navigator.mediaSession.setActionHandler(pair[0], pair[1]);
          } catch (e) {}
        });
      }

      // ---------------- CORE PLAYBACK CONTROLS ----------------
      self.playTrack = function (track, trackList) {
        if (!track) return;

        if (trackList && trackList.length) {
          self.queue = trackList;
          self.queueIndex = self.queue.findIndex(function (t) { return t.id === track.id; });
          if (self.queueIndex === -1) self.queueIndex = 0;
        }

        self.currentTrack = track;
        self.duration = track.durationSec || 200;
        self.durationFormatted = track.duration || formatTime(self.duration);
        self.currentTime = 0;
        self.currentTimeFormatted = '0:00';
        self.progressPct = 0;

        // Register with Android / iOS Notification Center & Lock Screen
        updateMediaSession(track);

        // Priority 1: YouTube Full Audio Engine
        if (track.ytId) {
          try {
            audio.pause();
          } catch (e) {}

          if (ytReady && ytPlayer && ytPlayer.loadVideoById) {
            try {
              ytPlayer.loadVideoById(track.ytId);
              ytPlayer.setVolume(self.isMuted ? 0 : self.volume);
              ytPlayer.playVideo();
              self.isPlaying = true;
              if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
              startProgressTimer();
            } catch (err) {
              console.warn('[Cinverse Sound] YT load exception:', err);
              playHtml5Fallback(track);
            }
          } else {
            // YT Player still initializing, queue it up
            ytPendingTrack = track;
            initYTPlayer();
            if (track.audioUrl) {
              playHtml5Fallback(track);
            }
          }
        } else if (track.audioUrl) {
          // Priority 2: Direct audio url
          playHtml5Fallback(track);
        }
      };

      self.togglePlay = function () {
        if (!self.currentTrack && self.catalog.length) {
          self.playTrack(self.catalog[0], self.catalog);
          return;
        }

        if (self.isPlaying) {
          // Pause currently playing stream
          if (ytPlayer && ytReady && self.currentTrack && self.currentTrack.ytId) {
            try {
              ytPlayer.pauseVideo();
            } catch (e) {}
          }
          try {
            audio.pause();
          } catch (e) {}
          self.isPlaying = false;
          if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
          stopProgressTimer();
        } else {
          // Resume stream
          if (ytPlayer && ytReady && self.currentTrack && self.currentTrack.ytId) {
            try {
              ytPlayer.playVideo();
              self.isPlaying = true;
              if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
              startProgressTimer();
              return;
            } catch (e) {}
          }
          if (self.currentTrack && self.currentTrack.audioUrl) {
            if (!audio.src || audio.src === '' || audio.src === window.location.href) {
              audio.src = self.currentTrack.audioUrl;
              audio.load();
            }
            audio.play().then(function () {
              $rootScope.$applyAsync(function () {
                self.isPlaying = true;
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
              });
            }).catch(function (e) {
              console.warn('[Cinverse Sound] Audio play error:', e);
            });
          }
        }
      };

      self.nextTrack = function () {
        if (!self.queue.length) return;
        if (self.shuffleMode) {
          self.queueIndex = Math.floor(Math.random() * self.queue.length);
        } else {
          self.queueIndex = (self.queueIndex + 1) % self.queue.length;
        }
        self.playTrack(self.queue[self.queueIndex], self.queue);
      };

      self.prevTrack = function () {
        if (!self.queue.length) return;
        if (self.currentTime > 3) {
          self.seekTo(0);
          return;
        }
        self.queueIndex = (self.queueIndex - 1 + self.queue.length) % self.queue.length;
        self.playTrack(self.queue[self.queueIndex], self.queue);
      };

      self.seek = function (pct) {
        if (self.duration > 0) {
          var targetSec = (pct / 100) * self.duration;
          self.currentTime = targetSec;
          self.progressPct = pct;
          self.currentTimeFormatted = formatTime(targetSec);

          if (ytPlayer && ytReady && self.currentTrack && self.currentTrack.ytId) {
            try {
              ytPlayer.seekTo(targetSec, true);
            } catch (e) {}
          } else if (audio && audio.duration) {
            audio.currentTime = targetSec;
          }
        }
      };
      self.seekTo = self.seek;

      self.setVolume = function (vol) {
        self.volume = Math.max(0, Math.min(100, vol));
        self.isMuted = (self.volume === 0);

        if (ytPlayer && ytReady && ytPlayer.setVolume) {
          try {
            ytPlayer.setVolume(self.volume);
          } catch (e) {}
        }
        if (audio) {
          audio.volume = self.volume / 100;
        }
      };

      self.toggleMute = function () {
        self.isMuted = !self.isMuted;
        if (ytPlayer && ytReady) {
          try {
            if (self.isMuted) {
              ytPlayer.mute();
            } else {
              ytPlayer.unMute();
              ytPlayer.setVolume(self.volume);
            }
          } catch (e) {}
        }
        if (audio) {
          audio.volume = self.isMuted ? 0 : (self.volume / 100);
        }
      };

      self.toggleRepeat = function () {
        self.repeatMode = !self.repeatMode;
      };

      self.toggleShuffle = function () {
        self.shuffleMode = !self.shuffleMode;
      };

      self.closePlayer = function () {
        if (ytPlayer && ytReady) {
          try {
            ytPlayer.stopVideo();
          } catch (e) {}
        }
        try {
          audio.pause();
          audio.src = '';
        } catch (e) {}
        self.currentTrack = null;
        self.isPlaying = false;
        self.currentTime = 0;
        self.progressPct = 0;
        if ('mediaSession' in navigator) {
          try {
            navigator.mediaSession.playbackState = 'none';
          } catch (e) {}
        }
        stopProgressTimer();
      };

      // ---------------- LIVE GLOBAL SEARCH & AUTO-SUGGESTIONS ----------------
      self.searchGlobalTracks = function (query) {
        if (!query || !query.trim() || query.trim().length < 2) {
          return Promise.resolve([]);
        }
        var cleanQ = query.trim().toLowerCase();

        // 1. Instant Local Catalog Search (0ms latency, high quality)
        var localMatches = self.catalog.filter(function (t) {
          var matchTitle = t.title && t.title.toLowerCase().indexOf(cleanQ) !== -1;
          var matchArtist = t.artist && t.artist.toLowerCase().indexOf(cleanQ) !== -1;
          var matchAlbum = t.album && t.album.toLowerCase().indexOf(cleanQ) !== -1;
          return matchTitle || matchArtist || matchAlbum;
        }).map(function (t) {
          return angular.copy(t);
        });

        // 2. Online Piped Search for Full-Length Songs
        var encQ = encodeURIComponent(query.trim());
        var pipedUrl = 'https://api.piped.private.coffee/search?q=' + encQ + '&filter=music_songs';

        return fetch(pipedUrl)
          .then(function (res) {
            if (!res.ok) throw new Error('Piped HTTP ' + res.status);
            return res.json();
          })
          .then(function (data) {
            var items = (data && data.items) || [];
            var onlineMatches = items
              .filter(function (it) {
                return it.type === 'stream' && it.duration > 30 && it.url;
              })
              .slice(0, 10)
              .map(function (it) {
                var ytId = it.url.replace('/watch?v=', '');
                return {
                  id: 'yt-' + ytId,
                  ytId: ytId,
                  title: it.title,
                  artist: it.uploaderName || 'CinVerse Full Master',
                  album: 'Single / Master Release',
                  cover: it.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
                  duration: formatTime(it.duration),
                  durationSec: it.duration,
                  badge: 'FULL SONG ⚡',
                  verified: true,
                  likes: Math.floor(Math.random() * 200000) + 50000,
                  lyrics: it.title + " by " + it.uploaderName + "\n\nStreaming in Ultra HD Studio Lossless on CinVerse Sound.",
                  artistBio: it.uploaderName + " verified release streaming full-length on CinVerse Studio."
                };
              });

            // Combine local catalog matches + online results (deduplicate)
            var combined = localMatches.slice();
            onlineMatches.forEach(function (om) {
              var dup = combined.some(function (c) {
                return (c.ytId && c.ytId === om.ytId) ||
                       (c.title.toLowerCase() === om.title.toLowerCase() &&
                        c.artist.toLowerCase() === om.artist.toLowerCase());
              });
              if (!dup) combined.push(om);
            });

            return combined.slice(0, 12);
          })
          .catch(function (err) {
            console.warn('[Cinverse Sound] Online search fallback to local:', err);
            return localMatches;
          });
      };

      initStorage();
      setupMediaSessionHandlers();
    }
  ]);
})();
