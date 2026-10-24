-- Builds on the `events` table from 20261014120000-add-events, which already
-- adds a NOT NULL `teams.event_id`.
CREATE TYPE riddle_status AS ENUM ('unvisited', 'solved', 'visited');

ALTER TABLE teams
  ADD COLUMN riddle_1 riddle_status NOT NULL DEFAULT 'unvisited',
  ADD COLUMN riddle_2 riddle_status NOT NULL DEFAULT 'unvisited',
  ADD COLUMN riddle_3 riddle_status NOT NULL DEFAULT 'unvisited',
  ADD COLUMN riddle_4 riddle_status NOT NULL DEFAULT 'unvisited',
  ADD COLUMN riddle_5 riddle_status NOT NULL DEFAULT 'unvisited',
  ADD COLUMN riddle_6 riddle_status NOT NULL DEFAULT 'unvisited',
  ADD COLUMN active_riddle smallint CHECK (active_riddle BETWEEN 1 AND 6);

ALTER TABLE riddles
  ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  ADD COLUMN position smallint CHECK (position BETWEEN 1 AND 6),
  ADD COLUMN answer text CHECK (answer IS NULL OR length(btrim(answer)) > 0);

ALTER TABLE locations
  ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  ADD COLUMN position smallint CHECK (position BETWEEN 1 AND 6);

ALTER TABLE riddles
  ADD CONSTRAINT riddles_event_position_answer_required
  CHECK (event_id IS NOT NULL AND position IS NOT NULL AND answer IS NOT NULL) NOT VALID;

ALTER TABLE locations
  ADD CONSTRAINT locations_event_position_required
  CHECK (event_id IS NOT NULL AND position IS NOT NULL) NOT VALID;

CREATE UNIQUE INDEX riddles_event_position_idx ON riddles (event_id, position);
CREATE UNIQUE INDEX riddles_event_position_id_idx ON riddles (event_id, position, riddle_id);
CREATE UNIQUE INDEX locations_event_position_idx ON locations (event_id, position);

ALTER TABLE locations
  ADD CONSTRAINT locations_riddle_event_position_fk
  FOREIGN KEY (event_id, position, riddle_id)
  REFERENCES riddles (event_id, position, riddle_id);
