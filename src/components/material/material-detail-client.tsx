"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Trash2Icon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  deleteMaterialAction,
  updateMaterialAction,
  type MaterialDetail,
} from "@/actions/material"
import {
  createMaterialQuickSchema,
  type CreateMaterialQuickInputValues,
  type CreateMaterialQuickValues,
} from "@/components/menu/menu-form-schema"
import { ImageUploader } from "@/components/shared/image-uploader"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getMaterialTransactionTypeLabel,
  getMaterialUnitLabel,
  MATERIAL_UNITS,
} from "@/constants/constants"
import { formatDateTime, formatRupiah } from "@/lib/format"

type MaterialDetailClientProps = {
  material: MaterialDetail
}

export function MaterialDetailClient({ material }: MaterialDetailClientProps) {
  const router = useRouter()
  const [isImageUploading, setIsImageUploading] = useState(false)
  const [isUpdating, startUpdateTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  const form = useForm<CreateMaterialQuickInputValues, undefined, CreateMaterialQuickValues>({
    resolver: zodResolver(createMaterialQuickSchema),
    defaultValues: {
      name: material.name,
      unit: material.unit,
      imageUrl: material.imageUrl ?? "",
    },
  })

  const isBusy = isUpdating || isDeleting || isImageUploading

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Detail Material</h1>
          <p className="text-sm text-zinc-600">Kelola informasi material, relasi menu, dan histori transaksi.</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/dashboard/material">Kembali ke List Material</Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Edit Material</h2>

          <Form {...form}>
            <form
              className="mt-5 space-y-4"
              onSubmit={form.handleSubmit((values) => {
                startUpdateTransition(async () => {
                  const result = await updateMaterialAction(material.id, values)

                  if (!result.success) {
                    toast.error(result.message)
                    return
                  }

                  toast.success(result.message)
                  router.refresh()
                })
              })}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Material</FormLabel>
                    <FormControl>
                      <Input {...field} />
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

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isBusy}>
                  {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  disabled={isBusy}
                  onClick={() => {
                    const isConfirmed = window.confirm(`Hapus material \"${material.name}\"?`)

                    if (!isConfirmed) {
                      return
                    }

                    startDeleteTransition(async () => {
                      const result = await deleteMaterialAction(material.id)

                      if (!result.success) {
                        toast.error(result.message)
                        return
                      }

                      toast.success(result.message)
                      router.push("/dashboard/material")
                    })
                  }}
                >
                  <Trash2Icon className="size-4" />
                  Hapus Material
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-base font-semibold text-zinc-900">Ringkasan</h2>
            <div className="mt-4 space-y-2 text-sm text-zinc-700">
              <p>Nama: {material.name}</p>
              <p>Satuan: {getMaterialUnitLabel(material.unit)}</p>
              <p>Sisa Stok: {material.recordedAmount}</p>
              <p>Harga Beli Rata-rata: {formatRupiah(material.recordedBuyPrice)}</p>
            </div>

            {material.imageUrl ? (
              <div className="relative mt-4 h-48 w-full overflow-hidden rounded-lg border border-zinc-200">
                <Image src={material.imageUrl} alt={material.name} fill className="object-cover" sizes="400px" />
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-base font-semibold text-zinc-900">Menu Terkait</h2>
            <div className="mt-3 space-y-2">
              {material.relatedMenus.length === 0 ? (
                <p className="text-sm text-zinc-500">Belum digunakan pada menu mana pun.</p>
              ) : (
                material.relatedMenus.map((menu) => (
                  <Link
                    key={menu.id}
                    href={`/dashboard/menu/${menu.id}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
                  >
                    <span className="font-medium text-zinc-800">{menu.name}</span>
                    <span className="text-zinc-600">{formatRupiah(menu.price)}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Riwayat Transaksi Material</h2>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {material.transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-zinc-500">
                    Belum ada transaksi.
                  </TableCell>
                </TableRow>
              ) : (
                material.transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDateTime(transaction.createdAt)}</TableCell>
                    <TableCell>{getMaterialTransactionTypeLabel(transaction.type)}</TableCell>
                    <TableCell>{transaction.amount}</TableCell>
                    <TableCell>{transaction.invoiceNumber ?? "-"}</TableCell>
                    <TableCell>{transaction.orderId ?? "-"}</TableCell>
                    <TableCell>{transaction.note ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
