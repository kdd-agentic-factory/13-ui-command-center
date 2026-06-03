import re
from pathlib import Path

# Literal substrings that must never appear in tracked source.
FORBIDDEN_PATTERNS = [
    "ghp_",
    "sk-ant-",
    "sk-or-v1-",  # OpenRouter live key
    "BEGIN PRIVATE KEY",
    "BEGIN RSA PRIVATE KEY",
    "real_password=",
    "production_secret=",
]

# Shaped secrets — matched by regex to avoid false positives on bare prefixes.
FORBIDDEN_REGEXES = [
    re.compile(r"ik_[0-9a-f]{32}"),  # InsForge API / service_role key
]

SKIP_DIRS = {"node_modules", ".git", "dist", "__pycache__", "semgrep-rules"}
SKIP_FILES = {"test_no_real_secrets.py", "gitleaks.toml"}
SCAN_SUFFIXES = {
    ".md", ".yaml", ".yml", ".py", ".rego", ".toml", ".sh",
    ".ts", ".tsx", ".js", ".jsx",  # frontend source ships to the browser
}

def test_no_real_secrets():
    for path in Path(".").rglob("*"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.name in SKIP_FILES:
            continue
        if path.is_file() and path.suffix in SCAN_SUFFIXES:
            content = path.read_text(errors="ignore")
            for pattern in FORBIDDEN_PATTERNS:
                assert pattern not in content, f"Forbidden pattern '{pattern}' found in {path}"
            for rx in FORBIDDEN_REGEXES:
                assert not rx.search(content), f"Forbidden secret matching {rx.pattern!r} found in {path}"
