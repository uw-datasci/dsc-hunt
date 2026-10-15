-- Hunt lifecycle. One row per hunt; status moves one way:
-- not_started -> live (started_at set) -> ended (ended_at set).
CREATE TABLE events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  status      text NOT NULL DEFAULT 'not_started'
                CHECK (status IN ('not_started', 'live', 'ended')),
  started_at  timestamptz,
  ended_at    timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX events_created_at_idx ON events (created_at DESC);

-- The app runs a single hunt at a time and has no "create event" UI, so seed
-- the first one here. `GET /events/current` returns the newest row.
INSERT INTO events (name) VALUES ('DSC Hunt');

ALTER TABLE teams ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE;

UPDATE teams SET event_id = (SELECT id FROM events ORDER BY created_at DESC LIMIT 1)
WHERE event_id IS NULL;

ALTER TABLE teams ALTER COLUMN event_id SET NOT NULL;

CREATE INDEX teams_event_id_idx ON teams (event_id);
