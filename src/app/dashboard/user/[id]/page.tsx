import { notFound } from "next/navigation"

import { getUserDetailAction } from "@/actions/user-management"
import { UserDetailClient } from "@/components/user/user-detail-client"

type UserDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params
  const userId = Number(id)

  if (Number.isNaN(userId)) {
    notFound()
  }

  const user = await getUserDetailAction(userId)

  if (!user) {
    notFound()
  }

  return <UserDetailClient user={user} />
}
