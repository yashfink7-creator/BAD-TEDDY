import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "../styles/paymethod.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import logo from "../assets/mylogo.png";


function PayMethod() {

  const navigate = useNavigate();
  const location = useLocation();

  const [paymentMethods, setPaymentMethods] = useState([]);

  const [showForm, setShowForm] = useState(false);

  const [paymentType, setPaymentType] = useState("card");

  const [formData, setFormData] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    upiId: "",
  });

  const [message, setMessage] = useState("");


  const loggedInUser = (() => {
    try {
      const savedUser = localStorage.getItem("badTeddyUser");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  })();

  /* =========================================
      LOAD SAVED PAYMENT METHODS
  ========================================= */

  useEffect(() => {
    const loadPaymentMethods = async () => {
      let localMethods = [];
      try {
        const saved = JSON.parse(
          localStorage.getItem("badTeddyPaymentMethods")
        );
        if (Array.isArray(saved)) {
          localMethods = saved;
          setPaymentMethods(saved);
        }
      } catch (error) {
        console.error("Unable to load payment methods from storage:", error);
      }

      if (loggedInUser?.id) {
        try {
          const response = await fetch(
            `http://localhost/BAD%20TEDDY/backend/api/payment_methods.php?user_id=${loggedInUser.id}`
          );
          const data = await response.json();
          if (data.success && Array.isArray(data.paymentMethods)) {
            setPaymentMethods(data.paymentMethods);
            localStorage.setItem(
              "badTeddyPaymentMethods",
              JSON.stringify(data.paymentMethods)
            );
          }
        } catch (error) {
          console.error("Unable to load payment methods from API:", error);
        }
      }
    };

    loadPaymentMethods();
  }, []);


  /* =========================================
      INPUT HANDLER
  ========================================= */

  const handleChange = (e) => {

    const { name, value } = e.target;

    let updatedValue = value;


    // CARD NUMBER
    if (name === "cardNumber") {

      updatedValue = value
        .replace(/\D/g, "")
        .slice(0, 16);

    }


    // EXPIRY
    if (name === "expiry") {

      updatedValue = value
        .replace(/\D/g, "")
        .slice(0, 4);

      if (updatedValue.length >= 3) {

        updatedValue =
          updatedValue.slice(0, 2) +
          " / " +
          updatedValue.slice(2);

      }

    }


    // CVV
    if (name === "cvv") {

      updatedValue = value
        .replace(/\D/g, "")
        .slice(0, 3);

    }


    setFormData((previous) => ({
      ...previous,
      [name]: updatedValue,
    }));

  };


  /* =========================================
      SAVE PAYMENT METHOD
  ========================================= */

  const handleSavePayment = async (e) => {
    e.preventDefault();

    setMessage("");


    /* =========================
        CARD VALIDATION
    ========================= */

    if (paymentType === "card") {

      const cleanCardNumber =
        formData.cardNumber.replace(/\s/g, "");

      const cleanExpiry =
        formData.expiry.replace(/\s/g, "");

      if (!formData.cardName.trim()) {

        setMessage(
          "Please enter the name on your card."
        );

        return;

      }


      if (!/^\d{16}$/.test(cleanCardNumber)) {

        setMessage(
          "Please enter a valid 16-digit card number."
        );

        return;

      }


      if (!/^\d{2}\/\d{2}$/.test(cleanExpiry)) {

        setMessage(
          "Please enter expiry in MM / YY format."
        );

        return;

      }


      const month = Number(
        cleanExpiry.slice(0, 2)
      );

      if (month < 1 || month > 12) {

        setMessage(
          "Please enter a valid expiry month."
        );

        return;

      }


      if (!/^\d{3}$/.test(formData.cvv)) {

        setMessage(
          "Please enter a valid 3-digit CVV."
        );

        return;

      }

    }


    /* =========================
        UPI VALIDATION
    ========================= */

    if (paymentType === "upi") {

      const upiRegex =
        /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;

      if (!upiRegex.test(formData.upiId.trim())) {

        setMessage(
          "Please enter a valid UPI ID, for example name@upi."
        );

        return;

      }

    }


    /* =========================
        CREATE PAYMENT OBJECT
    ========================= */

    let newPayment;

    if (paymentType === "card") {
      const cleanCardNumber =
        formData.cardNumber.replace(/\s/g, "");

      newPayment = {
        id: "PAY" + Date.now(),
        type: "card",
        name: formData.cardName.trim(),
        cardName: formData.cardName.trim(),
        cardNumber: cleanCardNumber,
        lastFour: cleanCardNumber.slice(-4),
        expiry: formData.expiry,
        brand: getCardBrand(cleanCardNumber),
        createdAt: new Date().toISOString(),
        isDefault: paymentMethods.length === 0,
      };
    } else {
      newPayment = {
        id: "PAY" + Date.now(),
        type: "upi",
        upiId: formData.upiId.trim(),
        createdAt: new Date().toISOString(),
        isDefault: paymentMethods.length === 0,
      };
    }

    /* =========================
        BACKEND SYNC
    ========================= */
    if (loggedInUser?.id) {
      try {
        const payload = paymentType === "card" ? {
          user_id: loggedInUser.id,
          type: "card",
          cardName: formData.cardName.trim(),
          cardNumber: formData.cardNumber.replace(/\s/g, ""),
          expiry: formData.expiry,
          is_default: paymentMethods.length === 0 ? 1 : 0
        } : {
          user_id: loggedInUser.id,
          type: "upi",
          upiId: formData.upiId.trim(),
          is_default: paymentMethods.length === 0 ? 1 : 0
        };

        const res = await fetch("http://localhost/BAD%20TEDDY/backend/api/payment_methods.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && data.paymentMethod?.id) {
          newPayment.id = data.paymentMethod.id;
        }
      } catch (err) {
        console.error("Backend payment save error:", err);
      }
    }

    /* =========================
        SAVE
    ========================= */

    const updatedMethods = [
      ...paymentMethods,
      newPayment,
    ];

    setPaymentMethods(updatedMethods);

    localStorage.setItem(
      "badTeddyPaymentMethods",
      JSON.stringify(updatedMethods)
    );


    /* =========================
        RESET
    ========================= */

    setFormData({
      cardName: "",
      cardNumber: "",
      expiry: "",
      cvv: "",
      upiId: "",
    });

    setShowForm(false);

    setMessage("Payment method saved successfully.");

  };


  /* =========================================
      CARD BRAND
  ========================================= */

  const getCardBrand = (number) => {

    if (/^4/.test(number)) {
      return "Visa";
    }

    if (/^5[1-5]/.test(number)) {
      return "Mastercard";
    }

    if (/^(60|65|81|82)/.test(number)) {
      return "RuPay";
    }

    return "Card";

  };


  /* =========================================
      DELETE PAYMENT
  ========================================= */

  const deletePayment = async (id) => {

    if (loggedInUser?.id) {
      try {
        await fetch("http://localhost/BAD%20TEDDY/backend/api/payment_methods.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, user_id: loggedInUser.id })
        });
      } catch (err) {
        console.error("Backend payment delete error:", err);
      }
    }

    const updatedMethods =
      paymentMethods.filter(
        (payment) => payment.id !== id
      );

    let finalMethods = updatedMethods;

    // If default payment was deleted,
    // make first remaining payment default.

    if (
      finalMethods.length > 0 &&
      !finalMethods.some(
        (payment) => payment.isDefault
      )
    ) {

      finalMethods = finalMethods.map(
        (payment, index) => ({
          ...payment,
          isDefault: index === 0,
        })
      );

    }

    setPaymentMethods(finalMethods);

    localStorage.setItem(
      "badTeddyPaymentMethods",
      JSON.stringify(finalMethods)
    );

  };


  /* =========================================
      SET DEFAULT
  ========================================= */

  const setDefaultPayment = async (id) => {

    if (loggedInUser?.id) {
      try {
        await fetch("http://localhost/BAD%20TEDDY/backend/api/payment_methods.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set_default", id, user_id: loggedInUser.id })
        });
      } catch (err) {
        console.error("Backend payment set default error:", err);
      }
    }

    const updatedMethods =
      paymentMethods.map(
        (payment) => ({
          ...payment,
          isDefault:
            payment.id === id,
        })
      );

    setPaymentMethods(updatedMethods);

    localStorage.setItem(
      "badTeddyPaymentMethods",
      JSON.stringify(updatedMethods)
    );

  };


  return (

    <div className="payment-page">


      {/* =====================================
          HEADER
      ===================================== */}

      <header className="payment-header">

        <button
          className="payment-back-btn"
          onClick={() => navigate("/profile")}
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>


        <img
          src={logo}
          alt="Bad Teddy"
          className="payment-logo"
        />


        <button
          className="payment-cart-btn"
          onClick={() => navigate("/cart")}
        >
          <i className="fa-solid fa-bag-shopping"></i>
        </button>

      </header>


      {/* =====================================
          MAIN
      ===================================== */}

      <main className="payment-main">


        {/* HERO */}

        <section className="payment-hero">

          <span>
            BAD TEDDY / ACCOUNT
          </span>

          <h1 className="text-color">
            Payment Methods
          </h1>

          <p>
            Manage your saved payment options for
            faster and easier checkout.
          </p>

        </section>


        {/* SECURITY BANNER */}

        <section className="payment-security">

          <div className="security-icon">

            <i className="fa-solid fa-shield-halved"></i>

          </div>

          <div>

            <strong>
              Your payment information is protected
            </strong>

            <p>
              Bad Teddy does not store your full card
              number or CVV.
            </p>

          </div>

          <i className="fa-solid fa-lock security-lock"></i>

        </section>


        {/* SUCCESS MESSAGE */}

        {message && (

          <div
            className={`payment-message ${
              message.includes("successfully")
                ? "success"
                : "error"
            }`}
          >

            <i
              className={`fa-solid ${
                message.includes("successfully")
                  ? "fa-circle-check"
                  : "fa-circle-exclamation"
              }`}
            ></i>

            {message}

          </div>

        )}


        {/* =====================================
            SAVED METHODS
        ===================================== */}

        <section className="saved-payment-section">

          <div className="payment-section-heading">

            <div>

              <span>
                SAVED OPTIONS
              </span>

              <h2 className="text-color">
                Your Payment Methods
              </h2>

            </div>


            <button
              className="add-payment-btn"
              onClick={() => {
                setShowForm(!showForm);
                setMessage("");
              }}
            >

              <i
                className={`fa-solid ${
                  showForm
                    ? "fa-xmark"
                    : "fa-plus"
                }`}
              ></i>

              {showForm
                ? "Cancel"
                : "Add Payment"}

            </button>

          </div>


          {/* EMPTY */}

          {paymentMethods.length === 0 && !showForm && (

            <div className="empty-payment">

              <div className="empty-payment-icon">

                <i className="fa-regular fa-credit-card"></i>

              </div>

              <h3>
                No payment methods saved
              </h3>

              <p>
                Add a card or UPI ID to make checkout
                faster.
              </p>

              <button
                className="empty-add-btn"
                onClick={() => setShowForm(true)}
              >
                ADD PAYMENT METHOD
              </button>

            </div>

          )}


          {/* SAVED CARDS */}

          <div className="payment-method-list">

            {paymentMethods.map((payment) => (

              <article
                className={`payment-method-card ${
                  payment.isDefault
                    ? "default-payment"
                    : ""
                }`}
                key={payment.id}
              >

                <div className="payment-method-icon">

                  <i
                    className={`fa-solid ${
                      payment.type === "upi"
                        ? "fa-mobile-screen-button"
                        : "fa-credit-card"
                    }`}
                  ></i>

                </div>


                <div className="payment-method-details">

                  <div className="payment-method-title">

                    <h3>

                      {payment.type === "upi"
                        ? "UPI"
                        : payment.brand}

                    </h3>

                    {payment.isDefault && (

                      <span className="default-badge">
                        DEFAULT
                      </span>

                    )}

                  </div>


                  {payment.type === "upi" ? (

                    <p>
                      {payment.upiId}
                    </p>

                  ) : (

                    <>

                      <p>
                        •••• •••• •••• {payment.lastFour}
                      </p>

                      <span>
                        {payment.name}
                        {" · "}
                        Expires {payment.expiry}
                      </span>

                    </>

                  )}

                </div>


                <div className="payment-method-actions">

                  {!payment.isDefault && (

                    <button
                      className="default-btn"
                      onClick={() =>
                        setDefaultPayment(payment.id)
                      }
                    >
                      Set Default
                    </button>

                  )}

                  <button
                    className="delete-payment-btn"
                    onClick={() =>
                      deletePayment(payment.id)
                    }
                    aria-label="Delete payment method"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>

                </div>

              </article>

            ))}

          </div>

        </section>


        {/* =====================================
            ADD PAYMENT FORM
        ===================================== */}

        {showForm && (

          <section className="payment-form-card">

            <div className="payment-form-heading">

              <div className="form-number">
                01
              </div>

              <div>

                <span>
                  NEW PAYMENT
                </span>

                <h2 className="text-color">
                  Add Payment Method
                </h2>

              </div>

            </div>


            {/* PAYMENT TYPE */}

            <div className="payment-type-selector">

              <button
                type="button"
                className={
                  paymentType === "card"
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setPaymentType("card");
                  setMessage("");
                }}
              >

                <i className="fa-regular fa-credit-card"></i>

                <span>
                  Card
                </span>

              </button>


              <button
                type="button"
                className={
                  paymentType === "upi"
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setPaymentType("upi");
                  setMessage("");
                }}
              >

                <i className="fa-solid fa-mobile-screen-button"></i>

                <span>
                  UPI
                </span>

              </button>

            </div>


            <form
              className="payment-form"
              onSubmit={handleSavePayment}
            >


              {/* CARD */}

              {paymentType === "card" && (

                <>

                  <div className="payment-input full">

                    <label>
                      Name on Card
                    </label>

                    <input
                      type="text"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleChange}
                      placeholder="Enter name as shown on card"
                      autoComplete="cc-name"
                      required
                    />

                  </div>


                  <div className="payment-input full">

                    <label>
                      Card Number
                    </label>

                    <div className="input-with-icon">

                      <i className="fa-regular fa-credit-card"></i>

                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        placeholder="1234 5678 9012 3456"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        required
                      />

                    </div>

                  </div>


                  <div className="payment-form-grid">

                    <div className="payment-input">

                      <label>
                        Expiry Date
                      </label>

                      <input
                        type="text"
                        name="expiry"
                        value={formData.expiry}
                        onChange={handleChange}
                        placeholder="MM / YY"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        required
                      />

                    </div>


                    <div className="payment-input">

                      <label>
                        CVV
                      </label>

                      <input
                        type="password"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleChange}
                        placeholder="•••"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        required
                      />

                    </div>

                  </div>

                </>

              )}


              {/* UPI */}

              {paymentType === "upi" && (

                <div className="payment-input full">

                  <label>
                    UPI ID
                  </label>

                  <div className="input-with-icon">

                    <i className="fa-solid fa-at"></i>

                    <input
                      type="text"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleChange}
                      placeholder="yourname@upi"
                      autoComplete="off"
                      required
                    />

                  </div>

                  <small>
                    Example: yash@upi
                  </small>

                </div>

              )}


              <div className="payment-form-bottom">

                <div>

                  <i className="fa-solid fa-lock"></i>

                  <span>
                    Your details are protected.
                  </span>

                </div>


                <button
                  type="submit"
                  className="save-payment-btn"
                >

                  SAVE PAYMENT

                  <i className="fa-solid fa-arrow-right"></i>

                </button>

              </div>

            </form>

          </section>

        )}


        {/* =====================================
            PAYMENT INFO
        ===================================== */}

        <section className="payment-info-grid">

          <div>

            <i className="fa-solid fa-shield-halved"></i>

            <h3>
              Secure
            </h3>

            <p>
              Your full payment details are never
              displayed after saving.
            </p>

          </div>


          <div>

            <i className="fa-solid fa-bolt"></i>

            <h3>
              Faster Checkout
            </h3>

            <p>
              Select your saved payment option while
              placing your next order.
            </p>

          </div>


          <div>

            <i className="fa-solid fa-trash-can"></i>

            <h3>
              Full Control
            </h3>

            <p>
              Remove saved payment methods whenever
              you want.
            </p>

          </div>

        </section>

      </main>


      {/* =====================================
          BOTTOM NAV
      ===================================== */}

      <BottomNav
        location={location}
      />

    </div>

  );

}


/* =========================================
    BOTTOM NAVIGATION
========================================= */

function BottomNav({ location }) {

  return (

    <nav className="bottom-nav">

      <Link
        to="/"
        className={
          location.pathname === "/"
            ? "active"
            : ""
        }
      >
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
      </Link>


      <Link
        to="/shop"
        className={
          location.pathname === "/shop"
            ? "active"
            : ""
        }
      >
        <i className="fa-solid fa-bag-shopping"></i>
        <span>Shop</span>
      </Link>


      <Link
        to="/assistant"
        className={
          location.pathname === "/assistant"
            ? "active"
            : ""
        }
      >
        <i className="fa-solid fa-robot"></i>
        <span>AI</span>
      </Link>


      <Link
        to="/profile"
        className={
          location.pathname === "/profile"
            ? "active"
            : ""
        }
      >
        <i className="fa-regular fa-user"></i>
        <span>Profile</span>
      </Link>

    </nav>

  );

}


export default PayMethod;