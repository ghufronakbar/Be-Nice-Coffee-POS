import { notFound } from "next/navigation"

import { getCustomerDetailAction } from "@/actions/customer"
import { CustomerDetailClient } from "@/components/customer/customer-detail-client"

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params
  const customerId = Number(id)

  if (Number.isNaN(customerId)) {
    notFound()
  }

  const customer = await getCustomerDetailAction(customerId)

  if (!customer) {
    notFound()
  }

  return <CustomerDetailClient customer={customer} />
}
