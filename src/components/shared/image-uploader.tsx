"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ImageIcon, Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

type ImageUploaderProps = {
  value?: string | null
  onChange: (nextValue: string) => void
  onUploadingChange?: (uploading: boolean) => void
  disabled?: boolean
}

export function ImageUploader({
  value,
  onChange,
  onUploadingChange,
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const setUploadingState = (uploading: boolean) => {
    setIsUploading(uploading)
    onUploadingChange?.(uploading)
  }

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    setErrorMessage(null)
    setUploadingState(true)

    try {
      const response = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      })

      const payload = (await response.json()) as {
        url?: string
        message?: string
      }

      if (!response.ok || !payload.url) {
        throw new Error(payload.message ?? "Gagal mengunggah gambar")
      }

      onChange(payload.url)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal mengunggah gambar")
    } finally {
      setUploadingState(false)
    }
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative h-44 w-full overflow-hidden rounded-lg border border-zinc-200">
          <Image src={value} alt="Preview" fill className="object-cover" sizes="(max-width: 768px) 100vw, 500px" />
        </div>
      ) : (
        <div className="flex h-44 w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50">
          <ImageIcon className="size-7 text-zinc-400" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) {
              return
            }

            void handleUpload(file)
            event.target.value = ""
          }}
          disabled={disabled || isUploading}
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {isUploading ? <Loader2Icon className="size-4 animate-spin" /> : <UploadIcon className="size-4" />}
          {isUploading ? "Mengunggah..." : "Upload Gambar"}
        </Button>

        {value ? (
          <Button type="button" variant="destructive" onClick={() => onChange("")} disabled={disabled || isUploading}>
            <Trash2Icon className="size-4" />
            Hapus
          </Button>
        ) : null}
      </div>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
    </div>
  )
}
