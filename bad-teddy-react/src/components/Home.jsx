import { useEffect, useMemo, useState } from "react";
import {Link,useNavigate,useLocation} from "react-router-dom";

import "../styles/Home.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import logo from "../assets/mylogo.png";
import banner from "../assets/bannerimg.jpg";
import abtpg from "../assets/abtpg2.png";
import shirtImage from "../assets/shirt.png";

import resolveProductImage from "../utils/imageResolver";


function Home() {
const navigate = useNavigate();

/* =========================
    PRODUCTS FROM BACKEND
========================= */

const [products, setProducts] = useState([]);
const [loadingProducts, setLoadingProducts] = useState(true);
const [productError, setProductError] = useState("");

useEffect(() => {

  const fetchProducts = async () => {

    try {

      setLoadingProducts(true);
      setProductError("");

      const response = await fetch(
        "http://localhost/BAD%20TEDDY/backend/api/products.php"
      );

      const data = await response.json();

      console.log("Home Products API response:", data);

      if (!data.success) {

        setProductError(
          data.message || "Unable to load products."
        );

        return;
      }

      const formattedProducts = Array.isArray(data.products)
        ? data.products.map((product) => ({
            ...product,

            id: Number(product.id),

            price: Number(product.price),

            rating: Number(product.rating || 0),

            image: resolveProductImage(product.image),
            rawImage: product.image
          }))
        : [];

      setProducts(formattedProducts);

    } catch (error) {

      console.error(
        "Home products fetch error:",
        error
      );

      setProductError(
        "Unable to connect to the product server."
      );

    } finally {

      setLoadingProducts(false);

    }

  };

  fetchProducts();

}, []);


  /* =========================
      CATEGORIES
  ========================= */

  const categories = [
    {
      name: "T-Shirts",
      image: resolveProductImage("tshirt.png"),
      icon: "fa-shirt"
    },
    {
      name: "Hoodies",
      image: resolveProductImage("hoodie.png"),
      icon: "fa-vest"
    },
    {
      name: "Cargo/Jeans",
      image: resolveProductImage("crops.png"),
      icon: "fa-person-walking"
    },
    {
      name: "Shirts",
      image: shirtImage,
      icon: "fa-shirt"
    },
    {
      name: "Caps",
      image: resolveProductImage("caps.png"),
      icon: "fa-hat-cowboy"
    }
  ];


  /* =========================
      STATES
  ========================= */

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("badTeddyWishlist")) || [];
    } catch {
      return [];
    }
  });

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("badTeddyCart")) || [];
    } catch {
      return [];
    }
  });

  /* =========================
    SYNC CART
========================= */

