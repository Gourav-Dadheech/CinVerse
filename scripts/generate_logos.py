import os

os.makedirs('assets/logos', exist_ok=True)

# 1. Netflix: Official Red Wordmark
netflix_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 276.7" width="100%" height="100%">
  <path fill="#E50914" d="M140.803 258.904c-15.383-7.976-72.15-37.811-85.347-45.167L55.456 0h42.553v205.811l42.794 22.845v30.248zm120.301-3.662l-42.312-22.37V0h117.846v38.93H261.104v65.617h67.75v38.932h-67.75v73.238l-2.43 1.957-.42.368h4.551zm182.261-2.937c-17.108-9.043-43.08-22.775-43.08-22.775V38.93h-44.508V0h133.524v38.93h-44.509v171.187l-1.427 1.183zm75.762 1.468V0h42.552v206.883l44.02 23.468v30.249c-15.141-8.067-73.614-38.497-86.572-45.296zm170.838 2.937V0h42.553v256.71h-42.553zm163.665-2.937l-38.647-73.972-38.89 71.035c-11.233-5.869-27.106-14.184-40.065-20.787l58.941-102.477L521.84 0h44.996l36.944 71.28L640.48 0h44.753l-50.623 93.916 57.724 139.734c-12.716 6.603-27.838 14.428-38.604 20.124z"/>
</svg>'''
with open('assets/logos/netflix.svg', 'w', encoding='utf-8') as f:
    f.write(netflix_svg)

# 2. Disney+: Official Disney + Arc + Plus
disney_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 150" width="100%" height="100%">
  <defs>
    <linearGradient id="arcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0063E5"/>
      <stop offset="60%" stop-color="#00d2fe"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <!-- Curved Disney Arc -->
  <path d="M 30 120 C 120 18, 250 22, 335 80 C 240 40, 130 45, 50 128 Z" fill="url(#arcGrad)" opacity="0.95"/>
  <!-- Stylized Disney Typography -->
  <text x="35" y="112" font-family="'Brush Script MT', 'Palatino Linotype', 'Segoe Script', cursive, serif" font-size="82" font-weight="bold" fill="#ffffff" letter-spacing="1">Disney</text>
  <!-- Cyan Glowing Plus Symbol -->
  <g transform="translate(290, 52)">
    <path d="M 18 0 L 26 0 L 26 18 L 44 18 L 44 26 L 26 26 L 26 44 L 18 44 L 18 26 L 0 26 L 0 18 L 18 18 Z" fill="#00d2fe"/>
    <polygon points="40,10 43,15 48,16 43,17 40,22 37,17 32,16 37,15" fill="#ffffff"/>
  </g>
</svg>'''
with open('assets/logos/disney.svg', 'w', encoding='utf-8') as f:
    f.write(disney_svg)

# 3. HBO Max: Bold HBO + Italic Gradient MAX
hbomax_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 100" width="100%" height="100%">
  <defs>
    <linearGradient id="maxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9333ea"/>
      <stop offset="60%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
  </defs>
  <!-- HBO -->
  <g fill="#ffffff">
    <rect x="15" y="18" width="17" height="64" rx="2"/>
    <rect x="58" y="18" width="17" height="64" rx="2"/>
    <rect x="28" y="42" width="34" height="16"/>
    <path d="M 88 18 L 122 18 C 137 18, 145 25, 145 37 C 145 44, 140 48, 132 50 C 142 53, 147 58, 147 67 C 147 79, 137 82, 122 82 L 88 82 Z M 105 33 L 105 43 L 118 43 C 124 43, 128 41, 128 38 C 128 35, 124 33, 118 33 Z M 105 57 L 105 67 L 120 67 C 126 67, 130 65, 130 62 C 130 59, 126 57, 120 57 Z"/>
    <circle cx="180" cy="50" r="32" fill="none" stroke="#ffffff" stroke-width="16"/>
    <circle cx="180" cy="50" r="10" fill="#ffffff"/>
  </g>
  <text x="228" y="75" font-family="'Outfit', 'Arial Black', sans-serif" font-size="64" font-weight="900" font-style="italic" fill="url(#maxGrad)" letter-spacing="1">max</text>
