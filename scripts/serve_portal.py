"""Serve one Gary-UI loopback surface: Portal governance or co-design Session."""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import tempfile
import time
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

from review_contract import ReviewContractError, new_envelope, normalize_decision
from session_contract import SessionContractError
from session_store import (
    DEFAULT_SESSIONS_ROOT,
    SessionAuthenticationError,
    SessionConflictError,
    SessionCorruptError,
    SessionNotFoundError,
    SessionStore,
    SessionStoreError,
)


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PORT = 8878
MAX_BODY_BYTES = 16 * 1024
MAX_SESSION_BODY_BYTES = 64 * 1024
HANDOFF_HEADER = "X-Gary-Review-Bridge"
SESSION_TOKEN_HEADER = "X-Gary-Session-Token"
ARTIFACT_COOKIE = "Gary-Artifact-Session"
EVIDENCE_COOKIE = "Gary-Evidence-Session"
REVIEW_FILE = ROOT / "decisions" / "review-latest.json"
SESSION_STORE = SessionStore(DEFAULT_SESSIONS_ROOT)
SESSION_ROUTE = re.compile(r"^/api/sessions/([a-z0-9][a-z0-9-]{7,63})$")
EVENTS_ROUTE = re.compile(
    r"^/api/sessions/([a-z0-9][a-z0-9-]{7,63})/events$"
)
FEEDBACK_ROUTE = re.compile(
    r"^/api/sessions/([a-z0-9][a-z0-9-]{7,63})/feedback$"
)
ARTIFACT_ROUTE = re.compile(
    r"^/api/sessions/([a-z0-9][a-z0-9-]{7,63})/"
    r"artifacts/([1-9][0-9]*)/([a-z0-9][a-z0-9-]{0,63})/index\.html$"
)
EVIDENCE_ROUTE = re.compile(
    r"^/api/sessions/([a-z0-9][a-z0-9-]{7,63})/"
    r"evidence/([a-z0-9][a-z0-9_-]{2,95})/"
    r"([A-Za-z0-9][A-Za-z0-9._-]{0,159})$"
)
PREVIEW_BRIDGE = '<script src="/session/preview-bridge.js"></script>'
SURFACES = {"portal", "session"}
TEST_ROOT_ENV = "GARY_UI_ALLOW_TEST_SESSION_ROOT"


