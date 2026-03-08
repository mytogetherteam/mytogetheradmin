import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AppLayout from "@/layouts/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import { authService } from "@/services/authService";
import { ProtectedRoute } from "@/middleware/authMiddleware";
import Login from "@/pages/auth/Login";
import ManageUsers from "@/pages/users/ManageUsers";
import UserDetail from "./pages/users/UserDetail";
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
import PaymentMethods from "@/pages/payment/PaymentMethods";
import PaymentMethodForm from "@/pages/payment/PaymentMethodForm";
import ManageShopCategories from "@/pages/shop-categories/ManageShopCategories";
import CreateShopCategory from "@/pages/shop-categories/CreateShopCategory";
import ManageShopSubCategories from "@/pages/shop-sub-categories/ManageShopSubCategories";
import CreateShopSubCategory from "@/pages/shop-sub-categories/CreateShopSubCategory";
import ManageShopPaymentTypes from "@/pages/shop-payment-types/ManageShopPaymentTypes";
import CreateShopPaymentType from "@/pages/shop-payment-types/CreateShopPaymentType";

// New pages
import AnalyticalDashboard from "@/pages/analytics/AnalyticalDashboard";
import OrderBoard from "@/pages/orders/OrderBoard";
import OrderHistory from "@/pages/orders/OrderHistory";
import OrderDetail from "@/pages/orders/OrderDetail"; // Added this import
import ContentReports from "@/pages/moderation/ContentReports";
import UserShopReports from "@/pages/moderation/UserShopReports";
import BannerManagement from "@/pages/marketing/BannerManagement";

// Phase 5 & 6 pages
import Reviews from "@/pages/review/Reviews";
import ReviewDetail from "@/pages/review/ReviewDetail";
import CommunityMgt from "@/pages/community/CommunityMgt";
import LostFound from "@/pages/lostfound/LostFound";
import Broadcast from "@/pages/marketing/Broadcast";
import AuditLogs from "@/pages/system/AuditLogs";
import VettingQueue from "@/pages/shops/VettingQueue";
import CommentBoard from "@/pages/community/CommentBoard";

// New Rider & Profile pages
import ManageRiders from "@/pages/shops/ManageRiders";
import CreateRider from "@/pages/shops/CreateRider";
import ShopProfileSettings from "@/pages/shops/ShopProfileSettings";
import ShopOperatingHours from "@/pages/shops/ShopOperatingHours";

// City & District Management
import ManageCities from "@/pages/cities/ManageCities";
import CreateCity from "@/pages/cities/CreateCity";
import ManageDistricts from "@/pages/districts/ManageDistricts";
import CreateDistrict from "@/pages/districts/CreateDistrict";
import ManageCuisines from "@/pages/cuisines/ManageCuisines";
import CuisineForm from "@/pages/cuisines/CuisineForm";

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
          <Route path="/users/:id" element={<UserDetail />} />

          {/* Shops */}
          <Route path="/shops/manage" element={<ManageShopRestaurant />} />
          <Route path="/shops/create" element={<CreateShopRestaurant />} />
          <Route path="/shops/riders/manage" element={<ManageRiders />} />
          <Route path="/shops/riders/create" element={<CreateRider />} />
          <Route path="/shops/profile/settings" element={<ShopProfileSettings />} />
          <Route path="/shops/operating-hours" element={<ShopOperatingHours />} />
          <Route path="/import/shops-excel" element={<ShopsExcelImport />} />

          {/* Categories */}
          <Route path="/categories/create" element={<CreateCategory />} />
          <Route path="/categories/manage" element={<ManageCategories />} />

          {/* Shop Categories */}
          <Route path="/shop-categories/manage" element={<ManageShopCategories />} />
          <Route path="/shop-categories/create" element={<CreateShopCategory />} />

          {/* Shop Sub Categories */}
          <Route path="/shop-sub-categories/manage" element={<ManageShopSubCategories />} />
          <Route path="/shop-sub-categories/create" element={<CreateShopSubCategory />} />
          <Route path="/shop-sub-categories/edit/:subId" element={<CreateShopSubCategory />} />

          {/* Shop Payment Types */}
          <Route path="/shop-payment-types/manage" element={<ManageShopPaymentTypes />} />
          <Route path="/shop-payment-types/create" element={<CreateShopPaymentType />} />
          <Route path="/shop-payment-types/edit/:shopId/:id" element={<CreateShopPaymentType />} />

          {/* Menu Items */}
          <Route path="/menus/items/manage" element={<ManageMenuItems />} />
          <Route path="/menus/items/create" element={<CreateMenuItem />} />

          {/* Sub Categories */}
          <Route path="/menus/sub-categories/create" element={<CreateSubCategory />} />
          <Route path="/menus/sub-categories/manage" element={<ManageSubCategories />} />

          {/* Orders */}
          <Route path="/orders">
            <Route path="board" element={<OrderBoard />} />
            <Route path="history" element={<OrderHistory />} />
            <Route path=":id" element={<OrderDetail />} />
          </Route>

          {/* Moderation & Review */}
          <Route path="/moderation/content" element={<ContentReports />} />
          <Route path="/moderation/user-shop" element={<UserShopReports />} />
          <Route path="/review/reviews" element={<Reviews />} />
          <Route path="/review/:type/:id" element={<ReviewDetail />} />

          {/* Shops - Vetting */}
          <Route path="/shops/vetting" element={<VettingQueue />} />

          {/* Community */}
          <Route path="/community/posts" element={<CommunityMgt />} />
          <Route path="/community/comments" element={<CommentBoard />} />
          <Route path="/lostfound" element={<LostFound />} />

          {/* Marketing */}
          <Route path="/marketing/banners" element={<BannerManagement />} />
          <Route path="/marketing/broadcast" element={<Broadcast />} />

          {/* System */}
          <Route path="/system/audit-logs" element={<AuditLogs />} />

          {/* Cities */}
          <Route path="/cities/manage" element={<ManageCities />} />
          <Route path="/cities/create" element={<CreateCity />} />
          <Route path="/cities/edit/:id" element={<CreateCity />} />

          {/* Districts */}
          <Route path="/districts/manage" element={<ManageDistricts />} />
          <Route path="/districts/create" element={<CreateDistrict />} />
          <Route path="/districts/edit/:id" element={<CreateDistrict />} />

          {/* Cuisines */}
          <Route path="/cuisines/manage" element={<ManageCuisines />} />
          <Route path="/cuisines/create" element={<CuisineForm />} />
          <Route path="/cuisines/edit/:id" element={<CuisineForm />} />

          {/* Payment */}
          <Route path="/payment/methods" element={<PaymentMethods />} />
          <Route path="/payment/methods/create" element={<PaymentMethodForm />} />
          <Route path="/payment/methods/edit/:id" element={<PaymentMethodForm />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ExcelImportProvider>
  );
}

export default App;
