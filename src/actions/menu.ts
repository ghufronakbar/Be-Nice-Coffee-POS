"use server"

import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/constants/constants"
import { menuFormSchema } from "@/components/menu/menu-form-schema"
import { prisma } from "@/lib/prisma"

const pageSizeEnum = z.enum(PAGE_SIZE_OPTIONS.map(String) as [string, ...string[]])

const menuListQuerySchema = z.object({
  q: z.string().trim().optional(),
  sortBy: z.enum(["name", "price", "createdAt", "updatedAt"]).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().default(DEFAULT_PAGE_SIZE),
})

export type MenuListQueryInput = z.input<typeof menuListQuerySchema>

export type MenuListRow = {
  id: number
  name: string
  imageUrl: string | null
  price: number
  recipeCount: number
  updatedAt: Date
}

export type MenuListResult = {
  items: MenuListRow[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  query: {
    q: string
    sortBy: "name" | "price" | "createdAt" | "updatedAt"
    sortOrder: "asc" | "desc"
  }
}

export type MenuDetail = {
  id: number
  name: string
  imageUrl: string | null
  price: number
  recipes: Array<{
    materialId: number
    amount: number
    materialName: string
    materialUnit: "GRAM" | "ML" | "PIECE"
  }>
}

export type MenuMutationResult = {
  success: boolean
  message: string
  menuId?: number
}

function normalizePageSize(pageSize: number) {
  if (!pageSizeEnum.safeParse(String(pageSize)).success) {
    return DEFAULT_PAGE_SIZE
  }

  return pageSize
}

export async function getMenuListAction(
  queryInput: MenuListQueryInput
): Promise<MenuListResult> {
  const parsedQuery = menuListQuerySchema.safeParse(queryInput)
  const query = parsedQuery.success
    ? parsedQuery.data
    : {
        q: "",
        sortBy: "updatedAt" as const,
        sortOrder: "desc" as const,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      }

  const q = (query.q ?? "").trim()
  const pageSize = normalizePageSize(query.pageSize)

  const whereCondition: Prisma.MenuWhereInput = {
    deletedAt: null,
    ...(q
      ? {
          name: {
            contains: q,
            mode: "insensitive",
          },
        }
      : {}),
  }

  const totalItems = await prisma.menu.count({ where: whereCondition })
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(query.page, totalPages)

  const menus = await prisma.menu.findMany({
    where: whereCondition,
    select: {
      id: true,
      name: true,
      imageUrl: true,
      price: true,
      updatedAt: true,
      recipes: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      [query.sortBy]: query.sortOrder,
    },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })

  return {
    items: menus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      imageUrl: menu.imageUrl,
      price: Number(menu.price),
      recipeCount: menu.recipes.length,
      updatedAt: menu.updatedAt,
    })),
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    query: {
      q,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  }
}

export async function getMenuDetailAction(menuId: number): Promise<MenuDetail | null> {
  const menu = await prisma.menu.findFirst({
    where: {
      id: menuId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      price: true,
      recipes: {
        where: {
          deletedAt: null,
        },
        select: {
          materialId: true,
          amount: true,
          material: {
            select: {
              id: true,
              name: true,
              unit: true,
              deletedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  })

  if (!menu) {
    return null
  }

  const recipes = menu.recipes
    .filter((recipe) => recipe.material.deletedAt === null)
    .map((recipe) => ({
      materialId: recipe.materialId,
      amount: Number(recipe.amount),
      materialName: recipe.material.name,
      materialUnit: recipe.material.unit,
    }))

  return {
    id: menu.id,
    name: menu.name,
    imageUrl: menu.imageUrl,
    price: Number(menu.price),
    recipes,
  }
}

async function ensureMaterialsExist(materialIds: number[]) {
  const uniqueMaterialIds = [...new Set(materialIds)]

  const totalMaterials = await prisma.material.count({
    where: {
      id: {
        in: uniqueMaterialIds,
      },
      deletedAt: null,
    },
  })

  return totalMaterials === uniqueMaterialIds.length
}

export async function createMenuWithRecipesAction(
  values: z.input<typeof menuFormSchema>
): Promise<MenuMutationResult> {
  const validatedValues = menuFormSchema.safeParse(values)

  if (!validatedValues.success) {
    return {
      success: false,
      message: validatedValues.error.issues[0]?.message ?? "Data menu tidak valid",
    }
  }

  const materialsExist = await ensureMaterialsExist(
    validatedValues.data.recipes.map((recipe) => recipe.materialId)
  )

  if (!materialsExist) {
    return {
      success: false,
      message: "Material pada resep tidak ditemukan",
    }
  }

  const createdMenu = await prisma.menu.create({
    data: {
      name: validatedValues.data.name,
      imageUrl: validatedValues.data.imageUrl ?? null,
      price: new Prisma.Decimal(validatedValues.data.price),
      recipes: {
        create: validatedValues.data.recipes.map((recipe) => ({
          materialId: recipe.materialId,
          amount: new Prisma.Decimal(recipe.amount),
        })),
      },
    },
    select: {
      id: true,
    },
  })

  revalidatePath("/dashboard/menu")
  revalidatePath(`/dashboard/menu/${createdMenu.id}`)

  return {
    success: true,
    message: "Menu berhasil dibuat",
    menuId: createdMenu.id,
  }
}

export async function updateMenuWithRecipesAction(
  menuId: number,
  values: z.input<typeof menuFormSchema>
): Promise<MenuMutationResult> {
  const validatedValues = menuFormSchema.safeParse(values)

  if (!validatedValues.success) {
    return {
      success: false,
      message: validatedValues.error.issues[0]?.message ?? "Data menu tidak valid",
    }
  }

  const existingMenu = await prisma.menu.findFirst({
    where: {
      id: menuId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  })

  if (!existingMenu) {
    return {
      success: false,
      message: "Menu tidak ditemukan",
    }
  }

  const materialsExist = await ensureMaterialsExist(
    validatedValues.data.recipes.map((recipe) => recipe.materialId)
  )

  if (!materialsExist) {
    return {
      success: false,
      message: "Material pada resep tidak ditemukan",
    }
  }

  const now = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.menu.update({
      where: {
        id: menuId,
      },
      data: {
        name: validatedValues.data.name,
        imageUrl: validatedValues.data.imageUrl ?? null,
        price: new Prisma.Decimal(validatedValues.data.price),
      },
    })

    await tx.recipe.updateMany({
      where: {
        menuId,
        deletedAt: null,
      },
      data: {
        deletedAt: now,
      },
    })

    await tx.recipe.createMany({
      data: validatedValues.data.recipes.map((recipe) => ({
        menuId,
        materialId: recipe.materialId,
        amount: new Prisma.Decimal(recipe.amount),
      })),
    })
  })

  revalidatePath("/dashboard/menu")
  revalidatePath(`/dashboard/menu/${menuId}`)

  return {
    success: true,
    message: "Menu berhasil diperbarui",
    menuId,
  }
}
