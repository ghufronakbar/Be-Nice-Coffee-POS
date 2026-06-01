"use server"

import bcrypt from "bcryptjs"
import { z } from "zod"
import { redirect } from "next/navigation"

import { clearSession, createSession, getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type FormFieldErrors = {
  name?: string[]
  email?: string[]
  password?: string[]
  confirmPassword?: string[]
}

export type AuthActionState = {
  message: string | null
  fieldErrors?: FormFieldErrors
}

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
})

const firstTimeSetupSchema = z
  .object({
    name: z.string().min(3, "Nama minimal 3 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  })

export async function getAuthSetupState() {
  const [totalUser, sessionUser] = await Promise.all([
    prisma.user.count({
      where: {
        deletedAt: null,
      },
    }),
    getSessionUser(),
  ])

  return {
    hasAnyUser: totalUser > 0,
    sessionUser,
  }
}

export async function getSessionAuthUser() {
  return getSessionUser()
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    return {
      message: "Data login tidak valid",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const user = await prisma.user.findFirst({
    where: {
      email: validatedFields.data.email,
      deletedAt: null,
    },
  })

  if (!user) {
    return {
      message: "Email atau password salah",
    }
  }

  const isPasswordValid = await bcrypt.compare(validatedFields.data.password, user.password)

  if (!isPasswordValid) {
    return {
      message: "Email atau password salah",
    }
  }

  await createSession(user.id)
  redirect("/dashboard")
}

export async function firstTimeSetupAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const hasAnyUser = await prisma.user.count({
    where: {
      deletedAt: null,
    },
  })

  if (hasAnyUser > 0) {
    return {
      message: "First time setup sudah tidak tersedia karena user sudah ada",
    }
  }

  const validatedFields = firstTimeSetupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!validatedFields.success) {
    return {
      message: "Data pendaftaran tidak valid",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const hashedPassword = await bcrypt.hash(validatedFields.data.password, 12)

  const user = await prisma.user.create({
    data: {
      name: validatedFields.data.name,
      email: validatedFields.data.email,
      password: hashedPassword,
    },
  })

  await createSession(user.id)
  redirect("/dashboard")
}

export async function logoutAction() {
  await clearSession()
  redirect("/auth/login")
}
