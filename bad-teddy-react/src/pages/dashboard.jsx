import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/dashboard.css";
import myLogo from "../assets/mylogo.png";
import { useNavigate } from "react-router-dom";

/* =========================================
   CHART.JS
========================================= */

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);


/* =========================================
   DASHBOARD
========================================= */

function Dashboard() {

    /* =========================================
       STATES
    ========================================= */

    const navigate = useNavigate();
    

    const [theme, setTheme] = useState(
    localStorage.getItem("adminTheme") || "dark"
);

const toggleTheme = () => {

    const newTheme =
        theme === "dark"
            ? "light"
            : "dark";

    setTheme(newTheme);

    localStorage.setItem(
        "adminTheme",
        newTheme
    );

};

    const [activePage, setActivePage] = useState("Dashboard");

    const [salesPeriod, setSalesPeriod] =
        useState("Last 7 Days");

    const [searchTerm, setSearchTerm] =
        useState("");

    const [showNotifications, setShowNotifications] =
        useState(false);

    const [showOrderMenu, setShowOrderMenu] =
        useState(false);

    const [activeOrderStatus, setActiveOrderStatus] =
    useState("all");

    const [activeOrderView, setActiveOrderView] =
    useState("summary");

    /* =========================================
       API STATS STATE & FETCH
    ========================================= */

    const [stats, setStats] = useState({
        total_revenue: 124500,
        total_orders: 1248,
        total_customers: 3842,
        total_products: 186,
        low_stock_count: 4,
        low_stock_items: [],
        status_counts: {
            "Pending": 24,
            "Order Confirmed": 45,
            "Processing": 38,
            "Shipped": 52,
            "Delivered": 86,
            "Cancelled": 2
        },
        monthly_sales: [],
        recent_orders: [],
        top_products: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch("http://localhost/BAD%20TEDDY/backend/api/admin_stats.php");
                const data = await response.json();
                if (data && data.success && data.stats) {
                    setStats((prev) => ({
                        ...prev,
                        ...data.stats
                    }));
                }
            } catch (error) {
                console.error("Error loading admin stats:", error);
            }
        };

        fetchStats();
    }, []);

/* =========================================
   PAGE NAVIGATION
========================================= */

