import { useCallback, useState } from "react"
import type { ChangeEvent } from "react"
import { compressImage } from "@/utils/imageCompression"

export interface ShopRestaurantMediaHydrateInput {
    logoUrl?: string | null
    coverUrl?: string | null
    primaryPhotoUrl?: string | null
    photos?: { url?: string; thumbnailUrl?: string }[]
}

export function useShopRestaurantMedia() {
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [galleryFiles, setGalleryFiles] = useState<File[]>([])
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
    const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([])

    const resetMedia = useCallback(() => {
        setCoverPreview(null)
        setCoverFile(null)
        setLogoPreview(null)
        setLogoFile(null)
        setGalleryFiles([])
        setGalleryPreviews([])
        setExistingGalleryUrls([])
    }, [])

    const hydrateMediaFromShop = useCallback((shop: ShopRestaurantMediaHydrateInput) => {
        if (shop.logoUrl) {
            setLogoPreview(shop.logoUrl)
        }
        if (shop.coverUrl) {
            setCoverPreview(shop.coverUrl)
        } else if (shop.primaryPhotoUrl) {
            setCoverPreview(shop.primaryPhotoUrl)
        }

        if (shop.photos && shop.photos.length > 0) {
            setExistingGalleryUrls(
                shop.photos
                    .map((p) => p.url || p.thumbnailUrl || "")
                    .filter(Boolean),
            )
        } else {
            setExistingGalleryUrls([])
        }
    }, [])

    const handleCoverChange = useCallback(
        async (e: ChangeEvent<HTMLInputElement>) => {
            const originalFile = e.target.files?.[0] ?? null
            if (!originalFile) {
                if (!coverPreview?.startsWith("http")) setCoverPreview(null)
                return
            }

            const file = await compressImage(originalFile)
            setCoverFile(file)
            const reader = new FileReader()
            reader.onloadend = () => setCoverPreview(reader.result as string)
            reader.readAsDataURL(file)
        },
        [coverPreview],
    )

    const handleLogoChange = useCallback(
        async (e: ChangeEvent<HTMLInputElement>) => {
            const originalFile = e.target.files?.[0] ?? null
            if (!originalFile) {
                if (!logoPreview?.startsWith("http")) setLogoPreview(null)
                return
            }

            const file = await compressImage(originalFile)
            setLogoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => setLogoPreview(reader.result as string)
            reader.readAsDataURL(file)
        },
        [logoPreview],
    )

    const handleGalleryChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        const compressedFiles = await Promise.all(files.map((f) => compressImage(f)))
        setGalleryFiles((prev) => [...prev, ...compressedFiles])
        compressedFiles.forEach((file) => {
            const reader = new FileReader()
            reader.onloadend = () => {
                setGalleryPreviews((prev) => [...prev, reader.result as string])
            }
            reader.readAsDataURL(file)
        })
        e.target.value = ""
    }, [])

    const removeGalleryPhoto = useCallback((index: number) => {
        setGalleryFiles((prev) => prev.filter((_, i) => i !== index))
        setGalleryPreviews((prev) => prev.filter((_, i) => i !== index))
    }, [])

    const removeExistingGalleryPhoto = useCallback((index: number) => {
        setExistingGalleryUrls((prev) => prev.filter((_, i) => i !== index))
    }, [])

    const clearLogoMedia = useCallback(() => {
        setLogoPreview(null)
        setLogoFile(null)
    }, [])

    const clearCoverMedia = useCallback(() => {
        setCoverPreview(null)
        setCoverFile(null)
    }, [])

    return {
        coverPreview,
        logoPreview,
        galleryPreviews,
        existingGalleryUrls,
        coverFile,
        logoFile,
        galleryFiles,
        resetMedia,
        hydrateMediaFromShop,
        handleCoverChange,
        handleLogoChange,
        handleGalleryChange,
        removeGalleryPhoto,
        removeExistingGalleryPhoto,
        clearLogoMedia,
        clearCoverMedia,
    }
}
