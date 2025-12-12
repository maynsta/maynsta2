import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { AlbumContent } from "./album-content"

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  // Get album with songs
  const { data: album } = await supabase.from("albums").select("*, artist:profiles(*)").eq("id", id).single()

  if (!album) {
    notFound()
  }

  // Get songs for this album
  const { data: songs } = await supabase
    .from("songs")
    .select("*, artist:profiles(*)")
    .eq("album_id", id)
    .order("created_at", { ascending: true })

  // Get user's playlists
  const { data: playlists } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  // Get user's profile for parental controls
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

  return (
    <AlbumContent
      album={album}
      songs={songs || []}
      playlists={playlists || []}
      profile={profile}
      userId={userId || ""}
    />
  )
}
