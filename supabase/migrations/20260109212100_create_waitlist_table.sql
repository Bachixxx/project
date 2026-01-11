-- Create waitlist table
create table if not exists public.waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.waitlist enable row level security;

-- Policy: Allow anonymous users to insert (join waitlist)
create policy "Anyone can join waitlist"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

-- Policy: Only admins/service role can view (or maybe no one needs to view from frontend)
-- For now, let's allow service role only for viewing
create policy "Service role can view waitlist"
  on public.waitlist
  for select
  to service_role
  using (true);
