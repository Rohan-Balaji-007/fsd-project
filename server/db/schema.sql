-- ==============================================================================
-- EVENT TEAM FORMATION PLATFORM - SUPABASE SCHEMA & CONFIGURATION
-- File: /server/db/schema.sql
-- Description: Complete schema for Supabase (PostgreSQL 15+)
-- Includes:
--   1. Extensions
--   2. Core Tables (profiles, events, teams, team_members, join_requests, notifications)
--   3. Unique Partial Indexes & Constraints
--   4. Foreign Key & GIN Indexes
--   5. Triggers (Auth signup auto-profile, Team creation leader insertion)
--   6. Atomic Function: accept_join_request(request_id, leader_id) with row locking
--   7. Row Level Security (RLS) policies for all tables
--   8. 6 Realistic Collegiate Seed Events
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 2. TABLES
-- ==============================================================================

-- Table: profiles
-- Linked 1-to-1 with auth.users. Automatically populated on signup via trigger.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  department text,
  academic_year text,
  skills text[] not null default '{}'::text[],
  interests text[] not null default '{}'::text[],
  experience text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table: events
-- Hackathons, competitions, exhibitions, and cultural college events.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null check (category in ('hackathon', 'competition', 'exhibition', 'cultural', 'other')),
  start_date timestamptz not null,
  end_date timestamptz not null,
  venue text not null,
  registration_url text,
  registration_deadline timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Table: teams
-- Teams formed by students for a specific event.
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  leader_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  required_skills text[] not null default '{}'::text[],
  max_members int not null check (max_members >= 2),
  status text not null default 'open' check (status in ('open', 'full', 'closed')),
  created_at timestamptz not null default now()
);

-- Table: team_members
-- Mapping of members inside each team. Leader is added automatically on team creation.
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('leader', 'member')),
  joined_at timestamptz not null default now(),
  constraint uq_team_member unique (team_id, user_id)
);

-- Table: join_requests
-- Requests sent by students to join a team.
create table if not exists public.join_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

-- Table: notifications
-- User notifications for request updates, team invites, and announcements.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 3. INDEXES
-- ==============================================================================

-- Foreign Key Indexes
create index if not exists idx_events_created_by on public.events(created_by);
create index if not exists idx_teams_event_id on public.teams(event_id);
create index if not exists idx_teams_leader_id on public.teams(leader_id);
create index if not exists idx_team_members_team_id on public.team_members(team_id);
create index if not exists idx_team_members_user_id on public.team_members(user_id);
create index if not exists idx_join_requests_team_id on public.join_requests(team_id);
create index if not exists idx_join_requests_user_id on public.join_requests(user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);

-- Skills & Interests GIN Indexes (Fast array containment & overlap queries)
create index if not exists idx_profiles_skills on public.profiles using gin (skills);
create index if not exists idx_profiles_interests on public.profiles using gin (interests);
create index if not exists idx_teams_required_skills on public.teams using gin (required_skills);

-- Unique Partial Index: Prevent duplicate PENDING request from same user to same team
create unique index if not exists idx_unique_pending_join_request
  on public.join_requests (team_id, user_id)
  where status = 'pending';

-- Status & Filter Indexes
create index if not exists idx_teams_status on public.teams(status);
create index if not exists idx_join_requests_team_status on public.join_requests(team_id, status);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read);
create index if not exists idx_events_start_date on public.events(start_date);

-- ==============================================================================
-- 4. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Helper: Admin role checker function for RLS
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Trigger 1: Auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_avatar text;
  v_dept text;
  v_year text;
