export type ResourceSearchHistoryEntry = {
  kind?: "resource"
  keyword: string
  source: string
  mode: string
  cloudTypes: string[]
  plugins: string[]
  channels: string[]
  at: number
}

export type MediaSearchHistoryEntry = {
  kind: "media"
  keyword: string
  source: string
  at: number
}

type SearchHistoryEntry = ResourceSearchHistoryEntry | MediaSearchHistoryEntry

export const RESOURCE_SEARCH_HISTORY_KEY = "media-center-search-history"

export function chooseSearchSource(
  channels: string[],
  plugins: string[],
  firstRound = false
): "all" | "tg" | "plugin" {
  if (firstRound)
    return channels.length ? "tg" : plugins.length ? "plugin" : "all"
  return channels.length && plugins.length
    ? "all"
    : channels.length
      ? "tg"
      : plugins.length
        ? "plugin"
        : "all"
}

export function readResourceSearchHistory(
  storage: Pick<Storage, "getItem">
): ResourceSearchHistoryEntry[] {
  return readAllSearchHistory(storage).filter(
    (item): item is ResourceSearchHistoryEntry => item.kind !== "media"
  )
}

export function readMediaSearchHistory(
  storage: Pick<Storage, "getItem">
): MediaSearchHistoryEntry[] {
  return readAllSearchHistory(storage).filter(
    (item): item is MediaSearchHistoryEntry => item.kind === "media"
  )
}

function readAllSearchHistory(
  storage: Pick<Storage, "getItem">
): SearchHistoryEntry[] {
  try {
    const parsed: unknown = JSON.parse(
      storage.getItem(RESOURCE_SEARCH_HISTORY_KEY) ?? "[]"
    )
    return Array.isArray(parsed) ? (parsed as SearchHistoryEntry[]) : []
  } catch {
    return []
  }
}

export function saveResourceSearchHistory(
  storage: Pick<Storage, "getItem" | "setItem">,
  entry: ResourceSearchHistoryEntry
): ResourceSearchHistoryEntry[] {
  const normalized = { ...entry, kind: "resource" as const }
  const next = [
    normalized,
    ...readAllSearchHistory(storage).filter(
      (item) => !(item.keyword === entry.keyword && item.kind !== "media")
    ),
  ].slice(0, 20)
  storage.setItem(RESOURCE_SEARCH_HISTORY_KEY, JSON.stringify(next))
  return next.filter(
    (item): item is ResourceSearchHistoryEntry => item.kind !== "media"
  )
}

export function saveMediaSearchHistory(
  storage: Pick<Storage, "getItem" | "setItem">,
  entry: MediaSearchHistoryEntry
): MediaSearchHistoryEntry[] {
  const next = [
    entry,
    ...readAllSearchHistory(storage).filter(
      (item) => !(item.keyword === entry.keyword && item.kind === "media")
    ),
  ].slice(0, 20)
  storage.setItem(RESOURCE_SEARCH_HISTORY_KEY, JSON.stringify(next))
  return next.filter(
    (item): item is MediaSearchHistoryEntry => item.kind === "media"
  )
}
