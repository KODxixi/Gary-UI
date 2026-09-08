#!/usr/bin/env python3
"""Gary-UI 2.0 machine-readable Session command line entrypoint."""

from __future__ import annotations

import argparse
import json
import math
import os
import socket
import subprocess
import sys
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

from session_contract import SessionContractError, normalize_command_result
from session_store import (
    DEFAULT_SESSIONS_ROOT,
    SessionAuthenticationError,
    SessionConflictError,
    SessionCorruptError,
    SessionNotFoundError,
    SessionStore,
    SessionStoreError,
)
from visual_adapter import VisualContractError, run_visual_command


ROOT = Path(__file__).resolve().parents[1]
VERSION = "2.0.0"
DEFAULT_PORT = 8878
MAX_PORT = 65535
TEST_ROOT_ENV = "GARY_UI_ALLOW_TEST_SESSION_ROOT"
WRITER_LEASE_ENV = "GARY_UI_WRITER_LEASE"


def _writer_default() -> str:
    return (
        os.environ.get("GARY_UI_AGENT_ID")
        or os.environ.get("CODEX_THREAD_ID")
        or f"local-{os.environ.get('USERNAME', 'agent')}"
    )[:128]


def _writer_lease_default() -> str | None:
    return os.environ.get(WRITER_LEASE_ENV) or None


def _read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8-sig"))
    except FileNotFoundError as error:
        raise SessionStoreError(f"文件不存在: {path}") from error
    except UnicodeDecodeError as error:
        raise SessionContractError(f"文件必须为 UTF-8 JSON: {path}") from error
    except json.JSONDecodeError as error:
        raise SessionContractError(f"JSON 无效: {path}: {error}") from error
    if not isinstance(value, dict):
        raise SessionContractError(f"JSON 顶层必须为 object: {path}")
    return value


def _result(
    command: str,
    *,
    status: str = "pass",
    state: str | None = None,
    session_id: str | None = None,
    outputs: dict[str, Any] | None = None,
    issues: list[str] | None = None,
    warnings: list[str] | None = None,
    evidence: list[dict[str, Any]] | None = None,
    next_actions: list[str] | None = None,
) -> dict[str, Any]:
    return normalize_command_result(
        {
            "schemaVersion": 1,
            "command": command,
            "status": status,
            "state": state,
            "sessionId": session_id,
            "version": VERSION,
            "outputs": outputs or {},
            "issues": issues or [],
            "warnings": warnings or [],
            "evidence": evidence or [],
            "nextActions": next_actions or [],
        }
    )


def _resolve_sessions_root(requested: Path) -> Path:
    resolved = requested.resolve()
    canonical = DEFAULT_SESSIONS_ROOT.resolve()
    if resolved != canonical and os.environ.get(TEST_ROOT_ENV) != "1":
        raise SessionStoreError(
            f"正式运行的 Session 根固定为 {canonical}；"
            f"测试 override 需显式设置 {TEST_ROOT_ENV}=1"
        )
    return resolved


def _health(port: int, root: Path) -> bool:
    try:
        with urlopen(
            f"http://127.0.0.1:{port}/api/session-health",
            timeout=0.5,
        ) as response:
            value = json.loads(response.read())
        return (
            response.status == 200
            and value.get("status") == "ready"
            and value.get("surface") == "session"
            and Path(value.get("sessionRoot", "")).resolve() == root.resolve()
        )
    except (OSError, ValueError, HTTPError, URLError, json.JSONDecodeError):
        return False


