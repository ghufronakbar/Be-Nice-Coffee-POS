"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  createMaterialQuickSchema,
  type CreateMaterialQuickInputValues,
  type CreateMaterialQuickValues,
} from "@/components/menu/menu-form-schema"
import { ImageUploader } from "@/components/shared/image-uploader"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { MATERIAL_UNITS } from "@/constants/constants"

type MaterialFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  submitLabel: string
  initialValues?: CreateMaterialQuickInputValues
  onSubmit: (values: CreateMaterialQuickValues) => Promise<void>
  disabled?: boolean
}

export function MaterialFormModal({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValues,
  onSubmit,
  disabled = false,
}: MaterialFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isImageUploading, setIsImageUploading] = useState(false)

  const form = useForm<CreateMaterialQuickInputValues, undefined, CreateMaterialQuickValues>({
    resolver: zodResolver(createMaterialQuickSchema),
    defaultValues: initialValues ?? {
      name: "",
      unit: "GRAM",
      imageUrl: "",
    },
  })

  const isBusy = isSubmitting || isImageUploading || disabled

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)

        if (!nextOpen) {
          form.reset(initialValues ?? { name: "", unit: "GRAM", imageUrl: "" })
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              setIsSubmitting(true)
              try {
                await onSubmit(values)
              } finally {
                setIsSubmitting(false)
              }
            })}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Material</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Susu UHT" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Satuan</FormLabel>
                  <FormControl>
                    <NativeSelect
                      className="w-full"
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                    >
                      {MATERIAL_UNITS.map((unitOption) => (
                        <NativeSelectOption key={unitOption.value} value={unitOption.value}>
                          {unitOption.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gambar Material</FormLabel>
                  <FormControl>
                    <div>
                      <ImageUploader
                        value={field.value}
                        onChange={(url) => field.onChange(url)}
                        onUploadingChange={setIsImageUploading}
                        disabled={isBusy}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isBusy}>
              {isSubmitting ? "Menyimpan..." : submitLabel}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
