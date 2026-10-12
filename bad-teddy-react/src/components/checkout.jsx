import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "../styles/Checkout.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import logo from "../assets/mylogo.png";
import resolveProductImage from "../utils/imageResolver";




function Checkout() {

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
      STATE
  ===================================================== */

  const [cartItems, setCartItems] = useState([]);
const [cartLoading, setCartLoading] = useState(true);

  const [orderPlaced, setOrderPlaced] = useState(false);

  const [orderNumber, setOrderNumber] = useState("");

  const [activePayment, setActivePayment] = useState("upi");

  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });







 /* =====================================================
   CART EFFECT
===================================================== */

useEffect(() => {

  const loadCheckoutData = async () => {

    if (!loggedInUser?.id) {

      setCartItems([]);
      setCartLoading(false);

      navigate("/login");

      return;
    }

    try {

      setCartLoading(true);

      const cartResponse = await fetch(
        `http://localhost/BAD%20TEDDY/backend/api/cart.php?user_id=${loggedInUser.id}`
      );

      const cartData = await cartResponse.json();

      console.log("Checkout cart:", cartData);

      if (cartData.success) {

        setCartItems(
          cartData.cart || []
        );

      } else {

        setCartItems([]);

      }


      /* =========================
         LOAD SAVED ADDRESS
      ========================= */

      let addressLoaded = false;
      const savedAddress =
        JSON.parse(
          localStorage.getItem("badTeddyAddress")
        );

      if (savedAddress && Object.keys(savedAddress).length > 0) {
        setFormData(previous => ({
          ...previous,
          ...savedAddress
        }));
        addressLoaded = true;
      }

      // If not in local storage or empty, fetch saved address from API
      if (!addressLoaded && loggedInUser?.id) {
        try {
          const addrResp = await fetch(
            `http://localhost/BAD%20TEDDY/backend/api/addresses.php?user_id=${loggedInUser.id}`
          );
          const addrData = await addrResp.json();
          if (addrData.success && Array.isArray(addrData.addresses) && addrData.addresses.length > 0) {
            const defaultAddr = addrData.addresses.find(a => a.isDefault) || addrData.addresses[0];
            setFormData(previous => ({
              ...previous,
              firstName: defaultAddr.firstName || previous.firstName,
              lastName: defaultAddr.lastName || previous.lastName,
              phone: defaultAddr.phone || previous.phone,
              address: defaultAddr.address || previous.address,
              city: defaultAddr.city || previous.city,
              state: defaultAddr.state || previous.state,
              pincode: defaultAddr.pincode || previous.pincode,
            }));
          }
        } catch (addrErr) {
          console.error("Unable to load saved address from API:", addrErr);
        }
      }

    } catch (error) {

      console.error(
        "Unable to load checkout data:",
        error
      );

      setCartItems([]);

    } finally {

      setCartLoading(false);

    }

  };

  loadCheckoutData();

}, []);

  /* =====================================================
      HANDLE INPUT
  ===================================================== */

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  /* =====================================================
      CART TOTAL
  ===================================================== */

  const subtotal = useMemo(() => {

    return cartItems.reduce((total, item) => {

      const price = Number(
        String(item.price || 0).replace(/[₹,]/g, "")
      );

      const quantity = Number(item.quantity || 1);

      return total + price * quantity;

    }, 0);

  }, [cartItems]);


  const shipping = subtotal >= 1999 || subtotal === 0
    ? 0
    : 99;


  const total = subtotal + shipping;


  /* =====================================================
      PLACE ORDER
  ===================================================== */
const handlePlaceOrder = async (e) => {

  e.preventDefault();

  if (!loggedInUser?.id) {
    alert("Please login again.");
    navigate("/login");
    return;
  }

  if (cartItems.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  try {

    const response = await fetch(
      "http://localhost/BAD%20TEDDY/backend/api/orders.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: loggedInUser.id,

          customer: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode
          },

          payment_method: activePayment
        })
      }
    );

    const data = await response.json();

    console.log("ORDER API RESPONSE:", data);

    if (!data.success) {

      alert(
        data.message ||
        "Unable to place order."
      );

      return;
    }

    localStorage.setItem(
      "badTeddyOrder",
      JSON.stringify(data.order)
    );

    // Also update order history list in local storage
    try {
      const existingOrders = JSON.parse(localStorage.getItem("badTeddyOrders")) || [];
      const updatedOrders = [data.order, ...existingOrders.filter(o => o.orderNumber !== data.order.orderNumber)];
      localStorage.setItem("badTeddyOrders", JSON.stringify(updatedOrders));
    } catch (storageErr) {
      console.error("Order history storage error:", storageErr);
    }

    localStorage.removeItem("badTeddyCart");

    window.dispatchEvent(
      new Event("badTeddyCartUpdated")
    );
    window.dispatchEvent(
      new Event("badTeddyOrderUpdated")
    );

    navigate("/order", {
      replace: true
    });

  } catch (error) {

    console.error(
      "ORDER CREATION ERROR:",
      error
    );

    alert(
      "Unable to connect to the order server."
    );

  }



};


    // ==========================================
    // PAY METH
    // ==========================================
