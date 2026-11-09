import { useCallback, useEffect, useRef, useState } from "react";
import { Briefcase, Loader2, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { handleApiError } from "@/lib/error-utils";
import {
  AdminJobPost,
  jobPostsService,
} from "@/services/jobPostsService";

function restaurantName(job: AdminJobPost): string {
  const shop = job.shop;
  return shop?.nameEn || shop?.nameMm || shop?.nameTh || "Unknown restaurant";
}

function payLabel(job: AdminJobPost): string {
  const format = (amount: number) => amount.toLocaleString("en-US");
  const min = job.salaryMin;
  const max = job.salaryMax;
  let figure = "";
  if (min != null && max != null && min !== max) {
    figure = `${format(min)}–${format(max)} MMK`;
  } else if (min != null) {
    figure = `${format(min)} MMK`;
  } else if (max != null) {
    figure = `${format(max)} MMK`;
  }
  if (!figure) return job.salaryNegotiable ? "Negotiable" : "—";
  return job.salaryNegotiable ? `${figure}, negotiable` : figure;
}

function typeLabel(jobType: AdminJobPost["jobType"]): string {
  return jobType === "PART_TIME" ? "Part time" : "Full time";
}

export default function JobPostsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdminJobPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const queryRef = useRef(query);
  queryRef.current = query;
  const [status, setStatus] = useState<"" | "ACTIVE" | "INACTIVE">("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminJobPost | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = search.trim();
      if (queryRef.current === next) return;
      setQuery(next);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await jobPostsService.list({
        page,
        size: 20,
        search: query,
        status: status || undefined,
      });
      if (result.items.length === 0 && result.page > 1) {
        setPage(result.page - 1);
        return;
      }
      setItems(result.items);
      setTotal(result.total);
      setPageSize(result.pageSize || 20);
    } catch (error) {
      handleApiError(error, "Failed to load job posts");
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (job: AdminJobPost, next: "ACTIVE" | "INACTIVE") => {
    setBusyId(job.id);
    try {
      await jobPostsService.setStatus(job.id, next);
      toast.success(next === "ACTIVE" ? "Job post is visible again" : "Job post hidden");
      await load();
    } catch (error) {
      handleApiError(error, "Failed to update the job post");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    try {
      await jobPostsService.remove(pendingDelete.id);
      toast.success("Job post removed");
      await load();
    } catch (error) {
      handleApiError(error, "Failed to remove the job post");
    } finally {
      setBusyId(null);
    }
  };

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Job Posts
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Posts restaurants publish for customers. Hide a post to take it off
            the app, or remove it. Customers only see open posts that have not
            passed their closing date.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, description, or restaurant"
            className="pl-9"
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as "" | "ACTIVE" | "INACTIVE");
            setPage(1);
          }}
        >
          <option value="">All posts</option>
          <option value="ACTIVE">Open</option>
          <option value="INACTIVE">Hidden</option>
        </select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant</TableHead>
              <TableHead>Post</TableHead>
              <TableHead>Pay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Loading…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No job posts.
                </TableCell>
              </TableRow>
            ) : (
              items.map((job) => {
                const pastClose =
                  job.status === "ACTIVE" &&
                  job.closingDate != null &&
                  new Date(job.closingDate).getTime() < Date.now();
                return (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{restaurantName(job)}</TableCell>
                    <TableCell className="max-w-md">
                      <div className="font-medium">{job.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {typeLabel(job.jobType)}
                        {job.contactPhone ? ` · ${job.contactPhone}` : ""}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {job.description}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{payLabel(job)}</TableCell>
                    <TableCell>
                      <Badge variant={job.status === "ACTIVE" ? "default" : "secondary"}>
                        {job.status === "ACTIVE" ? "Open" : "Hidden"}
                      </Badge>
                      {pastClose && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Closing date has passed
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === job.id}
                          onClick={() =>
                            void changeStatus(
                              job,
                              job.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                            )
                          }
                        >
                          {job.status === "ACTIVE" ? "Hide" : "Show"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busyId === job.id}
                          onClick={() => setPendingDelete(job)}
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {total === 0 ? "0 posts" : `${from}–${to} of ${total}`}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= lastPage || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Remove this job post?"
        description="Customers will no longer see it."
        confirmText="Remove"
        variant="destructive"
        onConfirm={remove}
      />
    </div>
  );
}
