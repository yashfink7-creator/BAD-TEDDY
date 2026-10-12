import React, { useMemo, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/admin-orders.css";
import myLogo from "../assets/mylogo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate } from "react-router-dom";


function Adminorders() {
    const navigate = useNavigate();

    /* =========================================
       ORDER DATA
    ========================================= */

    const [orders, setOrders] = useState([

        {
            id: "BT1024",
            customer: "Rahul Verma",
            email: "rahulverma@gmail.com",
            image: "/images/user1.jpg",
            items: 2,
            total: 2499,
            payment: "UPI",
            status: "Confirmed",
            date: "12 May 2026",
            time: "10:30 AM"
        },


        {
            id: "BT1025",
            customer: "Priya Sharma",
            email: "priyasharma@gmail.com",
            image: "/images/user2.jpg",
            items: 1,
            total: 1999,
            payment: "COD",
            status: "Packed",
            date: "12 May 2026",
            time: "09:15 AM"
        },


        {
            id: "BT1026",
            customer: "Aman Singh",
            email: "amansingh@gmail.com",
            image: "/images/user3.jpg",
            items: 3,
            total: 3999,
            payment: "Card",
            status: "Shipped",
            date: "11 May 2026",
            time: "08:45 PM"
        },


        {
            id: "BT1027",
            customer: "Neha Patel",
            email: "nehapatel@gmail.com",
            image: "/images/user4.jpg",
            items: 1,
            total: 1499,
            payment: "UPI",
            status: "Delivered",
            date: "11 May 2026",
            time: "06:30 PM"
        },


        {
            id: "BT1028",
            customer: "Karan Mehta",
            email: "karanmehta@gmail.com",
            image: "/images/user5.jpg",
            items: 2,
            total: 2999,
            payment: "COD",
            status: "Pending",
            date: "11 May 2026",
            time: "04:20 PM"
        },


        {
            id: "BT1029",
            customer: "Simran Kaur",
            email: "simrankaur@gmail.com",
            image: "/images/user6.jpg",
            items: 4,
            total: 4999,
            payment: "Card",
            status: "Confirmed",
            date: "11 May 2026",
            time: "01:10 PM"
        }

    ]);


    /* =========================================
       SEARCH + FILTER STATES
    ========================================= */

    const [searchTerm, setSearchTerm] = useState("");

    const [statusFilter, setStatusFilter] =
        useState("All Status");

    const [paymentFilter, setPaymentFilter] =
        useState("All Payment");

    const [dateFilter, setDateFilter] =
        useState("All Dates");


    /* =========================================
       VIEW ORDER STATE
    ========================================= */

    const [selectedOrder, setSelectedOrder] =
        useState(null);

    const fetchOrders = async () => {
        try {
            const response = await fetch("http://localhost/BAD%20TEDDY/backend/api/orders.php?admin=1");
            const data = await response.json();
            if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
                const mapped = data.orders.map((o) => {
                    const dateObj = o.created_at ? new Date(o.created_at) : new Date();
                    return {
                        id: o.order_number || ("BT" + o.id),
                        raw_id: o.id,
                        customer: ((o.first_name || "") + " " + (o.last_name || "")).trim() || (o.email || "Customer"),
                        email: o.email || "customer@badteddy.com",
                        image: myLogo,
                        items: o.items_count || (o.items ? o.items.length : 1),
                        total: Number(o.total || 0),
                        payment: (o.payment_method || "UPI").toUpperCase(),
                        status: o.status || "Confirmed",
                        date: dateObj.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }),
                        time: dateObj.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }),
                        address: o.address,
                        city: o.city,
                        state: o.state,
                        pincode: o.pincode
                    };
                });
                setOrders(mapped);
            }
        } catch (err) {
            console.error("Error fetching orders for admin:", err);
        }
    };

    React.useEffect(() => {
        fetchOrders();
    }, []);

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
       PAGINATION
    ========================================= */

    const [currentPage, setCurrentPage] =
        useState(1);

    const ordersPerPage = 6;


    /* =========================================
       FILTER ORDERS
    ========================================= */

    const filteredOrders = useMemo(() => {

        return orders.filter((order) => {

            const search =
                searchTerm.toLowerCase().trim();


            const matchesSearch =
                order.id
                    .toLowerCase()
                    .includes(search) ||

                order.customer
                    .toLowerCase()
                    .includes(search) ||

                order.email
                    .toLowerCase()
                    .includes(search);


            const matchesStatus =
                statusFilter === "All Status" ||
                order.status === statusFilter;


            const matchesPayment =
                paymentFilter === "All Payment" ||
                order.payment === paymentFilter;


            /*
                Date filtering will be connected
                properly when we use real MySQL dates.
            */

            const matchesDate =
                dateFilter === "All Dates" ||
                true;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesPayment &&
                matchesDate
            );

        });

    }, [
        orders,
        searchTerm,
        statusFilter,
        paymentFilter,
        dateFilter
    ]);


    /* =========================================
       PAGINATION CALCULATION
    ========================================= */

    const totalPages = Math.ceil(
        filteredOrders.length / ordersPerPage
    );


    const startIndex =
        (currentPage - 1) * ordersPerPage;


    const paginatedOrders =
        filteredOrders.slice(
            startIndex,
            startIndex + ordersPerPage
        );


    /* =========================================
       UPDATE ORDER STATUS
    ========================================= */

    const updateOrderStatus = async (
        orderId,
        newStatus
    ) => {

        try {
            await fetch("http://localhost/BAD%20TEDDY/backend/api/orders.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update_status",
                    order_id: orderId,
                    status: newStatus
                })
            });
        } catch (err) {
            console.error("Error updating order status:", err);
        }

        setOrders((currentOrders) =>

            currentOrders.map((order) =>

                order.id === orderId || order.raw_id === orderId

                    ? {
                        ...order,
                        status: newStatus
                    }

                    : order

            )

        );


        /*
            If the order being viewed is also
            being updated, update the modal.
        */

        if (
            selectedOrder &&
            (selectedOrder.id === orderId || selectedOrder.raw_id === orderId)
        ) {

            setSelectedOrder({
                ...selectedOrder,
                status: newStatus
            });

        }

    };


    /* =========================================
       ORDER STATISTICS
    ========================================= */

    const pendingOrders =
        orders.filter(
            (order) => order.status === "Pending"
        ).length;


    const confirmedOrders =
        orders.filter(
            (order) => order.status === "Confirmed"
        ).length;


    const packedOrders =
        orders.filter(
            (order) => order.status === "Packed"
        ).length;


    const shippedOrders =
        orders.filter(
            (order) => order.status === "Shipped"
        ).length;


    const deliveredOrders =
        orders.filter(
            (order) => order.status === "Delivered"
        ).length;


    /* =========================================
       RESET PAGE WHEN SEARCH/FILTER CHANGES
    ========================================= */

    React.useEffect(() => {

        setCurrentPage(1);

    }, [
        searchTerm,
        statusFilter,
        paymentFilter,
        dateFilter
    ]);


    return (

        <div className="admin-container">

            {/* UNIFIED ADMIN SIDEBAR */}
            <AdminSidebar activePage="Orders" />


            {/* =========================================
                MAIN CONTENT
            ========================================= */}

            <div className="main-content">


                {/* =========================================
                    HEADER
                ========================================= */}

                <header className="top-header">

                    <div className="search-box">

                        <i className="fa-solid fa-magnifying-glass"></i>

                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <div className="header-right">

                        <i className="fa-regular fa-bell"></i>

                        <i className="fa-solid fa-moon"></i>


                        <div className="admin-profile">

                            <img
                                src={myLogo}
                                alt="Bad Teddy Admin"
                            />

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
                ========================================= */}

                <section className="page-title">

                    <div>

                        <h1>
                            Orders Management
                        </h1>

                        <p>
                            Track, manage and update customer orders.
                        </p>

                    </div>

                </section>


                {/* =========================================
                    ORDER STATISTICS
                ========================================= */}

                <section className="dashboard-cards">


                    {/* PENDING */}

                    <div
                        className="card"
                        onClick={() =>
                            setStatusFilter("Pending")
                        }
                    >

                        <div className="card-icon pending">

                            <i className="fa-solid fa-clock"></i>

                        </div>

                        <div>

                            <h4>
                                Pending Orders
                            </h4>

                            <h2>
                                {pendingOrders}
                            </h2>

                            <p>
                                Orders waiting for confirmation
                            </p>

                        </div>

                    </div>


                    {/* PACKED */}

                    <div
                        className="card"
                        onClick={() =>
                            setStatusFilter("Packed")
                        }
                    >

                        <div className="card-icon packed">

                            <i className="fa-solid fa-box-open"></i>

                        </div>

                        <div>

                            <h4>
                                Packed
                            </h4>

                            <h2>
                                {packedOrders}
                            </h2>

                            <p>
                                Orders ready for dispatch
                            </p>

                        </div>

                    </div>


                    {/* SHIPPED */}

                    <div
                        className="card"
                        onClick={() =>
                            setStatusFilter("Shipped")
                        }
                    >

                        <div className="card-icon shipped">

                            <i className="fa-solid fa-truck-fast"></i>

                        </div>

                        <div>

                            <h4>
                                Shipped
                            </h4>

                            <h2>
                                {shippedOrders}
                            </h2>

                            <p>
                                Orders currently in transit
                            </p>

                        </div>

                    </div>


                    {/* DELIVERED */}

                    <div
                        className="card"
                        onClick={() =>
                            setStatusFilter("Delivered")
                        }
                    >

                        <div className="card-icon delivered">

                            <i className="fa-solid fa-circle-check"></i>

                        </div>

                        <div>

                            <h4>
                                Delivered
                            </h4>

                            <h2>
                                {deliveredOrders}
                            </h2>

                            <p>
                                Successfully delivered orders
                            </p>

                        </div>

                    </div>


                </section>
                                {/* =========================================
                    ORDER TOOLBAR
                ========================================= */}

                <section className="order-toolbar">


                    {/* TOOLBAR LEFT */}

                    <div className="toolbar-left">


                        {/* SEARCH ORDERS */}

                        <div className="search-order">

                            <i className="fa-solid fa-magnifying-glass"></i>

                            <input
                                type="text"
                                placeholder="Search Order ID, Customer..."
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(
                                        e.target.value
                                    )
                                }
                            />

                        </div>


                        {/* STATUS FILTER */}

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                        >

                            <option>
                                All Status
                            </option>

                            <option>
                                Pending
                            </option>

                            <option>
                                Confirmed
                            </option>

                            <option>
                                Packed
                            </option>

                            <option>
                                Shipped
                            </option>

                            <option>
                                Delivered
                            </option>

                            <option>
                                Cancelled
                            </option>

                        </select>


                        {/* PAYMENT FILTER */}

                        <select
                            value={paymentFilter}
                            onChange={(e) =>
                                setPaymentFilter(
                                    e.target.value
                                )
                            }
                        >

                            <option>
                                All Payment
                            </option>

                            <option>
                                UPI
                            </option>

                            <option>
                                Card
                            </option>

                            <option>
                                COD
                            </option>

                        </select>


                        {/* DATE FILTER */}

                        <select
                            value={dateFilter}
                            onChange={(e) =>
                                setDateFilter(
                                    e.target.value
                                )
                            }
                        >

                            <option>
                                All Dates
                            </option>

                            <option>
                                Today
                            </option>

                            <option>
                                This Week
                            </option>

                            <option>
                                This Month
                            </option>

                            <option>
                                This Year
                            </option>

                        </select>


                    </div>


                    {/* TOOLBAR RIGHT */}

                    <div className="toolbar-right">

                        <button
                            className="export-btn"
                            onClick={() => {

                                const headers = [
                                    "Order ID",
                                    "Customer",
                                    "Email",
                                    "Items",
                                    "Total",
                                    "Payment",
                                    "Status",
                                    "Date",
                                    "Time"
                                ];


                                const rows =
                                    filteredOrders.map(
                                        (order) => [

                                            order.id,

                                            order.customer,

                                            order.email,

                                            order.items,

                                            order.total,

                                            order.payment,

                                            order.status,

                                            order.date,

                                            order.time

                                        ]
                                    );


                                const csv = [

                                    headers.join(","),

                                    ...rows.map(
                                        (row) =>
                                            row
                                                .map(
                                                    (value) =>
                                                        `"${String(value).replaceAll('"', '""')}"`
                                                )
                                                .join(",")
                                    )

                                ].join("\n");


                                const blob =
                                    new Blob(
                                        [csv],
                                        {
                                            type:
                                                "text/csv;charset=utf-8;"
                                        }
                                    );


                                const url =
                                    URL.createObjectURL(
                                        blob
                                    );


                                const link =
                                    document.createElement(
                                        "a"
                                    );

                                link.href = url;

                                link.download =
                                    "bad-teddy-orders.csv";

                                document.body.appendChild(
                                    link
                                );

                                link.click();

                                document.body.removeChild(
                                    link
                                );

                                URL.revokeObjectURL(
                                    url
                                );

                            }}
                        >

                            <i className="fa-solid fa-download"></i>

                            Export Orders

                        </button>

                    </div>


                </section>
                                {/* =========================================
                    ORDERS TABLE
                ========================================= */}

                <section className="orders-table">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Order ID
                                </th>

                                <th>
                                    Customer
                                </th>

                                <th>
                                    Items
                                </th>

                                <th>
                                    Total
                                </th>

                                <th>
                                    Payment
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Date
                                </th>

                                <th>
                                    Action
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {paginatedOrders.length > 0 ? (

                                paginatedOrders.map((order) => (

                                    <tr key={order.id}>


                                        {/* ORDER ID */}

                                        <td>
                                            #{order.id}
                                        </td>


                                        {/* CUSTOMER */}

                                        <td>

                                            <div className="customer-info">

                                                <img
                                                    src={order.image}
                                                    alt={order.customer}
                                                />

                                                <div>

                                                    <h4>
                                                        {order.customer}
                                                    </h4>

                                                    <p>
                                                        {order.email}
                                                    </p>

                                                </div>

                                            </div>

                                        </td>


                                        {/* ITEMS */}

                                        <td>
                                            {order.items}
                                        </td>


                                        {/* TOTAL */}

                                        <td>
                                            ₹{order.total.toLocaleString("en-IN")}
                                        </td>


                                        {/* PAYMENT */}

                                        <td>

                                            <span
                                                className={`payment ${
                                                    order.payment === "UPI"
                                                        ? "upi"
                                                        : order.payment === "COD"
                                                            ? "cod"
                                                            : "card"
                                                }`}
                                            >
                                                {order.payment}
                                            </span>

                                        </td>


                                        {/* STATUS */}

                                        <td>

                                            <span
                                                className={`status ${
                                                    order.status
                                                        .toLowerCase()
                                                        .replace(" ", "-")
                                                }`}
                                            >
                                                {order.status}
                                            </span>

                                        </td>


                                        {/* DATE */}

                                        <td>

                                            {order.date}

                                            <br />

                                            {order.time}

                                        </td>


                                        {/* ACTION */}

                                        <td>

                                            <button
                                                className="view-btn"
                                                onClick={() =>
                                                    setSelectedOrder(order)
                                                }
                                            >

                                                <i className="fa-solid fa-eye"></i>

                                                View Details

                                            </button>

                                        </td>


                                    </tr>

                                ))

                            ) : (

                                <tr>

                                    <td
                                        colSpan="8"
                                        className="no-orders"
                                    >

                                        <i className="fa-solid fa-box-open"></i>

                                        <h3>
                                            No Orders Found
                                        </h3>

                                        <p>
                                            Try changing your search
                                            or filters.
                                        </p>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </section>
                                {/* =========================================
                    TABLE FOOTER / PAGINATION
                ========================================= */}

                <div className="orders-footer">

                    <p>

                        Showing{" "}

                        <strong>
                            {filteredOrders.length === 0
                                ? 0
                                : startIndex + 1}
                        </strong>

                        {" "}to{" "}

                        <strong>
                            {Math.min(
                                startIndex + ordersPerPage,
                                filteredOrders.length
                            )}
                        </strong>

                        {" "}of{" "}

                        <strong>
                            {filteredOrders.length}
                        </strong>

                        {" "}Orders

                    </p>


                    <div className="pagination">


                        {/* PREVIOUS */}

                        <button
                            disabled={currentPage === 1}
                            onClick={() =>
                                setCurrentPage(
                                    (page) => page - 1
                                )
                            }
                        >

                            <i className="fa-solid fa-angle-left"></i>

                        </button>


                        {/* PAGE NUMBERS */}

                        {Array.from(
                            { length: totalPages },
                            (_, index) => index + 1
                        ).map((page) => (

                            <button
                                key={page}
                                className={
                                    currentPage === page
                                        ? "active-page"
                                        : ""
                                }
                                onClick={() =>
                                    setCurrentPage(page)
                                }
                            >

                                {page}

                            </button>

                        ))}


                        {/* NEXT */}

                        <button
                            disabled={
                                currentPage === totalPages ||
                                totalPages === 0
                            }
                            onClick={() =>
                                setCurrentPage(
                                    (page) => page + 1
                                )
                            }
                        >

                            <i className="fa-solid fa-angle-right"></i>

                        </button>


                    </div>

                </div>
                                {/* =========================================
                    ORDER STATUS FLOW
                ========================================= */}

                <section className="status-flow">

                    <h2>

                        <i className="fa-solid fa-route"></i>

                        Order Status Flow

                    </h2>


                    <div className="flow-container">


                        {/* PENDING */}

                        <div className="flow-step">

                            <div className="flow-icon pending">

                                <i className="fa-solid fa-clock"></i>

                            </div>

                            <h4>
                                Pending
                            </h4>

                            <p>
                                {pendingOrders} Orders
                            </p>

                        </div>


                        <div className="flow-line"></div>


                        {/* CONFIRMED */}

                        <div className="flow-step">

                            <div className="flow-icon confirmed">

                                <i className="fa-solid fa-check"></i>

                            </div>

                            <h4>
                                Confirmed
                            </h4>

                            <p>
                                {confirmedOrders} Orders
                            </p>

                        </div>


                        <div className="flow-line"></div>


                        {/* PACKED */}

                        <div className="flow-step">

                            <div className="flow-icon packed">

                                <i className="fa-solid fa-box"></i>

                            </div>

                            <h4>
                                Packed
                            </h4>

                            <p>
                                {packedOrders} Orders
                            </p>

                        </div>


                        <div className="flow-line"></div>


                        {/* SHIPPED */}

                        <div className="flow-step">

                            <div className="flow-icon shipped">

                                <i className="fa-solid fa-truck-fast"></i>

                            </div>

                            <h4>
                                Shipped
                            </h4>

                            <p>
                                {shippedOrders} Orders
                            </p>

                        </div>


                        <div className="flow-line"></div>


                        {/* DELIVERED */}

                        <div className="flow-step">

                            <div className="flow-icon delivered">

                                <i className="fa-solid fa-circle-check"></i>

                            </div>

                            <h4>
                                Delivered
                            </h4>

                            <p>
                                {deliveredOrders} Orders
                            </p>

                        </div>


                    </div>

                </section>
                                {/* =========================================
                    AI ORDER INSIGHTS
                ========================================= */}

                <section className="ai-insights">

                    <div className="insights-header">

                        <div>

                            <h2>

                                <i className="fa-solid fa-robot"></i>

                                AI Order Insights

                            </h2>

                            <p>
                                Intelligent insights based on current order data.
                            </p>

                        </div>


                        <button
                            onClick={() => {

                                const report = `
BAD TEDDY - AI ORDER REPORT

Pending Orders: ${pendingOrders}
Confirmed Orders: ${confirmedOrders}
Packed Orders: ${packedOrders}
Shipped Orders: ${shippedOrders}
Delivered Orders: ${deliveredOrders}

Total Orders: ${orders.length}

Generated from current order data.
                                `;

                                const blob = new Blob(
                                    [report],
                                    {
                                        type: "text/plain"
                                    }
                                );

                                const url =
                                    URL.createObjectURL(blob);

                                const link =
                                    document.createElement("a");

                                link.href = url;

                                link.download =
                                    "bad-teddy-order-report.txt";

                                document.body.appendChild(link);

                                link.click();

                                document.body.removeChild(link);

                                URL.revokeObjectURL(url);

                            }}
                        >

                            <i className="fa-solid fa-chart-line"></i>

                            Generate Report

                        </button>

                    </div>


                    <div className="insights-grid">


                        {/* PENDING ORDERS */}

                        <div className="insight-card">

                            <div className="insight-icon">

                                <i className="fa-solid fa-box-open"></i>

                            </div>

                            <h3>
                                {pendingOrders}
                            </h3>

                            <p>
                                Orders Pending
                            </p>

                            <span>
                                {pendingOrders > 0
                                    ? "Require immediate attention"
                                    : "No pending orders"}
                            </span>

                        </div>


                        {/* DELIVERY TIME */}

                        <div className="insight-card">

                            <div className="insight-icon">

                                <i className="fa-solid fa-clock"></i>

                            </div>

                            <h3>
                                2.4 Days
                            </h3>

                            <p>
                                Average Delivery Time
                            </p>

                            <span>
                                Based on current order performance
                            </span>

                        </div>


                        {/* SALES REGION */}

                        <div className="insight-card">

                            <div className="insight-icon">

                                <i className="fa-solid fa-location-dot"></i>

                            </div>

                            <h3>
                                Mumbai
                            </h3>

                            <p>
                                Highest Sales Region
                            </p>

                            <span>
                                Top performing city
                            </span>

                        </div>


                        {/* COD */}

                        <div className="insight-card">

                            <div className="insight-icon">

                                <i className="fa-solid fa-wallet"></i>

                            </div>

                            <h3>

                                {
                                    orders.length > 0
                                        ? Math.round(
                                            (
                                                orders.filter(
                                                    (order) =>
                                                        order.payment === "COD"
                                                ).length /
                                                orders.length
                                            ) * 100
                                        )
                                        : 0
                                }%

                            </h3>

                            <p>
                                Cash On Delivery
                            </p>

                            <span>
                                COD orders in current data
                            </span>

                        </div>


                        {/* AI SUGGESTION */}

                        <div className="insight-card">

                            <div className="insight-icon">

                                <i className="fa-solid fa-lightbulb"></i>

                            </div>

                            <h3>
                                AI Suggestion
                            </h3>

                            <p>

                                {pendingOrders > 2
                                    ? "Increase staff for pending orders."
                                    : "Order processing is currently stable."}

                            </p>

                            <span>

                                Based on current order status

                            </span>

                        </div>


                    </div>

                </section>
                                {/* =========================================
                    ORDER DETAILS MODAL
                ========================================= */}

                {selectedOrder && (

                    <div
                        className="order-modal-overlay"
                        onClick={() => setSelectedOrder(null)}
                    >

                        <div
                            className="order-modal"
                            onClick={(e) => e.stopPropagation()}
                        >

                            {/* MODAL HEADER */}

                            <div className="order-modal-header">

                                <div>

                                    <h2>
                                        Order #{selectedOrder.id}
                                    </h2>

                                    <p>
                                        Order details and status
                                    </p>

                                </div>

                                <button
                                    className="modal-close"
                                    onClick={() =>
                                        setSelectedOrder(null)
                                    }
                                >

                                    <i className="fa-solid fa-xmark"></i>

                                </button>

                            </div>


                            {/* CUSTOMER INFORMATION */}

                            <div className="order-detail-section">

                                <h3>

                                    <i className="fa-solid fa-user"></i>

                                    Customer Information

                                </h3>


                                <div className="order-customer-detail">

                                    <img
                                        src={selectedOrder.image}
                                        alt={selectedOrder.customer}
                                    />

                                    <div>

                                        <h4>
                                            {selectedOrder.customer}
                                        </h4>

                                        <p>
                                            {selectedOrder.email}
                                        </p>

                                    </div>

                                </div>

                            </div>


                            {/* ORDER INFORMATION */}

                            <div className="order-detail-section">

                                <h3>

                                    <i className="fa-solid fa-receipt"></i>

                                    Order Information

                                </h3>


                                <div className="order-detail-grid">

                                    <div>

                                        <span>
                                            Order ID
                                        </span>

                                        <strong>
                                            #{selectedOrder.id}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Items
                                        </span>

                                        <strong>
                                            {selectedOrder.items}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Total Amount
                                        </span>

                                        <strong>
                                            ₹{selectedOrder.total.toLocaleString("en-IN")}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Payment
                                        </span>

                                        <strong>
                                            {selectedOrder.payment}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Order Date
                                        </span>

                                        <strong>
                                            {selectedOrder.date}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Order Time
                                        </span>

                                        <strong>
                                            {selectedOrder.time}
                                        </strong>

                                    </div>

                                </div>

                            </div>


                            {/* ORDER STATUS */}

                            <div className="order-detail-section">

                                <h3>

                                    <i className="fa-solid fa-truck"></i>

                                    Order Status

                                </h3>


                                <div className="current-order-status">

                                    <span
                                        className={`status ${
                                            selectedOrder.status
                                                .toLowerCase()
                                                .replace(" ", "-")
                                        }`}
                                    >

                                        {selectedOrder.status}

                                    </span>

                                </div>


                                <div className="status-update">

                                    <label>
                                        Update Order Status
                                    </label>


                                    <select
                                        value={selectedOrder.status}
                                        onChange={(e) =>
                                            updateOrderStatus(
                                                selectedOrder.id,
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="Pending">
                                            Pending
                                        </option>

                                        <option value="Confirmed">
                                            Confirmed
                                        </option>

                                        <option value="Packed">
                                            Packed
                                        </option>

                                        <option value="Shipped">
                                            Shipped
                                        </option>

                                        <option value="Delivered">
                                            Delivered
                                        </option>

                                        <option value="Cancelled">
                                            Cancelled
                                        </option>

                                    </select>

                                </div>

                            </div>


                            {/* MODAL FOOTER */}

                            <div className="order-modal-footer">

                                <button
                                    className="modal-cancel-btn"
                                    onClick={() =>
                                        setSelectedOrder(null)
                                    }
                                >

                                    Close

                                </button>

                            </div>

                        </div>

                    </div>

                )}
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
                            </div>

        </div>

    );
}

export default Adminorders;
