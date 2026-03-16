import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AppLayout from "@/layouts/AppLayout";
import { authService } from "@/services/authService";
import { ProtectedRoute } from "@/middleware/authMiddleware";
import { ExcelImportProvider } from "@/context/ExcelImportContext";
import { AdminRole } from "@/utils/rbac";

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
const ShopProfileSettings = lazy(() => import("@/pages/shops/ShopProfileSettings"));
const ShopOperatingHours = lazy(() => import("@/pages/shops/ShopOperatingHours"));

// Import
const ShopsExcelImport = lazy(() => import("@/pages/import/ShopsExcelImport"));
const ActivityExcelImport = lazy(() => import("@/pages/import/ActivityExcelImport"));

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
const MenuApprovals = lazy(() => import("@/pages/menus/MenuApprovals"));

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
const PostDetailPage = lazy(() => import("@/pages/community/PostDetailPage"));
const CommentBoard = lazy(() => import("@/pages/community/CommentBoard"));
const LostFound = lazy(() => import("@/pages/lostfound/LostFound"));

// Marketing
const BannerManagement = lazy(() => import("@/pages/marketing/BannerManagement"));
const Broadcast = lazy(() => import("@/pages/marketing/Broadcast"));

// Analytics
const AnalyticalDashboard = lazy(() => import("@/pages/analytics/AnalyticalDashboard"));

// System
const AuditLogs = lazy(() => import("@/pages/system/AuditLogs"));
const OrderTimeoutManagement = lazy(() => import("@/pages/system/OrderTimeoutManagement"));
const SystemConfigManagement = lazy(() => import("@/pages/system/SystemConfigManagement"));
const AppContentManagement = lazy(() => import("@/pages/system/AppContentManagement"));
const AppVersionManagement = lazy(() => import("@/pages/system/AppVersionManagement"));
const OnboardingManagement = lazy(() => import("@/pages/system/OnboardingManagement"));
const FeatureFlags = lazy(() => import("@/pages/system/FeatureFlags"));
const SystemHealth = lazy(() => import("@/pages/system/SystemHealth"));

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

