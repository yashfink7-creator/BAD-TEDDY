import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Shop.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// ===============================
// PRODUCT IMAGES & RESOLVER
// ===============================

import logo from "../assets/mylogo.png";
import resolveProductImage from "../utils/imageResolver";


// ===============================
// SHOP COMPONENT
// ===============================

function Shop() {
    const navigate = useNavigate();



    // ===============================
    // PRODUCT DATA
    // Easy to replace with PHP API later
    // ===============================

const [products, setProducts] = useState([]);
const [loadingProducts, setLoadingProducts] = useState(true);
const [productError, setProductError] = useState("");

useEffect(() => {
    const fetchProducts = async () => {

        try {

            setLoadingProducts(true);

            const response = await fetch(
                "http://localhost/BAD%20TEDDY/backend/api/products.php"
            );

            const data = await response.json();

            console.log("Products API response:", data);

            if (data.success) {

                const formattedProducts = data.products.map((product) => {
                    return {
                        ...product,
                        image: resolveProductImage(product.image),
                        rawImage: product.image
                    };

                });

                setProducts(formattedProducts);

            } else {

                setProductError(
                    data.message || "Unable to load products."
                );

            }

        } catch (error) {

            console.error("Products fetch error:", error);

            setProductError(
                "Unable to connect to the product server."
            );

        } finally {

            setLoadingProducts(false);

        }
    };

    fetchProducts();

}, []);


    // ===============================
    // STATES
    // ===============================

    const [searchTerm, setSearchTerm] = useState("");

    const [activeCategory, setActiveCategory] = useState("All");

    const [activeStyle, setActiveStyle] = useState("All");

    const [activeTab, setActiveTab] = useState("All");

    const [sortBy, setSortBy] = useState("featured");

    const [showFilters, setShowFilters] = useState(false);

    const [selectedPrice, setSelectedPrice] = useState("all");

    const loggedInUser = (() => {
        try {
            const savedUser = localStorage.getItem("badTeddyUser");
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    })();

    const [wishlist, setWishlist] = useState([]);
    const [cart, setCart] = useState([]);

    /* ===============================
       LOAD BACKEND CART & WISHLIST
    =============================== */
    const loadBackendCart = async () => {
        let localCart = [];
        try {
            const savedCart = localStorage.getItem("badTeddyCart");
            if (savedCart) localCart = JSON.parse(savedCart);
        } catch {}

        if (!loggedInUser?.id) {
            setCart(localCart);
            return;
        }

        try {
            const response = await fetch(
                `http://localhost/BAD%20TEDDY/backend/api/cart.php?user_id=${loggedInUser.id}`
            );
            const data = await response.json();
            if (data.success && Array.isArray(data.cart)) {
                setCart(data.cart);
                localStorage.setItem("badTeddyCart", JSON.stringify(data.cart));
            } else {
                setCart(localCart);
            }
        } catch (error) {
            console.error("Unable to load cart from API:", error);
            setCart(localCart);
        }
    };

    const loadBackendWishlist = async () => {
        let localWish = [];
        try {
            const savedWish = localStorage.getItem("badTeddyWishlist");
            if (savedWish) localWish = JSON.parse(savedWish);
        } catch {}

        if (!loggedInUser?.id) {
            setWishlist(localWish);
            return;
        }

        try {
            const response = await fetch(
                `http://localhost/BAD%20TEDDY/backend/api/wishlist.php?user_id=${loggedInUser.id}`
            );
            const data = await response.json();
            if (data.success && Array.isArray(data.wishlist)) {
                setWishlist(data.wishlist);
                localStorage.setItem("badTeddyWishlist", JSON.stringify(data.wishlist));
            } else {
                setWishlist(localWish);
            }
        } catch (error) {
            console.error("Unable to load wishlist from API:", error);
            setWishlist(localWish);
        }
    };

    useEffect(() => {
        loadBackendCart();
        loadBackendWishlist();

        const handleCartChange = () => loadBackendCart();
        const handleWishlistChange = () => loadBackendWishlist();

        window.addEventListener("badTeddyCartUpdated", handleCartChange);
        window.addEventListener("cartUpdated", handleCartChange);
        window.addEventListener("badTeddyWishlistUpdated", handleWishlistChange);
        window.addEventListener("storage", handleCartChange);

        return () => {
            window.removeEventListener("badTeddyCartUpdated", handleCartChange);
            window.removeEventListener("cartUpdated", handleCartChange);
            window.removeEventListener("badTeddyWishlistUpdated", handleWishlistChange);
            window.removeEventListener("storage", handleCartChange);
        };
    }, []);

    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [fitIndex, setFitIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setFitIndex((previous) => (previous + 1) % 4);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // ===============================
    // CATEGORIES
    // ===============================

    const categories = [
        "All",
        "T-Shirts",
        "Hoodies",
        "Cargo/Jeans",
        "Shirts",
        "Caps"
    ];

    // ===============================
    // STYLES
    // ===============================

    const styles = [
        "All",
        "Streetwear",
        "Oversized",
        "Minimal",
        "Y2K",
        "Casual",
        "Edgy"
    ];

    // ===============================
    // TABS
    // ===============================

    const shopTabs = [
        { id: "All", label: "All" },
        { id: "Trending", label: "Trending" },
        { id: "New", label: "New Arrivals" },
        { id: "Best", label: "Best Sellers" }
    ];

    // ===============================
    // WISHLIST (BACKEND INTEGRATED)
    // ===============================

    const toggleWishlist = async (productId) => {
        if (!loggedInUser?.id) {
            alert("Please login to manage your wishlist.");
            navigate("/login");
            return;
        }

        const isCurrentlyWishlisted = wishlist.some(
            (item) => String(item.id) === String(productId)
        );

        try {
            if (isCurrentlyWishlisted) {
                // DELETE from backend
                const response = await fetch("http://localhost/BAD%20TEDDY/backend/api/wishlist.php", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: Number(loggedInUser.id),
                        product_id: Number(productId)
                    })
                });
                const data = await response.json();
                if (data.success) {
                    const updated = wishlist.filter(item => String(item.id) !== String(productId));
                    setWishlist(updated);
                    localStorage.setItem("badTeddyWishlist", JSON.stringify(updated));
                    window.dispatchEvent(new Event("badTeddyWishlistUpdated"));
                }
            } else {
                // POST to backend
                const response = await fetch("http://localhost/BAD%20TEDDY/backend/api/wishlist.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: Number(loggedInUser.id),
                        product_id: Number(productId)
                    })
                });
                const data = await response.json();
                if (data.success) {
                    await loadBackendWishlist();
                    window.dispatchEvent(new Event("badTeddyWishlistUpdated"));
                }
            }
        } catch (error) {
            console.error("Wishlist toggle error:", error);
        }
    };

    // ===============================
    // ADD TO CART (BACKEND INTEGRATED)
    // ===============================

    const addToCart = async (product) => {
        if (!loggedInUser?.id) {
            alert("Please login before adding products to cart.");
            navigate("/login");
            return;
        }

        const defaultSize = Array.isArray(product.sizes) && product.sizes.length > 0
            ? product.sizes[0]
            : (typeof product.sizes === "string" && product.sizes.trim()
                ? product.sizes.split(",")[0].trim()
                : "M");

        try {
            const response = await fetch("http://localhost/BAD%20TEDDY/backend/api/cart.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: Number(loggedInUser.id),
                    product_id: Number(product.id),
                    size: defaultSize,
                    quantity: 1
                })
            });

            const data = await response.json();
            if (data.success) {
                await loadBackendCart();
                window.dispatchEvent(new Event("badTeddyCartUpdated"));
                window.dispatchEvent(new Event("cartUpdated"));
            } else {
                alert(data.message || "Unable to add product to cart.");
            }
        } catch (error) {
            console.error("Add to cart API error:", error);
            alert("Unable to connect to cart server.");
        }
    };


    // ===============================
    // RECENTLY VIEWED
    // ===============================

    const viewProduct = (product) => {

    setRecentlyViewed((previous) => {

        const withoutCurrent = previous.filter(
            (item) => item.id !== product.id
        );

        return [
            product,
            ...withoutCurrent
        ].slice(0, 4);

    });

};


    // ===============================
    // FILTER + SORT PRODUCTS
    // ===============================

    const filteredProducts = useMemo(() => {

        let result = [...products];


        // SEARCH

        if (searchTerm.trim() !== "") {

            const search = searchTerm.toLowerCase();

            result = result.filter((product) =>
                product.name.toLowerCase().includes(search) ||
                product.category.toLowerCase().includes(search) ||
                product.style.toLowerCase().includes(search)
            );

        }


        // CATEGORY

        if (activeCategory !== "All") {

            result = result.filter(
                (product) =>
                    product.category === activeCategory
            );

        }


        // STYLE

        if (activeStyle !== "All") {

            result = result.filter(
                (product) =>
                    product.style === activeStyle
            );

        }


        // TABS

        if (activeTab === "Trending") {

            result = result.filter(
                (product) => product.isTrending
            );

        }

        if (activeTab === "New") {

            result = result.filter(
                (product) => product.isNew
            );

        }

        if (activeTab === "Best") {

            result = result.filter(
                (product) => product.isBestSeller
            );

        }


        // PRICE

        if (selectedPrice === "under1000") {

            result = result.filter(
                (product) => product.price < 1000
            );

        }

        if (selectedPrice === "1000to1500") {

            result = result.filter(
                (product) =>
                    product.price >= 1000 &&
                    product.price <= 1500
            );

        }

        if (selectedPrice === "above1500") {

            result = result.filter(
                (product) => product.price > 1500
            );

        }


        // SORT

        if (sortBy === "low") {

            result.sort(
                (a, b) => a.price - b.price
            );

        }

        if (sortBy === "high") {

            result.sort(
                (a, b) => b.price - a.price
            );

        }

        if (sortBy === "new") {

            result.sort(
                (a, b) =>
                    Number(b.isNew) - Number(a.isNew)
            );

        }


        return result;

    }, [
        products,
        searchTerm,
        activeCategory,
        activeStyle,
        activeTab,
        selectedPrice,
        sortBy
    ]);


    // ===============================
    // RESET FILTERS
    // ===============================

    const resetFilters = () => {

        setActiveCategory("All");

        setActiveStyle("All");

        setSelectedPrice("all");

        setActiveTab("All");

        setSearchTerm("");

        setSortBy("featured");

    };