useEffect(() => {

  try {

    const savedMethods = JSON.parse(
      localStorage.getItem("badTeddyPaymentMethods")
    );

    if (Array.isArray(savedMethods)) {

      setSavedPaymentMethods(savedMethods);

    }

  } catch (error) {

    console.error(
      "Unable to load payment methods:",
      error
    );

  }

}, []);



if (cartLoading) {

  return (
    <div className="checkout-page">

      <main className="empty-checkout">

        <div className="empty-icon">
          <i className="fa-solid fa-spinner fa-spin"></i>
        </div>

        <h1>Loading checkout...</h1>

        <p>
          Fetching your order details.
        </p>

      </main>

      <BottomNav />

    </div>
  );

}
  /* =====================================================
      EMPTY CART
  ===================================================== */

  if (!orderPlaced && cartItems.length === 0) {

    

    return (

      <div className="checkout-page">

        <header className="checkout-header">

          <img
            src={logo}
            alt="Bad Teddy"
            className="checkout-logo"
          />

        </header>


        <main className="empty-checkout">

          <div className="empty-icon">

            <i className="fa-solid fa-bag-shopping"></i>

          </div>

          <h1>Your bag is empty</h1>

          <p>
            Add something from the Bad Teddy collection
            before checking out.
          </p>

          <button
            className="primary-gold-btn"
            onClick={() => navigate("/shop")}
          >
            EXPLORE COLLECTION
            <i className="fa-solid fa-arrow-right"></i>
          </button>

        </main>


        <BottomNav />

      </div>

    );

  }


  /* =====================================================
      ORDER SUCCESS / TRACKING
  ===================================================== */

  if (orderPlaced) {

    return (

      <div className="checkout-page">

        <header className="checkout-header">

  {/* BACK BUTTON */}
  <button
    className="back-btn"
    onClick={() => navigate("/cart")}
    aria-label="Go back to cart"
  >
    <i className="fa-solid fa-arrow-left"></i>
  </button>


  {/* CENTER LOGO */}
  <img
    src={logo}
    alt="Bad Teddy"
    className="checkout-logo"
  />


  {/* RIGHT SIDE ICONS */}
  <div className="checkout-header-icons">

    {/* WISHLIST */}
    <button
      className="header-icon-btn"
      onClick={() => navigate("/wishlist")}
      aria-label="Wishlist"
    >
      <i className="fa-regular fa-heart"></i>
    </button>


    {/* CART */}
    <button
      className="header-icon-btn cart-header-btn"
      onClick={() => navigate("/cart")}
      aria-label="Shopping cart"
    >
      <i className="fa-solid fa-bag-shopping"></i>

      {cartItems.length > 0 && (
        <span className="cart-count">
          {cartItems.reduce(
            (total, item) =>
              total + Number(item.quantity || 1),
            0
          )}
        </span>
      )}

    </button>

  </div>

</header>


        <main className="order-success-container">

          <section className="success-card">

            <div className="success-icon">

              <i className="fa-solid fa-check"></i>

            </div>


            <p className="success-label">
              ORDER CONFIRMED
            </p>

            <h1>
              Your Bad Teddy order is on its way.
            </h1>

            <p className="success-description">

              Thank you for shopping with Bad Teddy.
              We've received your order and will keep
              you updated throughout the delivery.

            </p>


            <div className="order-number-box">

              <span>ORDER NUMBER</span>

              <strong>
                #{orderNumber}
              </strong>

            </div>

          </section>


          {/* TRACKING */}

          <section className="tracking-section">

            <div className="section-title">

              <div>

                <span>
                  DELIVERY JOURNEY
                </span>

                <h2>
                  Track Your Order
                </h2>

              </div>

              <i className="fa-solid fa-truck-fast"></i>

            </div>


            <div className="tracking-line">

              <TrackingStep
                icon="fa-check"
                title="Order Confirmed"
                description="We've received your order"
                active
              />

              <TrackingStep
                icon="fa-box"
                title="Preparing"
                description="Your pieces are being packed"
              />

              <TrackingStep
                icon="fa-truck"
                title="On The Way"
                description="Your order leaves our warehouse"
              />

              <TrackingStep
                icon="fa-house"
                title="Delivered"
                description="Enjoy your Bad Teddy fit"
              />

            </div>

          </section>


          {/* ORDER SUMMARY */}

          <section className="success-summary">

            <div className="section-title">

              <div>

                <span>
                  YOUR PURCHASE
                </span>

                <h2>
                  Order Summary
                </h2>

              </div>

            </div>


            <div className="success-summary-card">

              <div>

                <span>Order Total</span>

                <strong>
                  ₹{total.toLocaleString("en-IN")}
                </strong>

              </div>

              <div>

                <span>Payment</span>

                <strong>
                  {activePayment.toUpperCase()}
                </strong>

              </div>

            </div>

          </section>


          {/* Customer Reviews */}

        <CustomerReviews />


        </main>


        <BottomNav />

      </div>

    );

  }


  /* =====================================================
      CHECKOUT PAGE
  ===================================================== */

  return (

    <div className="checkout-page">

      {/* HEADER */}

      <header className="checkout-header">

  {/* BACK BUTTON */}
  <button
    className="back-btn"
    onClick={() => navigate("/cart")}
  >
    <i className="fa-solid fa-arrow-left"></i>
  </button>

  {/* CENTER LOGO */}
  <img
    src={logo}
    alt="Bad Teddy"
    className="checkout-logo"
  />

  {/* RIGHT ICONS */}
  <div className="checkout-header-icons">

    <button
      className="header-icon-btn"
      onClick={() => navigate("/wishlist")}
    >
      <i className="fa-regular fa-heart"></i>
    </button>

    <button
      className="header-icon-btn"
      onClick={() => navigate("/cart")}
    >
      <i className="fa-solid fa-bag-shopping"></i>

      {cartItems.length > 0 && (
        <span className="cart-count">
          {cartItems.reduce(
            (total, item) =>
              total + Number(item.quantity || 1),
            0
          )}
        </span>
      )}

    </button>

  </div>

</header>


      {/* MAIN */}

      <main className="checkout-main">


        {/* PAGE TITLE */}

        <div className="checkout-heading">

          <span>
            BAD TEDDY / CHECKOUT
          </span>

          <h2 className="checkout-title">
            Complete Your Order
          </h2>

          <p>
            You're one step away from your next favourite fit.
          </p>

        </div>


        <form
          className="checkout-layout"
          onSubmit={handlePlaceOrder}
        >


          {/* =================================================
              LEFT COLUMN
          ================================================= */}

          <div className="checkout-left">


            {/* DELIVERY DETAILS */}

            <section className="checkout-card">

              <div className="checkout-card-header">

                <div className="number-circle">
                  01
                </div>

                <div>

                  <span>
                    DELIVERY
                  </span>

                  <h2 className="checkout-title">
                    Your Details
                  </h2>

                </div>

              </div>


              <div className="form-grid">

                <div className="form-field">

                  <label>
                    First Name
                  </label>

                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter your first name"
                    required
                  />

                </div>


                <div className="form-field">

                  <label>
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter your last name"
                    required
                  />

                </div>


                <div className="form-field">

                  <label>
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
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
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX"
                    required
                  />

                </div>


                <div className="form-field full">

                  <label>
                    Delivery Address
                  </label>

                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="House no., building, street..."
                    rows="3"
                    required
                  />

                </div>


                <div className="form-field">

                  <label>
                    City
                  </label>

                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
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
                    value={formData.state}
                    onChange={handleChange}
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
  value={formData.pincode}
  onChange={handleChange}
  placeholder="400050"
  maxLength="6"
  required
  className={formData.pincode ? "filled" : ""}
/>

                </div>

              </div>

            </section>


            {/* PAYMENT */}

            <section className="checkout-card">

              <div className="checkout-card-header">

                <div className="number-circle">
                  02
                </div>

                <div>

                  <span>
                    PAYMENT
                  </span>

                  <h2 className="checkout-title">
                    Choose Payment
                  </h2>

                  <div className="checkout-payment-manage">

  <p>
    Manage your saved payment options from your account.
  </p>

  <button
    type="button"
    onClick={() => navigate("/paymethod")}
  >
    <i className="fa-solid fa-credit-card"></i>

    Manage Payment Methods

    <i className="fa-solid fa-arrow-right"></i>
  </button>

</div>

                </div>

              </div>


              <div className="payment-options">


                {/* UPI */}

                <button
                  type="button"
                  className={`payment-option ${
                    activePayment === "upi"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => setActivePayment("upi")}
                >

                  <div className="payment-icon">

                    <i className="fa-solid fa-mobile-screen-button"></i>

                  </div>

                  <div>

                    <strong>
                      UPI
                    </strong>

                    <span>
                      Google Pay · PhonePe · Paytm
                    </span>

                  </div>

                  <i className="fa-solid fa-circle-check"></i>

                </button>


                {/* CARD */}

                <button
                  type="button"
                  className={`payment-option ${
                    activePayment === "card"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => setActivePayment("card")}
                >

                  <div className="payment-icon">

                    <i className="fa-regular fa-credit-card"></i>

                  </div>

                  <div>

                    <strong>
                      Credit / Debit Card
                    </strong>

                    <span>
                      Visa · Mastercard · RuPay
                    </span>

                  </div>

                  <i className="fa-solid fa-circle-check"></i>

                </button>


                {/* COD */}

                <button
                  type="button"
                  className={`payment-option ${
                    activePayment === "cod"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => setActivePayment("cod")}
                >

                  <div className="payment-icon">

                    <i className="fa-solid fa-money-bill-wave"></i>

                  </div>

                  <div>

                    <strong>
                      Cash On Delivery
                    </strong>

                    <span>
                      Pay when your order arrives
                    </span>

                  </div>

                  <i className="fa-solid fa-circle-check"></i>

                </button>


              </div>


              {/* CARD DETAILS */}

              {activePayment === "card" && (

                <div className="card-details">

                  <div className="form-field">

                    <label>
                      Card Number
                    </label>

                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                    />

                  </div>


                  <div className="card-small-fields">

                    <div className="form-field">

                      <label>
                        Expiry
                      </label>

                      <input
                        type="text"
                        placeholder="MM / YY"
                        maxLength="5"
                      />

                    </div>


                    <div className="form-field">

                      <label>
                        CVV
                      </label>

                      <input
                        type="password"
                        placeholder="•••"
                        maxLength="3"
                      />

                    </div>

                  </div>

                </div>

              )}

            </section>


            {/* TRUST */}

            <div className="checkout-trust">

              <div>

                <i className="fa-solid fa-shield-halved"></i>

                <span>
                  Secure Payment
                </span>

              </div>

              <div>

                <i className="fa-solid fa-rotate-left"></i>

                <span>
                  Easy Returns
                </span>

              </div>

              <div>

                <i className="fa-solid fa-headset"></i>

                <span>
                  Support
                </span>

              </div>

            </div>


          </div>


          {/* =================================================
              RIGHT COLUMN
          ================================================= */}

          <aside className="checkout-right">


            {/* ORDER SUMMARY */}

            <section className="order-summary">

              <div className="summary-header">

                <div>

                  <span>
                    YOUR BAG
                  </span>

                  <h2 className="checkout-title">
                    Order Summary
                  </h2>

                </div>

                <span className="item-count">

                  {cartItems.reduce(
                    (total, item) =>
                      total + Number(item.quantity || 1),
                    0
                  )}

                  {" "}Items

                </span>

              </div>


              <div className="summary-products">

                {cartItems.map((item, index) => (

                  <div
                    className="summary-product"
                    key={item.id || index}
                  >

                    <div className="summary-image">

                      <img
                        src={resolveProductImage(item.image)}
                        alt={item.name}
                      />

                    </div>


                    <div className="summary-product-info">

                      <h3>
                        {item.name}
                      </h3>

                      {item.size && (
                        <span>
                          Size: {item.size}
                        </span>
                      )}

                      <span>
                        Qty: {item.quantity || 1}
                      </span>

                    </div>


                    <strong>

                      ₹
                      {(
                        Number(
                          String(item.price || 0)
                            .replace(/[₹,]/g, "")
                        ) *
                        Number(item.quantity || 1)
                      ).toLocaleString("en-IN")}

                    </strong>

                  </div>

                ))}

              </div>


              {/* SHIPPING PROGRESS */}

              {subtotal > 0 && subtotal < 1999 && (

                <div className="free-shipping-box">

                  <i className="fa-solid fa-truck-fast"></i>

                  <div>

                    <strong>
                      You're close to FREE SHIPPING
                    </strong>

                    <span>
                      Add ₹
                      {(1999 - subtotal).toLocaleString("en-IN")}
                      {" "}more to unlock it.
                    </span>

                  </div>

                </div>

              )}


              {subtotal >= 1999 && (

                <div className="free-shipping-box unlocked">

                  <i className="fa-solid fa-circle-check"></i>

                  <div>

                    <strong>
                      FREE SHIPPING UNLOCKED
                    </strong>

                    <span>
                      Your Bad Teddy pieces are shipping free.
                    </span>

                  </div>

                </div>

              )}


              {/* TOTALS */}

              <div className="summary-totals">

                <div>

                  <span>
                    Subtotal
                  </span>

                  <strong>
                    ₹{subtotal.toLocaleString("en-IN")}
                  </strong>

                </div>


                <div>

                  <span>
                    Shipping
                  </span>

                  <strong>

                    {shipping === 0
                      ? "FREE"
                      : `₹${shipping}`
                    }

                  </strong>

                </div>


                <div className="grand-total">

                  <span>
                    Total
                  </span>

                  <strong>
                    ₹{total.toLocaleString("en-IN")}
                  </strong>

                </div>

              </div>


              <button
                type="submit"
                className="place-order-btn"
              >

                <span>
                  PLACE ORDER
                </span>

                <i className="fa-solid fa-arrow-right"></i>

              </button>


              <p className="secure-note">

                <i className="fa-solid fa-lock"></i>

                Your information is securely protected.

              </p>

            </section>


          </aside>


        </form>


        {/* Customer Reviews */}

        <CustomerReviews />


      </main>


      <BottomNav />

    </div>

  );



/* =====================================================
    TRACKING COMPONENT
===================================================== */

function TrackingStep({
  icon,
  title,
  description,
  active = false,
}) {

  return (

    <div
      className={`tracking-step ${
        active ? "active" : ""
      }`}
    >

      <div className="tracking-icon">

        <i className={`fa-solid ${icon}`}></i>

      </div>

      <div>

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

      </div>

    </div>

  );

}


/* =====================================================
    CUSTOMER REVIEWS
===================================================== */

function CustomerReviews() {

  const reviews = [
    {
      id: 1,
      name: "Aarav M.",
      rating: 5,
      text: "The quality is honestly amazing. The fit is exactly what I wanted and the fabric feels premium.",
      product: "Oversized Tee",
    },

    {
      id: 2,
      name: "Riya S.",
      rating: 5,
      text: "Loved the whole Bad Teddy experience. The packaging was great and the hoodie looks even better in person.",
      product: "Street Hoodie",
    },

    {
      id: 3,
      name: "Kabir R.",
      rating: 4,
      text: "Really good quality and the cargo pants fit perfectly. Definitely ordering again.",
      product: "Cargo Pants",
    },

    {
      id: 4,
      name: "Ananya P.",
      rating: 5,
      text: "The designs are so different from regular streetwear brands. Absolutely loved my purchase!",
      product: "Graphic Tee",
    },
  ];

  return (

    <section className="reviews-section">

      {/* HEADING */}

      <div className="reviews-heading">

        <div>

          <span>
            WHAT THEY SAY
          </span>

          <h2>
            Customer Reviews
          </h2>

          <p>
            Real fits. Real people. Real Bad Teddy love.
          </p>

        </div>


        {/* OVERALL RATING */}

        <div className="overall-rating">

          <strong>
            4.8
          </strong>

          <div>

            <div className="stars">
              ★★★★★
            </div>

            <span>
              Based on 120+ reviews
            </span>

          </div>

        </div>

      </div>


      {/* REVIEW CARDS */}

      <div className="reviews-row">

        {reviews.map((review) => (

          <article
            className="review-card"
            key={review.id}
          >

            {/* CUSTOMER */}

            <div className="review-top">

              <div className="review-avatar">
                {review.name.charAt(0)}
              </div>

              <div>

                <strong>
                  {review.name}
                </strong>

                <span>
                  Verified Buyer
                </span>

              </div>

            </div>


            {/* RATING */}

            <div className="review-stars">

              {"★".repeat(review.rating)}

              {"☆".repeat(5 - review.rating)}

            </div>


            {/* REVIEW */}

            <p>
              "{review.text}"
            </p>


            {/* PRODUCT */}

            <span className="review-product">
              Purchased: {review.product}
            </span>

          </article>

        ))}

      </div>

    </section>

  );

}


/* =====================================================
    BOTTOM NAVIGATION
===================================================== */

    function BottomNav() {

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
}


export default Checkout;