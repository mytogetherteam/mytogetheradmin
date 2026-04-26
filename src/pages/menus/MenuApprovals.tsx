import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuItemApprovalsTab } from "./components/MenuItemApprovalsTab";
import { PaymentApprovalsTab } from "./components/PaymentApprovalsTab";
import { CategoryApprovalsTab } from "./components/CategoryApprovalsTab";
import { UtensilsCrossed, CreditCard, LayoutList } from "lucide-react";

export default function MenuApprovals() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Approvals</h1>
                    <p className="text-muted-foreground">Review and approve changes requested by shop owners.</p>
                </div>
            </div>

            <Tabs defaultValue="menu-items" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-8">
                    <TabsTrigger value="menu-items" className="flex items-center gap-2">
                        <UtensilsCrossed className="w-4 h-4" />
                        Menu Items
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Payments
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="flex items-center gap-2">
                        <LayoutList className="w-4 h-4" />
                        Categories
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="menu-items">
                    <MenuItemApprovalsTab />
                </TabsContent>

                <TabsContent value="payments">
                    <PaymentApprovalsTab />
                </TabsContent>

                <TabsContent value="categories">
                    <CategoryApprovalsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
