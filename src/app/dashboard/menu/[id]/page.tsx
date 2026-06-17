import { notFound } from "next/navigation"

import { getActiveMaterialsAction } from "@/actions/material"
import { getMenuDetailAction } from "@/actions/menu"
import MenuDetailClient from "@/app/dashboard/menu/[id]/client"
import { requireDashboardAccess } from "@/lib/authorization"

type MenuDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function MenuDetailPage({ params }: MenuDetailPageProps) {
  await requireDashboardAccess("accessMenuRead")

  const { id } = await params
  const menuId = Number(id)

  if (Number.isNaN(menuId)) {
    notFound()
  }

  const [menu, materials] = await Promise.all([
    getMenuDetailAction(menuId),
    getActiveMaterialsAction(),
  ])

  if (!menu) {
    notFound()
  }

  return <MenuDetailClient menu={menu} materials={materials} />
}
