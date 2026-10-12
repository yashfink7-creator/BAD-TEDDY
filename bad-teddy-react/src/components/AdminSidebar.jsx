import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import myLogo from "../assets/mylogo.png";
import "../styles/admin-sidebar.css";

/**
 * Reusable Admin Sidebar Component
 * Appears consistently across all Bad Teddy Admin Panel pages:
 * - Dashboard (/admin, /dashboard)
 * - Products (/admin/products, /products)
 * - Orders (/admin/orders, /orders)
 * - Customers (/admin/customers, /customers)
 * - AI Insights (/admin/ai, /ai-insights)
 * - Reports (/admin/reports, /reports)
 * - Settings (/admin/settings, /settings)
 * - Logout (clears admin session and routes to /admin/login)
 */
function AdminSidebar({ activePage }) {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname.toLowerCase();

    // Determine active menu item either by prop or by current route
    const isCurrent = (key, paths) => {
        if (activePage && activePage.toLowerCase() === key.toLowerCase()) {
            return true;
        }
        return paths.some((path) => currentPath === path.toLowerCase());
    };

    const handleNavigation = (destination) => {
        navigate(destination);
    };

    const handleAdminLogout = () => {
        const confirmLogout = window.confirm("Are you sure you want to log out of the Admin Panel?");
        if (confirmLogout) {
            // Decoupled logout: ONLY clears Admin credentials, preserving any Customer session
            localStorage.removeItem("badTeddyAdminUser");
            localStorage.removeItem("badTeddyAdminToken");
            navigate("/admin/login");
        }
    };

    const menuItems = [
        {
            key: "Dashboard",
            label: "Dashboard",
            icon: "fa-solid fa-house",
            path: "/admin",
            aliases: ["/admin", "/admin/dashboard", "/dashboard"]
        },
        {
            key: "Products",
            label: "Products",
            icon: "fa-solid fa-box",
            path: "/admin/products",
            aliases: ["/admin/products", "/admin-products", "/products"]
        },
        {
            key: "Orders",
            label: "Orders",
            icon: "fa-solid fa-cart-shopping",
            path: "/admin/orders",
            aliases: ["/admin/orders", "/admin-orders", "/orders"]
        },
        {
            key: "Customers",
            label: "Customers",
            icon: "fa-solid fa-users",
            path: "/admin/customers",
            aliases: ["/admin/customers", "/admin-customers", "/customers"]
        },
        {
            key: "AI Insights",
            label: "AI Insights",
            icon: "fa-solid fa-brain",
            path: "/admin/ai",
            aliases: ["/admin/ai", "/admin-ai", "/ai-insights", "/admin/reports/ai"],
            badge: "AI"
        },
        {
            key: "Reports",
            label: "Reports",
            icon: "fa-solid fa-chart-line",
            path: "/admin/reports",
            aliases: ["/admin/reports", "/admin-reports", "/reports"]
        },
        {
            key: "Settings",
            label: "Settings",
            icon: "fa-solid fa-gear",
            path: "/admin/settings",
            aliases: ["/admin/settings", "/admin-settings", "/settings"]
        }
    ];

    return (
        <aside className="sidebar">
            {/* BRAND LOGO / HEADER */}
            <div className="sidebar-logo">
                <img
                    src={myLogo}
                    alt="Bad Teddy Admin"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/admin")}
                />
                <div onClick={() => navigate("/admin")} style={{ cursor: "pointer" }}>
                    <h2>ADMIN PANEL</h2>
                </div>
            </div>

            {/* UNIFIED NAVIGATION */}
            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const active = isCurrent(item.key, item.aliases);
                    return (
                        <button
                            key={item.key}
                            type="button"
                            className={`nav-item ${active ? "active" : ""}`}
                            onClick={() => handleNavigation(item.path)}
                            title={item.label}
                        >
                            <i className={item.icon}></i>
                            <span>{item.label}</span>
                            {item.badge && (
                                <span
                                    style={{
                                        marginLeft: "auto",
                                        fontSize: "10px",
                                        fontWeight: "700",
                                        letterSpacing: "0.5px",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        background: active ? "rgba(212, 175, 55, 0.25)" : "rgba(212, 175, 55, 0.15)",
                                        color: "#D4AF37",
                                        border: "1px solid rgba(212, 175, 55, 0.3)"
                                    }}
                                >
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* SIDEBAR DIVIDER */}
                <div className="sidebar-divider"></div>

                {/* LOGOUT BUTTON */}
                <button
                    type="button"
                    className="nav-item logout-item"
                    onClick={handleAdminLogout}
                    title="Log out from Admin"
                >
                    <i className="fa-solid fa-right-from-bracket"></i>
                    <span>Logout</span>
                </button>
            </nav>
        </aside>
    );
}

export default AdminSidebar;
