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
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
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
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(fileName)
        avatarUrl = publicUrl
      }
    }

    await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    setAvatarFile(null)
    mutateProfile()
    setIsSavingProfile(false)
  }

  const handleSaveParental = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingParental(true)
    const supabase = createClient()

    await supabase
      .from("profiles")
      .update({
        parental_controls_enabled: parentalEnabled,
        parental_pin: parentalPin || null,
        music_videos_enabled: musicVideosEnabled,
        explicit_content_enabled: explicitEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    mutateProfile()
    setIsSavingParental(false)
  }

  const handleSaveArtist = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingArtist(true)
    const supabase = createClient()

    await supabase
      .from("profiles")
      .update({
        is_artist: isArtist,
        artist_name: artistName || null,
        artist_bio: artistBio || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

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

        {/* Konto Tab */}
        <TabsContent value="profile">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Profil</CardTitle>
              <CardDescription>Verwalte dein Profil und Einstellungen</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview || "/placeholder.svg"}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Label>Profilbild</Label>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <div className="flex gap-2 mt-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full bg-transparent"
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Bild hochladen
                      </Button>
                    </div>
                    {avatarFile && <p className="text-xs text-muted-foreground mt-1">{avatarFile.name}</p>}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="displayName">Anzeigename</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Dein Name"
                    className="rounded-full"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>E-Mail</Label>
                  <Input value={userEmail} disabled className="bg-muted rounded-full" />
                </div>

                <div className="grid gap-3">
                  <Label>Erscheinungsbild</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="flex-1 rounded-full"
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Hell
                    </Button>
                    <Button
                      type="button"
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="flex-1 rounded-full"
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Dunkel
                    </Button>
                    <Button
                      type="button"
                      variant={theme === "system" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("system")}
                      className="flex-1 rounded-full"
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      System
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={isSavingProfile} className="rounded-full">
                    <Save className="h-4 w-4 mr-2" />
                    {isSavingProfile ? "Speichern..." : "Speichern"}
                  </Button>
                  <Button type="button" variant="destructive" onClick={handleLogout} className="rounded-full">
                    <LogOut className="h-4 w-4 mr-2" />
                    Abmelden
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parental Controls Tab */}
        <TabsContent value="parental">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Parental Controls</CardTitle>
              <CardDescription>Verwalte Inhaltseinschränkungen</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveParental} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Parental Controls aktivieren</Label>
                    <p className="text-sm text-muted-foreground">Aktiviere Inhaltseinschränkungen mit PIN-Schutz</p>
                  </div>
                  <Switch checked={parentalEnabled} onCheckedChange={setParentalEnabled} />
                </div>

                {parentalEnabled && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="pin">PIN (4-6 Ziffern)</Label>
                      <Input
                        id="pin"
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        minLength={4}
                        value={parentalPin}
                        onChange={(e) => setParentalPin(e.target.value)}
                        placeholder="••••"
                        className="max-w-xs rounded-full"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Musikvideos</Label>
                          <p className="text-sm text-muted-foreground">
                            Erlaube das Abspielen von Musikvideos (PIN erforderlich wenn deaktiviert)
                          </p>
                        </div>
                        <Switch checked={musicVideosEnabled} onCheckedChange={setMusicVideosEnabled} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Unangemessene Inhalte</Label>
                          <p className="text-sm text-muted-foreground">
                            Erlaube explizite Songs (PIN erforderlich wenn deaktiviert)
                          </p>
                        </div>
                        <Switch checked={explicitEnabled} onCheckedChange={setExplicitEnabled} />
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" disabled={isSavingParental} className="rounded-full">
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingParental ? "Speichern..." : "Speichern"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Artist Tab */}
        <TabsContent value="artist">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Artist Konto</CardTitle>
              <CardDescription>Werde ein Artist und veröffentliche deine Musik</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveArtist} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Artist Konto aktivieren</Label>
                    <p className="text-sm text-muted-foreground">Aktiviere dein Artist-Profil um Musik hochzuladen</p>
                  </div>
                  <Switch checked={isArtist} onCheckedChange={setIsArtist} />
                </div>

                {isArtist && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="artistName">Künstlername</Label>
                      <Input
                        id="artistName"
                        value={artistName}
                        onChange={(e) => setArtistName(e.target.value)}
                        placeholder="Dein Künstlername"
                        className="rounded-full"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="artistBio">Über dich</Label>
                      <textarea
                        id="artistBio"
                        value={artistBio}
                        onChange={(e) => setArtistBio(e.target.value)}
                        placeholder="Erzähl etwas über dich und deine Musik..."
                        rows={4}
                        className="flex min-h-[80px] w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  <Button type="submit" disabled={isSavingArtist} className="rounded-full">
                    <Save className="h-4 w-4 mr-2" />
                    {isSavingArtist ? "Speichern..." : "Speichern"}
                  </Button>
                  {isArtist && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/artist")}
                      className="rounded-full"
                    >
                      <Mic2 className="h-4 w-4 mr-2" />
                      Zum Artist Dashboard
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

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
                    Impressum
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
                    <p className="text-muted-foreground text-center py-8">Impressum</p>
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
