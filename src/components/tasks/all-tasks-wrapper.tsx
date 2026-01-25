"use client"

import { useRouter } from "next/navigation"

import { AllTasks, type AllTasksProps } from "./all-tasks"

type AllTasksWrapperProps = Omit<AllTasksProps, "onTasksUpdated">

export function AllTasksWrapper(props: AllTasksWrapperProps) {
  const router = useRouter()

  const handleTasksUpdated = () => {
    router.refresh()
    setTimeout(() => {
      router.refresh()
    }, 100)
  }

  return <AllTasks {...props} onTasksUpdated={handleTasksUpdated} />
}
