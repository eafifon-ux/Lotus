"""Local preview server for Lotus. Sends no-cache headers so edits show up
immediately on reload. Not used in production (GitHub Pages serves the files)."""
import http.server
import socketserver

PORT = 8000


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Lotus preview on http://localhost:{PORT}")
    httpd.serve_forever()
