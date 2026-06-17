import { getOrderFormOptionsAction } from "@/actions/order"
import { PointOfSalesClient } from "@/components/order/point-of-sales-client"
import { requireDashboardAccess } from "@/lib/authorization"

export default async function PointOfSalesPage() {
  await requireDashboardAccess("accessPointOfSalesWrite")

  const { menus, customers } = await getOrderFormOptionsAction()

  return <PointOfSalesClient menus={menus} customers={customers} />
}
