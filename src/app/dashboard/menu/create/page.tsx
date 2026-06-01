import { getActiveMaterialsAction } from "@/actions/material"
import CreateMenuClient from "@/app/dashboard/menu/create/client"

export default async function CreateMenuPage() {
  const materials = await getActiveMaterialsAction()

  return <CreateMenuClient materials={materials} />
}
