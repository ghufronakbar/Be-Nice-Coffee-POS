"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"

import {
  userFormSchema,
  type UserFormInputValues,
  type UserFormValues,
} from "@/components/user/user-form-schema"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ACCESS_FIELDS, ACCESS_GROUPS, type AccessField } from "@/lib/access-control"

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
  ) as Record<AccessField, boolean>

  function areAllChecked(fields: AccessField[]) {
    return fields.every((field) => watchedAccessMap[field])
  }

  function setAccessFields(fields: AccessField[], checked: boolean) {
    fields.forEach((field) => {
      form.setValue(field, checked, {
        shouldDirty: true,
        shouldValidate: true,
      })
    })
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

            <div className="space-y-3 rounded-xl border border-zinc-200 p-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Hak Akses</p>
                <p className="text-xs text-zinc-500">
                  Gunakan checkbox group untuk memilih banyak akses sekaligus.
                </p>
              </div>

              {ACCESS_GROUPS.map((group) => {
                const groupFields = group.fields.map((field) => field.field)
                const isGroupChecked = areAllChecked(groupFields)

                return (
                  <div key={group.title} className="rounded-lg border border-zinc-200 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{group.title}</p>
                        <p className="text-xs text-zinc-500">{group.description}</p>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                        <Checkbox
                          checked={isGroupChecked}
                          onCheckedChange={(checked) => setAccessFields(groupFields, checked === true)}
                        />
                        Semua {group.title}
                      </label>
                    </div>

                    {group.subgroups ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {group.subgroups.map((subgroup) => (
                          <label
                            key={subgroup.label}
                            className="flex items-center gap-2 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700"
                          >
                            <Checkbox
                              checked={areAllChecked(subgroup.fields)}
                              onCheckedChange={(checked) => setAccessFields(subgroup.fields, checked === true)}
                            />
                            {subgroup.label}
                          </label>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {group.fields.map((accessItem) => (
                        <FormField
                          key={accessItem.field}
                          control={form.control}
                          name={accessItem.field}
                          render={({ field }) => (
                            <FormItem className="flex items-start gap-2 rounded-md border border-zinc-100 p-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={(checked) => field.onChange(checked === true)}
                                />
                              </FormControl>
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm font-medium text-zinc-900">
                                  {accessItem.label}
                                </FormLabel>
                                <p className="text-xs text-zinc-500">{accessItem.description}</p>
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <Button type="submit" disabled={disabled}>
              {submitLabel}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
