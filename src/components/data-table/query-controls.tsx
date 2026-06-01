import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

type SortOption = {
  value: string
  label: string
}

type QueryControlsProps = {
  pathname: string
  searchPlaceholder?: string
  searchValue: string
  sortBy: string
  sortOrder: "asc" | "desc"
  pageSize: number
  sortOptions: SortOption[]
}

export function QueryControls({
  pathname,
  searchPlaceholder = "Cari data...",
  searchValue,
  sortBy,
  sortOrder,
  pageSize,
  sortOptions,
}: QueryControlsProps) {
  return (
    <form method="get" action={pathname} className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 lg:grid-cols-12">
      <input type="hidden" name="page" value="1" />

      <div className="lg:col-span-5">
        <Input name="q" placeholder={searchPlaceholder} defaultValue={searchValue} />
      </div>

      <div className="lg:col-span-2">
        <NativeSelect className="w-full" name="sortBy" defaultValue={sortBy}>
          {sortOptions.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="lg:col-span-2">
        <NativeSelect className="w-full" name="sortOrder" defaultValue={sortOrder}>
          <NativeSelectOption value="desc">Urutan Turun</NativeSelectOption>
          <NativeSelectOption value="asc">Urutan Naik</NativeSelectOption>
        </NativeSelect>
      </div>

      <div className="lg:col-span-1">
        <NativeSelect className="w-full" name="pageSize" defaultValue={String(pageSize)}>
          <NativeSelectOption value="10">10</NativeSelectOption>
          <NativeSelectOption value="20">20</NativeSelectOption>
          <NativeSelectOption value="50">50</NativeSelectOption>
        </NativeSelect>
      </div>

      <div className="flex gap-2 lg:col-span-2">
        <Button type="submit" className="flex-1">
          Terapkan
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href={pathname}>Reset</Link>
        </Button>
      </div>
    </form>
  )
}
