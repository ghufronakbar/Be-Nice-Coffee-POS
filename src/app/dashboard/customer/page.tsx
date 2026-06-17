import { getCustomerListAction } from "@/actions/customer"
import { CustomerListClient } from "@/components/customer/customer-list-client"
import { QueryControls } from "@/components/data-table/query-controls"
import { QueryPagination } from "@/components/data-table/query-pagination"
import { requireDashboardAccess } from "@/lib/authorization"
import { parseSingleSearchParam } from "@/lib/query-string"

const CUSTOMER_LIST_PATHNAME = "/dashboard/customer"

const sortOptions = [
  { value: "updatedAt", label: "Urutkan: Terakhir Diubah" },
  { value: "createdAt", label: "Urutkan: Terbaru Dibuat" },
  { value: "name", label: "Urutkan: Nama" },
  { value: "phone", label: "Urutkan: Nomor" },
]

type CustomerListPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CustomerListPage({ searchParams }: CustomerListPageProps) {
  await requireDashboardAccess("accessCustomerRead")

  const resolvedSearchParams = await searchParams

  const sortByParam = parseSingleSearchParam(resolvedSearchParams.sortBy) as
    | "name"
    | "phone"
    | "createdAt"
    | "updatedAt"
    | undefined

  const sortOrderParam = parseSingleSearchParam(resolvedSearchParams.sortOrder) as
    | "asc"
    | "desc"
    | undefined

  const customerList = await getCustomerListAction({
    q: parseSingleSearchParam(resolvedSearchParams.q),
    sortBy: sortByParam,
    sortOrder: sortOrderParam,
    page: parseSingleSearchParam(resolvedSearchParams.page),
    pageSize: parseSingleSearchParam(resolvedSearchParams.pageSize),
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Customer</h1>
        <p className="text-sm text-zinc-600">Kelola customer, profil kontak, serta ringkasan aktivitas order.</p>
      </div>

      <QueryControls
        pathname={CUSTOMER_LIST_PATHNAME}
        searchPlaceholder="Cari nama atau nomor customer..."
        searchValue={customerList.query.q}
        sortBy={customerList.query.sortBy}
        sortOrder={customerList.query.sortOrder}
        pageSize={customerList.pageSize}
        sortOptions={sortOptions}
      />

      <CustomerListClient items={customerList.items} />

      <div className="space-y-2">
        <p className="text-sm text-zinc-600">Total data: {customerList.totalItems}</p>
        <QueryPagination
          pathname={CUSTOMER_LIST_PATHNAME}
          page={customerList.currentPage}
          totalPages={customerList.totalPages}
          query={{
            q: customerList.query.q,
            sortBy: customerList.query.sortBy,
            sortOrder: customerList.query.sortOrder,
            pageSize: customerList.pageSize,
          }}
        />
      </div>
    </div>
  )
}
