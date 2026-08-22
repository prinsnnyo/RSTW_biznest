-- Mirror of applied migration: pinned locations platform
-- See Supabase migration: create_pinned_locations_platform

create table if not exists public.pinned_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('space_owner', 'entrepreneur', 'supplier')),
  title text not null,
  description text not null default '',
  latitude float8 not null,
  longitude float8 not null,
  website_url text,
  theme_color text not null default 'ocean' check (theme_color in ('ocean', 'forest', 'sunset')),
  layout_style text not null default 'corporate' check (layout_style in ('corporate', 'orbit', 'bento', 'signal', 'vine', 'nomade')),
  font_primary text not null default 'fraunces' check (font_primary in ('fraunces', 'libre_baskerville', 'playfair')),
  font_secondary text not null default 'source_sans' check (font_secondary in ('source_sans', 'dm_sans', 'nunito')),
  font_tertiary text not null default 'jetbrains_mono' check (font_tertiary in ('jetbrains_mono', 'ibm_plex_mono', 'space_mono')),
  images jsonb not null default '[]'::jsonb,
  map_images jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.site_sections (
  id uuid primary key default gen_random_uuid(),
  pinned_location_id uuid not null references public.pinned_locations(id) on delete cascade,
  section_key text not null check (section_key in ('hero', 'about', 'services', 'gallery', 'contact')),
  title text not null default '',
  body text not null default '',
  sort_order integer not null default 0,
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pinned_location_id, section_key)
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  pinned_location_id uuid not null references public.pinned_locations(id) on delete cascade,
  sender_name text not null,
  sender_email text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