</svg>'''
with open('assets/logos/hbomax.svg', 'w', encoding='utf-8') as f:
    f.write(hbomax_svg)

# 4. Amazon Prime Video: White 'prime' + 'video' + Cyan Smile
prime_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 100" width="100%" height="100%">
  <text x="20" y="60" font-family="'Outfit', 'Segoe UI', sans-serif" font-size="54" font-weight="800" fill="#ffffff" letter-spacing="-1">prime</text>
  <text x=\"165\" y=\"60\" font-family=\"'Outfit', 'Segoe UI', sans-serif\" font-size=\"48\" font-weight=\"400\" fill=\"#ffffff\" letter-spacing=\"-0.5\">video</text>
  <path d=\"M 30 76 C 80 96, 185 94, 238 72\" fill=\"none\" stroke=\"#00A8E1\" stroke-width=\"6\" stroke-linecap=\"round\"/>
  <path d=\"M 226 64 L 248 72 L 236 86 Z\" fill=\"#00A8E1\"/>
</svg>'''
with open('assets/logos/prime.svg', 'w', encoding='utf-8') as f:
    f.write(prime_svg)

# 5. Apple TV+: Apple icon + tv+
appletv_svg = '''<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 260 100\" width=\"100%\" height=\"100%\">
  <g fill=\"#ffffff\" transform=\"translate(25, 20) scale(1.6)\">
    <path d=\"M15.2 12.9c0-3.3 2.7-5 2.8-5.1-1.5-2.2-3.9-2.5-4.7-2.6-2-.2-3.9 1.2-4.9 1.2-1 0-2.6-1.2-4.2-1.2-2.2 0-4.2 1.3-5.3 3.2-2.3 4-0.6 9.9 1.6 13.1 1.1 1.6 2.4 3.3 4.1 3.2 1.7-.1 2.3-1.1 4.3-1.1 2 0 2.5 1.1 4.3 1.1 1.8 0 2.9-1.6 4-3.2 1.3-1.9 1.8-3.7 1.8-3.8-.1 0-3.4-1.3-3.4-5.3zM12.9 3.6c.9-1.1 1.5-2.6 1.3-4.1-1.3.1-2.8.9-3.7 1.9-.8.9-1.5 2.4-1.3 3.9 1.4.1 2.8-.7 3.7-1.7z\"/>
  </g>
  <text x=\"80\" y=\"68\" font-family=\"'Outfit', -apple-system, sans-serif\" font-size=\"56\" font-weight=\"700\" fill=\"#ffffff\" letter-spacing=\"1\">tv+</text>
</svg>'''
with open('assets/logos/appletv.svg', 'w', encoding='utf-8') as f:
    f.write(appletv_svg)

# 6. JioCinema: Jio Badge + Cinema text
jiocinema_svg = '''<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 340 100\" width=\"100%\" height=\"100%\">
  <defs>
    <linearGradient id=\"jioGrad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">
      <stop offset=\"0%\" stop-color=\"#ec4899\"/>
      <stop offset=\"100%\" stop-color=\"#be185d\"/>
    </linearGradient>
  </defs>
  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"url(#jioGrad)\"/>
  <text x=\"50\" y=\"62\" font-family=\"'Outfit', sans-serif\" font-size=\"34\" font-weight=\"900\" fill=\"#ffffff\" text-anchor=\"middle\">Jio</text>
  <text x=\"102\" y=\"66\" font-family=\"'Outfit', sans-serif\" font-size=\"48\" font-weight=\"800\" fill=\"#ffffff\" letter-spacing=\"0.5\">Cinema</text>
</svg>'''
with open('assets/logos/jiocinema.svg', 'w', encoding='utf-8') as f:
    f.write(jiocinema_svg)

# Studios: Marvel, DC, Star Wars, Pixar, Wizarding World, Anime
marvel_svg = '''<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 90\" width=\"100%\" height=\"100%\">
  <rect x=\"5\" y=\"5\" width=\"290\" height=\"80\" rx=\"6\" fill=\"#E50914\"/>
  <text x=\"150\" y=\"68\" font-family=\"'Impact', 'Arial Black', sans-serif\" font-size=\"74\" font-weight=\"900\" fill=\"#ffffff\" text-anchor=\"middle\" letter-spacing=\"4\">MARVEL</text>
</svg>'''
with open('assets/logos/marvel.svg', 'w', encoding='utf-8') as f:
    f.write(marvel_svg)

