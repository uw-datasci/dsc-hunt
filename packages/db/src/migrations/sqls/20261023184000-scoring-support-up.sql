ALTER TABLE locations
  ADD COLUMN visited integer NOT NULL DEFAULT 0 CHECK (visited >= 0);

UPDATE locations
SET visited = visit_counts.visited
FROM (
  SELECT location_id, count(DISTINCT team_id)::integer AS visited
  FROM visits
  GROUP BY location_id
) AS visit_counts
WHERE locations.location_id = visit_counts.location_id;

ALTER TABLE teams
  ADD COLUMN last_scored_at timestamptz;

UPDATE teams
SET total_score = COALESCE(
      (SELECT sum(points)::integer FROM visits WHERE visits.team_id = teams.team_id),
      0
    ),
    last_scored_at = (
      SELECT max(visited_at) FROM visits WHERE visits.team_id = teams.team_id
    );

CREATE OR REPLACE VIEW location_details AS
SELECT
  locations.location_id,
  locations.name,
  riddles.riddle_text,
  locations.qr_identifier,
  locations.visited
FROM locations
JOIN riddles ON riddles.riddle_id = locations.riddle_id;
