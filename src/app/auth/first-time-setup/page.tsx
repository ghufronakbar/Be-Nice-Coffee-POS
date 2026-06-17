import { redirect } from "next/navigation"

import { getAuthSetupState } from "@/actions/user"
import FirstTimeSetupClient from "@/app/auth/first-time-setup/client"
import { resolveDashboardLandingPath } from "@/lib/access-control"

export default async function FirstTimeSetupPage() {
  const { hasAnyUser, sessionUser } = await getAuthSetupState()

  if (sessionUser) {
    redirect(resolveDashboardLandingPath(sessionUser))
  }

  if (hasAnyUser) {
    redirect("/auth/login")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <section className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-2xl font-semibold">First Time Setup</h1>
          <p className="text-sm text-zinc-600">Buat akun pertama untuk mulai menggunakan sistem.</p>
        </div>
        <FirstTimeSetupClient />
      </section>
    </main>
  )
}
