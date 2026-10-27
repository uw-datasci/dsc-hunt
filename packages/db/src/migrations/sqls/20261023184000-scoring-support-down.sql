CREATE OR REPLACE VIEW location_details AS
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

ALTER TABLE teams
  DROP COLUMN last_scored_at;

ALTER TABLE locations
  DROP COLUMN visited;
