import { z } from "zod"

const optionalImageUrlSchema = z
  .union([z.string().url("URL gambar tidak valid"), z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value))

export const recipeInputSchema = z.object({
  materialId: z.number().int("Material tidak valid").positive("Material tidak valid"),
  amount: z.number().positive("Jumlah material harus lebih besar dari 0"),
})

export const menuFormSchema = z
  .object({
    name: z.string().min(2, "Nama menu minimal 2 karakter"),
    price: z.number().min(0, "Harga tidak boleh negatif"),
    imageUrl: optionalImageUrlSchema,
    recipes: z.array(recipeInputSchema).min(1, "Minimal harus ada 1 resep"),
  })
  .superRefine((value, ctx) => {
    const usedMaterialIds = new Set<number>()

    value.recipes.forEach((recipe, index) => {
      if (usedMaterialIds.has(recipe.materialId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Material pada resep tidak boleh duplikat",
          path: ["recipes", index, "materialId"],
        })
      }

      usedMaterialIds.add(recipe.materialId)
    })
  })

export const createMaterialQuickSchema = z.object({
  name: z.string().min(2, "Nama material minimal 2 karakter"),
  unit: z.enum(["GRAM", "ML", "PIECE"]),
  imageUrl: optionalImageUrlSchema,
})

export type MenuFormInputValues = z.input<typeof menuFormSchema>
export type MenuFormValues = z.output<typeof menuFormSchema>
export type CreateMaterialQuickInputValues = z.input<typeof createMaterialQuickSchema>
export type CreateMaterialQuickValues = z.output<typeof createMaterialQuickSchema>
