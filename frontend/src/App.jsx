import { useState, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import axios from "axios";
import ToastContainer from "./components/ToastContainer.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import { SYSTEM_API_URL } from "./config/api.js";

// =====================================================
// PUBLIC PAGES
// =====================================================

import Home from "./pages/Home.jsx";
import PublicShop from "./pages/PublicShop.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgetPassword from "./pages/ForgetPassword.jsx";
import VerifyOTP from "./pages/VerifyOTP.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import TermsOfService from "./pages/TermsOfService.jsx";
import CookiePreferences from "./pages/CookiePreferences.jsx";
import Contact from "./pages/Contact.jsx";
import NotFound from "./pages/NotFound.jsx";

// =====================================================
// ADMIN
// =====================================================

import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminProfile from "./components/admin/AdminProfile.jsx";
import Products from "./pages/Admin/Products.jsx";

import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import AdminAnalytics from "./pages/Admin/AdminAnalytics.jsx";
import Users from "./pages/Admin/Users.jsx";
import Bin from "./pages/Admin/Bin.jsx";
import AdminSettings from "./pages/Admin/Settings.jsx";
import AdminPayments from "./pages/Admin/Payments.jsx";
import AdminOrders from "./pages/Admin/AdminOrders.jsx";
import AdminDelivery from "./pages/Admin/AdminDelivery.jsx";
import EditUser from "./pages/Admin/EditUser.jsx";
import AdminUserDetails from "./pages/Admin/AdminUserDetails.jsx";
import AdminCoupons from "./pages/Admin/AdminCoupons.jsx";

// =====================================================
// DELIVERY
// =====================================================

import DeliveryLayout from "./components/delivery/DeliveryLayout.jsx";
import DeliveryDashboard from "./pages/Delivery/DeliveryDashboard.jsx";
import DeliveryOrders from "./pages/Delivery/DeliveryOrders.jsx";
import DeliveryOrderDetails from "./pages/Delivery/DeliveryOrderDetails.jsx";
import DeliveryProfile from "./pages/Delivery/DeliveryProfile.jsx";
import DeliverySettings from "./pages/Delivery/DeliverySettings.jsx";
import DeliveryWallet from "./pages/Delivery/DeliveryWallet.jsx";

// =====================================================
// CLIENT
// =====================================================

import ClientLayout from "./components/client/ClientLayout.jsx";
import ClientDashboard from "./pages/Client/ClientDashboard.jsx";
import ClientSettings from "./pages/Client/Settings.jsx";
import Profile from "./pages/Client/Profile.jsx";
import Wishlist from "./pages/Client/Wishlist.jsx";
import Shop from "./pages/Client/Shop.jsx";
import Orders from "./pages/Client/Orders.jsx";
import Notifications from "./pages/Client/Notifications.jsx";
import Addresses from "./pages/Client/Addresses.jsx";
import Cart from "./pages/Client/Cart.jsx";

// =====================================================
// AUTH HELPERS
// =====================================================

const getUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    return null;
  }
};

const getRole = () => {
  const user = getUser();

  return (
    user?.role ||
    localStorage.getItem("role") ||
    null
  )?.toLowerCase();
};

const loggedIn = () => {
  return Boolean(localStorage.getItem("token"));
};

const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
};

const dashboardFor = (role) => {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "delivery") {
    return "/delivery";
  }

  if (role === "client") {
    return "/client";
  }

  return "/login";
};



// =====================================================
// PROTECTED ROUTE
// =====================================================

const ProtectedRoute = ({ role, children }) => {
  if (!loggedIn()) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = getRole();

  if (!currentRole) {
    clearAuth();

    return <Navigate to="/login" replace />;
  }

  if (role && currentRole !== role) {
    return (
      <Navigate
        to={dashboardFor(currentRole)}
        replace
      />
    );
  }

  return children;
};

// =====================================================
// PUBLIC AUTH ROUTE
// =====================================================

const PublicOnlyRoute = ({ children }) => {
  if (!loggedIn()) {
    return children;
  }

  const role = getRole();

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (role === "delivery") {
    return <Navigate to="/delivery" replace />;
  }

  if (role === "client") {
    return <Navigate to="/client" replace />;
  }

  clearAuth();

  return children;
};

// =====================================================
// MAINTENANCE GUARD (Exempts Admin Accounts)
// =====================================================

const MaintenanceGuard = ({ children }) => {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        const role = (user?.role || localStorage.getItem("role") || "").toLowerCase();

        // Admin accounts are exempt from Maintenance Mode!
        if (role === "admin") {
          setIsMaintenance(false);
          return;
        }

        const res = await axios.get(`${SYSTEM_API_URL}/maintenance`);
        if (res.data?.success && res.data.settings?.isMaintenanceMode) {
          setIsMaintenance(true);
        } else {
          setIsMaintenance(false);
        }
      } catch (err) {
        setIsMaintenance(false);
      }
    };

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 5000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  if (isMaintenance) {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const role = (user?.role || localStorage.getItem("role") || "").toLowerCase();

    // Admin accounts are exempt
    if (role === "admin") {
      return children;
    }

    // Allow navigation to login page during maintenance so an Admin can log in
    if (location.pathname === "/login" || location.pathname === "/admin/login") {
      return children;
    }

    // Drivers, clients, and public visitors see ONLY the Maintenance screen
    return <Maintenance />;
  }

  return children;
};

