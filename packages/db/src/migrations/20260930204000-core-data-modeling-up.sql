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

CREATE TABLE visits (
  visit_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id  uuid NOT NULL REFERENCES locations(location_id) ON DELETE CASCADE,
  team_id      uuid NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
  points       integer NOT NULL DEFAULT 0,
  visited_at   timestamptz NOT NULL DEFAULT now()
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
  count(DISTINCT visits.team_id)::integer AS visited
FROM locations
JOIN riddles ON riddles.riddle_id = locations.riddle_id
LEFT JOIN visits ON visits.location_id = locations.location_id
GROUP BY locations.location_id, locations.name, riddles.riddle_text, locations.qr_identifier;
