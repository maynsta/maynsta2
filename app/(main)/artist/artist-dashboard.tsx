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
        <h1 className="text-3xl font-bold text-foreground mb-2">Artist Dashboard</h1>
        <p className="text-muted-foreground">
          Willkommen zurück, {profile.artist_name || profile.display_name}! Verwalte hier deine Musik.
        </p>
      </div>

      <Tabs defaultValue="singles">
        <TabsList className="mb-6 rounded-xl">
          <TabsTrigger value="singles" className="flex items-center gap-2 rounded-lg">
            <Music className="h-4 w-4" />
            Singles
          </TabsTrigger>
          <TabsTrigger value="albums" className="flex items-center gap-2 rounded-lg">
            <Disc className="h-4 w-4" />
            Alben
          </TabsTrigger>
        </TabsList>

        {/* Singles Tab */}
        <TabsContent value="singles">
          <div className="mb-4">
            <Button onClick={() => setShowCreateSingle(true)} className="rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Single hochladen
            </Button>
          </div>

          {!singles || singles.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Music className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Noch keine Singles hochgeladen.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {singles.map((single) => (
                <Card key={single.id} className="rounded-xl">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
                      {single.cover_url ? (
                        <img
                          src={single.cover_url || "/placeholder.svg"}
                          alt={single.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Music className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {single.title}
                        {single.is_explicit && (
                          <span className="ml-2 text-xs text-muted-foreground bg-muted px-1 rounded">E</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">Single • {single.play_count} Plays</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Single löschen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bist du sicher, dass du "{single.title}" löschen möchtest?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-full">Abbrechen</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSingle(single.id)} className="rounded-full">
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

        {/* Albums Tab */}
        <TabsContent value="albums">
          <div className="mb-4">
            <Button onClick={() => setShowCreateAlbum(true)} className="rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Album erstellen
            </Button>
          </div>

          {!albums || albums.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Disc className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Noch keine Alben erstellt.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {albums.map((album) => (
                <Card key={album.id} className="rounded-xl">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
                        {album.cover_url ? (
                          <img
                            src={album.cover_url || "/placeholder.svg"}
                            alt={album.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Disc className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="flex items-center justify-between">
                          <span>{album.title}</span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-full">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Album löschen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bist du sicher, dass du das Album "{album.title}" und alle darin enthaltenen Songs
                                  löschen möchtest?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-full">Abbrechen</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteAlbum(album.id)} className="rounded-full">
                                  Löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </CardTitle>
                        <CardDescription>{album.songs?.length || 0} Songs</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAlbum(album as AlbumWithSongs)}
                        className="rounded-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Song hinzufügen
                      </Button>
                    </div>

                    {album.songs && album.songs.length > 0 ? (
                      <div className="space-y-2">
                        {album.songs.map((song, index) => (
                          <div key={song.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-foreground">
                                {song.title}
                                {song.is_explicit && (
                                  <span className="ml-2 text-xs text-muted-foreground bg-muted px-1 rounded">E</span>
                                )}
                              </p>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Song löschen?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bist du sicher, dass du "{song.title}" aus dem Album löschen möchtest?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-full">Abbrechen</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteAlbumSong(song.id, album.id)}
                                    className="rounded-full"
                                  >
                                    Löschen
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Noch keine Songs in diesem Album.
                      </p>
                    )}
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
          open={!!selectedAlbum}
          onOpenChange={(open) => !open && setSelectedAlbum(null)}
          album={selectedAlbum}
          userId={userId}
          onCreated={refreshData}
        />
      )}
    </div>
  )
}
