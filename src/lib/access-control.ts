export const ACCESS_FIELDS = [
  "accessOverviewRead",
  "accessMenuRead",
  "accessMenuWrite",
  "accessMaterialRead",
  "accessMaterialWrite",
  "accessCustomerRead",
  "accessCustomerWrite",
  "accessUserRead",
  "accessMaterialTransactionRead",
  "accessMaterialPurchaseRead",
  "accessMaterialPurchaseWrite",
  "accessMaterialAdjustmentRead",
  "accessMaterialAdjustmentWrite",
  "accessOrderRead",
  "accessOrderWrite",
  "accessPointOfSalesWrite",
  "accessReportRead",
] as const

export type AccessField = (typeof ACCESS_FIELDS)[number]

export type AccessMap = Record<AccessField, boolean>

export type AccessControlledUser = {
  isSuperAdmin: boolean
} & AccessMap

export type ResolvedAccessUser = {
  isSuperAdmin: boolean
  access: AccessMap
}

export const ACCESS_SELECT = {
  accessOverviewRead: true,
  accessMenuRead: true,
  accessMenuWrite: true,
  accessMaterialRead: true,
  accessMaterialWrite: true,
  accessCustomerRead: true,
  accessCustomerWrite: true,
  accessUserRead: true,
  accessMaterialTransactionRead: true,
  accessMaterialPurchaseRead: true,
  accessMaterialPurchaseWrite: true,
  accessMaterialAdjustmentRead: true,
  accessMaterialAdjustmentWrite: true,
  accessOrderRead: true,
  accessOrderWrite: true,
  accessPointOfSalesWrite: true,
  accessReportRead: true,
} as const

export type AccessGroup = {
  title: string
  description: string
  fields: Array<{
    field: AccessField
    label: string
    description: string
  }>
  subgroups?: Array<{
    label: string
    fields: AccessField[]
  }>
}

export const DEFAULT_ACCESS_MAP = Object.fromEntries(
  ACCESS_FIELDS.map((field) => [field, false])
) as AccessMap

