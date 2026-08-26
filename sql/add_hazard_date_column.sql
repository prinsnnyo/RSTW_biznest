-- Adds hazard_date (the date the hazard itself occurred/was observed, as
-- opposed to created_at which is when the row was inserted).
--
-- Run this in Supabase SQL Editor.

alter table public.hazards
  add column if not exists hazard_date date;
