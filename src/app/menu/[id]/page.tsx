import { redirect } from "next/navigation"

type MenuDetailAliasPageProps = {
  params: Promise<{ id: string }>
}

export default async function MenuDetailAliasPage({ params }: MenuDetailAliasPageProps) {
  const { id } = await params
  redirect(`/dashboard/menu/${id}`)
}
