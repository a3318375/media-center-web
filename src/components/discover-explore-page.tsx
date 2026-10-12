import { useEffect, useRef, useState } from "react"
import { StarIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useMediaDetail } from "@/components/media-detail-context"
import { mediaApi, type DiscoverResponse } from "@/lib/media-api"
import type { MediaSummary } from "@/lib/media-contract"

import { formatResultTotal } from "@/lib/media-presentation"

const commonGenres: [string, number][] = [
  ["动画", 16],
  ["喜剧", 35],
  ["犯罪", 80],
  ["纪录", 99],
  ["剧情", 18],
  ["家庭", 10751],
  ["悬疑", 9648],
  ["西部", 37],
]
const movieGenres: [string, number][] = [
  ["动作", 28],
  ["冒险", 12],
  ["奇幻", 14],
  ["历史", 36],
  ["恐怖", 27],
  ["音乐", 10402],
  ["爱情", 10749],
  ["科幻", 878],
  ["惊悚", 53],
  ["战争", 10752],
]
const tvGenres: [string, number][] = [
  ["动作冒险", 10759],
  ["科幻奇幻", 10765],
  ["儿童", 10762],
  ["新闻", 10763],
  ["真人秀", 10764],
  ["肥皂剧", 10766],
  ["脱口秀", 10767],
  ["战争政治", 10768],
]
export function DiscoverExplorePage() {
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie")
  const [genre, setGenre] = useState("")
  const [region, setRegion] = useState("")
  const [year, setYear] = useState("")
  const [sort, setSort] = useState<
    "popularity.desc" | "vote_average.desc" | "date.desc"
  >("popularity.desc")
  const [draft, setDraft] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<DiscoverResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState("")
  const [opening, setOpening] = useState(false)
  const detailRequest = useRef<AbortController | null>(null)
  const openDetail = useMediaDetail()
  useEffect(() => () => detailRequest.current?.abort(), [])
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    void mediaApi
      .discover(
        {
          source: "tmdb",
          mediaType,
          genre: query ? undefined : genre || undefined,
          region: query ? undefined : region || undefined,
          year: year ? Number(year) : undefined,
          sort: query ? undefined : sort,
          query: query || undefined,
          page,
          pageSize: 20,
        },
        controller.signal
      )
      .then((data) => {
        if (active) setResult(data)
      })
      .catch((error: unknown) => {
        if (active) {
          setResult(null)
          setNotice(error instanceof Error ? error.message : "读取失败")
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [mediaType, genre, region, year, sort, query, page, revision])
  function changed() {
    setPage(1)
    setResult(null)
    setNotice("")
    setLoading(true)
    detailRequest.current?.abort()
    setOpening(false)
  }
  async function open(item: MediaSummary) {
    detailRequest.current?.abort()
    const controller = new AbortController()
    detailRequest.current = controller
    setOpening(true)
    setNotice("")
    try {
      const detail = await mediaApi.detail(
        item.provider,
        item.providerId,
        item.mediaType,
        controller.signal
      )
      if (!controller.signal.aborted)
        openDetail({
          ...detail,
          sourceLabel: "TMDB",
          kind: detail.mediaType === "movie" ? "电影" : "剧集",
          summary: detail.overview,
          rating: detail.ratings[0]?.value,
        })
    } catch (error) {
      if (!controller.signal.aborted)
        setNotice(error instanceof Error ? error.message : "详情读取失败")
    } finally {
      if (!controller.signal.aborted) setOpening(false)
    }
  }
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">TMDB 电影与电视剧探索</p>
        <Badge variant="outline">TMDB</Badge>
      </div>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <label className="text-sm">
            媒体类型{" "}
            <select
              aria-label="媒体类型"
              value={mediaType}
              onChange={(e) => {
                changed()
                setMediaType(e.target.value as "movie" | "tv")
                setGenre("")
              }}
              className="rounded border p-2"
            >
              <option value="movie">电影</option>
              <option value="tv">电视剧</option>
            </select>
          </label>
          <label className="text-sm">
            类型{" "}
            <select
              aria-label="类型"
              disabled={Boolean(query)}
              value={genre}
              onChange={(e) => {
                changed()
                setGenre(e.target.value)
              }}
              className="rounded border p-2"
            >
              <option value="">全部</option>
              {[
                ...commonGenres,
                ...(mediaType === "movie" ? movieGenres : tvGenres),
              ].map(([name, id]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            产地{" "}
            <select
              aria-label="产地"
              disabled={Boolean(query)}
              value={region}
              onChange={(e) => {
                changed()
                setRegion(e.target.value)
              }}
              className="rounded border p-2"
            >
              <option value="">全部</option>
              {[
                ["CN", "大陆"],
                ["HK", "香港"],
                ["TW", "台湾"],
                ["JP", "日本"],
                ["KR", "韩国"],
                ["US", "美国"],
                ["GB", "英国"],
              ].map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            年份{" "}
            <select
              aria-label="年份"
              value={year}
              onChange={(e) => {
                changed()
                setYear(e.target.value)
              }}
              className="rounded border p-2"
            >
              <option value="">全部</option>
              {Array.from(
                { length: 30 },
                (_, i) => new Date().getFullYear() - i
              ).map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            排序{" "}
            <select
              aria-label="排序"
              disabled={Boolean(query)}
              value={sort}
              onChange={(e) => {
                changed()
                setSort(
                  e.target.value as
                    "popularity.desc" | "vote_average.desc" | "date.desc"
                )
              }}
              className="rounded border p-2"
            >
              <option value="popularity.desc">热度</option>
              <option value="date.desc">最新</option>
              <option value="vote_average.desc">TMDB 评分</option>
            </select>
          </label>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              changed()
              setQuery(draft.trim())
              setRevision((v) => v + 1)
            }}
          >
            <Input
              aria-label="搜索作品"
              placeholder="搜索标题"
              value={draft}
              maxLength={200}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="submit">搜索</Button>
          </form>
          <Button
            variant="outline"
            onClick={() => {
              changed()
              setQuery("")
              setDraft("")
              setGenre("")
              setRegion("")
              setYear("")
              setSort("popularity.desc")
              setRevision((v) => v + 1)
            }}
          >
            重置
          </Button>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => {
              changed()
              setRevision((v) => v + 1)
            }}
          >
            重新加载
          </Button>
        </CardContent>
      </Card>
      {query && (
        <p className="text-xs text-muted-foreground">
          标题搜索仅支持媒体类型和年份；清空搜索后可使用其他筛选。
        </p>
      )}
      {notice && (
        <Alert variant="destructive">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      {(loading || (!result && !notice)) && <p role="status">正在读取 TMDB…</p>}
      {opening && <p role="status">正在读取详情…</p>}
      {result && (
        <>
          <p className="text-xs text-muted-foreground">
            第 {result.page} 页
            {formatResultTotal(result.total)}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {result.items.map((item) => (
              <Card key={item.mediaId} className="overflow-hidden p-0">
                <button
                  disabled={opening}
                  aria-label={`查看《${item.title}》详情`}
                  className="text-left"
                  onClick={() => void open(item)}
                >
                  <div className="relative flex aspect-[2/3] items-center justify-center bg-muted">
                    {item.posterPath ? (
                      <img
                        loading="lazy"
                        src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
                        alt={item.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="p-4 text-muted-foreground">
                        暂无海报
                      </span>
                    )}
                    <Badge className="absolute top-2 right-2 gap-1">
                      <StarIcon className="size-3" />
                      {item.ratings[0]?.value.toFixed(1) ?? "暂无评分"}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <p className="truncate text-sm font-semibold">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.year ?? "年份未知"} ·{" "}
                      {mediaType === "movie" ? "电影" : "剧集"}
                    </p>
                  </CardContent>
                </button>
              </Card>
            ))}
          </div>
          {result.items.length === 0 && <p>没有符合条件的作品。</p>}
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              disabled={loading || page <= 1}
              onClick={() => {
                setLoading(true)
                setResult(null)
                setPage((p) => p - 1)
              }}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              disabled={loading || !result.hasMore}
              onClick={() => {
                setLoading(true)
                setResult(null)
                setPage((p) => p + 1)
              }}
            >
              下一页
            </Button>
          </div>
        </>
      )}
      <p className="text-xs text-muted-foreground">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
    </div>
  )
}
