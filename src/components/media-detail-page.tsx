import { ArrowLeftIcon, PlayIcon, StarIcon } from "lucide-react"
import { cn } from "cn"
import type { MediaDetailRecord } from "@/components/media-detail-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sampleCast = [
  { name: "林知夏", role: "主要角色" },
  { name: "周予安", role: "主要角色" },
  { name: "陈以南", role: "配音" },
  { name: "顾明川", role: "特别出演" },
]

export function MediaDetailPage({ media, onBack }: { media: MediaDetailRecord; onBack: () => void }) {
  const isSeries = media.kind !== "电影" && media.kind !== "纪录片"
  const titleArt = media.artwork ?? media.title
  const rating = media.rating ?? "—"
  const source = media.source ?? "媒体库"
  const summary = media.summary ?? "暂无简介。这里展示的是本地模拟的作品资料，后续可由对应数据源补充。"

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6 lg:p-7">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeftIcon data-icon="inline-start" />返回列表</Button>
        <span className="truncate">{source} / 作品详情</span>
      </div>

      <section className={cn("relative isolate overflow-hidden rounded-3xl border bg-gradient-to-br p-5 text-white shadow-lg sm:p-8 lg:min-h-72 lg:p-10", media.palette ?? "from-indigo-950 via-slate-900 to-blue-950")}>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/55 to-black/20" />
        <div className="absolute -right-12 top-0 -z-10 size-80 rounded-full border-[36px] border-white/5" />
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
          <div className="relative flex aspect-[2/3] w-36 shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br p-4 shadow-2xl sm:w-44 lg:w-48">
            <div className="absolute -right-8 -top-8 size-32 rounded-full border-[18px] border-white/10" />
            <Badge className="relative w-fit bg-black/35 text-white">{media.kind}</Badge>
            <p className="relative whitespace-pre-line text-2xl font-black leading-tight sm:text-3xl">{titleArt}</p>
            <span className="relative text-[10px] uppercase tracking-widest text-white/70">{media.originalTitle ?? "FRAME · MEDIA"}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{source} · {media.kind}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{media.title}{media.year && <span className="ml-3 text-xl font-semibold text-white/70 sm:text-2xl">({media.year})</span>}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1 bg-black/35 text-amber-200"><StarIcon className="size-3 fill-current" />{rating} · 演示评分</Badge>
              {media.region && <Badge variant="secondary" className="bg-black/35 text-white">{media.region}</Badge>}
              {media.year && <Badge variant="secondary" className="bg-black/35 text-white">{media.year}</Badge>}
              {media.status && <Badge variant="secondary" className="bg-black/35 text-white">{media.status}</Badge>}
              {media.episodeInfo && <Badge variant="secondary" className="bg-black/35 text-white">{media.episodeInfo}</Badge>}
            </div>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-white/80">{summary}</p>
            <Button className="mt-5" variant="secondary" onClick={media.onAction ?? (() => undefined)}>
              <PlayIcon data-icon="inline-start" />{media.actionLabel ?? "加入片单"}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(250px,340px)_minmax(0,1fr)]">
        <Card className="border-border/70 shadow-none">
          <CardHeader><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Work profile</p><CardTitle>作品资料</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {[["类型", media.kind], ["原名", media.originalTitle ?? "—"], ["年份", media.year ?? "—"], ["地区", media.region ?? "—"], ["来源", source], ["状态", media.status ?? (isSeries ? "连载信息待补充" : "已发布")]].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 border-b pb-2 last:border-0"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">{(media.genres?.length ? media.genres : ["暂无标签"]).map((genre) => <Badge key={genre} variant="outline">{genre}</Badge>)}</div>
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          <Card className="border-border/70 shadow-none">
            <CardHeader><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Cast</p><CardTitle>主要演职员</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {sampleCast.map((person, index) => <div key={person.name} className="overflow-hidden rounded-xl border bg-card">
                <div className={cn("flex aspect-[4/3] items-center justify-center bg-gradient-to-br text-3xl font-bold text-white", ["from-sky-600 to-indigo-950", "from-rose-500 to-orange-900", "from-violet-600 to-slate-950", "from-emerald-600 to-teal-950"][index])}>{person.name.slice(0, 1)}</div>
                <div className="p-2"><p className="truncate text-xs font-semibold">{person.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{person.role} · 模拟</p></div>
              </div>)}
            </CardContent>
          </Card>

          {isSeries && <Card className="border-border/70 shadow-none">
            <CardHeader><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Seasons</p><CardTitle>季与集</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {(media.episodeInfo ? ["第 1 季", "最近更新"] : ["第 1 季", "第 2 季"]).map((season, index) => <div key={season} className="flex items-center gap-3 rounded-xl border p-3">
                <div className={cn("flex size-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-bold text-white", media.palette ?? "from-indigo-700 to-slate-950")}>{index === 0 ? "S01" : "EP"}</div>
                <div><p className="text-sm font-semibold">{season}</p><p className="mt-1 text-xs text-muted-foreground">{media.episodeInfo ?? "集数信息待补充"}</p></div>
              </div>)}
            </CardContent>
          </Card>}

          <Card className="border-border/70 shadow-none">
            <CardHeader><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Related</p><CardTitle>相关推荐</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">{["同类型作品", "相似题材", "同地区作品"].map((label) => <Badge key={label} variant="secondary" className="px-3 py-1.5">{label} · 演示</Badge>)}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
