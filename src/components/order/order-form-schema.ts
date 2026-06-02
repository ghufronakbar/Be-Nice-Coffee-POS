import { z } from "zod"

const optionalNoteSchema = z
  .union([z.string().trim().max(1000), z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value))

export const orderItemFormSchema = z.object({
  menuId: z.number().int().positive("Menu tidak valid"),
  amount: z.number().int().positive("Jumlah menu harus lebih besar dari 0"),
})

const orderItemsSchema = z.array(orderItemFormSchema).min(1, "Minimal harus ada 1 item order")

function validateUniqueOrderItems(
  value: { items: Array<{ menuId: number }> },
  ctx: z.RefinementCtx
) {
  const usedMenuIds = new Set<number>()

  value.items.forEach((item, index) => {
    if (usedMenuIds.has(item.menuId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Menu pada order tidak boleh duplikat",
        path: ["items", index, "menuId"],
      })
    }

    usedMenuIds.add(item.menuId)
  })
}

export const orderFormSchema = z
  .object({
    customerId: z.number().int().positive().nullable().optional(),
    status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).default("PENDING"),
    note: optionalNoteSchema,
    items: orderItemsSchema,
  })
  .superRefine(validateUniqueOrderItems)

export const posCheckoutFormSchema = z
  .object({
    note: optionalNoteSchema,
    items: orderItemsSchema,
    customerMode: z.enum(["NONE", "EXISTING", "NEW"]),
    customerId: z.number().int().positive().nullable().optional(),
    customerName: z.string().trim().optional(),
    customerPhone: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    validateUniqueOrderItems(value, ctx)

    if (value.customerMode === "EXISTING" && !value.customerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pilih customer terlebih dahulu",
        path: ["customerId"],
      })
    }

    if (value.customerMode === "NEW") {
      if (!value.customerName || value.customerName.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nama customer minimal 2 karakter",
          path: ["customerName"],
        })
      }

      if (!value.customerPhone || !/^0[0-9]+$/.test(value.customerPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nomor customer wajib diawali 0 dan hanya angka",
          path: ["customerPhone"],
        })
      }
    }
  })

export type OrderFormInputValues = z.input<typeof orderFormSchema>
export type OrderFormValues = z.output<typeof orderFormSchema>

export type PosCheckoutInputValues = z.input<typeof posCheckoutFormSchema>
export type PosCheckoutValues = z.output<typeof posCheckoutFormSchema>
