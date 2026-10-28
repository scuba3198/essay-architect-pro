# Database setup

This repo owns only its app's tables. The fresh-database baseline includes explicit
Data API grants, RLS policies, constraints, indexes, and required database functions
and triggers. It contains no production data. Supabase manages the auth and storage
schemas.

## Fresh local database

Install the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
and a Docker-compatible runtime, then run from the repository root:

```sh
supabase start
supabase db reset --local
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/access.sql
```

The SQL test runs in a transaction and rolls back its test users and data. It checks
successful access as the owner, rejected cross-user access, denied anonymous access
where appropriate, and service-role access. Run it against a disposable local database.

For a new hosted project with no app tables, link to that project, review
`supabase db push --dry-run`, and apply with `supabase db push`. Configure the app's
Supabase URL, publishable/anon key, and auth redirect URLs for that project.

## Existing deployed database

This is a fresh-install baseline, not a production upgrade. Do not run it against
an existing app database: the tables already exist. Existing tables keep their
permissions through the October 30, 2026 change.

Before adopting CLI deployment for an existing project, compare its schema and
migration history with this baseline, reconcile any differences, and mark the
baseline as applied with `supabase migration repair --status applied <version>`
only once they match. Inspect `supabase migration list --linked` and
`supabase db push --dry-run` first. Never reset the linked production database.

For every future table, include only the grants the app needs, enable RLS, and add
ownership policies in the same migration. RLS and grants are both required; never
fix a permission error by disabling RLS or exposing a service-role key in the app.

## Essay Architect details

The baseline includes payments, usage tracking, feedback, profiles, sessions, the
signup/session/payment/feedback triggers, and the payment screenshot bucket.
Only admins/service-role clients can approve payments; clients can submit pending
payments and read their own. Internal privileged functions live in the unexposed
`private` schema and trigger functions cannot be called by API roles.

Anonymous usage and feedback retain the current device-header model. The
`x-visitor-id` header is client-controlled, so it is not a trusted identity or a
strong abuse/quota boundary. Usage writes must match that header and counters can
only be incremented through the RPC; direct counter updates are denied.

The `payments` bucket remains public because the current app uses `getPublicUrl()`.
Anyone with a screenshot URL can read it. Uploads require authentication and the
user's own `screenshots/<user-id>/` folder. Switching to private screenshots needs
a separate app change to use signed URLs.

The old feedback-policy patch is retained in `supabase/legacy/` for reference;
its policy is already included in the baseline. Legacy patches are not replayed.
OAuth providers, external API keys, deployed Edge Functions, and existing uploaded
files are not created by SQL migrations; configure these separately when moving
to a fresh project.

The live project is also shared by reciprocity-tracker and pte-class-coverage.
This baseline deliberately does not create or modify their tables. Inspect shared
migration history before linking any of these repos to that existing project.
