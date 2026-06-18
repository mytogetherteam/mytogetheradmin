"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface PageableResponse<T> {
    content: T[];
    last: boolean;
    totalElements?: number;
    totalPages?: number;
    size?: number;
    number?: number;
}

export interface InfiniteSearchableSelectProps<T> {
    title?: string
    fetchData: (page: number, size: number, search: string) => Promise<PageableResponse<T>>
    valueKey: keyof T
    labelKey?: keyof T
    selectedValue?: T | null
    onChange: (item: T | null) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    /** First page number the API expects. 0 for zero-based endpoints (default), 1 for one-based (e.g. menu items). */
    startPage?: number
}

export function InfiniteSearchableSelect<T extends { [key: string]: unknown }>({
    title,
    fetchData,
    valueKey,
    labelKey,
    selectedValue,
    onChange,
    placeholder = "Select an item...",
    disabled = false,
    className,
    startPage = 0,
}: InfiniteSearchableSelectProps<T>) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [data, setData] = React.useState<T[]>([])
    const [loading, setLoading] = React.useState(false)
    const [hasMore, setHasMore] = React.useState(true)

    const displayKey = labelKey || valueKey
    const loadingRef = React.useRef(false)
    const pageRef = React.useRef(startPage)

    const fetchDataInternal = React.useCallback(async (pageNum: number, search: string, isNewSearch: boolean) => {
        if (loadingRef.current) return
        loadingRef.current = true
        setLoading(true)
        try {
            const PAGE_SIZE = 20
            const response = await fetchData(pageNum, PAGE_SIZE, search)
            const newContent = response.content || []

            setData(prev => {
                if (isNewSearch) return newContent
                // Deduplicate items just in case
                const existingIds = new Set(prev.map(item => String(item[valueKey])))
                const uniqueNewContent = newContent.filter(item => !existingIds.has(String(item[valueKey])))
                return [...prev, ...uniqueNewContent]
            })
            pageRef.current = pageNum
            // Reached the end when the API says so (`last`) OR it returned a partial page.
            // Robust even when the endpoint doesn't send a `last` flag.
            const reachedEnd = response.last === true || newContent.length < PAGE_SIZE
            setHasMore(!reachedEnd)
        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setLoading(false)
            loadingRef.current = false
        }
    }, [fetchData, valueKey])

    // Reset and Initial Load / Search (page 1 = first 20 items)
    React.useEffect(() => {
        if (!open) return

        const handler = setTimeout(() => {
            pageRef.current = startPage
            fetchDataInternal(startPage, searchQuery, true)
        }, 300)
        return () => clearTimeout(handler)
    }, [searchQuery, fetchDataInternal, open, startPage])

    // Load the next page (called when the user scrolls near the bottom)
    const loadMore = React.useCallback(() => {
        if (loadingRef.current || !hasMore) return
        fetchDataInternal(pageRef.current + 1, searchQuery, false)
    }, [hasMore, searchQuery, fetchDataInternal])

    const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 150) {
            loadMore()
        }
    }, [loadMore])

    const handleSelect = (item: T) => {
        onChange(item)
        setOpen(false)
        setSearchQuery("")
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(null)
    }

    const displayValue = selectedValue
        ? String(selectedValue[displayKey])
        : title || placeholder

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal text-left px-3 text-base md:text-sm group", className)}
                    disabled={disabled}
                >
                    <span className="truncate text-left flex-1">{displayValue}</span>
                    <div className="flex items-center shrink-0">
                        {selectedValue && (
                            <div
                                onClick={handleClear}
                                className="p-0.5 hover:bg-muted rounded-md transition-colors mr-1"
                                role="button"
                                aria-label="Clear selection"
                            >
                                <X className="h-3.5 w-3.5 opacity-50 hover:opacity-100" />
                            </div>
                        )}
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" side="bottom">
                <Command shouldFilter={false}>
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            placeholder="Search..."
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <CommandList onScroll={handleScroll} className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                        {loading && data.length === 0 ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>No results found.</CommandEmpty>
                                <CommandGroup>
                                    {data.map((item, index) => {
                                        const itemValue = String(item[valueKey])
                                        const itemDisplay = String(item[displayKey])
                                        const isSelected = selectedValue && String(selectedValue[valueKey]) === itemValue

                                        return (
                                            <CommandItem
                                                key={`${itemValue}-${index}`}
                                                value={itemValue}
                                                onSelect={() => handleSelect(item)}
                                                className="cursor-pointer"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        isSelected ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <span className="truncate">{itemDisplay}</span>
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>
                                {hasMore && data.length > 0 && (
                                    <div className="flex justify-center p-2">
                                        <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                                    </div>
                                )}
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
