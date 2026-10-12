import React, { useMemo, useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/admin-report.css";
import { useNavigate } from "react-router-dom";
import myLogo from "../assets/mylogo.png";


function Adminreports() {
    const navigate = useNavigate();

    /* =========================================
       FILTER STATES
    ========================================== */

    const [reportType, setReportType] = useState("Sales Report");

    const [timePeriod, setTimePeriod] = useState("This Month");

    const [fromDate, setFromDate] = useState("");

    const [toDate, setToDate] = useState("");

    const [searchTerm, setSearchTerm] = useState("");


    /* =========================================
       REPORT STATE
    ========================================== */

    const [reportGenerated, setReportGenerated] = useState(false);

    const [lastGeneratedReport, setLastGeneratedReport] =
        useState(null);


    /* =========================================
       BUSINESS DATA & API INTEGRATION
    ========================================== */

    const [orders, setOrders] = useState([

        {
            id: "BT1001",
            customer: "Aarav Shah",
            product: "Oversized Teddy Tee",
            amount: 1800,
            status: "Delivered",
            date: "2026-08-02"
        },

        {
            id: "BT1002",
            customer: "Riya Patel",
            product: "Bad Teddy Hoodie",
            amount: 2500,
            status: "Delivered",
            date: "2026-08-04"
        },

        {
            id: "BT1003",
            customer: "Zoya Khan",
            product: "Teddy Cargo Pants",
            amount: 3200,
            status: "Processing",
            date: "2026-08-05"
        },

        {
            id: "BT1004",
            customer: "Kabir Mehta",
            product: "Premium Crop Top",
            amount: 1500,
            status: "Shipped",
            date: "2026-08-07"
        },

        {
            id: "BT1005",
            customer: "Anaya Singh",
            product: "Oversized Teddy Tee",
            amount: 1800,
            status: "Delivered",
            date: "2026-08-09"
        }

    ]);

    const fetchReportData = async () => {
        try {
            const ordRes = await fetch("http://localhost/BAD%20TEDDY/backend/api/orders.php?admin=1");
            const ordData = await ordRes.json();
            if (ordData.success && Array.isArray(ordData.orders) && ordData.orders.length > 0) {
                const mappedOrders = ordData.orders.map((o) => {
                    const dateStr = o.created_at ? o.created_at.split(" ")[0] : new Date().toISOString().split("T")[0];
                    const custName = ((o.first_name || "") + " " + (o.last_name || "")).trim() || (o.email || "Customer");
                    const firstProd = (o.items && o.items.length > 0) ? o.items[0].product_name : "Bad Teddy Streetwear";
                    return {
                        id: o.order_number || ("BT" + o.id),
                        customer: custName,
                        product: firstProd,
                        amount: Number(o.total || 0),
                        status: o.status || "Delivered",
                        date: dateStr
                    };
                });
                setOrders(mappedOrders);
            }
        } catch (err) {
            console.error("Error loading report data:", err);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, []);


    /* =========================================
       CUSTOMER DATA
    ========================================== */

    const [customers] = useState([

        {
            id: 1,
            name: "Aarav Shah",
            email: "aarav@gmail.com"
        },

        {
            id: 2,
            name: "Riya Patel",
            email: "riya@gmail.com"
        },

        {
            id: 3,
            name: "Zoya Khan",
            email: "zoya@gmail.com"
        },

        {
            id: 4,
            name: "Kabir Mehta",
            email: "kabir@gmail.com"
        },

        {
            id: 5,
            name: "Anaya Singh",
            email: "anaya@gmail.com"
        },

        {
            id: 6,
            name: "Vivaan Joshi",
            email: "vivaan@gmail.com"
        },

        {
            id: 7,
            name: "Meera Shah",
            email: "meera@gmail.com"
        },

        {
            id: 8,
            name: "Arjun Patel",
            email: "arjun@gmail.com"
        },

        {
            id: 9,
            name: "Sara Khan",
            email: "sara@gmail.com"
        },

        {
            id: 10,
            name: "Dev Malhotra",
            email: "dev@gmail.com"
        }

    ]);


    /* =========================================
       PRODUCT DATA
    ========================================== */

    const [products] = useState([

        {
            id: 1,
            name: "Oversized Teddy Tee",
            price: 1800,
            stock: 25
        },

        {
            id: 2,
            name: "Bad Teddy Hoodie",
            price: 2500,
            stock: 18
        },

        {
            id: 3,
            name: "Teddy Cargo Pants",
            price: 3200,
            stock: 12
        },

        {
            id: 4,
            name: "Premium Crop Top",
            price: 1500,
            stock: 20
        }

    ]);


    /* =========================================
       FILTER ORDERS
    ========================================== */

    const filteredOrders = useMemo(() => {

        let result = [...orders];


        /* SEARCH */

        if (searchTerm.trim() !== "") {

            const search = searchTerm
                .toLowerCase()
                .trim();

            result = result.filter((order) =>

                order.id.toLowerCase().includes(search) ||

                order.customer.toLowerCase().includes(search) ||

                order.product.toLowerCase().includes(search) ||

                order.status.toLowerCase().includes(search)

            );

        }


        /* CUSTOM DATE FILTER */

        if (
            timePeriod === "Custom Range" &&
            fromDate &&
            toDate
        ) {

            result = result.filter((order) =>

                order.date >= fromDate &&
                order.date <= toDate

            );

        }


        return result;

    }, [
        orders,
        searchTerm,
        timePeriod,
        fromDate,
        toDate
    ]);


    /* =========================================
       REPORT CALCULATIONS
    ========================================== */

    const reportData = useMemo(() => {

        const totalSales = filteredOrders.reduce(
            (total, order) => {

                if (order.status !== "Cancelled") {

                    return total + order.amount;

                }

                return total;

            },

            0
        );


        const totalOrders = filteredOrders.length;


        const deliveredOrders =
            filteredOrders.filter(
                order =>
                    order.status === "Delivered"
            ).length;


        const averageOrderValue =
            totalOrders > 0
                ? Math.round(totalSales / totalOrders)
                : 0;


        const uniqueCustomers =
            new Set(
                filteredOrders.map(
                    order => order.customer
                )
            ).size;


        return {

            totalSales,

            totalOrders,

            customers:
                uniqueCustomers ||
                customers.length,

            averageOrderValue,

            deliveredOrders

        };

    }, [
        filteredOrders,
        customers.length
    ]);


    // page navigation logic
    const goToPage = (page) => {

    switch (page) {

        case "Dashboard":
            navigate("/");
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
            navigate("/ai-insights");
            break;

        case "Reports":
            navigate("/reports");
            break;

        case "Settings":
            navigate("/settings");
            break;

        default:
            break;
    }

};



    /* =========================================
       DYNAMIC SALES DATA
    ========================================== */

    const salesData = useMemo(() => {

        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun"
        ];


        /* =====================================
           CALCULATE SALES FOR EACH MONTH
        ====================================== */

        const monthlySales = months.map(
            (month) => {

                const monthNumber =
                    months.indexOf(month) + 1;


                const monthOrders =
                    filteredOrders.filter(
                        (order) => {

                            const orderMonth =
                                new Date(
                                    order.date
                                ).getMonth() + 1;

                            return (
                                orderMonth ===
                                monthNumber
                            );

                        }
                    );


                const sales =
                    monthOrders.reduce(
                        (total, order) => {

                            if (
                                order.status ===
                                "Cancelled"
                            ) {

                                return total;

                            }


                            return (
                                total +
                                order.amount
                            );

                        },

                        0
                    );


                return {

                    month,

                    sales,

                    value: sales

                };

            }
        );


        /* =====================================
           FIND HIGHEST SALES
           Used to calculate bar height
        ====================================== */

        const highestSales =
            Math.max(
                ...monthlySales.map(
                    item => item.sales
                ),
                1
            );


        /* =====================================
           CONVERT SALES INTO BAR %
        ====================================== */

        return monthlySales.map(
            (item) => ({

                ...item,

                value:
                    item.sales === 0
                        ? 5
                        :
                        Math.max(
                            10,
                            (
                                item.sales /
                                highestSales
                            ) * 100
                        )

            })
        );


    }, [filteredOrders]);


    /* =========================================
       TOP PRODUCTS
    ========================================== */

    const topProducts = useMemo(() => {

        const productSales = {};


        filteredOrders.forEach((order) => {

            if (order.status === "Cancelled") {
                return;
            }


            if (!productSales[order.product]) {

                productSales[order.product] = {

                    name: order.product,

                    units: 0,

                    revenue: 0

                };

            }


            productSales[order.product].units += 1;

            productSales[order.product].revenue +=
                order.amount;

        });


        return Object.values(productSales)

            .sort(
                (a, b) =>
                    b.revenue - a.revenue
            )

            .slice(0, 4)

            .map((product, index) => ({

                ...product,

                rank:
                    String(index + 1)
                        .padStart(2, "0")

            }));


    }, [filteredOrders]);


    /* =========================================
       ORDER SUMMARY
    ========================================== */

    const orderSummary = useMemo(() => {

        const statuses = [

            {
                name: "Pending",

                icon: "fa-clock"

            },

            {
                name: "Processing",

                icon: "fa-box"

            },

            {
                name: "Shipped",

                icon: "fa-truck"

            },

            {
                name: "Delivered",

                icon: "fa-circle-check"

            },

            {
                name: "Cancelled",

                icon: "fa-circle-xmark",

                cancelled: true

            }

        ];


        return statuses.map((status) => ({

            ...status,

            value:
                filteredOrders.filter(
                    order =>
                        order.status === status.name
                ).length

        }));


    }, [filteredOrders]);


    /* =========================================
       AI INSIGHTS
    ========================================== */

    const generateAIInsights = () => {

        const insights = [];


        /* SALES INSIGHT */

        if (reportData.totalSales > 10000) {

            insights.push({

                title: "Strong Sales",

                icon: "fa-arrow-trend-up",

                text:
                    `Your current sales are ₹${reportData.totalSales.toLocaleString("en-IN")}. Sales performance is looking strong.`

            });

        } else {

            insights.push({

                title: "Sales Opportunity",

                icon: "fa-chart-line",

                text:
                    "Sales are currently lower than expected. Consider promotional offers to increase conversions."

            });

        }


        /* PRODUCT INSIGHT */

        if (topProducts.length > 0) {

            insights.push({

                title: "Best Performer",

                icon: "fa-star",

                text:
                    `${topProducts[0].name} is currently your best-performing product with ${topProducts[0].units} units sold.`

            });

        }


        /* CUSTOMER INSIGHT */

        insights.push({

            title: "Customer Trend",

            icon: "fa-users",

            text:
                `${reportData.customers} customers are represented in the current report.`

        });


        /* ORDER INSIGHT */

        if (reportData.deliveredOrders > 0) {

            insights.push({

                title: "Order Performance",

                icon: "fa-circle-check",

                text:
                    `${reportData.deliveredOrders} orders have been successfully delivered.`

            });

        }


        return insights;

    };


    const [aiInsights, setAiInsights] =
        useState(
            generateAIInsights()
        );


    /* =========================================
       APPLY FILTERS
    ========================================== */

    const applyFilters = () => {

        setReportGenerated(false);

        setTimeout(() => {

            setReportGenerated(true);

            setAiInsights(
                generateAIInsights()
            );

        }, 100);

    };


    /* =========================================
       GENERATE REPORT
    ========================================== */

    const generateReport = () => {

        const generatedReport = {

            type: reportType,

            period: timePeriod,

            from:
                fromDate || "Not selected",

            to:
                toDate || "Not selected",

            totalSales:
                reportData.totalSales,

            totalOrders:
                reportData.totalOrders,

            customers:
                reportData.customers,

            averageOrderValue:
                reportData.averageOrderValue

        };


        setLastGeneratedReport(
            generatedReport
        );


        setReportGenerated(true);


        setAiInsights(
            generateAIInsights()
        );

    };


    /* =========================================
       REFRESH AI INSIGHTS
    ========================================== */

    const refreshInsights = () => {

        const newInsights =
            generateAIInsights();


        setAiInsights(
            newInsights
        );

    };


    /* =========================================
       EXPORT REPORT
    ========================================== */

    const exportReport = () => {

        const headers = [

            "Order ID",

            "Customer",

            "Product",

            "Amount",

            "Status",

            "Date"

        ];


        const rows =
            filteredOrders.map(
                (order) => [

                    order.id,

                    order.customer,

                    order.product,

                    order.amount,

                    order.status,

                    order.date

                ]
            );


        const csv = [

            headers.join(","),

            ...rows.map(
                (row) =>

                    row
                        .map(
                            (value) =>

                                `"${String(value)
                                    .replaceAll(
                                        '"',
                                        '""'
                                    )}"`
                        )
                        .join(",")

            )

        ].join("\n");


        const blob = new Blob(

            [csv],

            {
                type:
                    "text/csv;charset=utf-8;"
            }

        );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href = url;

        link.download =
            "bad-teddy-report.csv";


        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);


        URL.revokeObjectURL(url);

    };
        /* =========================================
       NAVIGATION FUNCTIONS
    ========================================== */

    const goToDashboard = () => {

        navigate("/dashboard");

    };


    const goToProducts = () => {

        navigate("/products");

    };


    const goToOrders = () => {

        navigate("/orders");

    };


    const goToCustomers = () => {

        navigate("/customers");

    };


    const goToReports = () => {

        navigate("/reports");

    };


    const goToSettings = () => {

        navigate("/settings");

    };


    const logout = () => {
        const confirmLogout = window.confirm("Are you sure you want to logout from Admin Panel?");
        if (confirmLogout) {
            localStorage.removeItem("badTeddyAdminUser");
            localStorage.removeItem("badTeddyAdminToken");
            navigate("/admin/login");
        }
    };


    /* =========================================
       PAGE JSX
    ========================================== */

    return (

        <div className="admin-container">

            {/* UNIFIED ADMIN SIDEBAR */}
            <AdminSidebar activePage="Reports" />

            {/* =========================================
                MAIN CONTENT
            ========================================== */}

            <main className="main-content">


                {/* =========================================
                    TOP HEADER
                ========================================== */}

                <header className="top-header">


                    {/* =====================================
                        SEARCH BOX
                    ====================================== */}

                    <div className="search-box">

                        <i className="fa-solid fa-magnifying-glass"></i>


                        <input
                            type="text"
                            placeholder="Search orders, customers, products..."
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(e.target.value)
                            }
                        />


                        {/* CLEAR SEARCH */}

                        {searchTerm && (

                            <button
                                className="clear-search"
                                onClick={() =>
                                    setSearchTerm("")
                                }
                                title="Clear search"
                            >

                                <i className="fa-solid fa-xmark"></i>

                            </button>

                        )}

                    </div>



                    {/* =====================================
                        HEADER RIGHT
                    ====================================== */}

                    <div className="header-right">


                        {/* NOTIFICATION */}

                        <button
                            className="header-icon-btn"
                            onClick={() =>
                                alert(
                                    "You have new admin notifications."
                                )
                            }
                            title="Notifications"
                        >

                            <i className="fa-regular fa-bell"></i>

                            <span className="notification-dot"></span>

                        </button>



                        {/* DARK MODE */}

                        <button
                            className="header-icon-btn"
                            onClick={() =>
                                alert(
                                    "Dark mode is already enabled."
                                )
                            }
                            title="Theme"
                        >

                            <i className="fa-solid fa-moon"></i>

                        </button>



                        {/* =================================
                            ADMIN PROFILE
                        ================================== */}

                        <div className="admin-profile">


                            <div className="admin-avatar">

                                A

                            </div>


                            <div>

                                <h4>
                                    Admin
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
                ========================================== */}

                <section className="page-title">


                    <div>

                        <h1>
                            Reports
                        </h1>


                        <p>
                            Generate and analyze Bad Teddy business reports.
                        </p>


                    </div>



                    {/* =====================================
                        GENERATE REPORT BUTTON
                    ====================================== */}

                    <button
                        className="generate-btn"
                        onClick={generateReport}
                    >

                        <i className="fa-solid fa-file-circle-plus"></i>

                        Generate Report

                    </button>


                </section>
                                {/* =========================================
                    REPORT FILTERS
                ========================================== */}

                <section className="report-filters">


                    {/* =====================================
                        REPORT TYPE
                    ====================================== */}

                    <div className="filter-group">

                        <label>
                            Report Type
                        </label>


                        <select
                            value={reportType}
                            onChange={(e) =>
                                setReportType(
                                    e.target.value
                                )
                            }
                        >

                            <option value="Sales Report">
                                Sales Report
                            </option>


                            <option value="Product Report">
                                Product Report
                            </option>


                            <option value="Order Report">
                                Order Report
                            </option>


                            <option value="Customer Report">
                                Customer Report
                            </option>

                        </select>

                    </div>



                    {/* =====================================
                        TIME PERIOD
                    ====================================== */}

                    <div className="filter-group">

                        <label>
                            Time Period
                        </label>


                        <select
                            value={timePeriod}
                            onChange={(e) =>
                                setTimePeriod(
                                    e.target.value
                                )
                            }
                        >

                            <option value="This Month">
                                This Month
                            </option>


                            <option value="Last Month">
                                Last Month
                            </option>


                            <option value="Last 3 Months">
                                Last 3 Months
                            </option>


                            <option value="This Year">
                                This Year
                            </option>


                            <option value="Custom Range">
                                Custom Range
                            </option>

                        </select>

                    </div>



                    {/* =====================================
                        FROM DATE
                    ====================================== */}

                    <div className="filter-group">

                        <label>
                            From
                        </label>


                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) =>
                                setFromDate(
                                    e.target.value
                                )
                            }
                        />

                    </div>



                    {/* =====================================
                        TO DATE
                    ====================================== */}

                    <div className="filter-group">

                        <label>
                            To
                        </label>


                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) =>
                                setToDate(
                                    e.target.value
                                )
                            }
                        />

                    </div>



                    {/* =====================================
                        APPLY FILTERS
                    ====================================== */}

                    <button
                        className="apply-btn"
                        onClick={applyFilters}
                    >

                        <i className="fa-solid fa-filter"></i>

                        Apply

                    </button>


                </section>
                                {/* =========================================
                    REPORT OVERVIEW
                ========================================== */}

                <section className="report-overview">


                    {/* =====================================
                        TOTAL SALES
                    ====================================== */}

                    <div className="overview-card">


                        <div className="overview-icon sales">

                            <i className="fa-solid fa-indian-rupee-sign"></i>

                        </div>


                        <div>

                            <span>
                                Total Sales
                            </span>


                            <h2>
                                ₹
                                {reportData.totalSales.toLocaleString("en-IN")}
                            </h2>


                            <p className="positive">

                                <i className="fa-solid fa-arrow-up"></i>

                                Based on current report data

                            </p>

                        </div>


                    </div>



                    {/* =====================================
                        TOTAL ORDERS
                    ====================================== */}

                    <div className="overview-card">


                        <div className="overview-icon orders">

                            <i className="fa-solid fa-cart-shopping"></i>

                        </div>


                        <div>

                            <span>
                                Total Orders
                            </span>


                            <h2>
                                {reportData.totalOrders}
                            </h2>


                            <p className="positive">

                                <i className="fa-solid fa-chart-line"></i>

                                Current filtered orders

                            </p>

                        </div>


                    </div>



                    {/* =====================================
                        CUSTOMERS
                    ====================================== */}

                    <div className="overview-card">


                        <div className="overview-icon customers">

                            <i className="fa-solid fa-users"></i>

                        </div>


                        <div>

                            <span>
                                Customers
                            </span>


                            <h2>
                                {reportData.customers}
                            </h2>


                            <p className="positive">

                                <i className="fa-solid fa-user"></i>

                                Customers in report

                            </p>

                        </div>


                    </div>



                    {/* =====================================
                        AVERAGE ORDER VALUE
                    ====================================== */}

                    <div className="overview-card">


                        <div className="overview-icon average">

                            <i className="fa-solid fa-chart-line"></i>

                        </div>


                        <div>

                            <span>
                                Average Order Value
                            </span>


                            <h2>
                                ₹
                                {reportData.averageOrderValue.toLocaleString(
                                    "en-IN"
                                )}
                            </h2>


                            <p className="positive">

                                <i className="fa-solid fa-calculator"></i>

                                Calculated from orders

                            </p>

                        </div>


                    </div>


                </section>
                                {/* =========================================
                    SALES OVERVIEW
                ========================================== */}

                <section className="report-section">


                    {/* =====================================
                        SECTION HEADER
                    ====================================== */}

                    <div className="section-header">


                        <div>

                            <h2>
                                Sales Overview
                            </h2>


                            <p>
                                Monthly sales performance
                            </p>

                        </div>



                        {/* =================================
                            EXPORT REPORT
                        ================================== */}

                        <button
                            className="export-btn"
                            onClick={exportReport}
                        >

                            <i className="fa-solid fa-download"></i>

                            Export Report

                        </button>


                    </div>



                    {/* =====================================
                        SALES CHART
                    ====================================== */}

                    <div className="chart-container">


                        <div className="chart-bars">


                            {salesData.map(
                                (item, index) => (

                                    <div
                                        className="bar-item"
                                        key={index}
                                    >


                                        {/* BAR */}

                                        <div
                                            className="bar"
                                            style={{
                                                height:
                                                    `${item.value}%`
                                            }}
                                            title={
                                                `${item.month}: ₹${item.sales.toLocaleString("en-IN")}`
                                            }
                                        >
                                        </div>



                                        {/* MONTH */}

                                        <span>
                                            {item.month}
                                        </span>


                                    </div>

                                )
                            )}


                        </div>


                    </div>


                </section>
                                {/* =========================================
                    TOP PRODUCTS + ORDER SUMMARY
                ========================================== */}

                <section className="reports-grid">


                    {/* =====================================
                        TOP PRODUCTS
                    ====================================== */}

                    <div className="report-box">


                        <div className="section-header">

                            <div>

                                <h2>
                                    Top Products
                                </h2>

                                <p>
                                    Best performing products
                                </p>

                            </div>

                        </div>



                        <div className="product-report">


                            {topProducts.length > 0 ? (

                                topProducts.map(
                                    (product) => (

                                        <div
                                            className="product-row"
                                            key={product.name}
                                        >


                                            {/* RANK */}

                                            <div className="product-rank">

                                                {product.rank}

                                            </div>



                                            {/* PRODUCT DETAILS */}

                                            <div className="product-details">

                                                <h4>
                                                    {product.name}
                                                </h4>


                                                <p>
                                                    {product.units} units sold
                                                </p>

                                            </div>



                                            {/* REVENUE */}

                                            <strong>

                                                ₹
                                                {product.revenue.toLocaleString(
                                                    "en-IN"
                                                )}

                                            </strong>


                                        </div>

                                    )
                                )

                            ) : (

                                <div className="empty-report">

                                    <i className="fa-solid fa-box-open"></i>

                                    <p>
                                        No product data available.
                                    </p>

                                </div>

                            )}


                        </div>


                    </div>



                    {/* =====================================
                        ORDER SUMMARY
                    ====================================== */}

                    <div className="report-box">


                        <div className="section-header">

                            <div>

                                <h2>
                                    Order Summary
                                </h2>

                                <p>
                                    Current order status
                                </p>

                            </div>

                        </div>



                        <div className="order-summary">


                            {orderSummary.map(
                                (order) => (

                                    <div
                                        className={
                                            `summary-row ${
                                                order.cancelled
                                                    ? "cancelled"
                                                    : ""
                                            }`
                                        }
                                        key={order.name}
                                    >


                                        {/* STATUS */}

                                        <span>

                                            <i
                                                className={
                                                    `fa-solid ${order.icon}`
                                                }
                                            ></i>

                                            {order.name}

                                        </span>



                                        {/* COUNT */}

                                        <strong>

                                            {order.value}

                                        </strong>


                                    </div>

                                )
                            )}


                        </div>


                    </div>


                </section>
                                {/* =========================================
                    AI BUSINESS INSIGHTS
                ========================================== */}

                <section className="ai-insights">


                    {/* =====================================
                        AI HEADER
                    ====================================== */}

                    <div className="ai-header">


                        <div className="ai-title">


                            <div className="ai-icon">

                                <i className="fa-solid fa-wand-magic-sparkles"></i>

                            </div>


                            <div>

                                <h2>
                                    AI Business Insights
                                </h2>

                                <p>
                                    Smart recommendations based on your current business data.
                                </p>

                            </div>


                        </div>



                        {/* =================================
                            REFRESH AI
                        ================================== */}

                        <button
                            className="generate-ai-btn"
                            onClick={refreshInsights}
                        >

                            <i className="fa-solid fa-rotate"></i>

                            Refresh Insights

                        </button>


                    </div>



                    {/* =====================================
                        AI INSIGHT CARDS
                    ====================================== */}

                    <div className="ai-content">


                        {aiInsights.length > 0 ? (

                            aiInsights.map(
                                (insight, index) => (

                                    <div
                                        className="ai-insight-card"
                                        key={index}
                                    >


                                        {/* ICON */}

                                        <i
                                            className={
                                                `fa-solid ${insight.icon}`
                                            }
                                        ></i>



                                        {/* TITLE */}

                                        <h3>
                                            {insight.title}
                                        </h3>



                                        {/* INSIGHT */}

                                        <p>
                                            {insight.text}
                                        </p>


                                    </div>

                                )
                            )

                        ) : (

                            <div className="empty-report">

                                <i className="fa-solid fa-robot"></i>

                                <p>
                                    No insights available for the current report.
                                </p>

                            </div>

                        )}


                    </div>


                </section>



                {/* =========================================
                    GENERATED REPORT STATUS
                ========================================== */}

                {lastGeneratedReport && (

                    <div className="generated-report">


                        <div className="generated-report-icon">

                            <i className="fa-solid fa-circle-check"></i>

                        </div>


                        <div className="generated-report-info">

                            <h4>
                                Report Generated Successfully
                            </h4>


                            <p>

                                {lastGeneratedReport.type}

                                {" • "}

                                {lastGeneratedReport.period}

                                {" • "}

                                {lastGeneratedReport.totalOrders}

                                {" orders"}

                            </p>

                        </div>


                        <div className="generated-report-value">

                            ₹
                            {lastGeneratedReport.totalSales.toLocaleString(
                                "en-IN"
                            )}

                        </div>


                    </div>

                )}



                {/* =========================================
                    FOOTER
                ========================================== */}

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


export default Adminreports;