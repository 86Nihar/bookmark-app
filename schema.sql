-- Create the bookmarks table
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  title text not null check (char_length(title) > 0),
  url text not null,
  user_id uuid references auth.users not null default auth.uid(),
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table bookmarks enable row level security;

-- Policy: Users can only see their own bookmarks
create policy "Users can select their own bookmarks"
on bookmarks for select
to authenticated
using (auth.uid() = user_id);

-- Policy: Users can insert their own bookmarks
create policy "Users can insert their own bookmarks"
on bookmarks for insert
to authenticated
with check (auth.uid() = user_id);

-- Policy: Users can delete their own bookmarks
create policy "Users can delete their own bookmarks"
on bookmarks for delete
to authenticated
using (auth.uid() = user_id);

-- Enable Realtime for bookmarks table
alter publication supabase_realtime add table bookmarks;
