const countryNames: Record<string, string> = {
  CN: "大陆", HK: "香港", TW: "台湾", JP: "日本", KR: "韩国", US: "美国", GB: "英国",
}

export function formatRegion(countries?: string[], region?: string): string {
  const codes = countries?.length ? countries : (region ?? "").split(",")
  return codes.map((code) => code.trim()).filter(Boolean)
    .map((code) => countryNames[code] ?? code).join("、")
}

// TMDB total_results >= 20001 indicates the upstream cap, not an exact count.
export function formatResultTotal(total: number | null): string {
  if (total === null) return ""
  return total >= 20001
    ? ` · 共 ${total}+ 部作品（上游上限）`
    : ` · 共 ${total} 部作品`
}
