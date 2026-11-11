import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_integration_accepts_session_or_direct_chat_baseline() -> None:
    system = json.loads(
        (ROOT / "spec" / "system.json").read_text(encoding="utf-8")
    )
    guard = system["integrationBaselineGuard"]

    assert guard["requiredWhenApprovedBaselineExists"] is True
    assert guard["requireExactlyOneBaselineSource"] is True
    assert guard["baselineSources"] == {
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
    }
    assert guard["forbidUnapprovedVisualReset"] is True
    assert guard["requiredEvidenceCheck"] == "approved-baseline-drift"

    skill = (ROOT / "SKILL.md").read_text(encoding="utf-8")
    assert "已批准视觉基线防漂移" in skill
    assert "直接对话基线" in skill
    assert "不得伪造 Session ID" in skill
    assert "approved-baseline-drift" in skill


def test_direct_chat_is_default_in_all_policy_projections() -> None:
    system = json.loads(
        (ROOT / "spec" / "system.json").read_text(encoding="utf-8")
    )
    metadata = json.loads((ROOT / "metadata.json").read_text(encoding="utf-8"))
    consumption = json.loads(
        (ROOT / "library-consumption.json").read_text(encoding="utf-8")
    )

    collaboration = system["collaboration"]
    assert collaboration["defaultInteraction"] == "direct-chat"
    assert collaboration["defaultRuntime"] == "none"
    assert collaboration["requiredFor"] == []
    assert collaboration["skipRequiresReason"] is False
    assert collaboration["sessionStartRequiresUserConsent"] is True
    assert collaboration["directChat"] == {
        "implementWhenDecisionComplete": True,
        "askOnlyForMaterialAmbiguity": True,
        "maxHighImpactQuestionsPerRound": 3,
        "chatInstructionMayAuthorizeImplementation": True,
    }

    assert metadata["defaultInteraction"] == "direct-chat"
    assert metadata["sessionRequiredFor"] == []
    assert metadata["sessionSkipRequiresReason"] is False
    assert metadata["sessionStartRequiresUserConsent"] is True

    session = consumption["session"]
    assert session["activation"] == "optional-escalation"
    assert session["defaultFor"] == []
    assert session["requiresUserConsent"] is True
