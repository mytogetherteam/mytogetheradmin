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

import { Link } from "react-router-dom"

export function AppSidebar() {
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
                            <SidebarMenuButton asChild tooltip="Dashboard">
                                <Link to="/">
                                    <LayoutDashboard />
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Analytics">
                                <Link to="/analytics">
                                    <BarChart2 />
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
                            <SidebarMenuButton asChild tooltip="Order Board">
                                <Link to="/orders/board">
                                    <ClipboardList />
                                    <span>Live Order Board</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Order History">
                                <Link to="/orders/history">
                                    <History />
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
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/shops/create">
                                                    <Plus />
                                                    <span>Create Shop/Restaurant</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/shops/manage">
                                                    <Settings2 />
                                                    <span>Manage Shop/Restaurant</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/shops/operating-hours">
                                                    <Clock />
                                                    <span>Shop Operating Hours</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/shops/riders/manage">
                                                    <Users />
                                                    <span>Shop Riders</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/shops/profile/settings">
                                                    <Settings />
                                                    <span>Shop Profile Mgt</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/import/shops-excel">
                                                    <FileSpreadsheet />
                                                    <span>Import Shops (Excel)</span>
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
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/shop-categories/create">
                                                    <Plus />
                                                    <span>Create Shop Category</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/shop-categories/manage">
                                                    <Settings2 />
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
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/shop-sub-categories/create">
                                                    <Plus />
                                                    <span>Create Shop Sub-Category</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/shop-sub-categories/manage">
                                                    <List />
                                                    <span>Manage Shop Sub-Categories</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>

                        {/* Payment Method */}
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
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/payment/methods/create">
                                                    <Plus />
                                                    <span>Create Payment Method</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/payment/methods">
                                                    <Settings2 />
                                                    <span>Manage Payment Methods</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>

                        {/* Shop Payment Type */}
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
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/shop-payment-types/create">
                                                    <Plus />
                                                    <span>Create Shop Payment Type</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/shop-payment-types/manage">
                                                    <Settings2 />
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
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/menus/items/create">
                                                    <Plus />
                                                    <span>Create Menu Item</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/menus/items/manage">
                                                    <List />
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
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/categories/create">
                                                    <Plus />
                                                    <span>Create Menu Category</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/categories/manage">
                                                    <Settings2 />
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
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/menus/sub-categories/create">
                                                    <Plus />
                                                    <span>Create Sub-Category</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/menus/sub-categories/manage">
                                                    <List />
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
                            <SidebarMenuButton asChild tooltip="Content Moderation">
                                <Link to="/moderation/content">
                                    <ShieldAlert />
                                    <span>Content Moderation</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="User/Shop Reports">
                                <Link to="/moderation/user-shop">
                                    <ShieldAlert />
                                    <span>User/Shop Reports</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Reviews">
                                <Link to="/review/reviews">
                                    <ClipboardList />
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
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/community/posts">
                                                    <List />
                                                    <span>Posts & Comments</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/lostfound">
                                                    <Package />
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
                            <SidebarMenuButton asChild tooltip="Banners">
                                <Link to="/marketing/banners">
                                    <ImageIcon />
                                    <span>Banners & Featured</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Broadcast">
                                <Link to="/marketing/broadcast">
                                    <Megaphone />
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
                            <SidebarMenuButton asChild tooltip="Manage Users">
                                <Link to="/users/manage">
                                    <Users />
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
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/cities/create">
                                                    <Plus />
                                                    <span>Create City</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/cities/manage">
                                                    <List />
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
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/districts/create">
                                                    <Plus />
                                                    <span>Create District</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link to="/districts/manage">
                                                    <List />
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
                            <SidebarMenuButton asChild tooltip="Audit Logs">
                                <Link to="/system/audit-logs">
                                    <ClipboardList />
                                    <span>System Audit Logs</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Admin Profile">
                                <Link to="/admin/profile">
                                    <User />
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
