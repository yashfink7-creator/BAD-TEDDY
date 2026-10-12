import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import "../styles/cart.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import resolveProductImage from "../utils/imageResolver";


function Cart() {

    const navigate = useNavigate();
    const loggedInUser = (() => {
    try {
        const savedUser = localStorage.getItem("badTeddyUser");
        return savedUser ? JSON.parse(savedUser) : null;
    } catch {
        return null;
    }
})();

    /* =====================================================
       CART DATA
       -----------------------------------------------------
       Later this array can come from PHP + MySQL.
    ====================================================== */

    const [cartItems, setCartItems] = useState([]);
    const [cartLoading, setCartLoading] = useState(true);
    const [wishlist, setWishlist] = useState([]);

    const loadCart = async () => {
        let localCart = [];
        try {
            const saved = localStorage.getItem("badTeddyCart");
            if (saved) localCart = JSON.parse(saved);
        } catch {}

        if (!loggedInUser?.id) {
            const formatted = localCart.map(item => ({
                ...item,
                image: resolveProductImage(item.image)
            }));
            setCartItems(formatted);
            setCartLoading(false);
            return;
        }

        try {
            setCartLoading(true);
            const response = await fetch(
                `http://localhost/BAD%20TEDDY/backend/api/cart.php?user_id=${loggedInUser.id}`
            );
            const data = await response.json();

            if (data.success && Array.isArray(data.cart)) {
                const formatted = data.cart.map(item => ({
                    ...item,
                    image: resolveProductImage(item.image)
                }));
                setCartItems(formatted);
                localStorage.setItem("badTeddyCart", JSON.stringify(formatted));
            } else {
                setCartItems(localCart);
            }
        } catch (error) {
            console.error("Cart loading error:", error);
            setCartItems(localCart);
        } finally {
            setCartLoading(false);
        }
    };

    const loadWishlistCount = async () => {
        if (!loggedInUser?.id) return;
        try {
            const res = await fetch(`http://localhost/BAD%20TEDDY/backend/api/wishlist.php?user_id=${loggedInUser.id}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.wishlist)) {
                setWishlist(data.wishlist);
            }
        } catch (e) {
            console.error("Wishlist fetch error:", e);
        }
    };

    useEffect(() => {
        loadCart();
        loadWishlistCount();

        const handleCartUpdate = () => loadCart();
        const handleWishUpdate = () => loadWishlistCount();

        window.addEventListener("badTeddyCartUpdated", handleCartUpdate);
        window.addEventListener("cartUpdated", handleCartUpdate);
        window.addEventListener("badTeddyWishlistUpdated", handleWishUpdate);
        window.addEventListener("storage", handleCartUpdate);

        return () => {
            window.removeEventListener("badTeddyCartUpdated", handleCartUpdate);
            window.removeEventListener("cartUpdated", handleCartUpdate);
            window.removeEventListener("badTeddyWishlistUpdated", handleWishUpdate);
            window.removeEventListener("storage", handleCartUpdate);
        };
    }, []);

    /* =====================================================
       ADDRESS
    ====================================================== */

    const [address, setAddress] = useState({
        fullName: "",
        phone: "",
        email: "",
        addressLine: "",
        city: "",
        state: "",
        pincode: ""
    });


    const [addressSaved, setAddressSaved] = useState(false);


    /* Load previously saved address */

    useEffect(() => {

        const savedAddress =
            localStorage.getItem("badTeddyAddress");

        if (savedAddress) {

            try {

                setAddress(JSON.parse(savedAddress));
                setAddressSaved(true);

            } catch (error) {

                console.log("Unable to load saved address.");

            }

        }

    }, []);
    


    /* =====================================================
       COUPON
    ====================================================== */

    const [coupon, setCoupon] = useState("");
    const [couponApplied, setCouponApplied] = useState(false);


    /* =====================================================
       WISHLIST
    ====================================================== */




    /* =====================================================
       QUANTITY
    ====================================================== */

    const changeQuantity = async (id, amount) => {
        const item = cartItems.find(
            item => String(item.id) === String(id) || String(item.product_id) === String(id)
        );

        if (!item) return;

        const newQuantity = Math.max(1, Number(item.quantity) + amount);

        if (loggedInUser?.id) {
            try {
                const response = await fetch(
                    "http://localhost/BAD%20TEDDY/backend/api/cart.php",
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            user_id: Number(loggedInUser.id),
                            product_id: Number(item.product_id || item.id),
                            quantity: Number(newQuantity),
                            size: item.size || null
                        })
                    }
                );

                const data = await response.json();

                if (data.success) {
                    setCartItems(previousItems => {
                        const updated = previousItems.map(cartItem =>
                            String(cartItem.id) === String(id) || String(cartItem.product_id) === String(id)
                                ? { ...cartItem, quantity: newQuantity }
                                : cartItem
                        );
                        localStorage.setItem("badTeddyCart", JSON.stringify(updated));
                        return updated;
                    });
                    window.dispatchEvent(new Event("badTeddyCartUpdated"));
                    window.dispatchEvent(new Event("cartUpdated"));
                } else {
                    alert(data.message || "Unable to update quantity.");
                }
            } catch (error) {
                console.error("Quantity update error:", error);
            }
        } else {
            // Guest user update
            setCartItems(previousItems => {
                const updated = previousItems.map(cartItem =>
                    String(cartItem.id) === String(id) || String(cartItem.product_id) === String(id)
                        ? { ...cartItem, quantity: newQuantity }
                        : cartItem
                );
                localStorage.setItem("badTeddyCart", JSON.stringify(updated));
                return updated;
            });
            window.dispatchEvent(new Event("badTeddyCartUpdated"));
            window.dispatchEvent(new Event("cartUpdated"));
        }
    };


    /* =====================================================
       REMOVE PRODUCT
    ====================================================== */

    const removeItem = async (id) => {
        const item = cartItems.find(
            item => String(item.id) === String(id) || String(item.product_id) === String(id)
        );

        if (!item) return;

        if (loggedInUser?.id) {
            try {
                const response = await fetch(
                    "http://localhost/BAD%20TEDDY/backend/api/cart.php",
                    {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            user_id: Number(loggedInUser.id),
                            product_id: Number(item.product_id || item.id),
                            size: item.size || null
                        })
                    }
                );

                const data = await response.json();

                if (data.success) {
                    setCartItems(previousItems => {
                        const updated = previousItems.filter(
                            cartItem => String(cartItem.id) !== String(id) && String(cartItem.product_id) !== String(id)
                        );
                        localStorage.setItem("badTeddyCart", JSON.stringify(updated));
                        return updated;
                    });
                    window.dispatchEvent(new Event("badTeddyCartUpdated"));
                    window.dispatchEvent(new Event("cartUpdated"));
                } else {
                    alert(data.message || "Unable to remove product.");
                }
            } catch (error) {
                console.error("Remove cart error:", error);
            }
        } else {
            // Guest user removal
            setCartItems(previousItems => {
                const updated = previousItems.filter(
                    cartItem => String(cartItem.id) !== String(id) && String(cartItem.product_id) !== String(id)
                );
                localStorage.setItem("badTeddyCart", JSON.stringify(updated));
                return updated;
            });
            window.dispatchEvent(new Event("badTeddyCartUpdated"));
            window.dispatchEvent(new Event("cartUpdated"));
        }
    };


    /* =====================================================
       WISHLIST
    ====================================================== */

    const toggleWishlist = (id) => {

        setWishlist(previous => {

            if (previous.includes(id)) {

                return previous.filter(
                    itemId => itemId !== id
                );

            }

            return [...previous, id];

        });

    };


    /* =====================================================
       PRICE CALCULATIONS
    ====================================================== */

    const subtotal = useMemo(() => {

    return cartItems.reduce(
        (total, item) =>
            total +
            Number(item.price) *
            Number(item.quantity),
        0
    );

}, [cartItems]);


    const couponDiscount =
        couponApplied ? Math.round(subtotal * 0.10) : 0;


    const deliveryCharge =
        subtotal >= 999 || subtotal === 0
            ? 0
            : 99;


    const total =
        subtotal -
        couponDiscount +
        deliveryCharge;


    /* =====================================================
       COUPON FUNCTION
    ====================================================== */

    const applyCoupon = () => {

        const cleanedCoupon =
            coupon.trim().toUpperCase();

        if (cleanedCoupon === "TEDDY10") {

            setCouponApplied(true);

        } else {

            setCouponApplied(false);

        }

    };


    /* =====================================================
       ADDRESS FORM
    ====================================================== */

    const handleAddressChange = (event) => {

        const {
            name,
            value
        } = event.target;

        setAddress(previous => ({
            ...previous,
            [name]: value
        }));

        setAddressSaved(false);

    };


    const saveAddress = (event) => {

        event.preventDefault();

        localStorage.setItem(
            "badTeddyAddress",
            JSON.stringify(address)
        );

        setAddressSaved(true);

    };


if (cartLoading) {

    return (
        <div className="cart-page">

            <div className="empty-cart">

                <div className="empty-cart-icon">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                </div>

                <h2 className="cart-title">
                    Loading your cart...
                </h2>

                <p>
                    Checking your Bad Teddy shopping bag.
                </p>

            </div>

        </div>
    );
}

    /* =====================================================
       CHECKOUT
       -----------------------------------------------------
       The address + cart are stored so your Order page
       can later read them.
    ====================================================== */

    const proceedToCheckout = () => {

        if (cartItems.length === 0) {
            return;
        }

        if (
            !address.fullName ||
            !address.phone ||
            !address.addressLine ||
            !address.city ||
            !address.state ||
            !address.pincode
        ) {

            document
                .getElementById("delivery-details")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            return;

        }


        const orderData = {

            cartItems,

            address,

            pricing: {
                subtotal,
                discount: couponDiscount,
                delivery: deliveryCharge,
                total
            },

            paymentStatus: "Pending",

            createdAt:
                new Date().toISOString()

        };


        localStorage.setItem(
            "badTeddyPendingOrder",
            JSON.stringify(orderData)
        );


        /*
         * Later:
         *
         * fetch("http://localhost/backend/api/orders.php", {
         *     method: "POST",
         *     headers: {
         *         "Content-Type": "application/json"
         *     },
         *     body: JSON.stringify(orderData)
         * });
         *
         */


        navigate("/checkout");

    };


    /* =====================================================
       RECOMMENDED PRODUCTS
    ====================================================== */

    const recommendedProducts = [

        {
            id: 101,
            name: "Relaxed Cargo Pants",
            price: 1599,
            image: resolveProductImage("prod3.jpg")
        },

        {
            id: 102,
            name: "Premium Graphic Tee",
            price: 999,
            image: resolveProductImage("prod4.jpg")
        },

        {
            id: 103,
            name: "Signature Teddy Cap",
            price: 799,
            image: resolveProductImage("prod5.png")
        },

        {
            id: 104,
            name: "Streetwear Hoodie",
            price: 1799,
            image: resolveProductImage("prod2.jpg")
        }

    ];

    const addRecommendedProduct = async (product) => {
        if (!loggedInUser?.id) {
            alert("Please login before adding products to cart.");
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost/BAD%20TEDDY/backend/api/cart.php",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        user_id: Number(loggedInUser.id),
                        product_id: Number(product.id),
                        size: product.size || "M",
                        quantity: 1
                    })
                }
            );

            const data = await response.json();

            if (data.success) {
                await loadCart();
                window.dispatchEvent(new Event("badTeddyCartUpdated"));
                window.dispatchEvent(new Event("cartUpdated"));
            } else {
                alert(data.message || "Unable to add product.");
            }
        } catch (error) {
            console.error("Recommended product error:", error);
            alert("Unable to connect to the cart server.");
        }
    };




    /* =====================================================
       EMPTY CART
    ====================================================== */

    
    if (cartItems.length === 0) {

        return (

            <div className="cart-page">

                <header className="cart-header">

                    <div className="cart-header-title">

                        <span>
                            BAD TEDDY
                        </span>

                        <h1 className="cart-title">
                            Your Cart
                        </h1>

                    </div>

                    <div className="cart-header-icons">

                        <button>
                            <i className="fa-regular fa-heart"></i>
                        </button>

                        <button>
                            <i className="fa-solid fa-bag-shopping"></i>
                        </button>

                    </div>

                </header>


                <div className="empty-cart">

                    <div className="empty-cart-icon">

                        <i className="fa-solid fa-bag-shopping"></i>

                    </div>

                    <h2 className="cart-title">
                        Your cart is empty
                    </h2>

                    <p>
                        Looks like you haven't added anything yet.
                    </p>

                    <button
                        onClick={() => navigate("/shop")}
                    >
                        Explore Collection
                        <i className="fa-solid fa-arrow-right"></i>
                    </button>

                </div>


                <CartBottomNav />

            </div>

        );

    }



    return (

        <div className="cart-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <header className="cart-header">

                <div className="cart-header-title">

                    <span>
                        BAD TEDDY
                    </span>

                    <h1 className="cart-title">
                        Shopping Bag
                    </h1>

                </div>


                <div className="cart-header-icons">

                    <button>

                        <i className="fa-regular fa-heart"></i>

                        {wishlist.length > 0 && (
                            <b>
                                {wishlist.length}
                            </b>
                        )}

                    </button>


                    <button>

                        <i className="fa-solid fa-bag-shopping"></i>

                        <b>
                            {cartItems.reduce(
                                (total, item) =>
                                    total + item.quantity,
                                0
                            )}
                        </b>

                    </button>

                </div>

            </header>



            {/* =================================================
                CART CONTENT
            ================================================= */}

            <main className="cart-container">


                {/* =============================================
                    LEFT
                ============================================== */}

                <section className="cart-left">


                    {/* CART ITEMS */}

                    <div className="cart-section-heading">

                        <div>

                            <span>
                                YOUR SELECTION
                            </span>

                            <h2 className="cart-title">
                                Cart Items
                            </h2>

                        </div>

                        <p>
                            {cartItems.length} items
                        </p>

                    </div>


                    <div className="cart-items">

                        {cartItems.map(item => {

                            const liked =
                                wishlist.includes(item.id);

                            return (

                                <article
                                    className="cart-item"
                                    key={item.id}
                                >

                                    <div className="cart-product-image">

                                        <img
    src={item.image}
    alt={item.name}
/>

                                        <button
                                            className={
                                                liked
                                                    ? "cart-wishlist liked"
                                                    : "cart-wishlist"
                                            }
                                            onClick={() =>
                                                toggleWishlist(item.id)
                                            }
                                        >

                                            <i
                                                className={
                                                    liked
                                                        ? "fa-solid fa-heart"
                                                        : "fa-regular fa-heart"
                                                }
                                            ></i>

                                        </button>

                                    </div>


                                    <div className="cart-product-info">

                                        <span className="cart-category">
                                            {item.category}
                                        </span>

                                        <h3>
                                            {item.name}
                                        </h3>


                                        <div className="cart-product-meta">

                                            <span>
                                                Size:
                                                <strong>
                                                    {item.size}
                                                </strong>
                                            </span>

                                        </div>


                                        <div className="cart-product-bottom">

                                            <strong className="cart-product-price">
                                                ₹{item.price}
                                            </strong>


                                            <div className="quantity-control">

                                                <button
                                                    onClick={() =>
                                                        changeQuantity(
                                                            item.id,
                                                            -1
                                                        )
                                                    }
                                                >
                                                    −
                                                </button>

                                                <span>
                                                    {item.quantity}
                                                </span>

                                                <button
                                                    onClick={() =>
                                                        changeQuantity(
                                                            item.id,
                                                            1
                                                        )
                                                    }
                                                >
                                                    +
                                                </button>

                                            </div>

                                        </div>

                                    </div>


                                    <button
                                        className="remove-item"
                                        onClick={() =>
                                            removeItem(item.id)
                                        }
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>

                                </article>

                            );

                        })}

                    </div>



                    {/* =========================================
                        CART UNIQUE FEATURE
                    ========================================== */}

                    <div className="style-progress">

                        <div className="style-progress-icon">

                            <i className="fa-solid fa-bolt"></i>

                        </div>


                        <div className="style-progress-content">

                            <div className="style-progress-top">

                                <strong>
                                    Almost there!
                                </strong>

                                <span>
                                    {subtotal >= 999
                                        ? "Free delivery unlocked"
                                        : `Add ₹${999 - subtotal} for free delivery`
                                    }
                                </span>

                            </div>


                            <div className="progress-track">

                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${Math.min(
                                            (subtotal / 999) * 100,
                                            100
                                        )}%`
                                    }}
                                ></div>

                            </div>

                        </div>

                    </div>



                    {/* =========================================
                        DELIVERY DETAILS
                    ========================================== */}

                    <section
                        className="details-card"
                        id="delivery-details"
                    >

                        <div className="details-heading">

                            <div>

                                <span>
                                    DELIVERY
                                </span>

                                <h2 className="cart-title">
                                    Where should we send it?
                                </h2>

                            </div>

                            <i className="fa-solid fa-location-dot"></i>

                        </div>


                        <form onSubmit={saveAddress}>

                            <div className="form-grid">

                                <div className="form-field">

                                    <label>
                                        Full Name
                                    </label>

                                    <input
                                        type="text"
                                        name="fullName"
                                        value={address.fullName}
                                        onChange={handleAddressChange}
                                        placeholder="Enter your full name"
                                        required
                                    />

                                </div>


                                <div className="form-field">

                                    <label>
                                        Phone Number
                                    </label>

                                    <input
                                        type="tel"
                                        name="phone"
                                        value={address.phone}
                                        onChange={handleAddressChange}
                                        placeholder="10 digit mobile number"
                                        pattern="[0-9]{10}"
                                        required
                                    />

                                </div>


                                <div className="form-field full-field">

                                    <label>
                                        Email Address
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={address.email}
                                        onChange={handleAddressChange}
                                        placeholder="you@example.com"
                                    />

                                </div>


                                <div className="form-field full-field">

                                    <label>
                                        Address
                                    </label>

                                    <textarea
                                        name="addressLine"
                                        value={address.addressLine}
                                        onChange={handleAddressChange}
                                        placeholder="House no., building, street, area"
                                        rows="3"
                                        required
                                    ></textarea>

                                </div>


                                <div className="form-field">

                                    <label>
                                        City
                                    </label>

                                    <input
                                        type="text"
                                        name="city"
                                        value={address.city}
                                        onChange={handleAddressChange}
                                        placeholder="Mumbai"
                                        required
                                    />

                                </div>


                                <div className="form-field">

                                    <label>
                                        State
                                    </label>

                                    <input
                                        type="text"
                                        name="state"
                                        value={address.state}
                                        onChange={handleAddressChange}
                                        placeholder="Maharashtra"
                                        required
                                    />

                                </div>


                                <div className="form-field">

                                    <label>
                                        Pincode
                                    </label>

                                    <input
                                        type="text"
                                        name="pincode"
                                        value={address.pincode}
                                        onChange={handleAddressChange}
                                        placeholder="400050"
                                        pattern="[0-9]{6}"
                                        required
                                    />

                                </div>

                            </div>


                            <div className="address-form-bottom">

                                {addressSaved && (

                                    <span className="saved-address">

                                        <i className="fa-solid fa-circle-check"></i>

                                        Address saved

                                    </span>

                                )}


                                <button
                                    type="submit"
                                    className="save-address-btn"
                                >

                                    <i className="fa-solid fa-check"></i>

                                    Save Address

                                </button>

                            </div>

                        </form>

                    </section>


                </section>



                {/* =============================================
                    RIGHT
                ============================================== */}

                <aside className="cart-right">


                    {/* ORDER SUMMARY */}

                    <div className="summary-card">

                        <div className="summary-heading">

                            <span>
                                ORDER SUMMARY
                            </span>

                            <h2 className="cart-title">
                                Your Total
                            </h2>

                        </div>


                        <div className="summary-lines">

                            <div>

                                <span>
                                    Subtotal
                                </span>

                                <strong>
                                    ₹{subtotal}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Delivery
                                </span>

                                <strong
                                    className={
                                        deliveryCharge === 0
                                            ? "gold-text"
                                            : ""
                                    }
                                >
                                    {deliveryCharge === 0
                                        ? "FREE"
                                        : `₹${deliveryCharge}`
                                    }
                                </strong>

                            </div>


                            {couponDiscount > 0 && (

                                <div>

                                    <span>
                                        Coupon Discount
                                    </span>

                                    <strong className="discount">
                                        -₹{couponDiscount}
                                    </strong>

                                </div>

                            )}

                        </div>


                        <div className="summary-divider"></div>


                        <div className="summary-total">

                            <span>
                                Total
                            </span>

                            <strong>
                                ₹{total}
                            </strong>

                        </div>


                        {/* COUPON */}

                        <div className="coupon-box">

                            <div className="coupon-title">

                                <i className="fa-solid fa-ticket"></i>

                                <span>
                                    Have a promo code?
                                </span>

                            </div>


                            <div className="coupon-input">

                                <input
                                    type="text"
                                    value={coupon}
                                    onChange={(e) =>
                                        setCoupon(e.target.value)
                                    }
                                    placeholder="Enter code"
                                />

                                <button
                                    type="button"
                                    onClick={applyCoupon}
                                >
                                    Apply
                                </button>

                            </div>


                            {couponApplied && (

                                <p className="coupon-success">

                                    <i className="fa-solid fa-circle-check"></i>

                                    TEDDY10 applied — 10% off

                                </p>

                            )}

                        </div>


                        <button
                            className="checkout-btn"
                            onClick={proceedToCheckout}
                        >

                            Proceed to Checkout

                            <i className="fa-solid fa-arrow-right"></i>

                        </button>


                        <div className="secure-checkout">

                            <i className="fa-solid fa-lock"></i>

                            Secure checkout

                            <span>•</span>

                            <i className="fa-solid fa-shield-halved"></i>

                            Protected payment

                        </div>

                    </div>



                    {/* RECOMMENDED */}

                    <section className="cart-recommended">

                        <div className="recommended-title">

                            <div>

                                <span>
                                    COMPLETE THE LOOK
                                </span>

                                <h2 className="cart-title">
                                    You May Also Like
                                </h2>

                            </div>

                        </div>


                        <div className="recommended-list">

                            {recommendedProducts.map(product => (

                                <div
                                    className="mini-product"
                                    key={product.id}
                                >

                                    <img
                                        src={product.image}
                                        alt={product.name}
                                    />


                                    <div className="mini-product-info">

                                        <h3>
                                            {product.name}
                                        </h3>

                                        <p>
                                            ₹{product.price}
                                        </p>

                                        <button
                                            onClick={() =>
                                                addRecommendedProduct(
                                                    product
                                                )
                                            }
                                        >

                                            <i className="fa-solid fa-plus"></i>

                                            Add

                                        </button>

                                    </div>

                                </div>

                            ))}

                        </div>

                    </section>


                </aside>

            </main>



            {/* =================================================
                BOTTOM NAV
            ================================================= */}

            <CartBottomNav />

        </div>

    );

}


/* =========================================================
   BOTTOM NAV COMPONENT

   Keeping this separate makes it easy to replace the
   hrefs with React Router later.
========================================================= */

function CartBottomNav() {
    const location = useLocation();
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


export default Cart;