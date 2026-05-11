import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface PageLoaderProps {
  fullScreen?: boolean
  message?: string
  className?: string
}

export function PageLoader({ 
  fullScreen = true, 
  message = "Loading...",
  className 
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullScreen && "min-h-screen",
        className
      )}
    >
      <Spinner size="xl" />
      {message && (
        <p className="text-muted-foreground text-sm animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}