useEffect(() => {

  const loadLiveCart = async () => {
    let loggedInUser = null;
    try {
      const savedUser = localStorage.getItem("badTeddyUser");
      loggedInUser = savedUser ? JSON.parse(savedUser) : null;
    } catch {
      loggedInUser = null;
    }

    if (loggedInUser?.id) {
      try {
        const res = await fetch(`http://localhost/BAD%20TEDDY/backend/api/cart.php?user_id=${loggedInUser.id}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.cart)) {
          setCart(data.cart);
          return;
        }
      } catch (e) {
        console.error("Home live cart fetch error:", e);
      }
    }

    try {
      const savedCart = JSON.parse(localStorage.getItem("badTeddyCart"));
      setCart(Array.isArray(savedCart) ? savedCart : []);
    } catch {
      setCart([]);
    }
  };

  loadLiveCart();

  window.addEventListener("badTeddyCartUpdated", loadLiveCart);
  window.addEventListener("cartUpdated", loadLiveCart);

  return () => {
    window.removeEventListener("badTeddyCartUpdated", loadLiveCart);
    window.removeEventListener("cartUpdated", loadLiveCart);
  };

}, []);

/* =========================
    SYNC WISHLIST
========================= */

useEffect(() => {

  const loadLiveWishlist = async () => {
    let loggedInUser = null;
    try {
      const savedUser = localStorage.getItem("badTeddyUser");
      loggedInUser = savedUser ? JSON.parse(savedUser) : null;
    } catch {
      loggedInUser = null;
    }

    if (loggedInUser?.id) {
      try {
        const res = await fetch(`http://localhost/BAD%20TEDDY/backend/api/wishlist.php?user_id=${loggedInUser.id}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.wishlist)) {
          setWishlist(data.wishlist);
          return;
        }
      } catch (e) {
        console.error("Home live wishlist fetch error:", e);
      }
    }

    try {
      const savedWishlist = JSON.parse(localStorage.getItem("badTeddyWishlist"));
      setWishlist(Array.isArray(savedWishlist) ? savedWishlist : []);
    } catch {
      setWishlist([]);
    }
  };

  loadLiveWishlist();

  window.addEventListener("badTeddyWishlistUpdated", loadLiveWishlist);

  return () => {
    window.removeEventListener("badTeddyWishlistUpdated", loadLiveWishlist);
  };

}, []);

  const [showAssistant, setShowAssistant] = useState(false);
  const [showSize, setShowSize] = useState(false);

  const [assistantMessage, setAssistantMessage] = useState("");
  const [sizeResult, setSizeResult] = useState("");

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");


 const handleNewsletterSubmit = async (e) => {

  e.preventDefault();

  const email = newsletterEmail.trim();

  if (!email) {

    setNewsletterMessage(
      "Please enter your email."
    );

    return;
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {

    setNewsletterMessage(
      "Please enter a valid email address."
    );

    return;
  }

  try {

    const response = await fetch(
      "http://localhost/BAD%20TEDDY/backend/api/newsletter.php",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          email: email
        })
      }
    );

    const data = await response.json();

    console.log(
      "Newsletter API response:",
      data
    );

    if (data.success) {

      setNewsletterMessage(
        data.message ||
        "Welcome to the Bad Teddy Club! 🎉"
      );

      setNewsletterEmail("");

    } else {

      setNewsletterMessage(
        data.message ||
        "Unable to join the Bad Teddy Club."
      );

    }

  } catch (error) {

    console.error(
      "Newsletter error:",
      error
    );

    setNewsletterMessage(
      "Unable to connect to the newsletter server."
    );

  }

};

  /* =========================
      SAVE WISHLIST
  ========================= */

  useEffect(() => {
    localStorage.setItem(
      "badTeddyWishlist",
      JSON.stringify(wishlist)
    );
  }, [wishlist]);


  /* =========================
      SAVE CART
  ========================= */

  useEffect(() => {
    localStorage.setItem(
      "badTeddyCart",
      JSON.stringify(cart)
    );
  }, [cart]);


  /* =========================
      WISHLIST
  ========================= */

  const toggleWishlist = async (productId) => {

    let loggedInUser = null;
    try {
      const savedUser = localStorage.getItem("badTeddyUser");
      loggedInUser = savedUser ? JSON.parse(savedUser) : null;
    } catch {
      loggedInUser = null;
    }

    const alreadyExists = wishlist.some(
      (item) => item.id === productId
    );

    if (loggedInUser?.id) {
      try {
        if (alreadyExists) {
          await fetch("http://localhost/BAD%20TEDDY/backend/api/wishlist.php", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: Number(loggedInUser.id),
              product_id: Number(productId),
            }),
          });
        } else {
          await fetch("http://localhost/BAD%20TEDDY/backend/api/wishlist.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: Number(loggedInUser.id),
              product_id: Number(productId),
            }),
          });
        }
      } catch (err) {
        console.error("Wishlist toggle API error:", err);
      }
    }

    setWishlist((current) => {
      // Remove product
      if (alreadyExists) {
        return current.filter(
          (item) => item.id !== productId
        );
      }

      // Find the complete product from Homepage products
      const product = products.find(
        (item) => item.id === productId
      );

      // Add complete product
      if (product) {
        return [
          ...current,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            rating: product.rating,
            badge: product.badge
          }
        ];
      }

      return current;
    });

    window.dispatchEvent(
      new Event("badTeddyWishlistUpdated")
    );

  };


  const addToCart = async (product) => {
    try {
        let loggedInUser = null;
        try {
            const savedUser = localStorage.getItem("badTeddyUser");
            loggedInUser = savedUser ? JSON.parse(savedUser) : null;
        } catch {
            loggedInUser = null;
        }

        if (!loggedInUser) {
            alert("Please login first.");
            return;
        }

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
                    size: "M",
                    quantity: 1
                })
            }
        );

        const data = await response.json();

        console.log("Home Add to Cart response:", data);

        if (data.success) {
            alert("Product added to cart!");
            window.dispatchEvent(
                new Event("badTeddyCartUpdated")
            );
            window.dispatchEvent(
                new Event("cartUpdated")
            );
        } else {
            alert(data.message || "Failed to add product to cart.");
        }

    } catch (error) {
        console.error("Home Add to Cart error:", error);
        alert("Something went wrong while adding to cart.");
    }
  };


  /* =========================
      FILTER PRODUCTS
  ========================= */

  const filteredProducts = useMemo(() => {

    return products.filter((product) => {

      const matchesCategory =
        selectedCategory === "All" ||
        product.category === selectedCategory;

      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(search.toLowerCase());

      return matchesCategory && matchesSearch;

    });

  }, [search, selectedCategory]);


  /* =========================
      CATEGORY CLICK
  ========================= */

  const handleCategory = (category) => {

    setSelectedCategory(category);

    document
      .getElementById("trending-products")
      ?.scrollIntoView({
        behavior: "smooth"
      });

  };


  /* =========================
      SEARCH
  ========================= */

  const handleSearch = (value) => {

    setSearch(value);

    if (value.trim() !== "") {

      setTimeout(() => {

        document
          .getElementById("trending-products")
          ?.scrollIntoView({
            behavior: "smooth"
          });

      }, 100);

    }

  };


  /* =========================
      AI ASSISTANT
  ========================= */

  const askAssistant = (type) => {

    if (type === "casual") {

      setAssistantMessage(
        "For a casual streetwear look, try our Oversized Tee with Cargo/Jeans and finish it with the Signature Cap."
      );

    }

    if (type === "party") {

      setAssistantMessage(
        "For a party look, pair a Graphic Tee with relaxed pants and a statement cap. Keep the colours bold and confident."
      );

    }

    if (type === "college") {

      setAssistantMessage(
        "For college, go for a Shirt or Oversized Tee, relaxed Cargo/Jeans and a statement cap. Comfortable but still very Bad Teddy."
      );

    }

  };


  /* =========================
      SIZE RECOMMENDATION
  ========================= */

  const calculateSize = (height, weight) => {

    const h = Number(height);
    const w = Number(weight);

    if (!h || !w) {
      setSizeResult("Please enter your height and weight.");
      return;
    }

    let size = "M";

    if (w < 55) {
      size = "S";
    } else if (w < 70) {
      size = "M";
    } else if (w < 85) {
      size = "L";
    } else if (w < 100) {
      size = "XL";
    } else {
      size = "XXL";
    }

    setSizeResult(
      `Based on the information provided, we recommend size ${size}.`
    );

  };


  /* =========================
      NAVIGATION
  ========================= */

  const goToShop = () => {
  navigate("/shop");
};

  const goToProfile = () => {
  navigate("/profile");
};

