import json
from pathlib import Path


def test_commercial_compose_constrains_all_services():
    data = json.loads(Path("deploy/compose.chassis.yml").read_text())
    services = data["services"]
    assert set(services) == {"frontend", "api", "gateway", "worker"}
    for name, service in services.items():
        assert service["read_only"] is True
        assert service["cap_drop"] == ["ALL"]
        assert service["security_opt"] == ["no-new-privileges:true"]
        assert service["pids_limit"] == 128
        assert service["user"] in ["1000:1000", "101:101"]
        assert ":?" in service["image"]
        assert "build" not in service
        if name != "frontend":
            assert "ports" not in service
    assert services["gateway"]["network_mode"] == "service:api"
    assert services["worker"]["network_mode"] == "service:api"
    assert services["api"]["environment"]["TDS_PRODUCT_PROFILE"] == "chassis"
    assert services["api"]["environment"]["TDS_IDENTITY_MODE"] == "authenticated"
    assert all(
        "state:" not in volume
        for name in ["gateway", "worker", "frontend"]
        for volume in services[name].get("volumes", [])
    )


def test_delivery_requires_real_authority_and_explicit_local_model_configuration():
    import json
    config=json.loads(Path("deploy/compose.chassis.yml").read_text())
    api=config["services"]["api"]
    env=api["environment"]
    assert env["TDS_ENGINEERING_AUTHORITY_MODE"]=="insforge"
    assert env["TDS_ENGINEERING_AUTHORITY_SERVICE_KEY_FILE"]=="/run/secrets/authority_key"
    assert "ENGINEERING_MODEL_URL:?" in env["TDS_ENGINEERING_MODEL_URL"]
    assert "ENGINEERING_MODEL_NAME:?" in env["TDS_ENGINEERING_MODEL_NAME"]
    assert any("AUTHORITY_KEY_FILE:?" in mount and mount.endswith(":/run/secrets/authority_key:ro") for mount in api["volumes"])
    for service in ("gateway","worker","frontend"):
        assert not any("AUTHORITY_KEY_FILE" in mount for mount in config["services"][service]["volumes"])
