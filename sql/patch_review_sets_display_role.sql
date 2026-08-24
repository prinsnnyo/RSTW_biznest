-- Re-run this after the base business_role_applications.sql if approval
-- already exists: approved applicants get `role` = entrepreneur / space_owner / supplier.

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
      || jsonb_build_object(
        'business_role', application_row.requested_role,
        'role', application_row.requested_role
      )
    where id = application_row.user_id
      and lower(regexp_replace(
        coalesce(raw_user_meta_data ->> 'role', 'user'),
        '[^a-z]',
        '',
        'g'
      )) not in ('admin', 'superadmin');
  end if;

  return application_row;
end;
$$;