const location = useLocation();

  return (

    <div className="home-container">


      {/* =================================
          HEADER
      ================================= */}

      <header className="home-header">

        <div className="home-logo">

          <img
            src={logo}
            alt="Bad Teddy"
          />

        </div>


        <div className="home-header-actions">

        
         <button
  type="button"
  className="icon-btn"
  onClick={() => navigate("/wishlist")}
  aria-label="Wishlist"
>
  <i className="fa-regular fa-heart"></i>

  {wishlist.length > 0 && (
    <span className="header-badge">
      {wishlist.length}
    </span>
  )}
</button>

          <button
  className="icon-btn"
  onClick={() => navigate("/cart")}
  aria-label="Cart"
>

            <i className="fa-solid fa-bag-shopping"></i>

            {cart.length > 0 && (
              <span className="header-badge">
                {cart.reduce(
                  (total, item) =>
                    total + item.quantity,
                  0
                )}
              </span>
            )}

          </button>

        </div>

      </header>



      {/* =================================
          SEARCH
      ================================= */}

      <section className="home-search-section">

        <div className="home-search-box">

          <i className="fa-solid fa-magnifying-glass"></i>

          <input
            type="text"
            value={search}
            onChange={(e) =>
              handleSearch(e.target.value)
            }
            placeholder="Search oversized tees, hoodies, cargos..."
          />

          {search && (

            <button
              className="search-clear"
              onClick={() => setSearch("")}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

          )}

        </div>

      </section>



      {/* =================================
          HERO
      ================================= */}

      <section className="home-hero-slider">

        <img
          src={banner}
          alt="Bad Teddy Streetwear"
        />

        <div className="home-hero-overlay"></div>


        <div className="home-hero-content">

          <span className="home-offer-tag">
            NEW DROP • 2026
          </span>

          <h1>
            <span className ="section-title">YOUR STYLE</span>
            <br />
            <span>YOUR RULES.</span>
          </h1>

          <p>
            Premium streetwear built for
            <br />
            people who stand out.
          </p>

          <button
  className="home-shop-btn"
  onClick={() => navigate("/shop")}
>
  Shop Now
  <i className="fa-solid fa-arrow-right"></i>
</button>

        </div>


        <div className="hero-floating-card">

          <span>BAD TEDDY</span>

          <strong>
            PREMIUM
            <br />
            STREETWEAR
          </strong>

        </div>

      </section>



      {/* =================================
          CATEGORIES
      ================================= */}

      <section className="categories">

        <div className="home-section-header">

          <div>

            <span className="section-label">
              EXPLORE
            </span>

            <h2>
              <span className ="section-title">Shop By Category</span>
            </h2>

          </div>

          <button
  className="view-all-btn"
  onClick={() => navigate("/shop")}
>
  View All
  <i className="fa-solid fa-arrow-right"></i>
</button>

        </div>


        <div className="category-row">

          {categories.map((category) => (

            <button
            
              className={`category-item ${
                selectedCategory === category.name
                  ? "category-active"
                  : ""
              }`}
              key={category.name}
              onClick={() =>
                handleCategory(category.name)
              }
            >

              <div className="category-image">

                <img
                  src={category.image}
                  alt={category.name}
                />

              </div>

              <p>
                {category.name}
              </p>

              <span className="category-arrow">
                <i className="fa-solid fa-arrow-right"></i>
              </span>

            </button>

          ))}

        </div>

      </section>



      {/* =================================
          TRENDING PRODUCTS
      ================================= */}

      <section
        className="products-section"
        id="trending-products"
      >

        <div className="section-header">

          <div>

            <span className="section-label">
              BAD TEDDY COLLECTION
            </span>

            <h2>
              <span className ="section-title">Trending Now</span>
            </h2>

          </div>


          <button
            className="section-view-btn"
            onClick={goToShop}
          >
            View All
            <i className="fa-solid fa-arrow-right"></i>
          </button>

        </div>


        {loadingProducts ? (

  <div className="no-products">

    <i className="fa-solid fa-spinner fa-spin"></i>

    <h3>
      Loading pieces...
    </h3>

    <p>
      Fetching the latest Bad Teddy collection.
    </p>

  </div>

) : productError ? (

  <div className="no-products">

    <i className="fa-solid fa-triangle-exclamation"></i>

    <h3>
      Unable to load products
    </h3>

    <p>
      {productError}
    </p>

  </div>

) : filteredProducts.length === 0 ? ( 
          <div className="no-products">

            <i className="fa-solid fa-magnifying-glass"></i>

            <h3>
              No products found
            </h3>

            <p>
              Try another search or category.
            </p>

            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
              }}
            >
              Clear Filters
            </button>

          </div>

        ) : (

          <div className="products-row">

            {filteredProducts.map((product) => (

              <article
    className="product-card"
    onClick={() => navigate(`/product/${product.id}`)}
>

                <div className="product-image-wrap">

                  <img
                    src={product.image}
                    alt={product.name}
                  />


                  <span className="product-badge">
                    {product.badge}
                  </span>


                  <button
  type="button"
  className={`wishlist-btn ${
    wishlist.some((item) => item.id === product.id)
      ? "wish-active"
      : ""
  }`}
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  }}
  aria-label="Wishlist"
>

                    <i
                      className={
                        wishlist.some((item) => item.id === product.id)
                          ? "fa-solid fa-heart"
                          : "fa-regular fa-heart"
                      }
                    ></i>

                  </button>


                  <button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  }}
