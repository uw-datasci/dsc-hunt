ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_riddle_event_position_fk;
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_event_position_required;
ALTER TABLE riddles DROP CONSTRAINT IF EXISTS riddles_event_position_answer_required;

DROP INDEX IF EXISTS locations_event_position_idx;
DROP INDEX IF EXISTS riddles_event_position_id_idx;
DROP INDEX IF EXISTS riddles_event_position_idx;

ALTER TABLE locations
  DROP COLUMN IF EXISTS position,
  DROP COLUMN IF EXISTS event_id;

ALTER TABLE riddles
  DROP COLUMN IF EXISTS answer,
  DROP COLUMN IF EXISTS position,
  DROP COLUMN IF EXISTS event_id;

-- teams.event_id and the events table belong to 20261014120000-add-events.
ALTER TABLE teams
  DROP COLUMN IF EXISTS active_riddle,
  DROP COLUMN IF EXISTS riddle_6,
  DROP COLUMN IF EXISTS riddle_5,
  DROP COLUMN IF EXISTS riddle_4,
  DROP COLUMN IF EXISTS riddle_3,
  DROP COLUMN IF EXISTS riddle_2,
  DROP COLUMN IF EXISTS riddle_1;

DROP TYPE IF EXISTS riddle_status;
