import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    LayoutDashboard,
    UtensilsCrossed,
    Tags,
    FileSpreadsheet,
    Settings,
    ChevronRight,
    User,
    Users,
    ShieldAlert,
    List,
    Plus,
    Settings2,
    BarChart2,
    ClipboardList,
    History,
    ImageIcon,
    Megaphone,
    Package,
    Building2,
    MapPin,
    Clock,
    ClipboardCheck,
    Timer,
    Smartphone,
    FileText,
    Presentation,
    Flag,
} from "lucide-react"

import { Link, useLocation } from "react-router-dom"
import { authService } from "@/services/authService"
import { cn } from "@/lib/utils"
import { hasAccess, AdminRole } from "@/utils/rbac"

export function AppSidebar() {
    const location = useLocation();

    const userData = authService.getUserData();
    const userRole = userData?.role;

    const canSee = (requiredRole: AdminRole | AdminRole[]) => {
        return hasAccess(userRole, requiredRole);
    };

    const isActive = (path: string) => {
        if (path === "/" && location.pathname !== "/") return false;
        return location.pathname.startsWith(path);
    };

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                            <div className="flex aspect-square size-10 items-center justify-center rounded-lg">
                                <img src="/src/assets/logo-Mytogether.jpg" alt="Admin Panel" className="size-full object-contain" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">Admin Panel</span>
                                <span className="truncate text-xs">Management</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {/* Dashboard */}
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Dashboard" isActive={isActive("/")}>
                                <Link to="/">
                                    <LayoutDashboard className={cn(isActive("/") && "text-primary")} />
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        {canSee(AdminRole.ADMIN_FINANCE) && (
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Analytics" isActive={isActive("/analytics")}>
                                    <Link to="/analytics">
                                        <BarChart2 className={cn(isActive("/analytics") && "text-primary")} />
                                        <span>Analytics</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                    </SidebarMenu>
                </SidebarGroup>

                {/* Orders */}
                {canSee([AdminRole.ADMIN_OPS, AdminRole.ADMIN_FINANCE]) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Orders</SidebarGroupLabel>
                        <SidebarMenu>
                            {canSee(AdminRole.ADMIN_OPS) && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Order Board" isActive={isActive("/orders/board")}>
                                        <Link to="/orders/board">
                                            <ClipboardList className={cn(isActive("/orders/board") && "text-primary")} />
                                            <span>Live Order Board</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            {canSee(AdminRole.ADMIN_FINANCE) && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Order History" isActive={isActive("/orders/history")}>
                                        <Link to="/orders/history">
                                            <History className={cn(isActive("/orders/history") && "text-primary")} />
                                            <span>Order History</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Shop / Restaurant */}
                {canSee(AdminRole.ADMIN_OPS) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Shop / Restaurant</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive("/shops/create")} tooltip="Create Shop/Restaurant">
                                    <Link to="/shops/create">
                                        <Plus className={cn(isActive("/shops/create") && "text-primary")} />
                                        <span>Create Shop/Restaurant</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive("/shops/manage")} tooltip="Manage Shop/Restaurant">
                                    <Link to="/shops/manage">
                                        <Settings2 className={cn(isActive("/shops/manage") && "text-primary")} />
                                        <span>Manage Shop/Restaurant</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive("/shops/operating-hours")} tooltip="Shop Operating Hours">
                                    <Link to="/shops/operating-hours">
                                        <Clock className={cn(isActive("/shops/operating-hours") && "text-primary")} />
                                        <span>Shop Operating Hours</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Menu */}
                {canSee(AdminRole.ADMIN_OPS) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Menu Management</SidebarGroupLabel>
                        <SidebarMenu>
                            {/* Food Items */}
                            <Collapsible asChild className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip="Menu Items">
                                            <UtensilsCrossed />
                                            <span>Menu Items</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/menus/items/create")}>
                                                    <Link to="/menus/items/create">
                                                        <Plus className={cn(isActive("/menus/items/create") && "text-primary")} />
                                                        <span>Create Menu Item</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/menus/items/manage")}>
                                                    <Link to="/menus/items/manage">
                                                        <List className={cn(isActive("/menus/items/manage") && "text-primary")} />
                                                        <span>Manage Menu Items</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Menu Approvals */}
                {canSee(AdminRole.ADMIN_OPS) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Approvals</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Menu Approvals" isActive={isActive("/menus/approvals")}>
                                    <Link to="/menus/approvals">
                                        <ClipboardCheck className={cn(isActive("/menus/approvals") && "text-primary")} />
                                        <span>Menu Approvals</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Shop Category */}
                {canSee(AdminRole.ADMIN_SETUP) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Shop Tags</SidebarGroupLabel>
                        <SidebarMenu>
                            {/* Shop Categories */}
                            <Collapsible asChild className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip="Shop Categories">
                                            <Tags />
                                            <span>Shop Categories</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/shop-categories/create")}>
                                                    <Link to="/shop-categories/create">
                                                        <Plus className={cn(isActive("/shop-categories/create") && "text-primary")} />
                                                        <span>Create Shop Category</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/shop-categories/manage")}>
                                                    <Link to="/shop-categories/manage">
                                                        <Settings2 className={cn(isActive("/shop-categories/manage") && "text-primary")} />
                                                        <span>Manage Shop Categories</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>

                            {/* Shop Sub Categories */}
                            <Collapsible asChild className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip="Shop Sub-Categories">
                                            <Tags />
                                            <span>Shop Sub-Categories</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/shop-sub-categories/create")}>
                                                    <Link to="/shop-sub-categories/create">
                                                        <Plus className={cn(isActive("/shop-sub-categories/create") && "text-primary")} />
                                                        <span>Create Sub-Category</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/shop-sub-categories/manage")}>
                                                    <Link to="/shop-sub-categories/manage">
                                                        <List className={cn(isActive("/shop-sub-categories/manage") && "text-primary")} />
                                                        <span>Manage Sub-Categories</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Payment Methods */}
                {canSee(AdminRole.ADMIN) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Payment Methods</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive("/payment/methods/create")} tooltip="Create Payment Method">
                                    <Link to="/payment/methods/create">
                                        <Plus className={cn(isActive("/payment/methods/create") && "text-primary")} />
                                        <span>Create Payment Method</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive("/payment/methods")} tooltip="Manage Payment Methods">
                                    <Link to="/payment/methods">
                                        <Settings2 className={cn(isActive("/payment/methods") && "text-primary")} />
                                        <span>Manage PaymentMethods</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Shop Payment Types */}
                {canSee(AdminRole.ADMIN) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Shop Payment Types</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive("/shop-payment-types/create")} tooltip="Create Shop Payment Type">
                                    <Link to="/shop-payment-types/create">
                                        <Plus className={cn(isActive("/shop-payment-types/create") && "text-primary")} />
                                        <span>Create Payment Type</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive("/shop-payment-types/manage")} tooltip="Manage Shop Payment Types">
                                    <Link to="/shop-payment-types/manage">
                                        <Settings2 className={cn(isActive("/shop-payment-types/manage") && "text-primary")} />
                                        <span>Manage PaymentTypes</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Menu Category */}
                {canSee(AdminRole.ADMIN_SETUP) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Menu Category</SidebarGroupLabel>
                        <SidebarMenu>
                            {/* Menu Categories */}
                            <Collapsible asChild className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip="Menu Category">
                                            <Tags />
                                            <span>Menu Category</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/categories/create")}>
                                                    <Link to="/categories/create">
                                                        <Plus className={cn(isActive("/categories/create") && "text-primary")} />
                                                        <span>Create Menu Category</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/categories/manage")}>
                                                    <Link to="/categories/manage">
                                                        <Settings2 className={cn(isActive("/categories/manage") && "text-primary")} />
                                                        <span>Manage Menu Categories</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>

                            {/* Sub Categories */}
                            <Collapsible asChild className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip="Menu Sub-Categories">
                                            <Tags />
                                            <span>Menu Sub-Categories</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/menus/sub-categories/create")}>
                                                    <Link to="/menus/sub-categories/create">
                                                        <Plus className={cn(isActive("/menus/sub-categories/create") && "text-primary")} />
                                                        <span>Create Sub-Category</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/menus/sub-categories/manage")}>
                                                    <Link to="/menus/sub-categories/manage">
                                                        <List className={cn(isActive("/menus/sub-categories/manage") && "text-primary")} />
                                                        <span>Manage Sub-Categories</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Moderation & Review */}
                {canSee(AdminRole.ADMIN_OPS) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Review & Moderation</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Content Moderation" isActive={isActive("/moderation/content")}>
                                    <Link to="/moderation/content">
                                        <ShieldAlert className={cn(isActive("/moderation/content") && "text-primary")} />
                                        <span>Content Moderation</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="User/Shop Reports" isActive={isActive("/moderation/user-shop")}>
                                    <Link to="/moderation/user-shop">
                                        <ShieldAlert className={cn(isActive("/moderation/user-shop") && "text-primary")} />
                                        <span>User/Shop Reports</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Reviews" isActive={isActive("/review/reviews")}>
                                    <Link to="/review/reviews">
                                        <ClipboardList className={cn(isActive("/review/reviews") && "text-primary")} />
                                        <span>Review Moderation</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Community */}
                {canSee(AdminRole.ADMIN_SETUP) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Community</SidebarGroupLabel>
                        <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Posts & Comments" isActive={isActive("/community/posts")}>
                                        <Link to="/community/posts">
                                            <List className={cn(isActive("/community/posts") && "text-primary")} />
                                            <span>Posts & Comments</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Lost & Found" isActive={isActive("/lostfound")}>
                                        <Link to="/lostfound">
                                            <Package className={cn(isActive("/lostfound") && "text-primary")} />
                                            <span>Lost & Found</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Marketing & Comms */}
                {canSee([AdminRole.ADMIN, AdminRole.ADMIN_SETUP]) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Marketing & Comms</SidebarGroupLabel>
                        <SidebarMenu>
                            {canSee(AdminRole.ADMIN) && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Banners" isActive={isActive("/marketing/banners")}>
                                        <Link to="/marketing/banners">
                                            <ImageIcon className={cn(isActive("/marketing/banners") && "text-primary")} />
                                            <span>Banners & Featured</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            {canSee(AdminRole.ADMIN_SETUP) && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Broadcast" isActive={isActive("/marketing/broadcast")}>
                                        <Link to="/marketing/broadcast">
                                            <Megaphone className={cn(isActive("/marketing/broadcast") && "text-primary")} />
                                            <span>Push Broadcast</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* User Management */}
                {canSee(AdminRole.ADMIN_OPS) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Users</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Manage Users" isActive={isActive("/users/manage")}>
                                    <Link to="/users/manage">
                                        <Users className={cn(isActive("/users/manage") && "text-primary")} />
                                        <span>Manage Users</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}


                {/* Cuisines */}
                {canSee(AdminRole.ADMIN_SETUP) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Cuisines</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive("/cuisines/create")} tooltip="Create Cuisine">
                                    <Link to="/cuisines/create">
                                        <Plus className={cn(isActive("/cuisines/create") && "text-primary")} />
                                        <span>Create Cuisine</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive("/cuisines/manage")} tooltip="Manage Cuisines">
                                    <Link to="/cuisines/manage">
                                        <List className={cn(isActive("/cuisines/manage") && "text-primary")} />
                                        <span>Manage Cuisines</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Location Management */}
                {canSee(AdminRole.ADMIN_SETUP) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Location</SidebarGroupLabel>
                        <SidebarMenu>
                            <Collapsible className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip="Region">
                                            <MapPin />
                                            <span>Region</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/regions/create")}>
                                                    <Link to="/regions/create">
                                                        <Plus className={cn(isActive("/regions/create") && "text-primary")} />
                                                        <span>Create Region</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/regions/manage")}>
                                                    <Link to="/regions/manage">
                                                        <List className={cn(isActive("/regions/manage") && "text-primary")} />
                                                        <span>Manage Regions</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>

                            <Collapsible className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip="City">
                                            <Building2 />
                                            <span>City</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/cities/create")}>
                                                    <Link to="/cities/create">
                                                        <Plus className={cn(isActive("/cities/create") && "text-primary")} />
                                                        <span>Create City</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/cities/manage")}>
                                                    <Link to="/cities/manage">
                                                        <List className={cn(isActive("/cities/manage") && "text-primary")} />
                                                        <span>Manage Cities</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>

                            <Collapsible className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip="District">
                                            <MapPin />
                                            <span>District</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/districts/create")}>
                                                    <Link to="/districts/create">
                                                        <Plus className={cn(isActive("/districts/create") && "text-primary")} />
                                                        <span>Create District</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/districts/manage")}>
                                                    <Link to="/districts/manage">
                                                        <List className={cn(isActive("/districts/manage") && "text-primary")} />
                                                        <span>Manage Districts</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Data Import */}
                {canSee(AdminRole.ADMIN) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Data Import</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive("/import/shops-excel")} tooltip="Import Shops (Excel)">
                                    <Link to="/import/shops-excel">
                                        <FileSpreadsheet className={cn(isActive("/import/shops-excel") && "text-primary")} />
                                        <span>Import Shops (Excel)</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive("/import/activity-excel")} tooltip="Import Activities (Excel)">
                                    <Link to="/import/activity-excel">
                                        <FileSpreadsheet className={cn(isActive("/import/activity-excel") && "text-primary")} />
                                        <span>Import Activities (Excel)</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* System / Administration */}
                <SidebarGroup>
                    <SidebarGroupLabel>Administration</SidebarGroupLabel>
                    <SidebarMenu>
                            {/* System Logs / Audit - SUPER ADMIN Only */}
                            {canSee(AdminRole.ADMIN) && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Audit Logs" isActive={isActive("/system/audit-logs")}>
                                        <Link to="/system/audit-logs">
                                            <ClipboardList className={cn(isActive("/system/audit-logs") && "text-primary")} />
                                            <span>System Audit Logs</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}

                            {/* Order Timeouts - FINANCE */}
                            {canSee(AdminRole.ADMIN_FINANCE) && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Order Timeouts" isActive={isActive("/system/order-timeouts")}>
                                        <Link to="/system/order-timeouts">
                                            <Timer className={cn(isActive("/system/order-timeouts") && "text-primary")} />
                                            <span>Order Timeouts</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}


                            {/* App Content & Versions - SETUP */}
                            {canSee(AdminRole.ADMIN_SETUP) && (
                                <>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Onboarding" isActive={isActive("/system/onboarding")}>
                                            <Link to="/system/onboarding">
                                                <Presentation className={cn(isActive("/system/onboarding") && "text-primary")} />
                                                <span>Onboarding Screens</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Configurations" isActive={isActive("/system/configs")}>
                                            <Link to="/system/configs">
                                                <Settings2 className={cn(isActive("/system/configs") && "text-primary")} />
                                                <span>Configurations</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Feature Flags" isActive={isActive("/system/feature-flags")}>
                                            <Link to="/system/feature-flags">
                                                <Flag className={cn(isActive("/system/feature-flags") && "text-primary")} />
                                                <span>Feature Flags</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="App Content" isActive={isActive("/system/app-content")}>
                                            <Link to="/system/app-content">
                                                <FileText className={cn(isActive("/system/app-content") && "text-primary")} />
                                                <span>App Content</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="App Versions" isActive={isActive("/system/app-versions")}>
                                            <Link to="/system/app-versions">
                                                <Smartphone className={cn(isActive("/system/app-versions") && "text-primary")} />
                                                <span>App Versions</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </>
                            )}

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Admin Profile" isActive={isActive("/admin/profile")}>
                                    <Link to="/admin/profile">
                                        <User className={cn(isActive("/admin/profile") && "text-primary")} />
                                        <span>Admin Profile</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        {canSee(AdminRole.ADMIN) && (
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Settings">
                                    <Settings />
                                    <span>Settings</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}
