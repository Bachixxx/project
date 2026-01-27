-- Create a new storage bucket for branding assets
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true);

-- Policy to allow authenticated users (coaches) to upload files
create policy "Coaches can upload branding images"
  on storage.objects for insert
  with check ( bucket_id = 'branding' and auth.role() = 'authenticated' );

-- Policy to allow authenticated users (coaches) to update their own files
create policy "Coaches can update their branding images"
  on storage.objects for update
  using ( bucket_id = 'branding' and auth.uid() = owner )
  with check ( bucket_id = 'branding' and auth.uid() = owner );

-- Policy to allow public access to view branding images (needed for clients)
create policy "Anyone can view branding images"
  on storage.objects for select
  using ( bucket_id = 'branding' );

-- Policy to allow coaches to delete their own files
create policy "Coaches can delete branding images"
  on storage.objects for delete
  using ( bucket_id = 'branding' and auth.uid() = owner );
