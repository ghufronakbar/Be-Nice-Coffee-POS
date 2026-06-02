"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { deleteOrderAction, type OrderListRow } from "@/actions/order"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getOrderStatusLabel } from "@/constants/constants"
import { formatDateTime, formatRupiah } from "@/lib/format"

type OrderListClientProps = {
  items: OrderListRow[]
}

export function OrderListClient({ items }: OrderListClientProps) {
  const router = useRouter()
  const [isDeleting, startDeleteTransition] = useTransition()

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Profit</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-zinc-500">
                Belum ada order.
              </TableCell>
            </TableRow>
          ) : (
            items.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">#{order.id}</TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="font-medium text-zinc-900">{order.customerName ?? "Walk-in"}</p>
                    <p className="text-xs text-zinc-500">{order.customerPhone ?? "-"}</p>
                  </div>
                </TableCell>
                <TableCell>{getOrderStatusLabel(order.status)}</TableCell>
                <TableCell>{order.itemCount}</TableCell>
                <TableCell>{formatRupiah(order.total)}</TableCell>
                <TableCell>{formatRupiah(order.recordedProfit)}</TableCell>
                <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/order/${order.id}`}>Detail</Link>
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isDeleting}
                      onClick={() => {
                        const isConfirmed = window.confirm(`Hapus order #${order.id}?`)

                        if (!isConfirmed) {
                          return
                        }

                        startDeleteTransition(async () => {
                          const result = await deleteOrderAction(order.id)

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
