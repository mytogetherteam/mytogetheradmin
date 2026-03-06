import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    FileSpreadsheet,
    Search,
    ArrowUpDown,
    Loader2,
    MoreHorizontal,
    UserCog,
    Power
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { userService } from "@/services/userService";
import { exportService } from "@/services/exportService";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function ManageUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

    // User Actions State
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [newRole, setNewRole] = useState("USER");
    const [actionLoading, setActionLoading] = useState(false);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await userService.getAllUsers(currentPage - 1, pageSize, searchTerm);
            if (response && response.content) {
                setUsers(response.content);
                setTotalPages(response.totalPages);
                setTotalItems(response.totalElements);
            } else if (Array.isArray(response)) {
                setUsers(response);
                setTotalItems(response.length);
                setTotalPages(Math.ceil(response.length / pageSize));
            }
        } catch (error) {
            console.error("Failed to load users", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [currentPage, pageSize, searchTerm]);

    const handleSort = (key: string) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });

        const sorted = [...users].sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return direction === "asc" ? -1 : 1;
            if (aVal > bVal) return direction === "asc" ? 1 : -1;
            return 0;
        });
        setUsers(sorted);
    };

    const exportToExcel = () => {
        exportService.exportUsers();
        toast.info("Exporting users...");
    };

    const handleToggleStatus = async (user: any) => {
        setActionLoading(true);
        try {
            await userService.toggleUserStatus(user.id, !user.active);
            toast.success(`User ${user.active ? 'deactivated' : 'activated'} successfully`);
            loadUsers();
        } catch (error) {
            console.error("Failed to toggle status", error);
            toast.error("Failed to toggle user status");
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenRoleDialog = (user: any) => {
        setSelectedUser(user);
        setNewRole(user.role || 'USER');
        setRoleDialogOpen(true);
    };

    const handleUpdateRole = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            await userService.updateUserRole(selectedUser.id, newRole);
            toast.success(`User role updated to ${newRole}`);
            setRoleDialogOpen(false);
            loadUsers();
        } catch (error) {
            console.error("Failed to update role", error);
            toast.error("Failed to update user role");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-7xl">
            <Card className="flex flex-col h-full border-solid">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="leading-tight">Users</CardTitle>
                            <CardDescription className="line-clamp-2 md:line-clamp-none">
                                Manage registered users and administrators.
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
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <Button variant="outline" className="gap-2 shrink-0" onClick={exportToExcel}>
                                <FileSpreadsheet className="h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort("id")}>
                                                <div className="flex items-center gap-2">ID <ArrowUpDown className="h-3 w-3" /></div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                                                <div className="flex items-center gap-2">Name <ArrowUpDown className="h-3 w-3" /></div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort("email")}>
                                                <div className="flex items-center gap-2">Email <ArrowUpDown className="h-3 w-3" /></div>
                                            </TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.length > 0 ? (
                                            users.map((user) => (
                                                <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                                                    <TableCell className="font-mono text-xs">{user.id}</TableCell>
                                                    <TableCell className="font-medium">{user.name || user.fullName || "N/A"}</TableCell>
                                                    <TableCell className="text-sm">{user.email}</TableCell>
                                                    <TableCell><Badge variant="outline" className="font-normal">{user.role || "User"}</Badge></TableCell>
                                                    <TableCell>
                                                        <Badge variant={user.active ? "default" : "secondary"}>
                                                            {user.active ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={actionLoading}>
                                                                    <span className="sr-only">Open menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                                                    <Power className="mr-2 h-4 w-4" />
                                                                    {user.active ? 'Deactivate' : 'Activate'}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleOpenRoleDialog(user)}>
                                                                    <UserCog className="mr-2 h-4 w-4" />
                                                                    Change Role
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                    No users found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex flex-col items-center gap-4 py-4 md:flex-row md:justify-between px-2">
                                <div className="text-sm text-muted-foreground text-center md:text-left">
                                    Showing {totalItems ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                            let pageNum = i + 1;
                                            if (totalPages > 5) {
                                                if (currentPage > 3) pageNum = currentPage - 2 + i;
                                                if (pageNum > totalPages) return null;
                                            }
                                            return (
                                                <Button
                                                    key={i}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-8 w-8 p-0 hidden lg:flex"
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Select
                                        value={`${pageSize}`}
                                        onValueChange={(value) => {
                                            setPageSize(Number(value));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-[70px]">
                                            <SelectValue placeholder={pageSize} />
                                        </SelectTrigger>
                                        <SelectContent side="top">
                                            {[10, 20, 30, 40, 50].map((size) => (
                                                <SelectItem key={size} value={`${size}`}>
                                                    {size}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Role Update Dialog */}
            <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change User Role</DialogTitle>
                        <DialogDescription>
                            Select a new role for <span className="font-semibold">{selectedUser?.name || selectedUser?.fullName || 'this user'}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Select value={newRole} onValueChange={setNewRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USER">USER</SelectItem>
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                                <SelectItem value="SHOP_OWNER">SHOP-OWNER</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRoleDialogOpen(false)} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateRole} disabled={actionLoading}>
                            {actionLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
