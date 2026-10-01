-- Core hunt data model. User accounts are managed by Supabase; user_id stores
-- that external UUID and intentionally has no local foreign key.

CREATE TABLE riddles (
  riddle_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  riddle_text  text NOT NULL
);

CREATE TABLE teams (
  team_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name    varchar(100) NOT NULL,
  total_score  integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE team_members (
  team_id    uuid NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
  user_id    uuid NOT NULL,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

CREATE INDEX team_members_user_id_idx ON team_members (user_id);

CREATE TABLE locations (
  location_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           varchar(200) NOT NULL,
  riddle_id      uuid NOT NULL REFERENCES riddles(riddle_id),
  qr_identifier  varchar(255) NOT NULL UNIQUE,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- One row per team/location records the team's progress at that checkpoint.
CREATE TABLE team_progress (
  team_id           uuid NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
  location_id       uuid NOT NULL REFERENCES locations(location_id) ON DELETE CASCADE,
  first_visited_at  timestamptz NOT NULL,
  last_visited_at   timestamptz NOT NULL,
  points            integer NOT NULL DEFAULT 0,
  PRIMARY KEY (team_id, location_id),
  CHECK (last_visited_at >= first_visited_at)
);

-- The visit-writing service updates progress and team totals transactionally.
CREATE TABLE visits (
  visit_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id  uuid NOT NULL,
  team_id      uuid NOT NULL,
  points       integer NOT NULL DEFAULT 0,
  visited_at   timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (team_id, location_id)
    REFERENCES team_progress(team_id, location_id) ON DELETE CASCADE
);

CREATE INDEX visits_team_timeline_idx ON visits (team_id, visited_at, visit_id);
CREATE INDEX visits_location_id_idx ON visits (location_id);

-- Exposes the clue and the number of teams that have visited each location.
CREATE VIEW location_details AS
SELECT
  locations.location_id,
  locations.name,
  riddles.riddle_text,
  locations.qr_identifier,
  count(team_progress.team_id)::integer AS visited
FROM locations
JOIN riddles ON riddles.riddle_id = locations.riddle_id
LEFT JOIN team_progress ON team_progress.location_id = locations.location_id
GROUP BY locations.location_id, locations.name, riddles.riddle_text, locations.qr_identifier;
