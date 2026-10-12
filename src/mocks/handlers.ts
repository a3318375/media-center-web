import { http, HttpResponse, passthrough } from "msw"

import type { AuthUser } from "@/lib/auth-api"
import { discoverItems, discoverPeople, discoverSources } from "@/mocks/data/discover"
import { platformOptions, rankingCategories, rankingLists, regionOptions } from "@/mocks/data/rankings"
import { animeSubscriptions as initialAnimeSubscriptions } from "@/mocks/data/anime-subscriptions"
import { continueWatching, embyLibraries, embySites, embyStats, recentlyAdded } from "@/mocks/data/emby-dashboard"
import type { AnimeSubscriptionStatus } from "@/mocks/data/anime-subscriptions"
import { mockLogs } from "@/mocks/data/logs"

const DEMO_ACCOUNT = "admin"
let demoPassword = "123456"
let demoToken = "frame-demo-access-token"
let demoAPIKeys: Array<{ id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null; revokedAt: string | null; key: string }> = []
const demoSettings: Record<string, Record<string, unknown>> = {}
const configuredSecrets = new Set<string>()
const useBackendAuth = import.meta.env.VITE_BACKEND_AUTH === "true"
const animeSubscriptions = structuredClone(initialAnimeSubscriptions)

function publicDemoAPIKey(item: { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null; revokedAt: string | null }) {
  return { id: item.id, name: item.name, prefix: item.prefix, createdAt: item.createdAt, lastUsedAt: item.lastUsedAt, revokedAt: item.revokedAt }
}

const sourceIdFor = (id: string) => id.replace(/^[a-z]+-/, "demo-")
const asProviderRating = (source: string, value: number) => ({ source, value, voteCount: 1200 })

const demoUser: AuthUser = {
  id: "user-1",
  account: DEMO_ACCOUNT,
  name: "媒体管理员",
  email: "admin@frame.local",
  avatar: "",
}

function hasDemoToken(request: Request) {
	return request.headers.get("Authorization") === `Bearer ${demoToken}`
}