// =====================================================
// APP
// =====================================================

function App() {
  return (
    <MaintenanceGuard>
      <ScrollToTop />
      <ToastContainer />
      <Routes>

      {/* =================================================
          HOME
      ================================================= */}

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/home"
        element={<Home />}
      />

      <Route
        path="/shop"
        element={<PublicShop />}
      />

      <Route
        path="/cart"
        element={<Navigate to="/client/cart" replace />}
      />

      <Route
        path="/wishlist"
        element={<Navigate to="/client/wishlist" replace />}
      />

      {/* =================================================
          LEGAL & POLICY PAGES
      ================================================= */}

      <Route
        path="/privacy-policy"
        element={<PrivacyPolicy />}
      />

      <Route
        path="/terms-of-service"
        element={<TermsOfService />}
      />

      <Route
        path="/cookie-preferences"
        element={<CookiePreferences />}
      />

      <Route
        path="/contact"
        element={<Contact />}
      />

      <Route
        path="/contact-us"
        element={<Contact />}
      />

      {/* =================================================
          LOGIN
      ================================================= */}

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      {/* =================================================
          REGISTER
      ================================================= */}

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      {/* =================================================
          FORGOT PASSWORD
      ================================================= */}

      <Route
        path="/forgot-password"
        element={<ForgetPassword />}
      />

      {/* =================================================
          OTP VERIFICATION
      ================================================= */}

      <Route
        path="/verify-otp"
        element={<VerifyOTP />}
      />

      {/* =================================================
          RESET PASSWORD
      ================================================= */}

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      {/* =================================================
          ADMIN ROUTES
      ================================================= */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >

        {/* Admin Dashboard */}
        <Route
          index
          element={<AdminDashboard />}
        />

        {/* Orders */}
        <Route
          path="orders"
          element={<AdminOrders />}
        />

        {/* Delivery Management */}
        <Route
          path="delivery"
          element={<AdminDelivery />}
        />
        <Route
          path="delivery-boys"
          element={<Navigate to="/admin/delivery" replace />}
        />

        {/* Users */}
        <Route
          path="users"
          element={<Users />}
        />
        {/* Products */}
        <Route
          path="products"
          element={<Products />}
        />

        {/* User Details */}
        <Route
          path="users/:id"
          element={<AdminUserDetails />}
        />

        {/* Edit User */}
        <Route
          path="users/edit/:id"
          element={<EditUser />}
        />

        {/* Analytics */}
        <Route
          path="analytics"
          element={<AdminAnalytics />}
        />

        {/* Bin */}
        <Route
          path="bin"
          element={<Bin />}
        />

        {/* Payments */}
        <Route
          path="payments"
          element={<AdminPayments />}
        />

        {/* Coupons */}
        <Route
          path="coupons"
          element={<AdminCoupons />}
        />

        {/* Settings */}
        <Route
          path="settings"
          element={<AdminSettings />}
        />

        {/* Profile */}
        <Route
          path="profile"
          element={<AdminProfile />}
        />

      </Route>

      {/* =================================================
          DELIVERY ROUTES
      ================================================= */}

      <Route
        path="/delivery"
        element={
          <ProtectedRoute role="delivery">
            <DeliveryLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DeliveryDashboard />} />
        <Route path="wallet" element={<DeliveryWallet />} />
        <Route path="orders" element={<DeliveryOrders />} />
        <Route path="orders/:id" element={<DeliveryOrderDetails />} />
        <Route path="profile" element={<DeliveryProfile />} />
        <Route path="settings" element={<DeliverySettings />} />
      </Route>

      {/* =================================================
          CLIENT ROUTES
      ================================================= */}

      <Route
        path="/client"
        element={
          <ProtectedRoute role="client">
            <ClientLayout />
          </ProtectedRoute>
        }
      >

        {/* Client Dashboard */}
        <Route
          index
          element={<ClientDashboard />}
        />

        {/* Shop */}
        <Route
          path="shop"
          element={<Shop />}
        />


        {/* Wishlist */}
        <Route
          path="wishlist"
          element={<Wishlist />} />

        <Route
          path="cart"
          element={<Cart />} />

        {/* Orders */}
        <Route
          path="orders"
          element={<Orders />} />

        {/* Profile */}
        <Route
          path="profile"
          element={<Profile />} />

        {/* Settings */}
        <Route
          path="settings"
          element={<ClientSettings />} />

        {/* Notifications */}
        <Route
          path="notifications"
          element={<Notifications />} />

        {/* Addresses */}
        <Route
          path="addresses"
          element={<Addresses />} />

      </Route>

      {/* =================================================
          404
      ================================================= */}

      <Route
        path="*"
        element={<NotFound />}
      />

    </Routes>
    </MaintenanceGuard>
  );
}

export default App;