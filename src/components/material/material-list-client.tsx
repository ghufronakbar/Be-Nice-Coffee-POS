"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import {
  createMaterialAction,
  deleteMaterialAction,
  type MaterialListRow,
} from "@/actions/material"
import { MaterialFormModal } from "@/components/material/material-form-modal"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getMaterialUnitLabel } from "@/constants/constants"
import { formatDateTime, formatRupiah } from "@/lib/format"

type MaterialListClientProps = {
  items: MaterialListRow[]
}

export function MaterialListClient({ items }: MaterialListClientProps) {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleting, startDeleteTransition] = useTransition()

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="size-4" />
          Tambah Material
        </Button>
      </div>

      <MaterialFormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Tambah Material Baru"
        description="Tambahkan material baru untuk keperluan recipe dan inventory."
        submitLabel="Simpan Material"
        onSubmit={async (values) => {
          const result = await createMaterialAction(values)

          if (!result.success) {
            toast.error(result.message)
            return
          }

          toast.success(result.message)
          setIsCreateModalOpen(false)
          router.refresh()
        }}
      />

      <div className="rounded-xl border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gambar</TableHead>
              <TableHead>Nama Material</TableHead>
              <TableHead>Satuan</TableHead>
              <TableHead>Sisa Stok</TableHead>
              <TableHead>Harga Beli Rata-rata</TableHead>
              <TableHead>Terkait Menu</TableHead>
              <TableHead>Terakhir Diperbarui</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-zinc-500">
                  Belum ada material.
                </TableCell>
              </TableRow>
            ) : (
              items.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    {material.imageUrl ? (
                      <div className="relative size-12 overflow-hidden rounded-md border border-zinc-200">
                        <Image
                          src={material.imageUrl}
                          alt={material.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded-md border border-dashed border-zinc-300 text-xs text-zinc-500">
                        -
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>{getMaterialUnitLabel(material.unit)}</TableCell>
                  <TableCell>{material.recordedAmount}</TableCell>
                  <TableCell>{formatRupiah(material.recordedBuyPrice)}</TableCell>
                  <TableCell>{material.relatedMenuCount}</TableCell>
                  <TableCell>{formatDateTime(material.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/material/${material.id}`}>Detail</Link>
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isDeleting}
                        onClick={() => {
                          const isConfirmed = window.confirm(
                            `Hapus material \"${material.name}\"?`
                          )

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
    </div>
  )
}
