import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Calendar",
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function CalendarPage() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Calendar" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card className="p-6">
          <div className="grid grid-cols-7 gap-2 text-xs uppercase text-muted-foreground">
            {weekDays.map((day) => (
              <div key={day} className="text-center">
                {day}
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, index) => (
              <div
                key={`cell-${index}`}
                className="flex h-24 flex-col rounded-lg border border-border bg-white/70 p-2"
              >
                <Skeleton className="h-3 w-6" />
                <Skeleton className="mt-3 h-3 w-14" />
                <Skeleton className="mt-2 h-3 w-10" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
