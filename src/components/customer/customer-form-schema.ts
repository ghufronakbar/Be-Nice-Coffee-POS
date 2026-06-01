import { z } from "zod"

export const customerPhoneRegex = /^0[0-9]+$/

export const customerFormSchema = z.object({
  name: z.string().min(2, "Nama customer minimal 2 karakter"),
  phone: z
    .string()
    .trim()
    .min(8, "Nomor minimal 8 digit")
    .max(16, "Nomor maksimal 16 digit")
    .regex(customerPhoneRegex, "Nomor harus diawali 0 dan hanya berisi angka"),
})

export type CustomerFormInputValues = z.input<typeof customerFormSchema>
export type CustomerFormValues = z.output<typeof customerFormSchema>
