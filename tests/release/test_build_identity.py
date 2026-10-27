import importlib.util
from pathlib import Path


def load_builder():
    spec = importlib.util.spec_from_file_location(
        "builder_identity", Path("scripts/build-chassis-images.py")
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_image_tag_changes_when_sources_or_base_changes():
    import copy

    builder = load_builder()
    release = {
        "runtime_lock_sha256": "a" * 64,
        "sources": {"18": {"tree_sha256": "b" * 64}},
        "bases": {"python": {"digest": "sha256:" + "c" * 64}},
    }
    first = builder.image_tag("api", release)
    changed = copy.deepcopy(release)
    changed["sources"]["18"]["tree_sha256"] = "d" * 64
    assert builder.image_tag("api", changed) != first
    changed = copy.deepcopy(release)
    changed["bases"]["python"]["digest"] = "sha256:" + "e" * 64
    assert builder.image_tag("api", changed) != first
    assert builder.image_tag("gateway", release) != first


def test_image_tag_is_stable_for_equivalent_manifest_key_order():
    builder = load_builder()
    assert builder.image_tag(
        "api", {"sources": {}, "bases": {}, "runtime_lock_sha256": "a"}
    ) == builder.image_tag(
        "api", {"runtime_lock_sha256": "a", "bases": {}, "sources": {}}
    )


def test_build_passes_full_release_identity_to_image_tagger(monkeypatch, tmp_path):
    import hashlib
    import json
    import types

    builder = load_builder()
    source_root = tmp_path / "sources"
    lock = source_root / "18-telemetry-dataset/requirements/chassis-runtime.lock"
    lock.parent.mkdir(parents=True)
    lock.write_text("fixture-lock")
    wheels = tmp_path / "wheels"
    wheels.mkdir()
    data = {
        "sources": {"18": {"tree_sha256": "b" * 64}},
        "bases": {
            "python": {"reference": "python:fixture", "digest": "sha256:" + "c" * 64}
        },
        "runtime_lock_sha256": hashlib.sha256(lock.read_bytes()).hexdigest(),
    }
    manifest = tmp_path / "release.json"
    manifest.write_text(json.dumps(data))
    output = tmp_path / "output"
    output.mkdir()
    monkeypatch.setattr(builder.release, "validate_release", lambda value: value)
    monkeypatch.setattr(builder.release, "verify_bases", lambda value: None)
    monkeypatch.setattr(builder.release, "wheel_lock", lambda value: "fixture-lock")
    monkeypatch.setattr(
        builder.release, "assemble_contexts", lambda *args: data["sources"]
    )
    commands = []

    def run(args, **kwargs):
        commands.append(args)
        return types.SimpleNamespace(stdout=json.dumps([{"Id": "sha256:" + "d" * 64}]))

    monkeypatch.setattr(builder.subprocess, "run", run)
    images = builder.build(manifest, output, source_root, wheels)
    for name in ["api", "gateway", "worker"]:
        assert images[name]["reference"] == builder.image_tag(name, data)
        assert any(
            "--tag" in cmd and builder.image_tag(name, data) in cmd for cmd in commands
        )
