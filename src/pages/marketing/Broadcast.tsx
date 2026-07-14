import { useState, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { manageUsersService } from "@/services/manageUsersService";
import { ShopService } from "@/services/shopService";
import {
  useBroadcastHistory,
  useSendBroadcastMutation,
  useDeleteBroadcastMutation,
} from "@/hooks/broadcast/useBroadcast";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { BroadcastGroupsDialog } from "./BroadcastGroupsDialog";
import type { BroadcastAudience } from "@/services/broadcastService";
import {
  broadcastFormSchema,
  type BroadcastFormValues,
} from "@/schemas/broadcast.schema";
import { InfiniteSearchableSelect } from "@/components/ui/infinite-searchable-select";
import { InfiniteSearchableMultiSelect } from "@/components/ui/infinite-searchable-multi-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Megaphone,
  Send,
  History,
  Users,
  Store,
  Building2,
  User as UserIcon,
  UserCog,
  ImagePlus,
  X,
  Trash2,
} from "lucide-react";
import { SortableTableHead } from "@/components/SortableTableHead";
import { SortConfig, toggleSort, sortData } from "@/lib/sort-utils";
import { DataTablePagination } from "@/components/DataTablePagination";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const AUDIENCE_OPTIONS: {
  value: BroadcastAudience;
  label: string;
  icon: typeof Users;
}[] = [
    { value: "ALL", label: "Everyone", icon: Megaphone },
    { value: "USERS", label: "All Users", icon: Users },
    { value: "SHOP_ADMINS", label: "Shop Admins", icon: Store },
    { value: "OPERATION_ADMINS", label: "Operation Admins", icon: UserCog },
    { value: "SINGLE_USER", label: "Single User", icon: UserIcon },
    { value: "SINGLE_SHOP", label: "Single Shop", icon: Building2 },
    { value: "MULTI_USER", label: "Selected Users", icon: Users },
    { value: "MULTI_SHOP", label: "Selected Shops", icon: Store },
  ];

const AUDIENCE_BADGE: Record<BroadcastAudience, string> = {
  ALL: "text-amber-600 bg-amber-50 border-amber-100",
  USERS: "text-blue-600 bg-blue-50 border-blue-100",
  SHOP_ADMINS: "text-purple-600 bg-purple-50 border-purple-100",
  OPERATION_ADMINS: "text-emerald-600 bg-emerald-50 border-emerald-100",
  SINGLE_USER: "text-slate-600 bg-slate-50 border-slate-100",
  SINGLE_SHOP: "text-rose-600 bg-rose-50 border-rose-100",
  MULTI_USER: "text-cyan-600 bg-cyan-50 border-cyan-100",
  MULTI_SHOP: "text-orange-600 bg-orange-50 border-orange-100",
  USER_GROUP: "text-sky-600 bg-sky-50 border-sky-100",
  SHOP_GROUP: "text-indigo-600 bg-indigo-50 border-indigo-100",
};

const audienceLabel = (audience: BroadcastAudience) =>
  AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label ?? audience;

