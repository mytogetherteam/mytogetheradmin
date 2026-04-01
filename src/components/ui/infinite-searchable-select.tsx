"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react"
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
}: InfiniteSearchableSelectProps<T>) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [data, setData] = React.useState<T[]>([])
    const [loading, setLoading] = React.useState(false)
    const [hasMore, setHasMore] = React.useState(true)
    const [page, setPage] = React.useState(0)
    
    const displayKey = labelKey || valueKey
    const loadingRef = React.useRef(false)

    const fetchDataInternal = React.useCallback(async (pageNum: number, search: string, isNewSearch: boolean) => {
        if (loadingRef.current && !isNewSearch) return
        loadingRef.current = true
        if (isNewSearch) {
            setLoading(true)
        }
        try {
            const response = await fetchData(pageNum, 20, search)
            const newContent = response.content || []
            
            setData(prev => {
                if (isNewSearch) return newContent
                // Deduplicate items just in case
                const existingIds = new Set(prev.map(item => String(item[valueKey])))
                const uniqueNewContent = newContent.filter(item => !existingIds.has(String(item[valueKey])))
                return [...prev, ...uniqueNewContent]
            })
            setHasMore(!response.last && newContent.length > 0)
        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setLoading(false)
            loadingRef.current = false
        }
    }, [fetchData, valueKey])

    // Reset and Initial Load / Search
    React.useEffect(() => {
        if (!open) return

        const handler = setTimeout(() => {
            setPage(0)
            fetchDataInternal(0, searchQuery, true)
        }, 300)
        return () => clearTimeout(handler)
    }, [searchQuery, fetchDataInternal, open])

    // Load more when page changes
    React.useEffect(() => {
        if (page > 0) {
            fetchDataInternal(page, searchQuery, false)
        }
    }, [page, searchQuery, fetchDataInternal])

    const observer = React.useRef<IntersectionObserver | null>(null)
    const lastElementRef = React.useCallback((node: HTMLDivElement | null) => {
        if (loading) return
        if (observer.current) observer.current.disconnect()
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1)
            }
        })
        if (node) observer.current.observe(node)
    }, [loading, hasMore])

    const handleSelect = (item: T) => {
        onChange(item)
        setOpen(false)
        setSearchQuery("")
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
                    className={cn("w-full justify-between font-normal text-left px-3 text-base md:text-sm", className)}
                    disabled={disabled}
                >
                    <span className="truncate text-left flex-1">{displayValue}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                    <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
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
                                {hasMore && (
                                    <div ref={lastElementRef} className="flex justify-center p-2">
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
