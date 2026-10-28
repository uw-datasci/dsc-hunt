-- Teams: join codes, one team per user per event, member display names and a
-- per-event team size cap. Mirrors estimathon-v2's teams / team_members.

-- 5-digit join code, unique within an event. Existing rows get sequential codes.
ALTER TABLE teams ADD COLUMN code text;

UPDATE teams
SET code = numbered.code
FROM (
  SELECT team_id,
         (10000 + row_number() OVER (PARTITION BY event_id ORDER BY created_at, team_id))::text AS code
  FROM teams
) AS numbered
WHERE teams.team_id = numbered.team_id;

ALTER TABLE teams
  ALTER COLUMN code SET NOT NULL,
  ADD CONSTRAINT teams_code_format CHECK (code ~ '^[0-9]{5}$'),
  ADD CONSTRAINT teams_event_code_key UNIQUE (event_id, code);

-- event_id is denormalized onto team_members so the database can enforce
-- "one team per user per event" without a multi-table check.
ALTER TABLE team_members
  ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE;

UPDATE team_members
SET event_id = teams.event_id
FROM teams
WHERE teams.team_id = team_members.team_id;

ALTER TABLE team_members
  ALTER COLUMN event_id SET NOT NULL,
  ADD CONSTRAINT team_members_event_user_key UNIQUE (event_id, user_id);

CREATE INDEX team_members_event_id_idx ON team_members (event_id);

-- Name shown in the team lobby, captured from the player's profile on join.
ALTER TABLE team_members ADD COLUMN display_name varchar(200) NOT NULL DEFAULT 'Player';
ALTER TABLE team_members ALTER COLUMN display_name DROP DEFAULT;

ALTER TABLE events
  ADD COLUMN team_size_cap integer NOT NULL DEFAULT 4 CHECK (team_size_cap > 0);
