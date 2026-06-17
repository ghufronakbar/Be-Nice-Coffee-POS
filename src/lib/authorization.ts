import { redirect } from "next/navigation"

import { getSessionUser } from "@/lib/auth"
import {
  type AccessField,
  hasAccess,
  resolveDashboardLandingPath,
} from "@/lib/access-control"

export async function requireDashboardAccess(access: AccessField) {
  const user = await getSessionUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (!hasAccess(user, access)) {
    redirect(resolveDashboardLandingPath(user))
  }

  return user
}