>
                    <i className="fa-solid fa-bag-shopping"></i>
                    Quick Add
                  </button>

                </div>


                <div className="product-info">

                  <span className="product-category">
                    {product.category}
                  </span>

                  <h3>
                    {product.name}
                  </h3>


                  <div className="product-rating">

                    <i className="fa-solid fa-star"></i>

                    <span>
                      {product.rating}
                    </span>

                  </div>


                  <div className="product-bottom">

                    <strong>
                      ₹{product.price}
                    </strong>

                    <button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  }}
  aria-label={`Add ${product.name} to cart`}
>
  <i className="fa-solid fa-bag-shopping"></i>
</button>

                  </div>

                </div>

              </article>

            ))}

          </div>

        )}

      </section>



      {/* =================================
          AI SECTION
      ================================= */}

      <section className="ai-section">

        <div className="ai-heading">

          <span className="section-label">
            SMART STYLE
          </span>

          <h2>
            <span className ="h2-align">Style, But Smarter</span>
          </h2>

          <p>
            Let Bad Teddy help you find
            your perfect look.
          </p>

        </div>


        <div className="ai-cards">


          {/* ASSISTANT */}

          <article className="ai-card">

            <div className="ai-card-icon">

              <i className="fa-solid fa-robot"></i>

            </div>


            <div className="ai-content">

              <span>
                AI STYLE
              </span>

              <h3>
                Fashion Assistant
              </h3>

              <p>
                Tell us the occasion and we'll
                suggest a streetwear look for you.
              </p>


              <button
  className="ai-btn"
  onClick={() => navigate("/assistant")}
