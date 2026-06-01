"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import {
  deleteMaterialPurchaseAction,
  type MaterialPurchaseListRow,
} from "@/actions/material"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime, formatRupiah } from "@/lib/format"

type MaterialPurchaseListClientProps = {
  items: MaterialPurchaseListRow[]
}

export function MaterialPurchaseListClient({ items }: MaterialPurchaseListClientProps) {
  const router = useRouter()
  const [isDeleting, startDeleteTransition] = useTransition()

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Jumlah Item</TableHead>
            <TableHead>Catatan</TableHead>
            <TableHead>Terakhir Diperbarui</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-zinc-500">
                Belum ada data pembelian material.
              </TableCell>
            </TableRow>
          ) : (
            items.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="font-medium">{purchase.invoiceNumber}</TableCell>
                <TableCell>{formatRupiah(purchase.total)}</TableCell>
                <TableCell>{purchase.itemCount}</TableCell>
                <TableCell>{purchase.note ?? "-"}</TableCell>
                <TableCell>{formatDateTime(purchase.updatedAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/material/purchase/${purchase.id}`}>Detail</Link>
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isDeleting}
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
  )
}
