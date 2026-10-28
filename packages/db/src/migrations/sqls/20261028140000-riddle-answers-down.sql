ALTER TABLE riddles
  ADD COLUMN answer text CHECK (answer IS NULL OR length(btrim(answer)) > 0);

UPDATE riddles SET answer = answers[1] WHERE cardinality(answers) > 0;

ALTER TABLE riddles DROP CONSTRAINT riddles_event_position_answers_required;

ALTER TABLE riddles
  ADD CONSTRAINT riddles_event_position_answer_required
  CHECK (event_id IS NOT NULL AND position IS NOT NULL AND answer IS NOT NULL) NOT VALID;

ALTER TABLE riddles DROP COLUMN answers;
