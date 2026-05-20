import { useSearchParams } from "react-router-dom";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ImageIcon, Megaphone, Star } from "lucide-react";
import { BannersTab } from "@/components/marketing/banners/BannersTab";
import { FeaturedShopsTab } from "@/components/marketing/featured/FeaturedShopsTab";

type TabValue = "banners" | "featured";

function isTabValue(value: string | null): value is TabValue {
  return value === "banners" || value === "featured";
}

export default function BannerManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabValue = isTabValue(tabParam) ? tabParam : "banners";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Megaphone className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold md:text-2xl">Marketing</h1>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="banners" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Banners
          </TabsTrigger>
          <TabsTrigger value="featured" className="flex items-center gap-2">
            <Star className="h-4 w-4" /> Featured Shops
          </TabsTrigger>
        </TabsList>

        {activeTab === "banners" ? (
          <BannersTab />
        ) : (
          <FeaturedShopsTab enabled={activeTab === "featured"} />
        )}
      </Tabs>
    </div>
  );
}
