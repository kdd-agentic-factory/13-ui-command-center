from pathlib import Path

OPA_POLICIES = [
    "tooling/opa/policies/approval-policy.rego",
    "tooling/opa/policies/mcp-tool-policy.rego",
    "tooling/opa/policies/kubernetes-policy.rego",
    "tooling/opa/policies/data-export-policy.rego",
]

OPA_TESTS = [
    "tooling/opa/tests/approval-policy_test.rego",
    "tooling/opa/tests/mcp-tool-policy_test.rego",
]

def test_opa_policy_files_exist():
    for policy in OPA_POLICIES:
        assert Path(policy).exists(), f"Missing OPA policy: {policy}"

def test_opa_test_files_exist():
    for test in OPA_TESTS:
        assert Path(test).exists(), f"Missing OPA test: {test}"

def test_opa_policies_have_package_declaration():
    for policy in OPA_POLICIES:
        content = Path(policy).read_text()
        assert "package kdd." in content, f"OPA policy {policy} missing package declaration"
