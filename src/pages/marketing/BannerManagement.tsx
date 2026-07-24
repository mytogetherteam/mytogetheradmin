import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BannersTab } from "@/components/marketing/banners/BannersTab";
import { FeaturedShopsTab } from "@/components/marketing/featured/FeaturedShopsTab";
import type { BannerPosition } from "@/schemas/banner-image.schema";

type TabValue = "banners" | "order" | "splash" | "featured";
type BannerFilter = "Promotions" | "Ads";

const PAGE_COPY: Record<TabValue, { title: string; description: string }> = {
  banners: {
    title: "Banner",
    description: "Manage promo and ads banners.",
  },
  order: {
    title: "Order Waiting",
    description: "Manage order-waiting screen banners.",
  },
  splash: {
    title: "Splash",
    description: "Manage splash-screen banners.",
  },
  featured: {
    title: "Featured",
    description: "Manage featured shop placements.",
  },
};

function isTabValue(value: string | null): value is TabValue {
  return (
    value === "banners" ||
    value === "order" ||
    value === "splash" ||
    value === "featured"
  );
}

function parseBannerFilter(value: string | null): BannerFilter {
  return value === "Ads" || value === "ads" ? "Ads" : "Promotions";
}

export default function BannerManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabValue = isTabValue(tabParam) ? tabParam : "banners";
  const [bannerFilter, setBannerFilter] = useState<BannerFilter>("Promotions");

  useEffect(() => {
    if (!isTabValue(tabParam)) {
      setSearchParams({ tab: "banners", filter: "Promotions" }, { replace: true });
      setBannerFilter("Promotions");
      return;
    }

    if (activeTab !== "banners") return;

    const filterParam = searchParams.get("filter");
    const next = parseBannerFilter(filterParam);
    setBannerFilter(next);

    // Default Banner sidebar click → Promo
    if (!filterParam) {
      setSearchParams(
        { tab: "banners", filter: "Promotions" },
        { replace: true },
      );
    }
  }, [tabParam, activeTab, searchParams, setSearchParams]);

  const handleBannerFilter = (filter: BannerFilter) => {
    setBannerFilter(filter);
    setSearchParams({ tab: "banners", filter });
  };

  const positionForTab = (): BannerPosition | null => {
    if (activeTab === "order") return "Order";
    if (activeTab === "splash") return "Splash";
    if (activeTab === "banners") return bannerFilter;
    return null;
  };

  const position = positionForTab();
  const copy = PAGE_COPY[activeTab];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold md:text-2xl">{copy.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{copy.description}</p>
      </div>

      {activeTab === "banners" && (
        <div className="flex flex-wrap gap-1.5">
          {(["Promotions", "Ads"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => handleBannerFilter(filter)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                bannerFilter === filter
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {filter === "Promotions" ? "Promo" : filter}
            </button>
          ))}
        </div>
      )}

      {position !== null ? (
        <BannersTab
          position={position}
          largePreview={activeTab === "banners"}
        />
      ) : (
        <FeaturedShopsTab enabled={activeTab === "featured"} />
      )}
    </div>
  );
}
