CREATE OR REPLACE FUNCTION public.can_receive_team_progress(p_topic text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_team_id uuid;
BEGIN
  IF p_topic !~ '^team:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    RETURN false;
  END IF;

  target_team_id := substring(p_topic FROM 6)::uuid;
  RETURN EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_id = target_team_id
      AND user_id = (SELECT auth.uid())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.can_receive_team_progress(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_receive_team_progress(text) TO authenticated;

CREATE POLICY "Team members can receive progress broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  extension = 'broadcast'
  AND (SELECT public.can_receive_team_progress(realtime.topic()))
);

CREATE OR REPLACE FUNCTION public.broadcast_team_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  progress_riddles jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'position', positions.position,
      'status', CASE positions.position
        WHEN 1 THEN NEW.riddle_1
        WHEN 2 THEN NEW.riddle_2
        WHEN 3 THEN NEW.riddle_3
        WHEN 4 THEN NEW.riddle_4
        WHEN 5 THEN NEW.riddle_5
        WHEN 6 THEN NEW.riddle_6
      END,
      'text', CASE
        WHEN NEW.active_riddle = positions.position
          OR CASE positions.position
            WHEN 1 THEN NEW.riddle_1
            WHEN 2 THEN NEW.riddle_2
            WHEN 3 THEN NEW.riddle_3
            WHEN 4 THEN NEW.riddle_4
            WHEN 5 THEN NEW.riddle_5
            WHEN 6 THEN NEW.riddle_6
          END IN ('solved', 'visited')
        THEN riddles.riddle_text
        ELSE NULL
      END
    )
    ORDER BY positions.position
  )
  INTO progress_riddles
  FROM generate_series(1, 6) AS positions(position)
  LEFT JOIN public.riddles AS riddles
    ON riddles.event_id = NEW.event_id
    AND riddles.position = positions.position;

  PERFORM realtime.send(
    payload => jsonb_build_object(
      'type', 'team_progress',
      'teamId', NEW.team_id,
      'riddles', progress_riddles,
      'activeRiddle', NEW.active_riddle
    ),
    event => 'team_progress',
    topic => 'team:' || NEW.team_id::text,
    private => true
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER teams_broadcast_progress
AFTER UPDATE OF riddle_1, riddle_2, riddle_3, riddle_4, riddle_5, riddle_6, active_riddle
ON public.teams
FOR EACH ROW
WHEN (
  OLD.riddle_1 IS DISTINCT FROM NEW.riddle_1
  OR OLD.riddle_2 IS DISTINCT FROM NEW.riddle_2
  OR OLD.riddle_3 IS DISTINCT FROM NEW.riddle_3
  OR OLD.riddle_4 IS DISTINCT FROM NEW.riddle_4
  OR OLD.riddle_5 IS DISTINCT FROM NEW.riddle_5
  OR OLD.riddle_6 IS DISTINCT FROM NEW.riddle_6
  OR OLD.active_riddle IS DISTINCT FROM NEW.active_riddle
)
EXECUTE FUNCTION public.broadcast_team_progress();
