import { getOrderFormOptionsAction } from "@/actions/order"
import { PointOfSalesClient } from "@/components/order/point-of-sales-client"

export default async function PointOfSalesPage() {
  const { menus, customers } = await getOrderFormOptionsAction()

  return <PointOfSalesClient menus={menus} customers={customers} />
}
