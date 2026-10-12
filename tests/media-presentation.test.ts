import assert from "node:assert/strict"
import test from "node:test"
import { formatRegion, formatResultTotal } from "../src/lib/media-presentation.ts"

test("地区中文映射、多国、空值及未知代码回退", () => {
  assert.equal(formatRegion(["CN", "HK", "TW", "JP", "KR", "US", "GB"]), "大陆、香港、台湾、日本、韩国、美国、英国")
  assert.equal(formatRegion(["US", "ZZ"]), "美国、ZZ")
  assert.equal(formatRegion([], "US,GB"), "美国、英国")
  assert.equal(formatRegion(undefined, "大陆"), "大陆")
  assert.equal(formatRegion([]), "")
  assert.equal(formatRegion(), "")
})

test("总量达到 20001 即标注上游上限", () => {
  assert.equal(formatResultTotal(null), "")
  assert.equal(formatResultTotal(0), " · 共 0 部作品")
  assert.equal(formatResultTotal(20000), " · 共 20000 部作品")
  assert.equal(formatResultTotal(20001), " · 共 20001+ 部作品（上游上限）")
  assert.equal(formatResultTotal(20002), " · 共 20002+ 部作品（上游上限）")
})
