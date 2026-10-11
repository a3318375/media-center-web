import { useEffect, useMemo, useState } from "react"
import { BookmarkIcon, CheckIcon, FilmIcon, RotateCwIcon, SearchIcon, SparklesIcon, StarIcon, UsersIcon } from "lucide-react"
import { cn } from "cn"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useMediaDetail } from "@/components/media-detail-context"
import { discoverPeople, discoverSources, type DiscoverItem, type DiscoverSource } from "@/mocks/data/discover"
import { mediaApi } from "@/lib/media-api"

type Filters = { mediaType: string; genre: string; region: string; year: string; sort: string }
const years = Array.from({ length: 20 }, (_, i) => String(2026 - i))
const initialFilters: Filters = { mediaType: "全部", genre: "全部", region: "全部", year: "全部", sort: "热度" }
const sourceOptions: Record<string, { genres: string[]; regions: string[]; sorts: string[] }> = {
  tmdb: { genres: ["动作", "冒险", "喜剧", "犯罪", "纪录", "剧情", "家庭", "奇幻", "历史", "恐怖", "音乐", "悬疑", "爱情", "科幻", "惊悚", "战争", "西部"], regions: ["大陆", "香港", "台湾", "日本", "韩国", "欧美"], sorts: ["热度", "最新", "TMDB 评分"] },
  douban: { genres: ["动作", "冒险", "喜剧", "犯罪", "纪录片", "剧情", "家庭", "奇幻", "历史", "恐怖", "音乐", "悬疑", "爱情", "科幻", "战争", "动画"], regions: [], sorts: ["推荐", "最新", "高分"] },
  anilist: { genres: ["动作", "冒险", "喜剧", "剧情", "奇幻", "恐怖", "悬疑", "爱情", "科幻", "运动", "音乐", "日常", "超自然"], regions: ["日本", "大陆", "韩国"], sorts: ["趋势", "最新", "评分"] },
  bangumi: { genres: ["动作", "冒险", "喜剧", "剧情", "奇幻", "悬疑", "爱情", "科幻", "音乐", "日常", "治愈", "校园"], regions: ["日本", "大陆", "韩国"], sorts: ["热门", "最新", "社区评分"] },
}

