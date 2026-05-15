import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileSpreadsheet, Plus, Search } from 'lucide-react';

type ManageShopRestaurantHeaderProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onExport: () => void;
  onCreateShop: () => void;
};

export function ManageShopRestaurantHeader({
  searchTerm,
  onSearchChange,
  onExport,
  onCreateShop,
}: ManageShopRestaurantHeaderProps) {
  return (
    <CardHeader>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 min-w-0">
          <CardTitle className="leading-tight">Shops &amp; Restaurants</CardTitle>
          <CardDescription>
            Toggle active and verified status inline, reject vetting, edit, or delete a shop.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 w-full sm:w-[200px] lg:w-[300px]"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 shrink-0" onClick={onExport}>
            <FileSpreadsheet className="h-4 w-4" />
            Export
          </Button>
          <Button className="shrink-0" onClick={onCreateShop}>
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}
