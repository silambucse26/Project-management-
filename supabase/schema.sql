create extension if not exists pgcrypto;

create table if not exists public.pm_users (
  id text primary key,
  employee_id text unique,
  name text not null,
  email text not null,
  role text not null check (role in ('admin', 'head', 'member')),
  department text not null,
  title text not null,
  initials text not null,
  manager_id text,
  password_hash text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pm_users add column if not exists employee_id text unique;
alter table public.pm_users add column if not exists password_hash text;
create index if not exists pm_users_employee_id_idx on public.pm_users(employee_id);

create table if not exists public.pm_departments (
  id text primary key,
  name text not null unique,
  head_id text references public.pm_users(id) on delete set null,
  members integer not null default 0,
  workload integer not null default 0,
  active_projects integer not null default 0,
  performance text not null default 'flat',
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pm_projects (
  id text primary key,
  name text not null,
  description text,
  owner_id text references public.pm_users(id) on delete set null,
  owner text not null,
  department text not null,
  progress integer not null default 0,
  due text not null default 'TBD',
  status text not null default 'on-track',
  priority text not null default 'medium',
  team_size integer not null default 1,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pm_tasks (
  id text primary key,
  title text not null,
  description text,
  project_id text references public.pm_projects(id) on delete set null,
  project_name text,
  assignee text not null,
  assignee_id text references public.pm_users(id) on delete set null,
  created_by_id text references public.pm_users(id) on delete set null,
  reviewer_id text references public.pm_users(id) on delete set null,
  reviewer_name text,
  approval_status text not null default 'not-submitted',
  registered_at text,
  started_at text,
  start_date text,
  updated_at text,
  completed_at text,
  department text not null,
  due text not null,
  priority text not null default 'medium',
  status text not null default 'backlog',
  completion_percent integer not null default 0,
  pending_reason text,
  delay_reason text,
  review_reason text,
  planned_today boolean not null default false,
  checklist_done integer not null default 0,
  checklist_total integer not null default 0,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at_db timestamptz not null default now()
);

create table if not exists public.pm_approvals (
  id text primary key,
  type text not null,
  requester text not null,
  department text not null,
  priority text not null default 'medium',
  status text not null default 'pending',
  submitted_at text not null,
  amount numeric,
  purpose text,
  task_id text references public.pm_tasks(id) on delete set null,
  task_title text,
  project_name text,
  completion_percent integer,
  reason text,
  approver_name text,
  response text,
  responded_by text,
  responded_at text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pm_activities (
  id text primary key,
  user_name text not null,
  action text not null,
  time text not null,
  department text,
  project_id text references public.pm_projects(id) on delete set null,
  project_name text,
  task_id text references public.pm_tasks(id) on delete set null,
  task_title text,
  type text,
  status text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.pm_notifications (
  id text primary key,
  user_id text references public.pm_users(id) on delete cascade,
  role text,
  department text,
  title text not null,
  body text not null,
  time text not null,
  read boolean not null default false,
  href text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.pm_comments (
  id text primary key,
  task_id text references public.pm_tasks(id) on delete cascade,
  project_id text references public.pm_projects(id) on delete cascade,
  user_id text references public.pm_users(id) on delete set null,
  user_name text not null,
  text text not null,
  time text not null,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.pm_leave_requests (
  id text primary key,
  requester_id text references public.pm_users(id) on delete set null,
  requester_name text not null,
  department text not null,
  from_date date not null,
  to_date date not null,
  leave_type text not null,
  reason text not null,
  status text not null default 'pending',
  approver_id text references public.pm_users(id) on delete set null,
  approver_name text,
  response text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pm_general_requests (
  id text primary key,
  requester_id text references public.pm_users(id) on delete set null,
  requester_name text not null,
  department text not null,
  request_type text not null,
  related_project_id text references public.pm_projects(id) on delete set null,
  related_task_id text references public.pm_tasks(id) on delete set null,
  reason text not null,
  priority text not null default 'medium',
  status text not null default 'pending',
  approver_id text references public.pm_users(id) on delete set null,
  approver_name text,
  response text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pm_tasks_project_idx on public.pm_tasks(project_id);
create index if not exists pm_tasks_assignee_idx on public.pm_tasks(assignee_id);
create index if not exists pm_tasks_department_idx on public.pm_tasks(department);
create index if not exists pm_approvals_status_idx on public.pm_approvals(status);
create index if not exists pm_activities_department_idx on public.pm_activities(department);
create index if not exists pm_notifications_user_idx on public.pm_notifications(user_id);

alter table public.pm_users enable row level security;
alter table public.pm_departments enable row level security;
alter table public.pm_projects enable row level security;
alter table public.pm_tasks enable row level security;
alter table public.pm_approvals enable row level security;
alter table public.pm_activities enable row level security;
alter table public.pm_notifications enable row level security;
alter table public.pm_comments enable row level security;
alter table public.pm_leave_requests enable row level security;
alter table public.pm_general_requests enable row level security;

drop policy if exists "public pm users read" on public.pm_users;
drop policy if exists "public pm users write" on public.pm_users;
drop policy if exists "public pm departments read" on public.pm_departments;
drop policy if exists "public pm departments write" on public.pm_departments;
drop policy if exists "public pm projects read" on public.pm_projects;
drop policy if exists "public pm projects write" on public.pm_projects;
drop policy if exists "public pm tasks read" on public.pm_tasks;
drop policy if exists "public pm tasks write" on public.pm_tasks;
drop policy if exists "public pm approvals read" on public.pm_approvals;
drop policy if exists "public pm approvals write" on public.pm_approvals;
drop policy if exists "public pm activities read" on public.pm_activities;
drop policy if exists "public pm activities write" on public.pm_activities;
drop policy if exists "public pm notifications read" on public.pm_notifications;
drop policy if exists "public pm notifications write" on public.pm_notifications;
drop policy if exists "public pm comments read" on public.pm_comments;
drop policy if exists "public pm comments write" on public.pm_comments;
drop policy if exists "public pm leave read" on public.pm_leave_requests;
drop policy if exists "public pm leave write" on public.pm_leave_requests;
drop policy if exists "public pm requests read" on public.pm_general_requests;
drop policy if exists "public pm requests write" on public.pm_general_requests;

create policy "public pm users read" on public.pm_users for select using (true);
create policy "public pm users write" on public.pm_users for all using (true) with check (true);
create policy "public pm departments read" on public.pm_departments for select using (true);
create policy "public pm departments write" on public.pm_departments for all using (true) with check (true);
create policy "public pm projects read" on public.pm_projects for select using (true);
create policy "public pm projects write" on public.pm_projects for all using (true) with check (true);
create policy "public pm tasks read" on public.pm_tasks for select using (true);
create policy "public pm tasks write" on public.pm_tasks for all using (true) with check (true);
create policy "public pm approvals read" on public.pm_approvals for select using (true);
create policy "public pm approvals write" on public.pm_approvals for all using (true) with check (true);
create policy "public pm activities read" on public.pm_activities for select using (true);
create policy "public pm activities write" on public.pm_activities for all using (true) with check (true);
create policy "public pm notifications read" on public.pm_notifications for select using (true);
create policy "public pm notifications write" on public.pm_notifications for all using (true) with check (true);
create policy "public pm comments read" on public.pm_comments for select using (true);
create policy "public pm comments write" on public.pm_comments for all using (true) with check (true);
create policy "public pm leave read" on public.pm_leave_requests for select using (true);
create policy "public pm leave write" on public.pm_leave_requests for all using (true) with check (true);
create policy "public pm requests read" on public.pm_general_requests for select using (true);
create policy "public pm requests write" on public.pm_general_requests for all using (true) with check (true);
