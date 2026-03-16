import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  fallbackIcon?: React.ReactNode;
}

export function TableImage({ src, alt, className, size = "md", fallbackIcon }: TableImageProps) {
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const hasImage = src && !error;

  return (
    <div
      className={cn(
        "rounded-md overflow-hidden border bg-muted flex items-center justify-center shrink-0",
        sizeClasses[size],
        className
      )}
    >
      {hasImage ? (
        <img
          src={src}
          alt={alt || "Image"}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={() => setError(true)}
        />
      ) : fallbackIcon ? (
        fallbackIcon
      ) : (
        <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-1">
          <ImageIcon className="h-1/2 w-1/2 mb-0.5" strokeWidth={1.5} />
          <span className="text-[8px] font-medium uppercase tracking-tight">None</span>
        </div>
      )}
    </div>
  );
}
