-- Riddles accept several answers (any one is correct). Matching is lenient
-- and done in the API, so these are stored as the admin typed them.
ALTER TABLE riddles ADD COLUMN answers text[] NOT NULL DEFAULT '{}';

UPDATE riddles SET answers = ARRAY[answer] WHERE answer IS NOT NULL;

ALTER TABLE riddles DROP CONSTRAINT riddles_event_position_answer_required;

ALTER TABLE riddles
  ADD CONSTRAINT riddles_event_position_answers_required
  CHECK (event_id IS NOT NULL AND position IS NOT NULL AND cardinality(answers) > 0) NOT VALID;

ALTER TABLE riddles DROP COLUMN answer;
