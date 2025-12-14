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
import { createClient } from "@/lib/supabase/client"
import { ImagePlus, Upload } from "lucide-react"

interface CreatePlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export function CreatePlaylistDialog({ open, onOpenChange, onCreated }: CreatePlaylistDialogProps) {
  const [name, setName] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (!name.trim()) return

    setIsLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    let coverUrl: string | null = null

    if (coverFile) {
      const fileExt = coverFile.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const { data: uploadData } = await supabase.storage.from("covers").upload(fileName, coverFile)

      if (uploadData) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("covers").getPublicUrl(fileName)
        coverUrl = publicUrl
      }
    }

    await supabase.from("playlists").insert({
      user_id: user.id,
      name: name.trim(),
      cover_url: coverUrl,
    })

    setName("")
    setCoverFile(null)
    setCoverPreview(null)
    setIsLoading(false)
    onOpenChange(false)
    onCreated?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>Neue Playlist erstellen</DialogTitle>
          <DialogDescription>Gib einen Namen und optional ein Cover für deine Playlist ein.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Meine Playlist"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-full"
              />
            </div>
            <div className="grid gap-2">
              <Label>Cover Bild</Label>
              <div className="flex gap-3 items-center">
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-muted cursor-pointer overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {coverPreview ? (
                    <img
                      src={coverPreview || "/placeholder.svg"}
                      alt="Cover preview"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full bg-transparent"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Bild hochladen
                  </Button>
                  {coverFile && <p className="text-xs text-muted-foreground mt-1">{coverFile.name}</p>}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()} className="rounded-full">
              {isLoading ? "Erstellen..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
