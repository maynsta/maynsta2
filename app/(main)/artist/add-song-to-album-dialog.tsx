"use client"

import type React from "react"
import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import type { Album } from "@/lib/types"
import { Music, Upload } from "lucide-react"

interface AddSongToAlbumDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  album: Album
  userId: string
  onCreated?: () => void
}

export function AddSongToAlbumDialog({
  open,
  onOpenChange,
  album,
  userId,
  onCreated,
}: AddSongToAlbumDialogProps) {
  const [title, setTitle] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isExplicit, setIsExplicit] = useState(false)
  const [hasVideo, setHasVideo] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const audioInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    let audioUrl: string | null = null
    let videoUrl: string | null = null

    if (audioFile) {
      const fileExt = audioFile.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}-audio.${fileExt}`
      const { data } = await supabase.storage.from("audio").upload(fileName, audioFile)
      if (data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("audio").getPublicUrl(fileName)
        audioUrl = publicUrl
      }
    }

    if (hasVideo && videoFile) {
      const fileExt = videoFile.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}-video.${fileExt}`
      const { data } = await supabase.storage.from("videos").upload(fileName, videoFile)
      if (data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("videos").getPublicUrl(fileName)
        videoUrl = publicUrl
      }
    }

    await supabase.from("songs").insert({
      album_id: album.id,
      artist_id: userId,
      title: title.trim(),
      cover_url: album.cover_url,
      audio_url: audioUrl,
      is_explicit: isExplicit,
      has_music_video: hasVideo,
      music_video_url: videoUrl,
      duration: 180,
    })

    setTitle("")
    setAudioFile(null)
    setIsExplicit(false)
    setHasVideo(false)
    setVideoFile(null)
    setIsLoading(false)
    onOpenChange(false)
    onCreated?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[10px]">
        <DialogHeader>
          <DialogTitle>
            Song zu &quot;{album.title}&quot; hinzufügen
          </DialogTitle>
          <DialogDescription>
            Füge einen neuen Song zu diesem Album hinzu.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Song Titel</Label>
              <Input
                id="title"
                placeholder="Song Name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-[10px]"
              />
            </div>

            <div className="grid gap-2">
              <Label>Audio Datei (MP3, WAV, MPA)</Label>
              <input
                ref={audioInputRef}
                type="file"
                accept=".mp3,.wav,.mpa"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-[10px] justify-start bg-transparent"
                onClick={() => audioInputRef.current?.click()}
              >
                <Music className="h-4 w-4 mr-2" />
                {audioFile ? audioFile.name : "Audio hochladen"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Expliziter Inhalt</Label>
                <p className="text-xs text-muted-foreground">
                  Song enthält unangemessene Inhalte
                </p>
              </div>
              <Switch checked={isExplicit} onCheckedChange={setIsExplicit} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Musikvideo</Label>
                <p className="text-xs text-muted-foreground">
                  Hat dieser Song ein Musikvideo?
                </p>
              </div>
              <Switch checked={hasVideo} onCheckedChange={setHasVideo} />
            </div>

            {hasVideo && (
              <div className="grid gap-2">
                <Label>Video Datei (MP4, MOV)</Label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept=".mp4,.mov"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-[10px] justify-start bg-transparent"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {videoFile ? videoFile.name : "Video hochladen"}
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-[10px]"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="rounded-[10px]"
            >
              {isLoading ? "Hinzufügen..." : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

