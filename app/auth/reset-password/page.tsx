"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Supabase Session aus URL herstellen (wichtig!)
    supabase.auth.getSession()
  }, [supabase])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen lang sein.")
      return
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.")
      return
    }

    setIsLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    setSuccess("Passwort erfolgreich geändert. Du wirst weitergeleitet…")

    setTimeout(() => {
      router.push("/auth/login")
    }, 2000)
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Neues Passwort setzen</CardTitle>
            <CardDescription>
              Gib ein neues Passwort für dein Konto ein
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label>Neues Passwort</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-full"
                />
              </div>

              <div className="grid gap-2">
                <Label>Passwort bestätigen</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="rounded-full"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}

              <Button
                type="submit"
                disabled={isLoading}
                className="rounded-full"
              >
                {isLoading ? "Speichern…" : "Passwort ändern"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