const location = useLocation();

const fitSets = [
    [
        {
            image: resolveProductImage("prod1.jpeg"),
            label: "Oversized Tee"
        },
        {
            image: resolveProductImage("prod3.jpg"),
            label: "Cargo Pants"
        },
        {
            image: resolveProductImage("prod5.png"),
            label: "Signature Cap"
        }
    ],

    [
        {
            image: resolveProductImage("prod2.jpg"),
            label: "Black Hoodie"
        },
        {
            image: resolveProductImage("crops.png"),
            label: "Tactical Cargo"
        },
        {
            image: resolveProductImage("caps.png"),
            label: "Streetwear Cap"
        }
    ],

    [
        {
            image: resolveProductImage("prod4.jpg"),
            label: "Graphic Tee"
        },
        {
            image: resolveProductImage("hoodie.png"),
            label: "Fleece Hoodie"
        },
        {
            image: resolveProductImage("jeans.png"),
            label: "Relaxed Jeans"
        }
    ],

    [
        {
            image: resolveProductImage("shirt.png"),
            label: "Street Overshirt"
        },
        {
            image: resolveProductImage("tshirt.png"),
            label: "Signature Tee"
        },
        {
            image: resolveProductImage("caps.png"),
            label: "Bad Teddy Cap"
        }
    ]
];

