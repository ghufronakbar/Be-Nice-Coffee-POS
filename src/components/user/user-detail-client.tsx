"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRoundIcon, Trash2Icon } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import {
  deleteUserAction,
  resetUserPasswordAction,
  updateUserAccessAction,
} from "@/actions/user-management"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { UserAccessFields } from "@/components/user/user-access-fields"
import {
  userAccessFormSchema,
  type UserAccessFormInputValues,
  type UserAccessFormValues,
} from "@/components/user/user-form-schema"
import { ACCESS_FIELDS, type AccessField, type AccessMap } from "@/lib/access-control"
import { formatDateTime } from "@/lib/format"

type UserDetail = {
  id: number
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
  isSuperadmin: boolean
  access: AccessMap
  actorCanManage: boolean
  canUpdateAccess: boolean
  canResetPassword: boolean
  canDelete: boolean
}

type UserDetailClientProps = {
  user: UserDetail
}

export function UserDetailClient({ user }: UserDetailClientProps) {
  const router = useRouter()
  const [isBusy, startTransition] = useTransition()
  const accessForm = useForm<UserAccessFormInputValues, undefined, UserAccessFormValues>({
    resolver: zodResolver(userAccessFormSchema),
    defaultValues: user.access,
  })
  const watchedAccessValues = useWatch({
    control: accessForm.control,
    name: ACCESS_FIELDS,
  })
  const watchedAccessMap = Object.fromEntries(
    ACCESS_FIELDS.map((field, index) => [field, Boolean(watchedAccessValues[index])])
  ) as AccessMap

  function setAccessFields(fields: AccessField[], checked: boolean) {
    fields.forEach((field) => {
      accessForm.setValue(field, checked, {
        shouldDirty: true,
        shouldValidate: true,
      })
    })
  }

  function setAccessField(field: AccessField, checked: boolean) {
    setAccessFields([field], checked)
  }

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
        <h2 className="text-base font-semibold text-zinc-900">Hak Akses</h2>
        <div className="mt-2 space-y-1 text-sm text-zinc-600">
          {!user.actorCanManage ? (
            <p>Hanya superadmin yang dapat mengubah hak akses user.</p>
          ) : user.isSuperadmin ? (
            <p>
              User ini adalah superadmin. Semua akses selalu aktif secara sistem walaupun nilai
              database berubah.
            </p>
          ) : (
            <p>Ubah hak akses user berdasarkan halaman dan tanggung jawab operasional.</p>
          )}
        </div>

        <Form {...accessForm}>
          <form
            className="mt-4 space-y-4"
            onSubmit={accessForm.handleSubmit((values) => {
              startTransition(async () => {
                const result = await updateUserAccessAction(user.id, values)

                if (!result.success) {
                  toast.error(result.message)
                  return
                }

                toast.success(result.message)
                accessForm.reset(values)
                router.refresh()
              })
            })}
          >
            <UserAccessFields
              values={watchedAccessMap}
              disabled={!user.canUpdateAccess || isBusy}
              onChange={setAccessField}
              onChangeMany={setAccessFields}
            />

            <Button type="submit" disabled={!user.canUpdateAccess || isBusy || !accessForm.formState.isDirty}>
              Simpan Hak Akses
            </Button>
          </form>
        </Form>
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
