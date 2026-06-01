"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { createUserAction, deleteUserAction } from "@/actions/user-management"
import { UserFormModal } from "@/components/user/user-form-modal"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime } from "@/lib/format"

type UserListItem = {
  id: number
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
  isSuperadmin: boolean
}

type UserListClientProps = {
  items: UserListItem[]
  actorCanManage: boolean
}

export function UserListClient({ items, actorCanManage }: UserListClientProps) {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isBusy, startTransition] = useTransition()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-600">
          {actorCanManage
            ? "Anda masuk sebagai superadmin. Anda dapat menambah, reset password, dan menghapus user."
            : "Hanya superadmin (user paling awal dibuat) yang dapat menambah, reset password, dan menghapus user."}
        </p>

        {actorCanManage ? (
          <Button type="button" onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon className="size-4" />
            Tambah User
          </Button>
        ) : null}
      </div>

      <UserFormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Tambah User Baru"
        description="Buat user baru tanpa meninggalkan halaman ini."
        submitLabel="Simpan User"
        disabled={isBusy}
        onSubmit={async (values) => {
          startTransition(async () => {
            const result = await createUserAction(values)

            if (!result.success) {
              toast.error(result.message)
              return
            }

            toast.success(result.message)
            setIsCreateModalOpen(false)
            router.refresh()
          })
        }}
      />

      <div className="rounded-xl border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Terdaftar</TableHead>
              <TableHead>Terakhir Diperbarui</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-zinc-500">
                  Belum ada user.
                </TableCell>
              </TableRow>
            ) : (
              items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={user.isSuperadmin ? "text-sm font-semibold text-emerald-700" : "text-sm text-zinc-700"}
                    >
                      {user.isSuperadmin ? "Superadmin" : "User"}
                    </span>
                  </TableCell>
                  <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(user.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/user/${user.id}`}>Detail</Link>
                      </Button>

                      {actorCanManage && !user.isSuperadmin ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
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
                              router.refresh()
                            })
                          }}
                        >
                          <Trash2Icon className="size-4" />
                          Hapus
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
