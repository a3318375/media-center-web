import { useCallback, useEffect, useRef, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getAccessToken } from "@/lib/auth-api"
import {
  chooseSearchSource,
  readMediaSearchHistory,
  readResourceSearchHistory,
  RESOURCE_SEARCH_HISTORY_KEY,
  saveResourceSearchHistory,
  type MediaSearchHistoryEntry,
  type ResourceSearchHistoryEntry,
} from "@/lib/resource-search"

type SearchConfig = ResourceSearchHistoryEntry
type Meta = {
  plugins: { name: string }[]
  channels: string[]
  cloudTypes: string[]
  defaults: { plugins: string[]; channels: string[]; cloudTypes: string[] }
}
type Link = {
  cloud: string
  url: string
  password?: string
  note?: string
  source?: string
  updatedAt?: string
}
type Result = {
  total: number
  items: { title: string; links?: Link[] }[]
  linksByCloud: Record<string, Link[]>
}
type SavedSearchResult = {
  config: SearchConfig
  result: Result
  tab: string
}
const LAST_RESULT_KEY = "media-center-last-search-result"

function readSavedSearchResult(storage: Storage): SavedSearchResult | null {
  try {
    const saved = JSON.parse(storage.getItem(LAST_RESULT_KEY) ?? "null")
    if (
      saved &&
      typeof saved === "object" &&
      saved.config &&
      saved.result &&
      typeof saved.config.keyword === "string" &&
      typeof saved.result.total === "number" &&
      saved.result.linksByCloud &&
      typeof saved.result.linksByCloud === "object"
    ) {
      return saved as SavedSearchResult
    }
  } catch {
    // Ignore stale or malformed session data.
  }
  return null
}
const cloudLabels: Record<string, string> = {
  baidu: "百度",
  aliyun: "阿里",
  115: "115",
  123: "123",
  xunlei: "迅雷",
  quark: "夸克",
  guangya: "光鸭",
  mobile: "移动",
  tianyi: "天翼",
  uc: "UC",
  pikpak: "PikPak",
  ed2k: "电驴",
  magnet: "磁力",
  other: "其他",
}
function authHeaders() {
  const token = getAccessToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}
