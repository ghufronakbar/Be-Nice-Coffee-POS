"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { KeyRoundIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { deleteUserAction, resetUserPasswordAction } from "@/actions/user-management"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/format"

type UserDetail = {
  id: number
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
  isSuperadmin: boolean
  actorCanManage: boolean
  canResetPassword: boolean
  canDelete: boolean
}

type UserDetailClientProps = {
  user: UserDetail
}

export function UserDetailClient({ user }: UserDetailClientProps) {
  const router = useRouter()
  const [isBusy, startTransition] = useTransition()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Detail User</h1>
          <p className="text-sm text-zinc-600">Lihat data akun user dan kelola aksi admin.</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/dashboard/user">Kembali ke List User</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Informasi Akun</h2>

        <div className="mt-4 rounded-lg border border-zinc-200">
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-sm">
            <span className="text-zinc-500">Nama</span>
            <span className="font-medium text-zinc-900">{user.name}</span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-sm">
            <span className="text-zinc-500">Email</span>
            <span className="font-medium text-zinc-900">{user.email}</span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-sm">
            <span className="text-zinc-500">Role</span>
            <span className={user.isSuperadmin ? "font-semibold text-emerald-700" : "font-medium text-zinc-900"}>
              {user.isSuperadmin ? "Superadmin" : "User"}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-sm">
            <span className="text-zinc-500">Terdaftar</span>
            <span className="font-medium text-zinc-900">{formatDateTime(user.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-sm">
            <span className="text-zinc-500">Update Terakhir</span>
            <span className="font-medium text-zinc-900">{formatDateTime(user.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Aksi Admin</h2>

        <div className="mt-3 space-y-2 text-sm text-zinc-600">
          {!user.actorCanManage ? (
            <p>Hanya superadmin (user paling awal dibuat) yang dapat melakukan reset password atau hapus user.</p>
          ) : user.isSuperadmin ? (
            <p>User ini adalah superadmin. Superadmin tidak dapat dihapus.</p>
          ) : (
            <p>Reset password akan mengatur password user menjadi 12345678.</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {user.canResetPassword ? (
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => {
                const isConfirmed = window.confirm(`Reset password user \"${user.name}\" ke 12345678?`)

                if (!isConfirmed) {
                  return
                }

                startTransition(async () => {
                  const result = await resetUserPasswordAction(user.id)

                  if (!result.success) {
                    toast.error(result.message)
                    return
                  }

                  toast.success(result.message)
                  router.refresh()
                })
              }}
            >
              <KeyRoundIcon className="size-4" />
              Reset Password Default
            </Button>
          ) : null}

          {user.canDelete ? (
            <Button
              type="button"
              variant="destructive"
              disabled={isBusy}
              onClick={() => {
                const isConfirmed = window.confirm(`Hapus user \"${user.name}\"?`)

                if (!isConfirmed) {
                  return
                }

                startTransition(async () => {
                  const result = await deleteUserAction(user.id)

                  if (!result.success) {
                    toast.error(result.message)
                    return
                  }

                  toast.success(result.message)
                  router.push("/dashboard/user")
                })
              }}
            >
              <Trash2Icon className="size-4" />
              Hapus User
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
