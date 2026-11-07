begin;
select plan(4);
-- Run with Supabase CLI. Fixtures intentionally use auth.uid() claims so the
-- test verifies policies rather than service-role behavior.
select policies_are('public', 'events', array['events owned read', 'events owned update']);
select policies_are('public', 'photos', array['photos via owned event']);
select policies_are('public', 'guest_sessions', array['sessions via owned event']);
select policies_are('public', 'profiles', array['profiles read self', 'profiles update safe fields']);
select * from finish();
rollback;
