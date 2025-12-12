"use client"

import type { Album } from "@/lib/types"
import { Music } from "lucide-react"
import Link from "next/link"

interface AlbumCardProps {
  album: Album
  variant?: "grid" | "list"
}

export function AlbumCard({ album, variant = "grid" }: AlbumCardProps) {
  if (variant === "list") {
    return (
      <Link
        href={`/album/${album.id}`}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-muted overflow-hidden">
          {album.cover_url ? (
            <img src={album.cover_url || "/placeholder.svg"} alt={album.title} className="h-full w-full object-cover" />
          ) : (
            <Music className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-foreground">{album.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {album.is_single ? "Single" : "Album"} • {album.artist?.display_name || album.artist?.artist_name}
          </p>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/album/${album.id}`} className="group">
      <div className="aspect-square rounded-lg bg-muted overflow-hidden mb-3">
        {album.cover_url ? (
          <img
            src={album.cover_url || "/placeholder.svg"}
            alt={album.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Music className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <p className="text-sm font-medium truncate text-foreground">{album.title}</p>
      <p className="text-xs text-muted-foreground truncate">
        {album.is_single ? "Single" : "Album"} • {album.artist?.display_name || album.artist?.artist_name}
      </p>
    </Link>
  )
}
