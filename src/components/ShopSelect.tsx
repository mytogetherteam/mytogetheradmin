import React from "react";
import { InfiniteSearchableSelect } from "@/components/ui/infinite-searchable-select";
import { ShopService, Shop } from "@/services/shopService";

interface ShopSelectProps {
    onSelect: (shopId: number | null) => void;
    className?: string;
    placeholder?: string;
}

export function ShopSelect({ onSelect, className, placeholder = "Filter by Shop..." }: ShopSelectProps) {
    const [selectedShop, setSelectedShop] = React.useState<Shop | null>(null);

    const fetchData = React.useCallback(async (page: number, size: number, search: string) => {
        const response = await ShopService.getAllShops(page, size, search);
        return {
            content: response.content as (Shop & { [key: string]: unknown })[],
            last: response.last,
            totalElements: response.totalElements,
            totalPages: response.totalPages
        };
    }, []);

    const handleChange = (shop: Shop | null) => {
        setSelectedShop(shop);
        onSelect(shop ? shop.id : null);
    };

    return (
        <InfiniteSearchableSelect<Shop & { [key: string]: unknown }>
            fetchData={fetchData}
            valueKey="id"
            labelKey="name"
            selectedValue={selectedShop as (Shop & { [key: string]: unknown }) | null}
            onChange={(item) => handleChange(item as Shop | null)}
            placeholder={placeholder}
            className={className}
        />
    );
}