const goToPage = (page) => {

    switch (page) {

        case "Dashboard":
            navigate("/dashboard");
            break;

        case "Products":
            navigate("/products");
            break;

        case "Orders":
            navigate("/orders");
            break;

        case "Customers":
            navigate("/customers");
            break;

        case "AI Insights":
            navigate("/admin/ai");
            break;

        case "Reports":
            navigate("/reports");
            break;

        case "Settings":
            navigate("/settings");
            break;

        case "logout":
            localStorage.removeItem("badTeddyAdminUser");
            localStorage.removeItem("badTeddyAdminToken");
            navigate("/admin/login");
            break;

        default:
            break;
    }

};


    /* =========================================
       CLOSE NOTIFICATIONS WHEN CLICKING OUTSIDE
    ========================================= */

    useEffect(() => {

        const handleClickOutside = (event) => {

            if (
                !event.target.closest(".notification-btn") &&
                !event.target.closest(".notification-dropdown")
            ) {
                setShowNotifications(false);
            }

        };

        document.addEventListener(
            "click",
            handleClickOutside
        );

        return () => {

            document.removeEventListener(
                "click",
                handleClickOutside
            );

        };

    }, []);


    /* =========================================
       SEARCH DATA
    ========================================= */

    const searchItems = [

        {
            type: "Order",
            name: "Order #BT1001",
            details: "Aarav Mehta - ₹2,499"
        },

        {
            type: "Order",
            name: "Order #BT1002",
            details: "Riya Shah - ₹3,499"
        },

        {
            type: "Order",
            name: "Order #BT1003",
            details: "Kabir Patel - ₹2,999"
        },

        {
            type: "Customer",
            name: "Aarav Mehta",
            details: "Customer"
        },

        {
            type: "Customer",
            name: "Riya Shah",
            details: "Customer"
        },

        {
            type: "Product",
            name: "Bad Teddy Hoodie",
            details: "Product"
        },

        {
            type: "Product",
            name: "Chaos Oversized Tee",
            details: "Product"
        }

    ];


    const searchResults = searchItems.filter((item) =>

        item.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())

        ||

        item.details
            .toLowerCase()
            .includes(searchTerm.toLowerCase())

    );


    /* =========================================
       SALES DATA
    ========================================= */

    const salesData = {

        "Last 7 Days": {

            labels: [
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun"
            ],

            values: [
                12000,
                18500,
                15000,
                22000,
                19500,
                28000,
                24500
            ]

        },

        "Last 30 Days": {

            labels: [
                "Week 1",
                "Week 2",
                "Week 3",
                "Week 4"
            ],

            values: [
                68000,
                82000,
                95000,
                112000
            ]

        },

        "Last 3 Months": {

            labels: [
                "May",
                "June",
                "July"
            ],

            values: [
                245000,
                298000,
                342000
            ]

        }

    };


    const currentSales =
        salesData[salesPeriod];


    /* =========================================
       CHART DATA
    ========================================= */

    const chartData = {

        labels: currentSales.labels,

        datasets: [

            {

                label: "Revenue",

                data: currentSales.values,

                borderColor: "#D4AF37",

                backgroundColor:
                    "rgba(212, 175, 55, 0.15)",

                tension: 0.4,

                fill: true,

                pointRadius: 4,

                pointHoverRadius: 6

            }

        ]

    };


    /* =========================================
       CHART OPTIONS
    ========================================= */

    const salesOptions = {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

            legend: {
                display: false
            },

            tooltip: {

                callbacks: {

                    label: function (context) {

                        return (
                            "₹" +
                            context.raw.toLocaleString()
                        );

                    }

                }

            }

        },

        scales: {

            x: {

                grid: {
                    display: false
                },

                ticks: {
                    color: "#888"
                }

            },

            y: {

                beginAtZero: true,

                grid: {
                    color: "#252525"
                },

                ticks: {

                    color: "#888",

                    callback: function (value) {

                        return (
                            "₹" +
                            value / 1000 +
                            "K"
                        );

                    }

                }

            }

        }

    };


    /* =========================================
       RETURN STARTS HERE
    ========================================= */

    return (

        <div className={`admin-container ${theme}-theme`}>
            {/* UNIFIED ADMIN SIDEBAR */}
            <AdminSidebar activePage="Dashboard" />



        {/* =========================================
            MAIN CONTENT
        ========================================= */}

        <main className="main-content">


            {/* =========================================
                TOP HEADER
            ========================================= */}

            <header className="top-header">


                {/* SEARCH */}
                <div className="header-search">

                    <i className="fa-solid fa-magnifying-glass"></i>

                    <input
                        type="text"
                        placeholder="Search orders, customers, products..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(e.target.value)
                        }
                    />

                </div>


                {/* SEARCH RESULTS */}

                {searchTerm && (

                    <div className="search-results">

                        {searchResults.length > 0 ? (

                            searchResults.map(
                                (item, index) => (

                                    <div
                                        className="search-result-item"
                                        key={index}
                                    >

                                        <div>

                                            <strong>
                                                {item.name}
                                            </strong>

                                            <p>
                                                {item.details}
                                            </p>

                                        </div>

                                        <span>
                                            {item.type}
                                        </span>

                                    </div>

                                )
                            )

                        ) : (

                            <div className="no-search-results">

                                No results found.

                            </div>

                        )}

                    </div>

                )}


                {/* HEADER RIGHT */}

                <div className="header-right">


                    {/* NOTIFICATION */}

                    <div className="notification-wrapper">

                        <button
                            className="notification-btn"
                            onClick={(e) => {

                                e.stopPropagation();

                                setShowNotifications(
                                    !showNotifications
                                );

                            }}
                        >

                            <i className="fa-regular fa-bell"></i>

                            <span className="notification-count">
                                3
                            </span>

                        </button>


                        {/* NOTIFICATION DROPDOWN */}

                        {showNotifications && (

                            <div className="notification-dropdown">

                                <div className="notification-header">

                                    <h3>
                                        Notifications
                                    </h3>

                                    <span>
                                        3 new
                                    </span>

                                </div>


                                <div className="notification-item">

                                    <i className="fa-solid fa-box"></i>

                                    <div>

                                        <strong>
                                            New order received
                                        </strong>

                                        <p>
                                            Order #BT1003
                                        </p>

                                    </div>

                                </div>


                                <div className="notification-item">

                                    <i className="fa-solid fa-triangle-exclamation"></i>

                                    <div>

                                        <strong>
                                            Low stock alert
                                        </strong>

                                        <p>
                                            Cargo Pants only have 3 units left.
                                        </p>

                                    </div>

                                </div>


                                <div className="notification-item">

                                    <i className="fa-solid fa-user"></i>

                                    <div>

                                        <strong>
                                            New customer
                                        </strong>

                                        <p>
                                            Aarav Mehta registered.
                                        </p>

                                    </div>

                                </div>

                            </div>

                        )}

                    </div>


                    {/* DARK MODE ICON */}

                   <button
    className="theme-btn"
    onClick={toggleTheme}
    title={
        theme === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode"
    }
