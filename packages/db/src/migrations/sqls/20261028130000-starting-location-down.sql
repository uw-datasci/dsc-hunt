ALTER TABLE events
  DROP CONSTRAINT events_starting_location_details_need_name,
  DROP COLUMN starting_location_details,
  DROP COLUMN starting_location_name;
