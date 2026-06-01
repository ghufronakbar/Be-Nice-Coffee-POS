import { redirect } from "next/navigation"

import { getAuthSetupState } from "@/actions/user"
import LoginClient from "@/app/auth/login/client"

export default async function LoginPage() {
  const { hasAnyUser, sessionUser } = await getAuthSetupState()

  if (sessionUser) {
    redirect("/dashboard")
  }

  if (!hasAnyUser) {
    redirect("/auth/first-time-setup")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <section className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Masuk ke Be Nice Coffee</h1>
          <p className="text-sm text-zinc-600">Silakan login untuk membuka dashboard.</p>
        </div>
        <LoginClient />
      </section>
    </main>
  )
}
