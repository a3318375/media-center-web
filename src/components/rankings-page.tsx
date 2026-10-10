import { useMemo, useState } from "react"
import { FlameIcon, RotateCwIcon, StarIcon, TrophyIcon } from "lucide-react"
import { cn } from "cn"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMediaDetail } from "@/components/media-detail-context"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  platformOptions,
  rankingCategories,
  rankingLists,
  regionOptions,
  type RankingCategory,
  type RankingEntry,
} from "@/mocks/data/rankings"

const rankingFilters: { id: RankingCategory | "all"; label: string }[] = [
  { id: "all", label: "全部榜单" },
  { id: "imdb-movies", label: "IMDb 最热门电影" },
  { id: "imdb-series", label: "IMDb 最热门剧集" },
  { id: "tmdb-trending", label: "TMDB 趋势" },
  { id: "anilist-popular", label: "AniList 热门" },
  { id: "bangumi-today", label: "Bangumi 今日动画" },
]

function RankingPoster({
  entry,
  index,
  onOpen,
}: {
  entry: RankingEntry
  index: number
  onOpen: (entry: RankingEntry) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className="group w-32 shrink-0 overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-36"
      aria-label={"查看第 " + (index + 1) + " 名《" + entry.title + "》详情"}
    >
      <div className={cn("relative flex aspect-[2/3] flex-col justify-between overflow-hidden bg-gradient-to-br p-3 text-white", entry.palette)}>
        <div className="absolute -right-6 -top-6 size-28 rounded-full border-[14px] border-white/10" />
        <div className="absolute -bottom-8 -left-8 size-28 rounded-full bg-white/10 blur-xl" />
        <div className="relative flex items-start justify-between gap-2">
          <Badge variant="secondary" className={cn("bg-black/45 text-white tabular-nums", index < 3 && "bg-primary text-primary-foreground")}>{index + 1}</Badge>
          <Badge variant="secondary" className="gap-1 bg-black/40 text-amber-200"><StarIcon className="size-3 fill-current" />{entry.rating.toFixed(1)}</Badge>
        </div>
        <div className="relative">
          <p className="text-xl font-black leading-tight tracking-tight">{entry.title}</p>
          <span className="mt-2 block text-[10px] font-medium uppercase tracking-[0.15em] text-white/70">{entry.source}</span>
        </div>
      </div>
      <div className="p-2.5">
        <p className="truncate text-xs font-semibold">{entry.title}</p>
        <p className="mt-1 truncate text-[11px] text-muted-foreground">{entry.year} · {entry.kind}</p>
      </div>
    </button>
  )
}

function RankingSection({
  title,
  source,
  description,
  entries,
  onOpen,
}: {
  title: string
  source: string
  description: string
  entries: RankingEntry[]
  onOpen: (entry: RankingEntry) => void
}) {
  if (!entries.length) return null

  return (
    <section className="border-b border-border/70 pb-5 last:border-b-0" aria-label={title}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wide">{source}</Badge>
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="text-xs text-muted-foreground">热门 · {entries.length} 部 · 横向滑动查看更多</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {entries.map((entry, index) => <RankingPoster key={entry.id} entry={entry} index={index} onOpen={onOpen} />)}
      </div>
    </section>
  )
}

