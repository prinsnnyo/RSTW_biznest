-- hazard_date now holds free text instead of a strict date — it can be an
-- actual observed date OR a prediction like "25 years from now". The app's
-- upload form has a "this is a prediction" toggle that switches between a
-- native date picker and a plain text field, both writing to this column.
--
-- Run this in Supabase SQL Editor.

alter table public.hazards alter column hazard_date type text using hazard_date::text;
