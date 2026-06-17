import { getActiveMaterialsAction } from "@/actions/material"
import { MaterialPurchaseCreateClient } from "@/components/material/material-purchase-create-client"
import { requireDashboardAccess } from "@/lib/authorization"

export default async function MaterialPurchaseCreatePage() {
  await requireDashboardAccess("accessMaterialPurchaseWrite")

  const materials = await getActiveMaterialsAction()

  return <MaterialPurchaseCreateClient materials={materials} />
}
