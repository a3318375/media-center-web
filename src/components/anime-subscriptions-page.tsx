import { useEffect, useMemo, useState } from "react"
import { CheckIcon, Clock3Icon, PauseIcon, PlayIcon, RotateCwIcon, SearchIcon, StarIcon } from "lucide-react"
import { cn } from "cn"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type AnimeSubscription, type AnimeSubscriptionStatus } from "@/mocks/data/anime-subscriptions"
import { useMediaDetail } from "@/components/media-detail-context"
import { mediaApi } from "@/lib/media-api"

type StatusFilter = "全部" | AnimeSubscriptionStatus
const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] as const
type WeekdayFilter = "全部" | typeof weekdays[number]

function AnimeCard({
  anime,
  onOpen,
  onToggleStatus,
}: {
  anime: AnimeSubscription
  onOpen: (anime: AnimeSubscription) => void
  onToggleStatus: (anime: AnimeSubscription) => void
}) {
  const isUpdating = anime.status === "更新中"

  return (
    <Card className="group overflow-hidden border-border/70 p-0 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <button type="button" onClick={() => onOpen(anime)} className="relative block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={"查看《" + anime.title + "》订阅详情"}>
        <div className={cn("relative flex aspect-[3/4] flex-col justify-between overflow-hidden bg-gradient-to-br p-4 text-white", anime.palette)}>
          <div className="absolute -right-10 -top-10 size-40 rounded-full border-[20px] border-white/10" />
          <div className="absolute -bottom-12 -left-8 size-36 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute inset-x-4 top-1/2 h-px -rotate-12 bg-white/25" />
          <div className="relative flex items-start justify-between gap-2">
            <Badge variant="secondary" className="bg-black/35 text-white backdrop-blur">{anime.status}</Badge>
            <Badge variant="secondary" className="gap-1 bg-black/35 text-amber-200 backdrop-blur"><StarIcon className="size-3 fill-current" />{anime.rating}</Badge>
          </div>
          <div className="relative">
            <p className="whitespace-pre-line text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl">{anime.artwork}</p>
            <p className="mt-2 line-clamp-1 text-[10px] uppercase tracking-[0.13em] text-white/75">{anime.originalTitle}</p>
          </div>
          <Badge className="absolute bottom-3 right-3 bg-background/90 text-foreground">RSS 演示</Badge>
        </div>
      </button>
      <CardContent className="flex flex-col gap-3 p-3">
        <div className="min-w-0">
          <button type="button" onClick={() => onOpen(anime)} className="block w-full truncate text-left text-sm font-semibold hover:text-primary">{anime.title}</button>
          <p className="mt-1 text-xs text-muted-foreground">
            {anime.totalEpisodes ? "第 " + anime.currentEpisode + " / " + anime.totalEpisodes + " 集" : "更新至第 " + anime.currentEpisode + " 集"}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-2.5 py-2 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground"><Clock3Icon className="size-3.5" />{isUpdating ? anime.nextUpdate : anime.nextUpdate}</span>
          <span className="font-medium">{anime.nextEpisode}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 gap-1">
            {anime.genres.slice(0, 2).map((genre) => <Badge key={genre} variant="outline" className="max-w-20 truncate text-[10px] font-normal">{genre}</Badge>)}
          </div>
          {anime.status !== "已完结" && (
            <Button variant="ghost" size="sm" onClick={() => onToggleStatus(anime)} aria-label={isUpdating ? "暂停订阅" : "恢复订阅"}>
              {isUpdating ? <PauseIcon data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
              {isUpdating ? "暂停" : "恢复"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function AnimeSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<AnimeSubscription[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("全部")
  const [weekdayFilter, setWeekdayFilter] = useState<WeekdayFilter>("全部")
  const [queryDraft, setQueryDraft] = useState("")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState("最近更新")
  const [refreshing, setRefreshing] = useState(false)
  const [notice, setNotice] = useState("")
  const openMediaDetail = useMediaDetail()

  useEffect(() => {
    mediaApi.animeSubscriptions().then(setSubscriptions).catch(() => setNotice("订阅列表加载失败"))
  }, [])

  const counts = useMemo(() => ({
    全部: subscriptions.length,
    更新中: subscriptions.filter((item) => item.status === "更新中").length,
    已暂停: subscriptions.filter((item) => item.status === "已暂停").length,
    已完结: subscriptions.filter((item) => item.status === "已完结").length,
  }), [subscriptions])

  const visibleSubscriptions = useMemo(() => {
    const term = query.toLocaleLowerCase()
    const result = subscriptions.filter((item) => {
      const statusMatches = statusFilter === "全部" || item.status === statusFilter
      const weekdayMatches = weekdayFilter === "全部" || item.nextUpdate.startsWith(weekdayFilter)
      const queryMatches = !term || (item.title + " " + item.originalTitle + " " + item.genres.join(" ")).toLocaleLowerCase().includes(term)
      return statusMatches && weekdayMatches && queryMatches
    })
    return result.sort((a, b) => {
      if (sort === "评分") return Number(b.rating) - Number(a.rating)
      if (sort === "名称") return a.title.localeCompare(b.title, "zh-CN")
      return a.nextUpdate.localeCompare(b.nextUpdate, "zh-CN")
    })
  }, [subscriptions, statusFilter, weekdayFilter, query, sort])

  async function toggleStatus(anime: AnimeSubscription) {
    const nextStatus = anime.status === "更新中" ? "已暂停" : "更新中"
    try {
      const updated = await mediaApi.updateAnimeSubscription(anime.id, { status: nextStatus })
      setSubscriptions((current) => current.map((item) => item.id === anime.id ? updated : item))
      setNotice(anime.title + (nextStatus === "已暂停" ? " 已暂停订阅" : " 已恢复订阅"))
    } catch { setNotice("更新订阅状态失败") }
  }

  function openAnime(anime: AnimeSubscription) {
    openMediaDetail({
      title: anime.title,
      originalTitle: anime.originalTitle,
      kind: "动画",
      year: 2026,
      rating: anime.rating,
      mediaId: anime.id,
      source: "anilist",
      sourceId: anime.id,
      sourceLabel: "RSS 订阅",
      mediaType: "anime",
      genres: anime.genres,
      summary: anime.description,
      palette: anime.palette,
      artwork: anime.artwork,
      status: anime.status,
      episodeInfo: anime.totalEpisodes ? `第 ${anime.currentEpisode} / ${anime.totalEpisodes} 集` : `更新至第 ${anime.currentEpisode} 集`,
      actionLabel: anime.status === "更新中" ? "暂停订阅" : anime.status === "已暂停" ? "恢复订阅" : "订阅已完结",
      onAction: anime.status === "已完结" ? undefined : () => toggleStatus(anime),
    })
  }

  function refresh() {
    if (refreshing) return
    setRefreshing(true)
    setNotice("")
    mediaApi.animeSubscriptions().then((items) => { setSubscriptions(items); setNotice("订阅列表已刷新") }).catch(() => setNotice("刷新失败")).finally(() => setRefreshing(false))
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuery(queryDraft.trim())
  }

  function clearSearch() {
    setQuery("")
    setQueryDraft("")
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6 lg:p-7">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm text-muted-foreground">查看已订阅番剧的更新状态与下一集信息。</p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-normal">RSS 模拟数据</Badge>
          <span className="text-xs text-muted-foreground">{counts.全部} 个订阅</span>
        </div>
      </div>

      <Card className="border-border/70 shadow-none">
        <CardContent className="flex flex-col gap-3 p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <Tabs value={statusFilter} onValueChange={(value) => value && setStatusFilter(value as StatusFilter)}>
              <TabsList variant="pill" className="h-auto w-full flex-wrap xl:w-fit">
                {(["全部", "更新中", "已暂停", "已完结"] as const).map((status) => (
                  <TabsTrigger key={status} value={status} className="flex-none gap-2 px-3 py-2 text-xs">
                    {status}<span className="tabular-nums opacity-70">{counts[status]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <form className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:flex-nowrap" onSubmit={submitSearch}>
              <Select value={sort} onValueChange={(value) => { if (value) setSort(value) }}>
                <SelectTrigger className="h-9 w-32" aria-label="排序方式"><SelectValue>{sort}</SelectValue></SelectTrigger>
                <SelectContent><SelectGroup>
                  {["最近更新", "评分", "名称"].map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectGroup></SelectContent>
              </Select>
              <div className="relative min-w-0 flex-1 xl:w-60 xl:flex-none">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input aria-label="搜索动漫订阅" value={queryDraft} onChange={(event) => setQueryDraft(event.target.value)} placeholder="搜索作品名称或题材" className="h-9 pl-9" />
              </div>
              <Button type="submit" size="lg">搜索</Button>
              <Button type="button" variant="outline" size="lg" onClick={clearSearch}>清空</Button>
              <Button type="button" variant="outline" size="lg" onClick={refresh} disabled={refreshing}>
                <RotateCwIcon data-icon="inline-start" className={refreshing ? "animate-spin" : undefined} />{refreshing ? "刷新中" : "刷新"}
              </Button>
            </form>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
            <span className="mr-1 text-xs font-medium text-muted-foreground">更新日</span>
            <Button type="button" size="sm" variant={weekdayFilter === "全部" ? "default" : "ghost"} className="h-8 rounded-full px-3" onClick={() => setWeekdayFilter("全部")}>全部</Button>
            {weekdays.map((weekday) => {
              const count = subscriptions.filter((item) => item.nextUpdate.startsWith(weekday)).length
              return <Button key={weekday} type="button" size="sm" variant={weekdayFilter === weekday ? "default" : "ghost"} className="h-8 rounded-full px-3" onClick={() => setWeekdayFilter(weekday)}>
                {weekday}<span className="ml-1 tabular-nums opacity-70">{count}</span>
              </Button>
            })}
          </div>
          <p className="border-t pt-2 text-xs text-muted-foreground">订阅内容由 RSS 来源提供；当前页面仅展示模拟订阅状态，没有连接实际订阅源。</p>
        </CardContent>
      </Card>

      {notice && <Alert><CheckIcon /><AlertDescription>{notice}</AlertDescription></Alert>}

      <div className="flex items-end justify-between gap-3">
        <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Subscriptions</p><h2 className="mt-1 text-lg font-semibold tracking-tight">{weekdayFilter === "全部" ? (statusFilter === "全部" ? "我的动漫订阅" : statusFilter) : weekdayFilter + "更新"}</h2></div>
        <Badge variant="secondary">{visibleSubscriptions.length} 项</Badge>
      </div>

      {visibleSubscriptions.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {visibleSubscriptions.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} onOpen={openAnime} onToggleStatus={toggleStatus} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 px-6 text-center">
          <p className="text-sm font-medium">没有找到符合条件的订阅</p>
          <p className="text-xs text-muted-foreground">试试清除搜索内容或切换订阅状态。</p>
          <Button variant="outline" size="sm" onClick={() => { setStatusFilter("全部"); setWeekdayFilter("全部"); clearSearch() }}>清除筛选</Button>
        </div>
      )}

    </div>
  )
}
