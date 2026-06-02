import { getActiveMaterialsAction } from "@/actions/material"
import { MaterialPurchaseCreateClient } from "@/components/material/material-purchase-create-client"

export default async function MaterialPurchaseCreatePage() {
  const materials = await getActiveMaterialsAction()

  return <MaterialPurchaseCreateClient materials={materials} />
}
