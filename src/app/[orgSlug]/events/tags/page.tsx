import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Event tags",
}

export default async function EventTagsPage({
  params,
}: {
  params: { orgSlug: string }
}) {
  const { orgSlug } = await params

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Event tags"
        sectionHref={`/${orgSlug}/events`}
        sectionLabel="Events"
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={`tag-${index}`}
                className="rounded-lg border border-dashed border-border p-4"
              >
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-3 h-3 w-16" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
