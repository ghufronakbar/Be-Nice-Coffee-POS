"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  createMaterialAdjustmentAction,
  deleteMaterialAdjustmentAction,
  updateMaterialAdjustmentAction,
  type MaterialAdjustmentListRow,
  type MaterialOption,
} from "@/actions/material"
import {
  materialAdjustmentFormSchema,
  type MaterialAdjustmentFormInputValues,
  type MaterialAdjustmentFormValues,
} from "@/components/material/material-inventory-form-schema"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { getMaterialUnitLabel } from "@/constants/constants"
import { formatDateTime } from "@/lib/format"

type MaterialAdjustmentListClientProps = {
  items: MaterialAdjustmentListRow[]
  materials: MaterialOption[]
}

type AdjustmentModalMode = "create" | "edit"

export function MaterialAdjustmentListClient({ items, materials }: MaterialAdjustmentListClientProps) {
  const router = useRouter()
  const [isBusy, startTransition] = useTransition()
  const [modalMode, setModalMode] = useState<AdjustmentModalMode>("create")
  const [editingRow, setEditingRow] = useState<MaterialAdjustmentListRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const form = useForm<MaterialAdjustmentFormInputValues, undefined, MaterialAdjustmentFormValues>({
    resolver: zodResolver(materialAdjustmentFormSchema),
    defaultValues: {
      materialId: materials[0]?.id ?? 0,
      amount: 0,
      note: "",
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          disabled={materials.length === 0}
          onClick={() => {
            setModalMode("create")
            setIsModalOpen(true)
          }}
        >
          <PlusIcon className="size-4" />
          Tambah Penyesuaian
        </Button>
      </div>

      {materials.length === 0 ? (
        <p className="text-sm text-zinc-600">
          Tambah material terlebih dahulu sebelum membuat transaksi penyesuaian.
        </p>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-zinc-500">
                  Belum ada data penyesuaian material.
                </TableCell>
              </TableRow>
            ) : (
              items.map((adjustment) => (
                <TableRow key={adjustment.id}>
                  <TableCell>{formatDateTime(adjustment.createdAt)}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium text-zinc-900">{adjustment.materialName}</p>
                      <p className="text-xs text-zinc-500">{getMaterialUnitLabel(adjustment.materialUnit)}</p>
                    </div>
                  </TableCell>
                  <TableCell>{adjustment.amount}</TableCell>
                  <TableCell>{adjustment.note ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setModalMode("edit")
                          setEditingRow(adjustment)
                          form.reset({
                            materialId: adjustment.materialId,
                            amount: adjustment.amount,
                            note: adjustment.note ?? "",
                          })
                          setIsModalOpen(true)
                        }}
                      >
                        <PencilIcon className="size-4" />
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => {
                          const isConfirmed = window.confirm("Hapus data penyesuaian ini?")

                          if (!isConfirmed) {
                            return
                          }

                          startTransition(async () => {
                            const result = await deleteMaterialAdjustmentAction(adjustment.id)

                            if (!result.success) {
                              toast.error(result.message)
                              return
                            }

                            toast.success(result.message)
                            router.refresh()
                          })
                        }}
                      >
                        <Trash2Icon className="size-4" />
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={isModalOpen}
        onOpenChange={(nextOpen) => {
          setIsModalOpen(nextOpen)

          if (!nextOpen) {
            form.reset({
              materialId: materials[0]?.id ?? 0,
              amount: 0,
              note: "",
            })
            setEditingRow(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? "Tambah Penyesuaian Material" : "Edit Penyesuaian Material"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Tambahkan mutasi penyesuaian stok secara manual."
                : "Ubah data penyesuaian stok yang sudah tercatat."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => {
                startTransition(async () => {
                  let result

                  if (modalMode === "edit" && !editingRow) {
                    toast.error("Data penyesuaian tidak ditemukan")
                    return
                  }

                  if (modalMode === "create") {
                    result = await createMaterialAdjustmentAction(values)
                  } else {
                    const targetRow = editingRow

                    if (!targetRow) {
                      toast.error("Data penyesuaian tidak ditemukan")
                      return
                    }

                    result = await updateMaterialAdjustmentAction(targetRow.id, values)
                  }

                  if (!result.success) {
                    toast.error(result.message)
                    return
                  }

                  toast.success(result.message)
                  setIsModalOpen(false)
                  router.refresh()
                })
              })}
            >
              <FormField
                control={form.control}
                name="materialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material</FormLabel>
                    <FormControl>
                      <NativeSelect
                        className="w-full"
                        value={String(field.value)}
                        onChange={(event) => field.onChange(Number(event.target.value))}
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

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Penyesuaian</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <p className="text-xs text-zinc-500">
                      Gunakan angka negatif untuk mengurangi stok, positif untuk menambah stok.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        rows={3}
                        placeholder="Alasan penyesuaian (opsional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isBusy}>
                {modalMode === "create" ? "Simpan Penyesuaian" : "Simpan Perubahan"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
