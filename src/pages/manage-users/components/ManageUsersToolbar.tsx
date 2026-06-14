import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, Search } from "lucide-react";
import {
  ACCOUNT_FILTER_OPTIONS,
  type AccountFilter,
} from "../manageUsersHelpers";

interface ManageUsersToolbarProps {
  searchTerm: string;
  accountType: AccountFilter;
  onSearchChange: (value: string) => void;
  onAccountTypeChange: (value: AccountFilter) => void;
  onExport: () => void;
}

export function ManageUsersToolbar({
  searchTerm,
  accountType,
  onSearchChange,
  onAccountTypeChange,
  onExport,
}: ManageUsersToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <Select
        value={accountType}
        onValueChange={(value) => onAccountTypeChange(value as AccountFilter)}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Account type" />
        </SelectTrigger>
        <SelectContent>
          {ACCOUNT_FILTER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
    </div>
  );
}
