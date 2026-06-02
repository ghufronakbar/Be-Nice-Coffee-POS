"use client"

import { useMemo, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import {
  deleteOrderAction,
  updateOrderAction,
  type OrderCustomerOption,
  type OrderDetail,
  type OrderMenuOption,
} from "@/actions/order"
import {
  orderFormSchema,
  type OrderFormInputValues,
  type OrderFormValues,
} from "@/components/order/order-form-schema"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { getOrderStatusLabel } from "@/constants/constants"
import { formatDateTime, formatRupiah } from "@/lib/format"

type OrderDetailClientProps = {
  order: OrderDetail
  menus: OrderMenuOption[]
  customers: OrderCustomerOption[]
}

export function OrderDetailClient({ order, menus, customers }: OrderDetailClientProps) {
  const router = useRouter()
  const [isSaving, startSaveTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  const form = useForm<OrderFormInputValues, undefined, OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerId: order.customerId,
      status: order.status,
      note: order.note ?? "",
      items: order.items.map((item) => ({
        menuId: item.menuId,
        amount: item.amount,
      })),
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

  const previewTotal = useMemo(() => {
    return (watchedItems ?? []).reduce((totalAmount, item) => {
      const menu = menus.find((menuOption) => menuOption.id === item.menuId)
      const amount = Number.isFinite(item.amount) ? item.amount : 0

      return totalAmount + (menu?.price ?? 0) * amount
    }, 0)
  }, [menus, watchedItems])

  const selectedMenuIds = useMemo(() => {
    return new Set((watchedItems ?? []).map((item) => item.menuId))
  }, [watchedItems])

  const availableMenusForNewItem = menus.filter((menu) => !selectedMenuIds.has(menu.id))

  const isBusy = isSaving || isDeleting

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Detail Order #{order.id}</h1>
          <p className="text-sm text-zinc-600">Edit order, item menu, customer, dan status transaksi.</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/dashboard/order">Kembali ke Riwayat Order</Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Edit Order</h2>

          <Form {...form}>
            <form
              className="mt-5 space-y-5"
              onSubmit={form.handleSubmit((values) => {
                startSaveTransition(async () => {
                  const result = await updateOrderAction(order.id, values)

                  if (!result.success) {
                    toast.error(result.message)
                    return
                  }

                  toast.success(result.message)
                  router.refresh()
                })
              })}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <FormControl>
                        <NativeSelect
                          className="w-full"
                          value={field.value ? String(field.value) : "NONE"}
                          onChange={(event) => {
                            field.onChange(event.target.value === "NONE" ? null : Number(event.target.value))
                          }}
                        >
                          <NativeSelectOption value="NONE">Walk-in / Tanpa Customer</NativeSelectOption>
                          {customers.map((customer) => (
                            <NativeSelectOption key={customer.id} value={String(customer.id)}>
                              {customer.name} ({customer.phone})
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <NativeSelect
                          className="w-full"
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value)}
                        >
                          <NativeSelectOption value="PENDING">Pending</NativeSelectOption>
                          <NativeSelectOption value="COMPLETED">Selesai</NativeSelectOption>
                          <NativeSelectOption value="CANCELLED">Dibatalkan</NativeSelectOption>
                        </NativeSelect>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        rows={3}
                        placeholder="Catatan order (opsional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">Item Order</h3>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={availableMenusForNewItem.length === 0}
                    onClick={() => append({ menuId: availableMenusForNewItem[0]?.id ?? 0, amount: 1 })}
                  >
                    <PlusIcon className="size-4" />
                    Tambah Item
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 rounded-lg border border-zinc-200 p-3 md:grid-cols-[2fr_1fr_auto]">
                    <FormField
                      control={form.control}
                      name={`items.${index}.menuId`}
                      render={({ field: itemField }) => (
                        <FormItem>
                          <FormLabel>Menu</FormLabel>
                          <FormControl>
                            <NativeSelect
                              className="w-full"
                              value={String(itemField.value)}
                              onChange={(event) => itemField.onChange(Number(event.target.value))}
                            >
                              {menus
                                .filter((menu) => {
                                  const currentMenuId = watchedItems?.[index]?.menuId
                                  return menu.id === currentMenuId || !selectedMenuIds.has(menu.id)
                                })
                                .map((menu) => (
                                <NativeSelectOption key={menu.id} value={String(menu.id)}>
                                  {menu.name} - {formatRupiah(menu.price)}
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
                      name={`items.${index}.amount`}
                      render={({ field: itemField }) => (
                        <FormItem>
                          <FormLabel>Qty</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              value={itemField.value}
                              onChange={(event) => itemField.onChange(Number(event.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-end">
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
                ))}
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Preview Total</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">{formatRupiah(previewTotal)}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isBusy}>
                  Simpan Perubahan
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  disabled={isBusy}
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
                      router.push("/dashboard/order")
                    })
                  }}
                >
                  <Trash2Icon className="size-4" />
                  Hapus Order
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-base font-semibold text-zinc-900">Ringkasan</h2>
            <div className="mt-4 rounded-lg border border-zinc-200 text-sm">
              <div className="flex justify-between border-b border-zinc-200 px-3 py-2">
                <span className="text-zinc-500">Status</span>
                <span className="font-medium text-zinc-900">{getOrderStatusLabel(order.status)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 px-3 py-2">
                <span className="text-zinc-500">Customer</span>
                <span className="font-medium text-zinc-900">{order.customerName ?? "Walk-in"}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 px-3 py-2">
                <span className="text-zinc-500">Total</span>
                <span className="font-medium text-zinc-900">{formatRupiah(order.total)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 px-3 py-2">
                <span className="text-zinc-500">Modal Snapshot</span>
                <span className="font-medium text-zinc-900">{formatRupiah(order.recordedBuyPrice)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 px-3 py-2">
                <span className="text-zinc-500">Profit Snapshot</span>
                <span className="font-medium text-zinc-900">{formatRupiah(order.recordedProfit)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 px-3 py-2">
                <span className="text-zinc-500">Dibuat</span>
                <span className="font-medium text-zinc-900">{formatDateTime(order.createdAt)}</span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-zinc-500">Update</span>
                <span className="font-medium text-zinc-900">{formatDateTime(order.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-base font-semibold text-zinc-900">Item Snapshot</h2>
            <div className="mt-3 space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium text-zinc-900">{item.menuName}</span>
                    <span className="text-zinc-600">x{item.amount}</span>
                  </div>
                  <div className="mt-1 flex justify-between gap-3 text-zinc-600">
                    <span>{formatRupiah(item.price)}</span>
                    <span>{formatRupiah(item.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
