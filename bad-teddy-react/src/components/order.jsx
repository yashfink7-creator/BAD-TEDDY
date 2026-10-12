import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "../styles/order.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import resolveProductImage from "../utils/imageResolver";

function Order() {
    const navigate = useNavigate();
    const location = useLocation();

    const loggedInUser = (() => {
        try {
            const savedUser = localStorage.getItem("badTeddyUser");
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    })();

    /* =====================================================
       IMAGE HELPER
    ====================================================== */
    const getProductImage = (img) => {
        return resolveProductImage(img);
    };

    /* =====================================================
       NORMALIZE ORDER DATA
    ====================================================== */
    const normalizeOrderData = (data) => {
        if (!data) return null;

        const items = Array.isArray(data.items) && data.items.length > 0
            ? data.items.map((item, idx) => ({
                id: item.id || item.product_id || idx + 1,
                name: item.name || item.product_name || "Streetwear Item",
                image: getProductImage(item.image),
                size: item.size || "M",
                quantity: Number(item.quantity) || 1,
                price: Number(String(item.price || 0).replace(/[₹,]/g, "")) || 0
            }))
            : [];

        const firstItem = items[0] || {
            id: 1,
            name: "Bad Teddy Product",
            image: resolveProductImage("prod1.jpeg"),
            size: "M",
            quantity: 1,
            price: Number(data.total) || 0
        };

        const customer = data.customer || {};
        const subtotal = Number(data.subtotal) || items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
        const shipping = Number(data.shipping) !== undefined && data.shipping !== null
            ? Number(data.shipping)
            : (subtotal >= 1999 || subtotal === 0 ? 0 : 99);
        const discount = Number(data.discount) || 0;
        const total = Number(data.total) || (subtotal + shipping - discount);

        return {
            id: data.orderNumber || data.id || "ORDER",
            orderNumber: data.orderNumber || data.id || "ORDER",
            status: data.status || "Order Confirmed",
            date: data.createdAt
                ? new Date(data.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                })
                : "Date unavailable",
            paymentMethod: data.paymentMethod || "Online Payment",
            product: firstItem,
            items: items.length > 0 ? items : [firstItem],
            address: {
                name: customer.name || (customer.firstName ? `${customer.firstName} ${customer.lastName || ""}`.trim() : "Your Name"),
                phone: customer.phone || "XXXXXXXXXX",
                address: customer.address || "Your delivery address",
                city: customer.city || "Mumbai",
                pincode: customer.pincode || "400050"
            },
            pricing: {
                subtotal: subtotal,
                delivery: shipping,
                discount: discount,
                total: total
            }
        };
    };

    /* =====================================================
       ORDER DATA STATE
    ====================================================== */
    const [order, setOrder] = useState(() => {
        if (location.state?.order) {
            return normalizeOrderData(location.state.order);
        }

        const savedOrder = localStorage.getItem("badTeddyOrder");
        if (!savedOrder) return null;

        try {
            const data = JSON.parse(savedOrder);
            return normalizeOrderData(data);
        } catch (error) {
            console.error("Error reading initial order:", error);
            return null;
        }
    });

    /* =====================================================
       LOAD LIVE ORDER DETAILS (FROM API IF QUERY PARAM PASSED)
    ====================================================== */
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const orderNumber = queryParams.get("order_number");
        const orderId = queryParams.get("id");

        if (orderNumber || orderId) {
            const fetchOrder = async () => {
                try {
                    const endpoint = orderNumber
                        ? `http://localhost/BAD%20TEDDY/backend/api/orders.php?order_number=${encodeURIComponent(orderNumber)}`
                        : `http://localhost/BAD%20TEDDY/backend/api/orders.php?id=${encodeURIComponent(orderId)}`;

                    const response = await fetch(endpoint);
                    const data = await response.json();

                    if (data.success && data.order) {
                        const normalized = normalizeOrderData(data.order);
                        setOrder(normalized);
                        localStorage.setItem("badTeddyOrder", JSON.stringify(data.order));
                    }
                } catch (error) {
                    console.error("Error fetching order from API:", error);
                }
            };

            fetchOrder();
        }
    }, [location.search]);

    /* =====================================================
       WISHLIST STATE & SYNC
    ===================================================== */
    const [wishlist, setWishlist] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem("badTeddyWishlist"));
            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        const loadWishlist = async () => {
            if (loggedInUser?.id) {
                try {
                    const res = await fetch(`http://localhost/BAD%20TEDDY/backend/api/wishlist.php?user_id=${loggedInUser.id}`);
                    const data = await res.json();
                    if (data.success && Array.isArray(data.items)) {
                        setWishlist(data.items);
                        localStorage.setItem("badTeddyWishlist", JSON.stringify(data.items));
                    }
                } catch (err) {
                    console.error("Wishlist sync error:", err);
                }
            }
        };
        loadWishlist();
    }, []);

    const toggleWishlist = async (product) => {
        const pObj = typeof product === "string" ? { name: product, id: Date.now() } : product;
        const exists = wishlist.some(item => (typeof item === "string" ? item === pObj.name : item.id === pObj.id || item.name === pObj.name));

        let updated;
        if (exists) {
            updated = wishlist.filter(item => (typeof item === "string" ? item !== pObj.name : item.id !== pObj.id && item.name !== pObj.name));
            if (loggedInUser?.id && pObj.id) {
                try {
                    await fetch(`http://localhost/BAD%20TEDDY/backend/api/wishlist.php?user_id=${loggedInUser.id}&product_id=${pObj.id}`, { method: "DELETE" });
                } catch (err) {
                    console.error("Wishlist remove error:", err);
                }
            }
        } else {
            updated = [...wishlist, pObj];
            if (loggedInUser?.id && pObj.id) {
                try {
                    await fetch("http://localhost/BAD%20TEDDY/backend/api/wishlist.php", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ user_id: loggedInUser.id, product_id: pObj.id })
                    });
                } catch (err) {
                    console.error("Wishlist add error:", err);
                }
            }
        }

        setWishlist(updated);
        localStorage.setItem("badTeddyWishlist", JSON.stringify(updated));
        window.dispatchEvent(new Event("badTeddyWishlistUpdated"));
    };

    /* =====================================================
       CART STATE & SYNC
    ===================================================== */
    const [cart, setCart] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem("badTeddyCart"));
            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        const loadCart = async () => {
            if (loggedInUser?.id) {
                try {
                    const res = await fetch(`http://localhost/BAD%20TEDDY/backend/api/cart.php?user_id=${loggedInUser.id}`);
                    const data = await res.json();
                    if (data.success && Array.isArray(data.items)) {
                        setCart(data.items);
                        localStorage.setItem("badTeddyCart", JSON.stringify(data.items));
                    }
                } catch (err) {
                    console.error("Cart sync error:", err);
                }
            }
        };
        loadCart();
    }, []);

    const addToCart = async (product) => {
        const pPrice = Number(String(product.price || 0).replace(/[₹,]/g, ""));
        const itemToAdd = {
            id: product.id || Date.now(),
            product_id: product.id || 1,
            name: product.name,
            price: pPrice,
            image: product.image,
            size: "M",
            quantity: 1
        };

        let updatedCart = [...cart];
        const existingIndex = updatedCart.findIndex(item => item.name === product.name && item.size === itemToAdd.size);

        if (existingIndex !== -1) {
            updatedCart[existingIndex].quantity = (Number(updatedCart[existingIndex].quantity) || 1) + 1;
        } else {
            updatedCart.push(itemToAdd);
        }

        setCart(updatedCart);
        localStorage.setItem("badTeddyCart", JSON.stringify(updatedCart));
        window.dispatchEvent(new Event("badTeddyCartUpdated"));

        if (loggedInUser?.id && product.id) {
            try {
                await fetch("http://localhost/BAD%20TEDDY/backend/api/cart.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: loggedInUser.id,
                        product_id: product.id,
                        size: "M",
                        quantity: 1
                    })
                });
            } catch (err) {
                console.error("Add to cart API error:", err);
            }
        }
    };

    /* =====================================================
       RECOMMENDED PRODUCTS
    ====================================================== */
    const defaultRecommended = [
        { id: 1, name: "Oversized Signature Tee", price: 999, image: resolveProductImage("prod1.jpeg") },
        { id: 2, name: "Classic Black Hoodie", price: 1799, image: resolveProductImage("prod2.jpg") },
        { id: 3, name: "Relaxed Cargo Pants", price: 1599, image: resolveProductImage("prod3.jpg") },
        { id: 4, name: "Premium Graphic Tee", price: 999, image: resolveProductImage("prod4.jpg") }
    ];

    const [recommendedProducts, setRecommendedProducts] = useState(defaultRecommended);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch("http://localhost/BAD%20TEDDY/backend/api/products.php");
                const data = await res.json();
                if (data.success && Array.isArray(data.products) && data.products.length > 0) {
                    const formatted = data.products.slice(0, 4).map(p => ({
                        id: Number(p.id),
                        name: p.name,
                        price: Number(String(p.price).replace(/[₹,]/g, "")),
                        image: getProductImage(p.image)
                    }));
                    setRecommendedProducts(formatted);
                }
            } catch (error) {
                console.error("Error fetching recommended products:", error);
            }
        };
        fetchProducts();
    }, []);

    if (!order) {
        return (
            <div className="order-page">
                <div style={{
                    textAlign: "center",
                    padding: "100px 20px"
                }}>
                    <h2>No order found</h2>

                    <p style={{
                        color: "#888",
                        marginTop: "10px"
                    }}>
                        Please place an order first.
                    </p>

                    <button
                        onClick={() => navigate("/shop")}
                        style={{
                            marginTop: "20px",
                            padding: "12px 25px",
                            background: "#c9a45c",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer"
                        }}
                    >
                        Go to Shop
                    </button>
                </div>
            </div>
        );
    }

    /* =====================================================
       TRACKING STEPS
    ====================================================== */
    const trackingSteps = [
        {
            title: "Order Placed",
            description: "Your order has been successfully placed.",
            icon: "fa-clipboard-check"
        },
        {
            title: "Order Confirmed",
            description: "Your order has been confirmed.",
            icon: "fa-box"
        },
        {
            title: "Shipped",
            description: "Your package is on its way.",
            icon: "fa-truck"
        },
        {
            title: "Out for Delivery",
            description: "Your package will arrive soon.",
            icon: "fa-location-dot"
        },
        {
            title: "Delivered",
            description: "Your order has been delivered.",
            icon: "fa-house"
        }
    ];

    const statusOrder = [
        "Order Placed",
        "Order Confirmed",
        "Shipped",
        "Out for Delivery",
        "Delivered"
    ];

    const currentStatusIndex = statusOrder.indexOf(order.status) !== -1
        ? statusOrder.indexOf(order.status)
        : 1; // Default to "Order Confirmed"

    /* =====================================================
       REORDER ALL ITEMS
    ====================================================== */
    const handleReorder = async () => {
        if (!order || (!order.items?.length && !order.product)) {
            alert("Unable to reorder this item.");
            return;
        }

        try {
            const existingCart = JSON.parse(localStorage.getItem("badTeddyCart")) || [];
            const itemsToReorder = order.items && order.items.length > 0 ? order.items : [order.product];

            for (const item of itemsToReorder) {
                const reorderedProduct = {
                    id: Date.now() + Math.random(),
                    product_id: item.id || 1,
                    name: item.name,
                    price: Number(item.price) || 0,
                    image: item.image,
                    size: item.size || "M",
                    quantity: Number(item.quantity) || 1
                };

                const existingProductIndex = existingCart.findIndex(
                    cartItem => cartItem.name === reorderedProduct.name && cartItem.size === reorderedProduct.size
                );

                if (existingProductIndex !== -1) {
                    existingCart[existingProductIndex].quantity =
                        Number(existingCart[existingProductIndex].quantity || 1) + reorderedProduct.quantity;
                } else {
                    existingCart.push(reorderedProduct);
                }

                if (loggedInUser?.id) {
                    try {
                        await fetch("http://localhost/BAD%20TEDDY/backend/api/cart.php", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                user_id: loggedInUser.id,
                                product_id: reorderedProduct.product_id,
                                size: reorderedProduct.size,
                                quantity: reorderedProduct.quantity
                            })
                        });
                    } catch (apiErr) {
                        console.error("API reorder sync error:", apiErr);
                    }
                }
            }

            localStorage.setItem("badTeddyCart", JSON.stringify(existingCart));
            window.dispatchEvent(new Event("badTeddyCartUpdated"));
            navigate("/cart");

        } catch (error) {
            console.error("Unable to reorder items:", error);
            alert("Something went wrong while reordering the item.");
        }
    };

    /* =====================================================
       INVOICE PRINT
    ====================================================== */
    const handleInvoice = () => {
        window.print();
    };

    return (
        <div className="order-page">

            {/* =================================================
                HEADER
            ================================================= */}
            <header className="order-header">

                <div className="order-header-left">
                    <button
                        className="order-back-btn"
                        onClick={() => navigate(-1)}
                        aria-label="Go back"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>

                    <div>
                        <span className="order-header-label">
                            MY ORDERS
                        </span>

                        <h1 className="color-text">Order Details</h1>
                    </div>
                </div>

                <div className="order-header-right">
                    <button
                        className="order-header-icon"
                        aria-label="Wishlist"
                        onClick={() => navigate("/wishlist")}
                    >
                        <i className="fa-regular fa-heart"></i>

                        {wishlist.length > 0 && (
                            <span className="header-badge">
                                {wishlist.length}
                            </span>
                        )}
                    </button>

                    <button
                        className="order-header-icon"
                        aria-label="Cart"
                        onClick={() => navigate("/cart")}
                    >
                        <i className="fa-solid fa-bag-shopping"></i>

                        {cart.length > 0 && (
                            <span className="header-badge">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>

            </header>

            {/* =================================================
                ORDER HERO
            ================================================= */}
            <section className="order-hero">

                <div className="order-hero-content">
                    <div className="order-success-icon">
                        <i className="fa-solid fa-box-open"></i>
                    </div>

                    <div>
                        <span className="order-small-title">
                            ORDER #{order.id}
                        </span>

                        <h2 className="color-text">
                            Your order is on its way
                        </h2>

                        <p>
                            Placed on {order.date}
                        </p>
                    </div>
                </div>

                <div className="order-status-pill">
                    <span className="status-dot"></span>
                    {order.status}
                </div>

            </section>

            {/* =================================================
                MAIN CONTENT
            ================================================= */}
            <main className="order-content">

                {/* =================================================
                    PRODUCT CARD
                ================================================= */}
                <section className="order-card product-order-card">

                    <div className="card-heading">
                        <div>
                            <span className="card-eyebrow">
                                {order.items && order.items.length > 1 ? "YOUR ITEMS" : "YOUR ITEM"}
                            </span>

                            <h2 className="color-text">
                                Order Summary
                            </h2>
                        </div>

                        <span className="order-number">
                            #{order.id}
                        </span>
                    </div>

                    {order.items && order.items.map((item, idx) => (
                        <div className="ordered-product" key={item.id || idx}>
                            <div className="ordered-product-image">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                />
                            </div>

                            <div className="ordered-product-info">
                                <span className="product-category">
                                    BAD TEDDY • STREETWEAR
                                </span>

                                <h3>
                                    {item.name}
                                </h3>

                                <div className="product-meta">
                                    <span>
                                        Size: <strong>{item.size}</strong>
                                    </span>

                                    <span>
                                        Qty: <strong>{item.quantity}</strong>
                                    </span>
                                </div>

                                <p className="ordered-price">
                                    ₹{Number(item.price).toLocaleString("en-IN")}
                                </p>
                            </div>
                        </div>
                    ))}

                </section>

                {/* =================================================
                    TRACKING
                ================================================= */}
                <section className="order-card tracking-card">

                    <div className="card-heading">
                        <div>
                            <span className="card-eyebrow">
                                DELIVERY
                            </span>

                            <h2 className="color-text">
                                Track Your Order
                            </h2>
                        </div>

                        <i className="fa-solid fa-route tracking-heading-icon"></i>
                    </div>

                    <div className="tracking-wrapper">
                        {trackingSteps.map((step, index) => {
                            const isCompleted = index <= currentStatusIndex;
                            const isCurrent = index === currentStatusIndex;

                            return (
                                <div
                                    className={`tracking-step ${
                                        isCompleted ? "completed" : ""
                                    } ${
                                        isCurrent ? "current" : ""
                                    }`}
                                    key={step.title}
                                >
                                    <div className="tracking-line"></div>

                                    <div className="tracking-icon">
                                        <i className={`fa-solid ${step.icon}`}></i>
                                    </div>

                                    <div className="tracking-info">
                                        <h3>
                                            {step.title}
                                        </h3>

                                        <p>
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </section>

                {/* =================================================
                    DELIVERY + PAYMENT
                ================================================= */}
                <div className="order-two-column">

                    {/* DELIVERY ADDRESS */}
                    <section className="order-card delivery-card">

                        <div className="card-heading">
                            <div>
                                <span className="card-eyebrow">
                                    DELIVERY
                                </span>

                                <h2 className="color-text">
                                    Delivery Address
                                </h2>
                            </div>

                            <i className="fa-solid fa-location-dot card-heading-icon"></i>
                        </div>

                        <div className="address-content">
                            <h3>
                                {order.address.name}
                            </h3>

                            <p>
                                {order.address.address}
                            </p>

                            <p>
                                {order.address.city} — {order.address.pincode}
                            </p>

                            <div className="address-phone">
                                <i className="fa-solid fa-phone"></i>
                                {order.address.phone}
                            </div>
                        </div>

                    </section>

                    {/* PAYMENT SUMMARY */}
                    <section className="order-card payment-card">

                        <div className="card-heading">
                            <div>
                                <span className="card-eyebrow">
                                    PAYMENT
                                </span>

                                <h2 className="color-text">
                                    Price Summary
                                </h2>
                            </div>

                            <i className="fa-solid fa-receipt card-heading-icon"></i>
                        </div>

                        <div className="price-summary">
                            <div>
                                <span>Subtotal</span>
                                <strong>₹{Number(order.pricing.subtotal).toLocaleString("en-IN")}</strong>
                            </div>

                            <div>
                                <span>Delivery</span>
                                <strong className="free-text">
                                    {order.pricing.delivery === 0
                                        ? "FREE"
                                        : `₹${Number(order.pricing.delivery).toLocaleString("en-IN")}`
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>Discount</span>
                                <strong className="discount-text">
                                    -₹{Number(order.pricing.discount || 0).toLocaleString("en-IN")}
                                </strong>
                            </div>

                            <div className="summary-divider"></div>

                            <div className="total-row">
                                <span>Total</span>
                                <strong>
                                    ₹{Number(order.pricing.total).toLocaleString("en-IN")}
                                </strong>
                            </div>
                        </div>

                        <div className="payment-method">
                            <i className="fa-solid fa-shield-halved"></i>

                            <div>
                                <span>
                                    Paid securely with
                                </span>

                                <strong>
                                    {order.paymentMethod?.toUpperCase()}
                                </strong>
                            </div>
                        </div>

                    </section>

                </div>

                {/* =================================================
                    ACTION BUTTONS
                ================================================= */}
                <section className="order-actions">

                    <button
                        className="order-action-primary"
                        onClick={handleReorder}
                    >
                        <i className="fa-solid fa-rotate-right"></i>
                        Reorder Item
                    </button>

                    <button
                        className="order-action-secondary"
                        onClick={handleInvoice}
                    >
                        <i className="fa-solid fa-file-invoice"></i>
                        View Invoice
                    </button>

                </section>

                {/* =================================================
                    RECOMMENDED PRODUCTS
                ================================================= */}
                <section className="recommended-section">

                    <div className="recommended-heading">
                        <div>
                            <span className="card-eyebrow">
                                YOU MAY ALSO LIKE
                            </span>

                            <h2 className="color-text">
                                Recommended For You
                            </h2>
                        </div>

                        <span className="recommended-note">
                            Based on your style
                        </span>
                    </div>

                    <div className="recommended-grid">
                        {recommendedProducts.map(product => {
                            const isWishlisted = wishlist.some(item =>
                                typeof item === "string" ? item === product.name : item.id === product.id || item.name === product.name
                            );

                            return (
                                <article
                                    className="recommended-product"
                                    key={product.id}
                                >
                                    <div className="recommended-image">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                        />

                                        <button
                                            className={`recommend-wishlist ${
                                                isWishlisted ? "liked" : ""
                                            }`}
                                            onClick={() => toggleWishlist(product)}
                                            aria-label="Add to wishlist"
                                        >
                                            <i
                                                className={
                                                    isWishlisted
                                                        ? "fa-solid fa-heart"
                                                        : "fa-regular fa-heart"
                                                }
                                            ></i>
                                        </button>
                                    </div>

                                    <div className="recommended-info">
                                        <h3>
                                            {product.name}
                                        </h3>

                                        <p>
                                            ₹{Number(product.price).toLocaleString("en-IN")}
                                        </p>

                                        <button
                                            className="recommend-cart-btn"
                                            onClick={() => addToCart(product)}
                                        >
                                            <i className="fa-solid fa-bag-shopping"></i>
                                            Add to Cart
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                </section>

            </main>

            {/* =================================================
                BOTTOM NAVIGATION
            ================================================= */}
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

            {/* =====================================================
                PRINTABLE INVOICE
            ===================================================== */}
            <div className="invoice-print">

                <div className="invoice-header">
                    <div>
                        <h1>BAD TEDDY</h1>
                        <p>PREMIUM STREETWEAR</p>
                    </div>

                    <div className="invoice-title">
                        <h2>INVOICE</h2>
                        <p>Order #{order.id}</p>
                    </div>
                </div>

                <div className="invoice-divider"></div>

                <div className="invoice-info">
                    <div>
                        <span>BILLED TO</span>
                        <strong>{order.address.name}</strong>
                        <p>{order.address.address}</p>
                        <p>{order.address.city} — {order.address.pincode}</p>
                        <p>Phone: {order.address.phone}</p>
                    </div>

                    <div className="invoice-order-info">
                        <div>
                            <span>ORDER DATE</span>
                            <strong>{order.date}</strong>
                        </div>

                        <div>
                            <span>PAYMENT</span>
                            <strong>
                                {order.paymentMethod?.toUpperCase()}
                            </strong>
                        </div>

                        <div>
                            <span>STATUS</span>
                            <strong>{order.status}</strong>
                        </div>
                    </div>
                </div>

                <table className="invoice-table">
                    <thead>
                        <tr>
                            <th>ITEM</th>
                            <th>SIZE</th>
                            <th>QTY</th>
                            <th>PRICE</th>
                            <th>TOTAL</th>
                        </tr>
                    </thead>

                    <tbody>
                        {order.items && order.items.map((item, idx) => (
                            <tr key={item.id || idx}>
                                <td>{item.name}</td>
                                <td>{item.size}</td>
                                <td>{item.quantity}</td>
                                <td>₹{Number(item.price).toLocaleString("en-IN")}</td>
                                <td>₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString("en-IN")}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="invoice-bottom">
                    <div className="invoice-thank-you">
                        <h3>Thank you for shopping with Bad Teddy.</h3>
                        <p>We hope you love your new fit.</p>
                        <p>This is a computer-generated invoice.</p>
                    </div>

                    <div className="invoice-totals">
                        <div>
                            <span>Subtotal</span>
                            <strong>
                                ₹{Number(order.pricing.subtotal).toLocaleString("en-IN")}
                            </strong>
                        </div>

                        <div>
                            <span>Delivery</span>
                            <strong>
                                {order.pricing.delivery === 0
                                    ? "FREE"
                                    : `₹${Number(order.pricing.delivery).toLocaleString("en-IN")}`
                                }
                            </strong>
                        </div>

                        <div>
                            <span>Discount</span>
                            <strong>
                                -₹{Number(order.pricing.discount || 0).toLocaleString("en-IN")}
                            </strong>
                        </div>

                        <div className="invoice-grand-total">
                            <span>TOTAL</span>
                            <strong>
                                ₹{Number(order.pricing.total).toLocaleString("en-IN")}
                            </strong>
                        </div>
                    </div>
                </div>

                <div className="invoice-footer">
                    <span>BAD TEDDY</span>
                    <span>Premium Streetwear Collection</span>
                </div>

            </div>

        </div>
    );
}

export default Order;