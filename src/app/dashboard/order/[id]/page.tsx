import { notFound } from "next/navigation"

import { getOrderDetailAction, getOrderFormOptionsAction } from "@/actions/order"
import { OrderDetailClient } from "@/components/order/order-detail-client"

type OrderDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params
  const orderId = Number(id)

  if (Number.isNaN(orderId)) {
    notFound()
  }

  const [order, options] = await Promise.all([
    getOrderDetailAction(orderId),
    getOrderFormOptionsAction(),
  ])

  if (!order) {
    notFound()
  }

  return <OrderDetailClient order={order} menus={options.menus} customers={options.customers} />
}
