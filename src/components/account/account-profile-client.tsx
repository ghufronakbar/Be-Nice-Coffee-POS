"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  changeMyPasswordAction,
  updateMyProfileAction,
} from "@/actions/account"
import {
  accountPasswordSchema,
  accountProfileSchema,
  type AccountPasswordInputValues,
  type AccountPasswordValues,
  type AccountProfileInputValues,
  type AccountProfileValues,
} from "@/components/account/account-form-schema"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { formatDateTime } from "@/lib/format"

type AccountProfileClientProps = {
  account: {
    id: number
    name: string
    email: string
    createdAt: Date
    updatedAt: Date
  }
}

export function AccountProfileClient({ account }: AccountProfileClientProps) {
  const router = useRouter()
  const [isSavingProfile, startProfileTransition] = useTransition()
  const [isSavingPassword, startPasswordTransition] = useTransition()

  const profileForm = useForm<AccountProfileInputValues, undefined, AccountProfileValues>({
    resolver: zodResolver(accountProfileSchema),
    defaultValues: {
      name: account.name,
    },
  })

  const passwordForm = useForm<AccountPasswordInputValues, undefined, AccountPasswordValues>({
    resolver: zodResolver(accountPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Akun Saya</h1>
        <p className="text-sm text-zinc-600">Kelola profil dan keamanan akun login Anda.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Profil</h2>

          <Form {...profileForm}>
            <form
              className="mt-5 space-y-4"
              onSubmit={profileForm.handleSubmit((values) => {
                startProfileTransition(async () => {
                  const result = await updateMyProfileAction(values)

                  if (!result.success) {
                    toast.error(result.message)
                    return
                  }

                  toast.success(result.message)
                  router.refresh()
                })
              })}
            >
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input value={account.email} readOnly disabled />
                </FormControl>
                <p className="text-xs text-zinc-500">Email tidak dapat diubah dari halaman ini.</p>
              </FormItem>

              <Button type="submit" disabled={isSavingProfile}>
                Simpan Profil
              </Button>
            </form>
          </Form>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Ringkasan Akun</h2>

          <div className="mt-4 rounded-lg border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-sm">
              <span className="text-zinc-500">Nama</span>
              <span className="font-medium text-zinc-900">{account.name}</span>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-sm">
              <span className="text-zinc-500">Email</span>
              <span className="font-medium text-zinc-900">{account.email}</span>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-sm">
              <span className="text-zinc-500">Terdaftar</span>
              <span className="font-medium text-zinc-900">{formatDateTime(account.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-zinc-500">Update Terakhir</span>
              <span className="font-medium text-zinc-900">{formatDateTime(account.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Ganti Password</h2>

        <Form {...passwordForm}>
          <form
            className="mt-5 grid gap-4 md:grid-cols-2"
            onSubmit={passwordForm.handleSubmit((values) => {
              startPasswordTransition(async () => {
                const result = await changeMyPasswordAction(values)

                if (!result.success) {
                  toast.error(result.message)
                  return
                }

                toast.success(result.message)
                passwordForm.reset({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                })
              })
            })}
          >
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Lama</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-1" />

            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Baru</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi Password Baru</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <Button type="submit" disabled={isSavingPassword}>
                Simpan Password Baru
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
