import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

// ===============================
// MAIN PAGES
// ===============================
import Login from "./components/login";
import Home from "./components/Home";
import Shop from "./components/shop";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import Order from "./components/order";
import Profile from "./components/Profile";
import Assistant from "./components/Assistant";
import SR from "./components/SR";
import Product from "./components/product";
import Register from "./components/register";
// ===============================
// ACCOUNT PAGES
// ===============================
import MyOrders from "./components/myorders";
import Wishlist from "./components/wishlist";
import SavedAdd from "./components/savedadd";
import PayMethod from "./components/paymethod";

// ===============================
// INFORMATION PAGES
// ===============================
import About from "./components/about";

// ===============================
// ADMIN PAGES
// ===============================
import AdminLogin from "./pages/adminlogin";
import Dashboard from "./pages/dashboard";
import AdminProducts from "./pages/adminproduct";
import Adminorders from "./pages/adminorders";
import Admincustomers from "./pages/admincustomer";
import AdminAI from "./pages/adminai";
import Adminreports from "./pages/adminreport";
import Adminsettings from "./pages/adminsetting";

// ===============================
// ADMIN PROTECTED ROUTE
// ===============================
function AdminProtectedRoute({ children }) {
  const adminUser = localStorage.getItem("badTeddyAdminUser");
  const location = useLocation();

  if (!adminUser) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}


function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0b0b",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "30px",
      }}
    >
      <h1 style={{ color: "#d4af37" }}>
        Page Not Found
      </h1>

      <p>
        The page you are looking for does not exist.
      </p>

      <a
        href="/"
        style={{
          marginTop: "20px",
          padding: "12px 24px",
          background: "#d4af37",
          color: "#000",
          textDecoration: "none",
          borderRadius: "8px",
          fontWeight: "700",
        }}
      >
        Back to Home
      </a>
    </div>
  );
}


function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* =========================
            HOME
        ========================= */}

        <Route
          path="/"
          element={<Home />}
        />


        {/* =========================
            LOGIN
        ========================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* =========================
            SHOP
        ========================= */}

        <Route
          path="/shop"
          element={<Shop />}
        />


        {/* =========================
            PRODUCT DETAILS
        ========================= */}

        <Route
          path="/product/:id"
          element={<Product />}
        />


        {/* =========================
            CART
        ========================= */}

        <Route
          path="/cart"
          element={<Cart />}
        />


        {/* =========================
            CHECKOUT
        ========================= */}

        <Route
          path="/checkout"
          element={<Checkout />}
        />


        {/* =========================
            ORDER CONFIRMATION
        ========================= */}

        <Route
          path="/order"
          element={<Order />}
        />


        {/* =========================
            PROFILE
        ========================= */}

        <Route
          path="/profile"
          element={<Profile />}
        />


        {/* =========================
            MY ORDERS
        ========================= */}

        <Route
          path="/myorders"
          element={<MyOrders />}
        />


        {/* =========================
            SAVED ADDRESS
        ========================= */}

        <Route
          path="/savedadd"
          element={<SavedAdd />}
        />


        {/* =========================
            PAYMENT METHODS
        ========================= */}

        <Route
          path="/paymethod"
          element={<PayMethod />}
        />


        {/* =========================
            WISHLIST
        ========================= */}

        <Route
          path="/wishlist"
          element={<Wishlist />}
        />


        {/* =========================
            AI ASSISTANT
        ========================= */}

        <Route
          path="/assistant"
          element={<Assistant />}
        />


        {/* =========================
            AI SIZE RECOMMENDATION
        ========================= */}

        <Route
          path="/size-recommendation"
          element={<SR />}
        />


        {/* =========================
            ABOUT BAD TEDDY
        ========================= */}

        <Route
          path="/about"
          element={<About />}
        />


        {/* =========================
            ADMIN AUTHENTICATION
        ========================= */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />
        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />


        {/* =========================
            ADMIN PANEL ROUTES (PROTECTED)
        ========================= */}

        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <Dashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <Dashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AdminProtectedRoute>
              <Dashboard />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <AdminProtectedRoute>
              <AdminProducts />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin-products"
          element={
            <AdminProtectedRoute>
              <AdminProducts />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <AdminProtectedRoute>
              <AdminProducts />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <AdminProtectedRoute>
              <Adminorders />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin-orders"
          element={
            <AdminProtectedRoute>
              <Adminorders />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <AdminProtectedRoute>
              <Adminorders />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/customers"
          element={
            <AdminProtectedRoute>
              <Admincustomers />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin-customers"
          element={
            <AdminProtectedRoute>
              <Admincustomers />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <AdminProtectedRoute>
              <Admincustomers />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/ai"
          element={
            <AdminProtectedRoute>
              <AdminAI />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin-ai"
          element={
            <AdminProtectedRoute>
              <AdminAI />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/ai-insights"
          element={
            <AdminProtectedRoute>
              <AdminAI />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <AdminProtectedRoute>
              <Adminreports />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin-reports"
          element={
            <AdminProtectedRoute>
              <Adminreports />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <AdminProtectedRoute>
              <Adminreports />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <AdminProtectedRoute>
              <Adminsettings />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin-settings"
          element={
            <AdminProtectedRoute>
              <Adminsettings />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <AdminProtectedRoute>
              <Adminsettings />
            </AdminProtectedRoute>
          }
        />


        {/* =========================
            INVALID URL
        ========================= */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>

    </BrowserRouter>

  );

}


export default App;