import { redirect } from "next/navigation"

import { getAuthSetupState } from "@/actions/user"
import { resolveDashboardLandingPath } from "@/lib/access-control"

export default async function AuthPage() {
  const { hasAnyUser, sessionUser } = await getAuthSetupState()

  if (sessionUser) {
    redirect(resolveDashboardLandingPath(sessionUser))
  }

  if (!hasAnyUser) {
    redirect("/auth/first-time-setup")
  }

  redirect("/auth/login")
}
