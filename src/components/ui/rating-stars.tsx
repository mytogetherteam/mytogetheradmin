import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export interface RatingStarsProps {
    rating: number
    max?: number
    size?: number
    className?: string
}

export function RatingStars({
    rating,
    max = 5,
    size = 16,
    className,
}: RatingStarsProps) {
    return (
        <div className={cn("flex items-center space-x-0.5", className)}>
            {Array.from({ length: max }).map((_, i) => {
                const fullStar = i < Math.floor(rating)
                const halfStar = i === Math.floor(rating) && rating % 1 !== 0

                if (fullStar) {
                    return (
                        <Star
                            key={i}
                            size={size}
                            className="fill-yellow-400 text-yellow-400"
                        />
                    )
                }

                if (halfStar) {
                    return (
                        <div key={i} className="relative">
                            <Star size={size} className="text-gray-300" />
                            <div className="absolute top-0 left-0 overflow-hidden w-[50%]">
                                <Star size={size} className="fill-yellow-400 text-yellow-400" />
                            </div>
                        </div>
                    )
                }

                return <Star key={i} size={size} className="text-gray-300" />
            })}
        </div>
    )
}
