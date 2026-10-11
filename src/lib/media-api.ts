import type { MediaDetail, MediaDiscoverQuery, MediaIdentity, MediaPage, ProviderRating } from "@/mocks/data/media-contract"
import type { DiscoverItem, DiscoverSource } from "@/mocks/data/discover"
import type { RankingCategory, RankingEntry } from "@/mocks/data/rankings"
import type { AnimeSubscription } from "@/mocks/data/anime-subscriptions"
import type { EmbyMediaItem, EmbyResumeItem, EmbySiteId } from "@/mocks/data/emby-dashboard"
import { getAccessToken } from "@/lib/auth-api"

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  const token = getAccessToken()
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`)
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  const response = await fetch(url, { ...init, headers })
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(error?.message ?? `请求失败 (${response.status})`)
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

export type DiscoverApiItem = DiscoverItem & MediaIdentity & { ratings: ProviderRating[] }
export type DiscoverResponse = MediaPage<DiscoverApiItem> & { people: Array<{ id: string; name: string; originalName: string; role: string; knownFor: string; popularity: number; palette: string; initials: string }> }
export type RankingsResponse = { categories: Array<{ id: RankingCategory; source: string; title: string; description: string }>; lists: Record<RankingCategory, RankingEntry[]> }
export type EmbyDashboardResponse = { updatedAt: string; warnings: string[]; sites: readonly { id: "all" | EmbySiteId; label: string }[]; stats: Record<"all" | EmbySiteId, { movies: number; series: number; episodes: number; plays: number; viewers: number; hours: number }>; libraries: readonly { id: string; title: string; type: string; count: number; siteId: EmbySiteId }[]; recentlyAdded: EmbyMediaItem[]; continueWatching: EmbyResumeItem[] }

export const mediaApi = {
  discover(query: MediaDiscoverQuery) {
    const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)] as [string, string]))
    return request<DiscoverResponse>(`/api/media/discover?${params}`)
  },
  detail(source: DiscoverSource, sourceId: string) {
    return request<MediaDetail>(`/api/media/${source}/${encodeURIComponent(sourceId)}`)
  },
  rankings() { return request<RankingsResponse>("/api/media/rankings") },
  animeSubscriptions() { return request<AnimeSubscription[]>("/api/subscriptions/anime") },
  updateAnimeSubscription(id: string, patch: Pick<AnimeSubscription, "status">) {
    return request<AnimeSubscription>(`/api/subscriptions/anime/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) })
  },
  embyDashboard(refresh = false) { return request<EmbyDashboardResponse>(`/api/emby/dashboard${refresh ? "?refresh=true" : ""}`) },
  async embyImage(id: string) {
    const token = getAccessToken()
    const response = await fetch(`/api/emby/items/${encodeURIComponent(id)}/image`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (!response.ok) throw new Error(`图片请求失败 (${response.status})`)
    return response.blob()
  },
}
