"use client"

import { useMemo, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import {
  createMaterialPurchaseAction,
  type MaterialOption,
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
import { formatRupiah } from "@/lib/format"

type MaterialPurchaseCreateClientProps = {
  materials: MaterialOption[]
}

export function MaterialPurchaseCreateClient({ materials }: MaterialPurchaseCreateClientProps) {
  const router = useRouter()
  const [isSaving, startSaveTransition] = useTransition()

  const form = useForm<MaterialPurchaseFormInputValues, undefined, MaterialPurchaseFormValues>({
    resolver: zodResolver(materialPurchaseFormSchema),
    defaultValues: {
      invoiceNumber: "",
      note: "",
      items: [
        {
          materialId: materials[0]?.id ?? 0,
          amount: 1,
          total: 0,
        },
      ],
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Tambah Pembelian Material</h1>
          <p className="text-sm text-zinc-600">Catat pembelian material dan update stok secara otomatis.</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/dashboard/material/purchase">Kembali ke List Pembelian</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Data Pembelian</h2>

        {materials.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600">
            Tambah material terlebih dahulu sebelum mencatat pembelian.
          </p>
        ) : (
          <Form {...form}>
            <form
              className="mt-5 space-y-5"
              onSubmit={form.handleSubmit((values) => {
                startSaveTransition(async () => {
                  const result = await createMaterialPurchaseAction(values)

                  if (!result.success) {
                    toast.error(result.message)
                    return
                  }

                  toast.success(result.message)

                  if (result.purchaseId) {
                    router.push(`/dashboard/material/purchase/${result.purchaseId}`)
                    return
                  }

                  router.push("/dashboard/material/purchase")
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
                        <Input placeholder="Contoh: INV-001" {...field} />
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

                        <div className="flex items-end md:col-span-1">
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

              <Button type="submit" disabled={isSaving}>
                Simpan Pembelian
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  )
}
