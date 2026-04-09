"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
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

export interface SearchableSelectProps<T> {
    title?: string
    data: T[]
    value: keyof T
    labelKey?: keyof T
    selectedValue?: T
    onChange: (item: T | null) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function SearchableSelect<T extends { [key: string]: unknown }>({
    title,
    data,
    value: valueKey,
    labelKey,
    selectedValue,
    onChange,
    placeholder = "Select an item...",
    disabled = false,
    className,
}: SearchableSelectProps<T>) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    const displayKey = labelKey || valueKey

    const filteredData = React.useMemo(() => {
        if (!searchQuery) return data

        return data.filter((item) => {
            const displayValue = String(item[displayKey]).toLowerCase()
            return displayValue.includes(searchQuery.toLowerCase())
        })
    }, [data, searchQuery, displayKey])

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
                    <span className="truncate flex-1">{displayValue}</span>
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
            <PopoverContent className="w-full p-0" align="start" side="bottom">
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
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {filteredData.map((item, index) => {
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
                                        <span>{itemDisplay}</span>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
