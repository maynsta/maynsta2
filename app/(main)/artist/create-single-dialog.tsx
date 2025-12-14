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
import { Music, Upload, ImagePlus } from "lucide-react"

interface CreateSingleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onCreated?: () => void
}

export function CreateSingleDialog({ open, onOpenChange, userId, onCreated }: CreateSingleDialogProps) {
  const [title, setTitle] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isExplicit, setIsExplicit] = useState(false)
  const [hasVideo, setHasVideo] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    let coverUrl: string | null = null
    let audioUrl: string | null = null
    let videoUrl: string | null = null

    if (coverFile) {
      const fileExt = coverFile.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}-cover.${fileExt}`
      const { data: uploadData } = await supabase.storage.from("covers").upload(fileName, coverFile)
      if (uploadData) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("covers").getPublicUrl(fileName)
        coverUrl = publicUrl
      }
    }

    if (audioFile) {
      const fileExt = audioFile.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}-audio.${fileExt}`
      const { data: uploadData } = await supabase.storage.from("audio").upload(fileName, audioFile)
      if (uploadData) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("audio").getPublicUrl(fileName)
        audioUrl = publicUrl
      }
    }

    if (hasVideo && videoFile) {
      const fileExt = videoFile.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}-video.${fileExt}`
      const { data: uploadData } = await supabase.storage.from("videos").upload(fileName, videoFile)
      if (uploadData) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("videos").getPublicUrl(fileName)
        videoUrl = publicUrl
      }
    }

    // First create album entry as single
    const { data: album } = await supabase
      .from("albums")
      .insert({
        artist_id: userId,
        title: title.trim(),
        cover_url: coverUrl,
        is_single: true,
      })
      .select()
      .single()

    if (album) {
      // Create song entry
      await supabase.from("songs").insert({
        album_id: album.id,
        artist_id: userId,
        title: title.trim(),
        cover_url: coverUrl,
        audio_url: audioUrl,
        is_explicit: isExplicit,
        has_music_video: hasVideo,
        music_video_url: videoUrl,
        duration: 180, // Default 3 min
      })
    }

    setTitle("")
    setCoverFile(null)
    setCoverPreview(null)
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
        <DialogTitle>Single hochladen</DialogTitle>
        <DialogDescription>Lade eine neue Single hoch.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleCreate}>
        <div className="grid gap-4 py-4">
          {/* Titel */}
          <div className="grid gap-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              placeholder="Song Titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-[10px]"
            />
          </div>

          {/* Cover Upload */}
          <div className="grid gap-2">
            <Label>Cover Bild</Label>
            <div className="flex gap-3 items-center">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[10px] bg-muted cursor-pointer overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors"
                onClick={() => coverInputRef.current?.click()}
              >
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="h-full w-full object-cover rounded-[10px]"
                  />
                ) : (
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-[10px] bg-transparent"
                  onClick={() => coverInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Cover hochladen
                </Button>
                {coverFile && <p className="text-xs text-muted-foreground mt-1">{coverFile.name}</p>}
              </div>
            </div>
          </div>

          {/* Audio Upload */}
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

          {/* Expliziter Inhalt */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Expliziter Inhalt</Label>
              <p className="text-xs text-muted-foreground">Song enthält unangemessene Inhalte</p>
            </div>
            <Switch checked={isExplicit} onCheckedChange={setIsExplicit} />
          </div>

          {/* Musikvideo */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Musikvideo</Label>
              <p className="text-xs text-muted-foreground">Hat dieser Song ein Musikvideo?</p>
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

        <DialogFooter className="flex gap-2">
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
            {isLoading ? "Hochladen..." : "Hochladen"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
)
}
