"use server"

import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  orderFormSchema,
  posCheckoutFormSchema,
} from "@/components/order/order-form-schema"
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/constants/constants"
import {
  refreshMaterialStockSnapshot,
  toDecimal,
} from "@/lib/inventory"
import { prisma } from "@/lib/prisma"

const pageSizeEnum = z.enum(PAGE_SIZE_OPTIONS.map(String) as [string, ...string[]])

const orderListQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["ALL", "PENDING", "COMPLETED", "CANCELLED"]).default("ALL"),
  sortBy: z.enum(["createdAt", "updatedAt", "total", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().default(DEFAULT_PAGE_SIZE),
})

export type OrderListQueryInput = z.input<typeof orderListQuerySchema>

export type OrderListRow = {
  id: number
  customerName: string | null
  customerPhone: string | null
  status: "PENDING" | "COMPLETED" | "CANCELLED"
  total: number
  recordedBuyPrice: number
  recordedProfit: number
  itemCount: number
  createdAt: Date
  updatedAt: Date
}

export type OrderListResult = {
  items: OrderListRow[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  query: {
    q: string
    status: "ALL" | "PENDING" | "COMPLETED" | "CANCELLED"
    sortBy: "createdAt" | "updatedAt" | "total" | "status"
    sortOrder: "asc" | "desc"
  }
}

export type OrderDetail = {
  id: number
  customerId: number | null
  customerName: string | null
  customerPhone: string | null
  status: "PENDING" | "COMPLETED" | "CANCELLED"
  note: string | null
  total: number
  recordedBuyPrice: number
  recordedProfit: number
  createdAt: Date
  updatedAt: Date
  items: Array<{
    id: number
    menuId: number
    menuName: string
    amount: number
    price: number
    total: number
    recordedBuyPrice: number
  }>
}

export type OrderMenuOption = {
  id: number
  name: string
  price: number
  imageUrl: string | null
}

export type OrderCustomerOption = {
  id: number
  name: string
  phone: string
}

export type OrderMutationResult = {
  success: boolean
  message: string
  orderId?: number
}

function normalizePageSize(pageSize: number) {
  if (!pageSizeEnum.safeParse(String(pageSize)).success) {
    return DEFAULT_PAGE_SIZE
  }

  return pageSize
}

async function getActiveSellMaterialIds(tx: Prisma.TransactionClient, orderId: number) {
  const transactions = await tx.materialTransaction.findMany({
    where: {
      deletedAt: null,
      type: "SELL",
      orderItem: {
        orderId,
      },
    },
    select: {
      materialId: true,
    },
  })

  return transactions.map((transaction) => transaction.materialId)
}

async function createOrderItemsAndSellTransactions(
  tx: Prisma.TransactionClient,
  orderId: number,
  items: Array<{ menuId: number; amount: number }>,
  shouldAffectStock: boolean
) {
  const menus = await tx.menu.findMany({
    where: {
      id: {
        in: items.map((item) => item.menuId),
      },
      deletedAt: null,
    },
    select: {
      id: true,
      price: true,
      recipes: {
        where: {
          deletedAt: null,
          material: {
            deletedAt: null,
          },
        },
        select: {
          materialId: true,
          amount: true,
          material: {
            select: {
              recordedBuyPrice: true,
            },
          },
        },
      },
    },
  })

  if (menus.length !== items.length) {
    throw new Error("MENU_NOT_FOUND")
  }

  if (menus.some((menu) => menu.recipes.length === 0)) {
    throw new Error("MENU_RECIPE_EMPTY")
  }

  const menusById = new Map(menus.map((menu) => [menu.id, menu]))
  let orderTotal = new Prisma.Decimal(0)
  let orderRecordedBuyPrice = new Prisma.Decimal(0)
  const affectedMaterialIds: number[] = []

  for (const item of items) {
    const menu = menusById.get(item.menuId)

    if (!menu) {
      throw new Error("MENU_NOT_FOUND")
    }

    const quantity = new Prisma.Decimal(item.amount)
    const price = toDecimal(menu.price)
    const total = price.mul(quantity)
    let itemRecordedBuyPrice = new Prisma.Decimal(0)

    for (const recipe of menu.recipes) {
      const requiredAmount = toDecimal(recipe.amount).mul(quantity)
      const materialBuyPrice = toDecimal(recipe.material.recordedBuyPrice)

      itemRecordedBuyPrice = itemRecordedBuyPrice.plus(requiredAmount.mul(materialBuyPrice))
    }

    const createdOrderItem = await tx.orderItem.create({
      data: {
        orderId,
        menuId: item.menuId,
        amount: item.amount,
        price,
        total,
        recordedBuyPrice: itemRecordedBuyPrice,
      },
      select: {
        id: true,
      },
    })

    if (shouldAffectStock) {
      for (const recipe of menu.recipes) {
        const sellAmount = toDecimal(recipe.amount).mul(quantity).negated()
        affectedMaterialIds.push(recipe.materialId)

        await tx.materialTransaction.create({
          data: {
            materialId: recipe.materialId,
            type: "SELL",
            amount: sellAmount,
            note: `Order #${orderId}`,
            orderItemId: createdOrderItem.id,
          },
        })
      }
    }

    orderTotal = orderTotal.plus(total)
    orderRecordedBuyPrice = orderRecordedBuyPrice.plus(itemRecordedBuyPrice)
  }

  await tx.order.update({
    where: {
      id: orderId,
    },
    data: {
      total: orderTotal,
      recordedBuyPrice: orderRecordedBuyPrice,
      recordedProfit: orderTotal.minus(orderRecordedBuyPrice),
    },
  })

  return affectedMaterialIds
}

export async function getOrderFormOptionsAction() {
  const [menus, customers] = await Promise.all([
    prisma.menu.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.customer.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ])

  return {
    menus: menus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      price: Number(menu.price),
      imageUrl: menu.imageUrl,
    })),
    customers,
  }
}

