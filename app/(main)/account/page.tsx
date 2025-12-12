import { createClient } from "@/lib/supabase/server"
import { AccountContent } from "./account-content"

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id
  const userEmail = userData?.user?.email

  // Get profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

  return <AccountContent profile={profile} userId={userId || ""} userEmail={userEmail || ""} />
}
