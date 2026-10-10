import { useMemo, useState } from "react"
import {
  ActivityIcon,
  CheckIcon,
  ChevronRightIcon,
  ClapperboardIcon,
  Clock3Icon,
  FilmIcon,
  Layers3Icon,
  Music2Icon,
  PlayIcon,
  RadioIcon,
  RefreshCwIcon,
  TvMinimalPlayIcon,
  UsersIcon,
} from "lucide-react"
import { cn } from "cn"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMediaDetail } from "@/components/media-detail-context"
import {
  continueWatching,
  embyLibraries,
  embySites,
  embyStats,
  recentlyAdded,
  type EmbyMediaItem,
  type EmbyResumeItem,
} from "@/mocks/data/emby-dashboard"

type SiteSelection = (typeof embySites)[number]["id"]

const statDefinitions = [
  { key: "movies", label: "电影", icon: FilmIcon, note: "已入库影片" },
  { key: "series", label: "剧集", icon: TvMinimalPlayIcon, note: "已入库剧集" },
  { key: "episodes", label: "总集数", icon: ClapperboardIcon, note: "剧集与动画" },
  { key: "plays", label: "播放次数", icon: PlayIcon, note: "累计播放" },
  { key: "viewers", label: "活跃观众", icon: UsersIcon, note: "当前在线" },
  { key: "hours", label: "时长（小时）", icon: Clock3Icon, note: "累计观看" },
] as const

const libraryIcons = {
  电影: FilmIcon,
  剧集: TvMinimalPlayIcon,
  动画: ClapperboardIcon,
  纪录片: ActivityIcon,
  演出: Music2Icon,
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(date)
}

function PosterArtwork({ item }: { item: EmbyMediaItem }) {
  return (
    <div
      role="img"
      aria-label={`${item.title}的演示海报`}
      className={cn(
        "relative isolate flex aspect-[3/4] overflow-hidden bg-gradient-to-br p-3 text-primary-foreground",
        item.palette
      )}
    >
      <div className="absolute -right-8 -top-8 -z-10 size-36 rounded-full border-[18px] border-background/15" />
      <div className="absolute -bottom-10 -left-6 -z-10 size-32 rounded-full bg-background/15 blur-xl" />
      <div className="absolute inset-x-3 top-1/2 -z-10 h-px -rotate-12 bg-background/30" />
      <div className="flex w-full flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full border border-background/30 bg-background/20 px-2 py-1 text-[10px] font-medium backdrop-blur">
            FRAME · MEDIA
          </span>
          <span className="text-xs font-semibold tabular-nums">{item.year}</span>
        </div>
        <div>
          <p className="whitespace-pre-line text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl">
            {item.artworkTitle}
          </p>
          <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.22em] opacity-80">
            {item.kind} · {item.rating} 分
          </p>
        </div>
      </div>
    </div>
  )
}

function MediaCard({
  item,
  onOpen,
  resume,
}: {
  item: EmbyMediaItem
  onOpen: (item: EmbyMediaItem) => void
  resume?: EmbyResumeItem
}) {
  return (
    <button
      type="button"
      className="group w-full rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={() => onOpen(item)}
      aria-label={`${resume ? "继续播放" : "查看详情"}《${item.title}》`}
    >
      <Card className="overflow-hidden p-0 transition-[box-shadow,transform] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardContent className="p-0">
          <PosterArtwork item={item} />
          <div className="flex min-w-0 items-center justify-between gap-2 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{item.title}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {resume ? `${resume.resumeLabel} · ${resume.remaining}` : `${item.year} · ${item.kind}`}
              </p>
            </div>
            {!resume && <Badge variant="secondary" className="shrink-0 tabular-nums">{item.rating}</Badge>}
          </div>
          {resume && (
            <div className="flex flex-col gap-2 px-3 pb-3">
              <Progress value={resume.progress} aria-label={`${item.title}播放进度`} />
              <span className="text-right text-xs tabular-nums text-muted-foreground">{resume.progress}%</span>
            </div>
          )}
        </CardContent>
      </Card>
    </button>
  )
}

