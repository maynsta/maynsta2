"use client"

import { useState } from "react"
import type { Profile, Album, Song } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Disc, Music, Trash2 } from "lucide-react"
import { CreateSingleDialog } from "./create-single-dialog"
import { CreateAlbumDialog } from "./create-album-dialog"
import { AddSongToAlbumDialog } from "./add-song-to-album-dialog"
import { createClient } from "@/lib/supabase/client"
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

interface AlbumWithSongs extends Album {
  songs: Song[]
}

interface ArtistDashboardProps {
  profile: Profile
  albums: AlbumWithSongs[]
  singles: Song[]
  userId: string
}

export function ArtistDashboard({
  profile,
  albums: initialAlbums,
  singles: initialSingles,
  userId,
}: ArtistDashboardProps) {
  const [showCreateSingle, setShowCreateSingle] = useState(false)
  const [showCreateAlbum, setShowCreateAlbum] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithSongs | null>(null)

  const { data: albums } = useSWR(
    `artist-albums-${userId}`,
    async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("albums")
        .select("*, songs(*)")
        .eq("artist_id", userId)
        .order("created_at", { ascending: false })
      return data || []
    },
    { fallbackData: initialAlbums },
  )

  const { data: singles } = useSWR(
    `artist-singles-${userId}`,
    async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("songs")
        .select("*")
        .eq("artist_id", userId)
        .is("album_id", null)
        .order("created_at", { ascending: false })
      return data || []
    },
    { fallbackData: initialSingles },
  )

  const handleDeleteSingle = async (songId: string) => {
    const supabase = createClient()
    await supabase.from("songs").delete().eq("id", songId)
    mutate(`artist-singles-${userId}`)
  }

  const handleDeleteAlbum = async (albumId: string) => {
    const supabase = createClient()
    await supabase.from("albums").delete().eq("id", albumId)
    mutate(`artist-albums-${userId}`)
  }

  const handleDeleteAlbumSong = async (songId: string, albumId: string) => {
    const supabase = createClient()
    await supabase.from("songs").delete().eq("id", songId)
    mutate(`artist-albums-${userId}`)
    mutate(`album-songs-${albumId}`)
  }

  const refreshData = () => {
    mutate(`artist-albums-${userId}`)
    mutate(`artist-singles-${userId}`)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Artist Dashboard</h1>
        <p className="text-muted-foreground">
          Willkommen zurück, {profile.artist_name || profile.display_name}!
        </p>
      </div>

      <Tabs defaultValue="singles">
        <TabsList className="mb-6 rounded-[10px]">
          <TabsTrigger value="singles" className="flex items-center gap-2 rounded-[10px]">
            <Music className="h-4 w-4" />
            Singles
          </TabsTrigger>
          <TabsTrigger value="albums" className="flex items-center gap-2 rounded-[10px]">
            <Disc className="h-4 w-4" />
            Alben
          </TabsTrigger>
        </TabsList>

        {/* Singles */}
        <TabsContent value="singles">
          <Button onClick={() => setShowCreateSingle(true)} className="mb-4 rounded-[10px]">
            <Plus className="h-4 w-4 mr-2" />
            Single hochladen
          </Button>

          {!singles?.length ? (
            <Card className="rounded-[10px]">
              <CardContent className="py-12 text-center">
                <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Noch keine Singles hochgeladen.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {singles.map((single) => (
                <Card key={single.id} className="rounded-[10px]">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-16 w-16 rounded-[10px] bg-muted overflow-hidden flex items-center justify-center">
                      {single.cover_url ? (
                        <img src={single.cover_url} className="h-full w-full object-cover" />
                      ) : (
                        <Music className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-medium truncate">{single.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Single • {single.play_count} Plays
                      </p>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-[10px]">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[10px]">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Single löschen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Möchtest du „{single.title}“ wirklich löschen?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-[10px]" />
                          <AlertDialogAction
                            onClick={() => handleDeleteSingle(single.id)}
                            className="rounded-[10px]"
                          >
                            Löschen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Albums */}
        <TabsContent value="albums">
          <Button onClick={() => setShowCreateAlbum(true)} className="mb-4 rounded-[10px]">
            <Plus className="h-4 w-4 mr-2" />
            Album erstellen
          </Button>

          {!albums?.length ? (
            <Card className="rounded-[10px]">
              <CardContent className="py-12 text-center">
                <Disc className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Noch keine Alben erstellt.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {albums.map((album) => (
                <Card key={album.id} className="rounded-[10px]">
                  <CardHeader>
                    <CardTitle>{album.title}</CardTitle>
                    <CardDescription>{album.songs?.length || 0} Songs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-[10px]"
                      onClick={() => setSelectedAlbum(album)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Song hinzufügen
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateSingleDialog
        open={showCreateSingle}
        onOpenChange={setShowCreateSingle}
        userId={userId}
        onCreated={refreshData}
      />

      <CreateAlbumDialog
        open={showCreateAlbum}
        onOpenChange={setShowCreateAlbum}
        userId={userId}
        onCreated={refreshData}
      />

      {selectedAlbum && (
        <AddSongToAlbumDialog
          open
          album={selectedAlbum}
          userId={userId}
          onOpenChange={() => setSelectedAlbum(null)}
          onCreated={refreshData}
        />
      )}
    </div>
  )
}

