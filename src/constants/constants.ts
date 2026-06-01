export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export const APP_NAME = "Be Nice Coffee"

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

export const MATERIAL_UNIT_LABEL_MAP = {
  GRAM: "Gram",
  ML: "Mililiter",
  PIECE: "Pcs",
} as const

export const MATERIAL_TRANSACTION_TYPE_LABEL_MAP = {
  PURCHASE: "Pembelian",
  SELL: "Penjualan",
  ADJUSTMENT: "Penyesuaian",
} as const

export const ORDER_STATUS_LABEL_MAP = {
  PENDING: "Pending",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
} as const

export function getMaterialUnitLabel(unit: string) {
  return MATERIAL_UNIT_LABEL_MAP[unit as keyof typeof MATERIAL_UNIT_LABEL_MAP] ?? unit
}

export function getMaterialTransactionTypeLabel(type: string) {
  return (
    MATERIAL_TRANSACTION_TYPE_LABEL_MAP[
      type as keyof typeof MATERIAL_TRANSACTION_TYPE_LABEL_MAP
    ] ?? type
  )
}

export function getOrderStatusLabel(status: string) {
  return ORDER_STATUS_LABEL_MAP[status as keyof typeof ORDER_STATUS_LABEL_MAP] ?? status
}

export const MATERIAL_UNITS = (
  Object.entries(MATERIAL_UNIT_LABEL_MAP) as Array<
    [keyof typeof MATERIAL_UNIT_LABEL_MAP, (typeof MATERIAL_UNIT_LABEL_MAP)[keyof typeof MATERIAL_UNIT_LABEL_MAP]]
  >
).map(([value, label]) => ({ value, label }))

export const MATERIAL_TRANSACTION_TYPES = (
  Object.entries(MATERIAL_TRANSACTION_TYPE_LABEL_MAP) as Array<
    [
      keyof typeof MATERIAL_TRANSACTION_TYPE_LABEL_MAP,
      (typeof MATERIAL_TRANSACTION_TYPE_LABEL_MAP)[keyof typeof MATERIAL_TRANSACTION_TYPE_LABEL_MAP],
    ]
  >
).map(([value, label]) => ({ value, label }))

export type DashboardNavigationItem = {
  href: string
  label: string
}

export type DashboardNavigationSection = {
  title: string
  items: DashboardNavigationItem[]
}

export const DASHBOARD_NAVIGATION: DashboardNavigationSection[] = [
  {
    title: "Beranda",
    items: [{ href: "/dashboard", label: "Dashboard" }],
  },
  {
    title: "Master Data",
    items: [
      { href: "/dashboard/menu", label: "Menu & Resep" },
      { href: "/dashboard/material", label: "Material" },
      { href: "/dashboard/customer", label: "Customer" },
      { href: "/dashboard/user", label: "Pengguna" },
      { href: "/dashboard/account", label: "Akun Saya" },
    ],
  },
  {
    title: "Inventory",
    items: [
      { href: "/dashboard/material/transaction", label: "Transaksi Material" },
      { href: "/dashboard/material/purchase", label: "Pembelian Material" },
      { href: "/dashboard/material/adjustment", label: "Penyesuaian Material" },
    ],
  },
  {
    title: "Penjualan",
    items: [
      { href: "/dashboard/order", label: "Riwayat Pesanan" },
      { href: "/dashboard/order/point-of-sales", label: "Point of Sales" },
      { href: "/dashboard/report", label: "Laporan" },
    ],
  },
]
