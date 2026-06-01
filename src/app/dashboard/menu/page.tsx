import Link from "next/link"
import Image from "next/image"

import { getMenuListAction } from "@/actions/menu"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { QueryControls } from "@/components/data-table/query-controls"
import { QueryPagination } from "@/components/data-table/query-pagination"
import { formatDateTime, formatRupiah } from "@/lib/format"
import { parseSingleSearchParam } from "@/lib/query-string"

const MENU_LIST_PATHNAME = "/dashboard/menu"

const sortOptions = [
  { value: "updatedAt", label: "Urutkan: Terakhir Diubah" },
  { value: "createdAt", label: "Urutkan: Terbaru Dibuat" },
  { value: "name", label: "Urutkan: Nama" },
  { value: "price", label: "Urutkan: Harga" },
]

type MenuListPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function MenuListPage({ searchParams }: MenuListPageProps) {
  const resolvedSearchParams = await searchParams
  const sortByParam = parseSingleSearchParam(resolvedSearchParams.sortBy) as
    | "name"
    | "price"
    | "createdAt"
    | "updatedAt"
    | undefined
  const sortOrderParam = parseSingleSearchParam(resolvedSearchParams.sortOrder) as
    | "asc"
    | "desc"
    | undefined

  const menuList = await getMenuListAction({
    q: parseSingleSearchParam(resolvedSearchParams.q),
    sortBy: sortByParam,
    sortOrder: sortOrderParam,
    page: parseSingleSearchParam(resolvedSearchParams.page),
    pageSize: parseSingleSearchParam(resolvedSearchParams.pageSize),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Menu & Resep</h1>
          <p className="text-sm text-zinc-600">Kelola daftar menu dan komposisi material setiap menu.</p>
        </div>

        <Button asChild>
          <Link href="/dashboard/menu/create">Tambah Menu Baru</Link>
        </Button>
      </div>

      <QueryControls
        pathname={MENU_LIST_PATHNAME}
        searchPlaceholder="Cari nama menu..."
        searchValue={menuList.query.q}
        sortBy={menuList.query.sortBy}
        sortOrder={menuList.query.sortOrder}
        pageSize={menuList.pageSize}
        sortOptions={sortOptions}
      />

      <div className="rounded-xl border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gambar</TableHead>
              <TableHead>Nama Menu</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Jumlah Bahan</TableHead>
              <TableHead>Terakhir Diperbarui</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menuList.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-zinc-500">
                  Belum ada menu.
                </TableCell>
              </TableRow>
            ) : (
              menuList.items.map((menu) => (
                <TableRow key={menu.id}>
                  <TableCell>
                    {menu.imageUrl ? (
                      <div className="relative size-12 overflow-hidden rounded-md border border-zinc-200">
                        <Image src={menu.imageUrl} alt={menu.name} fill className="object-cover" sizes="48px" />
                      </div>
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded-md border border-dashed border-zinc-300 text-xs text-zinc-500">
                        -
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{menu.name}</TableCell>
                  <TableCell>{formatRupiah(menu.price)}</TableCell>
                  <TableCell>{menu.recipeCount}</TableCell>
                  <TableCell>{formatDateTime(menu.updatedAt)}</TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/menu/${menu.id}`}>Detail</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-zinc-600">Total data: {menuList.totalItems}</p>
        <QueryPagination
          pathname={MENU_LIST_PATHNAME}
          page={menuList.currentPage}
          totalPages={menuList.totalPages}
          query={{
            q: menuList.query.q,
            sortBy: menuList.query.sortBy,
            sortOrder: menuList.query.sortOrder,
            pageSize: menuList.pageSize,
          }}
        />
      </div>
    </div>
  )
}
