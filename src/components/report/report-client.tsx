"use client"

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { DownloadIcon, FileTextIcon } from "lucide-react"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getMaterialTransactionTypeLabel,
  getMaterialUnitLabel,
  getOrderStatusLabel,
} from "@/constants/constants"
import { formatDateTime, formatRupiah } from "@/lib/format"

type ReportClientProps = {
  report: {
    range: {
      startDate: string
      endDate: string
    }
    metrics: {
      revenue: number
      profit: number
      buyPrice: number
      orderCount: number
      averageOrderValue: number
      purchaseTotal: number
      purchaseCount: number
      inventoryValue: number
    }
    salesTrend: Array<{ label: string; revenue: number; profit: number; orders: number }>
    statusSummary: Array<{ status: string; count: number; total: number }>
    topMenus: Array<{ menuId: number; name: string; quantity: number; revenue: number; profit: number }>
    materialUsage: Array<{ materialId: number; name: string; unit: string; amount: number; estimatedValue: number }>
    materialTransactionSummary: Array<{ type: string; count: number; amount: number }>
    inventory: Array<{
      id: number
      name: string
      unit: string
      recordedAmount: number
      recordedBuyPrice: number
      estimatedValue: number
    }>
    csvRows: {
      orders: Array<Record<string, string | number>>
      purchases: Array<Record<string, string | number>>
      inventory: Array<Record<string, string | number>>
    }
  }
}

const salesChartConfig = {
  revenue: { label: "Omzet", color: "#2563eb" },
  profit: { label: "Profit", color: "#16a34a" },
} satisfies ChartConfig

const menuChartConfig = {
  quantity: { label: "Qty", color: "#0f766e" },
} satisfies ChartConfig

const materialChartConfig = {
  amount: { label: "Pemakaian", color: "#ca8a04" },
} satisfies ChartConfig

const pieColors = ["#2563eb", "#16a34a", "#dc2626"]

const signedNumberFormatter = new Intl.NumberFormat("id-ID", {
  signDisplay: "exceptZero",
  maximumFractionDigits: 2,
})

type CsvRow = Record<string, string | number>

type CsvColumn = {
  key: string
  label: string
}

