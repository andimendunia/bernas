"use client"

import { useRouter } from "next/navigation"
import {
  OrganizationProfile,
  type OrganizationProfileProps,
} from "@/components/organization/organization-profile"

type OrganizationProfileWrapperProps = Omit<OrganizationProfileProps, "onUpdated">

export function OrganizationProfileWrapper(props: OrganizationProfileWrapperProps) {
  const router = useRouter()

  const handleUpdated = () => {
    router.refresh()
    setTimeout(() => {
      router.refresh()
    }, 100)
  }

  return <OrganizationProfile {...props} onUpdated={handleUpdated} />
}
