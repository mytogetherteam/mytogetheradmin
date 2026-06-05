import { useState, useCallback, useRef } from "react";
import { userService } from "@/services/userService";
import {
  useBroadcastHistory,
  useSendBroadcastMutation,
} from "@/hooks/broadcast/useBroadcast";
import type { BroadcastAudience } from "@/services/broadcastService";
import { InfiniteSearchableSelect } from "@/components/ui/infinite-searchable-select";
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
  User as UserIcon,
  UserCog,
  ImagePlus,
  X,
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
];

const AUDIENCE_BADGE: Record<BroadcastAudience, string> = {
  ALL: "text-amber-600 bg-amber-50 border-amber-100",
  USERS: "text-blue-600 bg-blue-50 border-blue-100",
  SHOP_ADMINS: "text-purple-600 bg-purple-50 border-purple-100",
  OPERATION_ADMINS: "text-emerald-600 bg-emerald-50 border-emerald-100",
  SINGLE_USER: "text-slate-600 bg-slate-50 border-slate-100",
};

const audienceLabel = (audience: BroadcastAudience) =>
  AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label ?? audience;

export default function Broadcast() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<BroadcastAudience>("ALL");
  const [selectedUserData, setSelectedUserData] = useState<{
    label: string;
    value: string;
  } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data, isPending: loading } = useBroadcastHistory(page, pageSize);
  const { mutateAsync: sendBroadcast, isPending: sending } =
    useSendBroadcastMutation();

  const history = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const sortedHistory = sortData(history, sortConfig);

  const fetchUserData = useCallback(
    async (p: number, size: number, search: string) => {
      const res = await userService.getAllUsers(p, size, search);
      return {
        content: (res?.content || []).map((u) => ({
          label: u.fullName || u.email || u.username || `User #${u.id}`,
          value: String(u.id),
        })),
        last: res ? p + 1 >= (res.totalPages ?? 1) : true,
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (audience === "SINGLE_USER" && !selectedUserData) {
      toast.error("Please select a user");
      return;
    }

    await sendBroadcast({
      audience,
      title: title.trim(),
      message: message.trim(),
      targetUserId:
        audience === "SINGLE_USER"
          ? Number(selectedUserData!.value)
          : undefined,
      image: imageFile,
    });

    setTitle("");
    setMessage("");
    setSelectedUserData(null);
    clearImage();
    setPage(0);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Megaphone className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold md:text-2xl">Push Broadcast</h1>
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
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Target Audience
                </label>
                <Select
                  value={audience}
                  onValueChange={(v: BroadcastAudience) => setAudience(v)}
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
              </div>

              {audience === "SINGLE_USER" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Select User
                  </label>
                  <InfiniteSearchableSelect
                    fetchData={fetchUserData}
                    valueKey="value"
                    labelKey="label"
                    selectedValue={selectedUserData}
                    onChange={(item) =>
                      setSelectedUserData(
                        item as { label: string; value: string } | null,
                      )
                    }
                    placeholder="Search user..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Notification Title
                </label>
                <Input
                  placeholder="Enter title..."
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Message Body
                </label>
                <Textarea
                  placeholder="Enter message content..."
                  className="min-h-[120px]"
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
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
                    </TableRow>
                  ))
                ) : sortedHistory.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
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
    </div>
  );
}
