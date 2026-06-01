"use server"

import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { customerFormSchema } from "@/components/customer/customer-form-schema"
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/constants/constants"
import { prisma } from "@/lib/prisma"

const pageSizeEnum = z.enum(PAGE_SIZE_OPTIONS.map(String) as [string, ...string[]])

const customerListQuerySchema = z.object({
  q: z.string().trim().optional(),
  sortBy: z.enum(["name", "phone", "createdAt", "updatedAt"]).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().default(DEFAULT_PAGE_SIZE),
})

export type CustomerListQueryInput = z.input<typeof customerListQuerySchema>

export type CustomerListRow = {
  id: number
  name: string
  phone: string
  orderCount: number
  totalOrderValue: number
  updatedAt: Date
}

export type CustomerListResult = {
  items: CustomerListRow[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  query: {
    q: string
    sortBy: "name" | "phone" | "createdAt" | "updatedAt"
    sortOrder: "asc" | "desc"
  }
}

export type CustomerMutationResult = {
  success: boolean
  message: string
  customerId?: number
}

export type CustomerDetail = {
  id: number
  name: string
  phone: string
  createdAt: Date
  updatedAt: Date
  orders: Array<{
    id: number
    status: "PENDING" | "COMPLETED" | "CANCELLED"
    total: number
    recordedBuyPrice: number
    recordedProfit: number
    itemCount: number
    note: string | null
    createdAt: Date
  }>
  summary: {
    orderCount: number
    totalOrderValue: number
    totalProfit: number
  }
}

function normalizePageSize(pageSize: number) {
  if (!pageSizeEnum.safeParse(String(pageSize)).success) {
    return DEFAULT_PAGE_SIZE
  }

  return pageSize
}

export async function getCustomerListAction(
  queryInput: CustomerListQueryInput
): Promise<CustomerListResult> {
  const parsedQuery = customerListQuerySchema.safeParse(queryInput)

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

  const whereCondition: Prisma.CustomerWhereInput = {
    deletedAt: null,
    ...(q
      ? {
          OR: [
            {
              name: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: q,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  }

  const totalItems = await prisma.customer.count({ where: whereCondition })
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(query.page, totalPages)

  const customers = await prisma.customer.findMany({
    where: whereCondition,
    select: {
      id: true,
      name: true,
      phone: true,
      updatedAt: true,
      orders: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          total: true,
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
    items: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      orderCount: customer.orders.length,
      totalOrderValue: customer.orders.reduce(
        (totalAmount, order) => totalAmount + Number(order.total),
        0
      ),
      updatedAt: customer.updatedAt,
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

export async function getCustomerDetailAction(customerId: number): Promise<CustomerDetail | null> {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      orders: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          total: true,
          recordedBuyPrice: true,
          recordedProfit: true,
          note: true,
          createdAt: true,
          orderItems: {
            where: {
              deletedAt: null,
            },
            select: {
              id: true,
            },
          },
        },
      },
    },
  })

  if (!customer) {
    return null
  }

  const orders = customer.orders.map((order) => ({
    id: order.id,
    status: order.status,
    total: Number(order.total),
    recordedBuyPrice: Number(order.recordedBuyPrice),
    recordedProfit: Number(order.recordedProfit),
    itemCount: order.orderItems.length,
    note: order.note,
    createdAt: order.createdAt,
  }))

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    orders,
    summary: {
      orderCount: orders.length,
      totalOrderValue: orders.reduce((totalAmount, order) => totalAmount + order.total, 0),
      totalProfit: orders.reduce((totalAmount, order) => totalAmount + order.recordedProfit, 0),
    },
  }
}

export async function createCustomerAction(
  values: z.input<typeof customerFormSchema>
): Promise<CustomerMutationResult> {
  const validatedValues = customerFormSchema.safeParse(values)

  if (!validatedValues.success) {
    return {
      success: false,
      message: validatedValues.error.issues[0]?.message ?? "Data customer tidak valid",
    }
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        name: validatedValues.data.name,
        phone: validatedValues.data.phone,
      },
      select: {
        id: true,
      },
    })

    revalidatePath("/dashboard/customer")
    revalidatePath(`/dashboard/customer/${customer.id}`)

    return {
      success: true,
      message: "Customer berhasil ditambahkan",
      customerId: customer.id,
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        message: "Nomor customer sudah digunakan",
      }
    }

    return {
      success: false,
      message: "Gagal menambahkan customer",
    }
  }
}

export async function updateCustomerAction(
  customerId: number,
  values: z.input<typeof customerFormSchema>
): Promise<CustomerMutationResult> {
  const validatedValues = customerFormSchema.safeParse(values)

  if (!validatedValues.success) {
    return {
      success: false,
      message: validatedValues.error.issues[0]?.message ?? "Data customer tidak valid",
    }
  }

  const existingCustomer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  })

  if (!existingCustomer) {
    return {
      success: false,
      message: "Customer tidak ditemukan",
    }
  }

  try {
    await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        name: validatedValues.data.name,
        phone: validatedValues.data.phone,
      },
    })

    revalidatePath("/dashboard/customer")
    revalidatePath(`/dashboard/customer/${customerId}`)

    return {
      success: true,
      message: "Customer berhasil diperbarui",
      customerId,
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        message: "Nomor customer sudah digunakan",
      }
    }

    return {
      success: false,
      message: "Gagal memperbarui customer",
    }
  }
}

export async function deleteCustomerAction(customerId: number): Promise<CustomerMutationResult> {
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      deletedAt: null,
    },
    select: {
      id: true,
      phone: true,
    },
  })

  if (!existingCustomer) {
    return {
      success: false,
      message: "Customer tidak ditemukan",
    }
  }

  const timestamp = Date.now()

  await prisma.customer.update({
    where: {
      id: customerId,
    },
    data: {
      deletedAt: new Date(),
      phone: `${existingCustomer.phone}-${timestamp}-deleted`,
    },
  })

  revalidatePath("/dashboard/customer")
  revalidatePath(`/dashboard/customer/${customerId}`)

  return {
    success: true,
    message: "Customer berhasil dihapus",
  }
}
