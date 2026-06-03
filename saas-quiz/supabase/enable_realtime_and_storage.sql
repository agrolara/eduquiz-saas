-- 1. Ensure the 'quiz-assets' bucket exists and is public
insert into storage.buckets (id, name, public)
values ('quiz-assets', 'quiz-assets', true)
on conflict (id) do nothing;

-- Drop existing storage policies if any to prevent conflicts
drop policy if exists "Allow authenticated uploads to quiz-assets" on storage.objects;
drop policy if exists "Allow public read from quiz-assets" on storage.objects;
drop policy if exists "Allow authenticated updates to quiz-assets" on storage.objects;
drop policy if exists "Allow authenticated deletes from quiz-assets" on storage.objects;

-- Create policies to allow authenticated users to upload/update/delete, and anyone to view
create policy "Allow authenticated uploads to quiz-assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'quiz-assets');

create policy "Allow public read from quiz-assets"
on storage.objects for select
to public
using (bucket_id = 'quiz-assets');

create policy "Allow authenticated updates to quiz-assets"
on storage.objects for update
to authenticated
using (bucket_id = 'quiz-assets');

create policy "Allow authenticated deletes from quiz-assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'quiz-assets');


-- 2. Enable Supabase Realtime for the game-related tables safely
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sesiones_juego'
  ) then
    alter publication supabase_realtime add table public.sesiones_juego;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'preguntas'
  ) then
    alter publication supabase_realtime add table public.preguntas;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'respuestas'
  ) then
    alter publication supabase_realtime add table public.respuestas;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rankings'
  ) then
    alter publication supabase_realtime add table public.rankings;
  end if;
end $$;
