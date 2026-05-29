-- ============================================================
-- Event Camera — initial schema, policies, and realtime
-- Idempotent: safe to re-run.
-- Run in Supabase SQL Editor (or via `supabase db push`).
-- ============================================================

-- 0. Reset any leftover objects from previous attempts -------

drop table  if exists public.photos cascade;
drop table  if exists public.events cascade;
drop type   if exists reveal_mode;
drop type   if exists visibility_mode;
drop policy if exists "storage_event_photos_read"   on storage.objects;
drop policy if exists "storage_event_photos_insert" on storage.objects;
drop policy if exists "storage_event_photos_delete" on storage.objects;

-- 1. Enums --------------------------------------------------

create type reveal_mode as enum ('live', 'end', 'scheduled');
create type visibility_mode as enum ('owner', 'everyone');

-- 2. events --------------------------------------------------

create table public.events (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  slug             text not null unique,
  name             text not null,
  end_at           timestamptz not null,
  reveal_mode      reveal_mode not null default 'live',
  reveal_at        timestamptz,
  shots_per_person integer,                                   -- null = unlimited
  visibility       visibility_mode not null default 'everyone',
  created_at       timestamptz not null default now()
);

create index events_owner_id_idx on public.events (owner_id);
create index events_slug_idx     on public.events (slug);

-- 3. photos --------------------------------------------------

create table public.photos (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events(id) on delete cascade,
  uploader_id      uuid references auth.users(id) on delete set null,
  guest_session    text,
  participant_name text not null,
  storage_path     text not null,
  created_at       timestamptz not null default now()
);

create index photos_event_recent_idx on public.photos (event_id, created_at desc);

-- 4. Row-level security on data tables -----------------------

alter table public.events enable row level security;
alter table public.photos enable row level security;

-- 5. events policies -----------------------------------------

-- Anyone can read events (guests need this to land on /event/[slug])
create policy "events_select_public" on public.events
  for select using (true);

create policy "events_insert_owner" on public.events
  for insert to authenticated
  with check (auth.uid() = owner_id);

create policy "events_update_owner" on public.events
  for update to authenticated
  using      (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "events_delete_owner" on public.events
  for delete to authenticated
  using (auth.uid() = owner_id);

-- 6. photos policies -----------------------------------------

create policy "photos_select_public" on public.photos
  for select using (true);

-- Anyone (including guests) can insert a photo to an event that hasn't ended
create policy "photos_insert_active_event" on public.photos
  for insert
  with check (
    exists (
      select 1 from public.events e
      where e.id = photos.event_id
        and e.end_at > now()
    )
  );

create policy "photos_delete_owner" on public.photos
  for delete to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = photos.event_id
        and e.owner_id = auth.uid()
    )
  );

-- 7. Realtime ------------------------------------------------
-- Subscribe to new photos for live galleries
alter publication supabase_realtime add table public.photos;

-- 8. Storage policies ----------------------------------------
-- Bucket "event-photos" must exist (public) before these run.
-- Create it in Dashboard → Storage → New bucket, name = event-photos, public = on.

create policy "storage_event_photos_read"
  on storage.objects for select
  using (bucket_id = 'event-photos');

create policy "storage_event_photos_insert"
  on storage.objects for insert
  with check (bucket_id = 'event-photos');

create policy "storage_event_photos_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-photos'
    and exists (
      select 1 from public.events e
      where e.owner_id = auth.uid()
        and e.id::text = split_part(storage.objects.name, '/', 1)
    )
  );

-- 9. Notify PostgREST so the schema cache picks up the changes immediately
notify pgrst, 'reload schema';
