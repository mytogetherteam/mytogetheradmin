import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Search, Loader2, Store, User, ShoppingBag } from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { searchService, GlobalSearchResult } from "@/services/searchService"
import { useDebounce } from "@/hooks/use-debounce"

export function AdminGlobalSearch() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [results, setResults] = React.useState<GlobalSearchResult>({ users: [], shops: [], orders: [] })

    const debouncedQuery = useDebounce(query, 300)
    const navigate = useNavigate()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    React.useEffect(() => {
        async function performSearch() {
            if (!debouncedQuery) {
                setResults({ users: [], shops: [], orders: [] })
                return
            }

            setLoading(true)
            try {
                const data = await searchService.globalSearch(debouncedQuery)
                setResults(data)
            } catch (error) {
                console.error("Search failed:", error)
                setResults({ users: [], shops: [], orders: [] })
            } finally {
                setLoading(false)
            }
        }

        performSearch()
    }, [debouncedQuery])

    const handleSelectUser = (email: string) => {
        setOpen(false)
        navigate(`/users/manage?search=${encodeURIComponent(email)}`)
    }

    const handleSelectShop = (id: string) => {
        setOpen(false)
        navigate(`/shops/create?id=${id}`) // Navigates to edit shop page
    }

    const handleSelectOrder = (id: string) => {
        setOpen(false)
        // Could navigate to order detail or board filtered by this ID
        navigate(`/orders/board?id=${id}`)
    }

    return (
        <>
            <Button
                variant="outline"
                className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 lg:h-10 lg:w-56 lg:justify-start lg:px-3 md:h-10 md:w-48 md:justify-start md:px-3 xl:py-2 text-sm text-muted-foreground sm:pr-12 md:pr-12 lg:pr-12 xl:pr-12 rounded-full md:rounded-md bg-muted/40 hover:bg-accent/50 transition-colors"
                onClick={() => setOpen(true)}
            >
                <Search className="h-4 w-4 xl:mr-2 lg:mr-2 md:mr-2" />
                <span className="hidden md:inline-flex">Search anything...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Search users, shops, orders..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    {loading && (
                        <div className="flex items-center justify-center p-6">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {!loading && query &&
                        results.users.length === 0 &&
                        results.shops.length === 0 &&
                        results.orders.length === 0 && (
                            <CommandEmpty>No results found for "{query}".</CommandEmpty>
                        )}

                    {!loading && results.shops.length > 0 && (
                        <CommandGroup heading="Shops / Restaurants">
                            {results.shops.map((shop) => (
                                <CommandItem
                                    key={`shop-${shop.id}`}
                                    value={`shop-${shop.name}`}
                                    onSelect={() => handleSelectShop(shop.id)}
                                >
                                    <Store className="mr-2 h-4 w-4" />
                                    <span>{shop.name}</span>
                                    {shop.address && <span className="ml-2 text-xs text-muted-foreground truncate max-w-[200px]">{shop.address}</span>}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {!loading && results.shops.length > 0 && results.users.length > 0 && <CommandSeparator />}

                    {!loading && results.users.length > 0 && (
                        <CommandGroup heading="Users">
                            {results.users.map((user) => (
                                <CommandItem
                                    key={`user-${user.id}`}
                                    value={`user-${user.name}-${user.email}`}
                                    onSelect={() => handleSelectUser(user.email)}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>{user.name}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">{user.email}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {!loading && (results.users.length > 0 || results.shops.length > 0) && results.orders.length > 0 && <CommandSeparator />}

                    {!loading && results.orders.length > 0 && (
                        <CommandGroup heading="Orders">
                            {results.orders.map((order) => (
                                <CommandItem
                                    key={`order-${order.id}`}
                                    value={`order-${order.orderNumber}`}
                                    onSelect={() => handleSelectOrder(order.id)}
                                >
                                    <ShoppingBag className="mr-2 h-4 w-4" />
                                    <span>Order #{order.orderNumber}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">${order.totalAmount} • {order.status}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
}
