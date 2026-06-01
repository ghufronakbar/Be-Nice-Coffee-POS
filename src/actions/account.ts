"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

import {
  accountPasswordSchema,
  accountProfileSchema,
  type AccountPasswordInputValues,
  type AccountProfileInputValues,
} from "@/components/account/account-form-schema"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type AccountMutationResult = {
  success: boolean
  message: string
}

export async function getMyAccountAction() {
  const sessionUser = await getSessionUser()

  if (!sessionUser) {
    return null
  }

  const user = await prisma.user.findFirst({
    where: {
      id: sessionUser.id,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return user
}

export async function updateMyProfileAction(
  values: AccountProfileInputValues
): Promise<AccountMutationResult> {
  const validatedValues = accountProfileSchema.safeParse(values)

  if (!validatedValues.success) {
    return {
      success: false,
      message: validatedValues.error.issues[0]?.message ?? "Data profil tidak valid",
    }
  }

  const sessionUser = await getSessionUser()

  if (!sessionUser) {
    return {
      success: false,
      message: "Sesi login tidak valid, silakan login kembali",
    }
  }

  await prisma.user.update({
    where: {
      id: sessionUser.id,
    },
    data: {
      name: validatedValues.data.name,
    },
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/account")

  return {
    success: true,
    message: "Profil berhasil diperbarui",
  }
}

export async function changeMyPasswordAction(
  values: AccountPasswordInputValues
): Promise<AccountMutationResult> {
  const validatedValues = accountPasswordSchema.safeParse(values)

  if (!validatedValues.success) {
    return {
      success: false,
      message: validatedValues.error.issues[0]?.message ?? "Data password tidak valid",
    }
  }

  const sessionUser = await getSessionUser()

  if (!sessionUser) {
    return {
      success: false,
      message: "Sesi login tidak valid, silakan login kembali",
    }
  }

  const user = await prisma.user.findFirst({
    where: {
      id: sessionUser.id,
      deletedAt: null,
    },
    select: {
      id: true,
      password: true,
    },
  })

  if (!user) {
    return {
      success: false,
      message: "User tidak ditemukan",
    }
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    validatedValues.data.currentPassword,
    user.password
  )

  if (!isCurrentPasswordValid) {
    return {
      success: false,
      message: "Password lama tidak sesuai",
    }
  }

  const hashedPassword = await bcrypt.hash(validatedValues.data.newPassword, 12)

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
    },
  })

  revalidatePath("/dashboard/account")

  return {
    success: true,
    message: "Password berhasil diperbarui",
  }
}
