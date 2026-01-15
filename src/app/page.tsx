import Link from "next/link"
import { Check, ChevronRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { BrandMark } from "@/components/brand/brand-mark"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export const metadata = {
  title: "Bernas",
}

export default async function Home() {
  const t = await getTranslations("home")
  const repositoryItems = t.raw("repository.items") as string[]

  return (
    <div className="min-h-screen bg-[#fff8f7] text-foreground">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-16 h-80 w-80 rounded-full bg-[#f7c9c9]/70 blur-[120px]" />
          <div className="absolute -right-24 top-40 h-72 w-72 rounded-full bg-[#f2b5b5]/70 blur-[120px]" />
          <div className="absolute left-1/3 top-[28rem] h-64 w-64 rounded-full bg-[#fbe2e2]/80 blur-[120px]" />
        </div>
        <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div className="text-lg font-semibold tracking-tight">Bernas</div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a className="hover:text-foreground" href="#product">
              {t("nav.product")}
            </a>
            <a className="hover:text-foreground" href="#how">
              {t("nav.howItWorks")}
            </a>
            <a className="hover:text-foreground" href="#repository">
              {t("nav.repository")}
            </a>
            <a className="hover:text-foreground" href="#contact">
              {t("nav.contact")}
            </a>
          </nav>
          <Button asChild>
            <Link href="/auth/sign-in">Sign in</Link>
          </Button>
        </header>
        <main className="relative mx-auto w-full max-w-6xl px-6 pb-24 pt-14">
          <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <Badge className="bg-white/80 text-foreground shadow-sm">
                {t("hero.badge")}
              </Badge>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                {t("hero.title")}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/auth/sign-in">Sign in</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#how">
                    {t("hero.ctaSecondary")}
                    <ChevronRight className="ml-1 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <Card className="border-0 bg-white/80 p-6 shadow-lg">
              <div className="grid gap-6">
                <div className="rounded-2xl border border-dashed border-primary/30 bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Participation intent
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Full
                    </div>
                    <div className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                      Partial
                    </div>
                    <div className="rounded-full border border-muted px-3 py-1 text-xs font-semibold">
                      Declined
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Next event
                    </div>
                    <div className="mt-2 text-lg font-semibold">
                      Coastal cleanup mobilization
                    </div>
                    <div className="text-sm text-muted-foreground">
                      8 tasks, 16 members pledged participation
                    </div>
                  </div>
                  <div className="grid gap-2 rounded-2xl bg-[#fff3f2] p-4">
                    <div className="text-sm font-medium">
                      Repository attachments
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Drive folder + 2 links connected
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section
            id="product"
            className="mt-20 grid gap-4 md:grid-cols-3"
          >
            {[
              {
                value: "24+",
                label: t("stats.organizations"),
              },
              {
                value: "180",
                label: t("stats.events"),
              },
              {
                value: "3",
                label: t("stats.participation"),
              },
            ].map((stat) => (
              <Card key={stat.label} className="bg-white/80 p-6 shadow-sm">
                <div className="text-3xl font-semibold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </section>

          <section id="how" className="mt-20">
            <div className="mb-6 text-sm font-medium text-muted-foreground">
              {t("nav.howItWorks")}
            </div>
            <Tabs defaultValue="events" className="w-full">
            <TabsList className="grid h-10 w-full grid-cols-3 rounded-lg border border-border bg-white/80 p-1">
              <TabsTrigger
                value="events"
                className="data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:bg-primary/20 data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {t("tabs.events")}
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:bg-primary/20 data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {t("tabs.tasks")}
              </TabsTrigger>
              <TabsTrigger
                value="resources"
                className="data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:bg-primary/20 data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {t("tabs.resources")}
              </TabsTrigger>
            </TabsList>
              <TabsContent value="events" className="mt-6">
                <Card className="bg-white/80 p-8">
                  <div className="text-2xl font-semibold">
                    {t("features.events.title")}
                  </div>
                  <p className="mt-3 text-muted-foreground">
                    {t("features.events.desc")}
                  </p>
                </Card>
              </TabsContent>
              <TabsContent value="tasks" className="mt-6">
                <Card className="bg-white/80 p-8">
                  <div className="text-2xl font-semibold">
                    {t("features.tasks.title")}
                  </div>
                  <p className="mt-3 text-muted-foreground">
                    {t("features.tasks.desc")}
                  </p>
                </Card>
              </TabsContent>
              <TabsContent value="resources" className="mt-6">
                <Card className="bg-white/80 p-8">
                  <div className="text-2xl font-semibold">
                    {t("features.resources.title")}
                  </div>
                  <p className="mt-3 text-muted-foreground">
                    {t("features.resources.desc")}
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          </section>

          <section className="mt-20 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="text-3xl font-semibold">
                {t("participation.title")}
              </div>
              <p className="mt-3 text-muted-foreground">
                {t("participation.subtitle")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Badge className="bg-primary text-primary-foreground">
                  {t("participation.full")}
                </Badge>
                <Badge variant="secondary">{t("participation.partial")}</Badge>
                <Badge variant="outline">{t("participation.declined")}</Badge>
              </div>
            </div>
            <Card className="bg-white/80 p-6">
              <div className="text-sm font-semibold">Participation log</div>
              <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>River survey workshop</span>
                  <span className="font-semibold text-foreground">Full</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Volunteer onboarding</span>
                  <span className="font-semibold text-foreground">Partial</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Donor briefing</span>
                  <span className="font-semibold text-foreground">Declined</span>
                </div>
              </div>
            </Card>
          </section>

          <section
            id="repository"
            className="mt-20 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"
          >
            <Card className="bg-white/80 p-6">
              <div className="text-2xl font-semibold">
                {t("repository.title")}
              </div>
              <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
                {repositoryItems.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="bg-white/80 p-6">
              <div className="text-sm font-semibold">Resource snapshot</div>
              <div className="mt-4 grid gap-4">
                <div className="rounded-xl border border-dashed border-muted p-4">
                  <div className="text-sm font-medium">Drive links</div>
                  <div className="text-xs text-muted-foreground">
                    12 resources connected across 4 events
                  </div>
                </div>
                <div className="rounded-xl bg-[#fff3f2] p-4">
                  <div className="text-sm font-medium">Quick attachments</div>
                  <div className="text-xs text-muted-foreground">
                    Link once, reuse across organization and task scopes.
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section id="contact" className="mt-20">
            <Card className="bg-white/80 p-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
                <div>
                  <div className="text-3xl font-semibold">
                    {t("contact.title")}
                  </div>
                  <p className="mt-3 text-muted-foreground">
                    {t("contact.subtitle")}
                  </p>
                </div>
                <form className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">{t("contact.name")}</Label>
                    <Input id="name" placeholder="Rina Pratiwi" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t("contact.email")}</Label>
                    <Input id="email" type="email" placeholder="rina@lsm.id" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="org">{t("contact.org")}</Label>
                    <Input id="org" placeholder="LSM Bahari" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="message">{t("contact.message")}</Label>
                    <Textarea id="message" placeholder="We run 12 events/month." />
                  </div>
                  <Button type="submit">{t("contact.submit")}</Button>
                </form>
              </div>
            </Card>
          </section>
        </main>
      </div>
      <footer className="border-t border-white/60 bg-white/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="font-medium text-foreground">Bernas</div>
          <div>{t("footer.tagline")}</div>
        </div>
      </footer>
    </div>
  );
}
