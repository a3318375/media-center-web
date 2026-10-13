import assert from "node:assert/strict"
import test from "node:test"
import {
  chooseSearchSource,
  readResourceSearchHistory,
  RESOURCE_SEARCH_HISTORY_KEY,
  saveResourceSearchHistory,
} from "../src/lib/resource-search.ts"

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

test("首轮与后续轮次按 PanSou 规则选择来源", () => {
  assert.equal(chooseSearchSource(["tg"], ["plugin"], true), "tg")
  assert.equal(chooseSearchSource([], ["plugin"], true), "plugin")
  assert.equal(chooseSearchSource([], [], true), "all")
  assert.equal(chooseSearchSource(["tg"], ["plugin"]), "all")
  assert.equal(chooseSearchSource(["tg"], []), "tg")
})

test("历史记录损坏回空，保存时同关键词置顶并最多保留 20 条", () => {
  const storage = memoryStorage()
  storage.setItem(RESOURCE_SEARCH_HISTORY_KEY, "not-json")
  assert.deepEqual(readResourceSearchHistory(storage), [])
  const entry = (keyword: string) => ({
    keyword,
    source: "all",
    mode: "merge",
    cloudTypes: [],
    plugins: [],
    channels: [],
    at: 1,
  })
  for (let index = 0; index < 21; index += 1)
    saveResourceSearchHistory(storage, entry(`电影${index}`))
  const next = saveResourceSearchHistory(storage, entry("电影10"))
  assert.equal(next.length, 20)
  assert.equal(next[0].keyword, "电影10")
  assert.equal(next.filter((item) => item.keyword === "电影10").length, 1)
})
