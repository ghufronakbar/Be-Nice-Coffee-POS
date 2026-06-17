import { getMaterialListAction } from "@/actions/material"
import { QueryControls } from "@/components/data-table/query-controls"
import { QueryPagination } from "@/components/data-table/query-pagination"
import { MaterialListClient } from "@/components/material/material-list-client"
import { requireDashboardAccess } from "@/lib/authorization"
import { parseSingleSearchParam } from "@/lib/query-string"

const MATERIAL_LIST_PATHNAME = "/dashboard/material"

const sortOptions = [
  { value: "updatedAt", label: "Urutkan: Terakhir Diubah" },
  { value: "createdAt", label: "Urutkan: Terbaru Dibuat" },
  { value: "name", label: "Urutkan: Nama" },
  { value: "unit", label: "Urutkan: Satuan" },
  { value: "recordedAmount", label: "Urutkan: Sisa Stok" },
  { value: "recordedBuyPrice", label: "Urutkan: Harga Beli" },
]

type MaterialListPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function MaterialListPage({ searchParams }: MaterialListPageProps) {
  await requireDashboardAccess("accessMaterialRead")

  const resolvedSearchParams = await searchParams

  const sortByParam = parseSingleSearchParam(resolvedSearchParams.sortBy) as
    | "name"
    | "unit"
    | "recordedAmount"
    | "recordedBuyPrice"
    | "createdAt"
    | "updatedAt"
    | undefined

  const sortOrderParam = parseSingleSearchParam(resolvedSearchParams.sortOrder) as
    | "asc"
    | "desc"
    | undefined

  const materialList = await getMaterialListAction({
    q: parseSingleSearchParam(resolvedSearchParams.q),
    sortBy: sortByParam,
    sortOrder: sortOrderParam,
    page: parseSingleSearchParam(resolvedSearchParams.page),
    pageSize: parseSingleSearchParam(resolvedSearchParams.pageSize),
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Material</h1>
        <p className="text-sm text-zinc-600">Kelola bahan baku, stok tercatat, dan keterkaitan ke menu.</p>
      </div>

      <QueryControls
        pathname={MATERIAL_LIST_PATHNAME}
        searchPlaceholder="Cari nama material..."
        searchValue={materialList.query.q}
        sortBy={materialList.query.sortBy}
        sortOrder={materialList.query.sortOrder}
        pageSize={materialList.pageSize}
        sortOptions={sortOptions}
      />

      <MaterialListClient items={materialList.items} />

      <div className="space-y-2">
        <p className="text-sm text-zinc-600">Total data: {materialList.totalItems}</p>
        <QueryPagination
          pathname={MATERIAL_LIST_PATHNAME}
          page={materialList.currentPage}
          totalPages={materialList.totalPages}
          query={{
            q: materialList.query.q,
            sortBy: materialList.query.sortBy,
            sortOrder: materialList.query.sortOrder,
            pageSize: materialList.pageSize,
          }}
        />
      </div>
    </div>
  )
}
