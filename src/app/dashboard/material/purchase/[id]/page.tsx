import { notFound } from "next/navigation"

import { getActiveMaterialsAction, getMaterialPurchaseDetailAction } from "@/actions/material"
import { MaterialPurchaseDetailClient } from "@/components/material/material-purchase-detail-client"

type MaterialPurchaseDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function MaterialPurchaseDetailPage({ params }: MaterialPurchaseDetailPageProps) {
  const { id } = await params
  const purchaseId = Number(id)

  if (Number.isNaN(purchaseId)) {
    notFound()
  }

  const [purchase, materials] = await Promise.all([
    getMaterialPurchaseDetailAction(purchaseId),
    getActiveMaterialsAction(),
  ])

  if (!purchase) {
    notFound()
  }

  return <MaterialPurchaseDetailClient purchase={purchase} materials={materials} />
}
