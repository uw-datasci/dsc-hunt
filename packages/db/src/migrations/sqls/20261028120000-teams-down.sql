ALTER TABLE events DROP COLUMN team_size_cap;

ALTER TABLE team_members DROP COLUMN display_name;

DROP INDEX team_members_event_id_idx;

ALTER TABLE team_members
  DROP CONSTRAINT team_members_event_user_key,
  DROP COLUMN event_id;

ALTER TABLE teams
  DROP CONSTRAINT teams_event_code_key,
  DROP CONSTRAINT teams_code_format,
  DROP COLUMN code;
