import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Outlet, useNavigate } from "react-router-dom"
import { HeaderUserAvatar } from "@/components/HeaderUserAvatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut } from "lucide-react"
import { authService } from "@/services/authService"
import { NotificationBell } from "@/components/notificationBell"
import { AdminGlobalSearch } from "@/components/admin-global-search"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { AdminLiveAlertToasts } from "@/components/admin-live-alert-toasts"
import { AdminWebSocketProvider } from "@/hooks/useAdminWebSocket"
import { useInactivityMiddleware } from "@/middleware/inactivityMiddleware"
import { useSessionExpiryMiddleware } from "@/middleware/sessionExpiryMiddleware"

export default function AppLayout() {
    const navigate = useNavigate()
    const userData = authService.getUserData()

    // ── Middleware ─────────────────────────────────────────────────────────────
    useInactivityMiddleware()   // auto-logout after 30 min idle
    useSessionExpiryMiddleware() // warn + extend when JWT < 5 min remaining

    const handleLogout = async () => {
        await authService.logout()
        navigate("/login")
    }

    return (
        <AdminWebSocketProvider>
            {/* Global Background Image with fade opacity */}
            <div 
                className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat opacity-15 pointer-events-none blur-md"
                style={{ backgroundImage: 'url(/main-bg.png)' }}
            />
            <SidebarProvider className="h-screen w-full bg-transparent">
                <AdminLiveAlertToasts />
                <AppSidebar />
                <SidebarInset className="flex flex-col h-screen overflow-hidden bg-transparent">
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background z-20 sticky top-0 border-sidebar-border shadow-sm">
                        <div className="flex flex-1 items-center gap-2">
                            <SidebarTrigger />
                            <div className="hidden md:block mx-2 h-4 w-px bg-border" />
                            <BreadcrumbNav />
                        </div>

                        <div className="flex items-center gap-3 md:gap-4">
                            <AdminGlobalSearch />

                            <NotificationBell />

                            {/* User Profile Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none">
                                    <HeaderUserAvatar />
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
        </AdminWebSocketProvider>
    )
}
