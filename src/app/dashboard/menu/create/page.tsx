import { getActiveMaterialsAction } from "@/actions/material"
import CreateMenuClient from "@/app/dashboard/menu/create/client"
import { requireDashboardAccess } from "@/lib/authorization"

export default async function CreateMenuPage() {
  await requireDashboardAccess("accessMenuWrite")

  const materials = await getActiveMaterialsAction()

  return <CreateMenuClient materials={materials} />
}
