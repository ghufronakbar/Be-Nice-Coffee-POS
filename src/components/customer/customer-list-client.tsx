"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import {
  createCustomerAction,
  deleteCustomerAction,
  type CustomerListRow,
} from "@/actions/customer"
import { CustomerFormModal } from "@/components/customer/customer-form-modal"
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

type CustomerListClientProps = {
  items: CustomerListRow[]
}

export function CustomerListClient({ items }: CustomerListClientProps) {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isBusy, startTransition] = useTransition()

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="size-4" />
          Tambah Customer
        </Button>
      </div>

      <CustomerFormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Tambah Customer Baru"
        description="Tambahkan customer tanpa meninggalkan halaman ini."
        submitLabel="Simpan Customer"
        disabled={isBusy}
        onSubmit={async (values) => {
          startTransition(async () => {
            const result = await createCustomerAction(values)

            if (!result.success) {
              toast.error(result.message)
              return
            }

            toast.success(result.message)
            setIsCreateModalOpen(false)
            router.refresh()
          })
        }}
      />

      <div className="rounded-xl border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Nomor</TableHead>
              <TableHead>Total Order</TableHead>
              <TableHead>Total Nilai Order</TableHead>
              <TableHead>Terakhir Diperbarui</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-zinc-500">
                  Belum ada customer.
                </TableCell>
              </TableRow>
            ) : (
              items.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.orderCount}</TableCell>
                  <TableCell>{formatRupiah(customer.totalOrderValue)}</TableCell>
                  <TableCell>{formatDateTime(customer.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/customer/${customer.id}`}>Detail</Link>
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => {
                          const isConfirmed = window.confirm(
                            `Hapus customer \"${customer.name}\"?`
                          )

                          if (!isConfirmed) {
                            return
                          }

                          startTransition(async () => {
                            const result = await deleteCustomerAction(customer.id)

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
