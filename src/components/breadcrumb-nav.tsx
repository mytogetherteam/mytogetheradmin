import { useLocation, Link, useSearchParams } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
    "analytics": "Dashboard",
    "users": "Users",
    "manage": "Manage",
    "shops": "Shops",
    "create": "Create",
    "profile": "Profile",
    "settings": "Settings",
    "operating-hours": "Hours",
    "import": "Import",
    "shops-excel": "Excel Import",
    "categories": "Categories",
    "shop-categories": "Shop Categories",
    "shop-payment-types": "Shop Payment Types",
    "menus": "Menu",
    "items": "Items",
    "sub-categories": "Sub-Categories",
    "orders": "Orders",
    "board": "Live Board",
    "history": "History",
    "moderation": "Moderation",
    "content": "Content",
    "user-shop": "Reports",
    "review": "Review",
    "reviews": "Reviews",
    "community": "Community",
    "posts": "Posts",
    "comments": "Comments",
    "lostfound": "Lost & Found",
    "marketing": "Marketing",
    "banners": "Banners",
    "broadcast": "Broadcast",
    "system": "System",
    "audit-logs": "Audit Logs",
    "cities": "Cities",
    "districts": "Districts",
    "payment": "Payment",
    "methods": "Methods",
    "vetting": "Vetting Queue",
};

// Tab labels: maps ?tab= values to human-readable names
const tabLabels: Record<string, string> = {
    "banners": "Banners",
    "featured": "Featured Shops",
    "posts": "Posts Feed",
    "comments": "Comment Board",
    "shop-reviews": "Shop Reviews",
    "item-reviews": "Item Reviews",
    "content-reports": "Content Reports",
    "user-reports": "User Reports",
};

export function BreadcrumbNav() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const pathnames = location.pathname.split("/").filter((x) => x);
    const activeTab = searchParams.get("tab");

    if (pathnames.length === 0) return null;

    return (
        <nav className="flex items-center text-sm text-muted-foreground transition-all">
            <Link
                to="/"
                className="flex items-center hover:text-foreground transition-colors"
                title="Home"
            >
                <Home className="h-4 w-4" />
            </Link>

            {pathnames.map((value, index) => {
                const last = index === pathnames.length - 1;
                const to = `/${pathnames.slice(0, index + 1).join("/")}`;
                const label = routeLabels[value] || (value.charAt(0).toUpperCase() + value.slice(1));

                return (
                    <div key={to} className="flex items-center">
                        <ChevronRight className="h-4 w-4 mx-1.5 opacity-40 shrink-0" />
                        {last && !activeTab ? (
                            <span className="font-semibold text-foreground truncate max-w-[150px]">
                                {label}
                            </span>
                        ) : (
                            <Link
                                to={to}
                                className="hover:text-foreground transition-colors hover:underline underline-offset-4"
                            >
                                {label}
                            </Link>
                        )}
                    </div>
                );
            })}

            {/* Append active tab as the last breadcrumb segment */}
            {activeTab && tabLabels[activeTab] && (
                <div className="flex items-center">
                    <ChevronRight className="h-4 w-4 mx-1.5 opacity-40 shrink-0" />
                    <span className="font-semibold text-foreground truncate max-w-[180px]">
                        {tabLabels[activeTab]}
                    </span>
                </div>
            )}
        </nav>
    );
}
