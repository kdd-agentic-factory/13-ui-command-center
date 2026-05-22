from pathlib import Path

REQUIRED_POLICIES = [
    "policies/agent-security-policy.md",
    "policies/mcp-tool-security-policy.md",
    "policies/rag-cag-security-policy.md",
    "policies/data-classification-policy.md",
    "policies/human-approval-policy.md",
    "policies/secure-sdlc-policy.md",
    "policies/incident-response-policy.md",
    "policies/ai-safety-policy.md",
    "policies/race-engineering-decision-policy.md",
]

def test_required_policies_exist():
    for policy in REQUIRED_POLICIES:
        assert Path(policy).exists(), f"Missing required policy: {policy}"
