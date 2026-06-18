"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"

import { UserAccessFields } from "@/components/user/user-access-fields"
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
import { ACCESS_FIELDS, type AccessField, type AccessMap } from "@/lib/access-control"

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
  const defaultValues = {
    name: "",
    email: "",
    ...Object.fromEntries(ACCESS_FIELDS.map((field) => [field, false])),
  } as UserFormInputValues

  const form = useForm<UserFormInputValues, undefined, UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  })
  const watchedAccessValues = useWatch({
    control: form.control,
    name: ACCESS_FIELDS,
  })
  const watchedAccessMap = Object.fromEntries(
    ACCESS_FIELDS.map((field, index) => [field, Boolean(watchedAccessValues[index])])
  ) as AccessMap

  function setAccessFields(fields: AccessField[], checked: boolean) {
    fields.forEach((field) => {
      form.setValue(field, checked, {
        shouldDirty: true,
        shouldValidate: true,
      })
    })
  }

  function setAccessField(field: AccessField, checked: boolean) {
    setAccessFields([field], checked)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)

        if (!nextOpen) {
          form.reset(defaultValues)
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
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

            <UserAccessFields
              values={watchedAccessMap}
              disabled={disabled}
              onChange={setAccessField}
              onChangeMany={setAccessFields}
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
