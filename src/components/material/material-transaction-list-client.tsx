"use client"

import { useMemo, useState } from "react"
import { EyeIcon } from "lucide-react"

import { type MaterialTransactionListRow } from "@/actions/material"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  getOrderStatusLabel,
} from "@/constants/constants"
import { formatDateTime, formatRupiah } from "@/lib/format"

type MaterialTransactionListClientProps = {
  items: MaterialTransactionListRow[]
}

export function MaterialTransactionListClient({ items }: MaterialTransactionListClientProps) {
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null)

  const selectedTransaction = useMemo(
    () => items.find((item) => item.id === selectedTransactionId) ?? null,
    [items, selectedTransactionId]
  )

  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-zinc-500">
                  Belum ada transaksi material.
                </TableCell>
              </TableRow>
            ) : (
              items.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDateTime(transaction.createdAt)}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium text-zinc-900">{transaction.materialName}</p>
                      <p className="text-xs text-zinc-500">{getMaterialUnitLabel(transaction.materialUnit)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getMaterialTransactionTypeLabel(transaction.type)}</Badge>
                  </TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell>{transaction.note ?? "-"}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTransactionId(transaction.id)}
                    >
                      <EyeIcon className="size-4" />
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={selectedTransaction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTransactionId(null)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selectedTransaction ? (
            <>
              <DialogHeader>
                <DialogTitle>Detail Transaksi Material</DialogTitle>
                <DialogDescription>
                  Informasi mutasi stok termasuk relasi pembelian atau penjualan.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="rounded-lg border border-zinc-200">
                  <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
                    <span className="text-zinc-500">ID Transaksi</span>
                    <span className="font-medium text-zinc-900">#{selectedTransaction.id}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
                    <span className="text-zinc-500">Tanggal</span>
                    <span className="font-medium text-zinc-900">
                      {formatDateTime(selectedTransaction.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
                    <span className="text-zinc-500">Material</span>
                    <span className="font-medium text-zinc-900">{selectedTransaction.materialName}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
                    <span className="text-zinc-500">Satuan</span>
                    <span className="font-medium text-zinc-900">
                      {getMaterialUnitLabel(selectedTransaction.materialUnit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
                    <span className="text-zinc-500">Tipe</span>
                    <span className="font-medium text-zinc-900">
                      {getMaterialTransactionTypeLabel(selectedTransaction.type)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
                    <span className="text-zinc-500">Jumlah</span>
                    <span className="font-medium text-zinc-900">{selectedTransaction.amount}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-zinc-500">Catatan</span>
                    <span className="font-medium text-zinc-900">{selectedTransaction.note ?? "-"}</span>
                  </div>
                </div>

                {selectedTransaction.purchase ? (
                  <div className="rounded-lg border border-zinc-200 p-3">
                    <p className="text-sm font-semibold text-zinc-900">Relasi Pembelian</p>
                    <div className="mt-2 space-y-1 text-sm text-zinc-700">
                      <p>Purchase ID: #{selectedTransaction.purchase.purchaseId}</p>
                      <p>Invoice: {selectedTransaction.purchase.invoiceNumber}</p>
                      <p>Total Dokumen: {formatRupiah(selectedTransaction.purchase.total)}</p>
                      <p>Amount Item: {selectedTransaction.purchase.itemAmount}</p>
                      <p>Harga Item: {formatRupiah(selectedTransaction.purchase.itemPrice)}</p>
                      <p>Total Item: {formatRupiah(selectedTransaction.purchase.itemTotal)}</p>
                    </div>
                  </div>
                ) : null}

                {selectedTransaction.sell ? (
                  <div className="rounded-lg border border-zinc-200 p-3">
                    <p className="text-sm font-semibold text-zinc-900">Relasi Penjualan</p>
                    <div className="mt-2 space-y-1 text-sm text-zinc-700">
                      <p>Order ID: #{selectedTransaction.sell.orderId}</p>
                      <p>Status Order: {getOrderStatusLabel(selectedTransaction.sell.orderStatus)}</p>
                      <p>Order Item ID: #{selectedTransaction.sell.orderItemId}</p>
                      <p>Menu: {selectedTransaction.sell.menuName}</p>
                      <p>Qty Order Item: {selectedTransaction.sell.orderItemAmount}</p>
                      <p>Harga Order Item: {formatRupiah(selectedTransaction.sell.orderItemPrice)}</p>
                      <p>Total Order Item: {formatRupiah(selectedTransaction.sell.orderItemTotal)}</p>
                      <p>Catatan Order: {selectedTransaction.sell.orderNote ?? "-"}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
