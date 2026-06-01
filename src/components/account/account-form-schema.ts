import { z } from "zod"

export const accountProfileSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter"),
})

export const accountPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password lama wajib diisi"),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "Password baru harus berbeda dari password lama",
  })

export type AccountProfileInputValues = z.input<typeof accountProfileSchema>
export type AccountProfileValues = z.output<typeof accountProfileSchema>

export type AccountPasswordInputValues = z.input<typeof accountPasswordSchema>
export type AccountPasswordValues = z.output<typeof accountPasswordSchema>
