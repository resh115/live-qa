-- Live-QA feature schema
-- Run this in Supabase SQL Editor after creating the existing `questions` and `polls` tables.

create extension if not exists pgcrypto;

create table if not exists rankings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists ranking_options (
  id uuid primary key default gen_random_uuid(),
  ranking_id uuid not null references rankings(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists ranking_votes (
  id uuid primary key default gen_random_uuid(),
  ranking_id uuid not null references rankings(id) on delete cascade,
  option_id uuid not null references ranking_options(id) on delete cascade,
  participant_id text not null,
  rank_position integer not null check (rank_position > 0),
  created_at timestamptz not null default now(),
  unique (ranking_id, option_id, participant_id)
);

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  reaction text not null check (reaction in ('like', 'love', 'laugh', 'fire')),
  participant_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists word_cloud_entries (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  participant_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  created_at timestamptz not null default now()
);

create table if not exists quiz_options (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false
);

create table if not exists quiz_responses (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  option_id uuid not null references quiz_options(id) on delete cascade,
  participant_id text not null,
  created_at timestamptz not null default now(),
  unique (quiz_id, participant_id)
);

create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  score integer not null check (score between 1 and 5),
  participant_id text not null,
  created_at timestamptz not null default now(),
  unique (participant_id)
);

-- Public/demo policies. For a production deployment, replace these with
-- authenticated-user and host/session-specific policies.
alter table rankings enable row level security;
alter table ranking_options enable row level security;
alter table ranking_votes enable row level security;
alter table reactions enable row level security;
alter table word_cloud_entries enable row level security;
alter table quizzes enable row level security;
alter table quiz_options enable row level security;
alter table quiz_responses enable row level security;
alter table ratings enable row level security;

-- Recreate demo policies so the script is safe to run repeatedly.
drop policy if exists "public read rankings" on rankings;
drop policy if exists "public insert rankings" on rankings;
drop policy if exists "public read ranking options" on ranking_options;
drop policy if exists "public insert ranking options" on ranking_options;
drop policy if exists "public read ranking votes" on ranking_votes;
drop policy if exists "public insert ranking votes" on ranking_votes;
drop policy if exists "public update ranking votes" on ranking_votes;
drop policy if exists "public read reactions" on reactions;
drop policy if exists "public insert reactions" on reactions;
drop policy if exists "public read words" on word_cloud_entries;
drop policy if exists "public insert words" on word_cloud_entries;
drop policy if exists "public read quizzes" on quizzes;
drop policy if exists "public insert quizzes" on quizzes;
drop policy if exists "public read quiz options" on quiz_options;
drop policy if exists "public insert quiz options" on quiz_options;
drop policy if exists "public read quiz responses" on quiz_responses;
drop policy if exists "public insert quiz responses" on quiz_responses;
drop policy if exists "public update quiz responses" on quiz_responses;
drop policy if exists "public read ratings" on ratings;
drop policy if exists "public insert ratings" on ratings;
drop policy if exists "public update ratings" on ratings;

create policy "public read rankings" on rankings for select using (true);
create policy "public insert rankings" on rankings for insert with check (true);
create policy "public read ranking options" on ranking_options for select using (true);
create policy "public insert ranking options" on ranking_options for insert with check (true);
create policy "public read ranking votes" on ranking_votes for select using (true);
create policy "public insert ranking votes" on ranking_votes for insert with check (true);
create policy "public update ranking votes" on ranking_votes for update using (true) with check (true);
create policy "public read reactions" on reactions for select using (true);
create policy "public insert reactions" on reactions for insert with check (true);
create policy "public read words" on word_cloud_entries for select using (true);
create policy "public insert words" on word_cloud_entries for insert with check (true);
create policy "public read quizzes" on quizzes for select using (true);
create policy "public insert quizzes" on quizzes for insert with check (true);
create policy "public read quiz options" on quiz_options for select using (true);
create policy "public insert quiz options" on quiz_options for insert with check (true);
create policy "public read quiz responses" on quiz_responses for select using (true);
create policy "public insert quiz responses" on quiz_responses for insert with check (true);
create policy "public update quiz responses" on quiz_responses for update using (true) with check (true);
create policy "public read ratings" on ratings for select using (true);
create policy "public insert ratings" on ratings for insert with check (true);
create policy "public update ratings" on ratings for update using (true) with check (true);

-- Enable realtime for the new live tables. If a table is already in the
-- publication, PostgreSQL will reject the duplicate entry; run these lines
-- individually if your project already manages the publication manually.
do $$
begin
  alter publication supabase_realtime add table rankings;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table ranking_options;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table ranking_votes;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table reactions;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table word_cloud_entries;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table quizzes;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table quiz_options;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table quiz_responses;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table ratings;
exception when duplicate_object then null; end $$;

-- Optional starter content.
insert into rankings (title)
select 'Rank the technologies by your preference'
where not exists (select 1 from rankings);

insert into ranking_options (ranking_id, label)
select r.id, v.label
from rankings r
cross join (values ('Java'), ('Python'), ('C++'), ('JavaScript')) as v(label)
where not exists (select 1 from ranking_options where ranking_id = r.id);

insert into quizzes (question)
select 'Which protocol is connection-oriented?'
where not exists (select 1 from quizzes);

insert into quiz_options (quiz_id, label, is_correct)
select q.id, v.label, v.is_correct
from quizzes q
cross join (values
  ('UDP', false),
  ('TCP', true),
  ('IP', false),
  ('ARP', false)
) as v(label, is_correct)
where not exists (select 1 from quiz_options where quiz_id = q.id);
