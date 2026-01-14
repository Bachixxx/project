-- Policy: Allow admins to view the waitlist
create policy "Admins can view waitlist"
  on public.waitlist
  for select
  to authenticated
  using (
    exists (
      select 1 from public.coaches
      where coaches.id = auth.uid()
      and coaches.is_admin = true
    )
  );
