-- Local review artifact, NOT applied to cloud. Legacy plan filename retained.
-- Activation must mint a current timestamp/hyphen CLI migration after history review.
-- Run as project_admin; the migration executor owns the enclosing transaction.
CREATE TABLE public.chassis_crew_chief_designations (
 team_id uuid PRIMARY KEY REFERENCES public.chassis_teams(id),
 primary_id uuid REFERENCES auth.users(id), substitute_id uuid REFERENCES auth.users(id),
 revision bigint NOT NULL CHECK(revision>=1),
 CHECK(primary_id IS DISTINCT FROM substitute_id OR primary_id IS NULL)
);
CREATE TABLE public.chassis_designation_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), team_id uuid NOT NULL REFERENCES public.chassis_teams(id),
 revision bigint NOT NULL, actor_id uuid NOT NULL REFERENCES auth.users(id),
 primary_id uuid REFERENCES auth.users(id), substitute_id uuid REFERENCES auth.users(id),
 reason text NOT NULL CHECK(reason IN ('designated','membership_revoked')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), UNIQUE(team_id,revision)
);
CREATE TABLE public.chassis_authority_heads (
 team_id uuid NOT NULL REFERENCES public.chassis_teams(id), session_id uuid NOT NULL,
 generation bigint NOT NULL CHECK(generation>=0),
 state text NOT NULL CHECK(state IN ('fenced','eligible','decided')),
 proposal_id uuid, PRIMARY KEY(team_id,session_id)
);
CREATE TABLE public.chassis_proposal_eligibility (
 team_id uuid NOT NULL, session_id uuid NOT NULL, generation bigint NOT NULL,
 proposal_id uuid NOT NULL, proposal_revision bigint NOT NULL CHECK(proposal_revision>=1),
 proposal_digest text NOT NULL CHECK(proposal_digest ~ '^[0-9a-f]{64}$'),
 snapshot_digest text NOT NULL CHECK(snapshot_digest ~ '^[0-9a-f]{64}$'),
 certificate jsonb NOT NULL CHECK(jsonb_typeof(certificate)='object' AND octet_length(certificate::text)<=16384),
 PRIMARY KEY(team_id,session_id,generation), UNIQUE(team_id,proposal_id),
 FOREIGN KEY(team_id,session_id) REFERENCES public.chassis_authority_heads(team_id,session_id)
);
CREATE TABLE public.chassis_approval_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), team_id uuid NOT NULL, session_id uuid NOT NULL,
 proposal_id uuid NOT NULL, generation bigint NOT NULL, designation_revision bigint NOT NULL,
 actor_id uuid NOT NULL REFERENCES auth.users(id), action text NOT NULL CHECK(action IN ('approve','reject','request_revision')),
 note text NOT NULL CHECK(length(note)<=2000), proposal_digest text NOT NULL, snapshot_digest text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(team_id,proposal_id), FOREIGN KEY(team_id,session_id,generation) REFERENCES public.chassis_proposal_eligibility(team_id,session_id,generation)
);
CREATE TABLE public.chassis_authority_operations (
 team_id uuid NOT NULL REFERENCES public.chassis_teams(id), actor text NOT NULL,
 operation uuid NOT NULL, fingerprint jsonb NOT NULL, result jsonb NOT NULL,
 PRIMARY KEY(team_id,actor,operation)
);
ALTER TABLE public.chassis_crew_chief_designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chassis_designation_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chassis_authority_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chassis_proposal_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chassis_approval_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chassis_authority_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chassis_crew_chief_designations,public.chassis_designation_audit,
 public.chassis_authority_heads,public.chassis_proposal_eligibility,public.chassis_approval_events,
 public.chassis_authority_operations FROM PUBLIC,anon,authenticated;
-- Read-only projection through a locked RPC; private certificates/notes are never table-readable.
CREATE FUNCTION public.chassis_get_authority(p_team uuid,p_session uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE h public.chassis_authority_heads; d public.chassis_crew_chief_designations;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'authenticated' THEN RAISE EXCEPTION 'Human session required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.chassis_teams WHERE id=p_team FOR UPDATE;
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.chassis_team_memberships WHERE team_id=p_team AND user_id=auth.uid() AND active) THEN
  RAISE EXCEPTION 'Membership required' USING ERRCODE='42501'; END IF;
 SELECT * INTO h FROM public.chassis_authority_heads WHERE team_id=p_team AND session_id=p_session;
 SELECT * INTO d FROM public.chassis_crew_chief_designations WHERE team_id=p_team;
 RETURN jsonb_build_object('team_id',p_team,'session_id',p_session,'generation',coalesce(h.generation,0),'available',true,
  'state',coalesce(h.state,'fenced'),'designation_revision',coalesce(d.revision,0),'primary_id',d.primary_id,'substitute_id',d.substitute_id);
END $$;

