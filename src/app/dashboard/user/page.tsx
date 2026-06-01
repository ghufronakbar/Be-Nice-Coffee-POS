import { getUserListAction } from "@/actions/user-management"
import { QueryControls } from "@/components/data-table/query-controls"
import { QueryPagination } from "@/components/data-table/query-pagination"
import { UserListClient } from "@/components/user/user-list-client"
import { parseSingleSearchParam } from "@/lib/query-string"

const USER_LIST_PATHNAME = "/dashboard/user"

const sortOptions = [
  { value: "updatedAt", label: "Urutkan: Terakhir Diubah" },
  { value: "createdAt", label: "Urutkan: Terlama Dibuat" },
  { value: "name", label: "Urutkan: Nama" },
  { value: "email", label: "Urutkan: Email" },
]

type UserListPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function UserListPage({ searchParams }: UserListPageProps) {
  const resolvedSearchParams = await searchParams

  const sortByParam = parseSingleSearchParam(resolvedSearchParams.sortBy) as
    | "name"
    | "email"
    | "createdAt"
    | "updatedAt"
    | undefined

  const sortOrderParam = parseSingleSearchParam(resolvedSearchParams.sortOrder) as
    | "asc"
    | "desc"
    | undefined

  const userList = await getUserListAction({
    q: parseSingleSearchParam(resolvedSearchParams.q),
    sortBy: sortByParam,
    sortOrder: sortOrderParam,
    page: parseSingleSearchParam(resolvedSearchParams.page),
    pageSize: parseSingleSearchParam(resolvedSearchParams.pageSize),
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">User</h1>
        <p className="text-sm text-zinc-600">Kelola akun user yang dapat mengakses dashboard.</p>
      </div>

      <QueryControls
        pathname={USER_LIST_PATHNAME}
        searchPlaceholder="Cari nama atau email user..."
        searchValue={userList.query.q}
        sortBy={userList.query.sortBy}
        sortOrder={userList.query.sortOrder}
        pageSize={userList.pageSize}
        sortOptions={sortOptions}
      />

      <UserListClient items={userList.items} actorCanManage={userList.actorCanManage} />

      <div className="space-y-2">
        <p className="text-sm text-zinc-600">Total data: {userList.totalItems}</p>
        <QueryPagination
          pathname={USER_LIST_PATHNAME}
          page={userList.currentPage}
          totalPages={userList.totalPages}
          query={{
            q: userList.query.q,
            sortBy: userList.query.sortBy,
            sortOrder: userList.query.sortOrder,
            pageSize: userList.pageSize,
          }}
        />
      </div>
    </div>
  )
}
