-- Profiles table for user data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  is_artist BOOLEAN DEFAULT FALSE,
  artist_name TEXT,
  artist_bio TEXT,
  parental_controls_enabled BOOLEAN DEFAULT FALSE,
  parental_pin TEXT,
  music_videos_enabled BOOLEAN DEFAULT TRUE,
  explicit_content_enabled BOOLEAN DEFAULT TRUE,
  theme_preference TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE USING (auth.uid() = id);

-- Albums table
CREATE TABLE IF NOT EXISTS albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_url TEXT,
  is_single BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "albums_select_all" ON albums FOR SELECT TO authenticated USING (true);
CREATE POLICY "albums_insert_own" ON albums FOR INSERT WITH CHECK (auth.uid() = artist_id);
CREATE POLICY "albums_update_own" ON albums FOR UPDATE USING (auth.uid() = artist_id);
CREATE POLICY "albums_delete_own" ON albums FOR DELETE USING (auth.uid() = artist_id);

-- Songs table
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  audio_url TEXT,
  cover_url TEXT,
  duration INTEGER DEFAULT 0,
  is_explicit BOOLEAN DEFAULT FALSE,
  has_music_video BOOLEAN DEFAULT FALSE,
  music_video_url TEXT,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "songs_select_all" ON songs FOR SELECT TO authenticated USING (true);
CREATE POLICY "songs_insert_own" ON songs FOR INSERT WITH CHECK (auth.uid() = artist_id);
CREATE POLICY "songs_update_own" ON songs FOR UPDATE USING (auth.uid() = artist_id);
CREATE POLICY "songs_delete_own" ON songs FOR DELETE USING (auth.uid() = artist_id);

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playlists_select_own" ON playlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "playlists_insert_own" ON playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "playlists_update_own" ON playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "playlists_delete_own" ON playlists FOR DELETE USING (auth.uid() = user_id);

-- Playlist songs (junction table)
CREATE TABLE IF NOT EXISTS playlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  position INTEGER DEFAULT 0,
  UNIQUE(playlist_id, song_id)
);

ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playlist_songs_select_own" ON playlist_songs FOR SELECT 
  USING (EXISTS (SELECT 1 FROM playlists WHERE playlists.id = playlist_songs.playlist_id AND playlists.user_id = auth.uid()));
CREATE POLICY "playlist_songs_insert_own" ON playlist_songs FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM playlists WHERE playlists.id = playlist_songs.playlist_id AND playlists.user_id = auth.uid()));
CREATE POLICY "playlist_songs_delete_own" ON playlist_songs FOR DELETE 
  USING (EXISTS (SELECT 1 FROM playlists WHERE playlists.id = playlist_songs.playlist_id AND playlists.user_id = auth.uid()));

-- Library (saved songs/albums)
CREATE TABLE IF NOT EXISTS library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT library_item_type CHECK (
    (song_id IS NOT NULL AND album_id IS NULL) OR 
    (song_id IS NULL AND album_id IS NOT NULL)
  )
);

ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "library_select_own" ON library_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "library_insert_own" ON library_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "library_delete_own" ON library_items FOR DELETE USING (auth.uid() = user_id);

-- Recently played
CREATE TABLE IF NOT EXISTS recently_played (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recently_played ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recently_played_select_own" ON recently_played FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recently_played_insert_own" ON recently_played FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recently_played_delete_own" ON recently_played FOR DELETE USING (auth.uid() = user_id);

-- Search history
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_history_select_own" ON search_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "search_history_insert_own" ON search_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "search_history_delete_own" ON search_history FOR DELETE USING (auth.uid() = user_id);
