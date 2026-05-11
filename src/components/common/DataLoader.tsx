import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface DataLoaderProps {
  isLoading: boolean
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  type?: "spinner" | "skeleton"
  skeletonCount?: number
  skeletonClassName?: string
  className?: string
}

export function DataLoader({
  isLoading,
  children,
  loadingComponent,
  type = "spinner",
  skeletonCount = 3,
  skeletonClassName,
  className,
}: DataLoaderProps) {
  if (!isLoading) {
    return <>{children}</>
  }

  if (loadingComponent) {
    return <>{loadingComponent}</>
  }

  if (type === "skeleton") {
    return (
      <div className={cn("space-y-3 my-4", className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className={cn("h-12 w-full", skeletonClassName)} />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center justify-center py-8 h-[90vh]", className)}>
      <div className="flex flex-col items-center justify-center gap-4 bg-gray-100 text-white dark:bg-gray-100 dark:text-gray-900 rounded shadow p-8">
        <Spinner size="xl" className="dark:text-gray-900" />
        <p className="text-muted-foreground text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  )
}