CREATE FUNCTION public.chassis_set_crew_chief_designation(p_team uuid,p_primary uuid,p_substitute uuid,p_expected_revision bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE actor uuid := auth.uid(); rev bigint;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'authenticated' THEN RAISE EXCEPTION 'Human session required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.chassis_teams WHERE id=p_team FOR UPDATE;
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM public.chassis_team_memberships WHERE team_id=p_team AND user_id=actor AND role='admin' AND active) THEN
  RAISE EXCEPTION 'Team admin required' USING ERRCODE='42501'; END IF;
 IF p_primary IS NULL OR p_primary=p_substitute THEN RAISE EXCEPTION 'Distinct primary and substitute required' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.chassis_team_memberships WHERE team_id=p_team AND user_id=p_primary AND active AND role IN ('admin','engineer'))
 OR (p_substitute IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.chassis_team_memberships WHERE team_id=p_team AND user_id=p_substitute AND active AND role IN ('admin','engineer'))) THEN
  RAISE EXCEPTION 'Active engineer/admin required' USING ERRCODE='42501'; END IF;
 SELECT revision INTO rev FROM public.chassis_crew_chief_designations WHERE team_id=p_team;
 IF p_expected_revision IS DISTINCT FROM coalesce(rev,0) THEN RAISE EXCEPTION 'Designation conflict' USING ERRCODE='PT409'; END IF;
 rev := coalesce(rev,0)+1;
 INSERT INTO public.chassis_crew_chief_designations VALUES(p_team,p_primary,p_substitute,rev)
 ON CONFLICT(team_id) DO UPDATE SET primary_id=excluded.primary_id,substitute_id=excluded.substitute_id,revision=excluded.revision;
 INSERT INTO public.chassis_designation_audit(team_id,revision,actor_id,primary_id,substitute_id,reason) VALUES(p_team,rev,actor,p_primary,p_substitute,'designated');
 RETURN jsonb_build_object('team_id',p_team,'primary_id',p_primary,'substitute_id',p_substitute,'revision',rev);
END $$;

-- Supersedes 012 without rewriting migration history. Every path uses the same team lock.
CREATE OR REPLACE FUNCTION public.chassis_set_membership(p_team uuid,p_user uuid,p_role text,p_active boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE actor uuid := auth.uid(); d public.chassis_crew_chief_designations;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'authenticated' THEN RAISE EXCEPTION 'Human session required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.chassis_teams WHERE id=p_team FOR UPDATE;
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM public.chassis_team_memberships WHERE team_id=p_team AND user_id=actor AND role='admin' AND active) THEN
  RAISE EXCEPTION 'Team admin membership required' USING ERRCODE='42501'; END IF;
 IF p_role IS NULL OR p_role NOT IN ('reader','engineer','admin') OR p_active IS NULL THEN RAISE EXCEPTION 'Invalid membership' USING ERRCODE='22023'; END IF;
 IF (p_role<>'admin' OR NOT p_active) AND EXISTS(SELECT 1 FROM public.chassis_team_memberships WHERE team_id=p_team AND user_id=p_user AND role='admin' AND active)
 AND (SELECT count(*) FROM public.chassis_team_memberships WHERE team_id=p_team AND role='admin' AND active)<=1 THEN RAISE EXCEPTION 'Cannot remove last active admin' USING ERRCODE='PT409'; END IF;
 INSERT INTO public.chassis_team_memberships(team_id,user_id,role,active) VALUES(p_team,p_user,p_role,p_active)
 ON CONFLICT(team_id,user_id) DO UPDATE SET role=excluded.role,active=excluded.active,updated_at=now();
 INSERT INTO public.chassis_membership_audit(team_id,actor_id,target_id,role,active) VALUES(p_team,actor,p_user,p_role,p_active);
 IF NOT p_active OR p_role='reader' THEN
  UPDATE public.chassis_crew_chief_designations SET
   primary_id=CASE WHEN primary_id=p_user THEN NULL ELSE primary_id END,
   substitute_id=CASE WHEN substitute_id=p_user THEN NULL ELSE substitute_id END,revision=revision+1
  WHERE team_id=p_team AND (primary_id=p_user OR substitute_id=p_user) RETURNING * INTO d;
  IF FOUND THEN INSERT INTO public.chassis_designation_audit(team_id,revision,actor_id,primary_id,substitute_id,reason)
   VALUES(p_team,d.revision,actor,d.primary_id,d.substitute_id,'membership_revoked'); END IF;
 END IF;
END $$;