function escapeCsvValue(value: string | number) {
  const stringValue = String(value)

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

function buildCsv(rows: CsvRow[], columns: CsvColumn[]) {
  const lines = [
    columns.map((column) => escapeCsvValue(column.label)).join(","),
    ...rows.map((row) => columns.map((column) => escapeCsvValue(row[column.key] ?? "")).join(",")),
  ]

  return `\uFEFF${lines.join("\n")}`
}

function downloadCsv(filename: string, rows: CsvRow[], columns: CsvColumn[]) {
  const csv = buildCsv(rows, columns)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  downloadBlob(blob, filename)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function formatCsvDate(value: string | number) {
  return formatDateTime(new Date(String(value)))
}

function formatSignedAmount(value: number) {
  return signedNumberFormatter.format(value)
}

function buildFormattedOrderRows(report: ReportClientProps["report"]): CsvRow[] {
  return report.csvRows.orders.map((order) => ({
    orderId: `#${order.id}`,
    status: getOrderStatusLabel(String(order.status)),
    total: formatRupiah(Number(order.total)),
    recordedBuyPrice: formatRupiah(Number(order.recordedBuyPrice)),
    recordedProfit: formatRupiah(Number(order.recordedProfit)),
    createdAt: formatCsvDate(order.createdAt),
  }))
}

function buildFormattedPurchaseRows(report: ReportClientProps["report"]): CsvRow[] {
  return report.csvRows.purchases.map((purchase) => ({
    purchaseId: `#${purchase.id}`,
    invoiceNumber: purchase.invoiceNumber,
    total: formatRupiah(Number(purchase.total)),
    createdAt: formatCsvDate(purchase.createdAt),
  }))
}

function buildFormattedInventoryRows(report: ReportClientProps["report"]): CsvRow[] {
  return report.csvRows.inventory.map((material) => ({
    materialId: `#${material.id}`,
    name: material.name,
    unit: getMaterialUnitLabel(String(material.unit)),
    recordedAmount: Number(material.recordedAmount).toLocaleString("id-ID"),
    recordedBuyPrice: formatRupiah(Number(material.recordedBuyPrice)),
    estimatedValue: formatRupiah(Number(material.estimatedValue)),
  }))
}

const orderCsvColumns: CsvColumn[] = [
  { key: "orderId", label: "ID Order" },
  { key: "status", label: "Status" },
  { key: "total", label: "Total Order" },
  { key: "recordedBuyPrice", label: "Modal Snapshot" },
  { key: "recordedProfit", label: "Profit Snapshot" },
  { key: "createdAt", label: "Tanggal Order" },
]

const purchaseCsvColumns: CsvColumn[] = [
  { key: "purchaseId", label: "ID Pembelian" },
  { key: "invoiceNumber", label: "Nomor Invoice" },
  { key: "total", label: "Total Pembelian" },
  { key: "createdAt", label: "Tanggal Pembelian" },
]

const inventoryCsvColumns: CsvColumn[] = [
  { key: "materialId", label: "ID Material" },
  { key: "name", label: "Nama Material" },
  { key: "unit", label: "Satuan" },
  { key: "recordedAmount", label: "Sisa Stok" },
  { key: "recordedBuyPrice", label: "Harga Beli Rata-rata" },
  { key: "estimatedValue", label: "Nilai Stok Estimasi" },
]

function sanitizePdfText(value: string | number) {
  return String(value)
    .replace(/\u00a0/g, " ")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
}

function truncatePdfText(value: string | number, maxLength: number) {
  const sanitized = sanitizePdfText(value)

  if (sanitized.length <= maxLength) {
    return sanitized
  }

  return `${sanitized.slice(0, Math.max(0, maxLength - 3))}...`
}

function buildReportPdf(report: ReportClientProps["report"]) {
  const pageWidth = 595
  const pageHeight = 842
  const margin = 42
  const contentWidth = pageWidth - margin * 2
  const contentTop = pageHeight - margin - 28
  const lineHeight = 16
  const summaryWidths = [126, 126, 133, contentWidth - 126 - 126 - 133]
  const statusWidths = [211, 100, contentWidth - 211 - 100]
  const topMenuWidths = [221, 60, 115, contentWidth - 221 - 60 - 115]
  const materialUsageWidths = [205, 80, 90, contentWidth - 205 - 80 - 90]
  const materialTransactionWidths = [230, 110, contentWidth - 230 - 110]
  const inventoryWidths = [171, 70, 80, 95, contentWidth - 171 - 70 - 80 - 95]
  const pages: string[] = []
  let commands: string[] = []
  let y = contentTop

  function rawText(value: string | number, x: number, textY: number, size = 10, font = "F1") {
    commands.push(`BT /${font} ${size} Tf ${x} ${textY} Td (${sanitizePdfText(value)}) Tj ET`)
  }

  function line(x1: number, y1: number, x2: number, y2: number, color = "0.85 0.85 0.85") {
    commands.push(`q ${color} RG ${x1} ${y1} m ${x2} ${y2} l S Q`)
  }

  function fillRect(x: number, rectY: number, width: number, height: number, color = "0.94 0.96 0.98") {
    commands.push(`q ${color} rg ${x} ${rectY} ${width} ${height} re f Q`)
  }

  function addPageHeader() {
    rawText("BE NICE COFFEE", margin, pageHeight - 26, 9, "F2")
    rawText("Laporan Operasional", pageWidth - 156, pageHeight - 26, 9)
    line(margin, pageHeight - 34, pageWidth - margin, pageHeight - 34)
  }

  function commitPage() {
    if (commands.length > 0) {
      line(margin, 32, pageWidth - margin, 32)
      rawText(`Halaman ${pages.length + 1}`, margin, 20, 8)
      pages.push(commands.join("\n"))
    }
  }

  function newPage() {
    commitPage()
    commands = []
    y = contentTop
    addPageHeader()
  }

  function ensureSpace(height: number) {
    if (y - height < margin) {
      newPage()
    }
  }

  function text(value: string | number, x = margin, size = 10, font = "F1") {
    ensureSpace(lineHeight)
    rawText(value, x, y, size, font)
    y -= lineHeight
  }

  function title(value: string) {
    text(value, margin, 18, "F2")
    y -= 6
  }

  function section(value: string) {
    ensureSpace(36)
    y -= 10
    rawText(value, margin, y, 12, "F2")
    line(margin, y - 5, pageWidth - margin, y - 5)
    y -= 20
  }

  function approxTextWidth(value: string | number, size = 9) {
    return sanitizePdfText(value).length * size * 0.48
  }

  function tableRow(
    values: Array<string | number>,
    widths: number[],
    options: { header?: boolean; alignRight?: number[] } = {}
  ) {
    ensureSpace(lineHeight + 4)

    if (options.header) {
      fillRect(margin, y - 5, widths.reduce((total, width) => total + width, 0), 19)
    }

    let x = margin
    values.forEach((value, index) => {
      const maxLength = Math.max(8, Math.floor(widths[index] / 5.2))
      const displayValue = truncatePdfText(value, maxLength)
      const isRightAligned = options.alignRight?.includes(index)
      const textX = isRightAligned ? x + widths[index] - approxTextWidth(displayValue) - 6 : x + 6

      rawText(displayValue, Math.max(x + 6, textX), y, 9, options.header ? "F2" : "F1")
      x += widths[index]
    })
    line(margin, y - 6, margin + widths.reduce((total, width) => total + width, 0), y - 6, "0.9 0.9 0.9")
    y -= lineHeight
  }

  function emptyTableText() {
    text("Tidak ada data untuk periode ini.", margin + 6, 9)
  }

  addPageHeader()
  title("Laporan Be Nice Coffee")
  text(`Periode: ${report.range.startDate} s/d ${report.range.endDate}`)
  text(`Tanggal Export: ${formatDateTime(new Date())}`)

  section("Ringkasan")
  tableRow(["Metrik", "Nilai", "Metrik", "Nilai"], summaryWidths, { header: true })
  tableRow(["Omzet", formatRupiah(report.metrics.revenue), "Profit", formatRupiah(report.metrics.profit)], summaryWidths)
  tableRow(["Modal Snapshot", formatRupiah(report.metrics.buyPrice), "Total Order", report.metrics.orderCount], summaryWidths)
  tableRow(
    ["Average Order", formatRupiah(report.metrics.averageOrderValue), "Pembelian Material", formatRupiah(report.metrics.purchaseTotal)],
    summaryWidths
  )
  tableRow(["Jumlah Pembelian", report.metrics.purchaseCount, "Nilai Stok Estimasi", formatRupiah(report.metrics.inventoryValue)], summaryWidths)

  section("Status Order")
  tableRow(["Status", "Jumlah", "Total"], statusWidths, { header: true, alignRight: [1, 2] })
  if (report.statusSummary.length === 0) {
    emptyTableText()
  } else {
    report.statusSummary.forEach((status) => {
      tableRow([getOrderStatusLabel(status.status), status.count, formatRupiah(status.total)], statusWidths, {
        alignRight: [1, 2],
      })
    })
  }

  section("Menu Terlaris")
  tableRow(["Menu", "Qty", "Omzet", "Profit"], topMenuWidths, { header: true, alignRight: [1, 2, 3] })
  if (report.topMenus.length === 0) {
    emptyTableText()
  } else {
    report.topMenus.slice(0, 10).forEach((menu) => {
      tableRow([menu.name, menu.quantity, formatRupiah(menu.revenue), formatRupiah(menu.profit)], topMenuWidths, {
        alignRight: [1, 2, 3],
      })
    })
  }

  section("Pemakaian Material")
  tableRow(["Material", "Satuan", "Amount", "Estimasi Nilai"], materialUsageWidths, { header: true, alignRight: [2, 3] })
  if (report.materialUsage.length === 0) {
    emptyTableText()
  } else {
    report.materialUsage.slice(0, 10).forEach((material) => {
      tableRow(
        [
          material.name,
          getMaterialUnitLabel(material.unit),
          material.amount.toLocaleString("id-ID"),
          formatRupiah(material.estimatedValue),
        ],
        materialUsageWidths,
        { alignRight: [2, 3] }
      )
    })
  }

  section("Ringkasan Transaksi Material")
  tableRow(["Tipe", "Jumlah", "Total Amount"], materialTransactionWidths, { header: true, alignRight: [1, 2] })
  if (report.materialTransactionSummary.length === 0) {
    emptyTableText()
  } else {
    report.materialTransactionSummary.forEach((summary) => {
      tableRow(
        [getMaterialTransactionTypeLabel(summary.type), summary.count, formatSignedAmount(summary.amount)],
        materialTransactionWidths,
        { alignRight: [1, 2] }
      )
    })
  }

  section("Inventory Saat Ini")
  tableRow(["Material", "Satuan", "Stok", "Harga Beli", "Nilai"], inventoryWidths, {
    header: true,
    alignRight: [2, 3, 4],
  })
  if (report.inventory.length === 0) {
    emptyTableText()
  } else {
    report.inventory.forEach((material) => {
      tableRow(
        [
          material.name,
          getMaterialUnitLabel(material.unit),
          material.recordedAmount.toLocaleString("id-ID"),
          formatRupiah(material.recordedBuyPrice),
          formatRupiah(material.estimatedValue),
        ],
        inventoryWidths,
        { alignRight: [2, 3, 4] }
      )
    })
  }
  commitPage()

  const objects: string[] = []
  objects.push("<< /Type /Catalog /Pages 2 0 R >>")
  objects.push(`<< /Type /Pages /Kids [${pages.map((_, index) => `${5 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`)
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

  pages.forEach((pageCommands, index) => {
    const pageObjectId = 5 + index * 2
    const contentObjectId = pageObjectId + 1
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`)
    objects.push(`<< /Length ${pageCommands.length} >>\nstream\n${pageCommands}\nendstream`)
  })

  let pdf = "%PDF-1.4\n"
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new Blob([pdf], { type: "application/pdf" })
}

function downloadReportPdf(report: ReportClientProps["report"], filename: string) {
  downloadBlob(buildReportPdf(report), filename)
}

export function ReportClient({ report }: ReportClientProps) {
  const csvSuffix = `${report.range.startDate}_${report.range.endDate}`
  const formattedOrderRows = buildFormattedOrderRows(report)
  const formattedPurchaseRows = buildFormattedPurchaseRows(report)
  const formattedInventoryRows = buildFormattedInventoryRows(report)

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap justify-end gap-2 print:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadCsv(`laporan_order_${csvSuffix}.csv`, formattedOrderRows, orderCsvColumns)}
        >
          <DownloadIcon className="size-4" />
          CSV Order
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            downloadCsv(`laporan_pembelian_material_${csvSuffix}.csv`, formattedPurchaseRows, purchaseCsvColumns)
          }
        >
          <FileTextIcon className="size-4" />
          CSV Pembelian
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadCsv(`laporan_inventory_${csvSuffix}.csv`, formattedInventoryRows, inventoryCsvColumns)}
        >
          <FileTextIcon className="size-4" />
          CSV Inventory
        </Button>
        <Button type="button" onClick={() => downloadReportPdf(report, `laporan_${csvSuffix}.pdf`)}>
          <FileTextIcon className="size-4" />
          Export PDF
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Omzet" value={formatRupiah(report.metrics.revenue)} />
        <MetricCard label="Profit" value={formatRupiah(report.metrics.profit)} />
        <MetricCard label="Total Order" value={String(report.metrics.orderCount)} />
        <MetricCard label="Average Order" value={formatRupiah(report.metrics.averageOrderValue)} />
        <MetricCard label="Modal Snapshot" value={formatRupiah(report.metrics.buyPrice)} />
        <MetricCard label="Pembelian Material" value={formatRupiah(report.metrics.purchaseTotal)} />
        <MetricCard label="Jumlah Pembelian" value={String(report.metrics.purchaseCount)} />
        <MetricCard label="Nilai Stok Estimasi" value={formatRupiah(report.metrics.inventoryValue)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Tren Penjualan</h2>
          <ChartContainer config={salesChartConfig} className="mt-4 h-72 w-full">
            <BarChart data={report.salesTrend}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={42} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
              <Bar dataKey="profit" fill="var(--color-profit)" radius={4} />
            </BarChart>
          </ChartContainer>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Status Order</h2>
          <ChartContainer config={{ count: { label: "Jumlah" } }} className="mt-4 h-72 w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
              <Pie
                data={report.statusSummary.map((item) => ({
                  ...item,
                  status: getOrderStatusLabel(item.status),
                }))}
                dataKey="count"
                nameKey="status"
                innerRadius={55}
                outerRadius={90}
              >
                {report.statusSummary.map((item, index) => (
                  <Cell key={item.status} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Menu Terlaris</h2>
          <ChartContainer config={menuChartConfig} className="mt-4 h-72 w-full">
            <BarChart data={report.topMenus} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={110} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="quantity" fill="var(--color-quantity)" radius={4} />
            </BarChart>
          </ChartContainer>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Pemakaian Material</h2>
          <ChartContainer config={materialChartConfig} className="mt-4 h-72 w-full">
            <BarChart data={report.materialUsage} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={110} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
            </BarChart>
          </ChartContainer>
        </section>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Inventory Saat Ini</h2>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead>Sisa Stok</TableHead>
                <TableHead>Harga Beli</TableHead>
                <TableHead>Nilai Estimasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.inventory.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>{getMaterialUnitLabel(material.unit)}</TableCell>
                  <TableCell>{material.recordedAmount}</TableCell>
                  <TableCell>{formatRupiah(material.recordedBuyPrice)}</TableCell>
                  <TableCell>{formatRupiah(material.estimatedValue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Ringkasan Transaksi Material</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {report.materialTransactionSummary.map((summary) => (
            <div key={summary.type} className="rounded-lg border border-zinc-200 p-3">
              <p className="text-sm font-medium text-zinc-900">{getMaterialTransactionTypeLabel(summary.type)}</p>
              <p className="mt-1 text-xl font-semibold text-zinc-900">{summary.count}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{label}</p>
      <p className="mt-2 text-xl font-semibold text-zinc-900">{value}</p>
    </div>
  )
}
