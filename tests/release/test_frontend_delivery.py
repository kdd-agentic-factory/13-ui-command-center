import base64
import importlib.util
import json
from pathlib import Path

import pytest


def builder():
    spec = importlib.util.spec_from_file_location(
        "builder", Path("scripts/build-chassis-images.py")
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def token(role):
    payload = (
        base64.urlsafe_b64encode(json.dumps({"role": role}).encode())
        .decode()
        .rstrip("=")
    )
    return "header." + payload + ".signature"


def test_public_build_rejects_privileged_keys_and_unreviewed_fields():
    m = builder()
    for key in ("ik_never_publish", token("project_admin"), token("authenticated")):
        with pytest.raises(ValueError):
            m.validate_frontend_config(
                {
                    "target": "preproduction",
                    "identity_url": "https://identity.example.test",
                    "anon_key": key,
                }
            )
    with pytest.raises(ValueError):
        m.validate_frontend_config(
            {
                "target": "preproduction",
                "identity_url": "https://identity.example.test",
                "anon_key": token("anon"),
                "service_key": "forbidden",
            }
        )


def test_public_build_accepts_only_fixed_https_origins():
    m = builder()
    for url in (
        "http://identity.example.test",
        "https://user@identity.example.test",
        "https://identity.example.test/?key=x",
    ):
        with pytest.raises(ValueError):
            m.validate_frontend_config(
                {"target": "production", "identity_url": url, "anon_key": token("anon")}
            )
    valid = {
        "target": "preproduction",
        "identity_url": "https://identity.example.test",
        "anon_key": token("anon"),
    }
    assert m.validate_frontend_config(valid) == valid


def test_fixture_build_is_explicit_and_not_a_production_alias():
    m = builder()
    fixture = {
        "target": "isolated-fixture",
        "identity_url": "https://127.0.0.1:9443",
        "anon_key": "public-fixture-only",
    }
    assert m.validate_frontend_config(fixture) == fixture
    with pytest.raises(ValueError):
        m.validate_frontend_config(dict(fixture, target="production"))


def test_public_build_accepts_current_opaque_anonymous_key():
    config = {'target':'preproduction','identity_url':'https://identity.example.test','anon_key':'anon_'+'a'*64}
    assert builder().validate_frontend_config(config) == config


@pytest.mark.parametrize('key', ['ik_'+'a'*64, 'anon_', 'anon_'+'a'*63, 'anon_'+'g'*64, 'anon_'+'a'*64+'\n'])
def test_public_build_rejects_malformed_opaque_keys(key):
    with pytest.raises(ValueError):
        builder().validate_frontend_config({'target':'preproduction','identity_url':'https://identity.example.test','anon_key':key})
