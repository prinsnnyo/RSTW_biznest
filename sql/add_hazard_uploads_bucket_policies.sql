-- Creates the hazard-uploads storage bucket (if it doesn't already exist from
-- the dashboard) and the RLS policies storage.objects needs before uploads
-- work: without an insert policy, every upload fails with
-- "new row violates row-level security policy".
--
-- Path shape written by hazard-storage.service.ts: <folder>/<user_id>/<file>
-- e.g. pmtiles/771381ab-.../1787671797109-9liq7dlo11-file.pmtiles
--
-- Run this in Supabase SQL Editor.

insert into storage.buckets (id, name, public)
values ('hazard-uploads', 'hazard-uploads', true)
on conflict (id) do nothing;

drop policy if exists "users upload own hazard files" on storage.objects;
create policy "users upload own hazard files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'hazard-uploads'
    and split_part(name, '/', 2) = auth.uid()::text
  );

drop policy if exists "anyone reads hazard files" on storage.objects;
create policy "anyone reads hazard files"
  on storage.objects
  for select
  to public
  using (bucket_id = 'hazard-uploads');
