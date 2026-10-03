import { strToU8, zipSync } from "fflate"
import type { ConversionResult } from "@/lib/batch-types"

export interface MarkdownDownload {
  id: string
  fileName: string
  markdown: string
}

function safeStem(fileName: string): string {
  const stem = fileName
    .normalize("NFC")
    .replace(/\.pdf$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "_")
    .replace(/^[. ]+|[. ]+$/g, "")
  // Leave room for duplicate suffixes under common filesystem byte limits.
  // Iterate characters to avoid cutting a Unicode surrogate pair in half.
  let shortened = ""
  let bytes = 0
  for (const character of stem) {
    const characterBytes = strToU8(character).length
    if (bytes + characterBytes > 180) break
    shortened += character
    bytes += characterBytes
  }
  shortened ||= "document"
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(shortened)
    ? `_${shortened}`
    : shortened
}

export function getMarkdownDownloads(
  results: ConversionResult[]
): MarkdownDownload[] {
  const usedNames = new Set<string>()
  return results.flatMap((result) => {
    if (result.markdown === null || result.error !== null) return []
    const stem = safeStem(result.fileName)
    let fileName = `${stem}.md`
    let suffix = 2
    while (usedNames.has(fileName.toLowerCase())) {
      fileName = `${stem} (${suffix++}).md`
    }
    usedNames.add(fileName.toLowerCase())
    return [{ id: result.id, fileName, markdown: result.markdown }]
  })
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  try {
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
  } finally {
    anchor.remove()
    // Give the browser time to start reading the Blob before releasing its URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

export function downloadMarkdown(download: MarkdownDownload) {
  downloadBlob(
    new Blob([download.markdown], { type: "text/markdown;charset=utf-8" }),
    download.fileName
  )
}

export function createMarkdownZip(downloads: MarkdownDownload[]): Uint8Array {
  if (downloads.length === 0)
    throw new Error("No converted files are available to download.")
  const entries: Record<string, Uint8Array> = Object.create(null)
  for (const download of downloads)
    entries[download.fileName] = strToU8(download.markdown)
  return zipSync(entries)
}

export function downloadMarkdownZip(downloads: MarkdownDownload[]) {
  const archive = createMarkdownZip(downloads)
  downloadBlob(
    new Blob([new Uint8Array(archive)], { type: "application/zip" }),
    "converted-markdown.zip"
  )
}
