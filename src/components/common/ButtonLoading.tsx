"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ButtonLoadingProps
  extends React.ComponentProps<typeof Button> {
  label?: string
  loading?: boolean
}

export function ButtonLoading({
  label = "Loading...",
  loading = false,
  className,
  children,
  ...props
}: ButtonLoadingProps) {
  return (
    <Button
      disabled={loading || props.disabled}
      className={cn(
        "relative flex items-center justify-center gap-2",
        loading && "cursor-not-allowed opacity-80",
        className
      )}
      {...props}
    >
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin text-current" />
      )}
      {loading ? label : children}
    </Button>
  )
}
