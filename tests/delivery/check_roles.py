"""Real HTTP role checks using synthetic identities; no authority is simulated here."""

from uuid import uuid4

from identity_fixture import TEAMS, USERS


def check_role_boundaries(client, base="/api/v1"):
    def headers(token):
        return {
            "Authorization": "Bearer " + token,
            "X-Team-ID": TEAMS["fixture-a"],
            "X-Workflow-ID": "delivery-role-check",
            "X-Trace-ID": str(uuid4()),
        }

    engineer = headers("fixture-a")
    reader = headers("fixture-reader")
    catalog = base + "/engineering/catalog/circuit"
    response = client.get(catalog, headers=reader)
    assert response.status_code == 200, ("reader authentication", response.status_code)
    body = {
        "operation_id": str(uuid4()),
        "body": {"name": "Synthetic delivery circuit"},
    }
    forged = {
        **reader,
        "X-Role": "admin",
        "X-Principal-Role": "admin",
        "X-Actor-ID": USERS["fixture-a"],
    }
    assert client.post(catalog, headers=forged, json=body).status_code == 403
    created = client.post(catalog, headers=engineer, json=body)
    assert created.status_code == 200, ("engineer create", created.status_code)
    item = created.json()
    assert item["team_id"] == TEAMS["fixture-a"]
    assert item["created_by"] == USERS["fixture-a"]
    url = catalog + "/" + item["id"]
    assert client.get(url, headers=reader).status_code == 200
    foreign = {"Authorization": "Bearer fixture-b", "X-Team-ID": TEAMS["fixture-b"]}
    assert client.get(url, headers=foreign).status_code == 404
    assert (
        client.put(
            url,
            headers=foreign,
            json={"expected_revision": 1, "body": {"name": "Foreign change"}},
        ).status_code
        == 404
    )
    assert (
        client.put(
            url,
            headers=reader,
            json={"expected_revision": 1, "body": {"name": "Reader change"}},
        ).status_code
        == 403
    )
    assert (
        client.delete(url + "?expected_revision=1", headers=reader).status_code == 403
    )
    poisoned = {
        "operation_id": str(uuid4()),
        "body": {"name": "Synthetic rejected owner", "team_id": TEAMS["fixture-b"]},
    }
    assert client.post(catalog, headers=engineer, json=poisoned).status_code == 422
    assert client.get(catalog, headers=headers("fixture-revoked")).status_code == 403
    final = client.get(url, headers=engineer)
    assert final.status_code == 200
    assert final.json()["revision"] == 1
    assert final.json()["name"] == body["body"]["name"]
    admin_a = headers('fixture-admin')
    assert client.get(url,headers=admin_a).status_code == 200
    admin_b = {**headers('fixture-badmin'),'X-Team-ID':TEAMS['fixture-b']}
    reader_b = {**headers('fixture-breader'),'X-Team-ID':TEAMS['fixture-b']}
    created_b = client.post(catalog,headers=admin_b,json={
        'operation_id':str(uuid4()),'body':{'name':'Synthetic B admin circuit'}})
    assert created_b.status_code == 200
    url_b = catalog+'/'+created_b.json()['id']
    assert client.get(url_b,headers=reader_b).status_code == 200
    assert client.post(catalog,headers=reader_b,json=body).status_code == 403
    assert client.get(url,headers=reader_b).status_code == 404
    assert client.get(url_b,headers=reader).status_code == 404
    updated_b = client.put(url_b,headers=foreign,json={
        'expected_revision':1,'body':{'name':'Synthetic B engineer revision'}})
    assert updated_b.status_code == 200
    assert client.put(url_b,headers=admin_b,json={
        'expected_revision':2,'body':{'name':'Synthetic B admin revision'}}).status_code == 200
    assert client.put(url_b,headers=reader_b,json={
        'expected_revision':3,'body':{'name':'Rejected B reader revision'}}).status_code == 403
    assert client.delete(url_b+'?expected_revision=3',headers=reader_b).status_code == 403
    return [
        "reader can read",
        "reader cannot create/update/delete",
        "headers cannot elevate role",
        "foreign resource read/write denied",
        "ownership set by server",
        "revoked membership denied",
        "rejected writes leave revision unchanged",
        "both teams have reader engineer and admin boundaries over HTTP",
    ]
