import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AppLayout from "@/layouts/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import { authService } from "@/services/authService";
import { ProtectedRoute } from "@/middleware/authMiddleware";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ManageUsers from "@/pages/users/ManageUsers";
import ManageShopRestaurant from "@/pages/shops/ManageShopRestaurant";
import CreateShopRestaurant from "@/pages/shops/CreateShopRestaurant";
import ShopsExcelImport from "@/pages/import/ShopsExcelImport";
import CreateCategory from "@/pages/categories/CreateCategory";
import ManageCategories from "@/pages/categories/ManageCategories";
import ManageMenuItems from "@/pages/menus/ManageMenuItems";
import CreateMenuItem from "@/pages/menus/CreateMenuItem";
import CreateSubCategory from "@/pages/sub-categories/CreateSubCategory";
import ManageSubCategories from "@/pages/sub-categories/ManageSubCategories";
import AdminProfile from "@/pages/AdminProfile";
import { ExcelImportProvider } from "@/context/ExcelImportContext";

// New pages
import AnalyticalDashboard from "@/pages/analytics/AnalyticalDashboard";
import OrderBoard from "@/pages/orders/OrderBoard";
import OrderHistory from "@/pages/orders/OrderHistory";
import ContentReports from "@/pages/moderation/ContentReports";
import UserShopReports from "@/pages/moderation/UserShopReports";
import BannerManagement from "@/pages/marketing/BannerManagement";

// Phase 5 & 6 pages
import Reviews from "@/pages/safety/Reviews";
import CommunityMgt from "@/pages/community/CommunityMgt";
import LostFound from "@/pages/community/LostFound";
import Broadcast from "@/pages/marketing/Broadcast";
import AuditLogs from "@/pages/system/AuditLogs";

function PublicOnlyRoute() {
  if (authService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function LegacyRedirect({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
}

function App() {
  return (
    <ExcelImportProvider>
      <Toaster />
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Legacy redirects */}
        <Route path="/manage-users" element={<LegacyRedirect to="/users/manage" />} />
        <Route path="/manage-shops" element={<LegacyRedirect to="/shops/manage" />} />
        <Route path="/create-shop" element={<LegacyRedirect to="/shops/create" />} />

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          {/* Core */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/profile" element={<AdminProfile />} />

          {/* Analytics */}
          <Route path="/analytics" element={<AnalyticalDashboard />} />

          {/* Users */}
          <Route path="/users/manage" element={<ManageUsers />} />

          {/* Shops */}
          <Route path="/shops/manage" element={<ManageShopRestaurant />} />
          <Route path="/shops/create" element={<CreateShopRestaurant />} />
          <Route path="/import/shops-excel" element={<ShopsExcelImport />} />

          {/* Categories */}
          <Route path="/categories/create" element={<CreateCategory />} />
          <Route path="/categories/manage" element={<ManageCategories />} />

          {/* Menu Items */}
          <Route path="/menus/items/manage" element={<ManageMenuItems />} />
          <Route path="/menus/items/create" element={<CreateMenuItem />} />

          {/* Sub Categories */}
          <Route path="/menus/sub-categories/create" element={<CreateSubCategory />} />
          <Route path="/menus/sub-categories/manage" element={<ManageSubCategories />} />

          {/* Orders */}
          <Route path="/orders/board" element={<OrderBoard />} />
          <Route path="/orders/history" element={<OrderHistory />} />

          {/* Moderation & Safety */}
          <Route path="/moderation/content" element={<ContentReports />} />
          <Route path="/moderation/user-shop" element={<UserShopReports />} />
          <Route path="/safety/reviews" element={<Reviews />} />

          {/* Community */}
          <Route path="/community/posts" element={<CommunityMgt />} />
          <Route path="/community/lost-found" element={<LostFound />} />

          {/* Marketing */}
          <Route path="/marketing/banners" element={<BannerManagement />} />
          <Route path="/marketing/broadcast" element={<Broadcast />} />

          {/* System */}
          <Route path="/system/audit-logs" element={<AuditLogs />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ExcelImportProvider>
  );
}

export default App;
