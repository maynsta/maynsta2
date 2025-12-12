"use client"

import type { Profile, RecentlyPlayed, Song, Album } from "@/lib/types"
import { SongListItem } from "@/components/song-list-item"
import { AlbumCard } from "@/components/album-card"
import { Music, Headphones } from "lucide-react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

interface HomeContentProps {
  profile: Profile | null
  recentlyPlayed: RecentlyPlayed[]
  hasHistory: boolean
  userId: string
}

export function HomeContent({ profile, recentlyPlayed: initialRecentlyPlayed, hasHistory, userId }: HomeContentProps) {
  const { data: playlists } = useSWR(userId ? `playlists-${userId}` : null, async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    return data || []
  })

  // Extract unique songs and albums from recently played
  const recentSongs: Song[] = []
  const recentAlbums: Album[] = []
  const seenSongs = new Set<string>()
  const seenAlbums = new Set<string>()

  for (const item of initialRecentlyPlayed) {
    if (item.song && !seenSongs.has(item.song.id)) {
      seenSongs.add(item.song.id)
      recentSongs.push(item.song)
    }
    if (item.album && !seenAlbums.has(item.album.id)) {
      seenAlbums.add(item.album.id)
      recentAlbums.push(item.album)
    }
  }

  if (!hasHistory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mb-6">
          <Headphones className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Willkommen{profile?.display_name ? `, ${profile.display_name}` : ""}!
        </h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Entdecke neue Musik und beginne deine Reise. Suche nach Songs, erstelle Playlists und höre deine
          Lieblingsmusik.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Music className="h-4 w-4" />
          <span>Nutze die Suche, um Songs zu finden</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Willkommen zurück{profile?.display_name ? `, ${profile.display_name}` : ""}!
      </h1>
      <p className="text-muted-foreground mb-8">Hier ist, was du zuletzt gehört hast.</p>

      {recentSongs.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4">Zuletzt gehörte Songs</h2>
          <div className="space-y-1">
            {recentSongs.slice(0, 5).map((song) => (
              <SongListItem key={song.id} song={song} queue={recentSongs} playlists={playlists || []} />
            ))}
          </div>
        </section>
      )}

      {recentAlbums.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Zuletzt gehörte Alben</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {recentAlbums.slice(0, 5).map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
