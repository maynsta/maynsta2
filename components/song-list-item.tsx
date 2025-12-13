"use client"

import type { Song, Playlist } from "@/lib/types"
import { usePlayer } from "@/contexts/player-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Play, MoreHorizontal, Plus, ListPlus, Music } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"
import { useToast } from "@/hooks/use-toast"

interface SongListItemProps {
  song: Song
  queue?: Song[]
  playlists?: Playlist[]
  onAddToLibrary?: (song: Song) => void
  onPlaylistCreated?: () => void
  showExplicitWarning?: boolean
  isBlocked?: boolean
  onRequestPin?: () => Promise<boolean>
}

export function SongListItem({
  song,
  queue,
  playlists = [],
  onAddToLibrary,
  onPlaylistCreated,
  showExplicitWarning = false,
  isBlocked = false,
  onRequestPin,
}: SongListItemProps) {
  const { playSong, currentSong, isPlaying } = usePlayer()
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)
  const { toast } = useToast()
  const isCurrentSong = currentSong?.id === song.id

  const handlePlay = async () => {
    if (isBlocked && onRequestPin) {
      const allowed = await onRequestPin()
      if (!allowed) return
    }
    playSong(song, queue || [song])
  }

  const handleAddToLibrary = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: "Fehler",
        description: "Du musst eingeloggt sein.",
        variant: "destructive",
      })
      return
    }

    // Check if already in library
    const { data: existing } = await supabase
      .from("library_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("song_id", song.id)
      .maybeSingle()

    if (existing) {
      toast({
        title: "Info",
        description: "Song ist bereits in deiner Bibliothek.",
      })
      return
    }

    const { error } = await supabase.from("library_items").insert({
      user_id: user.id,
      song_id: song.id,
    })

    if (error) {
      console.log("[v0] Error adding to library:", error)
      toast({
        title: "Fehler",
        description: "Konnte nicht zur Bibliothek hinzugefügt werden.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Hinzugefügt",
      description: `"${song.title}" wurde zur Bibliothek hinzugefügt.`,
    })

    onAddToLibrary?.(song)
  }

  const handleAddToPlaylist = async (playlistId: string) => {
    const supabase = createClient()

    // Get current max position
    const { data: existingSongs } = await supabase
      .from("playlist_songs")
      .select("position")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: false })
      .limit(1)

    const nextPosition = existingSongs && existingSongs.length > 0 ? existingSongs[0].position + 1 : 0

    const { error } = await supabase.from("playlist_songs").insert({
      playlist_id: playlistId,
      song_id: song.id,
      position: nextPosition,
    })

    if (error) {
      toast({
        title: "Fehler",
        description: "Konnte nicht zur Playlist hinzugefügt werden.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Hinzugefügt",
      description: `"${song.title}" wurde zur Playlist hinzugefügt.`,
    })
  }

  return (
    <>
      <div
        className={`flex items-center gap-3 p-3 rounded-[510px]-lg hover:bg-accent/50 transition-colors group ${
          isBlocked && showExplicitWarning ? "opacity-50" : ""
        }`}
      >
        {/* Cover */}
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[510px]-md bg-muted overflow-hidden">
          {song.cover_url ? (
            <img src={song.cover_url || "/placeholder.svg"} alt={song.title} className="h-full w-full object-cover" />
          ) : (
            <Music className="h-5 w-5 text-muted-foreground" />
          )}
          {isCurrentSong && isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex gap-0.5">
                <span className="h-3 w-0.5 bg-primary animate-pulse" />
                <span className="h-4 w-0.5 bg-primary animate-pulse delay-75" />
                <span className="h-2 w-0.5 bg-primary animate-pulse delay-150" />
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate ${isCurrentSong ? "text-primary" : "text-foreground"} ${isBlocked && showExplicitWarning ? "line-through" : ""}`}
          >
            {song.title}
            {song.is_explicit && <span className="ml-2 text-xs text-muted-foreground bg-muted px-1 rounded-[510px]">E</span>}
          </p>
          <p className="text-xs text-muted-foreground truncate">{song.artist?.display_name || "Unbekannt"}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-[510px]-full"
            onClick={handlePlay}
            disabled={isBlocked}
          >
            <Play className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[510px]-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleAddToLibrary}>
                <Plus className="h-4 w-4 mr-2" />
                Zur Bibliothek hinzufügen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCreatePlaylist(true)}>
                <ListPlus className="h-4 w-4 mr-2" />
                Playlist erstellen
              </DropdownMenuItem>
              {playlists.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {playlists.map((playlist) => (
                    <DropdownMenuItem key={playlist.id} onClick={() => handleAddToPlaylist(playlist.id)}>
                      {playlist.name}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CreatePlaylistDialog
        open={showCreatePlaylist}
        onOpenChange={setShowCreatePlaylist}
        onCreated={onPlaylistCreated}
      />
    </>
  )
}
