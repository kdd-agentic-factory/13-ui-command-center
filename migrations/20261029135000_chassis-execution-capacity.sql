-- Private service semaphore, not business data. No direct runtime/web access.
-- Its trusted owner bypasses this table's RLS only inside bounded functions.
CREATE TABLE IF NOT EXISTS public.chassis_execution_slots (
  kind text NOT NULL CHECK (kind IN ('worker','model')),
  slot integer NOT NULL CHECK (slot IN (1,2)),
  team_id uuid, token uuid, expires_at timestamptz,
  PRIMARY KEY (kind,slot)
);
ALTER TABLE public.chassis_execution_slots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chassis_execution_slots FROM PUBLIC,anon,authenticated,chassis_runtime;
INSERT INTO public.chassis_execution_slots(kind,slot)
SELECT k,s FROM unnest(ARRAY['worker','model']) k CROSS JOIN generate_series(1,2) s
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.chassis_execution_slot(action text, resource text, lease uuid, expiry timestamptz)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog,public,pg_temp AS $$
DECLARE team uuid; actor uuid; selected integer; instant timestamptz := clock_timestamp();
BEGIN
  team := nullif(current_setting('chassis.team_id',true),'')::uuid;
  actor := nullif(current_setting('chassis.subject_id',true),'')::uuid;
  IF team IS NULL OR actor IS NULL OR current_setting('chassis.role',true) NOT IN ('engineer','admin')
     OR current_setting('chassis.role',true) IS NULL THEN
    RAISE EXCEPTION 'Execution identity required' USING ERRCODE='42501';
  END IF;
  IF resource NOT IN ('worker','model') OR resource IS NULL OR lease IS NULL
     OR action NOT IN ('acquire','renew','release') OR action IS NULL THEN
    RAISE EXCEPTION 'Invalid execution resource';
  END IF;
  IF action IN ('acquire','renew') AND (expiry IS NULL OR expiry <= instant OR expiry > instant + interval '60 seconds') THEN
    RAISE EXCEPTION 'Bounded execution expiry required';
  END IF;
  IF action = 'release' THEN
    UPDATE public.chassis_execution_slots SET expires_at=instant
      WHERE kind=resource AND team_id=team AND token=lease;
    RETURN FOUND;
  ELSIF action = 'renew' THEN
    UPDATE public.chassis_execution_slots SET expires_at=expiry
      WHERE kind=resource AND team_id=team AND token=lease AND expires_at>instant;
    RETURN FOUND;
  END IF;
  IF EXISTS (SELECT 1 FROM public.chassis_execution_slots
    WHERE kind=resource AND team_id=team AND token=lease AND expires_at>instant) THEN
    RETURN true;
  END IF;
  SELECT slot INTO selected FROM public.chassis_execution_slots
    WHERE kind=resource AND (expires_at IS NULL OR expires_at<=instant)
    ORDER BY slot FOR UPDATE SKIP LOCKED LIMIT 1;
  IF selected IS NULL THEN RETURN false; END IF;
  UPDATE public.chassis_execution_slots SET team_id=team,token=lease,expires_at=expiry
    WHERE kind=resource AND slot=selected;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.chassis_execution_slot(text,text,uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.chassis_execution_slot(text,text,uuid,timestamptz) TO chassis_runtime;
