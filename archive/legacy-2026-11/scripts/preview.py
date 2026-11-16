#!/usr/bin/env python3
"""Preview Gary-UI locally with Python only; no Session or Agent runtime required."""

from __future__ import annotations

import argparse
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PORT = 4173
DEMO_ENTRY = "/examples/demos/index.html"


class PreviewHandler(SimpleHTTPRequestHandler):
    """Read-only repository preview, including the prebuilt Demo assets."""

    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
    }

    def guess_type(self, path: str) -> str:
        content_type = super().guess_type(path)
        if content_type.startswith("text/") or content_type in {
            "application/json", "image/svg+xml"
        }:
            return content_type + "; charset=utf-8"
        return content_type

    def send_head(self):
        request = urlsplit(self.path)
        if request.path == "/":
            destination = DEMO_ENTRY
            if request.query:
                destination += "?" + request.query
            self.send_response(HTTPStatus.TEMPORARY_REDIRECT)
            self.send_header("Location", destination)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None

        # Do not expose dotfiles, directory listings, or symlinks outside the clone.
        parts = unquote(request.path).replace("\\", "/").split("/")
        target = Path(self.translate_path(self.path)).resolve()
        if target.is_dir():
            for name in ("index.html", "index.htm"):
                if (target / name).is_file():
                    target = (target / name).resolve()
                    break
        try:
            target.relative_to(Path(self.directory).resolve())
        except ValueError:
            self.send_error(HTTPStatus.NOT_FOUND)
            return None
        if any(part.startswith(".") for part in parts if part):
            self.send_error(HTTPStatus.NOT_FOUND)
            return None
        return super().send_head()

    def list_directory(self, path: str):
        self.send_error(HTTPStatus.NOT_FOUND)
        return None

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def create_server(port: int = DEFAULT_PORT, *, root: Path = ROOT) -> ThreadingHTTPServer:
    handler = partial(PreviewHandler, directory=str(root.resolve()))
    return ThreadingHTTPServer(("127.0.0.1", port), handler)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("--port must be between 1 and 65535")
    try:
        server = create_server(args.port)
    except OSError as error:
        parser.exit(1, f"Cannot start preview on 127.0.0.1:{args.port}: {error}\n")
    print(f"Gary-UI Demo: http://127.0.0.1:{args.port}/", flush=True)
    print(f"Gary-UI Portal: http://127.0.0.1:{args.port}/portal/", flush=True)
    print("Static preview only. Press Ctrl+C to stop.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
