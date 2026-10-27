"""Permission bridging for owned QA scratch paths, never product secrets."""

import os

IS_POSIX = os.name == "posix"


def group_args(*paths):
    if not IS_POSIX:
        return []
    return [
        item
        for gid in sorted({path.stat().st_gid for path in paths})
        for item in ("--group-add", str(gid))
    ]


def share_directory(path, public_read=False):
    if IS_POSIX:
        path.chmod(0o775 if public_read else 0o770)


def transfer_mode():
    return 0o640 if IS_POSIX else 0o600
