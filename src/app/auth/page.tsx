import { redirect } from "next/navigation"

import { getAuthSetupState } from "@/actions/user"

export default async function AuthPage() {
  const { hasAnyUser, sessionUser } = await getAuthSetupState()

  if (sessionUser) {
    redirect("/dashboard")
  }

  if (!hasAnyUser) {
    redirect("/auth/first-time-setup")
  }

  redirect("/auth/login")
}
