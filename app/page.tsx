"use client"

import { useEffect, useRef, useState } from "react"
import { FileUploader } from "@/components/file-uploader"
import { MarkdownPreview } from "@/components/markdown-preview"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Code, Download, Copy, Check } from "lucide-react"
import { FaqSection } from "@/components/faq-section"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GitHubStarButton } from "@/components/github-star-button"
import type { ConversionResult } from "@/lib/batch-types"
import {
  downloadMarkdown,
  downloadMarkdownZip,
  getMarkdownDownloads,
  type MarkdownDownload
} from "@/lib/markdown-download"

export default function Home() {
  const [results, setResults] = useState<ConversionResult[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const downloads = getMarkdownDownloads(results)
  const selectedResult = results.find((result) => result.id === selectedId)
  const markdown = selectedResult?.markdown ?? null
  const fileName = selectedResult?.fileName ?? null
  const selectedDownload = downloads.find(
    (download) => download.id === selectedId
  )

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current)
    },
    []
  )

  const resetActions = () => {
    if (copyTimer.current) clearTimeout(copyTimer.current)
    setCopied(false)
    setActionError(null)
  }

  const handleCopy = async () => {
    if (markdown === null) return
    setActionError(null)
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setActionError(
        "Unable to copy Markdown. You can select and copy the text in the Markdown tab."
      )
    }
  }

  const handleDownload = (download: MarkdownDownload) => {
    setActionError(null)
    try {
      downloadMarkdown(download)
    } catch {
      setActionError("Unable to download this Markdown file. Please try again.")
    }
  }

  const handleDownloadAll = () => {
    setActionError(null)
    try {
      downloadMarkdownZip(downloads)
    } catch {
      setActionError(
        "Unable to create or download the ZIP archive. Try downloading files individually."
      )
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-16 px-4 max-w-3xl">
        {/* Header */}
        <header className="mb-16">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center px-3 py-1 mb-6 rounded-full text-xs font-medium text-muted-foreground border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
              Browser-based conversion
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-3">
              PDF to Markdown
            </h1>

            <p className="text-base text-muted-foreground max-w-md mb-8">
              Convert PDF documents to clean Markdown. Files are processed
              locally in your browser.
            </p>

            <div className="flex items-center gap-3">
              <Button
                className="h-9 px-4 text-sm font-medium"
                onClick={() => {
                  document
                    .querySelector("#file-uploader")
                    ?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                Convert PDF
              </Button>
              <GitHubStarButton />
            </div>
          </div>
        </header>

        {/* File Uploader */}
        <section className="mb-12" id="file-uploader">
          <FileUploader
            onBatchStart={() => {
              setResults([])
              setSelectedId(null)
              resetActions()
            }}
            onConversionComplete={(batchResults) => {
              setResults(batchResults)
              setSelectedId(
                batchResults.find(
                  (result) => result.markdown !== null && result.error === null
                )?.id ?? null
              )
              resetActions()
            }}
            isConverting={isConverting}
            setIsConverting={setIsConverting}
          />
        </section>

        {/* Result */}
        {results.length > 0 && (
          <section className="mb-8" aria-label="Conversion results">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-medium text-foreground">
                  Batch results
                </h2>
                <p className="text-sm text-muted-foreground" role="status">
                  {downloads.length} of {results.length} files converted
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleDownloadAll}
                disabled={downloads.length === 0}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download all (.zip)
              </Button>
            </div>
            <ul className="rounded-lg border border-border divide-y divide-border overflow-hidden">
              {results.map((result) => {
                const download = downloads.find(
                  (entry) => entry.id === result.id
                )
                return (
                  <li
                    key={result.id}
                    className={`flex flex-wrap items-center gap-3 p-4 ${selectedId === result.id ? "bg-muted/50" : "bg-card"}`}
                  >
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="text-sm font-medium break-all">
                        {result.fileName}
                      </p>
                      {download ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          Converted
                          {result.markdown === "" ? " · Empty Markdown" : ""}
                        </p>
                      ) : (
                        <p className="text-sm text-destructive mt-1 break-words">
                          {result.error ??
                            "Conversion did not produce Markdown."}
                        </p>
                      )}
                    </div>
                    {download && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          aria-pressed={selectedId === result.id}
                          aria-label={`Preview ${result.fileName}`}
                          onClick={() => {
                            setSelectedId(result.id)
                            resetActions()
                          }}
                        >
                          {selectedId === result.id ? "Selected" : "Preview"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Download ${result.fileName} as Markdown`}
                          onClick={() => handleDownload(download)}
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" /> .md
                        </Button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {actionError && (
          <p role="alert" className="mb-6 text-sm text-destructive">
            {actionError}
          </p>
        )}

        {markdown !== null && selectedDownload && (
          <section className="mb-16">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <div className="min-w-0">
                <h2 className="text-lg font-medium text-foreground">Result</h2>
                <p className="text-sm text-muted-foreground break-all">
                  {fileName?.replace(/\.pdf$/i, "")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-3 text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDownload(selectedDownload)}
                  className="h-8 px-3 text-sm"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="flex h-10 items-center gap-1 px-3 border-b border-border bg-muted/30 rounded-none justify-start">
                  <TabsTrigger
                    value="preview"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger
                    value="markdown"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground transition-colors"
                  >
                    <Code className="h-3.5 w-3.5" />
                    Markdown
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="p-5">
                  {markdown === "" ? (
                    <p className="text-sm text-muted-foreground">
                      This PDF produced an empty Markdown file.
                    </p>
                  ) : (
                    <MarkdownPreview markdown={markdown} />
                  )}
                </TabsContent>
                <TabsContent value="markdown">
                  <ScrollArea className="h-[500px] w-full">
                    <div className="p-5">
                      <pre className="text-sm font-mono text-foreground/80 overflow-x-auto">
                        <code className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                          {markdown}
                        </code>
                      </pre>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mb-16">
          <FaqSection />
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground border-t border-border pt-8">
          <div className="flex justify-center mb-3">
            <GitHubStarButton />
          </div>
          <p>
            Built by{" "}
            <a
              href="https://twitter.com/michael_chomsky"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline underline-offset-4"
            >
              @michael_chomsky
            </a>
          </p>
        </footer>
      </div>
    </main>
  )
}
