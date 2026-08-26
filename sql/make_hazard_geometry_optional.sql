-- Allows creating a hazard from PMTiles alone, with no geometry row. Needed
-- when the source GeoJSON is too large/slow for a direct Supabase insert
-- (see sql/increase_hazard_insert_timeout.sql) — admins can skip the GeoJSON
-- drop zone and upload only a PMTiles file; the map renders from that
-- instead of querying the geometry column.
--
-- Run this in Supabase SQL Editor.

alter table public.hazards alter column geometry drop not null;
alter table public.hazards alter column geometry_type drop not null;