-- Helpers are private; even authenticated callers cannot register certificates.
CREATE FUNCTION public.chassis_fence_session(p_team uuid,p_session uuid,p_expected_generation bigint,p_operation uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE h public.chassis_authority_heads; op public.chassis_authority_operations; fp jsonb; result jsonb;
BEGIN
 PERFORM 1 FROM public.chassis_teams WHERE id=p_team FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown team' USING ERRCODE='PT409'; END IF;
 IF p_session IS NULL OR p_operation IS NULL OR p_expected_generation IS NULL OR p_expected_generation<0 THEN RAISE EXCEPTION 'Invalid fence' USING ERRCODE='22023'; END IF;
 fp := jsonb_build_array('fence',p_session,p_expected_generation);
 SELECT * INTO h FROM public.chassis_authority_heads WHERE team_id=p_team AND session_id=p_session;
 SELECT * INTO op FROM public.chassis_authority_operations WHERE team_id=p_team AND actor='service' AND operation=p_operation;
 IF FOUND THEN
  IF op.fingerprint<>fp OR h.generation IS DISTINCT FROM p_expected_generation+1 OR h.state IS DISTINCT FROM 'fenced' THEN
   RAISE EXCEPTION 'Fence replay no longer current' USING ERRCODE='PT409'; END IF;
  RETURN op.result;
 END IF;
 IF coalesce(h.generation,0)<>p_expected_generation THEN RAISE EXCEPTION 'Generation conflict' USING ERRCODE='PT409'; END IF;
 INSERT INTO public.chassis_authority_heads VALUES(p_team,p_session,p_expected_generation+1,'fenced',NULL)
 ON CONFLICT(team_id,session_id) DO UPDATE SET generation=excluded.generation,state='fenced',proposal_id=NULL;
 result := jsonb_build_object('team_id',p_team,'session_id',p_session,'generation',p_expected_generation+1,'available',true);
 INSERT INTO public.chassis_authority_operations VALUES(p_team,'service',p_operation,fp,result);
 RETURN result;
END $$;

CREATE FUNCTION public.chassis_register_eligibility(p_team uuid,p_session uuid,p_generation bigint,p_proposal uuid,p_proposal_revision bigint,p_proposal_digest text,p_snapshot_digest text,p_eligibility jsonb,p_operation uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE h public.chassis_authority_heads; op public.chassis_authority_operations; fp jsonb; result jsonb;
BEGIN
 PERFORM 1 FROM public.chassis_teams WHERE id=p_team FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown team' USING ERRCODE='PT409'; END IF;
 IF p_session IS NULL OR p_operation IS NULL OR p_proposal IS NULL OR p_generation IS NULL OR p_generation<0 OR p_proposal_revision IS NULL OR p_proposal_revision<1
 OR p_proposal_digest IS NULL OR p_proposal_digest !~ '^[0-9a-f]{64}$' OR p_snapshot_digest IS NULL OR p_snapshot_digest !~ '^[0-9a-f]{64}$'
 OR p_eligibility IS NULL OR jsonb_typeof(p_eligibility)<>'object' OR octet_length(p_eligibility::text)>16384
 OR p_eligibility - ARRAY['schema_version','session_revision','snapshot_revision','run_revision','run_id','request_origin','blocked_reasons','gates'] <> '{}'::jsonb
 OR jsonb_typeof(p_eligibility->'session_revision') IS DISTINCT FROM 'number'
 OR jsonb_typeof(p_eligibility->'snapshot_revision') IS DISTINCT FROM 'number'
 OR jsonb_typeof(p_eligibility->'run_revision') IS DISTINCT FROM 'number'
 OR p_eligibility->>'schema_version' IS DISTINCT FROM '1.0.0'
 OR coalesce(p_eligibility->>'session_revision','') !~ '^[1-9][0-9]*$'
 OR coalesce(p_eligibility->>'snapshot_revision','') !~ '^[1-9][0-9]*$'
 OR coalesce(p_eligibility->>'run_revision','') !~ '^[1-9][0-9]*$'
 OR coalesce(p_eligibility->>'run_id','') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 OR coalesce(p_eligibility->>'request_origin','') NOT IN ('human','agent')
 OR p_eligibility->'blocked_reasons' IS DISTINCT FROM '[]'::jsonb
 OR p_eligibility->'gates' IS DISTINCT FROM '{"inputs_valid":true,"branches_sealed":true,"independence_checked":true,"conflicts_resolved":true,"domain_valid":true,"source_valid":true}'::jsonb
 THEN RAISE EXCEPTION 'Invalid or blocked eligibility' USING ERRCODE='22023'; END IF;
 fp := jsonb_build_array('eligibility',p_session,p_generation,p_proposal,p_proposal_revision,p_proposal_digest,p_snapshot_digest,p_eligibility);
 SELECT * INTO h FROM public.chassis_authority_heads WHERE team_id=p_team AND session_id=p_session;
 SELECT * INTO op FROM public.chassis_authority_operations WHERE team_id=p_team AND actor='service' AND operation=p_operation;
 IF FOUND THEN
  IF op.fingerprint<>fp OR h.generation IS DISTINCT FROM p_generation OR h.state IS DISTINCT FROM 'eligible' OR h.proposal_id IS DISTINCT FROM p_proposal THEN RAISE EXCEPTION 'Eligibility replay conflict' USING ERRCODE='PT409'; END IF;
  RETURN op.result;
 END IF;
 IF coalesce(h.generation,0)<>p_generation OR coalesce(h.state,'fenced')<>'fenced'
 OR EXISTS(SELECT 1 FROM public.chassis_proposal_eligibility WHERE team_id=p_team AND proposal_id=p_proposal) THEN RAISE EXCEPTION 'Eligibility head conflict' USING ERRCODE='PT409'; END IF;
 INSERT INTO public.chassis_authority_heads VALUES(p_team,p_session,p_generation,'eligible',p_proposal)
 ON CONFLICT(team_id,session_id) DO UPDATE SET state='eligible',proposal_id=p_proposal;
 INSERT INTO public.chassis_proposal_eligibility VALUES(p_team,p_session,p_generation,p_proposal,p_proposal_revision,p_proposal_digest,p_snapshot_digest,p_eligibility);
 result := jsonb_build_object('team_id',p_team,'session_id',p_session,'generation',p_generation,'available',true);
 INSERT INTO public.chassis_authority_operations VALUES(p_team,'service',p_operation,fp,result);
 RETURN result;
END $$;

CREATE FUNCTION public.chassis_decide_proposal(p_team uuid,p_session uuid,p_proposal uuid,p_expected_generation bigint,p_expected_designation_revision bigint,p_proposal_digest text,p_snapshot_digest text,p_action text,p_note text,p_operation uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE actor uuid := auth.uid(); d public.chassis_crew_chief_designations; h public.chassis_authority_heads;
 e public.chassis_proposal_eligibility; op public.chassis_authority_operations; fp jsonb; result jsonb; event_id uuid;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'authenticated' THEN RAISE EXCEPTION 'Human session required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.chassis_teams WHERE id=p_team FOR UPDATE;
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM public.chassis_team_memberships WHERE team_id=p_team AND user_id=actor AND active AND role IN ('engineer','admin')) THEN RAISE EXCEPTION 'Human membership required' USING ERRCODE='42501'; END IF;
 SELECT * INTO d FROM public.chassis_crew_chief_designations WHERE team_id=p_team;
 IF actor IS DISTINCT FROM d.primary_id AND actor IS DISTINCT FROM d.substitute_id THEN RAISE EXCEPTION 'Designated human required' USING ERRCODE='42501'; END IF;
 IF p_action IS NULL OR p_action NOT IN ('approve','reject','request_revision') OR p_note IS NULL OR length(p_note)>2000 OR p_operation IS NULL THEN RAISE EXCEPTION 'Invalid decision' USING ERRCODE='22023'; END IF;
 fp := jsonb_build_array('decision',p_session,p_proposal,p_expected_generation,p_expected_designation_revision,p_proposal_digest,p_snapshot_digest,p_action,p_note);
 SELECT * INTO op FROM public.chassis_authority_operations ops WHERE ops.team_id=p_team AND ops.actor=auth.uid()::text AND ops.operation=p_operation;
 IF FOUND THEN
  IF op.fingerprint<>fp THEN RAISE EXCEPTION 'Incompatible operation' USING ERRCODE='PT409'; END IF;
  -- Historical receipt only, never a claim of current approval after a later fence.
  RETURN op.result;
 END IF;
 SELECT * INTO h FROM public.chassis_authority_heads WHERE team_id=p_team AND session_id=p_session;
 SELECT * INTO e FROM public.chassis_proposal_eligibility WHERE team_id=p_team AND session_id=p_session AND generation=p_expected_generation;
 IF d.revision IS DISTINCT FROM p_expected_designation_revision OR h.generation IS DISTINCT FROM p_expected_generation OR h.state IS NULL OR h.state NOT IN ('fenced','eligible')
 OR h.proposal_id IS DISTINCT FROM p_proposal OR e.proposal_id IS DISTINCT FROM p_proposal OR e.proposal_digest IS DISTINCT FROM p_proposal_digest OR e.snapshot_digest IS DISTINCT FROM p_snapshot_digest
 OR (p_action='approve' AND (h.state IS DISTINCT FROM 'eligible' OR e.certificate->'blocked_reasons' IS DISTINCT FROM '[]'::jsonb
 OR e.certificate->'gates' IS DISTINCT FROM '{"inputs_valid":true,"branches_sealed":true,"independence_checked":true,"conflicts_resolved":true,"domain_valid":true,"source_valid":true}'::jsonb)) THEN RAISE EXCEPTION 'Proposal no longer eligible' USING ERRCODE='PT409'; END IF;
 INSERT INTO public.chassis_approval_events(team_id,session_id,proposal_id,generation,designation_revision,actor_id,action,note,proposal_digest,snapshot_digest)
 VALUES(p_team,p_session,p_proposal,p_expected_generation,d.revision,actor,p_action,p_note,p_proposal_digest,p_snapshot_digest) RETURNING id INTO event_id;
 UPDATE public.chassis_authority_heads SET state='decided' WHERE team_id=p_team AND session_id=p_session;
 result := jsonb_build_object('id',event_id,'action',p_action,'generation',p_expected_generation);
 INSERT INTO public.chassis_authority_operations VALUES(p_team,actor::text,p_operation,fp,result);
 RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.chassis_get_authority(uuid,uuid),public.chassis_set_crew_chief_designation(uuid,uuid,uuid,bigint),public.chassis_set_membership(uuid,uuid,text,boolean),public.chassis_decide_proposal(uuid,uuid,uuid,bigint,bigint,text,text,text,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.chassis_get_authority(uuid,uuid),public.chassis_set_crew_chief_designation(uuid,uuid,uuid,bigint),public.chassis_set_membership(uuid,uuid,text,boolean),public.chassis_decide_proposal(uuid,uuid,uuid,bigint,bigint,text,text,text,text,uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.chassis_fence_session(uuid,uuid,bigint,uuid),public.chassis_register_eligibility(uuid,uuid,bigint,uuid,bigint,text,text,jsonb,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.chassis_fence_session(uuid,uuid,bigint,uuid),public.chassis_register_eligibility(uuid,uuid,bigint,uuid,bigint,text,text,jsonb,uuid) TO project_admin;

-- Bounded admin-only UUID/role candidates. No profile or user identity fields.
CREATE FUNCTION public.chassis_list_designation_candidates(p_team uuid,p_limit integer DEFAULT 20,p_after uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'authenticated' THEN RAISE EXCEPTION 'Human session required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.chassis_teams WHERE id=p_team FOR UPDATE;
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.chassis_team_memberships WHERE team_id=p_team AND user_id=auth.uid() AND role='admin' AND active) THEN RAISE EXCEPTION 'Team admin required' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit<1 OR p_limit>100 THEN RAISE EXCEPTION 'Invalid page limit' USING ERRCODE='22023'; END IF;
 RETURN (SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.user_id),'[]'::jsonb) FROM (
  SELECT user_id,role FROM public.chassis_team_memberships WHERE team_id=p_team AND active AND role IN ('engineer','admin') AND (p_after IS NULL OR user_id>p_after) ORDER BY user_id LIMIT p_limit
 ) c);
END $$;
REVOKE ALL ON FUNCTION public.chassis_list_designation_candidates(uuid,integer,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.chassis_list_designation_candidates(uuid,integer,uuid) TO authenticated;

-- Task8 additive local-only protocol. Exact head projection, immutable human events,
-- and narrow server-only recovery of already persisted operation intents.
CREATE OR REPLACE FUNCTION public.chassis_get_authority(p_team uuid,p_session uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE h public.chassis_authority_heads; d public.chassis_crew_chief_designations; e public.chassis_proposal_eligibility; a public.chassis_approval_events;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'authenticated' THEN RAISE EXCEPTION 'Human session required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.chassis_teams WHERE id=p_team FOR UPDATE;
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.chassis_team_memberships WHERE team_id=p_team AND user_id=auth.uid() AND active) THEN RAISE EXCEPTION 'Membership required' USING ERRCODE='42501'; END IF;
 SELECT * INTO h FROM public.chassis_authority_heads WHERE team_id=p_team AND session_id=p_session;
 SELECT * INTO d FROM public.chassis_crew_chief_designations WHERE team_id=p_team;
 SELECT * INTO e FROM public.chassis_proposal_eligibility WHERE team_id=p_team AND proposal_id=h.proposal_id;
 SELECT * INTO a FROM public.chassis_approval_events WHERE team_id=p_team AND proposal_id=h.proposal_id;
 RETURN jsonb_build_object('team_id',p_team,'session_id',p_session,'generation',coalesce(h.generation,0),'available',true,'state',coalesce(h.state,'fenced'),
 'designation_revision',coalesce(d.revision,0),'primary_id',d.primary_id,'substitute_id',d.substitute_id,
 'proposal_id',h.proposal_id,'proposal_revision',e.proposal_revision,'proposal_digest',e.proposal_digest,'snapshot_digest',e.snapshot_digest,
 'session_revision',(e.certificate->>'session_revision')::bigint,'run_id',e.certificate->>'run_id',
 'decision_id',a.id,'decision_action',a.action,'decision_designation_revision',a.designation_revision);
END $$;

CREATE TABLE public.chassis_human_event_intents (
 team_id uuid NOT NULL REFERENCES public.chassis_teams(id), actor_id uuid NOT NULL REFERENCES auth.users(id), operation uuid NOT NULL,
 request jsonb NOT NULL CHECK(jsonb_typeof(request)='object' AND octet_length(request::text)<=16384),
 PRIMARY KEY(team_id,actor_id,operation)
);
CREATE TABLE public.chassis_human_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), team_id uuid NOT NULL REFERENCES public.chassis_teams(id),
 session_id uuid NOT NULL, proposal_id uuid NOT NULL, generation bigint NOT NULL, designation_revision bigint NOT NULL,
 actor_id uuid NOT NULL REFERENCES auth.users(id), kind text NOT NULL CHECK(kind IN ('application','validation')),
 parent_event_id uuid NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(team_id,kind,parent_event_id), FOREIGN KEY(team_id,proposal_id) REFERENCES public.chassis_proposal_eligibility(team_id,proposal_id)
);
ALTER TABLE public.chassis_human_event_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chassis_human_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chassis_human_event_intents,public.chassis_human_events FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.chassis_prepare_human_event(p_team uuid,p_actor uuid,p_operation uuid,p_request jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE existing jsonb;
BEGIN
 PERFORM 1 FROM public.chassis_teams WHERE id=p_team FOR UPDATE;
 IF NOT FOUND OR p_actor IS NULL OR p_operation IS NULL OR p_request IS NULL OR jsonb_typeof(p_request)<>'object'
 OR p_request->>'kind' NOT IN ('application','validation') OR octet_length(p_request::text)>16384
 OR p_request - ARRAY['kind','session_id','proposal_id','expected_generation','expected_designation_revision','proposal_digest','snapshot_digest','parent_event_id','payload'] <> '{}'::jsonb
 THEN RAISE EXCEPTION 'Invalid event intent' USING ERRCODE='22023'; END IF;
 SELECT request INTO existing FROM public.chassis_human_event_intents WHERE team_id=p_team AND actor_id=p_actor AND operation=p_operation;
 IF FOUND THEN
  IF existing<>p_request THEN RAISE EXCEPTION 'Incompatible event intent' USING ERRCODE='PT409'; END IF;
 ELSE
  INSERT INTO public.chassis_human_event_intents VALUES(p_team,p_actor,p_operation,p_request);
 END IF;
 RETURN jsonb_build_object('prepared',true);
END $$;

CREATE FUNCTION public.chassis_record_human_event(p_team uuid,p_operation uuid,p_request jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE actor uuid := auth.uid(); d public.chassis_crew_chief_designations; h public.chassis_authority_heads; e public.chassis_proposal_eligibility;
 a public.chassis_approval_events; parent public.chassis_human_events; intent jsonb; op public.chassis_authority_operations; event_id uuid; result jsonb; kind text;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'authenticated' THEN RAISE EXCEPTION 'Human session required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.chassis_teams WHERE id=p_team FOR UPDATE;
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM public.chassis_team_memberships WHERE team_id=p_team AND user_id=actor AND active AND role IN ('engineer','admin')) THEN RAISE EXCEPTION 'Human membership required' USING ERRCODE='42501'; END IF;
 SELECT * INTO d FROM public.chassis_crew_chief_designations WHERE team_id=p_team;
 IF actor IS DISTINCT FROM d.primary_id AND actor IS DISTINCT FROM d.substitute_id THEN RAISE EXCEPTION 'Designated human required' USING ERRCODE='42501'; END IF;
 SELECT request INTO intent FROM public.chassis_human_event_intents WHERE team_id=p_team AND actor_id=actor AND operation=p_operation;
 IF intent IS NULL OR intent<>p_request THEN RAISE EXCEPTION 'Verified server event intent required' USING ERRCODE='42501'; END IF;
 SELECT * INTO op FROM public.chassis_authority_operations WHERE chassis_authority_operations.team_id=p_team AND chassis_authority_operations.actor=auth.uid()::text AND operation=p_operation;
 IF FOUND THEN
  IF op.fingerprint<>jsonb_build_array('human_event',p_request) THEN RAISE EXCEPTION 'Incompatible operation' USING ERRCODE='PT409'; END IF;
  RETURN op.result;
 END IF;
 SELECT * INTO h FROM public.chassis_authority_heads WHERE team_id=p_team AND session_id=(p_request->>'session_id')::uuid;
 SELECT * INTO e FROM public.chassis_proposal_eligibility WHERE team_id=p_team AND proposal_id=(p_request->>'proposal_id')::uuid;
 SELECT * INTO a FROM public.chassis_approval_events WHERE team_id=p_team AND proposal_id=(p_request->>'proposal_id')::uuid;
 IF d.revision IS DISTINCT FROM (p_request->>'expected_designation_revision')::bigint THEN RAISE EXCEPTION 'Designation conflict' USING ERRCODE='PT409'; END IF;
 kind := p_request->>'kind';
 IF kind='application' AND (a.designation_revision IS DISTINCT FROM d.revision
 OR h.generation IS DISTINCT FROM (p_request->>'expected_generation')::bigint OR h.state IS DISTINCT FROM 'decided'
 OR h.proposal_id IS DISTINCT FROM e.proposal_id OR e.proposal_id IS DISTINCT FROM (p_request->>'proposal_id')::uuid
 OR e.proposal_digest IS DISTINCT FROM p_request->>'proposal_digest' OR e.snapshot_digest IS DISTINCT FROM p_request->>'snapshot_digest'
 OR a.action IS DISTINCT FROM 'approve') THEN RAISE EXCEPTION 'Approval no longer current' USING ERRCODE='PT409'; END IF;
 kind := p_request->>'kind';
 IF kind='application' THEN
  IF a.id IS DISTINCT FROM (p_request->>'parent_event_id')::uuid THEN RAISE EXCEPTION 'Approval parent conflict' USING ERRCODE='PT409'; END IF;
 ELSIF kind='validation' THEN
  SELECT * INTO parent FROM public.chassis_human_events WHERE team_id=p_team AND id=(p_request->>'parent_event_id')::uuid AND chassis_human_events.kind='application';
  IF parent.proposal_id IS DISTINCT FROM (p_request->>'proposal_id')::uuid OR parent.session_id IS DISTINCT FROM (p_request->>'session_id')::uuid OR parent.generation IS DISTINCT FROM (p_request->>'expected_generation')::bigint OR e.proposal_digest IS DISTINCT FROM p_request->>'proposal_digest' OR e.snapshot_digest IS DISTINCT FROM p_request->>'snapshot_digest' THEN RAISE EXCEPTION 'Application required' USING ERRCODE='PT409'; END IF;
 ELSE RAISE EXCEPTION 'Invalid event kind' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM public.chassis_human_events WHERE team_id=p_team AND chassis_human_events.kind=p_request->>'kind' AND parent_event_id=(p_request->>'parent_event_id')::uuid) THEN RAISE EXCEPTION 'Event already recorded' USING ERRCODE='PT409'; END IF;
 INSERT INTO public.chassis_human_events(team_id,session_id,proposal_id,generation,designation_revision,actor_id,kind,parent_event_id,payload)
 VALUES(p_team,(p_request->>'session_id')::uuid,(p_request->>'proposal_id')::uuid,(p_request->>'expected_generation')::bigint,d.revision,actor,kind,(p_request->>'parent_event_id')::uuid,p_request->'payload') RETURNING id INTO event_id;
 result := jsonb_build_object('id',event_id,'kind',kind,'generation',(p_request->>'expected_generation')::bigint);
 INSERT INTO public.chassis_authority_operations VALUES(p_team,actor::text,p_operation,jsonb_build_array('human_event',p_request),result);
 RETURN result;
END $$;

CREATE FUNCTION public.chassis_get_operation_receipt(p_team uuid,p_actor uuid,p_operation uuid,p_request jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE op public.chassis_authority_operations; a public.chassis_approval_events; e public.chassis_human_events; cert public.chassis_proposal_eligibility; fp jsonb;
BEGIN
 -- Service-only read is scoped by an existing durable backend intent, never a public listing.
 PERFORM 1 FROM public.chassis_teams WHERE id=p_team FOR UPDATE;
 IF p_request->>'kind'='decision' THEN
  fp:=jsonb_build_array('decision',p_request->>'session_id',p_request->>'proposal_id',(p_request->>'expected_generation')::bigint,(p_request->>'expected_designation_revision')::bigint,p_request->>'proposal_digest',p_request->>'snapshot_digest',p_request->>'action',p_request->>'note');
 ELSE fp:=jsonb_build_array('human_event',p_request); END IF;
 SELECT * INTO op FROM public.chassis_authority_operations WHERE team_id=p_team AND actor=p_actor::text AND operation=p_operation;
 IF NOT FOUND THEN RETURN 'null'::jsonb; END IF;
 IF op.fingerprint IS DISTINCT FROM fp THEN RAISE EXCEPTION 'Receipt request mismatch' USING ERRCODE='PT409'; END IF;
 IF p_request->>'kind'='decision' THEN
  SELECT * INTO a FROM public.chassis_approval_events WHERE id=(op.result->>'id')::uuid AND team_id=p_team AND actor_id=p_actor;
  RETURN jsonb_build_object('id',a.id,'kind','decision','action',a.action,'actor_id',a.actor_id,'designation_revision',a.designation_revision,'created_at',a.created_at,'generation',a.generation,'authority_proposal_id',a.proposal_id,'proposal_digest',a.proposal_digest,'snapshot_digest',a.snapshot_digest,'parent_event_id',NULL,'payload',jsonb_build_object('note',a.note));
 END IF;
 SELECT * INTO e FROM public.chassis_human_events WHERE id=(op.result->>'id')::uuid AND team_id=p_team AND actor_id=p_actor;
 SELECT * INTO cert FROM public.chassis_proposal_eligibility WHERE team_id=p_team AND proposal_id=e.proposal_id;
 RETURN jsonb_build_object('id',e.id,'kind',e.kind,'action',NULL,'actor_id',e.actor_id,'designation_revision',e.designation_revision,'created_at',e.created_at,'generation',e.generation,'authority_proposal_id',e.proposal_id,'proposal_digest',cert.proposal_digest,'snapshot_digest',cert.snapshot_digest,'parent_event_id',e.parent_event_id,'payload',e.payload);
END $$;
REVOKE ALL ON FUNCTION public.chassis_prepare_human_event(uuid,uuid,uuid,jsonb), public.chassis_get_operation_receipt(uuid,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.chassis_prepare_human_event(uuid,uuid,uuid,jsonb), public.chassis_get_operation_receipt(uuid,uuid,uuid,jsonb) TO project_admin;
REVOKE ALL ON FUNCTION public.chassis_record_human_event(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.chassis_record_human_event(uuid,uuid,jsonb) TO authenticated;

CREATE FUNCTION public.chassis_get_designation(p_team uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE d public.chassis_crew_chief_designations;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'authenticated' THEN RAISE EXCEPTION 'Human session required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.chassis_teams WHERE id=p_team FOR UPDATE;
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.chassis_team_memberships WHERE team_id=p_team AND user_id=auth.uid() AND active) THEN RAISE EXCEPTION 'Membership required' USING ERRCODE='42501'; END IF;
 SELECT * INTO d FROM public.chassis_crew_chief_designations WHERE team_id=p_team;
 RETURN jsonb_build_object('team_id',p_team,'primary_id',d.primary_id,'substitute_id',d.substitute_id,'revision',coalesce(d.revision,0));
END $$;
REVOKE ALL ON FUNCTION public.chassis_get_designation(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.chassis_get_designation(uuid) TO authenticated;


-- Fix1: trusted review-only context. Keep actual blocked gates; never set eligible.
-- This uses the immutable proposal ledger so nonapproval events retain the same FK.
CREATE FUNCTION public.chassis_register_review_context(p_context jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE t uuid; sid uuid; pid uuid; g bigint; e public.chassis_proposal_eligibility;
 h public.chassis_authority_heads; cert jsonb;
BEGIN
 IF p_context IS NULL OR jsonb_typeof(p_context)<>'object' OR octet_length(p_context::text)>16384
 OR p_context - ARRAY['team_id','session_id','generation','proposal_id','proposal_revision','proposal_digest','snapshot_digest','eligibility'] <> '{}'::jsonb
 OR NOT p_context ?& ARRAY['team_id','session_id','generation','proposal_id','proposal_revision','proposal_digest','snapshot_digest','eligibility']
 OR coalesce(p_context->>'proposal_digest','') !~ '^[0-9a-f]{64}$' OR coalesce(p_context->>'snapshot_digest','') !~ '^[0-9a-f]{64}$'
 OR jsonb_typeof(p_context->'generation') IS DISTINCT FROM 'number' OR coalesce(p_context->>'generation','') !~ '^[0-9]+$'
 OR jsonb_typeof(p_context->'proposal_revision') IS DISTINCT FROM 'number' OR coalesce(p_context->>'proposal_revision','') !~ '^[1-9][0-9]*$'
 THEN RAISE EXCEPTION 'Invalid review context' USING ERRCODE='22023'; END IF;
 t:=(p_context->>'team_id')::uuid; sid:=(p_context->>'session_id')::uuid; pid:=(p_context->>'proposal_id')::uuid; g:=(p_context->>'generation')::bigint; cert:=p_context->'eligibility';
 IF t IS NULL OR sid IS NULL OR pid IS NULL OR jsonb_typeof(cert) IS DISTINCT FROM 'object'
 OR cert - ARRAY['schema_version','session_revision','snapshot_revision','run_revision','run_id','request_origin','blocked_reasons','gates'] <> '{}'::jsonb
 OR cert->>'schema_version' IS DISTINCT FROM '1.0.0'
 OR coalesce(cert->>'session_revision','') !~ '^[1-9][0-9]*$' OR coalesce(cert->>'snapshot_revision','') !~ '^[1-9][0-9]*$'
 OR coalesce(cert->>'run_revision','') !~ '^[1-9][0-9]*$' OR coalesce(cert->>'run_id','') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 OR jsonb_typeof(cert->'session_revision') IS DISTINCT FROM 'number' OR jsonb_typeof(cert->'snapshot_revision') IS DISTINCT FROM 'number' OR jsonb_typeof(cert->'run_revision') IS DISTINCT FROM 'number'
 OR cert->>'request_origin' IS DISTINCT FROM 'human' OR jsonb_typeof(cert->'blocked_reasons') IS DISTINCT FROM 'array'
 OR jsonb_typeof(cert->'gates') IS DISTINCT FROM 'object' OR (cert->'gates') - ARRAY['inputs_valid','branches_sealed','independence_checked','conflicts_resolved','domain_valid','source_valid'] <> '{}'::jsonb
 OR NOT (cert->'gates') ?& ARRAY['inputs_valid','branches_sealed','independence_checked','conflicts_resolved','domain_valid','source_valid']
 THEN RAISE EXCEPTION 'Invalid review evidence' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_each(cert->'gates') x WHERE jsonb_typeof(x.value)<>'boolean') OR jsonb_array_length(cert->'blocked_reasons')>6
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(cert->'blocked_reasons') x WHERE jsonb_typeof(x.value)<>'string') THEN RAISE EXCEPTION 'Invalid review gates' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.chassis_teams WHERE id=t FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown team' USING ERRCODE='PT409'; END IF;
 SELECT * INTO h FROM public.chassis_authority_heads WHERE team_id=t AND session_id=sid;
 SELECT * INTO e FROM public.chassis_proposal_eligibility WHERE team_id=t AND proposal_id=pid;
 IF h.generation IS DISTINCT FROM g OR h.state IS NULL OR h.state NOT IN ('fenced','eligible') OR (h.proposal_id IS NOT NULL AND h.proposal_id<>pid) THEN RAISE EXCEPTION 'Review context head conflict' USING ERRCODE='PT409'; END IF;
 IF e.proposal_id IS NOT NULL THEN
  IF e.session_id IS DISTINCT FROM sid OR e.generation IS DISTINCT FROM g OR e.proposal_revision IS DISTINCT FROM (p_context->>'proposal_revision')::bigint OR e.proposal_digest IS DISTINCT FROM p_context->>'proposal_digest' OR e.snapshot_digest IS DISTINCT FROM p_context->>'snapshot_digest'
  OR e.certificate->'session_revision' IS DISTINCT FROM cert->'session_revision' OR e.certificate->'run_id' IS DISTINCT FROM cert->'run_id'
  THEN RAISE EXCEPTION 'Immutable review context conflict' USING ERRCODE='PT409'; END IF;
 ELSE
  IF h.state<>'fenced' OR EXISTS(SELECT 1 FROM public.chassis_proposal_eligibility WHERE team_id=t AND session_id=sid AND generation=g) THEN RAISE EXCEPTION 'Review generation already bound' USING ERRCODE='PT409'; END IF;
  INSERT INTO public.chassis_proposal_eligibility VALUES(t,sid,g,pid,(p_context->>'proposal_revision')::bigint,p_context->>'proposal_digest',p_context->>'snapshot_digest',cert);
  UPDATE public.chassis_authority_heads SET proposal_id=pid WHERE team_id=t AND session_id=sid;
 END IF;
 RETURN jsonb_build_object('team_id',t,'session_id',sid,'generation',g,'available',true);
END $$;
REVOKE ALL ON FUNCTION public.chassis_register_review_context(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.chassis_register_review_context(jsonb) TO project_admin;
