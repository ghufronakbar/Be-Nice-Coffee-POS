import { redirect } from "next/navigation"

import { getSessionAuthUser } from "@/actions/user"
import { resolveDashboardLandingPath } from "@/lib/access-control"

export default async function HomePage() {
  const user = await getSessionAuthUser()

  if (!user) {
    redirect("/auth/login")
  }

  redirect(resolveDashboardLandingPath(user))
}
