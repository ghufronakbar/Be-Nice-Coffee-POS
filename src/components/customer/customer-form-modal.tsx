"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  customerFormSchema,
  type CustomerFormInputValues,
  type CustomerFormValues,
} from "@/components/customer/customer-form-schema"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

type CustomerFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  submitLabel: string
  initialValues?: CustomerFormInputValues
  onSubmit: (values: CustomerFormValues) => Promise<void>
  disabled?: boolean
}

export function CustomerFormModal({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValues,
  onSubmit,
  disabled = false,
}: CustomerFormModalProps) {
  const form = useForm<CustomerFormInputValues, undefined, CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: initialValues ?? {
      name: "",
      phone: "",
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)

        if (!nextOpen) {
          form.reset(initialValues ?? { name: "", phone: "" })
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              await onSubmit(values)
            })}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Customer</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Budi" {...field} />
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
                    <Input placeholder="08xxxxxxxxxx" inputMode="numeric" {...field} />
                  </FormControl>
                  <p className="text-xs text-zinc-500">Nomor wajib diawali angka 0.</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={disabled}>
              {submitLabel}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
