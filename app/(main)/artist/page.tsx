import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ArtistDashboard } from "./artist-dashboard"

export default async function ArtistPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  // Get profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

  // Redirect if not an artist
  if (!profile?.is_artist) {
    redirect("/account")
  }

  // Get artist's albums
  const { data: albums } = await supabase
    .from("albums")
    .select("*, songs(*)")
    .eq("artist_id", userId)
    .order("created_at", { ascending: false })

  // Get singles (songs without album)
  const { data: singles } = await supabase
    .from("songs")
    .select("*")
    .eq("artist_id", userId)
    .is("album_id", null)
    .order("created_at", { ascending: false })

  return <ArtistDashboard profile={profile} albums={albums || []} singles={singles || []} userId={userId || ""} />
}
