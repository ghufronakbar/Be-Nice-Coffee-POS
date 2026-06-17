import { z } from "zod"

import { ACCESS_FIELDS, type AccessField } from "@/lib/access-control"

const accessFormShape = Object.fromEntries(
  ACCESS_FIELDS.map((field) => [field, z.boolean().default(false)])
) as Record<AccessField, z.ZodDefault<z.ZodBoolean>>

export const userFormSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter"),
  email: z.string().trim().email("Email tidak valid"),
  ...accessFormShape,
})

export type UserFormInputValues = z.input<typeof userFormSchema>
export type UserFormValues = z.output<typeof userFormSchema>
