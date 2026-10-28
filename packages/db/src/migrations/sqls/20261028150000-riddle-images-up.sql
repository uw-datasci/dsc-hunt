-- Object key of the riddle's image in Neon Object Storage (private bucket).
-- Players get short-lived signed URLs through the API, never the key.
ALTER TABLE riddles ADD COLUMN image_key text;
