/**
 * Frontend/backend contract for media metadata. `mediaId` is our stable key;
 * `sourceId` is always the identifier returned by the upstream provider.
 * Keep provider ratings namespaced: TMDB, Douban and community scores differ.
 */
export type MediaSource = "tmdb" | "douban" | "bangumi" | "anilist" | "emby"
export type MediaType = "movie" | "tv" | "anime" | "documentary" | "person"

export type MediaIdentity = {
  mediaId: string
  source: MediaSource
  sourceId: string
  mediaType: MediaType
}

export type ProviderRating = {
  source: MediaSource
  value: number
  voteCount?: number
}

export type MediaSummary = MediaIdentity & {
  title: string
  originalTitle?: string
  year?: number
  releaseDate?: string
  region?: string
  overview?: string
  genres: string[]
  originalLanguage?: string
  originCountries?: string[]
  posterPath?: string | null
  backdropPath?: string | null
  ratings: ProviderRating[]
  /** UI-only presentation fields; never persist these in the metadata cache. */
  palette?: string
  artwork?: string
}

export type MediaDetail = MediaSummary & {
  runtimeMinutes?: number
  status?: string
  tagline?: string
  externalIds?: Partial<Record<MediaSource, string>>
  credits?: Array<{ name: string; role: string; personId?: string }>
  seasons?: Array<{ seasonNumber: number; episodeCount?: number; name?: string }>
}

export type MediaPage<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
  source: MediaSource
  fetchedAt: string
  stale: boolean
}

export type MediaDiscoverQuery = {
  source: Exclude<MediaSource, "emby">
  mediaType?: MediaType | "all"
  genre?: string
  region?: string
  year?: number
  sort?: string
  query?: string
  page?: number
  pageSize?: number
}

export type CachePolicy = {
  detailTtlSeconds: number
  discoveryTtlSeconds: number
  staleWhileRevalidateSeconds: number
  detailCacheKey: "metadata:source:sourceId:locale"
  discoveryCacheKey: "discover:source:filters:page:locale"
  negativeCacheSeconds: number
}

// Starting values for the future server cache; keep external requests off the hot path.
export const mediaCachePolicies: Record<MediaSource, CachePolicy> = {
  tmdb: { detailTtlSeconds: 86400, discoveryTtlSeconds: 1800, staleWhileRevalidateSeconds: 604800, detailCacheKey: "metadata:source:sourceId:locale", discoveryCacheKey: "discover:source:filters:page:locale", negativeCacheSeconds: 300 },
  douban: { detailTtlSeconds: 86400, discoveryTtlSeconds: 1800, staleWhileRevalidateSeconds: 604800, detailCacheKey: "metadata:source:sourceId:locale", discoveryCacheKey: "discover:source:filters:page:locale", negativeCacheSeconds: 300 },
  bangumi: { detailTtlSeconds: 21600, discoveryTtlSeconds: 900, staleWhileRevalidateSeconds: 172800, detailCacheKey: "metadata:source:sourceId:locale", discoveryCacheKey: "discover:source:filters:page:locale", negativeCacheSeconds: 300 },
  anilist: { detailTtlSeconds: 21600, discoveryTtlSeconds: 900, staleWhileRevalidateSeconds: 172800, detailCacheKey: "metadata:source:sourceId:locale", discoveryCacheKey: "discover:source:filters:page:locale", negativeCacheSeconds: 300 },
  emby: { detailTtlSeconds: 300, discoveryTtlSeconds: 300, staleWhileRevalidateSeconds: 1800, detailCacheKey: "metadata:source:sourceId:locale", discoveryCacheKey: "discover:source:filters:page:locale", negativeCacheSeconds: 60 },
}
