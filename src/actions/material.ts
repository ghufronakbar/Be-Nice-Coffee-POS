"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

import { createMaterialQuickSchema } from "@/components/menu/menu-form-schema"
import { prisma } from "@/lib/prisma"

export type MaterialOption = {
  id: number
  name: string
  unit: "GRAM" | "ML" | "PIECE"
  imageUrl: string | null
}

export type MaterialMutationResult = {
  success: boolean
  message: string
  material?: MaterialOption
}

export async function getActiveMaterialsAction(): Promise<MaterialOption[]> {
  const materials = await prisma.material.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      unit: true,
      imageUrl: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  return materials
}

export async function createMaterialFromMenuAction(
  values: z.input<typeof createMaterialQuickSchema>
): Promise<MaterialMutationResult> {
  const validatedValues = createMaterialQuickSchema.safeParse(values)

  if (!validatedValues.success) {
    return {
      success: false,
      message: validatedValues.error.issues[0]?.message ?? "Data material tidak valid",
    }
  }

  const material = await prisma.material.create({
    data: {
      name: validatedValues.data.name,
      unit: validatedValues.data.unit,
      imageUrl: validatedValues.data.imageUrl ?? null,
    },
    select: {
      id: true,
      name: true,
      unit: true,
      imageUrl: true,
    },
  })

  revalidatePath("/dashboard/material")
  revalidatePath("/dashboard/menu/create")

  return {
    success: true,
    message: "Material berhasil ditambahkan",
    material,
  }
}
