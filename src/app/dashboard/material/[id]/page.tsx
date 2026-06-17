import { notFound } from "next/navigation"

import { getMaterialDetailAction } from "@/actions/material"
import { MaterialDetailClient } from "@/components/material/material-detail-client"
import { requireDashboardAccess } from "@/lib/authorization"

type MaterialDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function MaterialDetailPage({ params }: MaterialDetailPageProps) {
  await requireDashboardAccess("accessMaterialRead")

  const { id } = await params
  const materialId = Number(id)

  if (Number.isNaN(materialId)) {
    notFound()
  }

  const material = await getMaterialDetailAction(materialId)

  if (!material) {
    notFound()
  }

  return <MaterialDetailClient material={material} />
}
