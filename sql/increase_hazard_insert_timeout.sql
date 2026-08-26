-- Supabase's authenticated role has a short default statement_timeout
-- (commonly 8s), too short for inserting a large hazard MultiPolygon —
-- unsimplified shapefile/GIS exports can carry thousands of vertices, which
-- takes real time to parse, validate, and index on insert.
--
-- Run this in Supabase SQL Editor, then either wait a few minutes for
-- PostgREST to pick it up or run: NOTIFY pgrst, 'reload config';

alter role authenticated set statement_timeout = '30s';
