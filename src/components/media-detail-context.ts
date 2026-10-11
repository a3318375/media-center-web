import { createContext, useContext } from "react"
import type { MediaSource, MediaType, ProviderRating } from "@/mocks/data/media-contract"

export type MediaDetailRecord = {
  mediaId?: string
  sourceId?: string
  source?: MediaSource
  sourceLabel?: string
  mediaType?: MediaType
  ratings?: ProviderRating[]
  credits?: Array<{ name: string; role: string; personId?: string }>
  seasons?: Array<{ seasonNumber: number; episodeCount?: number; name?: string }>
  title: string
  originalTitle?: string
  kind: string
  year?: number
  region?: string
  rating?: number | string
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
