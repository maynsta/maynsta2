import { createClient } from "@/lib/supabase/server"
import { LibraryContent } from "./library-content"

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  // Get playlists
  const { data: playlists } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  // Get library items (songs)
  const { data: librarySongs } = await supabase
    .from("library_items")
    .select("*, song:songs(*, artist:profiles(*))")
    .eq("user_id", userId)
    .not("song_id", "is", null)
    .order("added_at", { ascending: false })

  // Get library items (albums)
  const { data: libraryAlbums } = await supabase
    .from("library_items")
    .select("*, album:albums(*, artist:profiles(*))")
    .eq("user_id", userId)
    .not("album_id", "is", null)
    .order("added_at", { ascending: false })

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

  return (
    <LibraryContent
      playlists={playlists || []}
      librarySongs={librarySongs || []}
      libraryAlbums={libraryAlbums || []}
      profile={profile}
      userId={userId || ""}
    />
  )
}