export const handlers = [
  http.get("/api/logs", ({ request }) => {
    if (useBackendAuth) return passthrough()
    const url = new URL(request.url)
    const level = url.searchParams.get("level")
    const source = url.searchParams.get("source")
    const query = url.searchParams.get("query")?.toLocaleLowerCase()
    const items = mockLogs.filter((item) => (!level || item.level === level) && (!source || item.source === source) && (!query || `${item.source} ${item.message}`.toLocaleLowerCase().includes(query))).slice(-Number(url.searchParams.get("limit") ?? 200)).reverse()
    return HttpResponse.json({ items })
  }),
  http.get("/api/media/discover", ({ request }) => {
    if (new URL(request.url).searchParams.get("source") === "tmdb") return passthrough()
    const url = new URL(request.url)
    const source = url.searchParams.get("source") ?? "tmdb"
    const query = url.searchParams.get("query")?.toLocaleLowerCase()
    const selected = discoverItems.filter((item) => item.source === source && (!query || `${item.title} ${item.originalTitle} ${item.summary}`.toLocaleLowerCase().includes(query)))
    const page = Number(url.searchParams.get("page") ?? 1)
    const pageSize = Number(url.searchParams.get("pageSize") ?? 50)
    const items = selected.slice((page - 1) * pageSize, page * pageSize).map((item) => ({
      ...item,
      mediaId: item.id,
      sourceId: sourceIdFor(item.id),
      mediaType: item.kind === "电影" ? "movie" : item.source === "tmdb" || item.source === "douban" ? "tv" : "anime",
      ratings: [asProviderRating(item.source, item.rating)],
    }))
    return HttpResponse.json({ items, page, pageSize, total: selected.length, hasMore: page * pageSize < selected.length, source, fetchedAt: new Date().toISOString(), stale: false, people: discoverPeople, sources: discoverSources })
  }),
  http.get("/api/media/:source/:sourceId", ({ params }) => {
    if (params.source === "tmdb" && !String(params.sourceId).startsWith("demo-")) return passthrough()
    const item = discoverItems.find((entry) => entry.source === params.source && sourceIdFor(entry.id) === params.sourceId)
    if (!item) return HttpResponse.json({ message: "未找到媒体条目" }, { status: 404 })
    return HttpResponse.json({ ...item, mediaId: item.id, sourceId: params.sourceId, mediaType: item.kind === "电影" ? "movie" : item.source === "tmdb" || item.source === "douban" ? "tv" : "anime", ratings: [asProviderRating(item.source, item.rating)], overview: item.summary, genres: item.genres, credits: [{ name: "林知夏", role: "主演" }, { name: "周予安", role: "导演" }], seasons: item.kind === "电影" ? [] : [{ seasonNumber: 1, episodeCount: 8, name: "第 1 季" }] })
  }),
  http.get("/api/media/rankings", () => HttpResponse.json({ categories: rankingCategories, lists: rankingLists, platforms: platformOptions, regions: regionOptions })),
  http.get("/api/subscriptions/anime", () => HttpResponse.json(animeSubscriptions)),
  http.patch("/api/subscriptions/anime/:id", async ({ params, request }) => {
    const patch = await request.json() as { status?: AnimeSubscriptionStatus }
    const index = animeSubscriptions.findIndex((item) => item.id === params.id)
    const current = animeSubscriptions[index]
    if (!current) return HttpResponse.json({ message: "订阅不存在" }, { status: 404 })
    animeSubscriptions[index] = { ...current, ...patch }
    return HttpResponse.json(animeSubscriptions[index])
  }),
  http.get("/api/emby/dashboard", () => useBackendAuth ? passthrough() : HttpResponse.json({ updatedAt: new Date().toISOString(), warnings: [], sites: embySites, stats: embyStats, libraries: embyLibraries, recentlyAdded, continueWatching })),
  http.get("/api/settings/:section", ({ params }) => useBackendAuth || params.section === "tmdb" ? passthrough() : HttpResponse.json({ values: demoSettings[params.section as string] ?? {}, configuredSecrets: [...configuredSecrets].filter((key) => key.startsWith(`${params.section}.`)) })),
  http.put("/api/settings/:section", async ({ params, request }) => {
    if (useBackendAuth || params.section === "tmdb") return passthrough()
    const section = params.section as string
    const body = await request.json() as { values?: Record<string, unknown>; clearSecrets?: string[] }
    const values = demoSettings[section] ?? (demoSettings[section] = {})
    for (const [key, value] of Object.entries(body.values ?? {})) {
      if (["emby.apiKey", "115.cookie", "notifications.botToken"].includes(key)) {
        if (typeof value === "string" && value) { configuredSecrets.add(key); values[key] = "" }
      } else values[key] = value
    }
    for (const key of body.clearSecrets ?? []) { configuredSecrets.delete(key); delete values[key] }
    return HttpResponse.json({ values, configuredSecrets: [...configuredSecrets].filter((key) => key.startsWith(`${section}.`)) })
  }),
  http.get("/api/auth/api-keys", () => useBackendAuth ? passthrough() : HttpResponse.json({ items: demoAPIKeys.map(publicDemoAPIKey) })),
  http.post("/api/auth/api-keys", async ({ request }) => {
    if (useBackendAuth) return passthrough()
    const body = await request.json() as { name?: string }
    const key = `mc_demo_${crypto.randomUUID().replaceAll("-", "")}`
    const item = { id: crypto.randomUUID(), name: body.name?.trim() ?? "", prefix: key.slice(0, 11), createdAt: new Date().toISOString(), lastUsedAt: null, revokedAt: null, key }
    demoAPIKeys = [item, ...demoAPIKeys]
    return HttpResponse.json({ item: publicDemoAPIKey(item), key }, { status: 201 })
  }),
  http.delete("/api/auth/api-keys/:id", ({ params }) => {
    if (useBackendAuth) return passthrough()
    demoAPIKeys = demoAPIKeys.map((item) => item.id === params.id ? { ...item, revokedAt: new Date().toISOString() } : item)
    return new HttpResponse(null, { status: 204 })
  }),
  http.get("/api/v1/whoami", ({ request }) => {
    if (useBackendAuth) return passthrough()
    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "")
    const key = demoAPIKeys.find((item) => item.key === token && !item.revokedAt)
    if (key) return HttpResponse.json({ user: demoUser, authenticatedBy: "apiKey" })
    if (hasDemoToken(request)) return HttpResponse.json({ user: demoUser, authenticatedBy: "session" })
    return HttpResponse.json({ message: "API Key 无效或已撤销" }, { status: 401 })
  }),
  http.get("/api/auth/setup/status", () => useBackendAuth ? passthrough() : HttpResponse.json({ setupRequired: false })),
  http.post("/api/auth/login", async ({ request }) => {
    if (useBackendAuth) return passthrough()
    const body = (await request.json().catch(() => null)) as
      | { account?: string; password?: string }
      | null

    if (body?.account !== demoUser.account || body.password !== demoPassword) {
      return HttpResponse.json(
        { message: "账号或密码不正确。" },
        { status: 401 }
      )
    }

    return HttpResponse.json({ accessToken: demoToken, user: demoUser })
  }),

  http.get("/api/auth/me", ({ request }) => {
    if (useBackendAuth) return passthrough()
    if (!hasDemoToken(request)) {
      return HttpResponse.json(
        { message: "当前未登录。" },
        { status: 401 }
      )
    }

    return HttpResponse.json(demoUser)
  }),

  http.patch("/api/auth/account", async ({ request }) => {
    if (useBackendAuth) return passthrough()
    if (!hasDemoToken(request)) return HttpResponse.json({ message: "当前未登录。" }, { status: 401 })
    const body = await request.json() as { account?: string; currentPassword?: string }
    if (body.currentPassword !== demoPassword) return HttpResponse.json({ message: "当前密码不正确。" }, { status: 401 })
    demoUser.account = body.account ?? demoUser.account
    return HttpResponse.json(demoUser)
  }),

  http.post("/api/auth/password", async ({ request }) => {
    if (useBackendAuth) return passthrough()
    if (!hasDemoToken(request)) return HttpResponse.json({ message: "当前未登录。" }, { status: 401 })
    const body = await request.json() as { currentPassword?: string; newPassword?: string }
    if (body.currentPassword !== demoPassword || !body.newPassword) return HttpResponse.json({ message: "当前密码不正确或新密码无效。" }, { status: 400 })
    demoPassword = body.newPassword
    demoToken = `${demoToken}-renewed`
    return HttpResponse.json({ accessToken: demoToken, user: demoUser })
  }),

  http.post("/api/auth/logout", ({ request }) => {
    if (useBackendAuth) return passthrough()
    if (!hasDemoToken(request)) {
      return HttpResponse.json(
        { message: "当前未登录。" },
        { status: 401 }
      )
    }

    return new HttpResponse(null, { status: 204 })
  }),
]
