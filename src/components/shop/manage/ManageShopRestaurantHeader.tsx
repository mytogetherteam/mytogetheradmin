import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Plus, Search, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ShopService } from '@/services/shopService';

type ManageShopRestaurantHeaderProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onExport: () => void;
  onCreateShop: () => void;
  filters?: {
    selectedCategory?: number;
    activeFilter?: boolean;
    verifiedFilter?: boolean;
    setSelectedCategory: (val?: number) => void;
    setActiveFilter: (val?: boolean) => void;
    setVerifiedFilter: (val?: boolean) => void;
  };
};

export function ManageShopRestaurantHeader({
  searchTerm,
  onSearchChange,
  onExport,
  onCreateShop,
  filters,
}: ManageShopRestaurantHeaderProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ['admin', 'shop-categories'],
    queryFn: () => ShopService.getCategories(),
  });
  const activeFilterCount = [
    filters?.selectedCategory !== undefined,
    filters?.activeFilter !== undefined,
    filters?.verifiedFilter !== undefined,
  ].filter(Boolean).length;

  return (
    <CardHeader className="pb-4">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg font-semibold leading-none tracking-tight">Shops &amp; Restaurants</CardTitle>
          <CardDescription className="mt-1.5 text-sm">
            Toggle active and verified status inline, reject vetting, edit, or delete a shop.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="relative w-full sm:w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 h-9 text-sm"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          
          {filters && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5 border-dashed">
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="px-1 font-normal rounded-sm lg:hidden">
                      {activeFilterCount}
                    </Badge>
                  )}
                  {activeFilterCount > 0 && (
                    <div className="hidden space-x-1 lg:flex">
                      <Badge variant="secondary" className="px-1 font-normal rounded-sm">
                        {activeFilterCount} selected
                      </Badge>
                    </div>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Filter Shops</h4>
                    <p className="text-sm text-muted-foreground">
                      Refine the list by category, status, and verification.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    <div className="grid gap-1">
                      <label className="text-xs font-medium">Category</label>
                      <Select
                        value={filters.selectedCategory ? filters.selectedCategory.toString() : 'all'}
                        onValueChange={(v) => filters.setSelectedCategory(v === 'all' ? undefined : Number(v))}
                      >
                        <SelectTrigger className="w-full text-sm">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.nameEn || c.nameMm || c.name || `Category ${c.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-1">
                      <label className="text-xs font-medium">Status</label>
                      <Select
                        value={filters.activeFilter === undefined ? 'all' : filters.activeFilter ? 'true' : 'false'}
                        onValueChange={(v) => filters.setActiveFilter(v === 'all' ? undefined : v === 'true')}
                      >
                        <SelectTrigger className="w-full text-sm">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-1">
                      <label className="text-xs font-medium">Verification</label>
                      <Select
                        value={filters.verifiedFilter === undefined ? 'all' : filters.verifiedFilter ? 'true' : 'false'}
                        onValueChange={(v) => filters.setVerifiedFilter(v === 'all' ? undefined : v === 'true')}
                      >
                        <SelectTrigger className="w-full text-sm">
                          <SelectValue placeholder="All Verifications" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Verifications</SelectItem>
                          <SelectItem value="true">Verified</SelectItem>
                          <SelectItem value="false">Unverified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <Button variant="outline" size="sm" className="h-9 gap-1.5 shrink-0" onClick={onExport}>
            <FileSpreadsheet className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="h-9 gap-1.5 shrink-0" onClick={onCreateShop}>
            <Plus className="h-4 w-4" />
            Create New
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}
