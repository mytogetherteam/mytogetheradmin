import { useState, useEffect, useMemo } from "react";
import { databaseBackupService, BackupItem } from "@/services/databaseBackupService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Database,
  Download,
  Trash2,
  RefreshCw,
  Plus,
  Search,
  HardDrive,
  Clock,
  ShieldCheck,
  FileCode,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";

export default function DatabaseBackup() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<BackupItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const data = await databaseBackupService.getBackups();
      setBackups(Array.isArray(data) ? data : []);
    } catch (error) {
      handleApiError(error, "Failed to load database backups");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    const toastId = toast.loading("Generating database backup on server...");
    try {
      const newBackup = await databaseBackupService.createBackup();
      toast.success(`Backup created: ${newBackup.filename} (${newBackup.sizeFormatted})`, {
        id: toastId,
      });
      await loadBackups();
    } catch (error) {
      toast.dismiss(toastId);
      handleApiError(error, "Failed to create database backup");
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (filename: string) => {
    setDownloadingFile(filename);
    try {
      toast.info(`Preparing download for ${filename}...`);
      await databaseBackupService.downloadBackup(filename);
      toast.success("Download started successfully");
    } catch (error) {
      handleApiError(error, "Failed to download backup");
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    const filename = fileToDelete.filename;
    setDeletingFile(filename);
    try {
      await databaseBackupService.deleteBackup(filename);
      toast.success(`Backup ${filename} deleted successfully`);
      setBackups((prev) => prev.filter((b) => b.filename !== filename));
    } catch (error) {
      handleApiError(error, "Failed to delete backup");
    } finally {
      setDeletingFile(null);
      setFileToDelete(null);
    }
  };

  const filteredBackups = useMemo(() => {
    if (!searchQuery.trim()) return backups;
    const query = searchQuery.toLowerCase();
    return backups.filter((b) => b.filename.toLowerCase().includes(query));
  }, [backups, searchQuery]);

  const totalBytes = useMemo(() => {
    return backups.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
  }, [backups]);

  const formatTotalSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const latestBackupDate = useMemo(() => {
    if (backups.length === 0) return "Never";
    return new Date(backups[0].createdAt).toLocaleString();
  }, [backups]);

  return (
    <div className="container mx-auto py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Database Backups</h1>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              PostgreSQL
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Create, view, and securely download server-side database snapshots (.sql).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadBackups}
            disabled={loading || creating}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={handleCreateBackup}
            disabled={creating}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Backing Up...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Backup Now
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Snapshots stored on server
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Snapshot</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold truncate">{latestBackupDate}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Most recent database capture
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backup Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTotalSize(totalBytes)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Combined archive storage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Safety Info Alert */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Security & Safety Notice: </strong>
            Database backups contain complete schemas and records. Downloads are strictly restricted to Super Administrators.
            To protect production uptime and prevent data overwriting, database restoration is handled via secure server/staging operations.
          </div>
        </CardContent>
      </Card>

      {/* Backups Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Available Snapshots</CardTitle>
              <CardDescription>
                List of database backup files available for download.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search backup file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading && backups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Loading database backups...</p>
            </div>
          ) : filteredBackups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center text-muted-foreground">
              <Database className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium text-foreground">No backup files found</p>
                <p className="text-sm mt-1">
                  {searchQuery
                    ? "No backups matched your search query."
                    : 'Click "Create Backup Now" above to generate your first snapshot.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Created Date & Time</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBackups.map((item) => (
                    <TableRow key={item.filename}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-mono text-sm">{item.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(item.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {item.sizeFormatted}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(item.filename)}
                            disabled={downloadingFile === item.filename}
                            className="gap-1.5 h-8 text-xs"
                          >
                            {downloadingFile === item.filename ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            Download
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFileToDelete(item)}
                            disabled={deletingFile === item.filename}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            title="Delete Backup"
                          >
                            {deletingFile === item.filename ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(fileToDelete)}
        onOpenChange={(open) => !open && setFileToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Database Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the backup file{" "}
              <strong className="text-foreground font-mono">
                {fileToDelete?.filename}
              </strong>{" "}
              ({fileToDelete?.sizeFormatted}) from the server? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete File
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
