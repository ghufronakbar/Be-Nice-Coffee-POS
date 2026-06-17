import { createHmac } from "node:crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SESSION_MAX_AGE_SECONDS } from "@/constants/constants"
import { env } from "@/constants/env"
import { ACCESS_SELECT, resolveUserAccess } from "@/lib/access-control"
import { prisma } from "@/lib/prisma"

function buildSessionSignature(payload: string) {
  return createHmac("sha256", env.SESSION_SECRET).update(payload).digest("hex")
}

function serializeSession(userId: number) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  const payload = `${userId}.${expiresAt}`
  const signature = buildSessionSignature(payload)
  return `${payload}.${signature}`
}

function parseSession(token: string | undefined) {
  if (!token) {
    return null
  }

  const [userIdRaw, expiresAtRaw, signature] = token.split(".")

  if (!userIdRaw || !expiresAtRaw || !signature) {
    return null
  }

  const payload = `${userIdRaw}.${expiresAtRaw}`
  const expectedSignature = buildSessionSignature(payload)

  if (expectedSignature !== signature) {
    return null
  }

  const expiresAt = Number(expiresAtRaw)
  const userId = Number(userIdRaw)

  if (!Number.isInteger(userId) || Number.isNaN(expiresAt) || expiresAt < Date.now()) {
    return null
  }

  return { userId }
}

export async function createSession(userId: number) {
  const cookieStore = await cookies()

  cookieStore.set({
    name: env.SESSION_COOKIE_NAME,
    value: serializeSession(userId),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(env.SESSION_COOKIE_NAME)
}

export async function getSessionUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(env.SESSION_COOKIE_NAME)?.value
  const session = parseSession(token)

  if (!session) {
    return null
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      isSuperAdmin: true,
      ...ACCESS_SELECT,
    },
  })

  if (!user) {
    return null
  }

  return {
    ...user,
    access: resolveUserAccess(user),
  }
}

export async function requireSessionUser() {
  const user = await getSessionUser()

  if (!user) {
    redirect("/auth/login")
  }

  return user
}
