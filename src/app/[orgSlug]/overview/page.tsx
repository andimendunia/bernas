import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Skeleton } from "@/components/ui/skeleton"
import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}): Promise<Metadata> {
  const { orgSlug } = await params
  const supabase = await createSupabaseServerClient()
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("slug", orgSlug)
    .single()

  return {
    title: `Overview - ${org?.name ?? "Bernas"}`,
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  void orgSlug

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Overview" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {[
            { label: "Active events" },
            { label: "Tasks in progress" },
            { label: "Resources linked" },
          ].map((stat) => (
            <Card key={stat.label} className="p-4">
              <Skeleton className="h-7 w-16" />
              <div className="mt-2 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Recent events</div>
              <Badge variant="secondary">All events</Badge>
            </div>
            <div className="mt-4 grid gap-3">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={`event-${item}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">My tasks</div>
              <Badge variant="secondary">Assigned to you</Badge>
            </div>
            <div className="mt-4 grid gap-3">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={`task-${item}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-6 w-14" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
