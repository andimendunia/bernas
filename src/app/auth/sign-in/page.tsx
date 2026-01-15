import Link from "next/link"

import { BrandMark } from "@/components/brand/brand-mark"
import { SignInForm } from "@/components/auth/sign-in-form"

export const metadata = {
  title: "Sign in - Bernas",
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#fff8f7]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div className="text-lg font-semibold tracking-tight">Bernas</div>
          </div>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to Home
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center pb-12">
          <SignInForm />
        </main>
      </div>
    </div>
  )
}
