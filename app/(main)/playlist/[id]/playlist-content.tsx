"use client"

import type { Playlist, Profile, Song } from "@/lib/types"
import { SongListItem } from "@/components/song-list-item"
import { Button } from "@/components/ui/button"
import { usePlayer } from "@/contexts/player-context"
import { Play, Pause, Music, Clock, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import useSWR, { mutate } from "swr"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface PlaylistSongItem {
  id: string
  song: Song
  position: number
}

interface PlaylistContentProps {
  playlist: Playlist
  playlistSongs: PlaylistSongItem[]
  allPlaylists: Playlist[]
  profile: Profile | null
  userId: string
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function PlaylistContent({
  playlist,
  playlistSongs: initialPlaylistSongs,
  allPlaylists,
  profile,
  userId,
}: PlaylistContentProps) {
  const { setQueue, currentSong, isPlaying, togglePlay } = usePlayer()
  const router = useRouter()

  const { data: playlistSongs } = useSWR(
    `playlist-songs-${playlist.id}`,
    async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("playlist_songs")
        .select("*, song:songs(*, artist:profiles(*))")
        .eq("playlist_id", playlist.id)
        .order("position", { ascending: true })
      return data || []
    },
    { fallbackData: initialPlaylistSongs },
  )

  const songs: Song[] = (playlistSongs || []).map((item) => item.song).filter(Boolean) as Song[]
  const isCurrentPlaylist = songs.some((s) => s.id === currentSong?.id)
  const totalDuration = songs.reduce((acc, song) => acc + (song.duration || 0), 0)

  const handlePlayAll = () => {
    if (songs.length === 0) return

    if (isCurrentPlaylist && isPlaying) {
      togglePlay()
    } else {
      setQueue(songs, 0)
    }
  }

  const handleDeletePlaylist = async () => {
    const supabase = createClient()
    await supabase.from("playlists").delete().eq("id", playlist.id)
    mutate(`playlists-${userId}`)
    router.push("/library")
  }

  return (
    <div className="p-8">
      {/* Playlist header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-48 h-48 shrink-0 rounded-lg bg-muted overflow-hidden shadow-lg">
          {playlist.cover_url ? (
            <img
              src={playlist.cover_url || "/placeholder.svg"}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Music className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Playlist</p>
          <h1 className="text-4xl font-bold text-foreground mb-4">{playlist.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span>{songs.length} Songs</span>
            <span>•</span>
            <Clock className="h-4 w-4" />
            <span>{formatDuration(totalDuration)}</span>
          </div>
          <div className="flex gap-3">
            <Button size="lg" onClick={handlePlayAll} disabled={songs.length === 0}>
              {isCurrentPlaylist && isPlaying ? (
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" variant="outline">
                  <Trash2 className="h-5 w-5 mr-2" />
                  Löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Playlist löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bist du sicher, dass du die Playlist "{playlist.name}" löschen möchtest? Diese Aktion kann nicht
                    rückgängig gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletePlaylist}>Löschen</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Songs list */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Songs</h2>
        {songs.length === 0 ? (
          <div className="text-center py-12">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Noch keine Songs in dieser Playlist.</p>
            <p className="text-sm text-muted-foreground mt-2">Suche nach Songs und füge sie hinzu.</p>
          </div>
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
                  playlists={allPlaylists}
                  showExplicitWarning={!!profile?.parental_controls_enabled}
                  isBlocked={isBlocked}
                  onPlaylistCreated={() => mutate(`playlists-${userId}`)}
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
