-- CivicTrack Supabase PostgreSQL Schema & Row-Level Security Policies
-- Run in Supabase SQL Editor or via Supabase CLI migrations

create extension if not exists "pgcrypto";

-- 1. Departments
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  description text not null default '',
  contact_email text not null,
  contact_phone text not null default '',
  head_name text not null default '',
  sla_hours integer not null default 72,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Profiles (linked 1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text not null default '',
  address text not null default '',
  role text not null default 'citizen' check (role in ('citizen', 'admin')),
  department_id uuid references public.departments(id) on delete set null,
  avatar_url text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Complaints
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  reference_id text not null unique,
  citizen_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null check (
    category in (
      'Road Damage & Potholes',
      'Broken Streetlights',
      'Garbage Accumulation',
      'Blocked Drainage',
      'Water Leakage',
      'Damaged Public Infrastructure',
      'Environmental & Civic'
    )
  ),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'submitted' check (
    status in ('submitted', 'under_review', 'in_progress', 'resolved', 'rejected')
  ),
  department_id uuid references public.departments(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  latitude double precision not null,
  longitude double precision not null,
  address text not null,
  ward text not null default '',
  photo_url text not null default '',
  resolution_notes text not null default '',
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_complaints_reference_id on public.complaints(reference_id);
create index if not exists idx_complaints_citizen_id on public.complaints(citizen_id);
create index if not exists idx_complaints_status on public.complaints(status);
create index if not exists idx_complaints_department_id on public.complaints(department_id);

-- 4. Complaint Timeline Updates
create table if not exists public.complaint_updates (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  updated_by uuid references public.profiles(id) on delete set null,
  author_name text not null,
  author_role text not null check (author_role in ('citizen', 'admin')),
  previous_status text,
  new_status text not null,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_complaint_updates_complaint_id on public.complaint_updates(complaint_id);

-- 5. Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  complaint_id uuid references public.complaints(id) on delete cascade,
  reference_id text not null default '',
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info', 'status_change', 'assignment', 'resolved')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);

-- 6. Automatically create profile on Supabase Auth user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, address, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'address', ''),
    'citizen'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Helper to check admin role
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

-- 8. Row Level Security
alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_updates enable row level security;
alter table public.notifications enable row level security;

-- Departments policies
create policy "Anyone can read active departments"
  on public.departments for select using (true);
create policy "Admins manage departments"
  on public.departments for all using (public.is_admin());

-- Profiles policies
create policy "Users view own profile or admins view all"
  on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));
create policy "Admins update any profile"
  on public.profiles for update using (public.is_admin());

-- Complaints policies
create policy "Public tracking by reference_id or owner or admin"
  on public.complaints for select using (true);
create policy "Authenticated citizens create complaints"
  on public.complaints for insert with check (auth.uid() = citizen_id);
create policy "Admins update complaints"
  on public.complaints for update using (public.is_admin());

-- Complaint updates policies
create policy "Anyone can read updates for tracked complaints"
  on public.complaint_updates for select using (true);
create policy "Admins or complaint owner insert updates"
  on public.complaint_updates for insert with check (
    public.is_admin() or exists (
      select 1 from public.complaints c where c.id = complaint_id and c.citizen_id = auth.uid()
    )
  );

-- Notifications policies
create policy "Users view own notifications"
  on public.notifications for select using (auth.uid() = user_id);
create policy "Users mark own notifications read"
  on public.notifications for update using (auth.uid() = user_id);
create policy "Admins or system insert notifications"
  on public.notifications for insert with check (public.is_admin() or auth.uid() is not null);

-- 9. Storage Bucket for Complaint Photographs
insert into storage.buckets (id, name, public)
values ('complaint-photos', 'complaint-photos', true)
on conflict (id) do nothing;

create policy "Public read access for complaint photos"
  on storage.objects for select
  using (bucket_id = 'complaint-photos');

create policy "Authenticated users upload complaint photos"
  on storage.objects for insert
  with check (bucket_id = 'complaint-photos' and auth.role() = 'authenticated');

-- 10. Seed Municipal Departments
insert into public.departments (name, code, description, contact_email, contact_phone, head_name, sla_hours)
values
  ('Roads & Transportation', 'ROAD', 'Potholes, asphalt resurfacing, sidewalks, traffic signage, and roadway hazards.', 'roads@civictrack.gov', '(555) 201-4100', 'Marcus Vance, PE', 48),
  ('Street Lighting & Electrical', 'LGHT', 'Streetlight outages, downed poles, pedestrian signal maintenance, and civic electrical.', 'lighting@civictrack.gov', '(555) 201-4200', 'Elena Rostova', 36),
  ('Sanitation & Solid Waste', 'SANI', 'Overflowing public bins, illegal dumping, street sweeping, and waste collection.', 'sanitation@civictrack.gov', '(555) 201-4300', 'David Okafor', 24),
  ('Water & Storm Drainage', 'WATR', 'Blocked storm drains, water main leaks, sewer backups, and street flooding.', 'water@civictrack.gov', '(555) 201-4400', 'Priya Nair, PE', 24),
  ('Parks & Public Facilities', 'PARK', 'Damaged benches, playground safety, park structures, and municipal buildings.', 'parks@civictrack.gov', '(555) 201-4500', 'Hannah Lindqvist', 72)
on conflict (code) do nothing;
