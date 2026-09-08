"""Validate the Gary-UI 2.0 co-design layer and the existing design kernel."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED = (
    "spec/system.json",
    "docs/GARY_UI_AGENT_COLLABORATION_WHITEPAPER.md",
    "runtime/manifest.json",
    "gary-ui.cmd",
    "contracts/task.schema.json",
    "contracts/session.schema.json",
    "contracts/proposal.schema.json",
    "contracts/feedback.schema.json",
    "contracts/approval.schema.json",
    "contracts/evidence.schema.json",
    "contracts/final-ui-report.schema.json",
    "contracts/build-report.schema.json",
    "contracts/command-result.schema.json",
    "scripts/invocation_contract.py",
    "scripts/session_contract.py",
    "scripts/session_store.py",
    "scripts/gary_ui.py",
    "scripts/serve_portal.py",
    "session/index.html",
    "session/app.css",
    "session/app.js",
    "session/preview-bridge.js",
)

JSON_FILES = (
    "spec/system.json",
    "runtime/manifest.json",
    "metadata.json",
    "library-consumption.json",
    "contracts/task.schema.json",
    "contracts/session.schema.json",
    "contracts/proposal.schema.json",
    "contracts/feedback.schema.json",
    "contracts/approval.schema.json",
    "contracts/evidence.schema.json",
    "contracts/final-ui-report.schema.json",
    "contracts/build-report.schema.json",
    "contracts/command-result.schema.json",
)

EXPECTED_AXES = {
    "applicationModes": ["board", "scroll-report", "web-ui"],
    "pageModes": ["report-cover", "image-page", "data-page", "manual-toc"],
    "themes": ["dark", "light"],
    "materials": ["ultrathin", "regular", "thick", "solid-plate"],
    "densities": ["spacious", "balanced", "compact"],
}

CO_DESIGN_REQUIRED_MARKERS = (
    "<style data-gary-demo-style>",
    "--demo-edge:",
    ".demo-shell {",
    "<script data-gary-demo-script>",
    'querySelectorAll("[data-theme-toggle]")',
    'querySelectorAll("[data-scroll-target]")',
)

CO_DESIGN_FORBIDDEN_MARKERS = (
    "/examples/co-design",
    "http://",
    "https://",
    'src="//',
    'href="//',
)


def load_json(relative: str, issues: list[str]) -> dict:
    path = ROOT / relative
    try:
        value = json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError) as error:
        issues.append(f"JSON 无效: {relative}: {error}")
        return {}
    if not isinstance(value, dict):
        issues.append(f"JSON 根必须为 object: {relative}")
        return {}
    return value


def require_markers(
    relative: str,
    markers: tuple[str, ...],
    issues: list[str],
    *,
    case_sensitive: bool = True,
) -> None:
    path = ROOT / relative
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8-sig", errors="replace")
    haystack = text if case_sensitive else text.casefold()
    for marker in markers:
        needle = marker if case_sensitive else marker.casefold()
        if needle not in haystack:
            issues.append(f"{relative} 缺标记: {marker}")


def validate_co_design_proposals(issues: list[str]) -> int:
    proposal_root = ROOT / "examples" / "co-design"
    proposal_paths = sorted(proposal_root.glob("**/index.html"))
    if not proposal_paths:
        issues.append("examples/co-design 缺 proposal HTML")
        return 0

    for path in proposal_paths:
        relative = path.relative_to(ROOT).as_posix()
        try:
            text = path.read_text(encoding="utf-8-sig")
        except OSError as error:
            issues.append(f"无法读取 co-design proposal: {relative}: {error}")
            continue
        for marker in CO_DESIGN_REQUIRED_MARKERS:
            if marker not in text:
                issues.append(f"{relative} 缺自包含标记: {marker}")
        for marker in CO_DESIGN_FORBIDDEN_MARKERS:
            if marker in text:
                issues.append(f"{relative} 含外部依赖: {marker}")
    return len(proposal_paths)


def main() -> int:
    issues: list[str] = []
    warnings: list[str] = []

    for relative in REQUIRED:
        if not (ROOT / relative).is_file():
            issues.append(f"缺 Gary-UI 2.0 必需文件: {relative}")

    documents = {relative: load_json(relative, issues) for relative in JSON_FILES}
    system = documents.get("spec/system.json", {})
    metadata = documents.get("metadata.json", {})
    consumption = documents.get("library-consumption.json", {})
    task_schema = documents.get("contracts/task.schema.json", {})
    session_schema = documents.get("contracts/session.schema.json", {})
    evidence_schema = documents.get("contracts/evidence.schema.json", {})
    final_ui_schema = documents.get("contracts/final-ui-report.schema.json", {})
    build_schema = documents.get("contracts/build-report.schema.json", {})
    runtime_manifest = documents.get("runtime/manifest.json", {})
    collaboration = system.get("collaboration", {})

    if system:
        if system.get("systemVersion") != "2.0.0":
            issues.append("spec/system.json systemVersion 必须为 2.0.0")
        if system.get("skill") != "gary-liquidglass-ui":
            issues.append("spec/system.json skill 不正确")
        axes = system.get("visualAxes", {})
        for name, expected in EXPECTED_AXES.items():
            if axes.get(name) != expected:
                issues.append(f"spec/system.json 视觉轴不一致: {name}")
        if collaboration.get("watchMaxSeconds") != 45:
            issues.append("Session watch 上限必须为 45 秒")
        if collaboration.get("autoWakeAgentAfterTask") is not False:
            issues.append("Session 不得在 Agent 任务结束后自动唤醒模型")
        if collaboration.get("defaultInteraction") != "direct-chat":
            issues.append("默认协作必须为 direct-chat")
        if collaboration.get("defaultRuntime") != "none":
            issues.append("默认不得自动启动 Session runtime")
        if collaboration.get("directChatDefaultFor") != [
            "create",
            "integrate",
            "audit",
            "govern",
        ]:
            issues.append("四种 operation 必须默认支持直接对话")
        if collaboration.get("requiredFor") != []:
            issues.append("Session 不得作为任何 operation 的强制前置")
        if collaboration.get("sessionActivationTriggers") != [
            "user-explicit-request",
            "multiple-credible-visual-routes",
            "element-annotation-or-region-combination",
            "direct-chat-or-first-preview-not-converged",
            "high-impact-multi-page-visual-governance",
        ]:
            issues.append("按需 Session 触发条件不完整")
        if collaboration.get("sessionStartRequiresUserConsent") is not True:
            issues.append("启动 Session 前必须取得用户同意")
        if collaboration.get("skipRequiresReason") is not False:
            issues.append("直接对话不得被视为需要解释的 Session 跳过")
        if collaboration.get("directChat") != {
            "implementWhenDecisionComplete": True,
            "askOnlyForMaterialAmbiguity": True,
            "maxHighImpactQuestionsPerRound": 3,
            "chatInstructionMayAuthorizeImplementation": True,
        }:
            issues.append("直接对话行为契约不完整")
        baseline_guard = system.get("integrationBaselineGuard", {})
        if baseline_guard.get("requireExactlyOneBaselineSource") is not True:
            issues.append("已批准集成基线必须恰好选择一种来源")
        if baseline_guard.get("baselineSources") != {
            "session": {
                "requiredReferences": ["sessionId", "approvalId", "verificationId"]
            },
            "direct-chat": {
                "requiredReferences": [
                    "targetArtifact",
                    "browserReport",
                    "chatAuthorization",
                ]
            },
        }:
            issues.append("Session 与直接对话基线引用不完整")
        final_gate = system.get("finalDeliveryGate", {})
        if final_gate.get("operations") != ["create", "integrate", "govern"]:
            issues.append("最终稿门禁 operation 不正确")
        if final_gate.get("requiredChecks") != [
            "gary-css-loaded",
            "gary-browser-computed-style",
        ]:
            issues.append("最终稿门禁 requiredChecks 不正确")
        if final_gate.get("browserReport") != {
            "label": "target-browser-report",
            "kind": "browser-report",
            "contract": "contracts/final-ui-report.schema.json",
        }:
            issues.append("最终稿浏览器报告策略不正确")
        if final_gate.get("reactBuild") != {
            "requiredCheck": "target-production-build",
            "label": "target-production-build-report",
            "kind": "build-report",
            "contract": "contracts/build-report.schema.json",
        }:
            issues.append("React 最终生产构建策略不正确")

    if metadata:
        if metadata.get("version") != "2.0.0":
            issues.append("metadata.json version 必须为 2.0.0")
        if metadata.get("defaultInteraction") != "direct-chat":
            issues.append("metadata 默认协作必须为 direct-chat")
        if metadata.get("directChatDefaultFor") != collaboration.get(
            "directChatDefaultFor"
        ):
            issues.append("metadata 直接对话 operation 投影漂移")
        if metadata.get("sessionRequiredFor") != []:
            issues.append("metadata 不得声明强制 Session")
        if metadata.get("sessionActivationTriggers") != collaboration.get(
            "sessionActivationTriggers"
        ):
            issues.append("metadata Session 触发条件投影漂移")
        if metadata.get("sessionStartRequiresUserConsent") is not True:
            issues.append("metadata 缺 Session 用户同意门禁")
        if metadata.get("sessionSkipRequiresReason") is not False:
            issues.append("metadata 不得要求解释直接对话路径")

    if consumption:
        session_policy = consumption.get("session", {})
        if session_policy.get("activation") != "optional-escalation":
            issues.append("library Session 必须是 optional-escalation")
        if session_policy.get("defaultFor") != []:
            issues.append("library 不得默认启动 Session")
        if session_policy.get("availableFor") != collaboration.get(
            "directChatDefaultFor"
        ):
            issues.append("library Session 可用 operation 投影漂移")
        if session_policy.get("activationTriggers") != collaboration.get(
            "sessionActivationTriggers"
        ):
            issues.append("library Session 触发条件投影漂移")
        if session_policy.get("requiresUserConsent") is not True:
            issues.append("library 缺 Session 用户同意门禁")

    if task_schema:
        properties = task_schema.get("properties", {})
        operations = properties.get("operation", {}).get("enum", [])
        if operations != ["create", "integrate", "audit", "govern"]:
            issues.append("Task operation 枚举不正确")
        modes = properties.get("mode", {}).get("enum", [])
        if modes != ["quick", "compare", "deep-review"]:
            issues.append("Task mode 枚举不正确")

    if session_schema:
        states = (
            session_schema.get("properties", {})
            .get("status", {})
            .get("enum", [])
        )
        for required_state in ("corrupt", "verified", "closed"):
            if required_state not in states:
                issues.append(f"Session 状态枚举缺 {required_state}")

    if evidence_schema:
        required = set(evidence_schema.get("required", []))
        for field in ("approvalId", "result", "checks", "artifacts", "skillsUsed"):
            if field not in required:
                issues.append(f"Evidence schema 缺 required: {field}")
        artifact_kinds = (
            evidence_schema.get("properties", {})
            .get("artifacts", {})
            .get("items", {})
            .get("properties", {})
            .get("kind", {})
            .get("enum", [])
        )
        if "build-report" not in artifact_kinds:
            issues.append("Evidence artifact kind 缺 build-report")

    if final_ui_schema:
        required = set(final_ui_schema.get("required", []))
        for field in ("source", "styleEntryLoaded", "computedStyle"):
            if field not in required:
                issues.append(f"Final UI report schema 缺 required: {field}")

    if build_schema and build_schema.get("properties", {}).get("exitCode", {}).get("const") != 0:
        issues.append("Build report schema 必须要求 exitCode=0")

    if runtime_manifest:
        included = set(runtime_manifest.get("include", []))
        excluded = set(runtime_manifest.get("exclude", []))
        for marker in (
            "SKILL.md",
            "session/**",
            "scripts/gary_ui.py",
            "scripts/invocation_contract.py",
            "contracts/*.schema.json",
        ):
            if marker not in included:
                issues.append(f"runtime manifest 缺 include: {marker}")
        for marker in ("portal/**", "decisions/**", "scripts/tests/**"):
            if marker not in excluded:
                issues.append(f"runtime manifest 缺 exclude: {marker}")
        if runtime_manifest.get("systemVersion") != "2.0.0":
            issues.append("runtime manifest systemVersion 必须为 2.0.0")

    require_markers(
        "session/index.html",
        (
            'sandbox="allow-scripts"',
            "data-option-tabs",
            "data-open-decisions",
            "data-annotation-form",
            "data-request-approval",
        ),
        issues,
    )
    require_markers(
        "session/app.js",
        (
            "EventSource",
            "X-Gary-Session-Token",
            'submitFeedback("approve")',
            "gary-node-selected",
            "optionId",
            "combinations",
            "latestVerification",
        ),
        issues,
    )
    require_markers(
        "session/preview-bridge.js",
        ("postMessage", "data-gary-node-id", "gary-preview-ready"),
        issues,
    )
    require_markers(
        "scripts/gary_ui.py",
        ("writerCredential", "--writer-lease", '"verify"'),
        issues,
    )
    require_markers(
        "scripts/serve_portal.py",
        ("HttpOnly", "--surface", "GARY_UI_ALLOW_TEST_SESSION_ROOT"),
        issues,
    )
    require_markers(
        "SKILL.md",
        (
            "默认使用当前对话",
            "Session 是按需升级能力",
            "approvalId",
            "session watch",
            "session verify",
            "--writer-lease",
            "data-gary-node-id",
            "功能骨架，未验证",
            "gary-css-loaded",
            "target-production-build",
        ),
        issues,
    )
    require_markers(
        "docs/GARY_UI_AGENT_COLLABORATION_WHITEPAPER.md",
        (
            "quick",
            "compare",
            "deep review",
            "approvalId",
            "writer credential",
            "session verify",
        ),
        issues,
        case_sensitive=False,
    )

    require_markers(
        "DESIGN.md",
        (
            "功能骨架/未样式化页面永远不是最终稿",
            "target-browser-report",
            "target-production-build-report",
        ),
        issues,
    )
    require_markers(
        "adapters/react-shadcn/README.md",
        (
            "@gary-ui/react-shadcn/styles.css",
            "功能骨架，未验证",
            "target-production-build",
        ),
        issues,
    )

    co_design_proposal_count = validate_co_design_proposals(issues)

    kernel = subprocess.run(
        [sys.executable, "-B", str(ROOT / "scripts" / "validate.py")],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    try:
        kernel_result = json.loads(kernel.stdout)
    except json.JSONDecodeError:
        kernel_result = {
            "status": "fail",
            "issues": [kernel.stderr.strip() or "旧 Kernel 校验未返回 JSON"],
        }
    if kernel.returncode != 0:
        for issue in kernel_result.get("issues", ["旧 Kernel 校验失败"]):
            issues.append(f"Kernel: {issue}")

    result = {
        "root": str(ROOT),
        "systemVersion": system.get("systemVersion"),
        "kernel": kernel_result,
        "requiredFiles": len(REQUIRED),
        "coDesignProposalHtml": co_design_proposal_count,
        "issues": issues,
        "warnings": warnings,
        "status": "pass" if not issues else "fail",
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not issues else 1


if __name__ == "__main__":
    raise SystemExit(main())