begin
  -- Extract metadata safely if present
  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'New Student'
  );

  v_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    null
  );

  v_dept := coalesce(new.raw_user_meta_data->>'department', null);
  v_year := coalesce(new.raw_user_meta_data->>'academic_year', null);

  insert into public.profiles (
    id,
    full_name,
    avatar_url,
    department,
    academic_year,
    skills,
    interests,
    experience,
    role
  )
  values (
    new.id,
    v_name,
    v_avatar,
    v_dept,
    v_year,
    '{}'::text[],
    '{}'::text[],
    null,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do update set
    full_name = case when profiles.full_name = '' or profiles.full_name is null then excluded.full_name else profiles.full_name end,
    avatar_url = coalesce(profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- Trigger 2: Automatically insert leader into team_members when a team is created
create or replace function public.handle_team_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.team_members (team_id, user_id, role, joined_at)
  values (new.id, new.leader_id, 'leader', now())
  on conflict (team_id, user_id) do update set role = 'leader';

  return new;
end;
$$;

drop trigger if exists on_team_created on public.teams;
create trigger on_team_created
  after insert on public.teams
  for each row execute function public.handle_team_created();


-- ==============================================================================
-- 5. ATOMIC BUSINESS FUNCTION: accept_join_request
-- ==============================================================================
-- Locks the team row (FOR UPDATE) to prevent race conditions.
-- Verifies:
--   1. Join request exists.
--   2. Join request is 'pending'.
--   3. Associated team exists.
--   4. Caller is the verified leader of the team.
--   5. Team is not already full (current_count < max_members).
--   6. Applicant is not already a member.
-- Actions:
--   - Inserts applicant into team_members.
--   - Updates join_requests status to 'accepted'.
--   - If member capacity reached (current_count + 1 = max_members), updates team status to 'full'.
--   - Inserts notification for the accepted applicant.
--   - Raises clear, actionable exceptions on any failure.
-- ==============================================================================

create or replace function public.accept_join_request(
  p_request_id uuid,
  p_leader_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request record;
  v_team record;
  v_current_count int;
  v_new_count int;
  v_new_team_status text;
begin
  -- 1. Fetch join request
  select * into v_request
  from public.join_requests
  where id = p_request_id;

  if not found then
    raise exception 'Join request % not found', p_request_id;
  end if;

  -- 2. Verify request status is pending
  if v_request.status <> 'pending' then
    raise exception 'Invalid action: Join request % is already %', p_request_id, v_request.status;
  end if;

  -- 3. Lock the team row FOR UPDATE to ensure atomic capacity check
  select * into v_team
  from public.teams
  where id = v_request.team_id
  for update;

  if not found then
    raise exception 'Associated team % not found', v_request.team_id;
  end if;

  -- 4. Verify caller is the team leader
  if v_team.leader_id <> p_leader_id then
    raise exception 'Unauthorized: Only team leader % can accept requests for team "%" (caller: %)',
      v_team.leader_id, v_team.name, p_leader_id;
  end if;

  -- 5. Count current active members in the team
  select count(*) into v_current_count
  from public.team_members
  where team_id = v_team.id;

  -- 6. Verify team is not full
  if v_current_count >= v_team.max_members then
    -- Ensure team status is synchronized to full
    if v_team.status <> 'full' then
      update public.teams set status = 'full' where id = v_team.id;
    end if;
    raise exception 'Cannot accept request: Team "%" has reached maximum capacity (%/% members)',
      v_team.name, v_current_count, v_team.max_members;
  end if;

  -- 7. Check if user is already a member
  if exists (
    select 1 from public.team_members
    where team_id = v_team.id and user_id = v_request.user_id
  ) then
    update public.join_requests set status = 'accepted' where id = p_request_id;
    raise exception 'User % is already a member of team "%"', v_request.user_id, v_team.name;
  end if;

  -- 8. Add user to team_members
  insert into public.team_members (team_id, user_id, role, joined_at)
  values (v_team.id, v_request.user_id, 'member', now());

  -- 9. Mark request as accepted
  update public.join_requests
  set status = 'accepted'
  where id = p_request_id;

  -- 10. Update team status to 'full' if capacity is reached
  v_new_count := v_current_count + 1;
  v_new_team_status := v_team.status;

  if v_new_count >= v_team.max_members then
    v_new_team_status := 'full';
    update public.teams
    set status = 'full'
    where id = v_team.id;
  end if;

  -- 11. Create in-app notification for the accepted student
  insert into public.notifications (
    user_id,
    type,
    message,
    link,
    is_read,
    created_at
  )
  values (
    v_request.user_id,
    'request_accepted',
    'Congratulations! Your request to join team "' || v_team.name || '" was accepted.',
    '/teams/' || v_team.id,
    false,
    now()
  );

  return jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'team_id', v_team.id,
    'team_name', v_team.name,
    'user_id', v_request.user_id,
    'current_members', v_new_count,
    'max_members', v_team.max_members,
    'team_status', v_new_team_status
  );
end;
$$;


-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all 6 tables
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.join_requests enable row level security;
alter table public.notifications enable row level security;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Anyone authenticated can view student profiles to find teammates
create policy "profiles_select_all"
  on public.profiles
  for select
  to authenticated
  using (true);

-- Allow public read of profiles for landing/discovery if anon is used
create policy "profiles_select_anon"
  on public.profiles
  for select
  to anon
  using (true);

-- Users can only update their own profile; admins can update any
create policy "profiles_update_own_or_admin"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- Users can insert their own profile row if needed
create policy "profiles_insert_own_or_admin"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id or public.is_admin());

-- ------------------------------------------------------------------------------
-- EVENTS POLICIES
-- ------------------------------------------------------------------------------
-- Anyone (authenticated or public visitor) can view events
create policy "events_select_public"
  on public.events
  for select
  using (true);

-- Authenticated users or admins can create events
create policy "events_insert_authenticated"
  on public.events
  for insert
  to authenticated
  with check (auth.uid() = created_by or public.is_admin());

-- Event creator or admin can update event
create policy "events_update_creator_or_admin"
  on public.events
  for update
  to authenticated
  using (auth.uid() = created_by or public.is_admin())
  with check (auth.uid() = created_by or public.is_admin());

-- Event creator or admin can delete event
create policy "events_delete_creator_or_admin"
  on public.events
  for delete
  to authenticated
  using (auth.uid() = created_by or public.is_admin());

-- ------------------------------------------------------------------------------
-- TEAMS POLICIES
-- ------------------------------------------------------------------------------
-- Anyone can view teams
create policy "teams_select_public"
  on public.teams
  for select
  using (true);

-- Logged in users can create a team where they are the designated leader
create policy "teams_insert_leader"
  on public.teams
  for insert
  to authenticated
  with check (auth.uid() = leader_id);

-- Only leader or admin can update team
create policy "teams_update_leader_or_admin"
  on public.teams
  for update
  to authenticated
  using (auth.uid() = leader_id or public.is_admin())
  with check (auth.uid() = leader_id or public.is_admin());

-- Only leader or admin can delete team
create policy "teams_delete_leader_or_admin"
  on public.teams
  for delete
  to authenticated
  using (auth.uid() = leader_id or public.is_admin());

-- ------------------------------------------------------------------------------
-- TEAM_MEMBERS POLICIES
-- ------------------------------------------------------------------------------
-- Anyone can view team members
create policy "team_members_select_public"
  on public.team_members
  for select
  using (true);

-- Insert allowed via leader, admin, or postgres functions/triggers
create policy "team_members_insert_leader_or_admin"
  on public.team_members
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.teams
      where id = team_id and leader_id = auth.uid()
    ) or public.is_admin()
  );

