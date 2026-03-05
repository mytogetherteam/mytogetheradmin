import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "default" | "lg"
}

export function Loader({ className, size = "default", ...props }: LoaderProps) {
    return (
        <div
            className={cn("flex items-center justify-center", className)}
            {...props}
        >
            <Loader2
                className={cn("animate-spin text-primary", {
                    "h-4 w-4": size === "sm",
                    "h-8 w-8": size === "default",
                    "h-12 w-12": size === "lg",
                })}
            />
        </div>
    )
}
