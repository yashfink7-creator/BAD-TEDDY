import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "../styles/myorders.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import logo from "../assets/mylogo.png";
import resolveProductImage from "../utils/imageResolver";

function MyOrders() {

    const navigate = useNavigate();
    const location = useLocation();

    const [orders, setOrders] = useState([]);
    const [cartCount, setCartCount] = useState(0);

    const loggedInUser = (() => {
        try {
            const savedUser = localStorage.getItem("badTeddyUser");
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    })();

    /* ==========================================
       IMAGE MAPPING HELPER
    ========================================== */
    const getProductImage = (img) => {
        return resolveProductImage(img);
    };

    /* ==========================================
       CART COUNT SYNC
    ========================================== */
    const updateCartCount = () => {
        try {
            const savedCart = JSON.parse(localStorage.getItem("badTeddyCart")) || [];
            const count = savedCart.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
            setCartCount(count);
        } catch {
            setCartCount(0);
        }
    };

    /* ==========================================
       LOAD ORDERS
    ========================================== */
    const loadOrders = async () => {
        let localOrders = [];
        try {
            const savedOrders = JSON.parse(
                localStorage.getItem("badTeddyOrders")
            );
            if (Array.isArray(savedOrders)) {
                localOrders = savedOrders;
            }
        } catch {
            localOrders = [];
        }

        // Normalize local orders with images
        const normalizedLocal = localOrders.map(ord => ({
            ...ord,
            items: Array.isArray(ord.items)
                ? ord.items.map(it => ({
                    ...it,
                    image: getProductImage(it.image)
                }))
                : []
        }));

        if (normalizedLocal.length > 0) {
            setOrders(normalizedLocal);
        }

        // If user is logged in, fetch from database API
        if (loggedInUser?.id) {
            try {
                const response = await fetch(
                    `http://localhost/BAD%20TEDDY/backend/api/orders.php?user_id=${loggedInUser.id}`
                );
                const data = await response.json();
                if (data.success && Array.isArray(data.orders)) {
                    const normalizedApi = data.orders.map(ord => ({
                        ...ord,
                        items: Array.isArray(ord.items)
                            ? ord.items.map(it => ({
                                ...it,
                                image: getProductImage(it.image)
                            }))
                            : []
                    }));

                    setOrders(normalizedApi);
                    localStorage.setItem("badTeddyOrders", JSON.stringify(normalizedApi));
                    return;
                }
            } catch (error) {
                console.error("Unable to load orders from backend:", error);
            }
        }

        setOrders(normalizedLocal);
    };

    /* ==========================================
       INITIAL LOAD & LISTENERS
    ========================================== */
    useEffect(() => {
        loadOrders();
        updateCartCount();
    }, []);

    useEffect(() => {
        const handleOrderUpdate = () => {
            loadOrders();
        };

        const handleCartUpdate = () => {
            updateCartCount();
        };

        window.addEventListener("badTeddyOrderUpdated", handleOrderUpdate);
        window.addEventListener("badTeddyCartUpdated", handleCartUpdate);
        window.addEventListener("storage", handleOrderUpdate);

        return () => {
            window.removeEventListener("badTeddyOrderUpdated", handleOrderUpdate);
            window.removeEventListener("badTeddyCartUpdated", handleCartUpdate);
            window.removeEventListener("storage", handleOrderUpdate);
        };
    }, []);

    /* ==========================================
       FORMAT DATE
    ========================================== */
    const formatDate = (date) => {
        if (!date) return "Date unavailable";
        try {
            return new Date(date).toLocaleDateString(
                "en-IN",
                {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                }
            );
        } catch {
            return "Date unavailable";
        }
    };

    /* ==========================================
       FORMAT PAYMENT
    ========================================== */
    const formatPayment = (payment) => {
        if (!payment) return "Not specified";
        if (payment === "upi") return "UPI";
        if (payment === "card") return "Credit / Debit Card";
        if (payment === "cod") return "Cash on Delivery";
        return payment.toUpperCase();
    };

    /* ==========================================
       EMPTY ORDERS VIEW
    ========================================== */
    if (orders.length === 0) {
        return (
            <div className="myorders-page">
                <header className="myorders-header">
                    <button
                        className="myorders-back-btn"
                        onClick={() => navigate(-1)}
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>

                    <img
                        src={logo}
                        alt="Bad Teddy"
                        className="myorders-logo"
                    />

                    <button
                        className="myorders-cart-btn"
                        onClick={() => navigate("/cart")}
                    >
                        <i className="fa-solid fa-bag-shopping"></i>
                        {cartCount > 0 && (
                            <span style={{
                                position: "absolute",
                                top: "5px",
                                right: "5px",
                                background: "#d4af37",
                                color: "#000",
                                fontSize: "10px",
                                fontWeight: "bold",
                                borderRadius: "50%",
                                width: "16px",
                                height: "16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                {cartCount}
                            </span>
                        )}
                    </button>
                </header>

                <main className="myorders-empty">
                    <div className="empty-order-icon">
                        <i className="fa-solid fa-box-open"></i>
                    </div>

                    <span className="orders-eyebrow">
                        BAD TEDDY / ORDERS
                    </span>

                    <h1>
                        No Orders Yet
                    </h1>

                    <p>
                        Looks like you haven't ordered
                        anything yet. Your next favourite
                        fit is waiting for you.
                    </p>

                    <button
                        className="orders-shop-btn"
                        onClick={() => navigate("/shop")}
                    >
                        START SHOPPING
                        <i className="fa-solid fa-arrow-right"></i>
                    </button>
                </main>

                <BottomNav location={location} />
            </div>
        );
    }

    /* ==========================================
       ORDERS PAGE VIEW
    ========================================== */
    return (
        <div className="myorders-page">

            {/* =====================================
                HEADER
            ===================================== */}
            <header className="myorders-header">
                <button
                    className="myorders-back-btn"
                    onClick={() => navigate(-1)}
                >
                    <i className="fa-solid fa-arrow-left"></i>
                </button>

                <img
                    src={logo}
                    alt="Bad Teddy"
                    className="myorders-logo"
                />

                <button
                    className="myorders-cart-btn"
                    onClick={() => navigate("/cart")}
                    style={{ position: "relative" }}
                >
                    <i className="fa-solid fa-bag-shopping"></i>
                    {cartCount > 0 && (
                        <span style={{
                            position: "absolute",
                            top: "2px",
                            right: "2px",
                            background: "#d4af37",
                            color: "#000",
                            fontSize: "10px",
                            fontWeight: "bold",
                            borderRadius: "50%",
                            width: "16px",
                            height: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            {cartCount}
                        </span>
                    )}
                </button>
            </header>

            {/* =====================================
                MAIN CONTENT
            ===================================== */}
            <main className="myorders-main">

                {/* PAGE INTRO */}
                <section className="orders-heading">
                    <div>
                        <span className="orders-eyebrow">
                            BAD TEDDY / ACCOUNT
                        </span>

                        <h1 className="text-color">
                            My Orders
                        </h1>

                        <p>
                            Your complete Bad Teddy
                            order history.
                        </p>
                    </div>

                    <div className="orders-count">
                        <i className="fa-solid fa-box"></i>

                        <div>
                            <strong>
                                {orders.length}
                            </strong>

                            <span>
                                {orders.length === 1
                                    ? "ORDER"
                                    : "ORDERS"}
                            </span>
                        </div>
                    </div>
                </section>

                <div className="orders-divider"></div>

                {/* =================================
                    ORDER LIST
                ================================= */}
                <section className="orders-list">
                    {orders.map((order, index) => (
                        <article
                            className="order-card"
                            key={order.orderNumber || index}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                localStorage.setItem("badTeddyOrder", JSON.stringify(order));
                                navigate(`/order?order_number=${encodeURIComponent(order.orderNumber || "")}`, {
                                    state: { order }
                                });
                            }}
                        >
                            {/* ORDER HEADER */}
                            <div className="order-card-header">
                                <div>
                                    <span className="order-label">
                                        ORDER
                                    </span>

                                    <h2 className="num-col">
                                        #{order.orderNumber}
                                    </h2>
                                </div>

                                <div className="order-date">
                                    <i className="fa-regular fa-calendar"></i>

                                    <span>
                                        {formatDate(order.createdAt)}
                                    </span>
                                </div>
                            </div>

                            {/* STATUS */}
                            <div className="order-status-row">
                                <span className="order-status">
                                    <i className="fa-solid fa-circle-check"></i>
                                    {order.status || "Order Confirmed"}
                                </span>

                                <span className="payment-method">
                                    <i className="fa-solid fa-credit-card"></i>
                                    {formatPayment(order.paymentMethod)}
                                </span>
                            </div>

                            {/* PRODUCTS */}
                            <div className="ordered-products">
                                {Array.isArray(order.items) &&
                                    order.items.map((item, itemIndex) => (
                                        <div
                                            className="ordered-product"
                                            key={item.id || itemIndex}
                                        >
                                            <div className="ordered-product-image">
                                                <img
                                                    src={getProductImage(item.image)}
                                                    alt={item.name}
                                                />

                                                <span>
                                                    {item.quantity || 1}
                                                </span>
                                            </div>

                                            <div className="ordered-product-info">
                                                <span>
                                                    {item.category || "BAD TEDDY"}
                                                </span>

                                                <h3>
                                                    {item.name}
                                                </h3>

                                                {item.size && (
                                                    <small>
                                                        Size: {item.size}
                                                    </small>
                                                )}
                                            </div>

                                            <strong>
                                                ₹
                                                {(
                                                    Number(
                                                        String(item.price || 0).replace(/[₹,]/g, "")
                                                    ) *
                                                    Number(item.quantity || 1)
                                                ).toLocaleString("en-IN")}
                                            </strong>
                                        </div>
                                    ))}
                            </div>

                            {/* ORDER FOOTER */}
                            <div className="order-card-footer">
                                <div className="order-total">
                                    <span>
                                        ORDER TOTAL
                                    </span>

                                    <strong>
                                        ₹
                                        {Number(order.total || 0).toLocaleString("en-IN")}
                                    </strong>
                                </div>

                                <div className="order-items-count">
                                    <i className="fa-solid fa-box"></i>

                                    {Array.isArray(order.items)
                                        ? order.items.reduce(
                                            (total, item) => total + Number(item.quantity || 1),
                                            0
                                        )
                                        : 0}
                                    {" "}
                                    {Array.isArray(order.items) &&
                                    order.items.reduce(
                                        (total, item) => total + Number(item.quantity || 1),
                                        0
                                    ) === 1
                                        ? "item"
                                        : "items"}
                                </div>
                            </div>

                            {/* DELIVERY */}
                            {order.customer && (
                                <div className="delivery-info">
                                    <div className="delivery-title">
                                        <i className="fa-solid fa-location-dot"></i>
                                        <span>
                                            DELIVERY ADDRESS
                                        </span>
                                    </div>

                                    <p>
                                        {order.customer.name}
                                        <br />
                                        {order.customer.address}
                                        <br />
                                        {order.customer.city},{" "}
                                        {order.customer.state}{" "}
                                        -{" "}
                                        {order.customer.pincode}
                                    </p>
                                </div>
                            )}

                        </article>
                    ))}
                </section>

                {/* CONTINUE SHOPPING */}
                <section className="orders-bottom">
                    <div>
                        <span>
                            KEEP EXPLORING
                        </span>

                        <h2 className="text-color">
                            Find your next favourite fit.
                        </h2>
                    </div>

                    <button onClick={() => navigate("/shop")}>
                        SHOP COLLECTION
                        <i className="fa-solid fa-arrow-right"></i>
                    </button>
                </section>

            </main>

            <BottomNav location={location} />

        </div>
    );
}

/* ================================================
   BOTTOM NAV
================================================ */
function BottomNav({ location }) {
    return (
        <nav className="bottom-nav">
            <Link
                to="/"
                className={location.pathname === "/" ? "active" : ""}
            >
                <i className="fa-solid fa-house"></i>
                <span>Home</span>
            </Link>

            <Link
                to="/shop"
                className={location.pathname === "/shop" ? "active" : ""}
            >
                <i className="fa-solid fa-bag-shopping"></i>
                <span>Shop</span>
            </Link>

            <Link
                to="/assistant"
                className={location.pathname === "/assistant" ? "active" : ""}
            >
                <i className="fa-solid fa-robot"></i>
                <span>AI</span>
            </Link>

            <Link
                to="/profile"
                className={location.pathname === "/profile" ? "active" : ""}
            >
                <i className="fa-regular fa-user"></i>
                <span>Profile</span>
            </Link>
        </nav>
    );
}

export default MyOrders;