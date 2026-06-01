export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export const APP_NAME = "Be Nice Coffee"

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

export const MATERIAL_UNITS = [
  { value: "GRAM", label: "Gram" },
  { value: "ML", label: "Mililiter" },
  { value: "PIECE", label: "Pcs" },
] as const

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
