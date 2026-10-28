-- Starting location: the venue where the event is held and the hunt is
-- introduced. Shown to players before the start; editable only until then.
ALTER TABLE events
  ADD COLUMN starting_location_name varchar(100),
  ADD COLUMN starting_location_details varchar(500),
  ADD CONSTRAINT events_starting_location_details_need_name
    CHECK (starting_location_details IS NULL OR starting_location_name IS NOT NULL);
