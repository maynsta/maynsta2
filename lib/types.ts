export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  is_artist: boolean
  artist_name: string | null
  artist_bio: string | null
  parental_controls_enabled: boolean
  parental_pin: string | null
  music_videos_enabled: boolean
  explicit_content_enabled: boolean
  theme_preference: "light" | "dark" | "system"
  created_at: string
  updated_at: string
}

export interface Album {
  id: string
  artist_id: string
  title: string
  cover_url: string | null
  is_single: boolean
  created_at: string
  artist?: Profile
  songs?: Song[]
}

export interface Song {
  id: string
  album_id: string | null
  artist_id: string
  title: string
  audio_url: string | null
  cover_url: string | null
  duration: number
  is_explicit: boolean
  has_music_video: boolean
  music_video_url: string | null
  play_count: number
  created_at: string
  artist?: Profile
  album?: Album
}

export interface Playlist {
  id: string
  user_id: string
  name: string
  cover_url: string | null
  created_at: string
  updated_at: string
  songs?: Song[]
}

export interface LibraryItem {
  id: string
  user_id: string
  song_id: string | null
  album_id: string | null
  added_at: string
  song?: Song
  album?: Album
}

export interface RecentlyPlayed {
  id: string
  user_id: string
  song_id: string | null
  album_id: string | null
  played_at: string
  song?: Song
  album?: Album
}

export interface SearchHistory {
  id: string
  user_id: string
  query: string
  searched_at: string
}
