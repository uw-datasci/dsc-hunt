-- At most one hunt that is not ended (not_started or live). Enforces create rules
-- when two admins submit at once.
CREATE UNIQUE INDEX events_one_open_idx ON events ((true)) WHERE status <> 'ended';
