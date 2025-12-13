"use client"

import type { Playlist } from "@/lib/types"
import { Music, ListMusic } from "lucide-react"
import Link from "next/link"

interface PlaylistCardProps {
  playlist: Playlist
  variant?: "grid" | "list"
}

export function PlaylistCard({ playlist, variant = "grid" }: PlaylistCardProps) {
  if (variant === "list") {
    return (
      <Link
        href={`/playlist/${playlist.id}`}
        className="flex items-center gap-3 p-3 rounded-[510px]-lg hover:bg-accent/50 transition-colors"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[510px] bg-muted overflow-hidden">
          {playlist.cover_url ? (
            <img
              src={playlist.cover_url || "/placeholder.svg"}
              alt={playlist.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <ListMusic className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-foreground">{playlist.name}</p>
          <p className="text-xs text-muted-foreground">Playlist</p>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/playlist/${playlist.id}`} className="group">
      <div className="aspect-square rounded-[510px]-lg bg-muted overflow-hidden mb-3">
        {playlist.cover_url ? (
          <img
            src={playlist.cover_url || "/placeholder.svg"}
            alt={playlist.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Music className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <p className="text-sm font-medium truncate text-foreground">{playlist.name}</p>
      <p className="text-xs text-muted-foreground">Playlist</p>
    </Link>
  )
}