>
    <i
        className={
            theme === "dark"
                ? "fa-solid fa-sun"
                : "fa-solid fa-moon"
        }
    ></i>
</button>


                    {/* ADMIN PROFILE */}

                    <div className="admin-profile">

                        <img
    src={myLogo}
    alt="Bad Teddy Admin"
/>

                        <div>

                            <h4>
                                Bad teddy
                            </h4>

                            <p>
                                Super Admin
                            </p>

                        </div>

                    </div>

                </div>

            </header>
                        {/* =========================================
                PAGE TITLE
            ========================================= */}

            <section className="page-title">

                <h1>
                    Dashboard
                </h1>

                <p>
                    Welcome back, Admin. Here's what's happening with Bad Teddy today.
                </p>

            </section>


            {/* =========================================
                STATISTICS CARDS
            ========================================= */}

            <section className="dashboard-cards">


                {/* TOTAL REVENUE */}

                <div
    className="card"
    onClick={() => goToPage("Reports")}
>

                    <div className="card-icon">

                        <i className="fa-solid fa-indian-rupee-sign"></i>

                    </div>


                    <div>

                        <h4>
                            Total Revenue
                        </h4>

                        <h2>
                            ₹{Number(stats.total_revenue || 124500).toLocaleString("en-IN")}
                        </h2>

                        <div className="card-growth positive">

                            <i className="fa-solid fa-arrow-up"></i>

                            <span>
                                12.5%
                            </span>

                            <small>
                                from last month
                            </small>

                        </div>

                    </div>

                </div>



                {/* TOTAL ORDERS */}

                <div
    className="card"
    onClick={() => goToPage("Orders")}
>

                    <div className="card-icon">

                        <i className="fa-solid fa-cart-shopping"></i>

                    </div>


                    <div>

                        <h4>
                            Total Orders
                        </h4>

                        <h2>
                            {Number(stats.total_orders || 1248).toLocaleString("en-IN")}
                        </h2>

                        <div className="card-growth positive">

                            <i className="fa-solid fa-arrow-up"></i>

                            <span>
                                8.2%
                            </span>

                            <small>
                                from last month
                            </small>

                        </div>

                    </div>

                </div>



                {/* TOTAL CUSTOMERS */}

                <div
    className="card"
    onClick={() => goToPage("Customers")}
>

                    <div className="card-icon">

                        <i className="fa-solid fa-users"></i>

                    </div>


                    <div>

                        <h4>
                            Total Customers
                        </h4>

                        <h2>
                            {Number(stats.total_customers || 3842).toLocaleString("en-IN")}
                        </h2>

                        <div className="card-growth positive">

                            <i className="fa-solid fa-arrow-up"></i>

                            <span>
                                15.8%
                            </span>

                            <small>
                                from last month
                            </small>

                        </div>

                    </div>

                </div>



                {/* TOTAL PRODUCTS */}

                <div
    className="card"
    onClick={() => goToPage("Products")}
>

                    <div className="card-icon">

                        <i className="fa-solid fa-box"></i>

                    </div>


                    <div>

                        <h4>
                            Total Products
                        </h4>

                        <h2>
                            {Number(stats.total_products || 186).toLocaleString("en-IN")}
                        </h2>

                        <div className="card-growth positive">

                            <i className="fa-solid fa-arrow-up"></i>

                            <span>
                                5.4%
                            </span>

                            <small>
                                from last month
                            </small>

                        </div>

                    </div>

                </div>


            </section>
                        {/* =========================================
                DASHBOARD MAIN GRID
            ========================================= */}

            <section className="dashboard-grid">


                {/* =========================================
                    SALES OVERVIEW
                ========================================= */}

                <div className="dashboard-panel sales-panel">

                    <div className="panel-header">

                        <div>

                            <h2>
                                Sales Overview
                            </h2>

                            <p>
                                Revenue performance
                            </p>

                        </div>


                        {/* CHART PERIOD */}

                        <select
                            value={salesPeriod}
                            onChange={(e) =>
                                setSalesPeriod(e.target.value)
                            }
                        >

                            <option value="Last 7 Days">
                                Last 7 Days
                            </option>

                            <option value="Last 30 Days">
                                Last 30 Days
                            </option>

                            <option value="Last 3 Months">
                                Last 3 Months
                            </option>

                        </select>

                    </div>


                    {/* SALES CHART */}

                    <div className="chart-container">

                        <Line
                            data={chartData}
                            options={salesOptions}
                        />

                    </div>

                </div>



                {/* =========================================
    ORDER SUMMARY
========================================= */}

