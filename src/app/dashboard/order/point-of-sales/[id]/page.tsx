import { notFound } from "next/navigation"

import { getOrderDetailAction } from "@/actions/order"
import { PointOfSalesInvoiceClient } from "@/components/order/point-of-sales-invoice-client"
import { requireDashboardAccess } from "@/lib/authorization"

type PointOfSalesInvoicePageProps = {
  params: Promise<{ id: string }>
}

export default async function PointOfSalesInvoicePage({ params }: PointOfSalesInvoicePageProps) {
  await requireDashboardAccess("accessPointOfSalesWrite")

  const { id } = await params
  const orderId = Number(id)

  if (Number.isNaN(orderId)) {
    notFound()
  }

  const order = await getOrderDetailAction(orderId)

  if (!order) {
    notFound()
  }

  return <PointOfSalesInvoiceClient order={order} />
}
