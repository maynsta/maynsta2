"use client"

import type React from "react"
import { useState, useRef } from "react"
import type { Profile } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "@/contexts/theme-context"
import { User, Shield, Mic2, Info, Sun, Moon, Monitor, LogOut, Save, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import useSWR from "swr"

interface AccountContentProps {
  profile: Profile | null
  userId: string
  userEmail: string
}

export function AccountContent({ profile: initialProfile, userId, userEmail }: AccountContentProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const { data: profile, mutate: mutateProfile } = useSWR(
    `profile-${userId}`,
    async () => {
      const supabase = createClient()
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single()
      return data
    },
    { fallbackData: initialProfile },
  )

  // Konto state
  const [displayName, setDisplayName] = useState(profile?.display_name || "")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Parental Controls state
  const [parentalEnabled, setParentalEnabled] = useState(profile?.parental_controls_enabled || false)
  const [parentalPin, setParentalPin] = useState(profile?.parental_pin || "")
  const [musicVideosEnabled, setMusicVideosEnabled] = useState(profile?.music_videos_enabled ?? true)
  const [explicitEnabled, setExplicitEnabled] = useState(profile?.explicit_content_enabled ?? true)
  const [isSavingParental, setIsSavingParental] = useState(false)

  // Artist state
  const [isArtist, setIsArtist] = useState(profile?.is_artist || false)
  const [artistName, setArtistName] = useState(profile?.artist_name || "")
  const [artistBio, setArtistBio] = useState(profile?.artist_bio || "")
  const [isSavingArtist, setIsSavingArtist] = useState(false)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    const supabase = createClient()
    let avatarUrl = profile?.avatar_url || null

    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}-avatar.${fileExt}`
      const { data: uploadData } = await supabase.storage.from("avatars").upload(fileName, avatarFile)
      if (uploadData) {
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName)
        avatarUrl = publicUrl
      }
    }

    await supabase.from("profiles").update({
      display_name: displayName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }).eq("id", userId)

    setAvatarFile(null)
    mutateProfile()
    setIsSavingProfile(false)
  }

  const handleSaveParental = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingParental(true)
    const supabase = createClient()

    await supabase.from("profiles").update({
      parental_controls_enabled: parentalEnabled,
      parental_pin: parentalPin || null,
      music_videos_enabled: musicVideosEnabled,
      explicit_content_enabled: explicitEnabled,
      updated_at: new Date().toISOString(),
    }).eq("id", userId)

    mutateProfile()
    setIsSavingParental(false)
  }

  const handleSaveArtist = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingArtist(true)
    const supabase = createClient()

    await supabase.from("profiles").update({
      is_artist: isArtist,
      artist_name: artistName || null,
      artist_bio: artistBio || null,
      updated_at: new Date().toISOString(),
    }).eq("id", userId)

    mutateProfile()
    setIsSavingArtist(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-foreground mb-6">Konto</h1>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6 grid w-full grid-cols-4 rounded-full">
          <TabsTrigger value="profile" className="flex items-center gap-2 rounded-full">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Konto</span>
          </TabsTrigger>
          <TabsTrigger value="parental" className="flex items-center gap-2 rounded-full">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Parental</span>
          </TabsTrigger>
          <TabsTrigger value="artist" className="flex items-center gap-2 rounded-full">
            <Mic2 className="h-4 w-4" />
            <span className="hidden sm:inline">Artist</span>
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-2 rounded-full">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Info</span>
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Info</CardTitle>
              <CardDescription>App-Informationen</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="version">
                <TabsList className="mb-4 rounded-full">
                  <TabsTrigger value="version" className="rounded-full">
                    Version
                  </TabsTrigger>
                  <TabsTrigger value="impressum" className="rounded-full">
                    Maynsta wurde erstellt von Maynsta Inc.<br />
                    Maynsta Inc ist ein Unternehmen der Mayn Cooperation.
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="version">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-full bg-muted">
                      <span className="font-medium">App Version</span>
                      <span className="text-muted-foreground">v1.5</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="impressum">
                  <div className="p-4 rounded-2xl bg-muted">
                    <p className="text-muted-foreground text-center py-8">
                      Maynsta wurde erstellt von Maynsta Inc.<br />
                      Maynsta Inc ist ein Unternehmen der Mayn Cooperation.<br />
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

