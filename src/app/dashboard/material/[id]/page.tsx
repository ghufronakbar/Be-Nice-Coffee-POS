import { notFound } from "next/navigation"

import { getMaterialDetailAction } from "@/actions/material"
import { MaterialDetailClient } from "@/components/material/material-detail-client"

type MaterialDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function MaterialDetailPage({ params }: MaterialDetailPageProps) {
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
