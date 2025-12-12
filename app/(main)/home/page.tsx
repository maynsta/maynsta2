import { createClient } from "@/lib/supabase/server"
import { HomeContent } from "./home-content"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

  // Get recently played
  const { data: recentlyPlayed } = await supabase
    .from("recently_played")
    .select(
      `
      *,
      song:songs(*, artist:profiles(*)),
      album:albums(*, artist:profiles(*))
    `,
    )
    .eq("user_id", userId)
    .order("played_at", { ascending: false })
    .limit(10)

  const hasHistory = recentlyPlayed && recentlyPlayed.length > 0

  return (
    <HomeContent
      profile={profile}
      recentlyPlayed={recentlyPlayed || []}
      hasHistory={hasHistory || false}
      userId={userId || ""}
    />
  )
}
