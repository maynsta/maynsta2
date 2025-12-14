"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"

interface PinDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  correctPin: string
  onSuccess: () => void
}

export function PinDialog({ open, onOpenChange, correctPin, onSuccess }: PinDialogProps) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === correctPin) {
      setPin("")
      setError("")
      onSuccess()
    } else {
      setError("Falscher PIN")
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPin("")
      setError("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">PIN eingeben</DialogTitle>
          <DialogDescription className="text-center">
            Dieser Inhalt ist durch Parental Controls geschützt.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value)
                setError("")
              }}
              placeholder="••••"
              className="text-center text-2xl tracking-widest"
            />
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </div>
          <Button type="submit" className="w-full">
            Bestätigen
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
