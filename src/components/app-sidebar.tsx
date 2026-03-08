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
    Store,
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
    Wallet,
    QrCode,
    Building2,
    MapPin,
    Clock,
} from "lucide-react"

import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

export function AppSidebar() {
    const location = useLocation();

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
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <Store className="size-4" />
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
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Analytics" isActive={isActive("/analytics")}>
                                <Link to="/analytics">
                                    <BarChart2 className={cn(isActive("/analytics") && "text-primary")} />
                                    <span>Analytics</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Orders */}
                <SidebarGroup>
                    <SidebarGroupLabel>Orders</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Order Board" isActive={isActive("/orders/board")}>
                                <Link to="/orders/board">
                                    <ClipboardList className={cn(isActive("/orders/board") && "text-primary")} />
                                    <span>Live Order Board</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Order History" isActive={isActive("/orders/history")}>
                                <Link to="/orders/history">
                                    <History className={cn(isActive("/orders/history") && "text-primary")} />
                                    <span>Order History</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Shop / Restaurant */}
                <SidebarGroup>
                    <SidebarGroupLabel>Shop / Restaurant</SidebarGroupLabel>
                    <SidebarMenu>
                        <Collapsible asChild defaultOpen className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip="Shop / Restaurant">
                                        <Store />
                                        <span>Shop / Restaurant</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild isActive={isActive("/shops/create")}>
                                                <Link to="/shops/create">
                                                    <Plus className={cn(isActive("/shops/create") && "text-primary")} />
                                                    <span>Create Shop/Restaurant</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild isActive={isActive("/shops/manage")}>
                                                <Link to="/shops/manage">
                                                    <Settings2 className={cn(isActive("/shops/manage") && "text-primary")} />
                                                    <span>Manage Shop/Restaurant</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild isActive={isActive("/shops/operating-hours")}>
                                                <Link to="/shops/operating-hours">
                                                    <Clock className={cn(isActive("/shops/operating-hours") && "text-primary")} />
                                                    <span>Shop Operating Hours</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild isActive={isActive("/shops/riders/manage")}>
                                                <Link to="/shops/riders/manage">
                                                    <Users className={cn(isActive("/shops/riders/manage") && "text-primary")} />
                                                    <span>Shop Riders</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild isActive={isActive("/shops/profile/settings")}>
                                                <Link to="/shops/profile/settings">
                                                    <Settings className={cn(isActive("/shops/profile/settings") && "text-primary")} />
                                                    <span>Shop Profile Mgt</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild isActive={isActive("/import/shops-excel")}>
                                                <Link to="/import/shops-excel">
                                                    <FileSpreadsheet className={cn(isActive("/import/shops-excel") && "text-primary")} />
                                                    <span>Import Shops (Excel)</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>

                        {/* Cuisines */}
                        <Collapsible asChild className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip="Cuisines">
                                        <UtensilsCrossed />
                                        <span>Cuisines</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild isActive={isActive("/cuisines/create")}>
                                                <Link to="/cuisines/create">
                                                    <Plus className={cn(isActive("/cuisines/create") && "text-primary")} />
                                                    <span>Create Cuisine</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild isActive={isActive("/cuisines/manage")}>
                                                <Link to="/cuisines/manage">
                                                    <List className={cn(isActive("/cuisines/manage") && "text-primary")} />
                                                    <span>Manage Cuisines</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>

                        {/* Shop Categories */}
                        <Collapsible asChild className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip="Shop Category">
                                        <Tags />
                                        <span>Shop Category</span>
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
                                    <SidebarMenuButton tooltip="Shop Sub-Category">
                                        <Tags />
                                        <span>Shop Sub-Category</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild isActive={isActive("/shop-sub-categories/create")}>
                                                <Link to="/shop-sub-categories/create">
                                                    <Plus className={cn(isActive("/shop-sub-categories/create") && "text-primary")} />
                                                    <span>Create Shop Sub-Category</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild isActive={isActive("/shop-sub-categories/manage")}>
                                                <Link to="/shop-sub-categories/manage">
                                                    <List className={cn(isActive("/shop-sub-categories/manage") && "text-primary")} />
                                                    <span>Manage Shop Sub-Categories</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>

                        {/* Payment & Financials */}
                        <SidebarGroup>
                            <SidebarGroupLabel>Payment Methods</SidebarGroupLabel>
                            <SidebarMenu>
                                <Collapsible asChild className="group/collapsible">
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip="Payment Method">
                                                <Wallet />
                                                <span>Payment Method</span>
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton asChild isActive={isActive("/payment/methods/create")}>
                                                        <Link to="/payment/methods/create">
                                                            <Plus className={cn(isActive("/payment/methods/create") && "text-primary")} />
                                                            <span>Create Payment Method</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton asChild isActive={isActive("/payment/methods")}>
                                                        <Link to="/payment/methods">
                                                            <Settings2 className={cn(isActive("/payment/methods") && "text-primary")} />
                                                            <span>Manage Payment Methods</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            </SidebarMenu>
                        </SidebarGroup>

                        <SidebarGroup>
                            <SidebarGroupLabel>Shop Payment Types</SidebarGroupLabel>
                            <SidebarMenu>
                                <Collapsible asChild className="group/collapsible">
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip="Shop Payment Type">
                                                <QrCode />
                                                <span>Shop Payment Type</span>
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton asChild isActive={isActive("/shop-payment-types/create")}>
                                                        <Link to="/shop-payment-types/create">
                                                            <Plus className={cn(isActive("/shop-payment-types/create") && "text-primary")} />
                                                            <span>Create Shop Payment Type</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton asChild isActive={isActive("/shop-payment-types/manage")}>
                                                        <Link to="/shop-payment-types/manage">
                                                            <Settings2 className={cn(isActive("/shop-payment-types/manage") && "text-primary")} />
                                                            <span>Manage Shop Payment Types</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            </SidebarMenu>
                        </SidebarGroup>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Menu */}
                <SidebarGroup>
                    <SidebarGroupLabel>Food Menu</SidebarGroupLabel>
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

                {/* Moderation & Review */}
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

                {/* Community */}
                <SidebarGroup>
                    <SidebarGroupLabel>Community</SidebarGroupLabel>
                    <SidebarMenu>
                        <Collapsible asChild className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip="Community Mgt">
                                        <Users />
                                        <span>Community Mgt</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild isActive={isActive("/community/posts")}>
                                                <Link to="/community/posts">
                                                    <List className={cn(isActive("/community/posts") && "text-primary")} />
                                                    <span>Posts & Comments</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild isActive={isActive("/lostfound")}>
                                                <Link to="/lostfound">
                                                    <Package className={cn(isActive("/lostfound") && "text-primary")} />
                                                    <span>Lost & Found</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Marketing & Comms */}
                <SidebarGroup>
                    <SidebarGroupLabel>Marketing & Comms</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Banners" isActive={isActive("/marketing/banners")}>
                                <Link to="/marketing/banners">
                                    <ImageIcon className={cn(isActive("/marketing/banners") && "text-primary")} />
                                    <span>Banners & Featured</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Broadcast" isActive={isActive("/marketing/broadcast")}>
                                <Link to="/marketing/broadcast">
                                    <Megaphone className={cn(isActive("/marketing/broadcast") && "text-primary")} />
                                    <span>Push Broadcast</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* User Management */}
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

                {/* Location Management */}
                <SidebarGroup>
                    <SidebarGroupLabel>Location</SidebarGroupLabel>
                    <SidebarMenu>
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

                {/* System / Administration */}
                <SidebarGroup>
                    <SidebarGroupLabel>Administration</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Audit Logs" isActive={isActive("/system/audit-logs")}>
                                <Link to="/system/audit-logs">
                                    <ClipboardList className={cn(isActive("/system/audit-logs") && "text-primary")} />
                                    <span>System Audit Logs</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Admin Profile" isActive={isActive("/admin/profile")}>
                                <Link to="/admin/profile">
                                    <User className={cn(isActive("/admin/profile") && "text-primary")} />
                                    <span>Admin Profile</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Settings">
                                <Settings />
                                <span>Settings</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}
