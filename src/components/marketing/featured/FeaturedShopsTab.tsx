import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import ListStateView from "@/components/common/ListStateView";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Search, Star, TrendingUp } from "lucide-react";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead } from "@/components/SortableTableHead";
import { TableImage } from "@/components/TableImage";
import { Modal } from "@/components/common/Modal";
import { ShopDetailSheet } from "./ShopDetailSheet";
import { useFeaturedShopsManagement } from "@/hooks/marketing/useFeaturedShopsManagement";

interface FeaturedShopsTabProps {
  enabled: boolean;
}

export function FeaturedShopsTab({ enabled }: FeaturedShopsTabProps) {
  const { table, pagination, search, detailSheet, boost, actions } =
    useFeaturedShopsManagement({ enabled });

  return (
    <div className="mt-4 space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search shops..."
          className="pl-9"
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
        />
      </div>

      <Card className="shadow-sm border-muted/60">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              All Shops
            </div>
            <Badge variant="secondary" className="rounded-full px-3">
              {pagination.totalElements} shops
            </Badge>
          </CardTitle>
          <CardDescription>
            Toggle featured status or boost a shop&apos;s trending score for
            visibility.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <ListStateView
              isLoading={table.shopsLoading}
              isError={false}
              isEmpty={table.shops.length === 0}
              loadingMessage="Loading shops…"
              emptyMessage={
                search.value
                  ? "No shops matching your search."
                  : "No shops found."
              }
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <SortableTableHead
                      label="Shop"
                      sortKey="nameEn"
                      sortConfig={table.sortConfig}
                      onSort={actions.onSort}
                      className="py-3"
                    />
                    <SortableTableHead
                      label="Category"
                      sortKey="category"
                      sortConfig={table.sortConfig}
                      onSort={actions.onSort}
                    />
                    <SortableTableHead
                      label="Status"
                      sortKey="isActive"
                      sortConfig={table.sortConfig}
                      onSort={actions.onSort}
                    />
                    <TableHead>Featured</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.shops.map((shop) => (
                    <TableRow
                      key={shop.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <TableImage
                            src={shop.logoUrl}
                            alt={shop.nameEn || shop.nameMm || shop.name}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-sm leading-tight">
                              {shop.nameEn || shop.nameMm || shop.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              ID: {shop.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {shop.shopCategory?.nameEn ||
                          shop.shopCategory?.nameMm ||
                          shop.category ||
                          "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={shop.isActive ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {shop.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={!!shop.isFeatured}
                            disabled={table.featuringId === shop.id}
                            onCheckedChange={() =>
                              actions.onToggleFeatured(shop)
                            }
                          />
                          {shop.isFeatured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
                            onClick={() => actions.onOpenBoost(shop)}
                          >
                            <TrendingUp className="h-3.5 w-3.5" />
                            Boost
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => detailSheet.onOpen(shop)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ListStateView>
          </div>
        </CardContent>
      </Card>

      <DataTablePagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalElements}
        pageSize={pagination.pageSize}
        onPageChange={pagination.onPageChange}
        onPageSizeChange={pagination.onPageSizeChange}
      />

      <ShopDetailSheet
        shop={detailSheet.shop}
        open={detailSheet.open}
        onClose={detailSheet.onClose}
        onToggleFeatured={actions.onToggleFeatured}
        onBoost={actions.onOpenBoost}
        featuringId={table.featuringId}
      />

      <Modal
        open={!!boost.shop}
        onClose={boost.onClose}
        onSubmit={boost.onSubmit}
        loading={boost.submitting}
        title="Boost Shop Score"
        description={
          <>
            Manually increase the trending score for{" "}
            <strong>{boost.shop?.nameEn || boost.shop?.nameMm}</strong>.
          </>
        }
        submitText="Apply Boost"
        width="sm:max-w-sm"
      >
        <div className="space-y-3">
          <label className="text-sm font-medium">Boost Score</label>
          <Input
            type="number"
            min="0.1"
            step="0.1"
            value={boost.score}
            onChange={(e) => boost.onScoreChange(e.target.value)}
            placeholder="e.g. 10"
          />
          <p className="text-xs text-muted-foreground">
            This score will be added to the shop&apos;s current trending score
            to increase visibility on the platform.
          </p>
        </div>
      </Modal>
    </div>
  );
}