function FilterRow({ label, values, value, onChange }: { label: string; values: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-border/70 py-2 last:border-b-0 sm:flex-row sm:items-start sm:gap-4">
      <span className="w-12 shrink-0 pt-1 text-xs font-semibold text-muted-foreground">{label}</span>
      <ToggleGroup aria-label={label} value={[value]} onValueChange={(next) => { const picked = next.at(-1); if (picked) onChange(picked) }} className="flex w-full flex-wrap gap-1">
        {values.map((option) => (
          <ToggleGroupItem key={option} value={option} size="sm" className={cn("h-7 rounded-md px-2.5 text-xs text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm", option === value && "font-semibold")}>{option}</ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

function PosterCard({ item, saved, onOpen, onSave }: { item: DiscoverItem; saved: boolean; onOpen: (item: DiscoverItem) => void; onSave: (item: DiscoverItem) => void }) {
  return (
    <Card className="group overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <button type="button" onClick={() => onOpen(item)} className="relative block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={"查看《" + item.title + "》详情"}>
        <div className={cn("relative flex aspect-[2/3] flex-col justify-between overflow-hidden bg-gradient-to-br p-3 text-white", item.palette)}>
          <div className="absolute -right-8 top-1/4 size-36 rounded-full border-[18px] border-white/10" />
          <div className="absolute -bottom-12 -left-8 size-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute inset-x-3 top-1/2 h-px -rotate-12 bg-white/25" />
          <div className="relative flex items-start justify-between gap-2">
            <Badge variant="secondary" className="bg-black/30 text-white backdrop-blur">{item.kind}</Badge>
            <Badge variant="secondary" className="gap-1 bg-black/35 text-amber-200 backdrop-blur"><StarIcon className="size-3 fill-current" />{item.rating.toFixed(1)}</Badge>
          </div>
          <div className="relative px-1 pb-1">
            <p className="whitespace-pre-line text-2xl font-black leading-[1.05] tracking-tight sm:text-3xl">{item.artwork}</p>
            <p className="mt-2 line-clamp-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/75">{item.originalTitle}</p>
          </div>
          <Badge className="absolute bottom-3 right-3 bg-background/90 text-foreground shadow-sm">演示海报</Badge>
        </div>
      </button>
      <CardContent className="flex min-w-0 items-start justify-between gap-2 p-3">
        <button type="button" onClick={() => onOpen(item)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold">{item.title}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{item.year} · {item.region} · {item.source.toUpperCase()}</p>
        </button>
        <Button variant={saved ? "secondary" : "ghost"} size="icon-sm" aria-label={(saved ? "从片单移除《" : "加入片单《") + item.title + "》"} aria-pressed={saved} onClick={() => onSave(item)}>
          {saved ? <CheckIcon /> : <BookmarkIcon />}
        </Button>
      </CardContent>
    </Card>
  )
}

export function DiscoverExplorePage() {
  const [source, setSource] = useState<DiscoverSource>("tmdb")
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [queryDraft, setQueryDraft] = useState("")
  const [query, setQuery] = useState("")
  const [selectedPerson, setSelectedPerson] = useState<(typeof discoverPeople)[number] | null>(null)
  const openMediaDetail = useMediaDetail()
  const [saved, setSaved] = useState<string[]>([])
  const [notice, setNotice] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [sourceItems, setSourceItems] = useState<DiscoverItem[]>([])
  const [peopleData, setPeopleData] = useState(discoverPeople)

  useEffect(() => {
    let active = true
    mediaApi.discover({ source: source === "people" ? "tmdb" : source, query: query || undefined })
      .then((result) => { if (active) { setSourceItems(result.items); setPeopleData(result.people) } })
      .catch(() => { if (active) setNotice("加载探索数据失败") })
    return () => { active = false }
  }, [source, query])

  const items = useMemo(() => {
    if (source === "people") return []
    let result = sourceItems
    if (filters.mediaType === "电影") result = result.filter((item) => item.kind === "电影")
    if (filters.mediaType === "电视剧") result = result.filter((item) => item.kind === "剧集")
    if (filters.mediaType === "动画") result = result.filter((item) => item.kind === "动画")
    if (filters.genre !== "全部") result = result.filter((item) => item.genres.includes(filters.genre))
    if (filters.region !== "全部") result = result.filter((item) => item.region === filters.region)
    if (filters.year !== "全部") result = result.filter((item) => String(item.year) === filters.year)
    if (query) {
      const term = query.toLocaleLowerCase()
      result = result.filter((item) => (item.title + " " + item.originalTitle + " " + item.summary + " " + item.genres.join(" ")).toLocaleLowerCase().includes(term))
    }
    return [...result].sort((a, b) => filters.sort === "最新" ? b.year - a.year : b.rating - a.rating)
  }, [filters, query, source, sourceItems])

  const people = useMemo(() => peopleData.filter((person) => !query || (person.name + " " + person.originalName + " " + person.knownFor).toLocaleLowerCase().includes(query.toLocaleLowerCase())), [peopleData, query])
  const sourceInfo = discoverSources.find((entry) => entry.id === source)!
  const options = source === "people" ? null : sourceOptions[source]

  function setFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function changeSource(value: string | null) {
    if (!value || !discoverSources.some((entry) => entry.id === value)) return
    const nextSource = value as DiscoverSource
    setSource(nextSource)
    setFilters({ ...initialFilters, sort: nextSource === "douban" ? "推荐" : nextSource === "anilist" ? "趋势" : nextSource === "bangumi" ? "热门" : "热度" })
    setQuery("")
    setQueryDraft("")
    setNotice("")
  }

  function resetFilters() {
    setFilters({ ...initialFilters, sort: source === "douban" ? "推荐" : source === "anilist" ? "趋势" : source === "bangumi" ? "热门" : "热度" })
    setNotice("筛选条件已重置")
  }

  function clearSearch() {
    setQuery("")
    setQueryDraft("")
    setNotice("")
  }

  function refresh() {
    if (refreshing) return
    setRefreshing(true)
    mediaApi.discover({ source: source === "people" ? "tmdb" : source, query: query || undefined }).then((result) => { setSourceItems(result.items); setPeopleData(result.people); setNotice("模拟数据已从 API 刷新") }).catch(() => setNotice("刷新失败")).finally(() => setRefreshing(false))
  }

  async function openDiscoverItem(item: DiscoverItem, actionLabel?: string, onAction?: () => void) {
    try {
      const detail = await mediaApi.detail(item.source, item.id.replace(/^[a-z]+-/, "demo-"))
      openMediaDetail({ mediaId: detail.mediaId, sourceId: detail.sourceId, source: detail.source, sourceLabel: discoverSources.find((entry) => entry.id === item.source)?.label, mediaType: detail.mediaType, ratings: detail.ratings, credits: detail.credits, seasons: detail.seasons, title: detail.title, originalTitle: detail.originalTitle, kind: item.kind, year: detail.year, region: detail.region, rating: detail.ratings[0]?.value ?? item.rating, genres: detail.genres, summary: detail.overview, palette: item.palette, artwork: item.artwork, actionLabel, onAction })
    } catch { setNotice("读取作品详情失败") }
  }

  function toggleSaved(item: DiscoverItem) {
    setSaved((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6 lg:p-7">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <p className="text-muted-foreground">按来源探索电影、剧集、动画与演职人员。</p>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 font-normal"><SparklesIcon />模拟数据</Badge>
          <span className="text-xs text-muted-foreground">{source === "people" ? people.length + " 位人物" : items.length + " 部作品"}</span>
        </div>
      </div>

      <Card className="border-border/70 shadow-none">
        <CardContent className="flex flex-col gap-3 p-3 xl:flex-row xl:items-center xl:justify-between">
          <Tabs value={source} onValueChange={changeSource}>
            <TabsList variant="pill" className="h-auto w-full flex-wrap xl:w-fit">
              {discoverSources.map((provider) => <TabsTrigger key={provider.id} value={provider.id} className="flex-none px-3 py-2 text-xs sm:text-sm">{provider.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <form className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:flex-nowrap" onSubmit={(event) => { event.preventDefault(); setQuery(queryDraft.trim()) }}>
            <div className="relative min-w-0 flex-1 xl:w-56 xl:flex-none">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label={source === "people" ? "搜索演员" : "搜索影视"} value={queryDraft} onChange={(event) => setQueryDraft(event.target.value)} placeholder={source === "people" ? "输入演员姓名，按 Enter 搜索" : "输入片名，按 Enter 搜索"} className="h-9 pl-9" />
            </div>
            <Button type="submit" size="lg"><SearchIcon data-icon="inline-start" />搜索</Button>
            <Button type="button" variant="outline" size="lg" onClick={clearSearch}>清空</Button>
            {source !== "people" && <Button type="button" variant="outline" size="lg" onClick={resetFilters}>重置</Button>}
            <Button type="button" variant="outline" size="lg" onClick={refresh} disabled={refreshing}>
              <RotateCwIcon data-icon="inline-start" className={refreshing ? "animate-spin" : undefined} />{refreshing ? "刷新中" : "刷新"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {source === "people" ? (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-card to-muted/40 shadow-none">
          <CardHeader><CardTitle className="flex items-center gap-2"><UsersIcon className="size-4 text-primary" />热门演员</CardTitle><CardDescription>人物档案与作品均为演示数据。</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {people.map((person) => (
              <button key={person.id} type="button" onClick={() => setSelectedPerson(person)} className="group rounded-xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className={cn("relative flex aspect-[4/3] items-end overflow-hidden rounded-lg bg-gradient-to-br p-3", person.palette)}>
                  <span className="text-5xl font-black text-black/35">{person.initials}</span><Badge className="absolute bottom-2 right-2 bg-background/85 text-foreground">人气 {person.popularity}</Badge>
                </div>
                <p className="mt-3 truncate text-sm font-semibold">{person.name}</p><p className="mt-1 text-xs text-muted-foreground">{person.role}</p>
                <p className="mt-2 line-clamp-2 min-h-8 text-xs text-muted-foreground">{person.knownFor}</p><span className="mt-3 inline-flex items-center text-xs font-medium text-primary">查看作品 →</span>
              </button>
            ))}
            {!people.length && <p className="col-span-full py-12 text-center text-sm text-muted-foreground">没有找到匹配的人物。</p>}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/70 shadow-none">
          <CardContent className="px-4 py-2">
            {(source === "tmdb" || source === "douban") && <FilterRow label="影视类别" values={["全部", "电影", "电视剧"]} value={filters.mediaType} onChange={(value) => setFilter("mediaType", value)} />}
            {options && <FilterRow label={source === "douban" ? "分类" : "类型"} values={["全部", ...options.genres]} value={filters.genre} onChange={(value) => setFilter("genre", value)} />}
            {options?.regions.length ? <FilterRow label="地区" values={["全部", ...options.regions]} value={filters.region} onChange={(value) => setFilter("region", value)} /> : null}
            <FilterRow label="年份" values={["全部", ...years]} value={filters.year} onChange={(value) => setFilter("year", value)} />
            {options && <FilterRow label="排序" values={options.sorts} value={filters.sort} onChange={(value) => setFilter("sort", value)} />}
          </CardContent>
        </Card>
      )}

      {notice && <Alert><CheckIcon /><AlertDescription>{notice}</AlertDescription></Alert>}

      {source !== "people" && <>
        <div className="flex items-end justify-between gap-3">
          <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{sourceInfo.label}</p><h3 className="mt-1 text-lg font-semibold tracking-tight">{query ? "“" + query + "”的搜索结果" : "为你发现"}</h3></div>
          <Badge variant="secondary">{items.length} 部作品</Badge>
        </div>
        {items.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {items.map((item) => <PosterCard key={item.id} item={item} saved={saved.includes(item.id)} onOpen={(item) => void openDiscoverItem(item, saved.includes(item.id) ? "从片单移除" : "加入片单", () => toggleSaved(item))} onSave={toggleSaved} />)}
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 px-6 text-center">
            <FilmIcon className="size-6 text-muted-foreground" /><p className="text-sm font-medium">没有找到符合条件的作品</p><p className="text-xs text-muted-foreground">试试移除部分筛选条件，或换一个来源。</p><Button variant="outline" size="sm" onClick={() => { resetFilters(); clearSearch() }}>清空筛选</Button>
          </div>
        )}
      </>}

      <Sheet open={selectedPerson !== null} onOpenChange={(open) => { if (!open) setSelectedPerson(null) }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {selectedPerson && <>
            <SheetHeader>
              <SheetTitle>{selectedPerson.name}</SheetTitle>
              <SheetDescription>{selectedPerson.originalName} · {selectedPerson.role} · 模拟人物资料</SheetDescription>
            </SheetHeader>
            <div className="px-4">
              <div className={cn("flex aspect-[3/2] items-end rounded-xl bg-gradient-to-br p-5", selectedPerson.palette)}>
                <span className="text-7xl font-black text-black/35">{selectedPerson.initials}</span>
                <Badge className="ml-auto bg-background/85 text-foreground">人气 {selectedPerson.popularity}</Badge>
              </div>
              <h3 className="mt-5 text-sm font-semibold">代表作品</h3>
              <div className="mt-2 flex flex-col gap-2">
                {sourceItems.filter((item) => selectedPerson.knownFor.includes(item.title)).map((item) => (
                  <button key={item.id} type="button" onClick={() => { setSelectedPerson(null); void openDiscoverItem(item) }} className="flex items-center justify-between rounded-lg border px-3 py-2 text-left hover:bg-muted/60">
                    <span className="min-w-0"><span className="block truncate text-sm font-medium">{item.title}</span><span className="text-xs text-muted-foreground">{item.year} · {item.kind}</span></span>
                    <span className="text-sm tabular-nums text-muted-foreground">★ {item.rating.toFixed(1)}</span>
                  </button>
                ))}
              </div>
            </div>
          </>}
        </SheetContent>
      </Sheet>
    </div>
  )
}
