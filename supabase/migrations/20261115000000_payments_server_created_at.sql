-- Plan expiry (24h Crammer's Pass, 30-day Preparation Pack) is computed from
-- payments.created_at. Clients could previously supply that column on insert,
-- so a forged future timestamp turned a time-limited plan into a permanent one
-- once approved. Force it to the server clock for API callers, alongside the
-- existing status override.
begin;

create or replace function private.force_payment_pending()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  -- Only override for public/authenticated users coming via API.
  -- This allows Admins/Dashboard/ServiceRole to set values manually.
  if (auth.role() = 'authenticated' or auth.role() = 'anon') then
    new.status := 'pending';
    new.created_at := now();
  end if;
  return new;
end;
$function$;

revoke all on function private.force_payment_pending() from public, anon, authenticated;

commit;
