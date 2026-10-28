-- Apply through the normal reviewed migration process; never run from the client.
create table if not exists public.saved_questions (
  user_id uuid not null references auth.users(id) on delete cascade,
  test_version text not null,
  question_id integer not null check (question_id > 0),
  saved boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, test_version, question_id)
);
alter table public.saved_questions enable row level security;
revoke all on public.saved_questions from anon, authenticated;
grant all on public.saved_questions to service_role;
