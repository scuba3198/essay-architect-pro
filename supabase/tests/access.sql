-- Run with psql -v ON_ERROR_STOP=1 -f supabase/tests/access.sql.
begin;
create function pg_temp.assert(ok boolean, message text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception '%', message; end if;
end $$;
create function pg_temp.expect_denied(statement text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when insufficient_privilege then return;
  end;
  raise exception 'Expected permission denied: %', statement;
end $$;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000001', 'migration-test-1@example.invalid', '{}'),
  ('00000000-0000-0000-0000-000000000002', 'migration-test-2@example.invalid', '{}');

-- Another user's records must remain invisible.
insert into public.payments (user_id, plan_name, amount, screenshot_url, status) values
  ('00000000-0000-0000-0000-000000000002', 'Lifetime Pack', 'Rs 499', 'test', 'approved');
insert into public.user_sessions (user_id, device_fingerprint, session_token) values
  ('00000000-0000-0000-0000-000000000002', 'other-device', 'other-token');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select pg_temp.assert((select count(*) = 1 from public.profiles), 'Signup profile is isolated');
select pg_temp.assert((select count(*) = 0 from public.payments), 'Other payments hidden');
select pg_temp.assert((select count(*) = 0 from public.user_sessions), 'Other sessions hidden');
insert into public.payments (user_id, plan_name, amount, screenshot_url, status) values
  (auth.uid(), 'Lifetime Pack', 'Rs 499', 'test', 'approved');
select pg_temp.assert((select status = 'pending' from public.payments), 'Client cannot self-approve');
select pg_temp.expect_denied($q$update public.payments set status = 'approved'$q$);
select pg_temp.expect_denied($q$insert into public.payments (user_id, plan_name, amount, screenshot_url)
  values ('00000000-0000-0000-0000-000000000002', 'Lifetime Pack', 'Rs 499', 'test')$q$);
insert into public.user_sessions (user_id, device_fingerprint, session_token, visitor_id) values
  (auth.uid(), 'own-device', 'token', 'own-device');
select pg_temp.expect_denied($q$update public.user_sessions
  set user_id = '00000000-0000-0000-0000-000000000002' where user_id = auth.uid()$q$);
select pg_temp.expect_denied($q$insert into storage.objects (bucket_id, name)
  values ('payments', 'screenshots/00000000-0000-0000-0000-000000000002/forbidden.png')$q$);
insert into storage.objects (bucket_id, name) values
  ('payments', 'screenshots/00000000-0000-0000-0000-000000000001/test.png');
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.headers', '{"x-visitor-id":"test-device-1"}', true);
select pg_temp.expect_denied('select * from public.payments');
select pg_temp.expect_denied('select * from public.profiles');
select pg_temp.expect_denied('select * from public.user_sessions');
insert into public.usage_tracking (visitor_id) values ('test-device-1');
select pg_temp.expect_denied($q$insert into public.usage_tracking (visitor_id)
  values ('test-device-2')$q$);
select pg_temp.expect_denied($q$update public.usage_tracking set usage_count = 0$q$);
select public.increment_usage_count('test-device-1', 'ai');
select public.increment_usage_count('test-device-1', 'examiner');
select pg_temp.assert((select usage_count = 1 and examiner_count = 1 from public.usage_tracking),
  'RPC increments both counters');
select pg_temp.expect_denied($q$select public.increment_usage_count('test-device-2', 'ai')$q$);
select set_config('request.headers', '{"x-visitor-id":"test-device-2"}', true);
select pg_temp.assert((select count(*) = 0 from public.usage_tracking), 'Other visitor usage hidden');
select pg_temp.expect_denied($q$insert into public.feedback (visitor_id, comment)
  values ('test-device-1', 'forbidden')$q$);
insert into public.feedback (visitor_id, comment) values ('test-device-2', 'Test feedback');
select pg_temp.expect_denied('select * from public.feedback');
select pg_temp.expect_denied($q$insert into storage.objects (bucket_id, name)
  values ('payments', 'anonymous.png')$q$);
reset role;
set local role service_role;
select pg_temp.assert((select count(*) = 2 from public.payments), 'Service role reads both users');
update public.payments set status = 'approved';
reset role;
select pg_temp.assert((select bool_and(status = 'approved') from public.payments), 'Admin can approve');
rollback;
