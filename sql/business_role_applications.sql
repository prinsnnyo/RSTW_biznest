-- Business-role applications: regular signups stay `user` until a super admin
-- approves a space owner / entrepreneur / supplier application.

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(regexp_replace(
    coalesce(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role',
      ''
    ),
    '[^a-z]',
    '',
    'g'
  )) = 'superadmin';
$$;

revoke all on function public.is_superadmin() from public;
grant execute on function public.is_superadmin() to authenticated;

create table if not exists public.business_role_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  requested_role text not null
    check (requested_role in ('space_owner', 'entrepreneur', 'supplier')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  business_name text not null,
  business_address text not null,
  business_description text not null,
  contact_phone text not null,
  registration_number text,
  tin text,
  review_notes text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists business_role_applications_one_pending_per_user
  on public.business_role_applications (user_id)
  where status = 'pending';

create index if not exists business_role_applications_status_idx
  on public.business_role_applications (status, created_at desc);

create table if not exists public.business_role_application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null
    references public.business_role_applications (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  document_kind text not null default 'other'
    check (document_kind in ('valid_id', 'business_permit', 'dti_sec', 'other')),
  created_at timestamptz not null default now()
);

create index if not exists business_role_application_documents_app_idx
  on public.business_role_application_documents (application_id);

alter table public.business_role_applications enable row level security;
alter table public.business_role_application_documents enable row level security;

drop policy if exists "users read own business applications" on public.business_role_applications;
create policy "users read own business applications"
  on public.business_role_applications
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_superadmin());

drop policy if exists "users insert own pending business applications" on public.business_role_applications;
create policy "users insert own pending business applications"
  on public.business_role_applications
  for insert
  to authenticated
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "users delete own pending business applications" on public.business_role_applications;
create policy "users delete own pending business applications"
  on public.business_role_applications
  for delete
  to authenticated
  using (user_id = auth.uid() and status = 'pending');

drop policy if exists "superadmins update business applications" on public.business_role_applications;
create policy "superadmins update business applications"
  on public.business_role_applications
  for update
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

drop policy if exists "users read own application documents" on public.business_role_application_documents;
create policy "users read own application documents"
  on public.business_role_application_documents
  for select
  to authenticated
  using (
    public.is_superadmin()
    or exists (
      select 1
      from public.business_role_applications app
      where app.id = application_id
        and app.user_id = auth.uid()
    )
  );

drop policy if exists "users insert own application documents" on public.business_role_application_documents;
create policy "users insert own application documents"
  on public.business_role_application_documents
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.business_role_applications app
      where app.id = application_id
        and app.user_id = auth.uid()
        and app.status = 'pending'
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-applications',
  'business-applications',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "users upload own business application files" on storage.objects;
create policy "users upload own business application files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'business-applications'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "users read own business application files" on storage.objects;
create policy "users read own business application files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'business-applications'
    and (
      split_part(name, '/', 1) = auth.uid()::text
      or public.is_superadmin()
    )
  );

create or replace function public.review_business_role_application(
  p_application_id uuid,
  p_decision text,
  p_notes text default null
)
returns public.business_role_applications
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  application_row public.business_role_applications;
begin
  if not public.is_superadmin() then
    raise exception 'Only a super admin can review business role applications.';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected.';
  end if;

  select * into application_row
  from public.business_role_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found.';
  end if;

  if application_row.status <> 'pending' then
    raise exception 'This application has already been reviewed.';
  end if;

  update public.business_role_applications
  set
    status = p_decision,
    review_notes = nullif(btrim(coalesce(p_notes, '')), ''),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  where id = p_application_id
  returning * into application_row;

  if p_decision = 'approved' then
    update auth.users
    set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('business_role', application_row.requested_role)
    where id = application_row.user_id;
  end if;

  return application_row;
end;
$$;

revoke all on function public.review_business_role_application(uuid, text, text) from public;
grant execute on function public.review_business_role_application(uuid, text, text) to authenticated;

-- New signups cannot self-assign a business role through user_metadata.
create or replace function public.enforce_default_user_role()
returns trigger
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  assigned_role text;
begin
  assigned_role := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'role', 'user'),
    '[^a-z]',
    '',
    'g'
  ));

  -- Invited admins keep admin; everyone else is a regular user.
  if assigned_role not in ('admin', 'superadmin') then
    new.raw_user_meta_data := jsonb_set(
      coalesce(new.raw_user_meta_data, '{}'::jsonb),
      '{role}',
      '"user"',
      true
    );
  end if;

  new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'business_role';
  return new;
end;
$$;

drop trigger if exists enforce_default_user_role on auth.users;
create trigger enforce_default_user_role
  before insert on auth.users
  for each row
  execute function public.enforce_default_user_role();
