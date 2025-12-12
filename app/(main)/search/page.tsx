import { SearchContent } from "./search-content"
import { createClient } from "@/lib/supabase/server"

export default async function SearchPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  // Get search history
  const { data: searchHistory } = await supabase
    .from("search_history")
    .select("*")
    .eq("user_id", userId)
    .order("searched_at", { ascending: false })
    .limit(10)

  return <SearchContent initialSearchHistory={searchHistory || []} userId={userId || ""} />
}
