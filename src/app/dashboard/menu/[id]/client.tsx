"use client"

import { MenuEditorForm } from "@/components/menu/menu-editor-form"
import { type MaterialOption } from "@/actions/material"
import { type MenuDetail } from "@/actions/menu"

type MenuDetailClientProps = {
  menu: MenuDetail
  materials: MaterialOption[]
}

export default function MenuDetailClient({ menu, materials }: MenuDetailClientProps) {
  return (
    <MenuEditorForm
      mode="edit"
      menuId={menu.id}
      materials={materials}
      initialValues={{
        name: menu.name,
        price: menu.price,
        imageUrl: menu.imageUrl ?? "",
        recipes: menu.recipes.map((recipe) => ({
          materialId: recipe.materialId,
          amount: recipe.amount,
        })),
      }}
    />
  )
}
