import {
  getActiveMaterialsAction,
  getMaterialAdjustmentListAction,
} from "@/actions/material"
import { QueryControls } from "@/components/data-table/query-controls"
import { QueryPagination } from "@/components/data-table/query-pagination"
import { MaterialAdjustmentListClient } from "@/components/material/material-adjustment-list-client"
import { parseSingleSearchParam } from "@/lib/query-string"

const MATERIAL_ADJUSTMENT_PATHNAME = "/dashboard/material/adjustment"

const sortOptions = [
  { value: "createdAt", label: "Urutkan: Tanggal Dibuat" },
  { value: "updatedAt", label: "Urutkan: Tanggal Diubah" },
  { value: "amount", label: "Urutkan: Jumlah" },
]

type MaterialAdjustmentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function MaterialAdjustmentPage({ searchParams }: MaterialAdjustmentPageProps) {
  const resolvedSearchParams = await searchParams

  const [adjustmentList, materials] = await Promise.all([
    getMaterialAdjustmentListAction({
      q: parseSingleSearchParam(resolvedSearchParams.q),
      sortBy: parseSingleSearchParam(resolvedSearchParams.sortBy) as
        | "createdAt"
        | "updatedAt"
        | "amount"
        | undefined,
      sortOrder: parseSingleSearchParam(resolvedSearchParams.sortOrder) as "asc" | "desc" | undefined,
      page: parseSingleSearchParam(resolvedSearchParams.page),
      pageSize: parseSingleSearchParam(resolvedSearchParams.pageSize),
    }),
    getActiveMaterialsAction(),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Penyesuaian Material</h1>
        <p className="text-sm text-zinc-600">
          Kelola mutasi manual stok material untuk koreksi fisik dan penyesuaian inventory.
        </p>
      </div>

      <QueryControls
        pathname={MATERIAL_ADJUSTMENT_PATHNAME}
        searchPlaceholder="Cari material atau catatan penyesuaian..."
        searchValue={adjustmentList.query.q}
        sortBy={adjustmentList.query.sortBy}
        sortOrder={adjustmentList.query.sortOrder}
        pageSize={adjustmentList.pageSize}
        sortOptions={sortOptions}
      />

      <MaterialAdjustmentListClient items={adjustmentList.items} materials={materials} />

      <div className="space-y-2">
        <p className="text-sm text-zinc-600">Total data: {adjustmentList.totalItems}</p>
        <QueryPagination
          pathname={MATERIAL_ADJUSTMENT_PATHNAME}
          page={adjustmentList.currentPage}
          totalPages={adjustmentList.totalPages}
          query={{
            q: adjustmentList.query.q,
            sortBy: adjustmentList.query.sortBy,
            sortOrder: adjustmentList.query.sortOrder,
            pageSize: adjustmentList.pageSize,
          }}
        />
      </div>
    </div>
  )
}
