type BrandMarkProps = {
  className?: string
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 p-2 shadow-sm ${className ?? ""}`}
    >
      <img src="/favicon.svg" alt="" className="h-full w-full" />
    </span>
  )
}
