-- Applied to the existing Ascend Private Supabase project.
-- Books are isolated per authenticated user. User cover/background images are private.
create table if not exists public.ascend_books (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  book jsonb not null check (jsonb_typeof(book)='object'),
  updated_at timestamptz not null default now(),
  primary key(user_id,id)
);
create index if not exists ascend_books_user_updated_idx on public.ascend_books(user_id,updated_at desc);
alter table public.ascend_books enable row level security;
grant usage on schema public to authenticated;
grant select,insert,update,delete on public.ascend_books to authenticated;
revoke all on public.ascend_books from anon;
revoke truncate,references,trigger on public.ascend_books from authenticated,anon,public;

drop policy if exists books_owner_select on public.ascend_books;
drop policy if exists books_owner_insert on public.ascend_books;
drop policy if exists books_owner_update on public.ascend_books;
drop policy if exists books_owner_delete on public.ascend_books;
create policy books_owner_select on public.ascend_books for select to authenticated using ((select auth.uid())=user_id);
create policy books_owner_insert on public.ascend_books for insert to authenticated with check ((select auth.uid())=user_id);
create policy books_owner_update on public.ascend_books for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy books_owner_delete on public.ascend_books for delete to authenticated using ((select auth.uid())=user_id);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('ascend-private-media','ascend-private-media',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists ascend_media_read on storage.objects;
drop policy if exists ascend_media_insert on storage.objects;
drop policy if exists ascend_media_update on storage.objects;
drop policy if exists ascend_media_delete on storage.objects;
create policy ascend_media_read on storage.objects for select to authenticated
  using (bucket_id='ascend-private-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy ascend_media_insert on storage.objects for insert to authenticated
  with check (bucket_id='ascend-private-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy ascend_media_update on storage.objects for update to authenticated
  using (bucket_id='ascend-private-media' and (storage.foldername(name))[1]=(select auth.uid())::text)
  with check (bucket_id='ascend-private-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy ascend_media_delete on storage.objects for delete to authenticated
  using (bucket_id='ascend-private-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
