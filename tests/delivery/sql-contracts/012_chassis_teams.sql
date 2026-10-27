-- Reviewed artifact only: do not apply to cloud until deployment review.
BEGIN;
CREATE TABLE IF NOT EXISTS public.chassis_teams (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(length(name) BETWEEN 1 AND 120), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.chassis_team_memberships (
 team_id uuid NOT NULL REFERENCES public.chassis_teams(id), user_id uuid NOT NULL REFERENCES auth.users(id),
 role text NOT NULL CHECK(role IN ('reader','engineer','admin')), active boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(team_id,user_id)
);
CREATE TABLE IF NOT EXISTS public.chassis_membership_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, team_id uuid NOT NULL REFERENCES public.chassis_teams(id), actor_id uuid NOT NULL REFERENCES auth.users(id), target_id uuid NOT NULL REFERENCES auth.users(id), role text NOT NULL, active boolean NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chassis_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chassis_team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chassis_membership_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chassis_teams, public.chassis_team_memberships, public.chassis_membership_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.chassis_teams, public.chassis_team_memberships TO authenticated;
DROP POLICY IF EXISTS chassis_own_membership ON public.chassis_team_memberships;
CREATE POLICY chassis_own_membership ON public.chassis_team_memberships FOR SELECT TO authenticated USING(user_id=auth.uid() AND active);
DROP POLICY IF EXISTS chassis_member_team ON public.chassis_teams;
CREATE POLICY chassis_member_team ON public.chassis_teams FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.chassis_team_memberships m WHERE m.team_id=public.chassis_teams.id AND m.user_id=auth.uid() AND m.active));
-- This fixed-search-path function must be owned by the trusted migration owner,
-- never the authenticated/anon API roles. Table owner bypass is used intentionally
-- here, avoiding recursive RLS admin policies; no direct mutation grants exist.
CREATE OR REPLACE FUNCTION public.chassis_set_membership(p_team uuid,p_user uuid,p_role text,p_active boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid := auth.uid();
BEGIN
 PERFORM 1 FROM public.chassis_teams WHERE id=p_team FOR UPDATE;
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM public.chassis_team_memberships WHERE team_id=p_team AND user_id=actor AND role='admin' AND active) THEN
  RAISE EXCEPTION 'Team admin membership required' USING ERRCODE='42501';
 END IF;
 IF p_role NOT IN ('reader','engineer','admin') OR p_active IS NULL THEN RAISE EXCEPTION 'Invalid membership'; END IF;
 IF (p_role<>'admin' OR NOT p_active) AND EXISTS(SELECT 1 FROM public.chassis_team_memberships WHERE team_id=p_team AND user_id=p_user AND role='admin' AND active)
 AND (SELECT count(*) FROM public.chassis_team_memberships WHERE team_id=p_team AND role='admin' AND active)<=1 THEN RAISE EXCEPTION 'Cannot remove last active admin'; END IF;
 INSERT INTO public.chassis_team_memberships(team_id,user_id,role,active) VALUES(p_team,p_user,p_role,p_active)
 ON CONFLICT(team_id,user_id) DO UPDATE SET role=excluded.role,active=excluded.active,updated_at=now();
 INSERT INTO public.chassis_membership_audit(team_id,actor_id,target_id,role,active) VALUES(p_team,actor,p_user,p_role,p_active);
END $$;
REVOKE ALL ON FUNCTION public.chassis_set_membership(uuid,uuid,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.chassis_set_membership(uuid,uuid,text,boolean) TO authenticated;
COMMIT;
