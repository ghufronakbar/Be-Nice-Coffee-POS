"use client"

import { MenuEditorForm } from "@/components/menu/menu-editor-form"
import { type MaterialOption } from "@/actions/material"

type CreateMenuClientProps = {
  materials: MaterialOption[]
}

export default function CreateMenuClient({ materials }: CreateMenuClientProps) {
  return <MenuEditorForm mode="create" materials={materials} />
}