export async function getOrderListAction(queryInput: OrderListQueryInput): Promise<OrderListResult> {
  const parsedQuery = orderListQuerySchema.safeParse(queryInput)
  const query = parsedQuery.success
    ? parsedQuery.data
    : {
        q: "",
        status: "ALL" as const,
        sortBy: "createdAt" as const,
        sortOrder: "desc" as const,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      }

  const q = (query.q ?? "").trim()
  const pageSize = normalizePageSize(query.pageSize)
  const orderIdQuery = Number.parseInt(q, 10)
  const isOrderIdQuery = Number.isInteger(orderIdQuery)

  const whereCondition: Prisma.OrderWhereInput = {
    deletedAt: null,
    ...(query.status !== "ALL" ? { status: query.status } : {}),
    ...(q
      ? {
          OR: [
            ...(isOrderIdQuery ? [{ id: orderIdQuery }] : []),
            {
              customer: {
                name: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            },
            {
              customer: {
                phone: {
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

  const totalItems = await prisma.order.count({ where: whereCondition })
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(query.page, totalPages)

  const orders = await prisma.order.findMany({
    where: whereCondition,
    select: {
      id: true,
      status: true,
      total: true,
      recordedBuyPrice: true,
      recordedProfit: true,
      createdAt: true,
      updatedAt: true,
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
      orderItems: {
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
    items: orders.map((order) => ({
      id: order.id,
      customerName: order.customer?.name ?? null,
      customerPhone: order.customer?.phone ?? null,
      status: order.status,
      total: Number(order.total),
      recordedBuyPrice: Number(order.recordedBuyPrice),
      recordedProfit: Number(order.recordedProfit),
      itemCount: order.orderItems.length,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    })),
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    query: {
      q,
      status: query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  }
}

export async function getOrderDetailAction(orderId: number): Promise<OrderDetail | null> {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      deletedAt: null,
    },
    select: {
      id: true,
      customerId: true,
      status: true,
      note: true,
      total: true,
      recordedBuyPrice: true,
      recordedProfit: true,
      createdAt: true,
      updatedAt: true,
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
      orderItems: {
        where: {
          deletedAt: null,
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          menuId: true,
          amount: true,
          price: true,
          total: true,
          recordedBuyPrice: true,
          menu: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  if (!order) {
    return null
  }

  return {
    id: order.id,
    customerId: order.customerId,
    customerName: order.customer?.name ?? null,
    customerPhone: order.customer?.phone ?? null,
    status: order.status,
    note: order.note,
    total: Number(order.total),
    recordedBuyPrice: Number(order.recordedBuyPrice),
    recordedProfit: Number(order.recordedProfit),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.orderItems.map((item) => ({
      id: item.id,
      menuId: item.menuId,
      menuName: item.menu.name,
      amount: item.amount,
      price: Number(item.price),
      total: Number(item.total),
      recordedBuyPrice: Number(item.recordedBuyPrice),
    })),
  }
}

export async function createOrderFromPosAction(
  values: z.input<typeof posCheckoutFormSchema>
): Promise<OrderMutationResult> {
  const validatedValues = posCheckoutFormSchema.safeParse(values)

  if (!validatedValues.success) {
    return {
      success: false,
      message: validatedValues.error.issues[0]?.message ?? "Data order tidak valid",
    }
  }

  let orderId: number | undefined

  try {
    await prisma.$transaction(async (tx) => {
      let customerId: number | null = null

      if (validatedValues.data.customerMode === "EXISTING") {
        customerId = validatedValues.data.customerId ?? null
      }

      if (validatedValues.data.customerMode === "NEW") {
        const customer = await tx.customer.create({
          data: {
            name: validatedValues.data.customerName ?? "",
            phone: validatedValues.data.customerPhone ?? "",
          },
          select: {
            id: true,
          },
        })

        customerId = customer.id
      }

      const order = await tx.order.create({
        data: {
          customerId,
          status: "PENDING",
          note: validatedValues.data.note ?? null,
        },
        select: {
          id: true,
        },
      })

      orderId = order.id
      const affectedMaterialIds = await createOrderItemsAndSellTransactions(
        tx,
        order.id,
        validatedValues.data.items,
        true
      )

      await refreshMaterialStockSnapshot(tx, affectedMaterialIds)
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        message: "Nomor customer sudah digunakan",
      }
    }

    if (error instanceof Error && error.message === "MENU_NOT_FOUND") {
      return {
        success: false,
        message: "Menu pada order tidak ditemukan",
      }
    }

    if (error instanceof Error && error.message === "MENU_RECIPE_EMPTY") {
      return {
        success: false,
        message: "Menu pada order belum memiliki resep",
      }
    }

    return {
      success: false,
      message: "Gagal membuat order",
    }
  }

  revalidatePath("/dashboard/order")
  revalidatePath("/dashboard/order/point-of-sales")
  revalidatePath("/dashboard/material")
  revalidatePath("/dashboard/material/transaction")

  return {
    success: true,
    message: "Order berhasil dibuat",
    orderId,
  }
}

export async function updateOrderAction(
  orderId: number,
  values: z.input<typeof orderFormSchema>
): Promise<OrderMutationResult> {
  const validatedValues = orderFormSchema.safeParse(values)

  if (!validatedValues.success) {
    return {
      success: false,
      message: validatedValues.error.issues[0]?.message ?? "Data order tidak valid",
    }
  }

  const existingOrder = await prisma.order.findFirst({
    where: {
      id: orderId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  })

  if (!existingOrder) {
    return {
      success: false,
      message: "Order tidak ditemukan",
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const oldMaterialIds = await getActiveSellMaterialIds(tx, orderId)
      const oldItems = await tx.orderItem.findMany({
        where: {
          orderId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      })

      const now = new Date()

      if (oldItems.length > 0) {
        await tx.materialTransaction.updateMany({
          where: {
            orderItemId: {
              in: oldItems.map((item) => item.id),
            },
            deletedAt: null,
          },
          data: {
            deletedAt: now,
          },
        })

        await tx.orderItem.updateMany({
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

      await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          customerId: validatedValues.data.customerId ?? null,
          status: validatedValues.data.status,
          note: validatedValues.data.note ?? null,
        },
      })

      const newMaterialIds = await createOrderItemsAndSellTransactions(
        tx,
        orderId,
        validatedValues.data.items,
        validatedValues.data.status !== "CANCELLED"
      )

      await refreshMaterialStockSnapshot(tx, [...oldMaterialIds, ...newMaterialIds])
    })
  } catch (error) {
    if (error instanceof Error && error.message === "MENU_NOT_FOUND") {
      return {
        success: false,
        message: "Menu pada order tidak ditemukan",
      }
    }

    if (error instanceof Error && error.message === "MENU_RECIPE_EMPTY") {
      return {
        success: false,
        message: "Menu pada order belum memiliki resep",
      }
    }

    return {
      success: false,
      message: "Gagal memperbarui order",
    }
  }

  revalidatePath("/dashboard/order")
  revalidatePath(`/dashboard/order/${orderId}`)
  revalidatePath(`/dashboard/order/point-of-sales/${orderId}`)
  revalidatePath("/dashboard/material")
  revalidatePath("/dashboard/material/transaction")

  return {
    success: true,
    message: "Order berhasil diperbarui",
    orderId,
  }
}

export async function completePendingOrderAction(orderId: number): Promise<OrderMutationResult> {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      deletedAt: null,
      status: "PENDING",
    },
    select: {
      id: true,
    },
  })

  if (!order) {
    return {
      success: false,
      message: "Order pending tidak ditemukan",
    }
  }

  await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status: "COMPLETED",
    },
  })

  revalidatePath("/dashboard/order")
  revalidatePath(`/dashboard/order/${orderId}`)
  revalidatePath(`/dashboard/order/point-of-sales/${orderId}`)

  return {
    success: true,
    message: "Order berhasil diselesaikan",
    orderId,
  }
}

export async function cancelPendingOrderAction(orderId: number): Promise<OrderMutationResult> {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      deletedAt: null,
      status: "PENDING",
    },
    select: {
      id: true,
    },
  })

  if (!order) {
    return {
      success: false,
      message: "Order pending tidak ditemukan",
    }
  }

  await prisma.$transaction(async (tx) => {
    const materialIds = await getActiveSellMaterialIds(tx, orderId)

    await tx.materialTransaction.updateMany({
      where: {
        deletedAt: null,
        orderItem: {
          orderId,
        },
      },
      data: {
        deletedAt: new Date(),
      },
    })

    await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "CANCELLED",
      },
    })

    await refreshMaterialStockSnapshot(tx, materialIds)
  })

  revalidatePath("/dashboard/order")
  revalidatePath(`/dashboard/order/${orderId}`)
  revalidatePath(`/dashboard/order/point-of-sales/${orderId}`)
  revalidatePath("/dashboard/material")
  revalidatePath("/dashboard/material/transaction")

  return {
    success: true,
    message: "Order berhasil dibatalkan",
    orderId,
  }
}

export async function deleteOrderAction(orderId: number): Promise<OrderMutationResult> {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  })

  if (!order) {
    return {
      success: false,
      message: "Order tidak ditemukan",
    }
  }

  await prisma.$transaction(async (tx) => {
    const materialIds = await getActiveSellMaterialIds(tx, orderId)
    const now = new Date()
    const items = await tx.orderItem.findMany({
      where: {
        orderId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    })

    if (items.length > 0) {
      await tx.materialTransaction.updateMany({
        where: {
          orderItemId: {
            in: items.map((item) => item.id),
          },
          deletedAt: null,
        },
        data: {
          deletedAt: now,
        },
      })

      await tx.orderItem.updateMany({
        where: {
          id: {
            in: items.map((item) => item.id),
          },
          deletedAt: null,
        },
        data: {
          deletedAt: now,
        },
      })
    }

    await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        deletedAt: now,
      },
    })

    await refreshMaterialStockSnapshot(tx, materialIds)
  })

  revalidatePath("/dashboard/order")
  revalidatePath(`/dashboard/order/${orderId}`)
  revalidatePath(`/dashboard/order/point-of-sales/${orderId}`)
  revalidatePath("/dashboard/material")
  revalidatePath("/dashboard/material/transaction")

  return {
    success: true,
    message: "Order berhasil dihapus",
    orderId,
  }
}
