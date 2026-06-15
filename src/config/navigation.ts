import {
    LayoutDashboard,
    UtensilsCrossed,
    Tags,
    FileSpreadsheet,
    Settings,
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
    TicketPercent,
    MessageSquare,
    Layers,
    Newspaper,
} from "lucide-react"

import { AdminRole } from "../utils/rbac"
import { LucideIcon } from "lucide-react"

export type NavSubItem = {
    title: string;
    url: string;
    icon?: LucideIcon;
    roles?: AdminRole | AdminRole[];
}

export type NavItem = {
    title: string;
    url?: string;
    icon?: LucideIcon;
    roles?: AdminRole | AdminRole[];
    tooltip?: string;
    items?: NavSubItem[];
}

export type NavGroup = {
    title?: string;
    roles?: AdminRole | AdminRole[];
    items: NavItem[];
}

export const navigationConfig: NavGroup[] = [
    {
        items: [
            { title: "Dashboard", url: "/", icon: LayoutDashboard, tooltip: "Dashboard" },
            { title: "Analytics", url: "/analytics", icon: BarChart2, tooltip: "Analytics", roles: AdminRole.ADMIN_FINANCE }
        ]
    },
    {
        title: "Orders",
        roles: [AdminRole.ADMIN_OPS, AdminRole.ADMIN_FINANCE],
        items: [
            { title: "Live Order Board", url: "/orders/board", icon: ClipboardList, tooltip: "Order Board", roles: AdminRole.ADMIN_OPS },
            { title: "Order History", url: "/orders/history", icon: History, tooltip: "Order History", roles: AdminRole.ADMIN_FINANCE }
        ]
    },
    {
        title: "Shop / Restaurant",
        roles: AdminRole.ADMIN_OPS,
        items: [
            { title: "Create Shop/Restaurant", url: "/shops/create", icon: Plus, tooltip: "Create Shop/Restaurant" },
            { title: "Manage Shop/Restaurant", url: "/shops/manage", icon: Settings2, tooltip: "Manage Shop/Restaurant" },
            { title: "Shop Operating Hours", url: "/shops/operating-hours", icon: Clock, tooltip: "Shop Operating Hours" }
        ]
    },
    {
        title: "Menu Management",
        roles: AdminRole.ADMIN_OPS,
        items: [
            {
                title: "Menu Items",
                icon: UtensilsCrossed,
                tooltip: "Menu Items",
                items: [
                    { title: "Create Menu Item", url: "/menus/items/create", icon: Plus },
                    { title: "Manage Menu Items", url: "/menus/items/manage", icon: List }
                ]
            }
        ]
    },
    {
        title: "Approvals",
        roles: AdminRole.ADMIN_OPS,
        items: [
            { title: "Admin Approvals", url: "/menus/approvals", icon: ClipboardCheck, tooltip: "Admin Approvals" }
        ]
    },
    {
        title: "Collections",
        roles: AdminRole.ADMIN,
        items: [
            {
                title: "Collections",
                icon: Layers,
                tooltip: "Collections",
                items: [
                    { title: "Create Collection", url: "/collections/create", icon: Plus },
                    { title: "Manage Collections", url: "/collections/manage", icon: Settings2 }
                ]
            }
        ]
    },
    {
        title: "Shop Tags",
        roles: AdminRole.ADMIN_SETUP,
        items: [
            {
                title: "Shop Categories",
                icon: Tags,
                tooltip: "Shop Categories",
                items: [
                    { title: "Create Shop Category", url: "/shop-categories/create", icon: Plus },
                    { title: "Manage Shop Categories", url: "/shop-categories/manage", icon: Settings2 }
                ]
            },
            {
                title: "Shop Sub-Categories",
                icon: Tags,
                tooltip: "Shop Sub-Categories",
                items: [
                    { title: "Create Sub-Category", url: "/shop-sub-categories/create", icon: Plus },
                    { title: "Manage Sub-Categories", url: "/shop-sub-categories/manage", icon: List }
                ]
            }
        ]
    },
    {
        title: "Payment Methods",
        roles: AdminRole.ADMIN,
        items: [
            { title: "Create Payment Method", url: "/payment-methods/create", icon: Plus, tooltip: "Create Payment Method" },
            { title: "Manage PaymentMethods", url: "/payment-methods/manage", icon: Settings2, tooltip: "Manage Payment Methods" } // Matches Manage PaymentMethods literal string in original
        ]
    },
    {
        title: "Shop Payment Types",
        roles: AdminRole.ADMIN,
        items: [
            { title: "Create Payment Type", url: "/shop-payment-types/create", icon: Plus, tooltip: "Create Shop Payment Type" },
            { title: "Manage PaymentTypes", url: "/shop-payment-types/manage", icon: Settings2, tooltip: "Manage Shop Payment Types" }
        ]
    },
    {
        title: "News",
        roles: AdminRole.ADMIN,
        items: [
            { title: "Create News", url: "/news/create", icon: Plus, tooltip: "Create News" },
            { title: "Manage News", url: "/news/manage", icon: Newspaper, tooltip: "Manage News" }
        ]
    },
    {
        title: "Menu Category & Tag Type",
        roles: AdminRole.ADMIN_SETUP,
        items: [
            {
                title: "Master Menu Categories",
                icon: Tags,
                tooltip: "Master Menu Categories",
                items: [
                    { title: "Create Master Category", url: "/master-menu-categories/create", icon: Plus },
                    { title: "Manage Master Categories", url: "/master-menu-categories/manage", icon: List }
                ]
            },
            {
                title: "Menu Category",
                icon: Tags,
                tooltip: "Menu Category",
                items: [
                    { title: "Create Menu Category", url: "/categories/create", icon: Plus },
                    { title: "Manage Menu Categories", url: "/categories/manage", icon: Settings2 }
                ]
            },

            {
                title: "Item Discovery Tags",
                icon: Tags,
                tooltip: "Item Discovery Tags",
                items: [
                    { title: "Create Item Tag", url: "/item-tags/create", icon: Plus },
                    { title: "Manage Item Tags", url: "/item-tags/manage", icon: List }
                ]
            },
        ]
    },
    {
        title: "Visa",
        roles: AdminRole.ADMIN_SETUP,
        items: [
            {
                title: "Visa Category",
                icon: FileText,
                tooltip: "Visa category groups (Short-Term, Long-Term, etc.)",
                items: [
                    { title: "Create Category", url: "/visa/categories/create", icon: Plus },
                    { title: "Manage Categories", url: "/visa/categories/manage", icon: List },
                ],
            },
            {
                title: "Visa",
                icon: FileText,
                tooltip: "Thailand visa types & immigration services",
                items: [
                    { title: "Create Visa", url: "/visa/create", icon: Plus },
                    { title: "Manage Visas", url: "/visa/manage", icon: List },
                ],
            },
        ]
    },
    {
        title: "Places",
        roles: AdminRole.ADMIN,
        items: [
            {
                title: "Places",
                icon: MapPin,
                tooltip: "Points of interest for the mobile app",
                items: [
                    { title: "Create Place", url: "/places/create", icon: Plus },
                    { title: "Manage Places", url: "/places/manage", icon: List },
                ],
            },
        ],
    },
    {
        title: "Review & Moderation",
        roles: AdminRole.ADMIN_OPS,
        items: [
            { title: "Content Moderation", url: "/moderation/content", icon: ShieldAlert, tooltip: "Content Moderation" },
            { title: "User/Shop Reports", url: "/moderation/user-shop", icon: ShieldAlert, tooltip: "User/Shop Reports" },
            { title: "Review Moderation", url: "/review/reviews", icon: ClipboardList, tooltip: "Reviews" }
        ]
    },
    {
        title: "Shop Feedback",
        roles: AdminRole.ADMIN,
        items: [
            {
                title: "Shop Feedback",
                url: "/shop-feedback/manage",
                icon: MessageSquare,
                tooltip: "Shop Feedback from shop admins",
            },
        ],
    },
    {
        title: "Community",
        roles: AdminRole.ADMIN_SETUP,
        items: [
            { title: "Posts & Comments", url: "/community/posts", icon: List, tooltip: "Posts & Comments" },
            { title: "Lost & Found", url: "/lostfound", icon: Package, tooltip: "Lost & Found" }
        ]
    },
    {
        title: "Marketing & Comms",
        roles: [AdminRole.ADMIN, AdminRole.ADMIN_SETUP],
        items: [
            { title: "Banners & Featured", url: "/marketing/banners", icon: ImageIcon, tooltip: "Banners", roles: AdminRole.ADMIN },
            { title: "Background Themes", url: "/background-themes/manage", icon: ImageIcon, tooltip: "Background Themes", roles: AdminRole.ADMIN },
            { title: "Promotions", url: "/promotions/manage", icon: TicketPercent, tooltip: "Promotions", roles: AdminRole.ADMIN },
            { title: "Home Discount Sections", url: "/home-discount-sections/manage", icon: TicketPercent, tooltip: "Home discount carousel config", roles: AdminRole.ADMIN_SETUP },
            { title: "Push Broadcast", url: "/marketing/broadcast", icon: Megaphone, tooltip: "Broadcast", roles: AdminRole.ADMIN_SETUP }
        ]
    },
    {
        title: "Users",
        roles: AdminRole.ADMIN_OPS,
        items: [
            { title: "Manage Users", url: "/users/manage", icon: Users, tooltip: "Manage Users" }
        ]
    },
    {
        title: "Cuisines",
        roles: AdminRole.ADMIN_SETUP,
        items: [
            { title: "Create Cuisine", url: "/cuisines/create", icon: Plus, tooltip: "Create Cuisine" },
            { title: "Manage Cuisines", url: "/cuisines/manage", icon: List, tooltip: "Manage Cuisines" }
        ]
    },
    {
        title: "Location",
        roles: AdminRole.ADMIN_SETUP,
        items: [
            {
                title: "Region",
                icon: MapPin,
                tooltip: "Region",
                items: [
                    { title: "Create Region", url: "/regions/create", icon: Plus },
                    { title: "Manage Regions", url: "/regions/manage", icon: List }
                ]
            },
            {
                title: "City",
                icon: Building2,
                tooltip: "City",
                items: [
                    { title: "Create City", url: "/cities/create", icon: Plus },
                    { title: "Manage Cities", url: "/cities/manage", icon: List }
                ]
            },
            {
                title: "District",
                icon: MapPin,
                tooltip: "District",
                items: [
                    { title: "Create District", url: "/districts/create", icon: Plus },
                    { title: "Manage Districts", url: "/districts/manage", icon: List }
                ]
            }
        ]
    },
    {
        title: "Data Import",
        roles: AdminRole.ADMIN,
        items: [
            { title: "Import Single Shop (Excel)", url: "/import/single-shop-excel", icon: FileSpreadsheet, tooltip: "Excel onboarding API (dry run + create shop)" },
        ]
    },
    {
        title: "Administration",
        items: [
            { title: "System Audit Logs", url: "/system/audit-logs", icon: ClipboardList, tooltip: "Audit Logs", roles: AdminRole.ADMIN },
            { title: "Order Timeouts", url: "/system/order-timeouts", icon: Timer, tooltip: "Order Timeouts", roles: AdminRole.ADMIN_FINANCE },
            { title: "Onboarding Screens", url: "/system/onboarding", icon: Presentation, tooltip: "Onboarding", roles: AdminRole.ADMIN_SETUP },
            { title: "Configurations", url: "/system/configs", icon: Settings2, tooltip: "Configurations", roles: AdminRole.ADMIN_SETUP },
            { title: "Feature Flags", url: "/system/feature-flags", icon: Flag, tooltip: "Feature Flags", roles: AdminRole.ADMIN_SETUP },
            { title: "App Content", url: "/system/app-content", icon: FileText, tooltip: "App Content", roles: AdminRole.ADMIN_SETUP },
            { title: "App Versions", url: "/system/app-versions", icon: Smartphone, tooltip: "App Versions", roles: AdminRole.ADMIN_SETUP },
            { title: "Admin Profile", url: "/admin/profile", icon: User, tooltip: "Admin Profile" },
            { title: "Settings", url: "#", icon: Settings, tooltip: "Settings", roles: AdminRole.ADMIN }
        ]
    }
];
