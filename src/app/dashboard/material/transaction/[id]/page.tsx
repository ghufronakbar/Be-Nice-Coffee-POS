import Link from "next/link"
import { notFound } from "next/navigation"

import { getMaterialTransactionDetailAction } from "@/actions/material"
import { Button } from "@/components/ui/button"
import {
  getMaterialTransactionTypeLabel,
  getMaterialUnitLabel,
  getOrderStatusLabel,
} from "@/constants/constants"
import { formatDateTime, formatRupiah } from "@/lib/format"

type MaterialTransactionDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function MaterialTransactionDetailPage({
  params,
}: MaterialTransactionDetailPageProps) {
  const { id } = await params
  const transactionId = Number(id)

  if (Number.isNaN(transactionId)) {
    notFound()
  }

  const transaction = await getMaterialTransactionDetailAction(transactionId)

  if (!transaction) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Detail Transaksi Material</h1>
          <p className="text-sm text-zinc-600">Informasi mutasi stok dan relasi dokumen terkait.</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/dashboard/material/transaction">Kembali ke List Transaksi</Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Informasi Transaksi</h2>
          <div className="mt-4 rounded-lg border border-zinc-200 text-sm">
            <div className="flex justify-between border-b border-zinc-200 px-3 py-2">
              <span className="text-zinc-500">ID</span>
              <span className="font-medium text-zinc-900">#{transaction.id}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-200 px-3 py-2">
              <span className="text-zinc-500">Tipe</span>
              <span className="font-medium text-zinc-900">{getMaterialTransactionTypeLabel(transaction.type)}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-200 px-3 py-2">
              <span className="text-zinc-500">Material</span>
              <span className="font-medium text-zinc-900">{transaction.materialName}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-200 px-3 py-2">
              <span className="text-zinc-500">Satuan</span>
              <span className="font-medium text-zinc-900">{getMaterialUnitLabel(transaction.materialUnit)}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-200 px-3 py-2">
              <span className="text-zinc-500">Jumlah</span>
              <span className="font-medium text-zinc-900">{transaction.amount}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-200 px-3 py-2">
              <span className="text-zinc-500">Tanggal</span>
              <span className="font-medium text-zinc-900">{formatDateTime(transaction.createdAt)}</span>
            </div>
            <div className="flex justify-between px-3 py-2">
              <span className="text-zinc-500">Catatan</span>
              <span className="font-medium text-zinc-900">{transaction.note ?? "-"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Relasi</h2>

          {transaction.purchase ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-zinc-200 p-3 text-sm text-zinc-700">
                <p>Purchase ID: #{transaction.purchase.purchaseId}</p>
                <p>Invoice: {transaction.purchase.invoiceNumber}</p>
                <p>Total Dokumen: {formatRupiah(transaction.purchase.total)}</p>
                <p>Jumlah Item: {transaction.purchase.itemAmount}</p>
                <p>Harga Item: {formatRupiah(transaction.purchase.itemPrice)}</p>
                <p>Total Item: {formatRupiah(transaction.purchase.itemTotal)}</p>
              </div>
              <Button asChild>
                <Link href={`/dashboard/material/purchase/${transaction.purchase.purchaseId}`}>
                  Buka Pembelian
                </Link>
              </Button>
            </div>
          ) : null}

          {transaction.sell ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-zinc-200 p-3 text-sm text-zinc-700">
                <p>Order ID: #{transaction.sell.orderId}</p>
                <p>Status Order: {getOrderStatusLabel(transaction.sell.orderStatus)}</p>
                <p>Order Item ID: #{transaction.sell.orderItemId}</p>
                <p>Menu: {transaction.sell.menuName}</p>
                <p>Qty Order Item: {transaction.sell.orderItemAmount}</p>
                <p>Harga Order Item: {formatRupiah(transaction.sell.orderItemPrice)}</p>
                <p>Total Order Item: {formatRupiah(transaction.sell.orderItemTotal)}</p>
                <p>Catatan Order: {transaction.sell.orderNote ?? "-"}</p>
              </div>
              <Button asChild>
                <Link href={`/dashboard/order/${transaction.sell.orderId}`}>Buka Order</Link>
              </Button>
            </div>
          ) : null}

          {!transaction.purchase && !transaction.sell ? (
            <p className="mt-4 text-sm text-zinc-500">Transaksi ini tidak memiliki relasi purchase atau sell.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
