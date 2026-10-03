import assert from "node:assert/strict"
import { test } from "node:test"
import { strFromU8, unzipSync } from "fflate"
import type { ConversionResult } from "../lib/batch-types"
import {
  createMarkdownZip,
  getMarkdownDownloads
} from "../lib/markdown-download"

function result(
  id: string,
  fileName: string,
  markdown: string | null = "content",
  error: string | null = null
): ConversionResult {
  return { id, fileName, markdown, error }
}

test("duplicate names preserve every result, including case and suffix collisions", () => {
  const downloads = getMarkdownDownloads([
    result("1", "report.pdf", "first"),
    result("2", "REPORT.PDF", "second"),
    result("3", "report (2).pdf", "third"),
    result("4", "report.pdf", "fourth")
  ])
  assert.equal(
    new Set(downloads.map(({ fileName }) => fileName.toLowerCase())).size,
    4
  )
  assert.deepEqual(
    downloads.map(({ markdown }) => markdown),
    ["first", "second", "third", "fourth"]
  )
})

test("output names are flat, portable and bounded without losing Unicode", () => {
  const downloads = getMarkdownDownloads([
    result("1", "../folder\\report.pdf"),
    result("2", "CON.pdf"),
    result("3", "...pdf"),
    result("4", "Báo cáo.pdf"),
    result("5", `${"😀".repeat(100)}.pdf`),
    result("6", "café.pdf"),
    result("7", "cafe\u0301.pdf")
  ])
  for (const { fileName } of downloads) {
    assert.doesNotMatch(fileName, /[<>:"/\\|?*\u0000-\u001f]/)
    assert.ok(Buffer.byteLength(fileName, "utf8") < 255)
    assert.ok(fileName.endsWith(".md"))
  }
  assert.equal(downloads[1].fileName, "_CON.md")
  assert.equal(downloads[2].fileName, "document.md")
  assert.equal(downloads[3].fileName, "Báo cáo.md")
  assert.equal(downloads[6].fileName, "café (2).md")
})

test("successful empty Markdown remains downloadable while failures are excluded", () => {
  const downloads = getMarkdownDownloads([
    result("empty", "empty.pdf", ""),
    result("failed", "failed.pdf", null, "Corrupted PDF"),
    result("missing", "missing.pdf", null),
    result("errored", "errored.pdf", "partial", "Failed")
  ])
  assert.deepEqual(downloads, [
    { id: "empty", fileName: "empty.md", markdown: "" }
  ])
})

test("ZIP round-trip preserves each filename and UTF-8 Markdown including empty files", () => {
  const downloads = getMarkdownDownloads([
    result("1", "notes.pdf", "# Báo cáo\n\nNội dung 😀"),
    result("2", "notes.pdf", "# Second document"),
    result("3", "empty.pdf", ""),
    result("4", "broken.pdf", null, "Failed")
  ])
  const entries = unzipSync(createMarkdownZip(downloads))
  assert.deepEqual(
    Object.keys(entries).sort(),
    downloads.map(({ fileName }) => fileName).sort()
  )
  for (const download of downloads) {
    assert.equal(strFromU8(entries[download.fileName]), download.markdown)
  }
})

test("a batch without successful results cannot create a ZIP", () => {
  assert.throws(() => createMarkdownZip([]), /No converted files/)
})
