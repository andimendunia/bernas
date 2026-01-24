"use client"

import { useRouter } from "next/navigation"

import { EventDetail, type EventDetailProps } from "./event-detail"

type EventDetailWrapperProps = Omit<EventDetailProps, "onEventUpdated">

export function EventDetailWrapper(props: EventDetailWrapperProps) {
  const router = useRouter()

  const handleEventUpdated = () => {
    router.refresh()
    setTimeout(() => {
      router.refresh()
    }, 100)
  }

  return <EventDetail {...props} onEventUpdated={handleEventUpdated} />
}
