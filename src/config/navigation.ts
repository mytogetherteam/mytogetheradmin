import {
    Wallet,
    Receipt,
    LayoutDashboard,
    UtensilsCrossed,
    Tags,
    FileSpreadsheet,
    User,
    Users,
    Shield,
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
    Truck,
    Smartphone,
    FileText,
    Presentation,
    Flag,
    TicketPercent,
    MessageSquare,
    Layers,
    Zap,
    Newspaper,
    Bike,
    MonitorSmartphone,
    ShoppingBag,
    Star,
    Share2,
    Smile,
    Gift,
    Languages,
    PhoneCall,
    Store,
    CreditCard,
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
    // ── 1. Overview ────────────────────────────────────────────────────────────
    {
        items: [
            { title: "Dashboard", url: "/", icon: LayoutDashboard, tooltip: "Dashboard" },
            {
                title: "Analytics",
                icon: BarChart2,
                tooltip: "Analytics & Reports",
                roles: AdminRole.ADMIN_FINANCE,
                items: [
                    { title: "Analytics", url: "/analytics", icon: BarChart2, roles: AdminRole.ADMIN_FINANCE },
                    { title: "Reports", url: "/analytics/reports", icon: FileSpreadsheet, roles: AdminRole.ADMIN_FINANCE },
                ],
            }
        ]
    },

    // ── 2. Daily Operations ────────────────────────────────────────────────────
    {
        title: "Operations",
        items: [
            {
                title: "Orders",
                icon: ClipboardList,
                tooltip: "Orders Management",
                roles: [AdminRole.ADMIN, AdminRole.ADMIN_FINANCE],
                items: [
                    { title: "Live Order Board", url: "/orders/board", icon: ClipboardList, roles: AdminRole.ADMIN },
                    { title: "Order History", url: "/orders/history", icon: History, roles: AdminRole.ADMIN_FINANCE },
                    { title: "Delivery Range", url: "/orders/delivery-range", icon: MapPin, roles: AdminRole.ADMIN }
                ]
            },
            { title: "Admin Approvals", url: "/menus/approvals", icon: ClipboardCheck, tooltip: "Shop, Menu & Payment Approvals", roles: AdminRole.ADMIN_OPS },
            { title: "Manage Users", url: "/users/manage", icon: Users, tooltip: "Manage Platform Users", roles: AdminRole.ADMIN_OPS },
            { title: "Delivery Drivers", url: "/delivery-drivers/manage", icon: Bike, tooltip: "Shop Delivery Drivers", roles: AdminRole.ADMIN }
        ]
    },

    // ── 3. Shops & Menus ───────────────────────────────────────────────────────
    {
        title: "Shops & Menus",
        roles: AdminRole.ADMIN_OPS,
        items: [
            {
                title: "Shops / Restaurants",
                icon: Store,
                tooltip: "Shop & Restaurant Management",
                items: [
                    { title: "Manage Shops", url: "/shops/manage", icon: Settings2 },
                    { title: "Create Shop", url: "/shops/create", icon: Plus },
                    { title: "Operating Hours", url: "/shops/operating-hours", icon: Clock },
                    { title: "Free Delivery", url: "/shops/free-delivery", icon: Truck, roles: AdminRole.ADMIN }
                ]
            },
            {
                title: "Menu Items",
                icon: UtensilsCrossed,
                tooltip: "Menu Items Management",
                items: [
                    { title: "Manage Menu Items", url: "/menus/items/manage", icon: List },
                    { title: "Create Menu Item", url: "/menus/items/create", icon: Plus }
                ]
            }
        ]
    },

    // ── 4. Marketing & Promotions ──────────────────────────────────────────────
    {
        title: "Marketing & Promotions",
        items: [
            {
                title: "Banners & Media",
                icon: ImageIcon,
                tooltip: "Banners, Splash & Themes",
                roles: AdminRole.ADMIN,
                items: [
                    { title: "Main Banners", url: "/marketing/banners?tab=banners", icon: ImageIcon },
                    { title: "Order Waiting", url: "/marketing/banners?tab=order", icon: ShoppingBag },
                    { title: "Splash Screens", url: "/marketing/banners?tab=splash", icon: Smartphone },
                    { title: "Featured Shops", url: "/marketing/banners?tab=featured", icon: Star },
                    { title: "Background Themes", url: "/background-themes/manage", icon: ImageIcon }
                ]
            },
            {
                title: "Campaigns & Discounts",
                icon: TicketPercent,
                tooltip: "Discounts, Flash Events & Coupons",
                items: [
                    { title: "Promotions", url: "/promotions/manage", icon: TicketPercent, roles: AdminRole.ADMIN },
                    { title: "Flash Events", url: "/flash-events/manage", icon: Zap, roles: AdminRole.ADMIN },
                    { title: "Collections", url: "/collections/manage", icon: Layers, roles: AdminRole.ADMIN },
                    { title: "Shop Coupons", url: "/shop-coupons/manage", icon: TicketPercent, roles: AdminRole.ADMIN },
                    { title: "Home Discount Sections", url: "/home-discount-sections/manage", icon: TicketPercent, roles: AdminRole.ADMIN_SETUP }
                ]
            },
            { title: "Referrals & Promo Codes", url: "/referrals/manage", icon: Gift, tooltip: "Referral & Promo Codes", roles: AdminRole.ADMIN },
            { title: "Push Broadcast", url: "/marketing/broadcast", icon: Megaphone, tooltip: "Push Notifications Broadcast", roles: AdminRole.ADMIN_SETUP }
        ]
    },

    // ── 5. Finance & Subscriptions ─────────────────────────────────────────────
    {
        title: "Finance & Subscriptions",
        roles: AdminRole.ADMIN,
        items: [
            {
                title: "Subscription Plans",
                icon: Package,
                tooltip: "Shop Subscription Plans",
                items: [
                    { title: "Manage Plans", url: "/plans/manage", icon: Settings2 },
                    { title: "Create Plan", url: "/plans/create", icon: Plus },
                    { title: "Manage Features", url: "/plan-features/manage", icon: List },
                    { title: "Create Feature", url: "/plan-features/create", icon: Plus },
                    { title: "Shop Subscriptions", url: "/subscriptions/manage", icon: Receipt }
                ]
            },
            {
                title: "Payment Accounts",
                icon: Wallet,
                tooltip: "Platform Accounts for Shop Plan Payments",
                items: [
                    { title: "Manage Accounts", url: "/platform-payment-accounts/manage", icon: List },
                    { title: "Add Account", url: "/platform-payment-accounts/create", icon: Plus }
                ]
            },
            {
                title: "Payment Methods",
                icon: CreditCard,
                tooltip: "Payment Methods & Shop Payment Types",
                items: [
                    { title: "Payment Methods", url: "/payment/methods", icon: Settings2 },
                    { title: "Create Payment Method", url: "/payment/methods/create", icon: Plus },
                    { title: "Shop Payment Types", url: "/shop-payment-types/manage", icon: Settings2 },
                    { title: "Create Payment Type", url: "/shop-payment-types/create", icon: Plus }
                ]
            }
        ]
    },

    // ── 6. Community & Content ─────────────────────────────────────────────────
    {
        title: "Community & Content",
        items: [
            {
                title: "Social Media",
                icon: Share2,
                tooltip: "Social Media Feed & Posts",
                roles: AdminRole.ADMIN_SETUP,
                items: [
                    { title: "Posts & Feed", url: "/social-media/posts", icon: Share2 },
                    { title: "Create Post", url: "/social-media/posts/create", icon: Plus },
                    { title: "Reactions", url: "/social-media/reactions", icon: Smile, roles: AdminRole.ADMIN }
                ]
            },
            {
                title: "Community",
                icon: Users,
                tooltip: "Community Forum & Lost & Found",
                roles: AdminRole.ADMIN_SETUP,
                items: [
                    { title: "Community Posts", url: "/community/posts", icon: FileText },
                    { title: "Comment Board", url: "/community/comments", icon: MessageSquare },
                    { title: "Lost & Found", url: "/lostfound", icon: Package }
                ]
            },
            {
                title: "Places & Activities",
                icon: MapPin,
                tooltip: "Points of Interest & Places",
                roles: AdminRole.ADMIN,
                items: [
                    { title: "Manage Places", url: "/places/manage", icon: List },
                    { title: "Create Place", url: "/places/create", icon: Plus }
                ]
            },
            {
                title: "News",
                icon: Newspaper,
                tooltip: "Platform News & Announcements",
                roles: AdminRole.ADMIN,
                items: [
                    { title: "Manage News", url: "/news/manage", icon: List },
                    { title: "Create News", url: "/news/create", icon: Plus }
                ]
            },
            {
                title: "Visa Services",
                icon: FileText,
                tooltip: "Visa Types & Categories",
                roles: AdminRole.ADMIN_SETUP,
                items: [
                    { title: "Manage Visas", url: "/visa/manage", icon: List },
                    { title: "Create Visa", url: "/visa/create", icon: Plus },
                    { title: "Visa Categories", url: "/visa/categories/manage", icon: List },
                    { title: "Create Category", url: "/visa/categories/create", icon: Plus }
                ]
            }
        ]
    },

    // ── 7. Moderation & Feedback ───────────────────────────────────────────────
    {
        title: "Moderation & Feedback",
        items: [
            {
                title: "Moderation",
                icon: ShieldAlert,
                tooltip: "Content & User Reports",
                roles: AdminRole.ADMIN_OPS,
                items: [
                    { title: "Content Moderation", url: "/moderation/content", icon: ShieldAlert },
                    { title: "User/Shop Reports", url: "/moderation/user-shop", icon: ShieldAlert },
                    { title: "Review Moderation", url: "/review/reviews", icon: ClipboardList }
                ]
            },
            { title: "Shop Feedback", url: "/shop-feedback/manage", icon: MessageSquare, tooltip: "Shop Feedback from Owners", roles: AdminRole.ADMIN }
        ]
    },

    // ── 8. Master Data & Setup ─────────────────────────────────────────────────
    {
        title: "Master Data & Setup",
        items: [
            {
                title: "Shop Categories",
                icon: Tags,
                tooltip: "Shop Categories & Sub-Categories",
                roles: AdminRole.ADMIN_SETUP,
                items: [
                    { title: "Manage Categories", url: "/shop-categories/manage", icon: Settings2 },
                    { title: "Create Category", url: "/shop-categories/create", icon: Plus },
                    { title: "Manage Sub-Categories", url: "/shop-sub-categories/manage", icon: List },
                    { title: "Create Sub-Category", url: "/shop-sub-categories/create", icon: Plus }
                ]
            },
            {
                title: "Menu Categories & Tags",
                icon: Tags,
                tooltip: "Master Categories, Categories & Item Tags",
                roles: AdminRole.ADMIN_SETUP,
                items: [
                    { title: "Master Categories", url: "/master-menu-categories/manage", icon: List },
                    { title: "Create Master Category", url: "/master-menu-categories/create", icon: Plus },
                    { title: "Menu Categories", url: "/categories/manage", icon: Settings2 },
                    { title: "Create Menu Category", url: "/categories/create", icon: Plus },
                    { title: "Item Discovery Tags", url: "/item-tags/manage", icon: List },
                    { title: "Create Item Tag", url: "/item-tags/create", icon: Plus }
                ]
            },
            {
                title: "Cuisines",
                icon: UtensilsCrossed,
                tooltip: "Cuisine Types",
                roles: AdminRole.ADMIN_SETUP,
                items: [
                    { title: "Manage Cuisines", url: "/cuisines/manage", icon: List },
                    { title: "Create Cuisine", url: "/cuisines/create", icon: Plus }
                ]
            },
            {
                title: "Locations",
                icon: MapPin,
                tooltip: "Regions, Cities & Districts",
                roles: AdminRole.ADMIN_SETUP,
                items: [
                    { title: "Manage Regions", url: "/regions/manage", icon: List },
                    { title: "Create Region", url: "/regions/create", icon: Plus },
                    { title: "Manage Cities", url: "/cities/manage", icon: Building2 },
                    { title: "Create City", url: "/cities/create", icon: Plus },
                    { title: "Manage Districts", url: "/districts/manage", icon: MapPin },
                    { title: "Create District", url: "/districts/create", icon: Plus }
                ]
            },
            {
                title: "Data Import (Excel)",
                icon: FileSpreadsheet,
                tooltip: "Excel Import Tools",
                roles: AdminRole.ADMIN,
                items: [
                    { title: "Single Shop Import", url: "/import/single-shop-excel", icon: FileSpreadsheet },
                    { title: "Bulk Shops Import", url: "/import/shops-excel", icon: FileSpreadsheet },
                    { title: "Activity Import", url: "/import/activity-excel", icon: FileSpreadsheet }
                ]
            }
        ]
    },

    // ── 9. System & Administration ─────────────────────────────────────────────
    {
        title: "System & Administration",
        items: [
            {
                title: "Admin Management",
                icon: Shield,
                tooltip: "Admin Accounts & Permissions",
                roles: AdminRole.ADMIN,
                items: [
                    { title: "Manage Admins", url: "/admins/manage", icon: List },
                    { title: "Create Admin", url: "/admins/create", icon: Plus },
                    { title: "Marketing Access", url: "/admins/marketing-access", icon: Shield }
                ]
            },
            {
                title: "Security & Logs",
                icon: ShieldAlert,
                tooltip: "Audit Logs & Active Sessions",
                roles: AdminRole.ADMIN,
                items: [
                    { title: "System Audit Logs", url: "/system/audit-logs", icon: ClipboardList },
                    { title: "Active Sessions", url: "/system/sessions", icon: MonitorSmartphone },
                    { title: "System Health", url: "/system/health", icon: Zap }
                ]
            },
            {
                title: "Platform Settings",
                icon: Settings2,
                tooltip: "Configurations, Languages, Timeouts & Flags",
                items: [
                    { title: "Configurations", url: "/system/configs", icon: Settings2, roles: AdminRole.ADMIN_SETUP },
                    { title: "Feature Flags", url: "/system/feature-flags", icon: Flag, roles: AdminRole.ADMIN_SETUP },
                    { title: "Order Timeouts", url: "/system/order-timeouts", icon: Timer, roles: AdminRole.ADMIN_FINANCE },
                    { title: "App Language", url: "/system/language", icon: Languages, roles: AdminRole.ADMIN },
                    { title: "Twilio Order Calls", url: "/system/twilio", icon: PhoneCall, roles: AdminRole.ADMIN },
                    { title: "Onboarding Screens", url: "/system/onboarding", icon: Presentation, roles: AdminRole.ADMIN_SETUP },
                    { title: "App Content", url: "/system/app-content", icon: FileText, roles: AdminRole.ADMIN_SETUP },
                    { title: "App Versions", url: "/system/app-versions", icon: Smartphone, roles: AdminRole.ADMIN_SETUP }
                ]
            },
            { title: "Admin Profile", url: "/admin/profile", icon: User, tooltip: "Admin Profile" }
        ]
    }
];
