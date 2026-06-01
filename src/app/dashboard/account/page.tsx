import { redirect } from "next/navigation"

import { getMyAccountAction } from "@/actions/account"
import { AccountProfileClient } from "@/components/account/account-profile-client"

export default async function AccountPage() {
  const account = await getMyAccountAction()

  if (!account) {
    redirect("/auth/login")
  }

  return <AccountProfileClient account={account} />
}
