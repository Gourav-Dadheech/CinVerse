import sys
import re
import urllib.request
import urllib.error
from http.server import HTTPServer, SimpleHTTPRequestHandler

class CinVerseGameServer(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enforce cross-origin isolation headers for WebAssembly multi-threading & WebGPU
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "credentialless")
        self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_GET(self):
        clean_path = self.path.split('?')[0]

        # 1. Ad-Free GTA V WebAssembly Engine Proxy Endpoint
        if clean_path in ('/gta-web', '/gta-web/'):
            try:
                upstream_url = "https://fiveplay.lol/" + (('?' + self.path.split('?')[1]) if '?' in self.path else '')
                req = urllib.request.Request(upstream_url, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                })
                with urllib.request.urlopen(req, timeout=15) as resp:
                    raw_html = resp.read().decode('utf-8', errors='ignore')

                # Strip Monetag and popup ad networks completely
                clean_html = re.sub(r'<meta\s+name=["\']monetag["\'][^>]*>', '', raw_html, flags=re.I)
                clean_html = re.sub(r'<script[^>]*quge5\.com[^>]*>.*?</script>', '', clean_html, flags=re.I | re.DOTALL)
                clean_html = re.sub(r'<script[^>]*alwingulla\.com[^>]*>.*?</script>', '', clean_html, flags=re.I | re.DOTALL)
                clean_html = re.sub(r'<script>[^<]*alwingulla\.com[^<]*</script>', '', clean_html, flags=re.I | re.DOTALL)

                # Inject strict anti-popup script at top of <head>
                anti_ad_script = (
                    '<script>'
                    'window.open = function() { console.warn("[CinVerse Anti-Ad] Blocked popup"); return null; };'
                    'window.alert = function() { return false; };'
                    'window.monetag = null;'
                    '</script>'
                )
                if '<head>' in clean_html:
                    clean_html = clean_html.replace('<head>', '<head>' + anti_ad_script, 1)
                else:
                    clean_html = anti_ad_script + clean_html

                data = clean_html.encode('utf-8')
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return
            except Exception as e:
                print(f"[GTA Proxy Error] Failed to fetch upstream fiveplay: {e}")
                self.send_error(502, f"Bad Gateway: Could not reach GTA V engine host ({e})")
                return

        # 2. GTA V Game Data / Binary Stream Proxy (/b/...)
        if clean_path.startswith('/b/'):
            try:
                upstream_url = "https://fiveplay.lol" + self.path
                req = urllib.request.Request(upstream_url, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
                })
                with urllib.request.urlopen(req, timeout=30) as resp:
                    content_type = resp.headers.get('Content-Type', 'application/octet-stream')
                    content_len = resp.headers.get('Content-Length')

                    self.send_response(resp.status)
                    self.send_header("Content-Type", content_type)
                    if content_len:
                        self.send_header("Content-Length", content_len)
                    self.send_header("Cache-Control", "public, max-age=31536000, immutable")
                    self.end_headers()

                    # Stream data chunks
                    while True:
                        chunk = resp.read(65536)
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                return
            except Exception as e:
                print(f"[GTA Data Error] Failed to stream asset {clean_path}: {e}")
                self.send_error(502, f"Bad Gateway streaming game asset ({e})")
                return

        # 3. Game Log Endpoint (ignore client logging)
        if clean_path == '/log':
            self.send_response(204)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return

        # 4. Standard CinVerse Static File Handler
        super().do_GET()

    def do_POST(self):
        # Ignore diagnostic POST logs
        if self.path.split('?')[0] == '/log':
            self.send_response(204)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        super().do_POST()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = HTTPServer(("0.0.0.0", port), CinVerseGameServer)
    print(f"CinVerse Gaming Dev Server running on http://localhost:{port} (Ad-Free GTA Engine Active)")
    server.serve_forever()
