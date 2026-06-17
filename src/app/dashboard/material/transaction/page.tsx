import {
  getMaterialTransactionListAction,
  type MaterialTransactionListQueryInput,
} from "@/actions/material"
import { QueryControls } from "@/components/data-table/query-controls"
import { QueryPagination } from "@/components/data-table/query-pagination"
import { MaterialTransactionListClient } from "@/components/material/material-transaction-list-client"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { MATERIAL_TRANSACTION_TYPES } from "@/constants/constants"
import { requireDashboardAccess } from "@/lib/authorization"
import { parseSingleSearchParam } from "@/lib/query-string"

const MATERIAL_TRANSACTION_PATHNAME = "/dashboard/material/transaction"

const sortOptions = [
  { value: "createdAt", label: "Urutkan: Tanggal Dibuat" },
  { value: "updatedAt", label: "Urutkan: Tanggal Diubah" },
  { value: "amount", label: "Urutkan: Jumlah" },
  { value: "type", label: "Urutkan: Tipe" },
]

type MaterialTransactionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function MaterialTransactionPage({ searchParams }: MaterialTransactionPageProps) {
  await requireDashboardAccess("accessMaterialTransactionRead")

  const resolvedSearchParams = await searchParams

  const queryInput: MaterialTransactionListQueryInput = {
    q: parseSingleSearchParam(resolvedSearchParams.q),
    type: parseSingleSearchParam(resolvedSearchParams.type) as
      | "ALL"
      | "PURCHASE"
      | "SELL"
      | "ADJUSTMENT"
      | undefined,
    sortBy: parseSingleSearchParam(resolvedSearchParams.sortBy) as
      | "createdAt"
      | "updatedAt"
      | "amount"
      | "type"
      | undefined,
    sortOrder: parseSingleSearchParam(resolvedSearchParams.sortOrder) as "asc" | "desc" | undefined,
    page: parseSingleSearchParam(resolvedSearchParams.page),
    pageSize: parseSingleSearchParam(resolvedSearchParams.pageSize),
  }

  const transactionList = await getMaterialTransactionListAction(queryInput)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Transaksi Material</h1>
        <p className="text-sm text-zinc-600">
          Riwayat seluruh mutasi stok material dari pembelian, penjualan, dan penyesuaian.
        </p>
      </div>

      <QueryControls
        pathname={MATERIAL_TRANSACTION_PATHNAME}
        searchPlaceholder="Cari material, catatan, invoice, atau order id..."
        searchValue={transactionList.query.q}
        sortBy={transactionList.query.sortBy}
        sortOrder={transactionList.query.sortOrder}
        pageSize={transactionList.pageSize}
        sortOptions={sortOptions}
        extraFilters={
          <NativeSelect className="w-full" name="type" defaultValue={transactionList.query.type}>
            <NativeSelectOption value="ALL">Semua Tipe</NativeSelectOption>
            {MATERIAL_TRANSACTION_TYPES.map((typeOption) => (
              <NativeSelectOption key={typeOption.value} value={typeOption.value}>
                {typeOption.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        }
      />

      <MaterialTransactionListClient items={transactionList.items} />

      <div className="space-y-2">
        <p className="text-sm text-zinc-600">Total data: {transactionList.totalItems}</p>
        <QueryPagination
          pathname={MATERIAL_TRANSACTION_PATHNAME}
          page={transactionList.currentPage}
          totalPages={transactionList.totalPages}
          query={{
            q: transactionList.query.q,
            type: transactionList.query.type,
            sortBy: transactionList.query.sortBy,
            sortOrder: transactionList.query.sortOrder,
            pageSize: transactionList.pageSize,
          }}
        />
      </div>
    </div>
  )
}