def _port_available(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            probe.bind(("127.0.0.1", port))
            return True
        except OSError:
            return False


def _start_server(port: int, root: Path) -> subprocess.Popen[bytes]:
    service_dir = root / "_service"
    service_dir.mkdir(parents=True, exist_ok=True)
    log = (service_dir / f"session-{port}.log").open("ab")
    command = [
        sys.executable,
        str(ROOT / "scripts" / "serve_portal.py"),
        "--surface",
        "session",
        "--port",
        str(port),
    ]
    kwargs: dict[str, Any] = {
        "cwd": str(ROOT),
        "stdin": subprocess.DEVNULL,
        "stdout": log,
        "stderr": subprocess.STDOUT,
    }
    if os.name == "nt":
        kwargs["creationflags"] = getattr(subprocess, "CREATE_NO_WINDOW", 0) | getattr(
            subprocess, "DETACHED_PROCESS", 0
        )
    process = subprocess.Popen(command, **kwargs)
    log.close()
    return process


def ensure_server(
    root: Path,
    *,
    preferred_port: int,
) -> tuple[int, bool]:
    if not 1 <= preferred_port <= 65535:
        raise SessionStoreError("port 必须为 1–65535")
    candidates = list(range(preferred_port, min(MAX_PORT, preferred_port + 21) + 1))
    for port in candidates:
        if _health(port, root):
            return port, False
        if not _port_available(port):
            continue
        process = _start_server(port, root)
        for _ in range(30):
            if _health(port, root):
                return port, True
            if process.poll() is not None:
                break
            time.sleep(0.1)
    raise SessionStoreError(
        f"无法在 127.0.0.1:{preferred_port}–{candidates[-1]} 启动 Session 服务"
    )


def _url(port: int, session_id: str, token: str) -> str:
    from urllib.parse import quote

    return (
        f"http://127.0.0.1:{port}/session/"
        f"?id={quote(session_id, safe='')}&token={quote(token, safe='')}"
    )


class CommandArgumentParser(argparse.ArgumentParser):
    def error(self, message: str) -> None:
        raise SessionContractError(f"参数错误: {message}")


def _watch_timeout(value: str) -> float:
    try:
        timeout = float(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("timeout 必须是 0–45 的有限数值") from error
    if not math.isfinite(timeout) or not 0 <= timeout <= 45:
        raise argparse.ArgumentTypeError("timeout 必须是 0–45 的有限数值")
    return timeout


def add_common(
    action: argparse.ArgumentParser,
    *,
    writer: bool = False,
    needs_lease: bool = False,
) -> None:
    action.add_argument(
        "--sessions-root",
        type=Path,
        default=DEFAULT_SESSIONS_ROOT,
        help=argparse.SUPPRESS,
    )
    if writer:
        action.add_argument("--writer-id", default=_writer_default())
    if needs_lease:
        action.add_argument(
            "--writer-lease",
            default=_writer_lease_default(),
            help=f"Writer capability；也可使用 {WRITER_LEASE_ENV}。",
        )


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = CommandArgumentParser(description=__doc__)
    groups = parser.add_subparsers(dest="group", required=True)
    session = groups.add_parser("session", help="管理受监控的本地 HTML 共创 Session。")
    actions = session.add_subparsers(dest="action", required=True)

    start = actions.add_parser("start", help="创建 Session 并启动/复用本机服务。")
    add_common(start, writer=True)
    start.add_argument("--task", type=Path, required=True)
    start.add_argument("--session-id")
    start.add_argument("--lease-seconds", type=int, default=1800)
    start.add_argument("--port", type=int, default=DEFAULT_PORT)
    start.add_argument("--no-serve", action="store_true", help=argparse.SUPPRESS)

    propose = actions.add_parser("propose", help="以 revision CAS 发布 HTML 提案。")
    add_common(propose, writer=True, needs_lease=True)
    propose.add_argument("--session", required=True)
    propose.add_argument("--proposal", type=Path, required=True)

    watch = actions.add_parser("watch", help="监听新反馈，最长 45 秒。")
    add_common(watch)
    watch.add_argument("--session", required=True)
    watch.add_argument("--after", type=int, default=0)
    watch.add_argument("--timeout", type=_watch_timeout, default=45)

    feedback = actions.add_parser("feedback", help="读取结构化反馈事件。")
    add_common(feedback)
    feedback.add_argument("--session", required=True)
    feedback.add_argument("--after", type=int, default=0)

    revise = actions.add_parser("revise", help="以 CAS 开始下一轮修订。")
    add_common(revise, writer=True, needs_lease=True)
    revise.add_argument("--session", required=True)
    revise.add_argument("--base-revision", type=int, required=True)

    status = actions.add_parser("status", help="读取并验证 Session snapshot。")
    add_common(status)
    status.add_argument("--session", required=True)

    resume = actions.add_parser(
        "resume", help="恢复 Session并轮换 token/writer capability。"
    )
    add_common(resume, writer=True, needs_lease=True)
    resume.add_argument("--session", required=True)
    resume.add_argument("--takeover", action="store_true")
    resume.add_argument(
        "--takeover-credential",
        help="接管凭据（start 返回的一次性 takeoverCredential，接管后轮换）",
    )
    resume.add_argument("--lease-seconds", type=int, default=1800)
    resume.add_argument("--port", type=int, default=DEFAULT_PORT)
    resume.add_argument("--no-serve", action="store_true", help=argparse.SUPPRESS)

    reopen = actions.add_parser("reopen", help="撤销未 finalize 的当前批准并继续迭代。")
    add_common(reopen, writer=True, needs_lease=True)
    reopen.add_argument("--session", required=True)
    reopen.add_argument("--approval-id", required=True)

    finalize = actions.add_parser(
        "finalize", help="用当前 revision 的 approval 锁定方案。"
    )
    add_common(finalize, writer=True, needs_lease=True)
    finalize.add_argument("--session", required=True)
    finalize.add_argument("--approval-id", required=True)

    verify = actions.add_parser("verify", help="写入最终浏览器证据并判定 verified。")
    add_common(verify, writer=True, needs_lease=True)
    verify.add_argument("--session", required=True)
    verify.add_argument("--evidence", type=Path, required=True)

    close = actions.add_parser("close", help="关闭已经 verified 的 Session。")
    add_common(close, writer=True, needs_lease=True)
    close.add_argument("--session", required=True)

    visual = groups.add_parser("visual", help="Run the local visual toolchain.")
    visual_actions = visual.add_subparsers(dest="action", required=True)
    visual_actions.add_parser("doctor", help="Check visual engines and local browser.")
    for action_name in ("validate", "render", "export"):
        action = visual_actions.add_parser(action_name)
        action.add_argument("--manifest", type=Path, required=True)
        action.add_argument("--id", dest="visual_id")
        if action_name == "export":
            action.add_argument("--format", choices=["html", "svg", "png", "pdf"])
    return parser.parse_args(argv)


def run(args: argparse.Namespace) -> tuple[int, dict[str, Any]]:
    command = f"{args.group} {args.action}"
    if args.group == "visual":
        exit_code, payload = run_visual_command(
            args.action,
            manifest=getattr(args, "manifest", None),
            visual_id=getattr(args, "visual_id", None),
            output_format=getattr(args, "format", None),
        )
        status = payload.get("status", "pass" if exit_code == 0 else "fail")
        return exit_code, _result(
            command,
            status=status,
            outputs=payload.get("outputs", payload),
            issues=payload.get("issues", []),
            warnings=payload.get("warnings", []),
            evidence=payload.get("evidence", []),
            next_actions=payload.get("nextActions", []),
        )

    root = _resolve_sessions_root(args.sessions_root)
    store = SessionStore(root)

    if args.action == "start":
        port = args.port
        started = False
        if not args.no_serve:
            port, started = ensure_server(root, preferred_port=args.port)
        created = store.create(
            _read_json(args.task),
            owner_id=args.writer_id,
            lease_seconds=args.lease_seconds,
            session_id=args.session_id,
        )
        session_url = (
            _url(port, created["sessionId"], created["token"])
            if not args.no_serve
            else None
        )
        return 0, _result(
            command,
            state=created["state"]["status"],
            session_id=created["sessionId"],
            outputs={
                "token": created["token"],
                "writerCredential": created["writerCredential"],
                "takeoverCredential": created["takeoverCredential"],
                "sessionUrl": session_url,
                "port": port if session_url else None,
                "serverStarted": started,
                "writerLease": created["writerLease"],
            },
            evidence=[
                {"kind": "task-hash", "value": created["state"]["taskHash"]},
                {
                    "kind": "event-chain-head",
                    "value": created["state"]["lastEventHash"],
                },
            ],
            next_actions=(
                ["打开 sessionUrl，并用 writerCredential 发布首轮 proposal"]
                if session_url
                else ["启动 Session surface 后执行 session resume"]
            ),
        )

    session_id = args.session
    if args.action == "propose":
        published = store.publish_proposal(
            session_id,
            _read_json(args.proposal),
            owner_id=args.writer_id,
            writer_credential=args.writer_lease,
        )
        return 0, _result(
            command,
            state=published["state"]["status"],
            session_id=session_id,
            outputs={
                "proposalId": published["proposal"]["proposalId"],
                "revision": published["proposal"]["revision"],
                "event": published["event"],
            },
            evidence=[
                {
                    "kind": "event-chain-head",
                    "value": published["state"]["lastEventHash"],
                }
            ],
            next_actions=["保持 Session watch，等待用户 HTML 反馈"],
        )
    if args.action == "watch":
        watched = store.watch(
            session_id,
            after=args.after,
            timeout=args.timeout,
        )
        snapshot = store.snapshot(session_id)
        heartbeat = watched["heartbeat"]
        return (4 if heartbeat else 0), _result(
            command,
            status="needs-human" if heartbeat else "pass",
            state=snapshot["session"]["status"],
            session_id=session_id,
            outputs=watched,
            next_actions=(
                ["继续 watch 或等待用户提交反馈"]
                if heartbeat
                else ["读取 feedback，并按 baseRevision 执行 revise"]
            ),
        )
    if args.action == "feedback":
        events = store.feedback_events(session_id, after=args.after)
        snapshot = store.snapshot(session_id)
        return 0, _result(
            command,
            state=snapshot["session"]["status"],
            session_id=session_id,
            outputs={"events": events},
            next_actions=["复述反馈后 revise，或使用 approvalId finalize"],
        )
    if args.action == "revise":
        revision = store.start_revision(
            session_id,
            base_revision=args.base_revision,
            owner_id=args.writer_id,
            writer_credential=args.writer_lease,
        )
        return 0, _result(
            command,
            state=revision["state"]["status"],
            session_id=session_id,
            outputs={
                "baseRevision": args.base_revision,
                "expectedRevision": revision["expectedRevision"],
                "event": revision["event"],
            },
            next_actions=["生成 expectedRevision 对应的 proposal 并发布"],
        )
    if args.action == "status":
        snapshot = store.snapshot(session_id)
        return 0, _result(
            command,
            state=snapshot["session"]["status"],
            session_id=session_id,
            outputs={"snapshot": snapshot},
            evidence=[
                {
                    "kind": "event-chain-head",
                    "value": snapshot["events"]["lastHash"],
                }
            ],
        )
    if args.action == "resume":
        port = args.port
        started = False
        if not args.no_serve:
            port, started = ensure_server(root, preferred_port=args.port)
        resumed = store.resume(
            session_id,
            owner_id=args.writer_id,
            writer_credential=args.writer_lease,
            takeover=args.takeover,
            takeover_credential=args.takeover_credential,
            lease_seconds=args.lease_seconds,
        )
        session_url = (
            _url(port, session_id, resumed["token"]) if not args.no_serve else None
        )
        return 0, _result(
            command,
            state=resumed["state"]["status"],
            session_id=session_id,
            outputs={
                "token": resumed["token"],
                "writerCredential": resumed["writerCredential"],
                "takeoverCredential": resumed.get("takeoverCredential"),
                "sessionUrl": session_url,
                "port": port if session_url else None,
                "serverStarted": started,
                "writerLease": resumed["writerLease"],
            },
            next_actions=["打开 sessionUrl，并使用新 writerCredential 继续"],
        )
    if args.action == "reopen":
        reopened = store.reopen(
            session_id,
            approval_id=args.approval_id,
            owner_id=args.writer_id,
            writer_credential=args.writer_lease,
        )
        return 0, _result(
            command,
            state=reopened["state"]["status"],
            session_id=session_id,
            outputs={"approval": reopened["approval"], "event": reopened["event"]},
            evidence=[
                {
                    "kind": "reopened-approval",
                    "value": reopened["approval"]["approvalId"],
                }
            ],
            next_actions=["按 activeRevision 执行 revise，再发布下一版 proposal"],
        )
    if args.action == "finalize":
        finalized = store.finalize(
            session_id,
            approval_id=args.approval_id,
            owner_id=args.writer_id,
            writer_credential=args.writer_lease,
        )
        return 0, _result(
            command,
            state=finalized["state"]["status"],
            session_id=session_id,
            outputs={
                "approval": finalized["approval"],
                "event": finalized["event"],
            },
            evidence=[
                {
                    "kind": "approval-decision-hash",
                    "value": finalized["approval"]["decisionHash"],
                }
            ],
            next_actions=["按冻结方案实施，再用 session verify 写入浏览器证据"],
        )
    if args.action == "verify":
        verified = store.verify(
            session_id,
            _read_json(args.evidence),
            owner_id=args.writer_id,
            writer_credential=args.writer_lease,
        )
        return 0, _result(
            command,
            state=verified["state"]["status"],
            session_id=session_id,
            outputs={
                "receipt": verified["receipt"],
                "event": verified["event"],
            },
            evidence=[
                {
                    "kind": "verification-receipt",
                    "value": verified["receipt"]["receiptId"],
                },
                {
                    "kind": "event-chain-head",
                    "value": verified["state"]["lastEventHash"],
                },
            ],
            next_actions=(
                ["证据已通过；可以 session close"]
                if verified["state"]["status"] == "verified"
                else ["修复失败项后重新 session verify"]
            ),
        )
    if args.action == "close":
        closed = store.close(
            session_id,
            owner_id=args.writer_id,
            writer_credential=args.writer_lease,
        )
        return 0, _result(
            command,
            state=closed["state"]["status"],
            session_id=session_id,
            outputs={
                "event": closed["event"],
                "alreadyClosed": closed["alreadyClosed"],
            },
        )
    raise SessionStoreError(f"不支持的命令: {command}")


def main(argv: list[str] | None = None) -> int:
    raw_argv = sys.argv[1:] if argv is None else argv
    command = " ".join(raw_argv[:2]) or "unknown"
    session_id = None
    try:
        args = parse_args(raw_argv)
        command = (
            f"{getattr(args, 'group', 'unknown')} {getattr(args, 'action', 'unknown')}"
        )
        session_id = getattr(args, "session", None)
        exit_code, result = run(args)
    except SessionContractError as error:
        exit_code = 1
        result = _result(
            command,
            status="fail",
            session_id=session_id,
            issues=[str(error)],
        )
    except (SessionConflictError, SessionAuthenticationError) as error:
        exit_code = 2
        result = _result(
            command,
            status="needs-human",
            session_id=session_id,
            issues=[str(error)],
        )
    except SessionCorruptError as error:
        exit_code = 3
        result = _result(
            command,
            status="drift",
            state="corrupt",
            session_id=session_id,
            issues=[str(error)],
            next_actions=["保留现场，人工检查 corrupt.json 后决定恢复方式"],
        )
    except (SessionNotFoundError, SessionStoreError, VisualContractError, OSError) as error:
        exit_code = 3
        result = _result(
            command,
            status="fail",
            session_id=session_id,
            issues=[str(error)],
        )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
