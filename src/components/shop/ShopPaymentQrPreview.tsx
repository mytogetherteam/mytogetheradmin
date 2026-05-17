import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

type ShopPaymentQrPreviewProps = {
    file?: File
    existingUrl?: string | null
    label: string
    onRemove: () => void
}

export function ShopPaymentQrPreview({
    file,
    existingUrl,
    label,
    onRemove,
}: ShopPaymentQrPreviewProps) {
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!file) {
            setFilePreviewUrl(null)
            return
        }

        const url = URL.createObjectURL(file)
        setFilePreviewUrl(url)

        return () => URL.revokeObjectURL(url)
    }, [file])

    const previewUrl = filePreviewUrl || existingUrl
    if (!previewUrl) return null

    return (
        <div className="mt-3 flex items-start gap-3">
            <div className="relative h-32 w-32 overflow-hidden rounded-md border bg-background">
                <img
                    src={previewUrl}
                    alt={`${label} QR preview`}
                    className="h-full w-full object-contain"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                />
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={onRemove}
            >
                <X className="h-3.5 w-3.5" />
                Remove
            </Button>
        </div>
    )
}
