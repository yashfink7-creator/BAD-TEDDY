import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "../styles/wishlist.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import logo from "../assets/mylogo.png";
import resolveProductImage from "../utils/imageResolver";

function Wishlist() {

  const navigate = useNavigate();
  const location = useLocation();

  const [wishlist, setWishlist] = useState([]);
const [loadingWishlist, setLoadingWishlist] = useState(true);
const [wishlistError, setWishlistError] = useState("");



// *===========LOGIN PART =====================*
const loggedInUser = (() => {
  try {
    const savedUser = localStorage.getItem("badTeddyUser");

    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
})();


  /* =====================================================
     LOAD WISHLIST
  ===================================================== */

const loadWishlist = async () => {

  if (!loggedInUser?.id) {
    setWishlist([]);
    setLoadingWishlist(false);
    setWishlistError("Please login to view your wishlist.");
    return;
  }

  try {

    setLoadingWishlist(true);
    setWishlistError("");

    const response = await fetch(
      `http://localhost/BAD%20TEDDY/backend/api/wishlist.php?user_id=${loggedInUser.id}`
    );

    const data = await response.json();

    console.log("Wishlist API response:", data);

    if (data.success) {

      const products = Array.isArray(data.wishlist)
        ? data.wishlist.map((product) => ({
            ...product,
            image: resolveProductImage(product.image),
            rawImage: product.image
          }))
        : [];

      setWishlist(products);

    } else {

      setWishlist([]);
      setWishlistError(
        data.message || "Unable to load wishlist."
      );

    }

  } catch (error) {

    console.error("Wishlist fetch error:", error);

    setWishlist([]);
    setWishlistError(
      "Unable to connect to the wishlist server."
    );

  } finally {

    setLoadingWishlist(false);

  }

};


  /* =====================================================
     INITIAL LOAD & SYNC
  ===================================================== */

  useEffect(() => {
    loadWishlist();

    const handleWishlistChange = () => {
      loadWishlist();
    };

    window.addEventListener("badTeddyWishlistUpdated", handleWishlistChange);

    return () => {
      window.removeEventListener("badTeddyWishlistUpdated", handleWishlistChange);
    };
  }, []);

  

  /* =====================================================
     REMOVE ITEM
  ===================================================== */

  const removeFromWishlist = async (productId) => {

    if (!loggedInUser?.id) {
      alert("Please login again.");
      return;
    }

    try {

      const response = await fetch(
        "http://localhost/BAD%20TEDDY/backend/api/wishlist.php",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: Number(loggedInUser.id),
            product_id: Number(productId),
          }),
        }
      );

      const data = await response.json();

      console.log("Remove wishlist response:", data);

      if (data.success) {

        setWishlist((current) =>
          current.filter(
            (item) =>
              String(item.id) !== String(productId)
          )
        );

        try {
          const savedWishlist = JSON.parse(localStorage.getItem("badTeddyWishlist") || "[]");
          const updatedWish = savedWishlist.filter(
            (item) => String(item.id) !== String(productId)
          );
          localStorage.setItem("badTeddyWishlist", JSON.stringify(updatedWish));
        } catch {
          // ignore
        }

        window.dispatchEvent(
          new Event("badTeddyWishlistUpdated")
        );

      } else {

        alert(
          data.message ||
          "Unable to remove product from wishlist."
        );

      }

    } catch (error) {

      console.error(
        "Remove wishlist error:",
        error
      );

      alert(
        "Unable to connect to the wishlist server."
      );

    }

  };

  /* =====================================================
     ADD TO CART
  ===================================================== */

  const addToCart = async (product) => {

    const size = product.size || "M";

    if (loggedInUser?.id) {
      try {
        await fetch("http://localhost/BAD%20TEDDY/backend/api/cart.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: Number(loggedInUser.id),
            product_id: Number(product.id),
            size: size,
            quantity: 1,
          }),
        });
      } catch (err) {
        console.error("Backend add to cart error from wishlist:", err);
      }
    }

    try {

      const savedCart = JSON.parse(
        localStorage.getItem("badTeddyCart")
      );

      const cart = Array.isArray(savedCart)
        ? savedCart
        : [];

      const existingItem = cart.find(
        (item) =>
          String(item.id) === String(product.id) &&
          String(item.size || "") === String(size)
      );

      let updatedCart;

      if (existingItem) {

        updatedCart = cart.map((item) => {

          if (
            String(item.id) === String(product.id) &&
            String(item.size || "") === String(size)
          ) {

            return {
              ...item,
              quantity: Number(item.quantity || 1) + 1,
            };

          }

          return item;

        });

      } else {

        updatedCart = [
          ...cart,
          {
            ...product,
            size: size,
            quantity: 1,
          },
        ];

      }

      localStorage.setItem(
        "badTeddyCart",
        JSON.stringify(updatedCart)
      );

      window.dispatchEvent(
        new Event("badTeddyCartUpdated")
      );
      window.dispatchEvent(
        new Event("cartUpdated")
      );

      navigate("/cart");

    } catch (error) {

      console.error("Unable to add item to cart:", error);

    }

  };



  if (loadingWishlist) {

  return (
    <div className="wishlist-page">

      <main
        className="wishlist-main empty-wishlist"
        style={{ minHeight: "70vh" }}
      >

        <div className="empty-heart">
          <i className="fa-solid fa-spinner fa-spin"></i>
        </div>

        <span className="wishlist-eyebrow">
          BAD TEDDY
        </span>

        <h1>
          Loading Wishlist...
        </h1>

        <p>
          Fetching your saved pieces.
        </p>

      </main>

      <WishlistBottomNav location={location} />

    </div>
  );

}
  /* =====================================================
     EMPTY WISHLIST
  ===================================================== */

  if (wishlist.length === 0) {

    return (

      <div className="wishlist-page">

        <header className="wishlist-header">

          <button
            className="wishlist-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>

          <img
            src={logo}
            alt="Bad Teddy"
            className="wishlist-logo"
          />

          <button
            className="wishlist-cart-btn"
            onClick={() => navigate("/cart")}
            aria-label="Cart"
          >
            <i className="fa-solid fa-bag-shopping"></i>
          </button>

        </header>


        <main className="wishlist-main empty-wishlist">

          <div className="empty-heart">

            <i className="fa-regular fa-heart"></i>

          </div>

          <span className="wishlist-eyebrow">
            YOUR COLLECTION
          </span>

          <h1>
            Your Wishlist is Empty
          </h1>

          <p>
            Save the pieces you love and come back
            whenever you're ready to make them yours.
          </p>

          <button
            className="wishlist-shop-btn"
            onClick={() => navigate("/shop")}
          >
            EXPLORE COLLECTION
            <i className="fa-solid fa-arrow-right"></i>
          </button>

        </main>


        <WishlistBottomNav location={location} />

      </div>

    );

  }


  /* =====================================================
     WISHLIST PAGE
  ===================================================== */

  return (

    <div className="wishlist-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="wishlist-header">

        <button
          className="wishlist-back-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>


        <img
          src={logo}
          alt="Bad Teddy"
          className="wishlist-logo"
        />


        <button
          className="wishlist-cart-btn"
          onClick={() => navigate("/cart")}
          aria-label="Cart"
        >
          <i className="fa-solid fa-bag-shopping"></i>
        </button>

      </header>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="wishlist-main">


        {/* PAGE INTRO */}

        <section className="wishlist-heading">

          <div>

            <span className="wishlist-eyebrow">
              SAVED FOR LATER
            </span>

            <h1>
              My Wishlist
            </h1>

            <p>
              The pieces you don't want to let go.
            </p>

          </div>


          <div className="wishlist-count-box">

            <i className="fa-regular fa-heart"></i>

            <div>

              <strong>
                {wishlist.length}
              </strong>

              <span>
                {wishlist.length === 1
                  ? "ITEM"
                  : "ITEMS"}
              </span>

            </div>

          </div>

        </section>


        {/* DIVIDER */}

        <div className="wishlist-divider"></div>


        {/* PRODUCTS */}

        <section className="wishlist-products">

          {wishlist.map((product) => (

            <article
              className="wishlist-card"
              key={product.id}
            >

              {/* IMAGE */}

              <div className="wishlist-image-wrapper">

                <img
                  src={product.image}
                  alt={product.name}
                  className="wishlist-product-image"
                />


                <button
                  className="wishlist-remove-btn"
                  onClick={() =>
                    removeFromWishlist(product.id)
                  }
                  aria-label="Remove from wishlist"
                  title="Remove from wishlist"
                >
                  <i className="fa-solid fa-heart"></i>
                </button>

              </div>


              {/* INFO */}

              <div className="wishlist-product-info">

                <div className="wishlist-product-top">

                  <div>

                    <span className="wishlist-product-category">
                      BAD TEDDY
                    </span>

                    <h2>
                      {product.name}
                    </h2>

                  </div>

                </div>


                {/* PRICE */}

                <div className="wishlist-price-row">

                  <strong>
                    ₹
                    {Number(
                      String(product.price || 0)
                        .replace(/[₹,]/g, "")
                    ).toLocaleString("en-IN")}
                  </strong>

                </div>


                {/* SIZE */}

                {product.size && (

                  <span className="wishlist-size">
                    Size: {product.size}
                  </span>

                )}


                {/* ACTIONS */}

                <div className="wishlist-actions">

                  <button
                    className="wishlist-add-cart"
                    onClick={() => addToCart(product)}
                  >

                    <i className="fa-solid fa-bag-shopping"></i>

                    ADD TO BAG

                  </button>


                  <button
                    className="wishlist-view-btn"
                    onClick={() => {

                      if (product.id) {

                        navigate(
                          `/product/${product.id}`
                        );

                      }

                    }}
                  >

                    VIEW

                    <i className="fa-solid fa-arrow-right"></i>

                  </button>

                </div>

              </div>

            </article>

          ))}

        </section>


        {/* CONTINUE SHOPPING */}

        <section className="wishlist-bottom">

          <div>

            <span>
              STILL LOOKING?
            </span>

            <h2>
              Discover your next favourite fit.
            </h2>

          </div>

          <button
            onClick={() => navigate("/shop")}
          >
            CONTINUE SHOPPING
            <i className="fa-solid fa-arrow-right"></i>
          </button>

        </section>


      </main>


      <WishlistBottomNav location={location} />

    </div>

  );

}


/* =====================================================
   BOTTOM NAVIGATION
===================================================== */

function WishlistBottomNav({ location }) {

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


export default Wishlist;