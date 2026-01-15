import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "All events",
}

export default function EventsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="All events"
        sectionHref="/dashboard/events"
        sectionLabel="Events"
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card className="p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-10 w-full md:w-72" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="mt-4 grid gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`event-row-${index}`}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