// Regions
const ManageRegions = lazy(() => import("@/pages/regions/ManageRegions"));
const RegionForm = lazy(() => import("@/pages/regions/RegionForm"));

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
      <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center text-sm text-muted-foreground animate-pulse">Loading...</div>}>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Legacy redirects */}
          <Route path="/manage-users" element={<LegacyRedirect to="/users/manage" />} />
          <Route path="/manage-shops" element={<LegacyRedirect to="/shops/manage" />} />
          <Route path="/create-shop" element={<LegacyRedirect to="/shops/create" />} />

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                {/* Core (Anyone authenticated) */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin/profile" element={<AdminProfile />} />

                {/* OPS Routes */}
                <Route element={<ProtectedRoute requiredRole={AdminRole.ADMIN_OPS}><Outlet /></ProtectedRoute>}>
                    <Route path="/shops/create" element={<CreateShopRestaurant />} />
                    <Route path="/shops/manage" element={<ManageShopRestaurant />} />
                    <Route path="/shops/operating-hours" element={<ShopOperatingHours />} />
                    <Route path="/shops/vetting" element={<VettingQueue />} />
                    <Route path="/users/manage" element={<ManageUsers />} />
                    <Route path="/users/:id" element={<UserDetail />} />
                    <Route path="/menus/approvals" element={<MenuApprovals />} />
                    <Route path="/menus/items/manage" element={<ManageMenuItems />} />
                    <Route path="/menus/items/create" element={<CreateMenuItem />} />
                    <Route path="/orders/board" element={<OrderBoard />} />
                    <Route path="/orders/:id" element={<OrderDetail />} />
                    <Route path="/moderation/content" element={<ContentReports />} />
                    <Route path="/moderation/user-shop" element={<UserShopReports />} />
                    <Route path="/review/reviews" element={<Reviews />} />
                    <Route path="/review/:type/:id" element={<ReviewDetail />} />
                </Route>

                {/* SETUP Routes */}
                <Route element={<ProtectedRoute requiredRole={AdminRole.ADMIN_SETUP}><Outlet /></ProtectedRoute>}>
                    <Route path="/categories/manage" element={<ManageCategories />} />
                    <Route path="/categories/create" element={<CreateCategory />} />
                    <Route path="/shop-categories/manage" element={<ManageShopCategories />} />
                    <Route path="/shop-categories/create" element={<CreateShopCategory />} />
                    <Route path="/shop-sub-categories/manage" element={<ManageShopSubCategories />} />
                    <Route path="/shop-sub-categories/create" element={<CreateShopSubCategory />} />
                    <Route path="/menus/sub-categories/create" element={<CreateSubCategory />} />
                    <Route path="/menus/sub-categories/manage" element={<ManageSubCategories />} />
                    <Route path="/community/posts" element={<CommunityMgt />} />
                    <Route path="/community/posts/:id" element={<PostDetailPage />} />
                    <Route path="/community/comments" element={<CommentBoard />} />
                    <Route path="/lostfound" element={<LostFound />} />
                    <Route path="/cuisines/manage" element={<ManageCuisines />} />
                    <Route path="/cuisines/create" element={<CuisineForm />} />
                    <Route path="/cuisines/edit/:id" element={<CuisineForm />} />
                    {/* Regions */}
                    <Route path="/regions/manage" element={<ManageRegions />} />
                    <Route path="/regions/create" element={<RegionForm />} />
                    <Route path="/regions/edit/:id" element={<RegionForm />} />
                    {/* Locations (OPS/SETUP) */}
                    <Route path="/cities/manage" element={<ManageCities />} />
                    <Route path="/cities/create" element={<CreateCity />} />
                    <Route path="/cities/edit/:id" element={<CreateCity />} />
                    <Route path="/districts/manage" element={<ManageDistricts />} />
                    <Route path="/districts/create" element={<CreateDistrict />} />
                    <Route path="/districts/edit/:id" element={<CreateDistrict />} />
                    <Route path="/system/app-content" element={<AppContentManagement />} />
                    <Route path="/system/app-versions" element={<AppVersionManagement />} />
                    <Route path="/system/onboarding" element={<OnboardingManagement />} />
                </Route>

                {/* FINANCE Routes */}
                <Route element={<ProtectedRoute requiredRole={AdminRole.ADMIN_FINANCE}><Outlet /></ProtectedRoute>}>
                    <Route path="/analytics" element={<AnalyticalDashboard />} />
                    <Route path="/orders/history" element={<OrderHistory />} />
                    <Route path="/system/order-timeouts" element={<OrderTimeoutManagement />} />
                </Route>

                {/* SUPER ADMIN Routes */}
                <Route element={<ProtectedRoute requiredRole={AdminRole.ADMIN}><Outlet /></ProtectedRoute>}>
                    <Route path="/import/shops-excel" element={<ShopsExcelImport />} />
                    <Route path="/import/activity-excel" element={<ActivityExcelImport />} />
                    <Route path="/payment/methods" element={<PaymentMethods />} />
                    <Route path="/payment/methods/create" element={<PaymentMethodForm />} />
                    <Route path="/payment/methods/edit/:id" element={<PaymentMethodForm />} />
                    <Route path="/shop-payment-types/manage" element={<ManageShopPaymentTypes />} />
                    <Route path="/shop-payment-types/create" element={<CreateShopPaymentType />} />
                    <Route path="/shop-payment-types/edit/:shopId/:id" element={<CreateShopPaymentType />} />
                    <Route path="/marketing/banners" element={<BannerManagement />} />
                    <Route path="/marketing/broadcast" element={<Broadcast />} />
                    <Route path="/system/feature-flags" element={<FeatureFlags />} />
                    <Route path="/system/configs" element={<SystemConfigManagement />} />
                    <Route path="/system/audit-logs" element={<AuditLogs />} />
                    <Route path="/system/health" element={<SystemHealth />} />
                </Route>

                {/* Shared/Uncategorized */}
                <Route path="/shops/profile/settings" element={<ShopProfileSettings />} />
            </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ExcelImportProvider>
  );
}

export default App;
