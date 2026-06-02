import Link from "next/link"
import {
  ClipboardListIcon,
  ReceiptTextIcon,
  ShoppingCartIcon,
  SlidersHorizontalIcon,
} from "lucide-react"

import { getDashboardOverviewAction } from "@/actions/analytics"
import { DashboardSalesChart } from "@/components/dashboard/dashboard-sales-chart"
import { Button } from "@/components/ui/button"
import { getMaterialTransactionTypeLabel, getMaterialUnitLabel, getOrderStatusLabel } from "@/constants/constants"
import { formatDateTime, formatRupiah } from "@/lib/format"

export default async function DashboardPage() {
  const overview = await getDashboardOverviewAction()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-600">Ringkasan operasional hari ini dan aktivitas terbaru.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Order Hari Ini" value={String(overview.metrics.todayOrderCount)} />
        <MetricCard label="Omzet Hari Ini" value={formatRupiah(overview.metrics.todayRevenue)} />
        <MetricCard label="Profit Hari Ini" value={formatRupiah(overview.metrics.todayProfit)} />
        <MetricCard label="Order Pending" value={String(overview.metrics.pendingOrderCount)} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <ShortcutButton href="/dashboard/order/point-of-sales" icon={ShoppingCartIcon} label="Buka POS" />
        <ShortcutButton href="/dashboard/material/purchase/create" icon={ReceiptTextIcon} label="Tambah Pembelian" />
        <ShortcutButton href="/dashboard/material/adjustment" icon={SlidersHorizontalIcon} label="Adjustment Stok" />
        <ShortcutButton href="/dashboard/order?status=PENDING" icon={ClipboardListIcon} label="Order Pending" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Tren 7 Hari</h2>
          <DashboardSalesChart data={overview.salesTrend} />
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Alert Operasional</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-zinc-900">Stok Rendah / Habis</p>
              <div className="mt-2 space-y-2">
                {overview.alerts.lowStockMaterials.length === 0 ? (
                  <p className="text-sm text-zinc-500">Tidak ada material dengan stok rendah.</p>
                ) : (
                  overview.alerts.lowStockMaterials.map((material) => (
                    <Link
                      key={material.id}
                      href={`/dashboard/material/${material.id}`}
                      className="flex justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
                    >
                      <span className="font-medium text-zinc-900">{material.name}</span>
                      <span className="text-zinc-600">
                        {material.recordedAmount} {getMaterialUnitLabel(material.unit)}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-900">Menu Tanpa Resep</p>
              <div className="mt-2 space-y-2">
                {overview.alerts.menusWithoutRecipe.length === 0 ? (
                  <p className="text-sm text-zinc-500">Semua menu aktif sudah memiliki resep.</p>
                ) : (
                  overview.alerts.menusWithoutRecipe.map((menu) => (
                    <Link
                      key={menu.id}
                      href={`/dashboard/menu/${menu.id}`}
                      className="block rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                    >
                      {menu.name}
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Order Terbaru</h2>
          <div className="mt-4 space-y-2">
            {overview.latestOrders.map((order) => (
              <Link key={order.id} href={`/dashboard/order/${order.id}`} className="block rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50">
                <div className="flex justify-between gap-3">
                  <span className="font-medium text-zinc-900">#{order.id} - {order.customerName ?? "Walk-in"}</span>
                  <span className="text-zinc-600">{formatRupiah(order.total)}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {getOrderStatusLabel(order.status)} · {formatDateTime(order.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Transaksi Material Terbaru</h2>
          <div className="mt-4 space-y-2">
            {overview.latestTransactions.map((transaction) => (
              <Link key={transaction.id} href={`/dashboard/material/transaction/${transaction.id}`} className="block rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50">
                <div className="flex justify-between gap-3">
                  <span className="font-medium text-zinc-900">{transaction.materialName}</span>
                  <span className="text-zinc-600">{transaction.amount}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {getMaterialTransactionTypeLabel(transaction.type)} · {formatDateTime(transaction.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Pembelian Material Terbaru</h2>
          <div className="mt-4 space-y-2">
            {overview.latestPurchases.map((purchase) => (
              <Link key={purchase.id} href={`/dashboard/material/purchase/${purchase.id}`} className="block rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50">
                <div className="flex justify-between gap-3">
                  <span className="font-medium text-zinc-900">{purchase.invoiceNumber}</span>
                  <span className="text-zinc-600">{formatRupiah(purchase.total)}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{formatDateTime(purchase.createdAt)}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  )
}

function ShortcutButton({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <Button asChild variant="outline" className="justify-start bg-white">
      <Link href={href}>
        <Icon className="size-4" />
        {label}
      </Link>
    </Button>
  )
}