export function EmbyDashboard() {
  const [siteId, setSiteId] = useState<SiteSelection>("all")
  const [selectedLibrary, setSelectedLibrary] = useState<string | null>(null)
  const [liveEnabled, setLiveEnabled] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date())
  const [notice, setNotice] = useState("")
  const openMediaDetail = useMediaDetail()

  const visibleLibraries = useMemo(
    () => embyLibraries.filter((library) => siteId === "all" || library.siteId === siteId),
    [siteId]
  )
  const visibleRecent = useMemo(
    () => recentlyAdded.filter((item) =>
      (siteId === "all" || item.siteId === siteId) &&
      (!selectedLibrary || item.libraryId === selectedLibrary)
    ),
    [siteId, selectedLibrary]
  )
  const visibleResume = useMemo(
    () => continueWatching.filter((item) =>
      (siteId === "all" || item.siteId === siteId) &&
      (!selectedLibrary || item.libraryId === selectedLibrary)
    ),
    [siteId, selectedLibrary]
  )
  const stats = embyStats[siteId]
  const selectedLibraryTitle = embyLibraries.find((library) => library.id === selectedLibrary)?.title
  const currentDate = new Intl.DateTimeFormat("zh-CN", { dateStyle: "full" }).format(new Date())

  function handleSiteChange(value: unknown) {
    if (typeof value === "string" && embySites.some((site) => site.id === value)) {
      setSiteId(value as SiteSelection)
      setSelectedLibrary(null)
    }
  }

  function refreshCache() {
    if (isRefreshing) return
    setIsRefreshing(true)
    setNotice("")
    window.setTimeout(() => {
      const refreshedAt = new Date()
      setLastRefreshed(refreshedAt)
      setIsRefreshing(false)
      setNotice(`演示缓存已刷新 · ${formatTime(refreshedAt)}`)
    }, 650)
  }

  function openMedia(item: EmbyMediaItem) {
    openMediaDetail({
      title: item.title,
      originalTitle: item.title,
      kind: item.kind,
      year: item.year,
      rating: item.rating,
      source: "Emby 媒体库",
      summary: item.summary,
      palette: item.palette,
      artwork: item.artworkTitle,
      actionLabel: "模拟播放",
      onAction: () => setNotice(`正在模拟播放《${item.title}》`),
    })
    setNotice("")
  }

  return (
    <div className="flex flex-col gap-6 p-5 sm:p-7 lg:p-8">
      <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <Badge variant="outline" className="gap-1.5 font-normal">
            <span className="size-1.5 rounded-full bg-chart-2" />演示数据
          </Badge>
          <p className="text-sm text-muted-foreground">{currentDate} · 最近刷新 {formatTime(lastRefreshed)}</p>
        </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={refreshCache} disabled={isRefreshing}>
              <RefreshCwIcon data-icon="inline-start" className={isRefreshing ? "animate-spin" : undefined} />
              {isRefreshing ? "刷新中" : "刷新缓存"}
            </Button>
            <Select value={siteId} onValueChange={handleSiteChange}>
              <SelectTrigger aria-label="统计站点范围" className="w-40 bg-background">
              <SelectValue>{embySites.find((site) => site.id === siteId)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {embySites.map((site) => <SelectItem key={site.id} value={site.id}>{site.label}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant={liveEnabled ? "outline" : "ghost"}
              size="icon"
              aria-label={liveEnabled ? "关闭实时状态模拟" : "开启实时状态模拟"}
              aria-pressed={liveEnabled}
              title={liveEnabled ? "实时状态模拟已开启" : "实时状态模拟已暂停"}
              onClick={() => setLiveEnabled((enabled) => !enabled)}
            >
              <RadioIcon />
            </Button>
          </div>
      </div>

      {notice && <Alert className="border-chart-2/30 bg-chart-2/5"><CheckIcon /><AlertDescription>{notice}</AlertDescription></Alert>}

      <section aria-labelledby="emby-stats-title" className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Overview</p>
            <h3 id="emby-stats-title" className="mt-1 text-lg font-semibold tracking-tight">媒体统计</h3>
          </div>
          <Badge variant="secondary" className="font-normal">{embySites.find((site) => site.id === siteId)?.label}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {statDefinitions.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.key} className="border-border/70 shadow-none">
                <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-2">
                  <CardDescription>{stat.label}</CardDescription>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-4" aria-hidden="true" /></span>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-2xl font-semibold tabular-nums tracking-tight">{stats[stat.key].toLocaleString("zh-CN")}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.note}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <Card className="border-border/70 shadow-none">
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2"><Layers3Icon className="size-4 text-muted-foreground" />我的媒体库</CardTitle>
            <CardDescription>选择媒体库，筛选最近入库和继续播放内容。</CardDescription>
          </div>
          {selectedLibrary && <Button variant="ghost" size="sm" onClick={() => setSelectedLibrary(null)}>显示全部</Button>}
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {visibleLibraries.map((library) => {
            const Icon = libraryIcons[library.type as keyof typeof libraryIcons]
            const isSelected = selectedLibrary === library.id
            return (
              <button
                key={library.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedLibrary((current) => current === library.id ? null : library.id)}
                className="rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className={cn("h-full border-border/70 shadow-none transition-colors hover:bg-muted/50", isSelected && "border-primary/50 bg-primary/5 ring-2 ring-primary/20")}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Icon className="size-5" aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{library.title}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{library.count.toLocaleString("zh-CN")} 个项目</span>
                    </span>
                    <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 2xl:grid-cols-2">
        <MediaSection
          title="最近入库"
          description={selectedLibraryTitle ? `${selectedLibraryTitle} · 最近添加` : "刚刚加入媒体库的内容"}
          items={visibleRecent}
          onOpen={openMedia}
          emptyMessage="当前筛选条件下没有最近入库内容。"
        />
        <MediaSection
          title="继续播放"
          description={selectedLibraryTitle ? `${selectedLibraryTitle} · 接着上次继续观看` : "从上次停止的位置接着观看"}
          items={visibleResume}
          onOpen={openMedia}
          emptyMessage="当前筛选条件下暂无继续播放内容。"
          resume
          headerAction={
            <Badge variant={liveEnabled ? "secondary" : "outline"} className="gap-1.5 font-normal">
              <span className={cn("size-1.5 rounded-full", liveEnabled ? "bg-chart-2" : "bg-muted-foreground")} />
              {liveEnabled ? "实时状态" : "已暂停"}
            </Badge>
          }
        />
      </div>

    </div>
  )
}

function MediaSection({
  title,
  description,
  items,
  onOpen,
  emptyMessage,
  resume = false,
  headerAction,
}: {
  title: string
  description: string
  items: EmbyMediaItem[] | EmbyResumeItem[]
  onOpen: (item: EmbyMediaItem) => void
  emptyMessage: string
  resume?: boolean
  headerAction?: React.ReactNode
}) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1"><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></div>
        {headerAction ?? (items.length > 0 && <Badge variant="outline" className="font-normal tabular-nums">{items.length} 项</Badge>)}
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((item) => (
              <MediaCard key={item.id} item={item} onOpen={onOpen} resume={resume ? item as EmbyResumeItem : undefined} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 px-6 text-center">
            <FilmIcon className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
