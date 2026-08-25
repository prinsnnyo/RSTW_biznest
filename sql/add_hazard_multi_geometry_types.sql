-- Widen hazard_geometry_type to accept Multi* geometries. Most real-world
-- hazard shapefiles/GeoJSON exports come as MultiPolygon (even a single
-- disjoint zone often gets wrapped that way by GIS tools), which the enum
-- previously rejected outright.
--
-- Run this in Supabase SQL Editor.

alter type public.hazard_geometry_type add value if not exists 'multipoint';
alter type public.hazard_geometry_type add value if not exists 'multilinestring';
alter type public.hazard_geometry_type add value if not exists 'multipolygon';

create or replace function public.handle_hazard_geometry_type()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  new.geometry_type := case lower(extensions.st_geometrytype(new.geometry))
    when 'st_point' then 'point'::public.hazard_geometry_type
    when 'st_linestring' then 'linestring'::public.hazard_geometry_type
    when 'st_polygon' then 'polygon'::public.hazard_geometry_type
    when 'st_multipoint' then 'multipoint'::public.hazard_geometry_type
    when 'st_multilinestring' then 'multilinestring'::public.hazard_geometry_type
    when 'st_multipolygon' then 'multipolygon'::public.hazard_geometry_type
    else new.geometry_type
  end;

  return new;
end;
$$;
