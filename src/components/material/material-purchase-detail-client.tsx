"use client"

import { useMemo, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import {
  deleteMaterialPurchaseAction,
  updateMaterialPurchaseAction,
  type MaterialOption,
  type MaterialPurchaseDetail,
} from "@/actions/material"
import {
  materialPurchaseFormSchema,
  type MaterialPurchaseFormInputValues,
  type MaterialPurchaseFormValues,
} from "@/components/material/material-inventory-form-schema"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { getMaterialUnitLabel } from "@/constants/constants"
import { formatDateTime, formatRupiah } from "@/lib/format"

type MaterialPurchaseDetailClientProps = {
  purchase: MaterialPurchaseDetail
  materials: MaterialOption[]
}

export function MaterialPurchaseDetailClient({ purchase, materials }: MaterialPurchaseDetailClientProps) {
  const router = useRouter()
  const [isSaving, startSaveTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  const form = useForm<MaterialPurchaseFormInputValues, undefined, MaterialPurchaseFormValues>({
    resolver: zodResolver(materialPurchaseFormSchema),
    defaultValues: {
      invoiceNumber: purchase.invoiceNumber,
      note: purchase.note ?? "",
      items: purchase.items.map((item) => ({
        materialId: item.materialId,
        amount: item.amount,
        total: item.total,
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const watchedItems = useWatch({
    control: form.control,
    name: "items",
  })

  const recalculatedTotal = useMemo(() => {
    return (watchedItems ?? []).reduce((totalAmount, item) => {
      const total = Number.isFinite(item.total) ? item.total : 0
      return totalAmount + total
    }, 0)
  }, [watchedItems])

  const isBusy = isSaving || isDeleting

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Detail Pembelian Material</h1>
          <p className="text-sm text-zinc-600">Edit item pembelian material dan pastikan stok ter-refresh otomatis.</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/dashboard/material/purchase">Kembali ke List Pembelian</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Informasi Dokumen</h2>

        <div className="mt-4 rounded-lg border border-zinc-200">
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-sm">
            <span className="text-zinc-500">ID</span>
            <span className="font-medium text-zinc-900">#{purchase.id}</span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-sm">
            <span className="text-zinc-500">Dibuat</span>
            <span className="font-medium text-zinc-900">{formatDateTime(purchase.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-sm">
            <span className="text-zinc-500">Update Terakhir</span>
            <span className="font-medium text-zinc-900">{formatDateTime(purchase.updatedAt)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-sm">
            <span className="text-zinc-500">Total Saat Ini</span>
            <span className="font-medium text-zinc-900">{formatRupiah(purchase.total)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Edit Pembelian</h2>

        <Form {...form}>
          <form
            className="mt-5 space-y-5"
            onSubmit={form.handleSubmit((values) => {
              startSaveTransition(async () => {
                const result = await updateMaterialPurchaseAction(purchase.id, values)

                if (!result.success) {
                  toast.error(result.message)
                  return
                }

                toast.success(result.message)
                router.refresh()
              })
            })}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Invoice</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Total Kalkulasi Form</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">{formatRupiah(recalculatedTotal)}</p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Catatan pembelian (opsional)"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">Item Pembelian</h3>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    append({
                      materialId: materials[0]?.id ?? 0,
                      amount: 1,
                      total: 0,
                    })
                  }}
                >
                  <PlusIcon className="size-4" />
                  Tambah Item
                </Button>
              </div>

              {fields.map((field, index) => {
                const selectedMaterialId = watchedItems?.[index]?.materialId
                const selectedMaterial = materials.find(
                  (material) => material.id === selectedMaterialId
                )

                return (
                  <div key={field.id} className="rounded-lg border border-zinc-200 p-3">
                    <div className="grid gap-3 md:grid-cols-12">
                      <div className="md:col-span-5">
                        <FormField
                          control={form.control}
                          name={`items.${index}.materialId`}
                          render={({ field: itemField }) => (
                            <FormItem>
                              <FormLabel>Material</FormLabel>
                              <FormControl>
                                <NativeSelect
                                  className="w-full"
                                  value={String(itemField.value)}
                                  onChange={(event) => itemField.onChange(Number(event.target.value))}
                                >
                                  {materials.map((material) => (
                                    <NativeSelectOption key={material.id} value={String(material.id)}>
                                      {material.name} ({getMaterialUnitLabel(material.unit)})
                                    </NativeSelectOption>
                                  ))}
                                </NativeSelect>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <FormField
                          control={form.control}
                          name={`items.${index}.amount`}
                          render={({ field: itemField }) => (
                            <FormItem>
                              <FormLabel>Jumlah</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={itemField.value}
                                  onChange={(event) => itemField.onChange(Number(event.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <FormField
                          control={form.control}
                          name={`items.${index}.total`}
                          render={({ field: itemField }) => (
                            <FormItem>
                              <FormLabel>Total Harga</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="1"
                                  min="0"
                                  value={itemField.value}
                                  onChange={(event) => itemField.onChange(Number(event.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="md:col-span-1 flex items-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          disabled={fields.length <= 1}
                          onClick={() => remove(index)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-zinc-500">
                      Satuan: {selectedMaterial ? getMaterialUnitLabel(selectedMaterial.unit) : "-"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Contoh: isi jumlah 10000 ml dan total harga Rp 10000.
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isBusy}>
                Simpan Perubahan
              </Button>

              <Button
                type="button"
                variant="destructive"
                disabled={isBusy}
                onClick={() => {
                  const isConfirmed = window.confirm(
                    `Hapus pembelian dengan invoice \"${purchase.invoiceNumber}\"?`
                  )

                  if (!isConfirmed) {
                    return
                  }

                  startDeleteTransition(async () => {
                    const result = await deleteMaterialPurchaseAction(purchase.id)

                    if (!result.success) {
                      toast.error(result.message)
                      return
                    }

                    toast.success(result.message)
                    router.push("/dashboard/material/purchase")
                  })
                }}
              >
                <Trash2Icon className="size-4" />
                Hapus Pembelian
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