>
  Try AI Assistant
  <i className="fa-solid fa-arrow-right"></i>
</button>

            </div>

          </article>



          {/* SIZE */}

          <article className="ai-card ai-card-gold">

            <div className="ai-card-icon">

              <i className="fa-solid fa-ruler-combined"></i>

            </div>


            <div className="ai-content">

              <span>
                SMART FIT
              </span>

              <h3>
                Size Recommendation
              </h3>

              <p>
                Get a quick size recommendation
                using your height and weight.
              </p>


              <button
  className="ai-btn"
  onClick={() => navigate("/size-recommendation")}
>
  Find My Size
  <i className="fa-solid fa-arrow-right"></i>
</button>

            </div>

          </article>

        </div>

      </section>


{/* =====================================
    THE BAD TEDDY STORY
===================================== */}

<section className="home-story-section">

    <div className="home-story-image">

        <img
            src={abtpg}
            alt="Bad Teddy streetwear"
        />

        <div className="home-story-image-overlay"></div>

        <div className="story-image-badge">

            <span>BT</span>

            <small>
                EST. 2023
            </small>

        </div>

    </div>


    <div className="home-story-content">

        <span className="story-eyebrow">
            THE STORY BEHIND BAD TEDDY
        </span>

        <h2>

            MORE THAN
            <br />

            <span>JUST STREETWEAR.</span>

        </h2>

        <p>

            Born in 2023, Bad Teddy started with a love
            for street culture, denim, individuality and attitude.

        </p>

        <p>

            The name combines the bold energy of
            "Bad" with the warmth and personal meaning
            behind "Teddy" — creating a brand built around
            confidence, comfort and identity.

        </p>


        <div className="home-story-points">

            <div>

                <strong>
                    01
                </strong>

                <span>
                    BOLD
                </span>

            </div>


            <div>

                <strong>
                    02
                </strong>

                <span>
                    PERSONAL
                </span>

            </div>


            <div>

                <strong>
                    03
                </strong>

                <span>
                    ORIGINAL
                </span>

            </div>

        </div>


        <button
            className="home-story-btn"
            onClick={() => navigate("/about")}
        >

            DISCOVER OUR STORY

            <i className="fa-solid fa-arrow-right"></i>

        </button>

    </div>

