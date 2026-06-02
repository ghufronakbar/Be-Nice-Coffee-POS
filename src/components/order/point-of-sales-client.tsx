"use client"

import { useMemo, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { MinusIcon, PlusIcon, ShoppingCartIcon, Trash2Icon } from "lucide-react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import {
  createOrderFromPosAction,
  type OrderCustomerOption,
  type OrderMenuOption,
} from "@/actions/order"
import {
  posCheckoutFormSchema,
  type PosCheckoutInputValues,
  type PosCheckoutValues,
} from "@/components/order/order-form-schema"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { formatRupiah } from "@/lib/format"

type PointOfSalesClientProps = {
  menus: OrderMenuOption[]
  customers: OrderCustomerOption[]
}

export function PointOfSalesClient({ menus, customers }: PointOfSalesClientProps) {
  const router = useRouter()
  const [isCheckingOut, startCheckoutTransition] = useTransition()

  const form = useForm<PosCheckoutInputValues, undefined, PosCheckoutValues>({
    resolver: zodResolver(posCheckoutFormSchema),
    defaultValues: {
      customerMode: "NONE",
      customerId: null,
      customerName: "",
      customerPhone: "",
      note: "",
      items: [],
    },
  })

  const { fields, append, update, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const watchedItems = useWatch({
    control: form.control,
    name: "items",
  })
  const customerMode = useWatch({
    control: form.control,
    name: "customerMode",
  })

  const cartItems = useMemo(() => {
    return (watchedItems ?? []).map((item, index) => ({
      ...item,
      index,
      menu: menus.find((menu) => menu.id === item.menuId) ?? null,
    }))
  }, [menus, watchedItems])

  const total = cartItems.reduce((totalAmount, item) => {
    return totalAmount + (item.menu?.price ?? 0) * item.amount
  }, 0)

  function addMenu(menu: OrderMenuOption) {
    const currentItems = form.getValues("items")
    const existingIndex = currentItems.findIndex((item) => item.menuId === menu.id)

    if (existingIndex >= 0) {
      update(existingIndex, {
        ...currentItems[existingIndex],
        amount: currentItems[existingIndex].amount + 1,
      })
      return
    }

    append({
      menuId: menu.id,
      amount: 1,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Point of Sales</h1>
        <p className="text-sm text-zinc-600">Buat order baru langsung dari layar kasir.</p>
      </div>

      <Form {...form}>
        <form
          className="grid gap-6 xl:grid-cols-[1fr_420px]"
          onSubmit={form.handleSubmit((values) => {
            startCheckoutTransition(async () => {
              const result = await createOrderFromPosAction(values)

              if (!result.success) {
                toast.error(result.message)
                return
              }

              toast.success(result.message)

              if (result.orderId) {
                router.push(`/dashboard/order/point-of-sales/${result.orderId}`)
              }
            })
          })}
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {menus.map((menu) => (
                <button
                  key={menu.id}
                  type="button"
                  className="overflow-hidden rounded-xl border border-zinc-200 bg-white text-left transition hover:border-zinc-400"
                  onClick={() => addMenu(menu)}
                >
                  {menu.imageUrl ? (
                    <div className="relative h-32 w-full bg-zinc-100">
                      <Image src={menu.imageUrl} alt={menu.name} fill className="object-cover" sizes="260px" />
                    </div>
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center bg-zinc-100 text-sm text-zinc-500">
                      No Image
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-semibold text-zinc-900">{menu.name}</p>
                    <p className="text-sm text-zinc-600">{formatRupiah(menu.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Keranjang</h2>
              <ShoppingCartIcon className="size-5 text-zinc-500" />
            </div>

            {fields.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
                Pilih menu untuk mulai membuat order.
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={fields[item.index].id} className="rounded-lg border border-zinc-200 p-3">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-medium text-zinc-900">{item.menu?.name ?? "Menu tidak ditemukan"}</p>
                        <p className="text-sm text-zinc-600">{formatRupiah(item.menu?.price ?? 0)}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(item.index)}>
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={item.amount <= 1}
                          onClick={() => update(item.index, { menuId: item.menuId, amount: item.amount - 1 })}
                        >
                          <MinusIcon className="size-4" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">{item.amount}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => update(item.index, { menuId: item.menuId, amount: item.amount + 1 })}
                        >
                          <PlusIcon className="size-4" />
                        </Button>
                      </div>
                      <p className="font-semibold text-zinc-900">
                        {formatRupiah((item.menu?.price ?? 0) * item.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-zinc-200 pt-4">
              <FormField
                control={form.control}
                name="customerMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <FormControl>
                      <NativeSelect
                        className="w-full"
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value)}
                      >
                        <NativeSelectOption value="NONE">Walk-in / Tanpa Customer</NativeSelectOption>
                        <NativeSelectOption value="EXISTING">Pilih Customer</NativeSelectOption>
                        <NativeSelectOption value="NEW">Customer Baru</NativeSelectOption>
                      </NativeSelect>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {customerMode === "EXISTING" ? (
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem className="mt-3">
                      <FormLabel>Pilih Customer</FormLabel>
                      <FormControl>
                        <NativeSelect
                          className="w-full"
                          value={field.value ? String(field.value) : ""}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        >
                          <NativeSelectOption value="">Pilih customer</NativeSelectOption>
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
              ) : null}

              {customerMode === "NEW" ? (
                <div className="mt-3 grid gap-3">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Customer</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama customer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor Customer</FormLabel>
                        <FormControl>
                          <Input placeholder="08xxxxxxxxxx" inputMode="numeric" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : null}
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea value={field.value ?? ""} onChange={field.onChange} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Total Order</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">{formatRupiah(total)}</p>
            </div>

            <Button type="submit" disabled={isCheckingOut || fields.length === 0} className="w-full">
              Checkout
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
