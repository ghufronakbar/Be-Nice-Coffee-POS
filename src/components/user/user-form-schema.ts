import { z } from "zod"

export const userFormSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter"),
  email: z.string().trim().email("Email tidak valid"),
})

export type UserFormInputValues = z.input<typeof userFormSchema>
export type UserFormValues = z.output<typeof userFormSchema>
