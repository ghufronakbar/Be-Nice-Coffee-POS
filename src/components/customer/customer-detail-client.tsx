"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Trash2Icon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  deleteCustomerAction,
  updateCustomerAction,
  type CustomerDetail,
} from "@/actions/customer"
import {
  customerFormSchema,
  type CustomerFormInputValues,
  type CustomerFormValues,
} from "@/components/customer/customer-form-schema"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
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

type CustomerDetailClientProps = {
  customer: CustomerDetail
}

export function CustomerDetailClient({ customer }: CustomerDetailClientProps) {
  const router = useRouter()
  const [isBusy, startTransition] = useTransition()

  const form = useForm<CustomerFormInputValues, undefined, CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer.name,
      phone: customer.phone,
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Detail Customer</h1>
          <p className="text-sm text-zinc-600">Kelola profil customer dan lihat riwayat order.</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/dashboard/customer">Kembali ke List Customer</Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Edit Customer</h2>

          <Form {...form}>
            <form
              className="mt-5 space-y-4"
              onSubmit={form.handleSubmit((values) => {
                startTransition(async () => {
                  const result = await updateCustomerAction(customer.id, values)

                  if (!result.success) {
                    toast.error(result.message)
                    return
                  }

                  toast.success(result.message)
                  router.refresh()
                })
              })}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Customer</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor WhatsApp</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" {...field} />
                    </FormControl>
                    <p className="text-xs text-zinc-500">Nomor wajib diawali angka 0.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isBusy}>
                  Simpan Perubahan
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  disabled={isBusy}
                  onClick={() => {
                    const isConfirmed = window.confirm(`Hapus customer \"${customer.name}\"?`)

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
                      router.push("/dashboard/customer")
                    })
                  }}
                >
                  <Trash2Icon className="size-4" />
                  Hapus Customer
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Ringkasan</h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Total Order</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">{customer.summary.orderCount}</p>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Nilai Order</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {formatRupiah(customer.summary.totalOrderValue)}
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Total Profit</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {formatRupiah(customer.summary.totalProfit)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200">
              <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-sm">
                <span className="text-zinc-500">Nama</span>
                <span className="font-medium text-zinc-900">{customer.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-sm">
                <span className="text-zinc-500">Nomor</span>
                <span className="font-medium text-zinc-900">{customer.phone}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-sm">
                <span className="text-zinc-500">Terdaftar</span>
                <span className="font-medium text-zinc-900">{formatDateTime(customer.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-zinc-500">Update Terakhir</span>
                <span className="font-medium text-zinc-900">{formatDateTime(customer.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Riwayat Order Customer</h2>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jumlah Item</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Modal Snapshot</TableHead>
                <TableHead>Profit Snapshot</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-zinc-500">
                    Belum ada riwayat order.
                  </TableCell>
                </TableRow>
              ) : (
                customer.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                    <TableCell>{getOrderStatusLabel(order.status)}</TableCell>
                    <TableCell>{order.itemCount}</TableCell>
                    <TableCell>{formatRupiah(order.total)}</TableCell>
                    <TableCell>{formatRupiah(order.recordedBuyPrice)}</TableCell>
                    <TableCell>{formatRupiah(order.recordedProfit)}</TableCell>
                    <TableCell>{order.note ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
