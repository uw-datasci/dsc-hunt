BEGIN;

WITH current_event AS (
  SELECT id
  FROM events
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO teams (team_name, total_score, event_id)
SELECT test.team_name, test.total_score, current_event.id
FROM current_event
CROSS JOIN (
  VALUES
    ('TEST - Alpha', 150),
    ('TEST - Beta', 300),
    ('TEST - Gamma', 150),
    ('TEST - Delta', 0)
) AS test(team_name, total_score);

SELECT team_id, team_name, total_score, event_id
FROM teams
WHERE team_name LIKE 'TEST - %'
ORDER BY total_score DESC, team_name ASC;

COMMIT;