def write_json_atomic(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    encoded = (json.dumps(payload, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    with tempfile.NamedTemporaryFile(
        mode="wb",
        dir=path.parent,
        prefix=f".{path.name}.",
        suffix=".tmp",
        delete=False,
    ) as handle:
        temporary = Path(handle.name)
        handle.write(encoded)
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def _same_path(left: Path, right: Path) -> bool:
    return os.path.normcase(str(left.resolve())) == os.path.normcase(str(right.resolve()))


def resolve_sessions_root(requested: Path) -> Path:
    """Reject command-line session-root overrides outside explicit test runs."""

    resolved = requested.expanduser().resolve()
    if _same_path(resolved, DEFAULT_SESSIONS_ROOT):
        return resolved
    if os.environ.get(TEST_ROOT_ENV) == "1":
        return resolved
    raise ValueError(
        f"Session root 固定为 {DEFAULT_SESSIONS_ROOT}; "
        f"测试 override 必须显式设置 {TEST_ROOT_ENV}=1"
    )


class GaryPortalHandler(SimpleHTTPRequestHandler):
    server_version = "GaryPortal/2.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format: str, *args: object) -> None:
        sanitized = tuple(
            re.sub(r"([?&]token=)[^&\s]+", r"\1<redacted>", str(item))
            for item in args
        )
        super().log_message(format, *sanitized)

    @property
    def _surface(self) -> str:
        surface = getattr(self.server, "surface", "portal")
        return surface if surface in SURFACES else "invalid"

    @property
    def _session_store(self) -> SessionStore:
        return getattr(self.server, "session_store", SESSION_STORE)

    @property
    def _allow_examples(self) -> bool:
        return bool(getattr(self.server, "allow_co_design_examples", False))

    def _send_json(
        self,
        status: HTTPStatus,
        payload: dict,
        *,
        headers: tuple[tuple[str, str], ...] = (),
    ) -> None:
        body = (json.dumps(payload, ensure_ascii=False) + "\n").encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for name, value in headers:
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def _not_found(self) -> None:
        self._send_json(HTTPStatus.NOT_FOUND, {"error": "unknown endpoint"})

    def _request_is_local(self) -> bool:
        return self.client_address[0] in {"127.0.0.1", "::1"}

    def _origin_is_exact_server(self, *, required: bool = False) -> bool:
        origin = self.headers.get("Origin")
        if not origin:
            return not required
        host = self.headers.get("Host")
        if not host or origin != f"http://{host}":
            return False
        parsed = urlsplit(origin)
        return (
            parsed.scheme == "http"
            and parsed.hostname in {"127.0.0.1", "localhost", "::1"}
            and (parsed.port or 80) == self.server.server_port
        )

    def _query(self) -> dict[str, list[str]]:
        return parse_qs(urlsplit(self.path).query, keep_blank_values=True)

    def _query_value(
        self,
        name: str,
        *,
        allowed: set[str],
        required: bool = True,
    ) -> str | None:
        query = self._query()
        extra = set(query) - allowed
        if extra:
            raise SessionStoreError(
                f"请求包含未知 query 参数: {', '.join(sorted(extra))}"
            )
        values = query.get(name)
        if not values:
            if required:
                raise SessionAuthenticationError(f"缺少 {name}")
            return None
        if len(values) != 1 or not values[0]:
            raise SessionAuthenticationError(f"{name} 无效")
        return values[0]

    def _authenticate_query(
        self,
        session_id: str,
        *,
        allowed: set[str],
    ) -> tuple[str, int]:
        token = self._query_value("token", allowed=allowed)
        assert token is not None
        generation = self._session_store.authenticate(session_id, token)
        return token, generation

    def _cookie_value(self, name: str) -> str | None:
        raw = self.headers.get("Cookie")
        if not raw:
            return None
        cookie = SimpleCookie()
        try:
            cookie.load(raw)
        except Exception:
            return None
        morsel = cookie.get(name)
        return morsel.value if morsel else None

    def _authenticate_cookie(self, session_id: str, name: str) -> None:
        if urlsplit(self.path).query or self.headers.get(SESSION_TOKEN_HEADER):
            raise SessionAuthenticationError(
                "受保护资源只接受路径限定的 HttpOnly Cookie"
            )
        token = self._cookie_value(name)
        if not token:
            raise SessionAuthenticationError(f"缺少 {name} Cookie")
        self._session_store.authenticate(session_id, token)

    @staticmethod
    def _session_cookie(name: str, token: str, path: str) -> str:
        cookie = SimpleCookie()
        cookie[name] = token
        cookie[name]["path"] = path
        cookie[name]["httponly"] = True
        cookie[name]["samesite"] = "Strict"
        return cookie[name].OutputString()

    def _send_session_error(self, error: Exception) -> None:
        if isinstance(error, SessionAuthenticationError):
            status = HTTPStatus.FORBIDDEN
        elif isinstance(error, SessionNotFoundError):
            status = HTTPStatus.NOT_FOUND
        elif isinstance(error, (SessionConflictError, SessionCorruptError)):
            status = HTTPStatus.CONFLICT
        elif isinstance(error, (SessionContractError, SessionStoreError)):
            status = HTTPStatus.BAD_REQUEST
        else:
            status = HTTPStatus.INTERNAL_SERVER_ERROR
        self._send_json(
            status,
            {
                "status": "fail",
                "error": str(error),
                "errorType": type(error).__name__,
            },
        )

    def _read_existing_review(self) -> dict | None:
        if not REVIEW_FILE.exists():
            return None
        try:
            return json.loads(REVIEW_FILE.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return None

    def _redirect(self, location: str) -> None:
        self.send_response(HTTPStatus.PERMANENT_REDIRECT)
        self.send_header("Location", location)
        self.send_header("Content-Length", "0")
        self.end_headers()

    @staticmethod
    def _safe_child(root: Path, raw_relative: str) -> Path | None:
        try:
            candidate = (root / unquote(raw_relative)).resolve()
            candidate.relative_to(root.resolve())
        except (OSError, ValueError):
            return None
        return candidate if candidate.is_file() else None

    def _serve_file(
        self,
        path: Path,
        *,
        cache_control: str = "no-store",
        content_type: str | None = None,
    ) -> None:
        try:
            body = path.read_bytes()
        except OSError:
            self._not_found()
            return
        guessed = content_type or mimetypes.guess_type(path.name)[0]
        self.send_response(HTTPStatus.OK)
        self.send_header(
            "Content-Type",
            f"{guessed}; charset=utf-8"
            if guessed and (
                guessed.startswith("text/")
                or guessed in {"application/json", "application/javascript"}
            )
            else (guessed or "application/octet-stream"),
        )
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", cache_control)
        self.end_headers()
        self.wfile.write(body)

    def _serve_static(self, route: str) -> bool:
        if self._surface == "session":
            if route == "/session":
                self._redirect("/session/")
                return True
            if route == "/session/":
                self._serve_file(ROOT / "session" / "index.html")
                return True
            if route.startswith("/session/"):
                target = self._safe_child(
                    ROOT / "session",
                    route.removeprefix("/session/"),
                )
                if target:
                    self._serve_file(target)
                else:
                    self._not_found()
                return True
            if route == "/tokens/base.css":
                self._serve_file(ROOT / "tokens" / "base.css")
                return True
            if route == "/components/components.css":
                self._serve_file(ROOT / "components" / "components.css")
                return True
            if route.startswith("/assets/backgrounds/"):
                target = self._safe_child(
                    ROOT / "assets" / "backgrounds",
                    route.removeprefix("/assets/backgrounds/"),
                )
                if target:
                    self._serve_file(target)
                else:
                    self._not_found()
                return True
            if self._allow_examples and route.startswith("/examples/co-design/"):
                target = self._safe_child(
                    ROOT / "examples" / "co-design",
                    route.removeprefix("/examples/co-design/"),
                )
                if target:
                    self._serve_file(target)
                else:
                    self._not_found()
                return True
            return False

        if self._surface == "portal":
            if route == "/portal":
                self._redirect("/portal/")
                return True
            if route == "/portal/":
                self._serve_file(ROOT / "portal" / "index.html")
                return True
            if route.startswith("/portal/"):
                target = self._safe_child(
                    ROOT / "portal",
                    route.removeprefix("/portal/"),
                )
                if target:
                    self._serve_file(target)
                else:
                    self._not_found()
                return True
            if route == "/tokens/base.css":
                self._serve_file(ROOT / "tokens" / "base.css")
                return True
            if route == "/components/components.css":
                self._serve_file(ROOT / "components" / "components.css")
                return True
            if route.startswith("/patterns/"):
                target = self._safe_child(
                    ROOT / "patterns",
                    route.removeprefix("/patterns/"),
                )
                if target:
                    self._serve_file(target)
                else:
                    self._not_found()
                return True
            if route.startswith("/examples/visuals/"):
                target = self._safe_child(
                    ROOT / "examples" / "visuals",
                    route.removeprefix("/examples/visuals/"),
                )
                if target:
                    self._visual_response = True
                    try:
                        self._serve_file(target)
                    finally:
                        self._visual_response = False
                else:
                    self._not_found()
                return True
            if route.startswith("/examples/demos/"):
                target = self._safe_child(
                    ROOT / "examples" / "demos",
                    route.removeprefix("/examples/demos/"),
                )
                if target:
                    self._demo_response = True
                    try:
                        self._serve_file(target)
                    finally:
                        self._demo_response = False
                else:
                    self._not_found()
                return True
            if route.startswith("/adapters/visual/vendor/browser/"):
                target = self._safe_child(
                    ROOT / "adapters" / "visual" / "vendor" / "browser",
                    route.removeprefix("/adapters/visual/vendor/browser/"),
                )
                if target:
                    self._serve_file(target)
                else:
                    self._not_found()
                return True
            if route.startswith("/assets/backgrounds/"):
                target = self._safe_child(
                    ROOT / "assets" / "backgrounds",
                    route.removeprefix("/assets/backgrounds/"),
                )
                if target:
                    self._serve_file(target)
                else:
                    self._not_found()
                return True
            return False

        return False

    def do_HEAD(self) -> None:
        self.send_response(HTTPStatus.METHOD_NOT_ALLOWED)
        self.send_header("Allow", "GET, POST, OPTIONS")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_OPTIONS(self) -> None:
        self._send_json(HTTPStatus.FORBIDDEN, {"error": "跨源请求未启用"})

    def do_GET(self) -> None:
        route = urlsplit(self.path).path

        if self._surface == "session":
            if route == "/api/session-health":
                self._send_json(
                    HTTPStatus.OK,
                    {
                        "service": "Gary-UI co-design bridge",
                        "status": "ready",
                        "surface": "session",
                        "schemaVersion": 1,
                        "sessionRoot": str(self._session_store.root),
                    },
                )
                return

            session_match = SESSION_ROUTE.fullmatch(route)
            if session_match:
                self._get_snapshot(session_match.group(1))
                return
            events_match = EVENTS_ROUTE.fullmatch(route)
            if events_match:
                self._get_events(events_match.group(1))
                return
            artifact_match = ARTIFACT_ROUTE.fullmatch(route)
            if artifact_match:
                session_id, revision, option_id = artifact_match.groups()
                self._get_artifact(session_id, int(revision), option_id)
                return
            evidence_match = EVIDENCE_ROUTE.fullmatch(route)
            if evidence_match:
                session_id, receipt_id, file_name = evidence_match.groups()
                self._get_evidence(session_id, receipt_id, file_name)
                return
            if route.startswith("/api/"):
                self._not_found()
                return
            if self._serve_static(route):
                return
            self._not_found()
            return

        if self._surface == "portal":
            if route == "/api/health":
                self._send_json(
                    HTTPStatus.OK,
                    {
                        "service": "Gary-UI review bridge",
                        "status": "ready",
                        "canonical": str(ROOT),
                        "surface": "portal",
                    },
                )
                return
            if route == "/api/review":
                existing = self._read_existing_review()
                if existing is None:
                    self._send_json(
                        HTTPStatus.OK,
                        {
                            "bridgeSchemaVersion": 1,
                            "handoffStatus": "empty",
                            "decision": None,
                        },
                    )
                else:
                    self._send_json(HTTPStatus.OK, existing)
                return
            if route.startswith("/api/"):
                self._not_found()
                return
            if self._serve_static(route):
                return
            self._not_found()
            return

        self._send_json(
            HTTPStatus.INTERNAL_SERVER_ERROR,
            {"error": "server.surface 必须为 portal 或 session"},
        )

    def _get_snapshot(self, session_id: str) -> None:
        try:
            token, _ = self._authenticate_query(session_id, allowed={"token"})
            base_url = f"http://127.0.0.1:{self.server.server_port}"
            snapshot = self._session_store.snapshot(session_id, base_url=base_url)
            headers = (
                (
                    "Set-Cookie",
                    self._session_cookie(
                        ARTIFACT_COOKIE,
                        token,
                        f"/api/sessions/{session_id}/artifacts/",
                    ),
                ),
                (
                    "Set-Cookie",
                    self._session_cookie(
                        EVIDENCE_COOKIE,
                        token,
                        f"/api/sessions/{session_id}/evidence/",
                    ),
                ),
            )
            self._send_json(HTTPStatus.OK, snapshot, headers=headers)
        except Exception as error:
            self._send_session_error(error)

    def _get_events(self, session_id: str) -> None:
        try:
            token, generation = self._authenticate_query(
                session_id,
                allowed={"token", "after"},
            )
            after_raw = self._query_value(
                "after",
                allowed={"token", "after"},
                required=False,
            )
            after = int(after_raw or "0")
            if after < 0:
                raise SessionStoreError("after 必须为非负整数")
        except (ValueError, SessionStoreError) as error:
            self._send_session_error(error)
            return
        try:
            self._send_sse(
                session_id,
                token=token,
                generation=generation,
                after=after,
            )
        except (
            BrokenPipeError,
            ConnectionResetError,
            OSError,
            SessionContractError,
            SessionStoreError,
        ):
            return

    def _send_sse(
        self,
        session_id: str,
        *,
        token: str,
        generation: int,
        after: int,
    ) -> None:
        self.close_connection = True
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Connection", "close")
        self.end_headers()
        cursor = after
        deadline = time.monotonic() + 25
        next_heartbeat = time.monotonic() + 8
        while time.monotonic() < deadline:
            self._session_store.authenticate(
                session_id,
                token,
                expected_generation=generation,
            )
            events = self._session_store.events_after(session_id, after=cursor)
            for event in events:
                payload = json.dumps(
                    event,
                    ensure_ascii=False,
                    separators=(",", ":"),
                )
                frame = (
                    f"id: {event['sequence']}\n"
                    "event: message\n"
                    f"data: {payload}\n\n"
                ).encode("utf-8")
                self.wfile.write(frame)
                self.wfile.flush()
                cursor = event["sequence"]
            if time.monotonic() >= next_heartbeat:
                self.wfile.write(b": heartbeat\n\n")
                self.wfile.flush()
                next_heartbeat = time.monotonic() + 8
            time.sleep(0.25)

    def _get_artifact(
        self,
        session_id: str,
        revision: int,
        option_id: str,
    ) -> None:
        try:
            self._authenticate_cookie(session_id, ARTIFACT_COOKIE)
            artifact = self._session_store.artifact_path(
                session_id,
                revision,
                option_id,
            )
            html = artifact.read_text(encoding="utf-8")
            if PREVIEW_BRIDGE not in html:
                if re.search(r"</body\s*>", html, re.IGNORECASE):
                    html = re.sub(
                        r"</body\s*>",
                        PREVIEW_BRIDGE + "</body>",
                        html,
                        count=1,
                        flags=re.IGNORECASE,
                    )
                else:
                    html += PREVIEW_BRIDGE
            body = html.encode("utf-8")
            self._artifact_response = True
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
        except Exception as error:
            self._send_session_error(error)

    def _get_evidence(
        self,
        session_id: str,
        receipt_id: str,
        file_name: str,
    ) -> None:
        try:
            self._authenticate_cookie(session_id, EVIDENCE_COOKIE)
            evidence = self._session_store.evidence_path(
                session_id,
                receipt_id,
                file_name,
            )
            self._evidence_response = True
            self._serve_file(evidence)
        except Exception as error:
            self._send_session_error(error)

    def do_POST(self) -> None:
        route = urlsplit(self.path).path
        if self._surface == "session":
            feedback_match = FEEDBACK_ROUTE.fullmatch(route)
            if feedback_match:
                self._post_session_feedback(feedback_match.group(1))
                return
            self._not_found()
            return
        if self._surface == "portal":
            if route == "/api/review":
                self._post_review()
                return
            self._not_found()
            return
        self._send_json(
            HTTPStatus.INTERNAL_SERVER_ERROR,
            {"error": "server.surface 必须为 portal 或 session"},
        )

    def _post_review(self) -> None:
        if not self._request_is_local() or not self._origin_is_exact_server():
            self._send_json(HTTPStatus.FORBIDDEN, {"error": "只允许同源本机请求"})
            return
        if self.headers.get(HANDOFF_HEADER) != "1":
            self._send_json(
                HTTPStatus.FORBIDDEN,
                {"error": f"缺少 {HANDOFF_HEADER}"},
            )
            return
        if self.headers.get_content_type() != "application/json":
            self._send_json(
                HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
                {"error": "只接受 application/json"},
            )
            return
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = -1
        if content_length < 1 or content_length > MAX_BODY_BYTES:
            self._send_json(
                HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
                {"error": "请求体大小无效"},
            )
            return
        try:
            raw = json.loads(self.rfile.read(content_length))
            decision = normalize_decision(raw, require_ready=True)
        except (json.JSONDecodeError, UnicodeDecodeError, ReviewContractError) as error:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})
            return
        envelope = new_envelope(decision)
        existing = self._read_existing_review()
        if (
            isinstance(existing, dict)
            and existing.get("decisionId") == envelope["decisionId"]
            and existing.get("handoffStatus") == "applied"
        ):
            envelope = existing
        else:
            write_json_atomic(REVIEW_FILE, envelope)
        self._send_json(HTTPStatus.OK, envelope)

    def _post_session_feedback(self, session_id: str) -> None:
        if not self._request_is_local() or not self._origin_is_exact_server(required=True):
            self._send_json(
                HTTPStatus.FORBIDDEN,
                {"error": "只允许严格同源本机请求"},
            )
            return
        if urlsplit(self.path).query:
            self._send_json(
                HTTPStatus.BAD_REQUEST,
                {"error": "feedback 不接受 query 参数"},
            )
            return
        token = self.headers.get(SESSION_TOKEN_HEADER)
        if not token:
            self._send_json(
                HTTPStatus.FORBIDDEN,
                {"error": f"缺少 {SESSION_TOKEN_HEADER}"},
            )
            return
        if self.headers.get_content_type() != "application/json":
            self._send_json(
                HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
                {"error": "只接受 application/json"},
            )
            return
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = -1
        if content_length < 1 or content_length > MAX_SESSION_BODY_BYTES:
            self._send_json(
                HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
                {"error": "请求体大小无效"},
            )
            return
        try:
            generation = self._session_store.authenticate(session_id, token)
            raw = json.loads(self.rfile.read(content_length))
            result = self._session_store.submit_feedback(
                session_id,
                raw,
                token=token,
                expected_generation=generation,
            )
            self._send_json(
                HTTPStatus.OK,
                {
                    "status": "accepted",
                    "feedbackId": result["feedbackId"],
                    "approvalId": (
                        result["approval"]["approvalId"]
                        if result["approval"]
                        else None
                    ),
                    "event": result["event"],
                    "state": result["state"]["status"],
                },
            )
        except (json.JSONDecodeError, UnicodeDecodeError) as error:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})
        except Exception as error:
            self._send_session_error(error)

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        if getattr(self, "_artifact_response", False):
            self.send_header(
                "Content-Security-Policy",
                "default-src 'none'; img-src 'self' data: blob:; "
                "style-src 'self' 'unsafe-inline'; "
                "script-src 'self' 'unsafe-inline'; "
                "connect-src 'none'; object-src 'none'; frame-src 'none'; "
                "frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
            )
        elif getattr(self, "_visual_response", False):
            self.send_header(
                "Content-Security-Policy",
                "default-src 'none'; img-src data: blob:; "
                "style-src 'unsafe-inline'; script-src 'unsafe-inline'; "
                "connect-src 'none'; object-src 'none'; frame-src 'none'; "
                "frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
            )
        elif getattr(self, "_demo_response", False):
            self.send_header(
                "Content-Security-Policy",
                "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; "
                "style-src 'self' 'unsafe-inline'; "
                "script-src 'self' 'unsafe-inline'; connect-src 'none'; "
                "object-src 'none'; frame-src 'self'; frame-ancestors 'self'; "
                "base-uri 'self'; form-action 'none'",
            )
        elif getattr(self, "_evidence_response", False):
            self.send_header(
                "Content-Security-Policy",
                "default-src 'none'; sandbox",
            )
        else:
            self.send_header(
                "Content-Security-Policy",
                "default-src 'self'; img-src 'self' data: blob:; "
                "style-src 'self' 'unsafe-inline'; script-src 'self'; "
                "frame-src 'self'; connect-src 'self'; object-src 'none'; "
                "base-uri 'self'; form-action 'self'",
            )
        super().end_headers()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument(
        "--surface",
        choices=sorted(SURFACES),
        default="portal",
        help="Expose exactly one surface; there is no combined mode.",
    )
    parser.add_argument(
        "--sessions-root",
        type=Path,
        default=DEFAULT_SESSIONS_ROOT,
        help=argparse.SUPPRESS,
    )
    parser.add_argument(
        "--allow-co-design-examples",
        action="store_true",
        help="Session surface only: serve /examples/co-design/*.",
    )
    args = parser.parse_args()
    try:
        sessions_root = resolve_sessions_root(args.sessions_root)
    except ValueError as error:
        parser.error(str(error))

    server = ThreadingHTTPServer(("127.0.0.1", args.port), GaryPortalHandler)
    server.surface = args.surface
    server.allow_co_design_examples = (
        args.surface == "session" and args.allow_co_design_examples
    )
    server.session_store = SessionStore(sessions_root)
    if args.surface == "portal":
        print(
            f"Gary-UI Portal: http://127.0.0.1:{args.port}/portal/#review",
            flush=True,
        )
    else:
        print(f"Gary-UI Session: http://127.0.0.1:{args.port}/session/", flush=True)
    print(f"Surface: {args.surface}", flush=True)
    print(f"Canonical: {ROOT}", flush=True)
    if args.surface == "session":
        print(f"Session root: {server.session_store.root}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
