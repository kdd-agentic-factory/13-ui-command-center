from pathlib import Path

FORBIDDEN_PATTERNS = [
    "ghp_",
    "sk-ant-",
    "BEGIN PRIVATE KEY",
    "BEGIN RSA PRIVATE KEY",
    "real_password=",
    "production_secret=",
]

SKIP_DIRS = {"node_modules", ".git", "dist", "__pycache__", "semgrep-rules"}
SKIP_FILES = {"test_no_real_secrets.py", "gitleaks.toml"}

def test_no_real_secrets():
    for path in Path(".").rglob("*"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.name in SKIP_FILES:
            continue
        if path.is_file() and path.suffix in [".md", ".yaml", ".yml", ".py", ".rego", ".toml", ".sh"]:
            content = path.read_text(errors="ignore")
            for pattern in FORBIDDEN_PATTERNS:
                assert pattern not in content, f"Forbidden pattern '{pattern}' found in {path}"
