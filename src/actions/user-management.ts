"use server"

import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const DEFAULT_USER_PASSWORD = "12345678"

const pageSizeOptions = [10, 20, 50] as const
const pageSizeEnum = z.enum(pageSizeOptions.map(String) as [string, ...string[]])

const userListQuerySchema = z.object({
  q: z.string().trim().optional(),
  sortBy: z.enum(["name", "email", "createdAt", "updatedAt"]).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().default(10),
})

const userCreateSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter"),
  email: z.string().trim().email("Email tidak valid"),
})

type MutationResult = {
  success: boolean
  message: string
}

async function getSuperadminUser() {
  return prisma.user.findFirst({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  })
}

async function getManagePermissionContext() {
  const [sessionUser, superadmin] = await Promise.all([getSessionUser(), getSuperadminUser()])

  if (!sessionUser || !superadmin) {
    return {
      sessionUser,
      superadmin,
      isSuperadminActor: false,
    }
  }

  return {
    sessionUser,
    superadmin,
    isSuperadminActor: sessionUser.id === superadmin.id,
  }
}

function normalizePageSize(pageSize: number) {
  if (!pageSizeEnum.safeParse(String(pageSize)).success) {
    return 10
  }

  return pageSize
}

export async function getUserListAction(queryInput: {
  q?: string
  sortBy?: "name" | "email" | "createdAt" | "updatedAt"
  sortOrder?: "asc" | "desc"
  page?: string | number
  pageSize?: string | number
}) {
  const parsedQuery = userListQuerySchema.safeParse(queryInput)

  const query = parsedQuery.success
    ? parsedQuery.data
    : {
        q: "",
        sortBy: "updatedAt" as const,
        sortOrder: "desc" as const,
        page: 1,
        pageSize: 10,
      }

  const q = (query.q ?? "").trim()
  const pageSize = normalizePageSize(query.pageSize)

  const whereCondition: Prisma.UserWhereInput = {
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
              email: {
                contains: q,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  }

  const [{ superadmin, isSuperadminActor }, totalItems] = await Promise.all([
    getManagePermissionContext(),
    prisma.user.count({ where: whereCondition }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(query.page, totalPages)

  const users = await prisma.user.findMany({
    where: whereCondition,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      [query.sortBy]: query.sortOrder,
    },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })

  return {
    items: users.map((user) => ({
      ...user,
      isSuperadmin: user.id === superadmin?.id,
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
    actorCanManage: isSuperadminActor,
  }
}

export async function getUserDetailAction(userId: number) {
  const [context, user] = await Promise.all([
    getManagePermissionContext(),
    prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ])

  if (!user) {
    return null
  }

  const isTargetSuperadmin = user.id === context.superadmin?.id

  return {
    ...user,
    isSuperadmin: isTargetSuperadmin,
    actorCanManage: context.isSuperadminActor,
    canResetPassword: context.isSuperadminActor,
    canDelete: context.isSuperadminActor && !isTargetSuperadmin,
  }
}

export async function createUserAction(values: { name: string; email: string }): Promise<MutationResult> {
  const validatedValues = userCreateSchema.safeParse(values)

  if (!validatedValues.success) {
    return {
      success: false,
      message: validatedValues.error.issues[0]?.message ?? "Data user tidak valid",
    }
  }

  const context = await getManagePermissionContext()

  if (!context.isSuperadminActor) {
    return {
      success: false,
      message: "Hanya superadmin yang dapat menambah user",
    }
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_USER_PASSWORD, 12)

  try {
    await prisma.user.create({
      data: {
        name: validatedValues.data.name,
        email: validatedValues.data.email,
        password: hashedPassword,
      },
    })

    revalidatePath("/dashboard/user")

    return {
      success: true,
      message: "User berhasil ditambahkan. Password default: 12345678",
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        message: "Email sudah digunakan",
      }
    }

    return {
      success: false,
      message: "Gagal menambahkan user",
    }
  }
}

export async function resetUserPasswordAction(userId: number): Promise<MutationResult> {
  const context = await getManagePermissionContext()

  if (!context.isSuperadminActor) {
    return {
      success: false,
      message: "Hanya superadmin yang dapat mereset password user",
    }
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  })

  if (!targetUser) {
    return {
      success: false,
      message: "User tidak ditemukan",
    }
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_USER_PASSWORD, 12)

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  })

  revalidatePath("/dashboard/user")
  revalidatePath(`/dashboard/user/${userId}`)

  return {
    success: true,
    message: "Password berhasil direset ke 12345678",
  }
}

export async function deleteUserAction(userId: number): Promise<MutationResult> {
  const context = await getManagePermissionContext()

  if (!context.isSuperadminActor) {
    return {
      success: false,
      message: "Hanya superadmin yang dapat menghapus user",
    }
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
    },
  })

  if (!targetUser) {
    return {
      success: false,
      message: "User tidak ditemukan",
    }
  }

  if (targetUser.id === context.superadmin?.id) {
    return {
      success: false,
      message: "Superadmin tidak dapat dihapus",
    }
  }

  const timestamp = Date.now()

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      deletedAt: new Date(),
      email: `${targetUser.email}-${timestamp}-deleted`,
    },
  })

  revalidatePath("/dashboard/user")
  revalidatePath(`/dashboard/user/${userId}`)

  return {
    success: true,
    message: "User berhasil dihapus",
  }
}
