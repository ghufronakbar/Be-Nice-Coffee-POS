"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  userFormSchema,
  type UserFormInputValues,
  type UserFormValues,
} from "@/components/user/user-form-schema"
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

type UserFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  submitLabel: string
  onSubmit: (values: UserFormValues) => Promise<void>
  disabled?: boolean
}

export function UserFormModal({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  onSubmit,
  disabled = false,
}: UserFormModalProps) {
  const form = useForm<UserFormInputValues, undefined, UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)

        if (!nextOpen) {
          form.reset({
            name: "",
            email: "",
          })
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
                  <FormLabel>Nama User</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Admin Kasir" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="admin@benicecoffee.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-xs text-zinc-500">Password default user baru adalah 12345678.</p>

            <Button type="submit" disabled={disabled}>
              {submitLabel}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
