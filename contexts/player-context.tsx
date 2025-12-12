"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"
import type { Song } from "@/lib/types"

interface PlayerContextType {
  currentSong: Song | null
  isPlaying: boolean
  progress: number
  duration: number
  queue: Song[]
  queueIndex: number
  playSong: (song: Song, queue?: Song[]) => void
  togglePlay: () => void
  nextSong: () => void
  previousSong: () => void
  seekTo: (progress: number) => void
  setQueue: (songs: Song[], startIndex?: number) => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [queue, setQueueState] = useState<Song[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.addEventListener("ended", () => {
      nextSong()
    })
    audioRef.current.addEventListener("loadedmetadata", () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration)
      }
    })

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime)
        }
      }, 100)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying])

  const playSong = useCallback((song: Song, songQueue?: Song[]) => {
    setCurrentSong(song)
    setProgress(0)

    if (songQueue) {
      setQueueState(songQueue)
      const index = songQueue.findIndex((s) => s.id === song.id)
      setQueueIndex(index >= 0 ? index : 0)
    }

    if (audioRef.current) {
      if (song.audio_url) {
        audioRef.current.src = song.audio_url
        audioRef.current.play()
        setIsPlaying(true)
      } else {
        // Demo mode: simulate playback
        setDuration(song.duration || 180)
        setIsPlaying(true)
      }
    }
  }, [])

  const togglePlay = useCallback(() => {
    if (audioRef.current && currentSong?.audio_url) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying, currentSong])

  const nextSong = useCallback(() => {
    if (queue.length > 0 && queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1
      setQueueIndex(nextIndex)
      playSong(queue[nextIndex], queue)
    }
  }, [queue, queueIndex, playSong])

  const previousSong = useCallback(() => {
    if (queue.length > 0 && queueIndex > 0) {
      const prevIndex = queueIndex - 1
      setQueueIndex(prevIndex)
      playSong(queue[prevIndex], queue)
    }
  }, [queue, queueIndex, playSong])

  const seekTo = useCallback(
    (newProgress: number) => {
      setProgress(newProgress)
      if (audioRef.current && currentSong?.audio_url) {
        audioRef.current.currentTime = newProgress
      }
    },
    [currentSong],
  )

  const setQueue = useCallback(
    (songs: Song[], startIndex = 0) => {
      setQueueState(songs)
      setQueueIndex(startIndex)
      if (songs.length > 0) {
        playSong(songs[startIndex], songs)
      }
    },
    [playSong],
  )

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        progress,
        duration,
        queue,
        queueIndex,
        playSong,
        togglePlay,
        nextSong,
        previousSong,
        seekTo,
        setQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider")
  }
  return context
}
