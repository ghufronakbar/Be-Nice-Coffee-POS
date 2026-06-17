import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { getMaterialPurchaseListAction } from "@/actions/material"
import { QueryControls } from "@/components/data-table/query-controls"
import { QueryPagination } from "@/components/data-table/query-pagination"
import { MaterialPurchaseListClient } from "@/components/material/material-purchase-list-client"
import { Button } from "@/components/ui/button"
import { requireDashboardAccess } from "@/lib/authorization"
import { parseSingleSearchParam } from "@/lib/query-string"

const MATERIAL_PURCHASE_PATHNAME = "/dashboard/material/purchase"

const sortOptions = [
  { value: "createdAt", label: "Urutkan: Tanggal Dibuat" },
  { value: "updatedAt", label: "Urutkan: Tanggal Diubah" },
  { value: "invoiceNumber", label: "Urutkan: Invoice" },
  { value: "total", label: "Urutkan: Total" },
]

type MaterialPurchasePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function MaterialPurchasePage({ searchParams }: MaterialPurchasePageProps) {
  await requireDashboardAccess("accessMaterialPurchaseRead")

  const resolvedSearchParams = await searchParams

  const purchaseList = await getMaterialPurchaseListAction({
    q: parseSingleSearchParam(resolvedSearchParams.q),
    sortBy: parseSingleSearchParam(resolvedSearchParams.sortBy) as
      | "createdAt"
      | "updatedAt"
      | "invoiceNumber"
      | "total"
      | undefined,
    sortOrder: parseSingleSearchParam(resolvedSearchParams.sortOrder) as "asc" | "desc" | undefined,
    page: parseSingleSearchParam(resolvedSearchParams.page),
    pageSize: parseSingleSearchParam(resolvedSearchParams.pageSize),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Pembelian Material</h1>
          <p className="text-sm text-zinc-600">Kelola dokumen pembelian material beserta item dan total transaksi.</p>
        </div>

        <Button asChild>
          <Link href="/dashboard/material/purchase/create">
            <PlusIcon className="size-4" />
            Tambah Pembelian
          </Link>
        </Button>
      </div>

      <QueryControls
        pathname={MATERIAL_PURCHASE_PATHNAME}
        searchPlaceholder="Cari invoice atau catatan pembelian..."
        searchValue={purchaseList.query.q}
        sortBy={purchaseList.query.sortBy}
        sortOrder={purchaseList.query.sortOrder}
        pageSize={purchaseList.pageSize}
        sortOptions={sortOptions}
      />

      <MaterialPurchaseListClient items={purchaseList.items} />

      <div className="space-y-2">
        <p className="text-sm text-zinc-600">Total data: {purchaseList.totalItems}</p>
        <QueryPagination
          pathname={MATERIAL_PURCHASE_PATHNAME}
          page={purchaseList.currentPage}
          totalPages={purchaseList.totalPages}
          query={{
            q: purchaseList.query.q,
            sortBy: purchaseList.query.sortBy,
            sortOrder: purchaseList.query.sortOrder,
            pageSize: purchaseList.pageSize,
          }}
        />
      </div>
    </div>
  )
}
