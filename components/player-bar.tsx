"use client"

import { usePlayer } from "@/contexts/player-context"
import { Play, Pause, SkipBack, SkipForward, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function PlayerBar() {
  const { currentSong, isPlaying, progress, duration, togglePlay, nextSong, previousSong, seekTo, queue, queueIndex } =
    usePlayer()

  if (!currentSong) {
    return (
      <div className="fixed bottom-0 left-64 right-0 z-50 h-20 border-t border-border bg-card">
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <p className="text-sm">Wähle einen Song aus, um Musik zu hören</p>
        </div>
      </div>
    )
  }

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0
  const canGoPrevious = queueIndex > 0
  const canGoNext = queueIndex < queue.length - 1

  return (
    <div className="fixed bottom-0 left-64 right-0 z-50 border-t border-border bg-card">
      {/* Progress bar at top */}
      <div className="h-1 w-full bg-muted">
        <div className="h-full bg-primary transition-all duration-100" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="flex h-[76px] items-center px-4">
        {/* Song info */}
        <div className="flex w-1/4 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted overflow-hidden">
            {currentSong.cover_url ? (
              <img
                src={currentSong.cover_url || "/placeholder.svg"}
                alt={currentSong.title}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <Music className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-card-foreground">{currentSong.title}</p>
            <p className="truncate text-xs text-muted-foreground">{currentSong.artist?.display_name || "Unbekannt"}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-card-foreground rounded-full"
              onClick={previousSong}
              disabled={!canGoPrevious}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="default" size="icon" className="h-10 w-10 rounded-full" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-card-foreground rounded-full"
              onClick={nextSong}
              disabled={!canGoNext}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Time slider */}
          <div className="flex w-full max-w-md items-center gap-2">
            <span className="text-xs text-muted-foreground w-10 text-right">{formatTime(progress)}</span>
            <Slider
              value={[progress]}
              max={duration || 100}
              step={1}
              onValueChange={([value]) => seekTo(value)}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Spacer for balance */}
        <div className="w-1/4" />
      </div>
    </div>
  )
}