const currentFit = fitSets[fitIndex];



    return (

        <div className="shop-page">


            {/* =================================
                HEADER
            ================================= */}

            <header className="shop-header">

                <div className="shop-logo">

                    <img
                        src={logo}
                        alt="Bad Teddy"
                    />

                </div>


                <div className="shop-header-actions">

                    <button
    className="shop-icon-btn"
    aria-label="Wishlist"
    onClick={() => navigate("/wishlist")}
>

                        <i className="fa-regular fa-heart"></i>

                        {wishlist.length > 0 && (

                            <span className="header-count">
                                {wishlist.length}
                            </span>

                        )}

                    </button>


                    <button
    className="shop-icon-btn"
    aria-label="Cart"
    onClick={() => navigate("/cart")}
>

                        <i className="fa-solid fa-bag-shopping"></i>

                        {cart.length > 0 && (

                            <span className="header-count">
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
                SHOP HERO
            ================================= */}

            <section className="shop-intro">

                <div>

                    <span className="shop-eyebrow">
                        BAD TEDDY / SHOP
                    </span>

                    <h1 className="title-color">
                        FIND YOUR
                        <span> FIT.</span>
                    </h1>

                    <p>
                        Streetwear built for people
                        who don't follow the crowd.
                    </p>

                </div>


                <div className="shop-product-count">

                    <strong>
                        {loadingProducts ? "..." : filteredProducts.length}
                    </strong>

                    <span>
                        pieces available
                    </span>

                </div>

            </section>



            {/* =================================
                FIND YOUR VIBE
            ================================= */}

            <section className="vibe-section">

                <div className="vibe-heading">

                    <div>

                        <span>
                            PERSONAL STYLE
                        </span>

                        <h2 className="title-color">
                            Find Your Vibe
                        </h2>

                    </div>

                    <i className="fa-solid fa-wand-magic-sparkles"></i>

                </div>


                <div className="style-chips">

                    {styles.map((style) => (

                        <button
                            key={style}
                            className={
                                activeStyle === style
                                    ? "style-chip active"
                                    : "style-chip"
                            }
                            onClick={() =>
                                setActiveStyle(style)
                            }
                        >

                            {style}

                        </button>

                    ))}

                </div>

            </section>



            {/* =================================
                SEARCH
            ================================= */}

            <section className="shop-search">

                <i className="fa-solid fa-magnifying-glass"></i>

                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) =>
                        setSearchTerm(e.target.value)
                    }
                    placeholder="Search your next fit..."
                />

                {searchTerm && (

                    <button
                        className="clear-search"
                        onClick={() => setSearchTerm("")}
                    >

                        <i className="fa-solid fa-xmark"></i>

                    </button>

                )}

            </section>



            {/* =================================
                CATEGORY ROW
            ================================= */}

            <section className="category-filter">

                {categories.map((category) => (

                    <button
                        key={category}
                        className={
                            activeCategory === category
                                ? "category-filter-btn active"
                                : "category-filter-btn"
                        }
                        onClick={() =>
                            setActiveCategory(category)
                        }
                    >

                        {category}

                    </button>

                ))}

            </section>



            {/* =================================
                SHOP TABS
            ================================= */}

            <section className="shop-controls">

                <div className="shop-tabs">

                    {shopTabs.map((tab) => (

                        <button
                            key={tab.id}
                            className={
                                activeTab === tab.id
                                    ? "shop-tab active"
                                    : "shop-tab"
                            }
                            onClick={() =>
                                setActiveTab(tab.id)
                            }
                        >

                            {tab.label}

                        </button>

                    ))}

                </div>


                <div className="control-actions">

                    <button
                        className="filter-btn"
                        onClick={() =>
                            setShowFilters(!showFilters)
                        }
                    >

                        <i className="fa-solid fa-sliders"></i>

                        Filter

                    </button>


                    <select
                        className="sort-select"
                        value={sortBy}
                        onChange={(e) =>
                            setSortBy(e.target.value)
                        }
                    >

                        <option value="featured">
                            Featured
                        </option>

                        <option value="new">
                            Newest
                        </option>

                        <option value="low">
                            Price: Low to High
                        </option>

                        <option value="high">
                            Price: High to Low
                        </option>

                    </select>

                </div>

            </section>



            {/* =================================
                FILTER PANEL
            ================================= */}

            {showFilters && (

                <section className="filter-panel">

                    <div className="filter-group">

                        <span>
                            PRICE
                        </span>

                        <div className="price-options">

                            <button
                                className={
                                    selectedPrice === "all"
                                        ? "price-option active"
                                        : "price-option"
                                }
                                onClick={() =>
                                    setSelectedPrice("all")
                                }
                            >
                                All
                            </button>

                            <button
                                className={
                                    selectedPrice === "under1000"
                                        ? "price-option active"
                                        : "price-option"
                                }
                                onClick={() =>
                                    setSelectedPrice("under1000")
                                }
                            >
                                Under ₹1,000
                            </button>

                            <button
                                className={
                                    selectedPrice === "1000to1500"
                                        ? "price-option active"
                                        : "price-option"
                                }
                                onClick={() =>
                                    setSelectedPrice("1000to1500")
                                }
                            >
                                ₹1,000 – ₹1,500
                            </button>

                            <button
                                className={
                                    selectedPrice === "above1500"
                                        ? "price-option active"
                                        : "price-option"
                                }
                                onClick={() =>
                                    setSelectedPrice("above1500")
                                }
                            >
                                ₹1,500+
                            </button>

                        </div>

                    </div>


                    <button
                        className="reset-filter"
                        onClick={resetFilters}
                    >

                        Reset Filters

                    </button>

                </section>

            )}



            {/* =================================
                PRODUCT GRID
            ================================= */}

            <section className="shop-products-section">

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

    ) : filteredProducts.length > 0 ? (

                    <div className="shop-product-grid">

                        {filteredProducts.map((product) => (

                            <article
    className="shop-product-card"
    key={product.id}
    onClick={() => {
        viewProduct(product);
        navigate(`/product/${product.id}`);
    }}
>


                                {/* BADGE */}

                                {product.badge && (

                                    <span
                                        className={
                                            product.badge === "LOW STOCK"
                                                ? "product-badge low-stock"
                                                : "product-badge"
                                        }
                                    >

                                        {product.badge}

                                    </span>

                                )}


                                {/* WISHLIST */}

                                <button
                                    className={
                                        wishlist.some(
  (item) => String(item.id) === String(product.id)
)
                                            ? "product-wishlist active"
                                            : "product-wishlist"
                                    }
                                    onClick={(e) => {

                                        e.stopPropagation();

                                        toggleWishlist(product.id);

                                    }}
                                    aria-label="Add to wishlist"
                                >

                                    <i
                                        className={
                                            wishlist.some(
  (item) => String(item.id) === String(product.id)
)
                                                ? "fa-solid fa-heart"
                                                : "fa-regular fa-heart"
                                        }
                                    ></i>

                                </button>


                                {/* IMAGE */}

                                <div className="product-image-wrap">

                                    <img
                                        src={product.image}
                                        alt={product.name}
                                    />


                                    <button
                                        className="quick-view-btn"
                                        onClick={(e) => {

                                            e.stopPropagation();

                                            viewProduct(product);

                                        }}
                                    >

                                        QUICK VIEW

                                    </button>

                                </div>


                                {/* PRODUCT INFO */}

                                <div className="product-info">

                                    <span className="product-category">
                                        {product.category}
                                    </span>

                                    <h3>
                                        {product.name}
                                    </h3>

                                    <div className="product-bottom">

    <strong>
        ₹{product.price.toLocaleString("en-IN")}
    </strong>

    <button
    type="button"
    className="quick-add-btn"
    onMouseDown={(e) => {
        e.stopPropagation();
    }}
    onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        addToCart(product);
    }}
>
    <i className="fa-solid fa-bag-shopping"></i>

</button>

</div>

                                </div>

                            </article>

                        ))}

                    </div>

                ) : (

                    <div className="no-products">

                        <i className="fa-solid fa-box-open"></i>

                        <h3>
                            No pieces found
                        </h3>

                        <p>
                            Try changing your search or filters.
                        </p>

                        <button
                            onClick={resetFilters}
                        >
                            Clear Filters
                        </button>

                    </div>

                )}

            </section>



            {/* =================================
                AI RECOMMENDATION BANNER
            ================================= */}

            <section className="ai-shop-banner">

                <div className="ai-shop-icon">

                    <i className="fa-solid fa-wand-magic-sparkles"></i>

                </div>


                <div className="ai-shop-content">

                    <span>
                        BAD TEDDY AI
                    </span>

                    <h2 className="title-color">
                        Made For Your Vibe.
                    </h2>

                    <p>
                        Let our AI help you discover
                        pieces that match your style.
                    </p>

                </div>


                <button
    className="ai-shop-btn"
    onClick={() => navigate("/assistant")}
