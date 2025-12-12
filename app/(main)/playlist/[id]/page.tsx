import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PlaylistContent } from "./playlist-content"

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  // Get playlist
  const { data: playlist } = await supabase.from("playlists").select("*").eq("id", id).eq("user_id", userId).single()

  if (!playlist) {
    notFound()
  }

  // Get playlist songs
  const { data: playlistSongs } = await supabase
    .from("playlist_songs")
    .select("*, song:songs(*, artist:profiles(*))")
    .eq("playlist_id", id)
    .order("position", { ascending: true })

  // Get all user playlists for adding songs
  const { data: allPlaylists } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  // Get profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

  return (
    <PlaylistContent
      playlist={playlist}
      playlistSongs={playlistSongs || []}
      allPlaylists={allPlaylists || []}
      profile={profile}
      userId={userId || ""}
    />
  )
}
