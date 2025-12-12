"use client"

import type { Album, Song, Playlist, Profile } from "@/lib/types"
import { SongListItem } from "@/components/song-list-item"
import { Button } from "@/components/ui/button"
import { usePlayer } from "@/contexts/player-context"
import { Play, Pause, Music, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { mutate } from "swr"
import { PinDialog } from "@/components/pin-dialog"
import { useState } from "react"

interface AlbumContentProps {
  album: Album
  songs: Song[]
  playlists: Playlist[]
  profile: Profile | null
  userId: string
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function AlbumContent({ album, songs, playlists, profile, userId }: AlbumContentProps) {
  const { setQueue, currentSong, isPlaying, togglePlay } = usePlayer()
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const isCurrentAlbum = songs.some((s) => s.id === currentSong?.id)
  const totalDuration = songs.reduce((acc, song) => acc + (song.duration || 0), 0)

  const handlePlayAll = async () => {
    if (songs.length === 0) return

    // Check for explicit content
    const hasExplicit = songs.some((s) => s.is_explicit)
    if (hasExplicit && profile?.parental_controls_enabled && !profile.explicit_content_enabled) {
      setPendingAction(() => () => {
        setQueue(songs, 0)
        trackPlay(songs[0])
      })
      setShowPinDialog(true)
      return
    }

    if (isCurrentAlbum && isPlaying) {
      togglePlay()
    } else {
      setQueue(songs, 0)
      trackPlay(songs[0])
    }
  }

  const trackPlay = async (song: Song) => {
    const supabase = createClient()
    await supabase.from("recently_played").insert({
      user_id: userId,
      song_id: song.id,
      album_id: album.id,
    })
  }

  const handlePinSuccess = () => {
    setShowPinDialog(false)
    pendingAction?.()
    setPendingAction(null)
  }

  const handleAddToLibrary = async () => {
    const supabase = createClient()
    await supabase.from("library_items").insert({
      user_id: userId,
      album_id: album.id,
    })
  }

  return (
    <div className="p-8">
      {/* Album header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-48 h-48 shrink-0 rounded-lg bg-muted overflow-hidden shadow-lg">
          {album.cover_url ? (
            <img src={album.cover_url || "/placeholder.svg"} alt={album.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
            {album.is_single ? "Single" : "Album"}
          </p>
          <h1 className="text-4xl font-bold text-foreground mb-2">{album.title}</h1>
          <p className="text-muted-foreground mb-4">
            {album.artist?.display_name || album.artist?.artist_name || "Unbekannt"}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span>{songs.length} Songs</span>
            <span>•</span>
            <Clock className="h-4 w-4" />
            <span>{formatDuration(totalDuration)}</span>
          </div>
          <div className="flex gap-3">
            <Button size="lg" onClick={handlePlayAll} disabled={songs.length === 0}>
              {isCurrentAlbum && isPlaying ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Abspielen
                </>
              )}
            </Button>
            <Button size="lg" variant="outline" onClick={handleAddToLibrary}>
              Zur Bibliothek
            </Button>
          </div>
        </div>
      </div>

      {/* Songs list */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Songs</h2>
        {songs.length === 0 ? (
          <p className="text-muted-foreground">Keine Songs in diesem Album.</p>
        ) : (
          <div className="space-y-1">
            {songs.map((song) => {
              const isBlocked =
                song.is_explicit && profile?.parental_controls_enabled && !profile.explicit_content_enabled

              return (
                <SongListItem
                  key={song.id}
                  song={song}
                  queue={songs}
                  playlists={playlists}
                  showExplicitWarning={!!profile?.parental_controls_enabled}
                  isBlocked={isBlocked}
                  onRequestPin={async () => {
                    return new Promise((resolve) => {
                      setPendingAction(() => () => resolve(true))
                      setShowPinDialog(true)
                    })
                  }}
                  onPlaylistCreated={() => mutate(`playlists-${userId}`)}
                />
              )
            })}
          </div>
        )}
      </section>

      <PinDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        correctPin={profile?.parental_pin || ""}
        onSuccess={handlePinSuccess}
      />
    </div>
  )
}
