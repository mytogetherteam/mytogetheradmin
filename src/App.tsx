import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AppLayout from "@/layouts/AppLayout";
import { authService } from "@/services/authService";
import { ProtectedRoute } from "@/middleware/authMiddleware";
import { ExcelImportProvider } from "@/context/ExcelImportContext";

// ─── Eager (tiny, always needed) ────────────────────────────────────────────
import Login from "@/pages/auth/Login";

// ─── Lazy Pages ─────────────────────────────────────────────────────────────
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Profile = lazy(() => import("@/pages/Profile"));
const AdminProfile = lazy(() => import("@/pages/AdminProfile"));

// Users
const ManageUsers = lazy(() => import("@/pages/users/ManageUsers"));
const UserDetail = lazy(() => import("@/pages/users/UserDetail"));

// Shops
const ManageShopRestaurant = lazy(() => import("@/pages/shops/ManageShopRestaurant"));
const CreateShopRestaurant = lazy(() => import("@/pages/shops/CreateShopRestaurant"));
const VettingQueue = lazy(() => import("@/pages/shops/VettingQueue"));
const ManageRiders = lazy(() => import("@/pages/shops/ManageRiders"));
const CreateRider = lazy(() => import("@/pages/shops/CreateRider"));
const ShopProfileSettings = lazy(() => import("@/pages/shops/ShopProfileSettings"));
const ShopOperatingHours = lazy(() => import("@/pages/shops/ShopOperatingHours"));

// Import
const ShopsExcelImport = lazy(() => import("@/pages/import/ShopsExcelImport"));

// Categories
const CreateCategory = lazy(() => import("@/pages/categories/CreateCategory"));
const ManageCategories = lazy(() => import("@/pages/categories/ManageCategories"));
const ManageShopCategories = lazy(() => import("@/pages/shop-categories/ManageShopCategories"));
const CreateShopCategory = lazy(() => import("@/pages/shop-categories/CreateShopCategory"));
const ManageShopSubCategories = lazy(() => import("@/pages/shop-sub-categories/ManageShopSubCategories"));
const CreateShopSubCategory = lazy(() => import("@/pages/shop-sub-categories/CreateShopSubCategory"));

// Menu
const ManageMenuItems = lazy(() => import("@/pages/menus/ManageMenuItems"));
const CreateMenuItem = lazy(() => import("@/pages/menus/CreateMenuItem"));
const CreateSubCategory = lazy(() => import("@/pages/sub-categories/CreateSubCategory"));
const ManageSubCategories = lazy(() => import("@/pages/sub-categories/ManageSubCategories"));

// Orders
const OrderBoard = lazy(() => import("@/pages/orders/OrderBoard"));
const OrderHistory = lazy(() => import("@/pages/orders/OrderHistory"));
const OrderDetail = lazy(() => import("@/pages/orders/OrderDetail"));

// Moderation & Reviews
const ContentReports = lazy(() => import("@/pages/moderation/ContentReports"));
const UserShopReports = lazy(() => import("@/pages/moderation/UserShopReports"));
const Reviews = lazy(() => import("@/pages/review/Reviews"));
const ReviewDetail = lazy(() => import("@/pages/review/ReviewDetail"));

// Community
const CommunityMgt = lazy(() => import("@/pages/community/CommunityMgt"));
const CommentBoard = lazy(() => import("@/pages/community/CommentBoard"));
const LostFound = lazy(() => import("@/pages/lostfound/LostFound"));

// Marketing
const BannerManagement = lazy(() => import("@/pages/marketing/BannerManagement"));
const Broadcast = lazy(() => import("@/pages/marketing/Broadcast"));

// Analytics
const AnalyticalDashboard = lazy(() => import("@/pages/analytics/AnalyticalDashboard"));

// System
const AuditLogs = lazy(() => import("@/pages/system/AuditLogs"));

// Payment
const PaymentMethods = lazy(() => import("@/pages/payment/PaymentMethods"));
const PaymentMethodForm = lazy(() => import("@/pages/payment/PaymentMethodForm"));
const ManageShopPaymentTypes = lazy(() => import("@/pages/shop-payment-types/ManageShopPaymentTypes"));
const CreateShopPaymentType = lazy(() => import("@/pages/shop-payment-types/CreateShopPaymentType"));

// Cities & Districts
const ManageCities = lazy(() => import("@/pages/cities/ManageCities"));
const CreateCity = lazy(() => import("@/pages/cities/CreateCity"));
const ManageDistricts = lazy(() => import("@/pages/districts/ManageDistricts"));
const CreateDistrict = lazy(() => import("@/pages/districts/CreateDistrict"));

// Cuisines
const ManageCuisines = lazy(() => import("@/pages/cuisines/ManageCuisines"));
const CuisineForm = lazy(() => import("@/pages/cuisines/CuisineForm"));

// ─── Route guards ────────────────────────────────────────────────────────────

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

// ─── App ─────────────────────────────────────────────────────────────────────

function App() {
  return (
    <ExcelImportProvider>
      <Toaster />
      <Suspense fallback={null}>
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
            <Route path="/shops/vetting" element={<VettingQueue />} />
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
      </Suspense>
    </ExcelImportProvider>
  );
}

export default App;