</section>


      {/* =================================
          NEWSLETTER
      ================================= */}

      <section className="home-newsletter">

    <div>

        <span className="section-label">
            BAD TEDDY CLUB
        </span>

        <h2>
            <span className="section-title">
                Stay In The Loop.
            </span>
        </h2>

        <p>
            Get first access to new drops,
            exclusive offers and limited collections.
        </p>

    </div>


    <form
        className="newsletter-form"
        onSubmit={handleNewsletterSubmit}
    >

        <input
            type="email"
            placeholder="Enter your email"
            value={newsletterEmail}
            onChange={(e) =>
                setNewsletterEmail(e.target.value)
            }
        />

        <button type="submit">
            Join
            <i className="fa-solid fa-arrow-right"></i>
        </button>

    </form>


    {newsletterMessage && (
        <p className="newsletter-message">
            {newsletterMessage}
        </p>
    )}

</section>



      {/* =================================
          AI ASSISTANT MODAL
      ================================= */}

      {showAssistant && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowAssistant(false)
          }
        >

          <div
            className="modal-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                setShowAssistant(false)
              }
            >
              <i className="fa-solid fa-xmark"></i>
            </button>


            <div className="modal-icon">
              <i className="fa-solid fa-robot"></i>
            </div>


            <span className="section-label">
              BAD TEDDY AI
            </span>

            <h2>
              What are you dressing for?
            </h2>

            <p>
              Choose an occasion and get
              a quick style suggestion.
            </p>


            <div className="assistant-options">

              <button
                onClick={() =>
                  askAssistant("casual")
                }
              >
                <i className="fa-solid fa-shirt"></i>
                Casual
              </button>

              <button
                onClick={() =>
                  askAssistant("college")
                }
              >
                <i className="fa-solid fa-graduation-cap"></i>
                College
              </button>

              <button
                onClick={() =>
                  askAssistant("party")
                }
              >
                <i className="fa-solid fa-champagne-glasses"></i>
                Party
              </button>

            </div>


            {assistantMessage && (

              <div className="ai-response">

                <i className="fa-solid fa-sparkles"></i>

                <p>
                  {assistantMessage}
                </p>

              </div>

            )}

          </div>

        </div>

      )}



      {/* =================================
          SIZE MODAL
      ================================= */}

      {showSize && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowSize(false)
          }
        >

          <div
            className="modal-card size-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                setShowSize(false)
              }
            >
              <i className="fa-solid fa-xmark"></i>
            </button>


            <div className="modal-icon">
              <i className="fa-solid fa-ruler-combined"></i>
            </div>


            <span className="section-label">
              SMART FIT
            </span>

            <h2>
              Find Your Size
            </h2>

            <p>
              Enter your details for a quick
              Bad Teddy size recommendation.
            </p>


            <div className="size-inputs">

              <div>

                <label>
                  Height (cm)
                </label>

                <input
                  id="height-input"
                  type="number"
                  placeholder="e.g. 170"
                />

              </div>


              <div>

                <label>
                  Weight (kg)
                </label>

                <input
                  id="weight-input"
                  type="number"
                  placeholder="e.g. 65"
                />

              </div>

            </div>


            <button
              className="size-calculate-btn"
              onClick={() => {

                const height =
                  document.getElementById(
                    "height-input"
                  ).value;

                const weight =
                  document.getElementById(
                    "weight-input"
                  ).value;

                calculateSize(
                  height,
                  weight
                );

              }}
            >
              Recommend My Size
            </button>


            {sizeResult && (

              <div className="size-result">

                <i className="fa-solid fa-circle-check"></i>

                {sizeResult}

              </div>

            )}

          </div>

        </div>

      )}



      {/* =================================
          BOTTOM NAVIGATION
      ================================= */}

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


    </div>

  );
}


export default Home;