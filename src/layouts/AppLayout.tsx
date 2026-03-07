import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Outlet, useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, Bell } from "lucide-react"
import { authService } from "@/services/authService"
import { AdminGlobalSearch } from "@/components/admin-global-search"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { Button } from "@/components/ui/button"

export default function AppLayout() {
    const navigate = useNavigate()
    const userData = authService.getUserData()

    const handleLogout = () => {
        authService.logout()
        navigate("/login")
    }

    return (
        <SidebarProvider className="h-screen w-full">
            <AppSidebar />
            <SidebarInset className="flex flex-col h-screen overflow-hidden">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background z-20 sticky top-0 border-sidebar-border shadow-sm">
                    <div className="flex flex-1 items-center gap-2">
                        <SidebarTrigger />
                        <div className="hidden md:block mx-2 h-4 w-px bg-border" />
                        <BreadcrumbNav />
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        <AdminGlobalSearch />

                        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                            <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-600 border border-background"></span>
                        </Button>

                        {/* User Profile Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {userData?.fullName?.charAt(0) || "A"}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium hidden sm:inline">{userData?.fullName || "Admin User"}</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate("/profile")}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log Out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
                <div className="flex-1 overflow-auto bg-muted/30">
                    <div className="p-4 md:p-6 min-h-full">
                        <Outlet />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
