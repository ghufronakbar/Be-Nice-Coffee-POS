import { getReportDataAction } from "@/actions/analytics"
import { ReportClient } from "@/components/report/report-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { parseSingleSearchParam } from "@/lib/query-string"

type ReportPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const resolvedSearchParams = await searchParams
  const startDate = parseSingleSearchParam(resolvedSearchParams.startDate)
  const endDate = parseSingleSearchParam(resolvedSearchParams.endDate)
  const report = await getReportDataAction({ startDate, endDate })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Laporan</h1>
        <p className="text-sm text-zinc-600">Analitik penjualan, inventory, pembelian, dan profit berdasarkan periode.</p>
      </div>

      <form method="get" action="/dashboard/report" className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700" htmlFor="startDate">
            Tanggal Mulai
          </label>
          <Input id="startDate" type="date" name="startDate" defaultValue={report.range.startDate} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700" htmlFor="endDate">
            Tanggal Akhir
          </label>
          <Input id="endDate" type="date" name="endDate" defaultValue={report.range.endDate} />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Terapkan Filter
          </Button>
        </div>
      </form>

      <ReportClient report={report} />
    </div>
  )
}
