"""Local preview server for Lotus. Sends no-cache headers so edits show up
immediately on reload. Not used in production (GitHub Pages serves the files)."""
import http.server

PORT = 8000


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Chrome refuses to register a service worker whose script is served
        # with `no-store`, so that one file gets `no-cache` instead: still
        # revalidated on every load, but storable.
        if self.path.split("?")[0].endswith("service-worker.js"):
            self.send_header("Cache-Control", "no-cache")
        else:
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        super().end_headers()


# Threaded: a single-threaded server blocks concurrent requests, which makes
# service-worker script fetches fail intermittently with "unknown error".
with http.server.ThreadingHTTPServer(("", PORT), Handler) as httpd:
    print(f"Lotus preview on http://localhost:{PORT}")
    httpd.serve_forever()