export const ACCESS_GROUPS: AccessGroup[] = [
  {
    title: "Beranda",
    description: "Akses ringkasan dashboard utama.",
    fields: [
      {
        field: "accessOverviewRead",
        label: "Lihat dashboard",
        description: "Melihat ringkasan omzet, stok, alert, dan aktivitas terbaru.",
      },
    ],
  },
  {
    title: "Master Data",
    description: "Akses data utama operasional.",
    fields: [
      {
        field: "accessMenuRead",
        label: "Lihat menu",
        description: "Melihat list dan detail menu beserta resep.",
      },
      {
        field: "accessMenuWrite",
        label: "Kelola menu",
        description: "Membuat dan mengubah menu beserta resep.",
      },
      {
        field: "accessMaterialRead",
        label: "Lihat material",
        description: "Melihat list dan detail material.",
      },
      {
        field: "accessMaterialWrite",
        label: "Kelola material",
        description: "Membuat, mengubah, dan menghapus material.",
      },
      {
        field: "accessCustomerRead",
        label: "Lihat customer",
        description: "Melihat list dan detail customer.",
      },
      {
        field: "accessCustomerWrite",
        label: "Kelola customer",
        description: "Membuat, mengubah, dan menghapus customer.",
      },
      {
        field: "accessUserRead",
        label: "Lihat user",
        description: "Melihat list dan detail user. Aksi tulis user tetap khusus superadmin.",
      },
    ],
    subgroups: [
      { label: "Menu", fields: ["accessMenuRead", "accessMenuWrite"] },
      { label: "Material", fields: ["accessMaterialRead", "accessMaterialWrite"] },
      { label: "Customer", fields: ["accessCustomerRead", "accessCustomerWrite"] },
      { label: "User", fields: ["accessUserRead"] },
    ],
  },
  {
    title: "Inventory",
    description: "Akses transaksi stok material.",
    fields: [
      {
        field: "accessMaterialTransactionRead",
        label: "Lihat transaksi material",
        description: "Melihat riwayat mutasi stok material.",
      },
      {
        field: "accessMaterialPurchaseRead",
        label: "Lihat pembelian material",
        description: "Melihat list dan detail pembelian material.",
      },
      {
        field: "accessMaterialPurchaseWrite",
        label: "Kelola pembelian material",
        description: "Membuat, mengubah, dan menghapus pembelian material.",
      },
      {
        field: "accessMaterialAdjustmentRead",
        label: "Lihat penyesuaian material",
        description: "Melihat list penyesuaian stok.",
      },
      {
        field: "accessMaterialAdjustmentWrite",
        label: "Kelola penyesuaian material",
        description: "Membuat, mengubah, dan menghapus penyesuaian stok.",
      },
    ],
    subgroups: [
      { label: "Transaksi", fields: ["accessMaterialTransactionRead"] },
      {
        label: "Pembelian",
        fields: ["accessMaterialPurchaseRead", "accessMaterialPurchaseWrite"],
      },
      {
        label: "Penyesuaian",
        fields: ["accessMaterialAdjustmentRead", "accessMaterialAdjustmentWrite"],
      },
    ],
  },
  {
    title: "Penjualan",
    description: "Akses order, POS, dan laporan.",
    fields: [
      {
        field: "accessOrderRead",
        label: "Lihat order",
        description: "Melihat riwayat dan detail order.",
      },
      {
        field: "accessOrderWrite",
        label: "Kelola order",
        description: "Mengubah dan menghapus order.",
      },
      {
        field: "accessPointOfSalesWrite",
        label: "Point of sales",
        description: "Membuat checkout order baru dari halaman kasir.",
      },
      {
        field: "accessReportRead",
        label: "Lihat laporan",
        description: "Melihat dashboard laporan dan export.",
      },
    ],
    subgroups: [
      { label: "Order", fields: ["accessOrderRead", "accessOrderWrite"] },
      { label: "Kasir", fields: ["accessPointOfSalesWrite"] },
      { label: "Laporan", fields: ["accessReportRead"] },
    ],
  },
]

export const DASHBOARD_LANDING_PRIORITY: Array<{ access: AccessField; href: string }> = [
  { access: "accessOverviewRead", href: "/dashboard" },
  { access: "accessPointOfSalesWrite", href: "/dashboard/order/point-of-sales" },
  { access: "accessOrderRead", href: "/dashboard/order" },
  { access: "accessMenuRead", href: "/dashboard/menu" },
  { access: "accessMaterialRead", href: "/dashboard/material" },
  { access: "accessMaterialTransactionRead", href: "/dashboard/material/transaction" },
  { access: "accessMaterialPurchaseRead", href: "/dashboard/material/purchase" },
  { access: "accessMaterialAdjustmentRead", href: "/dashboard/material/adjustment" },
  { access: "accessCustomerRead", href: "/dashboard/customer" },
  { access: "accessUserRead", href: "/dashboard/user" },
  { access: "accessReportRead", href: "/dashboard/report" },
]

export function resolveUserAccess(user: AccessControlledUser): AccessMap {
  if (user.isSuperAdmin) {
    return Object.fromEntries(ACCESS_FIELDS.map((field) => [field, true])) as AccessMap
  }

  return Object.fromEntries(ACCESS_FIELDS.map((field) => [field, Boolean(user[field])])) as AccessMap
}

export function getAccessMap(user: AccessControlledUser | ResolvedAccessUser) {
  if ("access" in user) {
    return user.access
  }

  return resolveUserAccess(user)
}

export function hasAccess(user: AccessControlledUser | ResolvedAccessUser, field: AccessField) {
  return getAccessMap(user)[field]
}

export function resolveDashboardLandingPath(user: AccessControlledUser | ResolvedAccessUser) {
  const access = getAccessMap(user)
  const landing = DASHBOARD_LANDING_PRIORITY.find((item) => access[item.access])

  return landing?.href ?? "/dashboard/account"
}
