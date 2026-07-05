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
    SidebarInput,
} from "@/components/ui/sidebar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    ChevronRight,
    Search
} from "lucide-react"

import { Link, useLocation } from "react-router-dom"
import { authService } from "@/services/authService"
import { useAuthStore } from "@/store/useAuthStore"
import { cn } from "@/lib/utils"
import { hasAccess, AdminRole } from "@/utils/rbac"
import { useState } from "react"
import { navigationConfig, NavItem } from "@/config/navigation"

export function AppSidebar() {
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState("");

    const persistedUser = useAuthStore((s) => s.user);
    const userData = persistedUser ?? authService.getUserData();
    const userRole = userData?.role;

    const canSee = (requiredRole?: AdminRole | AdminRole[]) => {
        if (!requiredRole) return true;
        return hasAccess(userRole, requiredRole);
    };

    const isActive = (path?: string) => {
        if (!path) return false;
        if (path === "/" && location.pathname !== "/") return false;
        return location.pathname === path;
    };

    const query = searchQuery.toLowerCase();

    // Helper functions for filtering
    const filterNavItems = (items: NavItem[]): NavItem[] => {
        const result: NavItem[] = [];

        for (const item of items) {
            if (!canSee(item.roles)) continue;

            // If the item itself matches
            const matchesQuery = item.title.toLowerCase().includes(query);

            // If any of its sub-items match
            const matchingSubItems = item.items?.filter(sub => {
                const subMatchesQuery = sub.title.toLowerCase().includes(query);
                return canSee(sub.roles) && subMatchesQuery;
            });

            if (matchesQuery) {
                // Return item with all its visible subitems
                const visibleSubItems = item.items?.filter(sub => canSee(sub.roles));
                result.push({ ...item, items: visibleSubItems });
            } else if (matchingSubItems && matchingSubItems.length > 0) {
                // Return item with only matching subitems
                result.push({ ...item, items: matchingSubItems });
            }
        }

        return result;
    };

    const filteredConfig = navigationConfig.map(group => {
        if (!canSee(group.roles)) return { ...group, items: [] };

        let filteredItems = filterNavItems(group.items);

        // If the group title matches the query, show all items under it
        if (query && group.title && group.title.toLowerCase().includes(query)) {
            filteredItems = group.items.filter(item => canSee(item.roles)).map(item => {
                if (item.items) {
                    return { ...item, items: item.items.filter(sub => canSee(sub.roles)) };
                }
                return item;
            });
        }

        return {
            ...group,
            items: filteredItems
        };
    }).filter(group => group.items.length > 0);

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                            <div className="flex aspect-square size-10 items-center justify-center rounded-lg">
                                <img src="/logo-mytogether.jpg" alt="myTogether" className="size-full object-contain rounded-lg" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">Admin Panel</span>
                                <span className="truncate text-xs">Management</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem className="mt-2 group-data-[collapsible=icon]:hidden">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <SidebarInput
                                placeholder="Search pages..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {filteredConfig.map((group, groupIdx) => (
                    <SidebarGroup key={groupIdx}>
                        {group.title && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
                        <SidebarMenu>
                            {group.items.map((item, itemIdx) => {
                                if (item.items && item.items.length > 0) {
                                    // Collapsible item
                                    return (
                                        <Collapsible
                                            key={(query ? 'search-' : 'normal-') + itemIdx}
                                            asChild
                                            className="group/collapsible"
                                            defaultOpen={!!query}
                                        >
                                            <SidebarMenuItem>
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton tooltip={item.tooltip || item.title}>
                                                        {item.icon && <item.icon />}
                                                        <span>{item.title}</span>
                                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {item.items.map((sub, subIdx) => (
                                                            <SidebarMenuSubItem key={subIdx}>
                                                                <SidebarMenuSubButton asChild isActive={isActive(sub.url)}>
                                                                    <Link to={sub.url}>
                                                                        {sub.icon && <sub.icon className={cn(isActive(sub.url) && "text-primary")} />}
                                                                        <span>{sub.title}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        ))}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </SidebarMenuItem>
                                        </Collapsible>
                                    );
                                }

                                // Regular item
                                return (
                                    <SidebarMenuItem key={itemIdx}>
                                        <SidebarMenuButton asChild tooltip={item.tooltip || item.title} isActive={isActive(item.url)}>
                                            <Link to={item.url || "#"}>
                                                {item.icon && <item.icon className={cn(isActive(item.url) && "text-primary")} />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}
