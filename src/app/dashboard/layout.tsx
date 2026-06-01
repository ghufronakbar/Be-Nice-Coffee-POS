import { redirect } from "next/navigation"

import { getSessionAuthUser } from "@/actions/user"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionAuthUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <DashboardShell user={{ name: user.name, email: user.email }}>{children}</DashboardShell>
}