export default function Broadcast() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const form = useForm<BroadcastFormValues>({
    resolver: zodResolver(broadcastFormSchema),
    defaultValues: {
      audience: "ALL",
      title: "",
      message: "",
      targetUserId: undefined,
      targetShopId: undefined,
      targetUserIds: undefined,
      targetShopIds: undefined,
    },
  });
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = form;
  const audience = watch("audience");

  const [selectedUserData, setSelectedUserData] = useState<{
    label: string;
    value: string;
  } | null>(null);
  const [selectedShopData, setSelectedShopData] = useState<{
    label: string;
    value: string;
  } | null>(null);
  // Ad-hoc multi-select lists (MULTI_USER / MULTI_SHOP). Chips are kept in local
  // state for their labels; the form holds the id arrays for validation/submit.
  const [selectedUsers, setSelectedUsers] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedShops, setSelectedShops] = useState<
    { label: string; value: string }[]
  >([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data, isPending: loading } = useBroadcastHistory(page, pageSize);
  const { mutateAsync: sendBroadcast, isPending: sending } =
    useSendBroadcastMutation();
  const { mutate: deleteBroadcast, isPending: deleting } =
    useDeleteBroadcastMutation();

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: number;
    title: string;
  }>({ open: false, id: 0, title: "" });

  const handleDeleteConfirm = () => {
    deleteBroadcast(deleteDialog.id, {
      onSuccess: () => setDeleteDialog({ open: false, id: 0, title: "" }),
    });
  };

  const history = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const sortedHistory = sortData(history, sortConfig);

  const fetchUserData = useCallback(
    async (p: number, size: number, search: string) => {
      const res = await manageUsersService.getManageUsers({
        page: p,
        size,
        search,
        accountType: "user",
      });
      return {
        content: (res?.content || []).map((u) => ({
          label: u.name || u.email || u.username || `User #${u.id}`,
          value: String(u.id),
        })),
        last: res ? p >= (res.totalPages ?? 1) : true,
      };
    },
    [],
  );

  // Shops are loaded from the admin shop-profile endpoint (1-based, hence
  // startPage={1} on the select below).
  const fetchShopData = useCallback(
    async (p: number, size: number, search: string) => {
      const res = await ShopService.getAdminShopProfiles(p, size, search);
      return {
        content: (res?.content || []).map((s) => ({
          label: s.nameEn || s.nameMm || s.nameTh || `Shop #${s.id}`,
          value: String(s.id),
        })),
        last: res ? p >= (res.totalPages ?? 1) : true,
      };
    },
    [],
  );

  const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or smaller");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const onSubmit = async (values: BroadcastFormValues) => {
    await sendBroadcast({
      audience: values.audience,
      title: values.title,
      message: values.message,
      targetUserId: values.targetUserId,
      targetShopId: values.targetShopId,
      targetUserIds: values.targetUserIds,
      targetShopIds: values.targetShopIds,
      image: imageFile,
    });

    reset();
    setSelectedUserData(null);
    setSelectedShopData(null);
    setSelectedUsers([]);
    setSelectedShops([]);
    clearImage();
    setPage(0);
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary md:h-12 md:w-12">
              <Megaphone className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold md:text-2xl">Push Broadcast</h1>
              <p className="text-sm text-muted-foreground">
                Send push notifications across your platform
              </p>
            </div>
          </div>
          <BroadcastGroupsDialog />
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4" /> Compose Announcement
            </CardTitle>
            <CardDescription>
              Send a push notification to a chosen audience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Target Audience
                </label>
                <Controller
                  control={control}
                  name="audience"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v: BroadcastAudience) => {
                        field.onChange(v);
                        // Reset the target ids + their displayed selection when
                        // switching audience so a stale id can't be submitted.
                        setValue("targetUserId", undefined);
                        setValue("targetShopId", undefined);
                        setValue("targetUserIds", undefined);
                        setValue("targetShopIds", undefined);
                        setSelectedUserData(null);
                        setSelectedShopData(null);
                        setSelectedUsers([]);
                        setSelectedShops([]);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUDIENCE_OPTIONS.map(({ value, label, icon: Icon }) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" /> <span>{label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {audience === "SINGLE_USER" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Select User
                  </label>
                  <InfiniteSearchableSelect
                    fetchData={fetchUserData}
                    startPage={1}
                    valueKey="value"
                    labelKey="label"
                    selectedValue={selectedUserData}
                    onChange={(item) => {
                      const picked = item as {
                        label: string;
                        value: string;
                      } | null;
                      setSelectedUserData(picked);
                      setValue(
                        "targetUserId",
                        picked ? Number(picked.value) : undefined,
                        { shouldValidate: true },
                      );
                    }}
                    placeholder="Search user..."
                  />
                  {errors.targetUserId ? (
                    <p className="text-sm text-destructive">
                      {errors.targetUserId.message}
                    </p>
                  ) : null}
                </div>
              )}

              {audience === "SINGLE_SHOP" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Select Shop
                  </label>
                  <InfiniteSearchableSelect
                    fetchData={fetchShopData}
                    startPage={1}
                    valueKey="value"
                    labelKey="label"
                    selectedValue={selectedShopData}
                    onChange={(item) => {
                      const picked = item as {
                        label: string;
                        value: string;
                      } | null;
                      setSelectedShopData(picked);
                      setValue(
                        "targetShopId",
                        picked ? Number(picked.value) : undefined,
                        { shouldValidate: true },
                      );
                    }}
                    placeholder="Search shop..."
                  />
                  {errors.targetShopId ? (
                    <p className="text-sm text-destructive">
                      {errors.targetShopId.message}
                    </p>
                  ) : null}
                </div>
              )}

              {audience === "MULTI_USER" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Select Users
                  </label>
                  <InfiniteSearchableMultiSelect
                    fetchData={fetchUserData}
                    startPage={1}
                    valueKey="value"
                    labelKey="label"
                    selectedValues={selectedUsers}
                    onChange={(items) => {
                      const picked = items as {
                        label: string;
                        value: string;
                      }[];
                      setSelectedUsers(picked);
                      setValue(
                        "targetUserIds",
                        picked.length
                          ? picked.map((u) => Number(u.value))
                          : undefined,
                        { shouldValidate: true },
                      );
                    }}
                    placeholder="Search and add users..."
                  />
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedUsers.map((u) => (
                        <Badge
                          key={u.value}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {u.label}
                          <button
                            type="button"
                            aria-label={`Remove ${u.label}`}
                            className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                            onClick={() => {
                              const next = selectedUsers.filter(
                                (x) => x.value !== u.value,
                              );
                              setSelectedUsers(next);
                              setValue(
                                "targetUserIds",
                                next.length
                                  ? next.map((x) => Number(x.value))
                                  : undefined,
                                { shouldValidate: true },
                              );
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  {errors.targetUserIds ? (
                    <p className="text-sm text-destructive">
                      {errors.targetUserIds.message}
                    </p>
                  ) : null}
                </div>
              )}

              {audience === "MULTI_SHOP" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Select Shops
                  </label>
                  <InfiniteSearchableMultiSelect
                    fetchData={fetchShopData}
                    startPage={1}
                    valueKey="value"
                    labelKey="label"
                    selectedValues={selectedShops}
                    onChange={(items) => {
                      const picked = items as {
                        label: string;
                        value: string;
                      }[];
                      setSelectedShops(picked);
                      setValue(
                        "targetShopIds",
                        picked.length
                          ? picked.map((s) => Number(s.value))
                          : undefined,
                        { shouldValidate: true },
                      );
                    }}
                    placeholder="Search and add shops..."
                  />
                  {selectedShops.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedShops.map((s) => (
                        <Badge
                          key={s.value}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {s.label}
                          <button
                            type="button"
                            aria-label={`Remove ${s.label}`}
                            className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                            onClick={() => {
                              const next = selectedShops.filter(
                                (x) => x.value !== s.value,
                              );
                              setSelectedShops(next);
                              setValue(
                                "targetShopIds",
                                next.length
                                  ? next.map((x) => Number(x.value))
                                  : undefined,
                                { shouldValidate: true },
                              );
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  {errors.targetShopIds ? (
                    <p className="text-sm text-destructive">
                      {errors.targetShopIds.message}
                    </p>
                  ) : null}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Notification Title
                </label>
                <Input
                  placeholder="Enter title..."
                  maxLength={200}
                  aria-invalid={Boolean(errors.title)}
                  {...register("title")}
                />
                {errors.title ? (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Message Body
                </label>
                <Textarea
                  placeholder="Enter message content..."
                  className="min-h-[120px]"
                  maxLength={2000}
                  aria-invalid={Boolean(errors.message)}
                  {...register("message")}
                />
                {errors.message ? (
                  <p className="text-sm text-destructive">
                    {errors.message.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Image{" "}
                  <span className="normal-case text-[10px] text-muted-foreground/70">
                    (optional)
                  </span>
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {imagePreview ? (
                  <div className="relative w-full overflow-hidden rounded-md border">
                    <img
                      src={imagePreview}
                      alt="Announcement preview"
                      className="max-h-48 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed py-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <ImagePlus className="h-5 w-5" />
                    <span>Click to upload an image</span>
                    <span className="text-[10px]">PNG, JPG, WEBP up to 5MB</span>
                  </button>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? "Sending..." : "Send Now"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Broadcast History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    label="Audience"
                    sortKey="audience"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <TableCell className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Image
                  </TableCell>
                  <SortableTableHead
                    label="Title"
                    sortKey="title"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    label="Message"
                    sortKey="message"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    label="Date"
                    sortKey="createdAt"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <TableCell className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-10 w-10 rounded" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-8 w-8 rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : sortedHistory.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground italic"
                    >
                      No broadcast history found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedHistory.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={AUDIENCE_BADGE[h.audience]}
                        >
                          {audienceLabel(h.audience)}
                          {h.audience === "SINGLE_USER" && h.targetUserId
                            ? ` #${h.targetUserId}`
                            : ""}
                          {h.audience === "SINGLE_SHOP" && h.targetShopId
                            ? ` #${h.targetShopId}`
                            : ""}
                          {h.audience === "MULTI_USER" && h.targetUserIds?.length
                            ? ` (${h.targetUserIds.length})`
                            : ""}
                          {h.audience === "MULTI_SHOP" && h.targetShopIds?.length
                            ? ` (${h.targetShopIds.length})`
                            : ""}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {h.imageUrl ? (
                          <img
                            src={h.imageUrl}
                            alt={h.title}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {h.title}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-xs truncate" title={h.message}>
                          {h.message}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {h.createdAt
                          ? new Date(h.createdAt).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          aria-label="Delete broadcast"
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              id: h.id,
                              title: h.title,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <DataTablePagination
            currentPage={page + 1}
            totalPages={totalPages}
            totalItems={totalElements}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p - 1)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(0);
            }}
          />
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        title="Delete Broadcast"
        description={`Are you sure you want to delete "${deleteDialog.title}"? This removes it from the history and cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
}
