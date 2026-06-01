import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { buildQueryString } from "@/lib/query-string"

type QueryPaginationProps = {
  pathname: string
  page: number
  totalPages: number
  query: Record<string, string | number | null | undefined>
}

function buildPageHref(
  pathname: string,
  query: Record<string, string | number | null | undefined>,
  page: number
) {
  const queryString = buildQueryString({
    ...query,
    page,
  })

  return `${pathname}?${queryString}`
}

function resolvePages(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages: Array<number | "ellipsis"> = [1]

  if (page > 3) {
    pages.push("ellipsis")
  }

  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)

  for (let current = start; current <= end; current += 1) {
    pages.push(current)
  }

  if (page < totalPages - 2) {
    pages.push("ellipsis")
  }

  pages.push(totalPages)
  return pages
}

export function QueryPagination({ pathname, page, totalPages, query }: QueryPaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const pages = resolvePages(page, totalPages)

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            text="Sebelumnya"
            href={buildPageHref(pathname, query, Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={page <= 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {pages.map((entry, index) => {
          if (entry === "ellipsis") {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          }

          return (
            <PaginationItem key={entry}>
              <PaginationLink href={buildPageHref(pathname, query, entry)} isActive={entry === page}>
                {entry}
              </PaginationLink>
            </PaginationItem>
          )
        })}

        <PaginationItem>
          <PaginationNext
            text="Berikutnya"
            href={buildPageHref(pathname, query, Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