export function RankingsPage() {
  const [platform, setPlatform] = useState("热门")
  const [category, setCategory] = useState<RankingCategory | "all">("all")
  const [region, setRegion] = useState("全球")
  const [refreshing, setRefreshing] = useState(false)
  const [notice, setNotice] = useState("")
  const [savedIds, setSavedIds] = useState<string[]>([])
  const openMediaDetail = useMediaDetail()

  const visibleSections = useMemo(() => {
    return rankingCategories
      .filter((item) => category === "all" || item.id === category)
      .map((item) => {
        let entries = rankingLists[item.id]
        if (platform !== "热门") entries = entries.filter((entry) => entry.platforms.includes(platform))
        if (region !== "全球") entries = entries.filter((entry) => entry.region === region)
        return { ...item, entries }
      })
  }, [category, platform, region])

  const totalEntries = visibleSections.reduce((sum, section) => sum + section.entries.length, 0)

  function refresh() {
    if (refreshing) return
    setRefreshing(true)
    setNotice("")
    window.setTimeout(() => {
      setRefreshing(false)
      setNotice("模拟榜单已刷新")
    }, 550)
  }

  function toggleSaved(entry: RankingEntry) {
    setSavedIds((current) => current.includes(entry.id) ? current.filter((id) => id !== entry.id) : [...current, entry.id])
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6 lg:p-7">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <p className="text-muted-foreground">浏览热门影视、动画与流媒体榜单。</p>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 font-normal"><FlameIcon />模拟榜单</Badge>
          <span className="text-xs text-muted-foreground">{totalEntries} 部作品</span>
        </div>
      </div>

      <Card className="border-border/70 shadow-none">
        <CardContent className="flex flex-col gap-3 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">选择平台</p>
              <p className="mt-0.5 text-sm font-semibold">流媒体榜单</p>
            </div>
            <Button variant="outline" size="lg" onClick={refresh} disabled={refreshing}>
              <RotateCwIcon data-icon="inline-start" className={refreshing ? "animate-spin" : undefined} />
              {refreshing ? "刷新中" : "刷新数据"}
            </Button>
          </div>

          <Tabs value={platform} onValueChange={(value) => value && setPlatform(value)}>
            <TabsList variant="line" className="w-full justify-start gap-1 overflow-x-auto rounded-none p-0">
              <TabsTrigger value="热门" className="flex-none gap-2 rounded-lg border px-3 py-2 data-active:border-primary/40 data-active:bg-primary/5">
                <FlameIcon />热门
              </TabsTrigger>
              {platformOptions.map((item) => (
                <TabsTrigger key={item} value={item} className="flex-none rounded-lg border px-3 py-2 data-active:border-primary/40 data-active:bg-primary/5">{item}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-3 border-t pt-3 lg:flex-row lg:items-center lg:justify-between">
            <Tabs value={category} onValueChange={(value) => value && setCategory(value as RankingCategory | "all")}>
              <TabsList variant="pill" className="h-auto w-full flex-wrap lg:w-fit">
                {rankingFilters.map((filter) => <TabsTrigger key={filter.id} value={filter.id} className="flex-none px-3 py-2 text-xs">{filter.label}</TabsTrigger>)}
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs text-muted-foreground">榜单范围</span>
              <Select value={region} onValueChange={(value) => { if (value) setRegion(value) }}>
                <SelectTrigger className="h-9 w-36" aria-label="榜单范围"><SelectValue>{region}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectGroup>{regionOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {notice && <Alert><CheckIcon /><AlertDescription>{notice}</AlertDescription></Alert>}

      <Card className="border-border/70 shadow-none">
        <CardHeader className="flex-row items-end justify-between gap-3">
          <div>
            <CardDescription>{platform} · {category === "all" ? "全部榜单" : rankingCategories.find((item) => item.id === category)?.source} · {region}</CardDescription>
            <CardTitle className="mt-1 text-xl">榜单推荐</CardTitle>
          </div>
          <p className="hidden text-xs text-muted-foreground md:block">展示本地演示榜单，不会请求外部平台。</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {visibleSections.some((section) => section.entries.length > 0) ? visibleSections.map((section) => (
            <RankingSection
              key={section.id}
              title={section.title}
              source={section.source}
              description={section.description}
              entries={section.entries}
              onOpen={(entry) => openMediaDetail({ title: entry.title, originalTitle: entry.title, kind: entry.kind, year: entry.year, region: entry.region, rating: entry.rating, source: entry.source, genres: [entry.source], summary: entry.tagline, palette: entry.palette, artwork: entry.title, actionLabel: savedIds.includes(entry.id) ? "从片单移除" : "加入片单", onAction: () => toggleSaved(entry) })}
            />
          )) : (
            <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 text-center">
              <TrophyIcon className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium">这个平台与范围下暂无模拟榜单</p>
              <p className="text-xs text-muted-foreground">切回“热门”或选择全球范围查看其他条目。</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