dc_svg = '''<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 110\" width=\"100%\" height=\"100%\">
  <circle cx=\"100\" cy=\"45\" r=\"36\" fill=\"none\" stroke=\"#0074E4\" stroke-width=\"7\"/>
  <text x=\"100\" y=\"59\" font-family=\"'Outfit', 'Arial Black', sans-serif\" font-size=\"42\" font-weight=\"900\" fill=\"#0074E4\" text-anchor=\"middle\" letter-spacing=\"1\">DC</text>
  <text x=\"100\" y=\"102\" font-family=\"'Outfit', sans-serif\" font-size=\"18\" font-weight=\"800\" fill=\"#60a5fa\" text-anchor=\"middle\" letter-spacing=\"6\">STUDIOS</text>
</svg>'''
with open('assets/logos/dc.svg', 'w', encoding='utf-8') as f:
    f.write(dc_svg)

starwars_svg = '''<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 120\" width=\"100%\" height=\"100%\">
  <text x=\"150\" y=\"52\" font-family=\"'Impact', 'Arial Black', sans-serif\" font-size=\"56\" font-weight=\"900\" fill=\"transparent\" stroke=\"#facc15\" stroke-width=\"3\" text-anchor=\"middle\" letter-spacing=\"8\">STAR</text>
  <text x=\"150\" y=\"108\" font-family=\"'Impact', 'Arial Black', sans-serif\" font-size=\"56\" font-weight=\"900\" fill=\"transparent\" stroke=\"#facc15\" stroke-width=\"3\" text-anchor=\"middle\" letter-spacing=\"8\">WARS</text>
</svg>'''
with open('assets/logos/starwars.svg', 'w', encoding='utf-8') as f:
    f.write(starwars_svg)

pixar_svg = '''<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 340 90\" width=\"100%\" height=\"100%\">
  <text x=\"95\" y=\"58\" font-family=\"'Brush Script MT', 'Palatino Linotype', cursive, serif\" font-size=\"56\" font-weight=\"bold\" fill=\"#ffffff\" text-anchor=\"middle\">Disney</text>
  <circle cx=\"185\" cy=\"48\" r=\"6\" fill=\"#2dd4bf\"/>
  <text x=\"260\" y=\"58\" font-family=\"'Outfit', 'Arial Black', sans-serif\" font-size=\"48\" font-weight=\"900\" fill=\"#ffffff\" text-anchor=\"middle\" letter-spacing=\"4\">PIXAR</text>
</svg>'''
with open('assets/logos/pixar.svg', 'w', encoding='utf-8') as f:
    f.write(pixar_svg)

wizarding_svg = '''<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 90\" width=\"100%\" height=\"100%\">
  <text x=\"160\" y=\"42\" font-family=\"'Cinzel', 'Georgia', serif\" font-size=\"36\" font-weight=\"800\" fill=\"#c084fc\" text-anchor=\"middle\" letter-spacing=\"4\">WIZARDING</text>
  <text x=\"160\" y=\"78\" font-family=\"'Cinzel', 'Georgia', serif\" font-size=\"30\" font-weight=\"700\" fill=\"#e9d5ff\" text-anchor=\"middle\" letter-spacing=\"7\">WORLD</text>
</svg>'''
with open('assets/logos/wizarding.svg', 'w', encoding='utf-8') as f:
    f.write(wizarding_svg)

anime_svg = '''<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 90\" width=\"100%\" height=\"100%\">
  <text x=\"150\" y=\"46\" font-family=\"'Outfit', sans-serif\" font-size=\"44\" font-weight=\"900\" fill=\"#f43f5e\" text-anchor=\"middle\" letter-spacing=\"6\">ANIME</text>
  <text x=\"150\" y=\"78\" font-family=\"'Outfit', sans-serif\" font-size=\"22\" font-weight=\"800\" fill=\"#fda4af\" text-anchor=\"middle\" letter-spacing=\"5\">UNIVERSE</text>
</svg>'''
with open('assets/logos/anime.svg', 'w', encoding='utf-8') as f:
    f.write(anime_svg)

print('Generated all 12 SVG logo files in assets/logos/ successfully!')