<div className="dashboard-panel order-panel">

    <div className="panel-header">

        <div>

            <h2>
                Order Summary
            </h2>

            <p>
                Today's order status
            </p>

        </div>


        {/* THREE DOT MENU */}

        <button
            className="panel-menu-btn"
            onClick={() =>
                setShowOrderMenu(!showOrderMenu)
            }
        >

            <i className="fa-solid fa-ellipsis"></i>

        </button>


        {/* ORDER MENU */}

        {showOrderMenu && (

            <div className="order-menu">

                {/* VIEW ALL ORDERS */}

                <button
                    className="order-menu-item"
                    onClick={() => {

                        setShowOrderMenu(false);

                        setActiveOrderView("all");

                        setActiveOrderStatus("all");

                    }}
                >
                    View All Orders
                </button>


                {/* ORDER REPORT */}

                <button
                    className="order-menu-item"
                    onClick={() => {

                        setShowOrderMenu(false);

                        setActiveOrderView("report");

                    }}
                >
                    Order Report
                </button>

            </div>

        )}

    </div>


    {/* =========================================
        ORDER STATUS
    ========================================== */}

    <div className="order-summary">


        {/* =====================================
            PENDING
        ====================================== */}

        <div
            className={
                activeOrderStatus === "pending"
                    ? "order-status selected"
                    : "order-status"
            }

            onClick={() => {

                setActiveOrderStatus("pending");

                setActiveOrderView("summary");

                setShowOrderMenu(false);

            }}
        >

            <div className="status-circle pending">

                <i className="fa-solid fa-clock"></i>

            </div>


            <div>

                <h4>
                    Pending
                </h4>

                <p>
                    {(stats.status_counts && (stats.status_counts["Pending"] || stats.status_counts["Order Confirmed"])) || 24} Orders
                </p>

            </div>

        </div>


        {/* =====================================
            PROCESSING
        ====================================== */}

        <div
            className={
                activeOrderStatus === "processing"
                    ? "order-status selected"
                    : "order-status"
            }

            onClick={() => {

                setActiveOrderStatus("processing");

                setActiveOrderView("summary");

                setShowOrderMenu(false);

            }}
        >

            <div className="status-circle processing">

                <i className="fa-solid fa-box-open"></i>

            </div>


            <div>

                <h4>
                    Processing
                </h4>

                <p>
                    {(stats.status_counts && stats.status_counts["Processing"]) || 38} Orders
                </p>

            </div>

        </div>


        {/* =====================================
            SHIPPED
        ====================================== */}

        <div
            className={
                activeOrderStatus === "shipped"
                    ? "order-status selected"
                    : "order-status"
            }

            onClick={() => {

                setActiveOrderStatus("shipped");

                setActiveOrderView("summary");

                setShowOrderMenu(false);

            }}
        >

            <div className="status-circle shipped">

                <i className="fa-solid fa-truck"></i>

            </div>


            <div>

                <h4>
                    Shipped
                </h4>

                <p>
                    {(stats.status_counts && stats.status_counts["Shipped"]) || 52} Orders
                </p>

            </div>

        </div>


        {/* =====================================
            DELIVERED
        ====================================== */}

        <div
            className={
                activeOrderStatus === "delivered"
                    ? "order-status selected"
                    : "order-status"
            }

            onClick={() => {

                setActiveOrderStatus("delivered");

                setActiveOrderView("summary");

                setShowOrderMenu(false);

            }}
        >

            <div className="status-circle delivered">

                <i className="fa-solid fa-check"></i>

            </div>


            <div>

                <h4>
                    Delivered
                </h4>

                <p>
                    {(stats.status_counts && stats.status_counts["Delivered"]) || 86} Orders
                </p>

            </div>

        </div>


    </div>

</div>


