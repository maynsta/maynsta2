import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { PlayerBar } from "@/components/player-bar"
import { PlayerProvider } from "@/contexts/player-context"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (!data?.user) {
    redirect("/auth/login")
  }

  return (
    <PlayerProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-64 pb-24 min-h-screen">{children}</main>
        <PlayerBar />
      </div>
    </PlayerProvider>
  )
}
