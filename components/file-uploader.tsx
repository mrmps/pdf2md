"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { AlertCircle, File as FileIcon, Upload, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { ConversionResult } from "@/lib/batch-types"

interface FileUploaderProps {
  onConversionComplete: (results: ConversionResult[]) => void
  onBatchStart: () => void
  isConverting: boolean
  setIsConverting: (isConverting: boolean) => void
}

type FileStatus = "Ready" | "Queued" | "Converting" | "Converted" | "Failed"
interface SelectedFile {
  id: string
  file: File
  status: FileStatus
  error?: string
}

export function FileUploader({
  onConversionComplete,
  onBatchStart,
  isConverting,
  setIsConverting
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const convertingRef = useRef(false)
  const mountedRef = useRef(true)
  const nextIdRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const addFiles = (files: FileList) => {
    if (convertingRef.current || isConverting) return
    const accepted: SelectedFile[] = []
    const rejected: string[] = []
    for (const file of Array.from(files)) {
      if (
        file.type !== "application/pdf" &&
        !(file.type === "" && /\.pdf$/i.test(file.name))
      ) {
        rejected.push(`${file.name}: Please select a PDF file.`)
      } else if (file.size > 10 * 1024 * 1024) {
        rejected.push(`${file.name}: File size exceeds the 10 MB limit.`)
      } else {
        accepted.push({
          id: `${Date.now()}-${++nextIdRef.current}`,
          file,
          status: "Ready"
        })
      }
    }
    setErrors(rejected)
    if (accepted.length) {
      setSelectedFiles((previous) => [...previous, ...accepted])
      setCompletedCount(0)
    }
  }

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (convertingRef.current || isConverting) return
    setDragActive(event.type === "dragenter" || event.type === "dragover")
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
    addFiles(event.dataTransfer.files)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files)
    event.target.value = ""
  }

  const removeFile = (id: string) => {
    if (convertingRef.current || isConverting) return
    setSelectedFiles((previous) => previous.filter((entry) => entry.id !== id))
    setCompletedCount(0)
  }

  const handleConvert = async () => {
    if (convertingRef.current || isConverting || !selectedFiles.length) return
    convertingRef.current = true
    const batch = [...selectedFiles]
    const results: ConversionResult[] = []
    setIsConverting(true)
    setErrors([])
    setDragActive(false)
    setCompletedCount(0)
    setSelectedFiles((previous) =>
      previous.map((entry) => ({
        ...entry,
        status: "Queued",
        error: undefined
      }))
    )

    const updateFile = (id: string, status: FileStatus, error?: string) => {
      if (mountedRef.current) {
        setSelectedFiles((previous) =>
          previous.map((entry) =>
            entry.id === id ? { ...entry, status, error } : entry
          )
        )
      }
    }

    try {
      onBatchStart()
      let convert: ((buffer: ArrayBuffer) => Promise<string>) | undefined
      let loadError: string | undefined
      try {
        const pdf2mdModule = await import("@opendocsg/pdf2md")
        convert = pdf2mdModule.default
      } catch {
        loadError = "Failed to load the conversion library. Please try again."
      }

      for (const entry of batch) {
        if (!mountedRef.current) break
        updateFile(entry.id, "Converting")
        try {
          if (!convert) throw new Error(loadError)
          const markdown = await convert(await entry.file.arrayBuffer())
          if (typeof markdown !== "string")
            throw new Error("The converter returned an invalid result.")
          results.push({
            id: entry.id,
            fileName: entry.file.name,
            markdown,
            error: null
          })
          updateFile(entry.id, "Converted")
        } catch {
          const message =
            loadError ??
            "Failed to convert this PDF. It may be corrupted or unsupported."
          results.push({
            id: entry.id,
            fileName: entry.file.name,
            markdown: null,
            error: message
          })
          updateFile(entry.id, "Failed", message)
        }
        if (mountedRef.current) setCompletedCount(results.length)
      }
      if (mountedRef.current) onConversionComplete(results)
    } catch {
      if (mountedRef.current)
        setErrors(["The batch could not be completed. Please try again."])
    } finally {
      convertingRef.current = false
      setIsConverting(false)
    }
  }

  return (
    <>
      {errors.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      <div
        className={`relative rounded-lg border border-dashed p-8 text-center transition-colors ${dragActive ? "border-foreground/30 bg-muted/50" : "border-border hover:border-foreground/20 hover:bg-muted/30"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        aria-busy={isConverting}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="rounded-full bg-muted p-2.5">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-foreground">
              Drop your PDFs here
            </p>
            <p className="text-sm text-muted-foreground">
              Select multiple files, up to 10 MB each
            </p>
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isConverting}
              className="h-8 px-3 text-sm"
            >
              Select PDFs
            </Button>
            {selectedFiles.length > 0 && (
              <Button
                size="sm"
                onClick={handleConvert}
                disabled={isConverting}
                className="h-8 px-3 text-sm"
              >
                Convert {selectedFiles.length}{" "}
                {selectedFiles.length === 1 ? "PDF" : "PDFs"}
              </Button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            disabled={isConverting}
            className="hidden"
            onChange={handleChange}
            aria-label="Select PDF files"
          />
        </div>
      </div>
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            {selectedFiles.length}{" "}
            {selectedFiles.length === 1 ? "file" : "files"} selected
          </p>
          <ul className="space-y-2">
            {selectedFiles.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-2 rounded-md border border-border p-3 text-sm"
              >
                <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1 text-left">
                  <p className="break-words font-medium">{entry.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(entry.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {entry.error && (
                    <p className="mt-1 text-xs text-destructive">
                      {entry.error}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs ${entry.status === "Failed" ? "text-destructive" : "text-muted-foreground"}`}
                  aria-live="polite"
                >
                  {entry.status}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => removeFile(entry.id)}
                  disabled={isConverting}
                  aria-label={`Remove ${entry.file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
          {isConverting && (
            <div aria-live="polite">
              <Progress
                value={(completedCount / selectedFiles.length) * 100}
                className="h-1.5"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Completed {completedCount} of {selectedFiles.length} files (
                {Math.round((completedCount / selectedFiles.length) * 100)}%)
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
