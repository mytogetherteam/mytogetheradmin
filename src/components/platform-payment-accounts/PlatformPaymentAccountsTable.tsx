import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, Pencil, QrCode, Trash2 } from "lucide-react";

import type { PlatformPaymentAccountListItem } from "@/services/platformPaymentAccountService";
import { SortableTableRow } from "@/components/common/SortableTableRow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PlatformPaymentAccountsTableProps {
  accounts: PlatformPaymentAccountListItem[];
  reordering: boolean;
  onDragEnd: (event: DragEndEvent) => void;
  onEdit: (id: number) => void;
  onDelete: (
    account: Pick<PlatformPaymentAccountListItem, "id" | "accountName">,
  ) => void;
}

export function PlatformPaymentAccountsTable({
  accounts,
  reordering,
  onDragEnd,
  onEdit,
  onDelete,
}: PlatformPaymentAccountsTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <div className="overflow-x-auto rounded-md border">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Channel</TableHead>
              <TableHead>Account name</TableHead>
              <TableHead>Account number</TableHead>
              <TableHead>QR</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <SortableContext
            items={accounts.map((account) => account.id)}
            strategy={verticalListSortingStrategy}
          >
            <TableBody>
              {accounts.map((account) => {
                // An account on a switched-off channel is invisible to shops even
                // when it is active itself — say so instead of showing "Active".
                const hiddenByChannel = !account.paymentMethod.isActive;
                return (
                  <SortableTableRow key={account.id} id={account.id}>
                    {({ setActivatorNodeRef, attributes, listeners }) => (
                      <>
                        <TableCell className="w-10">
                          <button
                            type="button"
                            ref={setActivatorNodeRef}
                            className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
                            disabled={reordering}
                            aria-label="Drag to reorder"
                            {...attributes}
                            {...listeners}
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {account.paymentMethod.iconUrl ? (
                              <img
                                src={account.paymentMethod.iconUrl}
                                alt=""
                                className="h-6 w-6 rounded object-contain"
                              />
                            ) : null}
                            <span>{account.paymentMethod.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {account.accountName}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {account.accountNumber}
                        </TableCell>
                        <TableCell>
                          {account.qrUrl ? (
                            <a
                              href={account.qrUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                            >
                              <QrCode className="h-4 w-4" />
                              View
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={
                                account.isActive ? "default" : "secondary"
                              }
                              className="w-fit"
                            >
                              {account.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {account.isActive && hiddenByChannel ? (
                              <span className="text-xs text-muted-foreground">
                                Channel is off — hidden from shops
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              aria-label={`Edit ${account.accountName}`}
                              onClick={() => onEdit(account.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              aria-label={`Delete ${account.accountName}`}
                              onClick={() =>
                                onDelete({
                                  id: account.id,
                                  accountName: account.accountName,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </SortableTableRow>
                );
              })}
            </TableBody>
          </SortableContext>
        </Table>
      </DndContext>
    </div>
  );
}
