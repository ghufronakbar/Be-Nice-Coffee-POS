import { z } from "zod"

const optionalNoteSchema = z
  .union([z.string().trim().max(1000), z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value))

export const materialPurchaseItemFormSchema = z.object({
  materialId: z.number().int().positive("Material tidak valid"),
  amount: z.number().positive("Jumlah material harus lebih besar dari 0"),
  total: z.number().min(0, "Total harga tidak boleh negatif"),
})

export const materialPurchaseFormSchema = z
  .object({
    invoiceNumber: z.string().trim().min(1, "Nomor invoice wajib diisi"),
    note: optionalNoteSchema,
    items: z.array(materialPurchaseItemFormSchema).min(1, "Minimal harus ada 1 item pembelian"),
  })
  .superRefine((value, ctx) => {
    const usedMaterialIds = new Set<number>()

    value.items.forEach((item, index) => {
      if (usedMaterialIds.has(item.materialId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Material item pembelian tidak boleh duplikat",
          path: ["items", index, "materialId"],
        })
      }

      usedMaterialIds.add(item.materialId)
    })
  })

export const materialAdjustmentFormSchema = z.object({
  materialId: z.number().int().positive("Material tidak valid"),
  amount: z.number().refine((value) => value !== 0, {
    message: "Jumlah penyesuaian tidak boleh 0",
  }),
  note: optionalNoteSchema,
})

export type MaterialPurchaseFormInputValues = z.input<typeof materialPurchaseFormSchema>
export type MaterialPurchaseFormValues = z.output<typeof materialPurchaseFormSchema>

export type MaterialAdjustmentFormInputValues = z.input<typeof materialAdjustmentFormSchema>
export type MaterialAdjustmentFormValues = z.output<typeof materialAdjustmentFormSchema>
