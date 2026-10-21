DROP TRIGGER IF EXISTS teams_broadcast_progress ON public.teams;
DROP FUNCTION IF EXISTS public.broadcast_team_progress();
DROP POLICY IF EXISTS "Team members can receive progress broadcasts" ON realtime.messages;
DROP FUNCTION IF EXISTS public.can_receive_team_progress(text);