-- Member can leave (delete self) or leader/admin can remove member
create policy "team_members_delete_self_or_leader"
  on public.team_members
  for delete
  to authenticated
  using (
    auth.uid() = user_id or
    exists (
      select 1 from public.teams
      where id = team_id and leader_id = auth.uid()
    ) or
    public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- JOIN_REQUESTS POLICIES
-- ------------------------------------------------------------------------------
-- Requester, Team Leader, or Admin can view requests
create policy "join_requests_select_involved"
  on public.join_requests
  for select
  to authenticated
  using (
    auth.uid() = user_id or
    exists (
      select 1 from public.teams
      where id = team_id and leader_id = auth.uid()
    ) or
    public.is_admin()
  );

-- Authenticated user can create a request for themselves (cannot request own team)
create policy "join_requests_insert_applicant"
  on public.join_requests
  for insert
  to authenticated
  with check (
    auth.uid() = user_id and
    not exists (
      select 1 from public.teams
      where id = team_id and leader_id = auth.uid()
    )
  );

-- Team leader can accept/reject; applicant can withdraw (if still pending)
create policy "join_requests_update_leader_or_requester"
  on public.join_requests
  for update
  to authenticated
  using (
    auth.uid() = user_id or
    exists (
      select 1 from public.teams
      where id = team_id and leader_id = auth.uid()
    ) or
    public.is_admin()
  );

-- Requester can delete pending request; leader or admin can delete
create policy "join_requests_delete"
  on public.join_requests
  for delete
  to authenticated
  using (
    (auth.uid() = user_id and status = 'pending') or
    exists (
      select 1 from public.teams
      where id = team_id and leader_id = auth.uid()
    ) or
    public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
-- Users can only view their own notifications
create policy "notifications_select_own"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
create policy "notifications_update_own"
  on public.notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users or system can insert notifications
create policy "notifications_insert_authenticated"
  on public.notifications
  for insert
  to authenticated
  with check (true);

-- Users can delete their own notifications
create policy "notifications_delete_own"
  on public.notifications
  for delete
  to authenticated
  using (auth.uid() = user_id or public.is_admin());


-- ==============================================================================
-- 7. SEED DATA (6 Realistic Events)
-- ==============================================================================
-- Realistic seed events across Hackathon, Competition, Exhibition, and Cultural tracks.
-- Note: 'created_by' is set to NULL so these seed events load cleanly without
-- requiring pre-existing user records in auth.users.

insert into public.events (
  id,
  title,
  description,
  category,
  start_date,
  end_date,
  venue,
  registration_url,
  registration_deadline,
  created_by
)
values
(
  'e1000000-0000-0000-0000-000000000001',
  'HackSphere 2026: 36-Hour AI & Web3 Sprint',
  'Flagship inter-college hackathon uniting 500+ builders to tackle Generative AI, decentralized systems, and smart campus IoT. Features $15,000 in bounties, cloud credits, and direct interviews with top tech founders.',
  'hackathon',
  now() + interval '14 days',
  now() + interval '16 days',
  'Campus Innovation Hub - Grand Auditorium & Online',
  'https://hacksphere2026.devpost.com',
  now() + interval '10 days',
  null
),
(
  'e2000000-0000-0000-0000-000000000002',
  'ByteCode Arena: National Collegiate ICPC Challenge',
  'Premier algorithm and competitive programming showdown. 3 grueling rounds covering graph algorithms, dynamic programming, combinatorics, and high-performance computing under strict time constraints.',
  'competition',
  now() + interval '21 days',
  now() + interval '22 days',
  'Turing Computer Center - Lab 3 & 4',
  'https://bytecode.college.edu/register',
  now() + interval '18 days',
  null
),
(
  'e3000000-0000-0000-0000-000000000003',
  'Technovate Expo 2026: Hardware & Robotics Showcase',
  'Annual hardware and robotics exhibition. Student teams showcase working prototypes in autonomous drones, embedded biomedical devices, EV battery management, and industrial IoT to angel investors.',
  'exhibition',
  now() + interval '30 days',
  now() + interval '31 days',
  'Engineering Quadrangle - Exhibition Pavilion Hall B',
  'https://technovate.college.edu/exhibit',
  now() + interval '25 days',
  null
),
(
  'e4000000-0000-0000-0000-000000000004',
  'GreenPulse Hack: ClimateTech & Urban Sustainability',
  'A mission-driven hackathon seeking scalable solutions for carbon emission tracking, urban rooftop solar management, smart water distribution, and circular economy food logistics.',
  'hackathon',
  now() + interval '45 days',
  now() + interval '47 days',
  'Environmental Sciences Complex - EcoLab Atrium',
  'https://greenpulse.devpost.com',
  now() + interval '38 days',
  null
),
(
  'e5000000-0000-0000-0000-000000000005',
  'Spectra 2026: Game Jam & Creative Multimedia Jam',
  'A collaborative 48-hour challenge pairing game developers, 3D artists, UI/UX interaction designers, and music composers to create interactive playable web and VR indie games.',
  'cultural',
  now() + interval '60 days',
  now() + interval '62 days',
  'Design & Media Arts Center - Studio 5',
  'https://spectra-jam.itch.io',
  now() + interval '52 days',
  null
),
(
  'e6000000-0000-0000-0000-000000000006',
  'CyberShield CTF: Attack-Defense Cybersecurity Summit',
  'High-stakes Capture The Flag contest featuring Jeopardy-style and real-time Attack-Defense tracks. Challenges span binary exploitation, zero-day forensics, cryptography, and cloud misconfiguration auditing.',
  'competition',
  now() + interval '75 days',
  now() + interval '76 days',
  'Cyber Defense Research Lab - Wing D',
  'https://cybershield.ctfd.io',
  now() + interval '68 days',
  null
)
on conflict (id) do nothing;
