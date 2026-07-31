import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Loader2, Plus, Search } from "lucide-react";

import {
  useDeletePlatformPaymentAccountMutation,
  usePlatformPaymentAccounts,
  useReorderPlatformPaymentAccountsMutation,
} from "@/hooks/platform-payment-accounts/usePlatformPaymentAccount";
import type { PlatformPaymentAccountListItem } from "@/services/platformPaymentAccountService";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { PlatformPaymentAccountsTable } from "@/components/platform-payment-accounts/PlatformPaymentAccountsTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ManagePlatformPaymentAccounts() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [accounts, setAccounts] = useState<PlatformPaymentAccountListItem[]>([]);
  const [reordering, setReordering] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: number;
    name: string;
  }>({ open: false, id: 0, name: "" });
  const isFirstSearchDebounce = useRef(true);

  useEffect(() => {
    const delayMs = isFirstSearchDebounce.current ? 0 : 500;
    isFirstSearchDebounce.current = false;
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), delayMs);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isPending: loading } = usePlatformPaymentAccounts({
    page: 1,
    size: 200,
    search: debouncedSearch.trim() || undefined,
  });
  const { mutateAsync: deleteAccount, isPending: deleting } =
    useDeletePlatformPaymentAccountMutation();
  const { mutateAsync: reorderAccounts } =
    useReorderPlatformPaymentAccountsMutation();

  useEffect(() => {
    const list = data?.content ?? [];
    setAccounts(
      [...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    );
  }, [data]);

  const handleDeleteConfirm = async () => {
    try {
      await deleteAccount(deleteDialog.id);
      setDeleteDialog({ open: false, id: 0, name: "" });
    } catch {
      // The API blocks deleting an account shops have paid into; its message is
      // already shown as a toast, so just leave the dialog open.
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = accounts.findIndex((account) => account.id === active.id);
    const newIndex = accounts.findIndex((account) => account.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previous = [...accounts];
    const next = arrayMove(accounts, oldIndex, newIndex).map(
      (account, index) => ({ ...account, displayOrder: index }),
    );
    setAccounts(next);
    setReordering(true);
    try {
      await reorderAccounts(next.map((account) => account.id));
    } catch {
      setAccounts(previous);
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-10">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Payment Accounts</CardTitle>
              <CardDescription>
                Your own accounts that shops transfer plan payments into. Drag to
                reorder — shops see them in this order.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, number or channel..."
                  className="w-full pl-8 sm:w-[260px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                onClick={() => navigate("/platform-payment-accounts/create")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : accounts.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {debouncedSearch.trim()
                ? "No account matches that search."
                : 'No payment accounts yet. Use "Add Account" so shops know where to transfer.'}
            </p>
          ) : (
            <>
              <PlatformPaymentAccountsTable
                accounts={accounts}
                reordering={reordering}
                onDragEnd={onDragEnd}
                onEdit={(id) =>
                  navigate(`/platform-payment-accounts/create?id=${id}`)
                }
                onDelete={({ id, accountName }) =>
                  setDeleteDialog({ open: true, id, name: accountName })
                }
              />
              {reordering ? (
                <p className="text-xs text-muted-foreground">Saving order…</p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        title="Delete payment account"
        description={`Delete "${deleteDialog.name}"? If shops have already paid into it, set it inactive instead — the payment history has to keep pointing somewhere.`}
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