>
    Get My Picks
    <i className="fa-solid fa-arrow-right"></i>
</button>

            </section>



            {/* =================================
                COMPLETE THE FIT
            ================================= */}

            <section className="complete-fit">

    <div className="section-title-row">

        <div>

            <h2 className="title-color1">
                STYLE IT YOUR WAY
            </h2>
            <h3 className="title-color">
                Complete The Fit
            </h3>

        </div>

        <i className="fa-solid fa-shirt"></i>

    </div>


    <div className="fit-row">

        {currentFit.map((item, index) => (

            <React.Fragment key={item.label}>

                <div className="fit-item">

                    <img
                        src={item.image}
                        alt={item.label}
                    />

                    <span>
                        {item.label}
                    </span>

                </div>

                {index < currentFit.length - 1 && (

                    <div className="fit-plus">
                        +
                    </div>

                )}

            </React.Fragment>

        ))}

    </div>


</section>



            <section className="recent-section">

    <div className="section-title-row">

        <div>

            <h2 className="title-color1">
                KEEP EXPLORING
            </h2>

            <h3 className="title-color">
                Recently Viewed
            </h3>

        </div>

    </div>


    <div className="recent-row">

        {[
            ...recentlyViewed,
            ...products.filter(
                (product) =>
                    !recentlyViewed.some(
                        (viewed) => viewed.id === product.id
                    )
            )
        ]
            .slice(0, 4)
            .map((product) => (

                <div
                    className="recent-card"
                    key={product.id}
                >

                    <img
                        src={product.image}
                        alt={product.name}
                    />

                    <div className="recent-info">

                        <span>
                            {product.category}
                        </span>

                        <h4>
                            {product.name}
                        </h4>

                        <strong>
                            ₹{product.price.toLocaleString("en-IN")}
                        </strong>

                    </div>

                </div>

            ))}

    </div>

</section>



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

export default Shop;