</section>
                        {/* =========================================
                AI BUSINESS ASSISTANT
            ========================================= */}

            <section className="dashboard-panel ai-admin-section">


                {/* AI HEADER */}

                <div className="ai-admin-header">

                    <div>

                        <h2>

                            <i className="fa-solid fa-robot"></i>

                            AI Business Assistant

                        </h2>

                        <p>
                            Smart insights to help you manage Bad Teddy.
                        </p>

                    </div>


                    <button
                        className="ai-report-btn"
                        onClick={() => goToPage("Reports")}
                    >

                        <i className="fa-solid fa-wand-magic-sparkles"></i>

                        Generate AI Report

                    </button>

                </div>


                {/* AI INSIGHTS */}

                <div className="ai-insights-grid">

   

                    <div className="ai-insight-card">

                        <div className="ai-insight-icon">

                            <i className="fa-solid fa-chart-line"></i>

                        </div>


                        <div>

                            <h3>
                                Sales Insight
                            </h3>

                            <p>
                                Your sales increased by
                                <strong> 12.5%</strong> this month.
                            </p>

                            <span>
                                Keep promoting your best-selling products.
                            </span>

                        </div>

                    </div>



                    {/* INVENTORY INSIGHT */}

                    <div className="ai-insight-card">

                        <div className="ai-insight-icon">

                            <i className="fa-solid fa-boxes-stacked"></i>

                        </div>


                        <div>

                            <h3>
                                Inventory Alert
                            </h3>

                            <p>
                                <strong>4 products</strong> are running
                                low on stock.
                            </p>

                            <span>
                                Consider restocking them soon.
                            </span>

                        </div>

                    </div>



                    {/* CUSTOMER INSIGHT */}

                    <div className="ai-insight-card">

                        <div className="ai-insight-icon">

                            <i className="fa-solid fa-users"></i>

                        </div>


                        <div>

                            <h3>
                                Customer Insight
                            </h3>

                            <p>
                                Customer activity increased by
                                <strong> 15.8%</strong>.
                            </p>

                            <span>
                                Your store is gaining more customers.
                            </span>

                        </div>

                    </div>



                    {/* PRODUCT INSIGHT */}

                    <div className="ai-insight-card">

                        <div className="ai-insight-icon">

                            <i className="fa-solid fa-fire"></i>

                        </div>


                        <div>

                            <h3>
                                Best Seller
                            </h3>

                            <p>
                                <strong>Oversized Hoodie</strong>
                                is your top-performing product.
                            </p>

                            <span>
                                Consider increasing its inventory.
                            </span>

                        </div>

                    </div>

                </div>

            </section>



            {/* =========================================
                QUICK ACTIONS
            ========================================= */}

            <section className="dashboard-panel quick-actions-panel">


                <div className="panel-header">

                    <div>

                        <h2>
                            Quick Actions
                        </h2>

                        <p>
                            Manage your store quickly.
                        </p>

                    </div>

                </div>


                <div className="quick-actions-grid">


                    {/* ADD PRODUCT */}

                    <button
                        className="quick-action"
                        onClick={() => goToPage("Products")}
                    >

                        <i className="fa-solid fa-plus"></i>

                        <div>

                            <h3>
                                Add Product
                            </h3>

                            <p>
                                Add a new product to your store.
                            </p>

                        </div>

                    </button>



                    {/* MANAGE PRODUCTS */}

                    <button
                        className="quick-action"
                        onClick={() => goToPage("Products")}
                    >

                        <i className="fa-solid fa-box"></i>

                        <div>

                            <h3>
                                Manage Products
                            </h3>

                            <p>
                                Update products and inventory.
                            </p>

                        </div>

                    </button>



                    {/* VIEW ORDERS */}

                    <button
                        className="quick-action"
                        onClick={() => goToPage("Orders")}
                    >

                        <i className="fa-solid fa-cart-shopping"></i>

                        <div>

                            <h3>
                                View Orders
                            </h3>

                            <p>
                                Check recent customer orders.
                            </p>

                        </div>

                    </button>



                    {/* VIEW REPORTS */}

                    <button
                        className="quick-action"
                        onClick={() => goToPage("Reports")}
                    >

                        <i className="fa-solid fa-chart-column"></i>

                        <div>

                            <h3>
                                View Reports
                            </h3>

                            <p>
                                Analyze your store performance.
                            </p>

                        </div>

                    </button>

                </div>

            </section>



            {/* =========================================
                FOOTER
            ========================================= */}

            <footer className="admin-footer">

                <p>
                    © 2026 Bad Teddy Admin Panel
                </p>

                <p>
                    Built using React • PHP • MySQL
                </p>

            </footer>


        </main>

    </div>

    );

}

export default Dashboard;