function ChoiceRow({
  label,
  options,
  selected,
  onChange,
  translate = (value: string) => value,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (value: string) => void
  translate?: (value: string) => string
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[7rem_1fr] sm:items-start">
      <span className="pt-1.5 text-sm text-muted-foreground">{label}</span>
      <ToggleGroup
        multiple
        value={selected}
        onValueChange={(values) => {
          const changed =
            values.find((value) => !selected.includes(value)) ??
            selected.find((value) => !values.includes(value))
          if (changed) onChange(changed)
        }}
        className="flex-wrap"
      >
        {options.map((value) => (
          <ToggleGroupItem
            key={value}
            value={value}
            aria-label={value}
            size="sm"
          >
            {translate(value)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
export function ResourceSearchPage() {
  const [savedSearch] = useState(() => readSavedSearchResult(sessionStorage))
  const [meta, setMeta] = useState<Meta | null>(null),
    [query, setQuery] = useState(savedSearch?.config.keyword ?? ""),
    [source, setSource] = useState(savedSearch?.config.source ?? "all"),
    [mode, setMode] = useState(savedSearch?.config.mode ?? "merge"),
    [refresh, setRefresh] = useState(false),
    [cloudTypes, setCloudTypes] = useState<string[]>(
      savedSearch?.config.cloudTypes ?? []
    ),
    [plugins, setPlugins] = useState<string[]>(
      savedSearch?.config.plugins ?? []
    ),
    [channels, setChannels] = useState<string[]>(
      savedSearch?.config.channels ?? []
    ),
    [result, setResult] = useState<Result | null>(savedSearch?.result ?? null),
    [lastConfig, setLastConfig] = useState<SearchConfig | null>(
      savedSearch?.config ?? null
    ),
    [loading, setLoading] = useState(false),
    [updating, setUpdating] = useState(false),
    [error, setError] = useState(""),
    [history, setHistory] = useState<SearchConfig[]>(() =>
      readResourceSearchHistory(localStorage)
    ),
    [mediaHistory, setMediaHistory] = useState<MediaSearchHistoryEntry[]>(() =>
      readMediaSearchHistory(localStorage)
    ),
    [tab, setTab] = useState(savedSearch?.tab ?? ""),
    [copyMessage, setCopyMessage] = useState("")
  const timers = useRef<number[]>([]),
    runId = useRef(0),
    searchRef = useRef<(config?: SearchConfig) => void>(() => {})
  useEffect(() => {
    let active = true
    fetch("/api/v1/resources/meta", { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw Error("无法读取资源搜索配置")
        return r.json()
      })
      .then(async ({ data }) => {
        let saved: Record<string, unknown> = {}
        try {
          const response = await fetch("/api/settings/pansou", {
            headers: authHeaders(),
          })
          if (response.ok) saved = (await response.json()).values ?? {}
        } catch (error) {
          saved = {}
          void error
        }
        if (!active) return
        const selectedPlugins =
          savedSearch?.config.plugins ??
          (Array.isArray(saved["pansou.plugins"])
            ? (saved["pansou.plugins"] as string[])
            : data.defaults.plugins)
        const selectedChannels =
          savedSearch?.config.channels ??
          (Array.isArray(saved["pansou.channels"])
            ? (saved["pansou.channels"] as string[])
            : data.defaults.channels)
        const selectedClouds =
          savedSearch?.config.cloudTypes ??
          (Array.isArray(saved["pansou.cloudTypes"])
            ? (saved["pansou.cloudTypes"] as string[])
            : data.defaults.cloudTypes)
        setPlugins(selectedPlugins)
        setChannels(selectedChannels)
        setCloudTypes(selectedClouds)
        setMeta(data)
        const keyword = new URLSearchParams(window.location.search).get("kw")
        if (keyword && !savedSearch)
          searchRef.current({
            keyword,
            source: "all",
            mode: "merge",
            cloudTypes: selectedClouds,
            plugins: selectedPlugins,
            channels: selectedChannels,
            at: Date.now(),
          })
      })
      .catch(
        (e) =>
          active &&
          setError(e instanceof Error ? e.message : "无法读取资源搜索配置")
      )
    return () => {
      active = false
      timers.current.forEach(clearTimeout)
    }
  }, [savedSearch])
  const search = useCallback(
    async (config?: SearchConfig) => {
      const keyword = (config?.keyword ?? query).trim()
      if (!keyword) return
      timers.current.forEach(clearTimeout)
      timers.current = []
      const id = ++runId.current
      const chosen = {
        keyword,
        source: config?.source ?? source,
        mode: config?.mode ?? mode,
        cloudTypes: config?.cloudTypes ?? cloudTypes,
        plugins: config?.plugins ?? plugins,
        channels: config?.channels ?? channels,
        at: Date.now(),
      }
      setQuery(keyword)
      setSource(chosen.source)
      setMode(chosen.mode)
      setCloudTypes(chosen.cloudTypes)
      setPlugins(chosen.plugins)
      setChannels(chosen.channels)
      setLastConfig(chosen)
      setLoading(true)
      setUpdating(true)
      setError("")
      setResult(null)
      setHistory(saveResourceSearchHistory(localStorage, chosen))
      const call = async (src: string, force: boolean) => {
        const response = await fetch("/api/v1/resources/search", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            query: keyword,
            source: src,
            mode: chosen.mode,
            cloudTypes: chosen.cloudTypes,
            plugins: chosen.plugins,
            channels: chosen.channels,
            refresh: force,
          }),
        })
        const body = await response.json().catch(() => ({}))
        if (!response.ok)
          throw Error(
            body.error ?? body.message ?? `搜索失败 (${response.status})`
          )
        return body.data as Result
      }
      try {
        const first = await call(
          chosen.source != "all"
            ? chosen.source
            : chooseSearchSource(chosen.channels, chosen.plugins, true),
          true
        )
        if (runId.current !== id) return
        setResult(first)
        setTab(Object.keys(first.linksByCloud ?? {})[0] ?? "")
        setLoading(false)
        const steps = [
          {
            delay: 2000,
            src: chooseSearchSource(chosen.channels, chosen.plugins),
            refresh: false,
          },
          {
            delay: 2000,
            src: chooseSearchSource(chosen.channels, chosen.plugins),
            refresh: false,
          },
          ...(chosen.plugins.length
            ? [
                {
                  delay: 3000,
                  src: chooseSearchSource(chosen.channels, chosen.plugins),
                  refresh: false,
                },
              ]
            : []),
        ]
        let previous = Date.now()
        for (const step of steps) {
          const delay = Math.max(0, step.delay - (Date.now() - previous))
          await new Promise<void>((resolve) => {
            const timer = window.setTimeout(resolve, delay)
            timers.current.push(timer)
          })
          if (runId.current !== id) return
          try {
            const next = await call(step.src, false)
            if (runId.current !== id) return
            setResult((current) => {
              if (!current || next.total >= current.total) {
                setTab(Object.keys(next.linksByCloud ?? {})[0] ?? "")
                return next
              }
              return current
            })
          } catch (e) {
            if (runId.current === id)
              setError(e instanceof Error ? e.message : "搜索更新失败")
          }
          previous = Date.now()
        }
      } catch (e) {
        if (runId.current === id)
          setError(e instanceof Error ? e.message : "搜索失败")
      } finally {
        if (runId.current === id) {
          setLoading(false)
          setUpdating(false)
        }
      }
    },
    [query, source, mode, cloudTypes, plugins, channels]
  )
  useEffect(() => {
    searchRef.current = (config) => {
      void search(config)
    }
  }, [search])
  useEffect(() => {
    if (!result || !lastConfig) return
    try {
      sessionStorage.setItem(
        LAST_RESULT_KEY,
        JSON.stringify({
          config: lastConfig,
          result,
          tab,
        } satisfies SavedSearchResult)
      )
    } catch {
      // Keep the current in-memory result if the browser storage quota is full.
    }
  }, [lastConfig, result, tab])
  const toggle = (
    values: string[],
    value: string,
    set: (v: string[]) => void
  ) =>
    set(
      values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value]
    )
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage("复制成功")
    } catch {
      setCopyMessage("复制失败，请检查浏览器权限")
    }
    window.setTimeout(() => setCopyMessage(""), 1800)
  }
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>资源搜索</CardTitle>
          {(history.length > 0 || mediaHistory.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.removeItem(RESOURCE_SEARCH_HISTORY_KEY)
                setHistory([])
                setMediaHistory([])
              }}
            >
              清空历史
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void search()}
              placeholder="输入电影、剧集或动画名称"
              className="min-w-52 flex-1"
            />
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={refresh} onCheckedChange={setRefresh} />
              强制刷新
            </label>
            <Select value={mode} onValueChange={(v) => setMode(v ?? "merge")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merge">合并结果</SelectItem>
                <SelectItem value="results">原始结果</SelectItem>
              </SelectContent>
            </Select>
            <Button disabled={loading || !meta} onClick={() => void search()}>
              搜索
            </Button>
          </div>
          <ChoiceRow
            label="网盘类型"
            options={meta?.cloudTypes ?? []}
            selected={cloudTypes}
            onChange={(value) => toggle(cloudTypes, value, setCloudTypes)}
            translate={(value) => cloudLabels[value] ?? value}
          />
          <ChoiceRow
            label="搜索插件"
            options={meta?.plugins.map((plugin) => plugin.name) ?? []}
            selected={plugins}
            onChange={(value) => toggle(plugins, value, setPlugins)}
          />
          <ChoiceRow
            label="TG 频道"
            options={meta?.channels ?? []}
            selected={channels}
            onChange={(value) => toggle(channels, value, setChannels)}
          />
          <div className="grid gap-2 sm:grid-cols-[7rem_1fr] sm:items-center">
            <span className="text-sm text-muted-foreground">数据源</span>
            <Select
              value={source}
              onValueChange={(value) => setSource(value ?? "all")}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="tg">TG</SelectItem>
                <SelectItem value="plugin">插件</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      {mediaHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>影视探索搜索记录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mediaHistory.slice(0, 5).map((entry) => (
              <div
                key={`${entry.source}-${entry.keyword}-${entry.at}`}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b pb-2 last:border-b-0 last:pb-0"
              >
                <span className="font-medium">{entry.keyword}</span>
                <span className="text-sm text-muted-foreground">
                  {entry.source} · {new Date(entry.at).toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {copyMessage && (
        <p role="status" className="text-sm text-muted-foreground">
          {copyMessage}
        </p>
      )}
      {loading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            正在搜索资源…
          </CardContent>
        </Card>
      )}
      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              搜索结果 <Badge variant="secondary">{result.total}</Badge>
            </CardTitle>
            {updating && (
              <span className="text-sm text-muted-foreground">
                正在更新更多结果…
              </span>
            )}
          </CardHeader>
          <CardContent>
            {Object.keys(result.linksByCloud ?? {}).length ? (
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="max-w-full flex-wrap">
                  {Object.keys(result.linksByCloud).map((k) => (
                    <TabsTrigger key={k} value={k}>
                      {cloudLabels[k] ?? k}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(result.linksByCloud).map(([cloud, links]) => (
                  <TabsContent
                    key={cloud}
                    value={cloud}
                    className="space-y-3 pt-3"
                  >
                    {links.map((link, i) => (
                      <article
                        key={`${link.url}-${i}`}
                        className="rounded-lg border p-3"
                      >
                        <p className="font-medium">
                          {result.items
                            ?.flatMap((item) => item.links ?? [])
                            .find((x) => x.url === link.url)
                            ? result.items.find((item) =>
                                item.links?.some((x) => x.url === link.url)
                              )?.title
                            : (link.note ?? link.url)}
                        </p>
                        <p className="mt-1 text-xs break-all text-muted-foreground">
                          {link.source}{" "}
                          {link.updatedAt &&
                            `· ${new Date(link.updatedAt).toLocaleString()}`}
                        </p>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block text-sm break-all text-primary underline"
                        >
                          {link.url}
                        </a>
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void copy(link.url)}
                          >
                            复制链接
                          </Button>
                          {link.password && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void copy(link.password!)}
                            >
                              复制提取码：{link.password}
                            </Button>
                          )}
                        </div>
                      </article>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                没有找到资源链接
              </p>
            )}
          </CardContent>
        </Card>
      )}
      {!result && !loading && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>上一次搜索</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{history[0].keyword}</p>
            <p className="my-2 text-sm text-muted-foreground">
              {new Date(history[0].at).toLocaleString()} · {history[0].source} ·{" "}
              {history[0].mode}
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              网盘：
              {history[0].cloudTypes
                .map((type) => cloudLabels[type] ?? type)
                .join("、") || "默认"}{" "}
              · 插件：{history[0].plugins.join("、") || "默认"} · TG：
              {history[0].channels.join("、") || "默认"}
            </p>
            <Button variant="outline" onClick={() => void search(history[0])}>
              重新搜索
            </Button>
          </CardContent>
        </Card>
      )}
      {!result && !loading && history.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          输入关键词开始搜索；成功搜索后会在此显示最近一次搜索。
        </p>
      )}
    </main>
  )
}
