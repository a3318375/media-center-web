import { createContext, useContext } from "react"

export type MediaDetailRecord = {
  title: string
  originalTitle?: string
  kind: string
  year?: number
  region?: string
  rating?: number | string
  source?: string
  genres?: string[]
  summary?: string
  palette?: string
  artwork?: string
  status?: string
  episodeInfo?: string
  actionLabel?: string
  onAction?: () => void
}

export const MediaDetailContext = createContext<(media: MediaDetailRecord) => void>(() => undefined)

export function useMediaDetail() {
  return useContext(MediaDetailContext)
}
