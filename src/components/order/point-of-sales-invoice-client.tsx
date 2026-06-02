"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import {
  cancelPendingOrderAction,
  completePendingOrderAction,
  type OrderDetail,
} from "@/actions/order"
import { Button } from "@/components/ui/button"
import { getOrderStatusLabel } from "@/constants/constants"
import { formatDateTime, formatRupiah } from "@/lib/format"

type PointOfSalesInvoiceClientProps = {
  order: OrderDetail
}

export function PointOfSalesInvoiceClient({ order }: PointOfSalesInvoiceClientProps) {
  const router = useRouter()
  const [isBusy, startTransition] = useTransition()
  const isPending = order.status === "PENDING"

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Invoice Order #{order.id}</h1>
          <p className="text-sm text-zinc-600">Ringkasan checkout dari point of sales.</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/dashboard/order/point-of-sales">Kembali ke POS</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap justify-between gap-3 border-b border-zinc-200 pb-4">
          <div>
            <p className="text-sm text-zinc-500">Customer</p>
            <p className="font-semibold text-zinc-900">{order.customerName ?? "Walk-in"}</p>
            <p className="text-sm text-zinc-600">{order.customerPhone ?? "-"}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-zinc-500">Status</p>
            <p className="font-semibold text-zinc-900">{getOrderStatusLabel(order.status)}</p>
            <p className="text-sm text-zinc-600">{formatDateTime(order.createdAt)}</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-zinc-900">{item.menuName}</p>
                <p className="text-zinc-600">
                  {item.amount} x {formatRupiah(item.price)}
                </p>
              </div>
              <p className="font-semibold text-zinc-900">{formatRupiah(item.total)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-zinc-200 pt-4">
          <div className="flex justify-between text-lg font-semibold text-zinc-900">
            <span>Total</span>
            <span>{formatRupiah(order.total)}</span>
          </div>
          {order.note ? <p className="mt-3 text-sm text-zinc-600">Catatan: {order.note}</p> : null}
        </div>

        {isPending ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={isBusy}
              onClick={() => {
                startTransition(async () => {
                  const result = await completePendingOrderAction(order.id)

                  if (!result.success) {
                    toast.error(result.message)
                    return
                  }

                  toast.success(result.message)
                  router.refresh()
                })
              }}
            >
              <CheckIcon className="size-4" />
              Selesaikan Order
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={isBusy}
              onClick={() => {
                startTransition(async () => {
                  const result = await cancelPendingOrderAction(order.id)

                  if (!result.success) {
                    toast.error(result.message)
                    return
                  }

                  toast.success(result.message)
                  router.refresh()
                })
              }}
            >
              <XIcon className="size-4" />
              Batalkan Order
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
