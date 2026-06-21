import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DeliveryDriverActiveFilter,
  DeliveryDriverDeletedFilter,
} from "@/schemas/delivery-driver.schema";

type DeliveryDriversFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  shopId: string;
  onShopIdChange: (value: string) => void;
  activeFilter: DeliveryDriverActiveFilter;
  onActiveFilterChange: (value: DeliveryDriverActiveFilter) => void;
  deletedFilter: DeliveryDriverDeletedFilter;
  onDeletedFilterChange: (value: DeliveryDriverDeletedFilter) => void;
};

export function DeliveryDriversFilters({
  search,
  onSearchChange,
  shopId,
  onShopIdChange,
  activeFilter,
  onActiveFilterChange,
  deletedFilter,
  onDeletedFilterChange,
}: DeliveryDriversFiltersProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="delivery-driver-search">Search</Label>
        <Input
          id="delivery-driver-search"
          placeholder="Name, phone, vehicle, shop name or ID…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="delivery-driver-shop">Shop</Label>
        <Input
          id="delivery-driver-shop"
          placeholder="Shop ID or shop name"
          value={shopId}
          onChange={(e) => onShopIdChange(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Active status</Label>
        <Select
          value={activeFilter}
          onValueChange={(value) =>
            onActiveFilterChange(value as DeliveryDriverActiveFilter)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Active status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="inactive">Inactive only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Deleted records</Label>
        <Select
          value={deletedFilter}
          onValueChange={(value) =>
            onDeletedFilterChange(value as DeliveryDriverDeletedFilter)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Deleted filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Include soft-deleted</SelectItem>
            <SelectItem value="active-only">Active records only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
