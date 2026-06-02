"use server"

import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createMaterialQuickSchema } from "@/components/menu/menu-form-schema"
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/constants/constants"
import { prisma } from "@/lib/prisma"
import {
  ensureMaterialsExistForTransaction,
  refreshMaterialStockSnapshot,
  toDecimal,
} from "@/lib/inventory"

const pageSizeEnum = z.enum(PAGE_SIZE_OPTIONS.map(String) as [string, ...string[]])

const materialListQuerySchema = z.object({
  q: z.string().trim().optional(),
  sortBy: z
    .enum(["name", "unit", "recordedAmount", "recordedBuyPrice", "createdAt", "updatedAt"])
    .default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().default(DEFAULT_PAGE_SIZE),
})

export type MaterialOption = {
  id: number
  name: string
  unit: "GRAM" | "ML" | "PIECE"
  imageUrl: string | null
}

export type MaterialListQueryInput = z.input<typeof materialListQuerySchema>

export type MaterialListRow = {
  id: number
  name: string
  imageUrl: string | null
  unit: "GRAM" | "ML" | "PIECE"
  recordedAmount: number
  recordedBuyPrice: number
  relatedMenuCount: number
  updatedAt: Date
}

export type MaterialListResult = {
  items: MaterialListRow[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  query: {
    q: string
    sortBy:
      | "name"
      | "unit"
      | "recordedAmount"
      | "recordedBuyPrice"
      | "createdAt"
      | "updatedAt"
    sortOrder: "asc" | "desc"
  }
}

export type MaterialMutationResult = {
  success: boolean
  message: string
  material?: MaterialOption
}

export type MaterialDetail = {
  id: number
  name: string
  unit: "GRAM" | "ML" | "PIECE"
  imageUrl: string | null
  recordedAmount: number
  recordedBuyPrice: number
  relatedMenus: Array<{
    id: number
    name: string
    imageUrl: string | null
    price: number
  }>
  transactions: Array<{
    id: number
    type: "PURCHASE" | "SELL" | "ADJUSTMENT"
    amount: number
    note: string | null
    createdAt: Date
    orderId: number | null
    invoiceNumber: string | null
  }>
}

function normalizePageSize(pageSize: number) {
  if (!pageSizeEnum.safeParse(String(pageSize)).success) {
    return DEFAULT_PAGE_SIZE
  }

  return pageSize
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

export async function getMaterialListAction(
  queryInput: MaterialListQueryInput
): Promise<MaterialListResult> {
  const parsedQuery = materialListQuerySchema.safeParse(queryInput)
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

  const whereCondition: Prisma.MaterialWhereInput = {
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

  const totalItems = await prisma.material.count({ where: whereCondition })
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(query.page, totalPages)

  const materials = await prisma.material.findMany({
    where: whereCondition,
    select: {
      id: true,
      name: true,
      unit: true,
      imageUrl: true,
      recordedAmount: true,
      recordedBuyPrice: true,
      updatedAt: true,
      recipes: {
        where: {
          deletedAt: null,
          menu: {
            deletedAt: null,
          },
        },
        select: {
          menuId: true,
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
    items: materials.map((material) => ({
      id: material.id,
      name: material.name,
      imageUrl: material.imageUrl,
      unit: material.unit,
      recordedAmount: Number(material.recordedAmount),
      recordedBuyPrice: Number(material.recordedBuyPrice),
      relatedMenuCount: new Set(material.recipes.map((recipe) => recipe.menuId)).size,
      updatedAt: material.updatedAt,
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

export async function getMaterialDetailAction(materialId: number): Promise<MaterialDetail | null> {
  const material = await prisma.material.findFirst({
    where: {
      id: materialId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      unit: true,
      imageUrl: true,
      recordedAmount: true,
      recordedBuyPrice: true,
      recipes: {
        where: {
          deletedAt: null,
          menu: {
            deletedAt: null,
          },
        },
        select: {
          menu: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              price: true,
            },
          },
        },
      },
      materialTransactions: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          type: true,
          amount: true,
          note: true,
          createdAt: true,
          orderItem: {
            select: {
              orderId: true,
            },
          },
          materialPurchaseItem: {
            select: {
              materialPurchase: {
                select: {
                  invoiceNumber: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!material) {
    return null
  }

  const uniqueRelatedMenus = Array.from(
    new Map(material.recipes.map((recipe) => [recipe.menu.id, recipe.menu])).values()
  )

  return {
    id: material.id,
    name: material.name,
    unit: material.unit,
    imageUrl: material.imageUrl,
    recordedAmount: Number(material.recordedAmount),
    recordedBuyPrice: Number(material.recordedBuyPrice),
    relatedMenus: uniqueRelatedMenus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      imageUrl: menu.imageUrl,
      price: Number(menu.price),
    })),
    transactions: material.materialTransactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount),
      note: transaction.note,
      createdAt: transaction.createdAt,
      orderId: transaction.orderItem?.orderId ?? null,
      invoiceNumber: transaction.materialPurchaseItem?.materialPurchase.invoiceNumber ?? null,
    })),
  }
}

export async function createMaterialAction(
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
  revalidatePath(`/dashboard/material/${material.id}`)
  revalidatePath("/dashboard/menu/create")

  return {
    success: true,
    message: "Material berhasil ditambahkan",
    material,
  }
}

export async function updateMaterialAction(
  materialId: number,
  values: z.input<typeof createMaterialQuickSchema>
): Promise<MaterialMutationResult> {
  const validatedValues = createMaterialQuickSchema.safeParse(values)

  if (!validatedValues.success) {
    return {
      success: false,
      message: validatedValues.error.issues[0]?.message ?? "Data material tidak valid",
    }
  }

  const existingMaterial = await prisma.material.findFirst({
    where: {
      id: materialId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  })

  if (!existingMaterial) {
    return {
      success: false,
      message: "Material tidak ditemukan",
    }
  }

  const material = await prisma.material.update({
    where: {
      id: materialId,
    },
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
  revalidatePath(`/dashboard/material/${materialId}`)
  revalidatePath("/dashboard/menu/create")

  return {
    success: true,
    message: "Material berhasil diperbarui",
    material,
  }
}

export async function deleteMaterialAction(materialId: number): Promise<MaterialMutationResult> {
  const existingMaterial = await prisma.material.findFirst({
    where: {
      id: materialId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  })

  if (!existingMaterial) {
    return {
      success: false,
      message: "Material tidak ditemukan",
    }
  }

  await prisma.material.update({
    where: {
      id: materialId,
    },
    data: {
      deletedAt: new Date(),
    },
  })

  revalidatePath("/dashboard/material")
  revalidatePath(`/dashboard/material/${materialId}`)
  revalidatePath("/dashboard/menu/create")

  return {
    success: true,
    message: "Material berhasil dihapus",
  }
}

export async function createMaterialFromMenuAction(
  values: z.input<typeof createMaterialQuickSchema>
): Promise<MaterialMutationResult> {
  return createMaterialAction(values)
}

const materialTransactionListQuerySchema = z.object({
  q: z.string().trim().optional(),
  type: z.enum(["ALL", "PURCHASE", "SELL", "ADJUSTMENT"]).default("ALL"),
  sortBy: z.enum(["createdAt", "updatedAt", "amount", "type"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().default(DEFAULT_PAGE_SIZE),
})

const materialPurchaseListQuerySchema = z.object({
  q: z.string().trim().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "invoiceNumber", "total"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().default(DEFAULT_PAGE_SIZE),
})

const materialAdjustmentListQuerySchema = z.object({
  q: z.string().trim().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "amount"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().default(DEFAULT_PAGE_SIZE),
})

const optionalNoteSchema = z
  .union([z.string().trim().max(1000), z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value))

const materialPurchaseItemSchema = z.object({
  materialId: z.number().int().positive("Material tidak valid"),
  amount: z.number().positive("Jumlah material harus lebih besar dari 0"),
  total: z.number().min(0, "Total harga tidak boleh negatif"),
})

const materialPurchaseFormSchema = z
  .object({
    invoiceNumber: z.string().trim().min(1, "Nomor invoice wajib diisi"),
    note: optionalNoteSchema,
    items: z.array(materialPurchaseItemSchema).min(1, "Minimal harus ada 1 item pembelian"),
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

const materialAdjustmentFormSchema = z.object({
  materialId: z.number().int().positive("Material tidak valid"),
  amount: z.number().refine((value) => value !== 0, {
    message: "Jumlah penyesuaian tidak boleh 0",
  }),
  note: optionalNoteSchema,
})

export type MaterialTransactionListQueryInput = z.input<typeof materialTransactionListQuerySchema>
export type MaterialPurchaseListQueryInput = z.input<typeof materialPurchaseListQuerySchema>
export type MaterialAdjustmentListQueryInput = z.input<typeof materialAdjustmentListQuerySchema>

export type MaterialTransactionListRow = {
  id: number
  materialId: number
  materialName: string
  materialUnit: "GRAM" | "ML" | "PIECE"
  type: "PURCHASE" | "SELL" | "ADJUSTMENT"
  amount: number
  note: string | null
  createdAt: Date
  purchase: {
    purchaseId: number
    invoiceNumber: string
    total: number
    itemAmount: number
    itemPrice: number
    itemTotal: number
  } | null
  sell: {
    orderId: number
    orderStatus: "PENDING" | "COMPLETED" | "CANCELLED"
    orderItemId: number
    orderItemAmount: number
    orderItemPrice: number
    orderItemTotal: number
    menuName: string
    orderNote: string | null
  } | null
}

export type MaterialTransactionDetail = MaterialTransactionListRow & {
  updatedAt: Date
}

export type MaterialTransactionListResult = {
  items: MaterialTransactionListRow[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  query: {
    q: string
    type: "ALL" | "PURCHASE" | "SELL" | "ADJUSTMENT"
    sortBy: "createdAt" | "updatedAt" | "amount" | "type"
    sortOrder: "asc" | "desc"
  }
}

export type MaterialPurchaseListRow = {
  id: number
  invoiceNumber: string
  note: string | null
  total: number
  itemCount: number
  createdAt: Date
  updatedAt: Date
}

export type MaterialPurchaseListResult = {
  items: MaterialPurchaseListRow[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  query: {
    q: string
    sortBy: "createdAt" | "updatedAt" | "invoiceNumber" | "total"
    sortOrder: "asc" | "desc"
  }
}

export type MaterialPurchaseDetail = {
  id: number
  invoiceNumber: string
  note: string | null
  total: number
  createdAt: Date
  updatedAt: Date
  items: Array<{
    id: number
    materialId: number
    materialName: string
    materialUnit: "GRAM" | "ML" | "PIECE"
    amount: number
    price: number
    total: number
  }>
}

export type MaterialPurchaseMutationResult = {
  success: boolean
  message: string
  purchaseId?: number
}

export type MaterialAdjustmentListRow = {
  id: number
  materialId: number
  materialName: string
  materialUnit: "GRAM" | "ML" | "PIECE"
  amount: number
  note: string | null
  createdAt: Date
  updatedAt: Date
}

export type MaterialAdjustmentListResult = {
  items: MaterialAdjustmentListRow[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  query: {
    q: string
    sortBy: "createdAt" | "updatedAt" | "amount"
    sortOrder: "asc" | "desc"
  }
}

export type MaterialAdjustmentMutationResult = {
  success: boolean
  message: string
  adjustmentId?: number
}

export async function getMaterialTransactionListAction(
  queryInput: MaterialTransactionListQueryInput
): Promise<MaterialTransactionListResult> {
  const parsedQuery = materialTransactionListQuerySchema.safeParse(queryInput)
  const query = parsedQuery.success
    ? parsedQuery.data
    : {
        q: "",
        type: "ALL" as const,
        sortBy: "createdAt" as const,
        sortOrder: "desc" as const,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      }

  const q = (query.q ?? "").trim()
  const pageSize = normalizePageSize(query.pageSize)
  const numericQuery = Number.parseInt(q, 10)
  const isNumericQuery = Number.isInteger(numericQuery)

  const whereCondition: Prisma.MaterialTransactionWhereInput = {
    deletedAt: null,
    ...(query.type !== "ALL" ? { type: query.type } : {}),
    ...(q
      ? {
          OR: [
            {
              material: {
                name: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            },
            {
              note: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              materialPurchaseItem: {
                materialPurchase: {
                  invoiceNumber: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
              },
            },
            ...(isNumericQuery
              ? [
                  {
                    orderItem: {
                      orderId: numericQuery,
                    },
                  },
                ]
              : []),
          ],
        }
      : {}),
  }

  const totalItems = await prisma.materialTransaction.count({ where: whereCondition })
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(query.page, totalPages)

  const transactions = await prisma.materialTransaction.findMany({
    where: whereCondition,
    select: {
      id: true,
      type: true,
      amount: true,
      note: true,
      createdAt: true,
      materialId: true,
      material: {
        select: {
          name: true,
          unit: true,
        },
      },
      materialPurchaseItem: {
        select: {
          amount: true,
          price: true,
          total: true,
          materialPurchase: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
            },
          },
        },
      },
      orderItem: {
        select: {
          id: true,
          amount: true,
          price: true,
          total: true,
          menu: {
            select: {
              name: true,
            },
          },
          order: {
            select: {
              id: true,
              status: true,
              note: true,
            },
          },
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
    items: transactions.map((transaction) => ({
      id: transaction.id,
      materialId: transaction.materialId,
      materialName: transaction.material.name,
      materialUnit: transaction.material.unit,
      type: transaction.type,
      amount: Number(transaction.amount),
      note: transaction.note,
      createdAt: transaction.createdAt,
      purchase: transaction.materialPurchaseItem
        ? {
            purchaseId: transaction.materialPurchaseItem.materialPurchase.id,
            invoiceNumber: transaction.materialPurchaseItem.materialPurchase.invoiceNumber,
            total: Number(transaction.materialPurchaseItem.materialPurchase.total),
            itemAmount: Number(transaction.materialPurchaseItem.amount),
            itemPrice: Number(transaction.materialPurchaseItem.price),
            itemTotal: Number(transaction.materialPurchaseItem.total),
          }
        : null,
      sell: transaction.orderItem
        ? {
            orderId: transaction.orderItem.order.id,
            orderStatus: transaction.orderItem.order.status,
            orderItemId: transaction.orderItem.id,
            orderItemAmount: transaction.orderItem.amount,
            orderItemPrice: Number(transaction.orderItem.price),
            orderItemTotal: Number(transaction.orderItem.total),
            menuName: transaction.orderItem.menu.name,
            orderNote: transaction.orderItem.order.note,
          }
        : null,
    })),
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    query: {
      q,
      type: query.type,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  }
}

export async function getMaterialTransactionDetailAction(
  transactionId: number
): Promise<MaterialTransactionDetail | null> {
  const transaction = await prisma.materialTransaction.findFirst({
    where: {
      id: transactionId,
      deletedAt: null,
    },
    select: {
      id: true,
      type: true,
      amount: true,
      note: true,
      createdAt: true,
      updatedAt: true,
      materialId: true,
      material: {
        select: {
          name: true,
          unit: true,
        },
      },
      materialPurchaseItem: {
        select: {
          amount: true,
          price: true,
          total: true,
          materialPurchase: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
            },
          },
        },
      },
      orderItem: {
        select: {
          id: true,
          amount: true,
          price: true,
          total: true,
          menu: {
            select: {
              name: true,
            },
          },
          order: {
            select: {
              id: true,
              status: true,
              note: true,
            },
          },
        },
      },
    },
  })

  if (!transaction) {
    return null
  }

  return {
    id: transaction.id,
    materialId: transaction.materialId,
    materialName: transaction.material.name,
    materialUnit: transaction.material.unit,
    type: transaction.type,
    amount: Number(transaction.amount),
    note: transaction.note,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
    purchase: transaction.materialPurchaseItem
      ? {
          purchaseId: transaction.materialPurchaseItem.materialPurchase.id,
          invoiceNumber: transaction.materialPurchaseItem.materialPurchase.invoiceNumber,
          total: Number(transaction.materialPurchaseItem.materialPurchase.total),
          itemAmount: Number(transaction.materialPurchaseItem.amount),
          itemPrice: Number(transaction.materialPurchaseItem.price),
          itemTotal: Number(transaction.materialPurchaseItem.total),
        }
      : null,
    sell: transaction.orderItem
      ? {
          orderId: transaction.orderItem.order.id,
          orderStatus: transaction.orderItem.order.status,
          orderItemId: transaction.orderItem.id,
          orderItemAmount: transaction.orderItem.amount,
          orderItemPrice: Number(transaction.orderItem.price),
          orderItemTotal: Number(transaction.orderItem.total),
          menuName: transaction.orderItem.menu.name,
          orderNote: transaction.orderItem.order.note,
        }
      : null,
  }
}

export async function getMaterialPurchaseListAction(
  queryInput: MaterialPurchaseListQueryInput
): Promise<MaterialPurchaseListResult> {
  const parsedQuery = materialPurchaseListQuerySchema.safeParse(queryInput)
  const query = parsedQuery.success
    ? parsedQuery.data
    : {
        q: "",
        sortBy: "createdAt" as const,
        sortOrder: "desc" as const,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      }

  const q = (query.q ?? "").trim()
  const pageSize = normalizePageSize(query.pageSize)

  const whereCondition: Prisma.MaterialPurchaseWhereInput = {
    deletedAt: null,
    ...(q
      ? {
          OR: [
            {
              invoiceNumber: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              note: {
                contains: q,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  }

  const totalItems = await prisma.materialPurchase.count({ where: whereCondition })
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(query.page, totalPages)

  const purchases = await prisma.materialPurchase.findMany({
    where: whereCondition,
    select: {
      id: true,
      invoiceNumber: true,
      note: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      materialPurchaseItems: {
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
    items: purchases.map((purchase) => ({
      id: purchase.id,
      invoiceNumber: purchase.invoiceNumber,
      note: purchase.note,
      total: Number(purchase.total),
      itemCount: purchase.materialPurchaseItems.length,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
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

export async function getMaterialPurchaseDetailAction(
  purchaseId: number
): Promise<MaterialPurchaseDetail | null> {
  const purchase = await prisma.materialPurchase.findFirst({
    where: {
      id: purchaseId,
      deletedAt: null,
    },
    select: {
      id: true,
      invoiceNumber: true,
      note: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      materialPurchaseItems: {
        where: {
          deletedAt: null,
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          materialId: true,
          amount: true,
          price: true,
          total: true,
          material: {
            select: {
              name: true,
              unit: true,
            },
          },
        },
      },
    },
  })

  if (!purchase) {
    return null
  }

  return {
    id: purchase.id,
    invoiceNumber: purchase.invoiceNumber,
    note: purchase.note,
    total: Number(purchase.total),
    createdAt: purchase.createdAt,
    updatedAt: purchase.updatedAt,
    items: purchase.materialPurchaseItems.map((item) => ({
      id: item.id,
      materialId: item.materialId,
      materialName: item.material.name,
      materialUnit: item.material.unit,
      amount: Number(item.amount),
      price: Number(item.price),
      total: Number(item.total),
    })),
  }
}

export async function createMaterialPurchaseAction(
  values: z.input<typeof materialPurchaseFormSchema>
): Promise<MaterialPurchaseMutationResult> {
  const validatedValues = materialPurchaseFormSchema.safeParse(values)

  if (!validatedValues.success) {
    return {
      success: false,
      message: validatedValues.error.issues[0]?.message ?? "Data pembelian material tidak valid",
    }
  }

  let purchaseId: number | undefined

  try {
    await prisma.$transaction(async (tx) => {
      const materialsExist = await ensureMaterialsExistForTransaction(
        tx,
        validatedValues.data.items.map((item) => item.materialId)
      )

      if (!materialsExist) {
        throw new Error("MATERIAL_NOT_FOUND")
      }

      const purchase = await tx.materialPurchase.create({
        data: {
          invoiceNumber: validatedValues.data.invoiceNumber,
          note: validatedValues.data.note ?? null,
          total: new Prisma.Decimal(0),
        },
        select: {
          id: true,
        },
      })

      purchaseId = purchase.id
      let purchaseTotal = new Prisma.Decimal(0)

      for (const item of validatedValues.data.items) {
        const itemAmount = toDecimal(item.amount)
        const itemTotal = toDecimal(item.total)
        const itemPrice = itemTotal.div(itemAmount)

        purchaseTotal = purchaseTotal.plus(itemTotal)

        const createdPurchaseItem = await tx.materialPurchaseItem.create({
          data: {
            materialPurchaseId: purchase.id,
            materialId: item.materialId,
            amount: itemAmount,
            price: itemPrice,
            total: itemTotal,
          },
          select: {
            id: true,
          },
        })

        await tx.materialTransaction.create({
          data: {
            materialId: item.materialId,
            type: "PURCHASE",
            amount: itemAmount,
            note: validatedValues.data.note ?? null,
            materialPurchaseItemId: createdPurchaseItem.id,
          },
        })
      }

      await tx.materialPurchase.update({
        where: {
          id: purchase.id,
        },
        data: {
          total: purchaseTotal,
        },
      })

      await refreshMaterialStockSnapshot(
        tx,
        validatedValues.data.items.map((item) => item.materialId)
      )
    })
  } catch (error) {
    if (error instanceof Error && error.message === "MATERIAL_NOT_FOUND") {
      return {
        success: false,
        message: "Material pada pembelian tidak ditemukan",
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        message: "Nomor invoice sudah digunakan",
      }
    }

    return {
      success: false,
      message: "Gagal menambahkan pembelian material",
    }
  }

  revalidatePath("/dashboard/material")
  revalidatePath("/dashboard/material/purchase")
  revalidatePath("/dashboard/material/purchase/create")
  revalidatePath("/dashboard/material/transaction")

  return {
    success: true,
    message: "Pembelian material berhasil ditambahkan",
    purchaseId,
  }
}

export async function updateMaterialPurchaseAction(
  purchaseId: number,
  values: z.input<typeof materialPurchaseFormSchema>
): Promise<MaterialPurchaseMutationResult> {
  const validatedValues = materialPurchaseFormSchema.safeParse(values)

  if (!validatedValues.success) {
    return {
      success: false,
      message: validatedValues.error.issues[0]?.message ?? "Data pembelian material tidak valid",
    }
  }

  const existingPurchase = await prisma.materialPurchase.findFirst({
    where: {
      id: purchaseId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  })

  if (!existingPurchase) {
    return {
      success: false,
      message: "Data pembelian tidak ditemukan",
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const materialsExist = await ensureMaterialsExistForTransaction(
        tx,
        validatedValues.data.items.map((item) => item.materialId)
      )

      if (!materialsExist) {
        throw new Error("MATERIAL_NOT_FOUND")
      }

      const oldItems = await tx.materialPurchaseItem.findMany({
        where: {
          materialPurchaseId: purchaseId,
          deletedAt: null,
        },
        select: {
          id: true,
          materialId: true,
        },
      })

      const oldMaterialIds = oldItems.map((item) => item.materialId)

      const now = new Date()

      if (oldItems.length > 0) {
        await tx.materialTransaction.updateMany({
          where: {
            materialPurchaseItemId: {
              in: oldItems.map((item) => item.id),
            },
            deletedAt: null,
          },
          data: {
            deletedAt: now,
          },
        })

        await tx.materialPurchaseItem.updateMany({
          where: {
            id: {
              in: oldItems.map((item) => item.id),
            },
            deletedAt: null,
          },
          data: {
            deletedAt: now,
          },
        })
      }

      let purchaseTotal = new Prisma.Decimal(0)

      for (const item of validatedValues.data.items) {
        const itemAmount = toDecimal(item.amount)
        const itemTotal = toDecimal(item.total)
        const itemPrice = itemTotal.div(itemAmount)

        purchaseTotal = purchaseTotal.plus(itemTotal)

        const createdPurchaseItem = await tx.materialPurchaseItem.create({
          data: {
            materialPurchaseId: purchaseId,
            materialId: item.materialId,
            amount: itemAmount,
            price: itemPrice,
            total: itemTotal,
          },
          select: {
            id: true,
          },
        })

        await tx.materialTransaction.create({
          data: {
            materialId: item.materialId,
            type: "PURCHASE",
            amount: itemAmount,
            note: validatedValues.data.note ?? null,
            materialPurchaseItemId: createdPurchaseItem.id,
          },
        })
      }

      await tx.materialPurchase.update({
        where: {
          id: purchaseId,
        },
        data: {
          invoiceNumber: validatedValues.data.invoiceNumber,
          note: validatedValues.data.note ?? null,
          total: purchaseTotal,
        },
      })

      await refreshMaterialStockSnapshot(tx, [
        ...oldMaterialIds,
        ...validatedValues.data.items.map((item) => item.materialId),
      ])
    })
  } catch (error) {
    if (error instanceof Error && error.message === "MATERIAL_NOT_FOUND") {
      return {
        success: false,
        message: "Material pada pembelian tidak ditemukan",
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        message: "Nomor invoice sudah digunakan",
      }
    }

    return {
      success: false,
      message: "Gagal memperbarui pembelian material",
    }
  }

  revalidatePath("/dashboard/material")
  revalidatePath("/dashboard/material/purchase")
  revalidatePath(`/dashboard/material/purchase/${purchaseId}`)
  revalidatePath("/dashboard/material/transaction")

  return {
    success: true,
    message: "Pembelian material berhasil diperbarui",
    purchaseId,
  }
}

export async function deleteMaterialPurchaseAction(
  purchaseId: number
): Promise<MaterialPurchaseMutationResult> {
  const purchase = await prisma.materialPurchase.findFirst({
    where: {
      id: purchaseId,
      deletedAt: null,
    },
    select: {
      id: true,
      invoiceNumber: true,
      materialPurchaseItems: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          materialId: true,
        },
      },
    },
  })

  if (!purchase) {
    return {
      success: false,
      message: "Data pembelian tidak ditemukan",
    }
  }

  await prisma.$transaction(async (tx) => {
    const now = new Date()
    const itemIds = purchase.materialPurchaseItems.map((item) => item.id)

    if (itemIds.length > 0) {
      await tx.materialTransaction.updateMany({
        where: {
          materialPurchaseItemId: {
            in: itemIds,
          },
          deletedAt: null,
        },
        data: {
          deletedAt: now,
        },
      })

      await tx.materialPurchaseItem.updateMany({
        where: {
          id: {
            in: itemIds,
          },
          deletedAt: null,
        },
        data: {
          deletedAt: now,
        },
      })
    }

    await tx.materialPurchase.update({
      where: {
        id: purchaseId,
      },
      data: {
        invoiceNumber: `${purchase.invoiceNumber}-${Date.now()}-deleted`,
        deletedAt: now,
      },
    })

    await refreshMaterialStockSnapshot(
      tx,
      purchase.materialPurchaseItems.map((item) => item.materialId)
    )
  })

  revalidatePath("/dashboard/material")
  revalidatePath("/dashboard/material/purchase")
  revalidatePath(`/dashboard/material/purchase/${purchaseId}`)
  revalidatePath("/dashboard/material/transaction")

  return {
    success: true,
    message: "Pembelian material berhasil dihapus",
  }
}

export async function getMaterialAdjustmentListAction(
  queryInput: MaterialAdjustmentListQueryInput
): Promise<MaterialAdjustmentListResult> {
  const parsedQuery = materialAdjustmentListQuerySchema.safeParse(queryInput)
  const query = parsedQuery.success
    ? parsedQuery.data
    : {
        q: "",
        sortBy: "createdAt" as const,
        sortOrder: "desc" as const,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      }

  const q = (query.q ?? "").trim()
  const pageSize = normalizePageSize(query.pageSize)

  const whereCondition: Prisma.MaterialTransactionWhereInput = {
    type: "ADJUSTMENT",
    deletedAt: null,
    ...(q
      ? {
          OR: [
            {
              material: {
                name: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            },
            {
              note: {
                contains: q,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  }

  const totalItems = await prisma.materialTransaction.count({ where: whereCondition })
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(query.page, totalPages)

  const adjustments = await prisma.materialTransaction.findMany({
    where: whereCondition,
    select: {
      id: true,
      materialId: true,
      amount: true,
      note: true,
      createdAt: true,
      updatedAt: true,
      material: {
        select: {
          name: true,
          unit: true,
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
    items: adjustments.map((adjustment) => ({
      id: adjustment.id,
      materialId: adjustment.materialId,
      materialName: adjustment.material.name,
      materialUnit: adjustment.material.unit,
      amount: Number(adjustment.amount),
      note: adjustment.note,
      createdAt: adjustment.createdAt,
      updatedAt: adjustment.updatedAt,
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

export async function createMaterialAdjustmentAction(
  values: z.input<typeof materialAdjustmentFormSchema>
): Promise<MaterialAdjustmentMutationResult> {
  const validatedValues = materialAdjustmentFormSchema.safeParse(values)

  if (!validatedValues.success) {
    return {
      success: false,
      message: validatedValues.error.issues[0]?.message ?? "Data penyesuaian tidak valid",
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const materialsExist = await ensureMaterialsExistForTransaction(tx, [
        validatedValues.data.materialId,
      ])

      if (!materialsExist) {
        throw new Error("MATERIAL_NOT_FOUND")
      }

      await tx.materialTransaction.create({
        data: {
          materialId: validatedValues.data.materialId,
          type: "ADJUSTMENT",
          amount: toDecimal(validatedValues.data.amount),
          note: validatedValues.data.note ?? null,
        },
      })

      await refreshMaterialStockSnapshot(tx, [validatedValues.data.materialId])
    })
  } catch (error) {
    if (error instanceof Error && error.message === "MATERIAL_NOT_FOUND") {
      return {
        success: false,
        message: "Material tidak ditemukan",
      }
    }

    return {
      success: false,
      message: "Gagal menambahkan penyesuaian material",
    }
  }

  revalidatePath("/dashboard/material/adjustment")
  revalidatePath("/dashboard/material/transaction")
  revalidatePath("/dashboard/material")
  revalidatePath(`/dashboard/material/${validatedValues.data.materialId}`)

  return {
    success: true,
    message: "Penyesuaian material berhasil ditambahkan",
  }
}

export async function updateMaterialAdjustmentAction(
  adjustmentId: number,
  values: z.input<typeof materialAdjustmentFormSchema>
): Promise<MaterialAdjustmentMutationResult> {
  const validatedValues = materialAdjustmentFormSchema.safeParse(values)

  if (!validatedValues.success) {
    return {
      success: false,
      message: validatedValues.error.issues[0]?.message ?? "Data penyesuaian tidak valid",
    }
  }

  const existingAdjustment = await prisma.materialTransaction.findFirst({
    where: {
      id: adjustmentId,
      type: "ADJUSTMENT",
      deletedAt: null,
    },
    select: {
      id: true,
      materialId: true,
    },
  })

  if (!existingAdjustment) {
    return {
      success: false,
      message: "Data penyesuaian tidak ditemukan",
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const materialsExist = await ensureMaterialsExistForTransaction(tx, [
        validatedValues.data.materialId,
      ])

      if (!materialsExist) {
        throw new Error("MATERIAL_NOT_FOUND")
      }

      await tx.materialTransaction.update({
        where: {
          id: adjustmentId,
        },
        data: {
          materialId: validatedValues.data.materialId,
          amount: toDecimal(validatedValues.data.amount),
          note: validatedValues.data.note ?? null,
        },
      })

      await refreshMaterialStockSnapshot(tx, [
        existingAdjustment.materialId,
        validatedValues.data.materialId,
      ])
    })
  } catch (error) {
    if (error instanceof Error && error.message === "MATERIAL_NOT_FOUND") {
      return {
        success: false,
        message: "Material tidak ditemukan",
      }
    }

    return {
      success: false,
      message: "Gagal memperbarui penyesuaian material",
    }
  }

  revalidatePath("/dashboard/material/adjustment")
  revalidatePath("/dashboard/material/transaction")
  revalidatePath("/dashboard/material")
  revalidatePath(`/dashboard/material/${existingAdjustment.materialId}`)
  revalidatePath(`/dashboard/material/${validatedValues.data.materialId}`)

  return {
    success: true,
    message: "Penyesuaian material berhasil diperbarui",
    adjustmentId,
  }
}

export async function deleteMaterialAdjustmentAction(
  adjustmentId: number
): Promise<MaterialAdjustmentMutationResult> {
  const existingAdjustment = await prisma.materialTransaction.findFirst({
    where: {
      id: adjustmentId,
      type: "ADJUSTMENT",
      deletedAt: null,
    },
    select: {
      id: true,
      materialId: true,
    },
  })

  if (!existingAdjustment) {
    return {
      success: false,
      message: "Data penyesuaian tidak ditemukan",
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.materialTransaction.update({
      where: {
        id: adjustmentId,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    await refreshMaterialStockSnapshot(tx, [existingAdjustment.materialId])
  })

  revalidatePath("/dashboard/material/adjustment")
  revalidatePath("/dashboard/material/transaction")
  revalidatePath("/dashboard/material")
  revalidatePath(`/dashboard/material/${existingAdjustment.materialId}`)

  return {
    success: true,
    message: "Penyesuaian material berhasil dihapus",
    adjustmentId,
  }
}
