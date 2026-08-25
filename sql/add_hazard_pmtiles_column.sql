-- Adds pmtiles_url so uploaded hazard geometry can be served as PMTiles
-- instead of querying the row's PostGIS geometry column directly.
--
-- Run this in Supabase SQL Editor.

alter table public.hazards
  add column if not exists pmtiles_url text;
