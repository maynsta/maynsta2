"use client"

import { useState } from "react"
import type { Playlist, LibraryItem, Profile, Song, Album } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Grid, List, Music, Disc } from "lucide-react"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"
import { PlaylistCard } from "@/components/playlist-card"
import { SongListItem } from "@/components/song-list-item"
import { AlbumCard } from "@/components/album-card"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

interface LibraryContentProps {
  playlists: Playlist[]
  librarySongs: LibraryItem[]
  libraryAlbums: LibraryItem[]
  profile: Profile | null
  userId: string
}

export function LibraryContent({
  playlists: initialPlaylists,
  librarySongs: initialLibrarySongs,
  libraryAlbums: initialLibraryAlbums,
  profile,
  userId,
}: LibraryContentProps) {
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  const { data: playlists, mutate: mutatePlaylists } = useSWR(
    `playlists-${userId}`,
    async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
      return data || []
    },
    { fallbackData: initialPlaylists },
  )

  const { data: librarySongs } = useSWR(
    `library-songs-${userId}`,
    async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("library_items")
        .select("*, song:songs(*, artist:profiles(*))")
        .eq("user_id", userId)
        .not("song_id", "is", null)
        .order("added_at", { ascending: false })
      return data || []
    },
    { fallbackData: initialLibrarySongs },
  )

  const { data: libraryAlbums } = useSWR(
    `library-albums-${userId}`,
    async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("library_items")
        .select("*, album:albums(*, artist:profiles(*))")
        .eq("user_id", userId)
        .not("album_id", "is", null)
        .order("added_at", { ascending: false })
      return data || []
    },
    { fallbackData: initialLibraryAlbums },
  )

  const songs: Song[] = (librarySongs || []).map((item) => item.song).filter(Boolean) as Song[]
  const albums: Album[] = (libraryAlbums || []).map((item) => item.album).filter(Boolean) as Album[]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Bibliothek</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            title="Listenansicht"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            title="Rasteransicht"
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="playlists">
        <TabsList className="mb-6">
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="songs">Songs</TabsTrigger>
          <TabsTrigger value="albums">Alben</TabsTrigger>
        </TabsList>

        <TabsContent value="playlists">
          <div className="mb-4">
            <Button onClick={() => setShowCreatePlaylist(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Playlist erstellen
            </Button>
          </div>

          {!playlists || playlists.length === 0 ? (
            <div className="text-center py-12">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Noch keine Playlists erstellt.</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} variant="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} variant="list" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="songs">
          {songs.length === 0 ? (
            <div className="text-center py-12">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Noch keine Songs in der Bibliothek.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {songs.map((song) => (
                <SongListItem
                  key={song.id}
                  song={song}
                  queue={songs}
                  playlists={playlists || []}
                  showExplicitWarning={!!profile?.parental_controls_enabled}
                  isBlocked={
                    song.is_explicit && profile?.parental_controls_enabled && !profile.explicit_content_enabled
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="albums">
          {albums.length === 0 ? (
            <div className="text-center py-12">
              <Disc className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Noch keine Alben in der Bibliothek.</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} variant="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} variant="list" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreatePlaylistDialog
        open={showCreatePlaylist}
        onOpenChange={setShowCreatePlaylist}
        onCreated={() => mutatePlaylists()}
      />
    </div>
  )
}
