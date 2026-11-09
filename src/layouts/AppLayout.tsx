import { useState, useEffect } from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Outlet, useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authService } from "@/services/authService"
import { NotificationBell } from "@/components/notificationBell"
import { AdminGlobalSearch } from "@/components/admin-global-search"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { AdminLiveAlertToasts } from "@/components/admin-live-alert-toasts"
import { AdminWebSocketProvider } from "@/hooks/useAdminWebSocket"
import { useInactivityMiddleware } from "@/middleware/inactivityMiddleware"
import { useSessionExpiryMiddleware } from "@/middleware/sessionExpiryMiddleware"
import { AdminGeminiModal } from "@/components/gemini/AdminGeminiModal"

export default function AppLayout() {
    const navigate = useNavigate()
    const userData = authService.getUserData()
    const [isAiModalOpen, setIsAiModalOpen] = useState(false)

    // Global keyboard shortcut: Ctrl+Space to toggle Gemini AI Modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.code === "Space") {
                e.preventDefault()
                setIsAiModalOpen((prev) => !prev)
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])

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
                            {/* Gemini AI Assistant Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAiModalOpen(true)}
                                className="h-9 px-3 gap-1.5 rounded-full border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/15 hover:border-purple-500/50 text-purple-600 dark:text-purple-400 font-medium transition-all shadow-xs shrink-0 cursor-pointer"
                                title="Open Gemini AI Assistant (Ctrl+Space)"
                            >
                                <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                                <span className="hidden sm:inline">Ask Gemini</span>
                                <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-muted border rounded font-mono text-muted-foreground">
                                    Ctrl+Space
                                </kbd>
                            </Button>

                            <AdminGlobalSearch />

                            <NotificationBell />

                            {/* User Profile Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none">
                                    <Avatar className="h-8 w-8 rounded-full">
                                        <AvatarImage src="/profile.png" alt="Profile" className="object-cover" />
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
                <AdminGeminiModal open={isAiModalOpen} onOpenChange={setIsAiModalOpen} />
            </SidebarProvider>
        </AdminWebSocketProvider>
    )
}
