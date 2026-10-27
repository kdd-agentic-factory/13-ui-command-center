"""Actual SQL authority behind the isolated synthetic HTTPS issuer.

Never included in product images. Only loopback to a parent-owned PostgreSQL
fixture; no DSN, external hostname or operator credentials are accepted.
"""

import asyncio
import json
import re
import time
from hmac import compare_digest
from pathlib import Path

FUNCTIONS = frozenset(
    {
        "chassis_get_authority",
        "chassis_get_designation",
        "chassis_set_membership",
        "chassis_set_crew_chief_designation",
        "chassis_list_designation_candidates",
        "chassis_fence_session",
        "chassis_register_eligibility",
        "chassis_decide_proposal",
        "chassis_prepare_human_event",
        "chassis_record_human_event",
        "chassis_get_operation_receipt",
        "chassis_register_review_context",
    }
)


class SQLAuthority:
    def __init__(self, users, teams, roles, service_key):
        self.users, self.teams, self.roles, self.service_key = (
            users,
            teams,
            roles,
            service_key,
        )
        deadline = time.monotonic() + 30
        while True:
            try:
                asyncio.run(self.initialize())
                break
            except (OSError, ConnectionError):
                if time.monotonic() > deadline:
                    raise
                time.sleep(0.2)

    async def connect(self):
        import asyncpg

        return await asyncpg.connect(
            host="127.0.0.1", port=5432, user="postgres", database="postgres", timeout=5
        )

    async def initialize(self):
        connection = await self.connect()
        try:
            if await connection.fetchval(
                "SELECT to_regclass('public.chassis_team_memberships')"
            ):
                return
            await connection.execute("""
                CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE project_admin;
                CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
                CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
                $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
                GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,project_admin;
                GRANT REFERENCES ON auth.users TO project_admin; GRANT CREATE ON SCHEMA public TO project_admin;
            """)
            for name in (
                "012_chassis_teams.sql",
                "013_chassis_crew_chief_authority.sql",
            ):
                await connection.execute(
                    "SET ROLE project_admin;\n"
                    + (Path("/fixture-contracts") / name).read_text()
                )
            await connection.execute("RESET ROLE")
            for user in self.users.values():
                await connection.execute(
                    "INSERT INTO auth.users VALUES ($1::uuid)", user
                )
            for team in set(self.teams.values()):
                await connection.execute(
                    "INSERT INTO chassis_teams(id,name) VALUES ($1::uuid,'SYNTHETIC isolated delivery')",
                    team,
                )
            for token, user in self.users.items():
                await connection.execute(
                    "INSERT INTO chassis_team_memberships(team_id,user_id,role,active) VALUES ($1::uuid,$2::uuid,$3,$4)",
                    self.teams[token],
                    user,
                    self.roles.get(token, "engineer"),
                    token != "fixture-revoked",
                )
            for primary, substitute in [
                ("fixture-a", "fixture-sub"),
                ("fixture-b", "fixture-bsub"),
            ]:
                await connection.execute(
                    "INSERT INTO chassis_crew_chief_designations(team_id,primary_id,substitute_id,revision) VALUES ($1::uuid,$2::uuid,$3::uuid,1)",
                    self.teams[primary],
                    self.users[primary],
                    self.users[substitute],
                )
            # One authorized multi-team human exercises switching before dispatch.
            await connection.execute(
                "INSERT INTO chassis_team_memberships(team_id,user_id,role,active) VALUES ($1::uuid,$2::uuid,'engineer',true)",
                self.teams['fixture-b'], self.users['fixture-admin'],
            )
        finally:
            await connection.close()

    async def execute(self, token, statement, *, rows=False):
        connection = await self.connect()
        try:
            async with connection.transaction():
                if compare_digest(token, self.service_key):
                    await connection.execute("SET LOCAL ROLE project_admin")
                elif token in self.users:
                    await connection.execute("SET LOCAL ROLE authenticated")
                    await connection.execute(
                        "SELECT set_config('request.jwt.claim.sub',$1,true)",
                        self.users[token],
                    )
                else:
                    return 401, {}
                if rows:
                    return 200, [dict(row) for row in await connection.fetch(statement)]
                result = await connection.fetchval(statement)
                return 200, json.loads(result) if isinstance(result, str) else result
        except Exception as error:  # noqa: BLE001 - redacted test-transport SQLSTATE boundary
            state = getattr(error, "sqlstate", "")
            return (
                403
                if state == "42501"
                else 409
                if state in ("PT409", "40001")
                else 400
                if state == "22023"
                else 500
            ), {}
        finally:
            await connection.close()

    def memberships(self, token):
        return asyncio.run(
            self.execute(
                token,
                "SELECT team_id::text,user_id::text,role,active FROM public.chassis_team_memberships WHERE active",
                rows=True,
            )
        )

    def rpc(self, token, function, body):
        if (
            function not in FUNCTIONS
            or not isinstance(body, dict)
            or any(not re.fullmatch("p_[a-z_]+", key) for key in body)
        ):
            return 404, {}

        def literal(value):
            if value is None:
                return "NULL"
            if type(value) is int:
                return str(value)
            if type(value) is bool:
                return "true" if value else "false"
            text = json.dumps(value) if isinstance(value, (dict, list)) else str(value)
            return "'" + text.replace("'", "''") + "'"

        statement = (
            "SELECT public."
            + function
            + "("
            + ",".join(key + " => " + literal(value) for key, value in body.items())
            + ");"
        )
        return asyncio.run(self.execute(token, statement))
