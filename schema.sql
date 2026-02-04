-- Create tables for Simple CRM

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: forms
create table public.forms (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  schema jsonb default '[]'::jsonb, -- configuration of fields
  user_id uuid default auth.uid() -- if using auth
);

-- Table: leads
create table public.leads (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  form_id uuid references public.forms(id) on delete cascade not null,
  data jsonb default '{}'::jsonb -- submitted data
);

-- Enable RLS
alter table public.forms enable row level security;
alter table public.leads enable row level security;

-- Policies (Simple public access for demo purposes, adjust for production)
-- Allow read/write for now
create policy "Allow all access to forms" on public.forms for all using (true) with check (true);
create policy "Allow all access to leads" on public.leads for all using (true) with check (true);
