import {
  getOrderListAction,
  type OrderListQueryInput,
} from "@/actions/order"
import { QueryControls } from "@/components/data-table/query-controls"
import { QueryPagination } from "@/components/data-table/query-pagination"
import { OrderListClient } from "@/components/order/order-list-client"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { parseSingleSearchParam } from "@/lib/query-string"

const ORDER_LIST_PATHNAME = "/dashboard/order"

const sortOptions = [
  { value: "createdAt", label: "Urutkan: Tanggal Dibuat" },
  { value: "updatedAt", label: "Urutkan: Tanggal Diubah" },
  { value: "total", label: "Urutkan: Total" },
  { value: "status", label: "Urutkan: Status" },
]

type OrderPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function OrderPage({ searchParams }: OrderPageProps) {
  const resolvedSearchParams = await searchParams

  const queryInput: OrderListQueryInput = {
    q: parseSingleSearchParam(resolvedSearchParams.q),
    status: parseSingleSearchParam(resolvedSearchParams.status) as
      | "ALL"
      | "PENDING"
      | "COMPLETED"
      | "CANCELLED"
      | undefined,
    sortBy: parseSingleSearchParam(resolvedSearchParams.sortBy) as
      | "createdAt"
      | "updatedAt"
      | "total"
      | "status"
      | undefined,
    sortOrder: parseSingleSearchParam(resolvedSearchParams.sortOrder) as "asc" | "desc" | undefined,
    page: parseSingleSearchParam(resolvedSearchParams.page),
    pageSize: parseSingleSearchParam(resolvedSearchParams.pageSize),
  }

  const orderList = await getOrderListAction(queryInput)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Riwayat Order</h1>
        <p className="text-sm text-zinc-600">Lihat riwayat order, detail customer, total, dan status transaksi.</p>
      </div>

      <QueryControls
        pathname={ORDER_LIST_PATHNAME}
        searchPlaceholder="Cari order id, customer, nomor, atau catatan..."
        searchValue={orderList.query.q}
        sortBy={orderList.query.sortBy}
        sortOrder={orderList.query.sortOrder}
        pageSize={orderList.pageSize}
        sortOptions={sortOptions}
        extraFilters={
          <NativeSelect className="w-full" name="status" defaultValue={orderList.query.status}>
            <NativeSelectOption value="ALL">Semua Status</NativeSelectOption>
            <NativeSelectOption value="PENDING">Pending</NativeSelectOption>
            <NativeSelectOption value="COMPLETED">Selesai</NativeSelectOption>
            <NativeSelectOption value="CANCELLED">Dibatalkan</NativeSelectOption>
          </NativeSelect>
        }
      />

      <OrderListClient items={orderList.items} />

      <div className="space-y-2">
        <p className="text-sm text-zinc-600">Total data: {orderList.totalItems}</p>
        <QueryPagination
          pathname={ORDER_LIST_PATHNAME}
          page={orderList.currentPage}
          totalPages={orderList.totalPages}
          query={{
            q: orderList.query.q,
            status: orderList.query.status,
            sortBy: orderList.query.sortBy,
            sortOrder: orderList.query.sortOrder,
            pageSize: orderList.pageSize,
          }}
        />
      </div>
    </div>
  )
}
