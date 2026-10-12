import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import "../styles/product.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import logo from "../assets/mylogo.png";
import resolveProductImage from "../utils/imageResolver";

// Fallback reviews when none in database
const fallbackReviews = [
    {
        id: 1,
        name: "Rahul Sharma",
        rating: 5,
        text: "Incredible quality! The heavyweight cotton and drop-shoulder streetwear fit is unmatched. Fast delivery too.",
        date: "2 days ago"
    },
    {
        id: 2,
        name: "Aman Khan",
        rating: 5,
        text: "Great fabric, luxury stitching, and the puff print detail looks super premium. Worth every rupee.",
        date: "1 week ago"
    },
    {
        id: 3,
        name: "Sahil Mehta",
        rating: 4.5,
        text: "Loved the silhouette. Looks amazing paired with relaxed jeans.",
        date: "2 weeks ago"
    }
];

const getCart = () => {
    try {
        return JSON.parse(localStorage.getItem("badTeddyCart")) || [];
    } catch {
        return [];
    }
};

const getWishlist = () => {
    try {
        return JSON.parse(localStorage.getItem("badTeddyWishlist")) || [];
    } catch {
        return [];
    }
};

function Product() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    const [productData, setProductData] = useState(null);
    const [loadingProduct, setLoadingProduct] = useState(true);
    const [productError, setProductError] = useState("");

    const [selectedImage, setSelectedImage] = useState("");
    const [selectedSize, setSelectedSize] = useState("M");
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState("Description");
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [addedToCart, setAddedToCart] = useState(false);
    const [showMoreStyles, setShowMoreStyles] = useState(false);

    const [dynamicAiRecommendations, setDynamicAiRecommendations] = useState([]);
    const [dynamicCompleteLook, setDynamicCompleteLook] = useState([]);
    const [catalogFallbackProducts, setCatalogFallbackProducts] = useState([]);

    const loggedInUser = (() => {
        try {
            const savedUser = localStorage.getItem("badTeddyUser");
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    })();

    // 1. Fetch live product details from MySQL backend
    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                setLoadingProduct(true);
                setProductError("");
                window.scrollTo({ top: 0, behavior: "smooth" });

                const response = await fetch(
                    `http://localhost/BAD%20TEDDY/backend/api/products.php?id=${id}`
                );
                const data = await response.json();

                if (data.success && data.product) {
                    setProductData(data.product);
                    const frontImg = data.product.gallery?.front || data.product.image;
                    const initialImg = resolveProductImage(frontImg);
                    setSelectedImage(initialImg);

                    // Normalize sizes
                    const rawSizes = Array.isArray(data.product.sizes)
                        ? data.product.sizes
                        : String(data.product.sizes || "S,M,L,XL,XXL")
                              .split(",")
                              .map(s => s.trim())
                              .filter(Boolean);
                    if (rawSizes.length > 0) {
                        setSelectedSize(rawSizes[0]);
                    }

                    // Reset quantity
                    const currentStock = Number(data.product.stock || 0);
                    setQuantity(currentStock > 0 ? 1 : 0);
                } else {
                    setProductError(data.message || "Product not found.");
                }
            } catch (error) {
                console.error("Product fetch error:", error);
                setProductError("Unable to connect to the product server.");
            } finally {
                setLoadingProduct(false);
            }
        };

        fetchProduct();
    }, [id]);

    // 2. Fetch all products for fallback recommendations & related
    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const res = await fetch("http://localhost/BAD%20TEDDY/backend/api/products.php");
                const data = await res.json();
                if (data.success && Array.isArray(data.products)) {
                    setCatalogFallbackProducts(data.products);
                }
            } catch (e) {
                console.error("Catalog fetch error:", e);
            }
        };
        fetchCatalog();
    }, []);

    // 3. Fetch AI Recommendations for this product
    useEffect(() => {
        const fetchAiRecommendations = async () => {
            if (!id) return;
            try {
                const res = await fetch(`http://127.0.0.1:5000/api/recommendations?product_id=${id}&limit=6`);
                const data = await res.json();
                if (data.success) {
                    if (Array.isArray(data.ai_recommendations) && data.ai_recommendations.length > 0) {
                        const mapped = data.ai_recommendations.map(p => ({
                            ...p,
                            image: resolveProductImage(p.image)
                        }));
                        setDynamicAiRecommendations(mapped);
                    }
                    if (Array.isArray(data.complete_look_products) && data.complete_look_products.length > 0) {
                        const mappedLook = data.complete_look_products.map(p => ({
                            ...p,
                            image: resolveProductImage(p.image)
                        }));
                        setDynamicCompleteLook(mappedLook);
                    }
                }
            } catch (err) {
                console.error("AI recommendation fetch error:", err);
            }
        };
        fetchAiRecommendations();
    }, [id]);

    // 4. Check Wishlist and Cart status
    const updateBackendWishlistStatus = async () => {
        if (!productData) return;
        if (loggedInUser?.id) {
            try {
                const res = await fetch(`http://localhost/BAD%20TEDDY/backend/api/wishlist.php?user_id=${loggedInUser.id}`);
                const data = await res.json();
                if (data.success && Array.isArray(data.wishlist)) {
                    setIsWishlisted(data.wishlist.some(item => String(item.id) === String(productData.id)));
                    return;
                }
            } catch (e) {
                console.error("Wishlist check error:", e);
            }
        }
        const wishlist = getWishlist();
        setIsWishlisted(wishlist.some(item => String(item.id) === String(productData.id)));
    };

    const updateCartCount = async () => {
        if (loggedInUser?.id) {
            try {
                const res = await fetch(`http://localhost/BAD%20TEDDY/backend/api/cart.php?user_id=${loggedInUser.id}`);
                const data = await res.json();
                if (data.success && Array.isArray(data.cart)) {
                    const totalQty = data.cart.reduce((t, item) => t + Number(item.quantity || 1), 0);
                    setCartCount(totalQty);
                    return;
                }
            } catch (e) {
                console.error("Cart count fetch error:", e);
            }
        }
        const cart = getCart();
        const count = cart.reduce((total, item) => total + Number(item.quantity || 1), 0);
        setCartCount(count);
    };

    useEffect(() => {
        updateBackendWishlistStatus();
        updateCartCount();

        const handleCart = () => updateCartCount();
        const handleWish = () => updateBackendWishlistStatus();

        window.addEventListener("badTeddyCartUpdated", handleCart);
        window.addEventListener("cartUpdated", handleCart);
        window.addEventListener("badTeddyWishlistUpdated", handleWish);
        window.addEventListener("storage", handleCart);

        return () => {
            window.removeEventListener("badTeddyCartUpdated", handleCart);
            window.removeEventListener("cartUpdated", handleCart);
            window.removeEventListener("badTeddyWishlistUpdated", handleWish);
            window.removeEventListener("storage", handleCart);
        };
    }, [productData]);

    // Stock & State derivations
    const stockNumber = Number(productData?.stock ?? 0);
    const isOutOfStock = stockNumber <= 0;
    const isLowStock = stockNumber > 0 && stockNumber <= 5;

    const availableSizes = useMemo(() => {
        if (!productData) return ["S", "M", "L", "XL", "XXL"];
        if (Array.isArray(productData.sizes) && productData.sizes.length > 0) {
            return productData.sizes;
        }
        if (typeof productData.sizes === "string" && productData.sizes.trim()) {
            return productData.sizes.split(",").map(s => s.trim()).filter(Boolean);
        }
        return ["S", "M", "L", "XL", "XXL"];
    }, [productData]);

    const galleryImages = useMemo(() => {
        if (!productData) return [];

        let list = [];
        if (productData.gallery && typeof productData.gallery === "object") {
            const slots = ["front", "back", "sitting", "standing"];
            slots.forEach(slot => {
                if (productData.gallery[slot]) {
                    list.push({
                        slot,
                        path: productData.gallery[slot],
                        url: resolveProductImage(productData.gallery[slot])
                    });
                }
            });
        }

        if (list.length === 0 && Array.isArray(productData.images) && productData.images.length > 0) {
            productData.images.forEach((img, idx) => {
                if (img) {
                    list.push({
                        slot: ["front", "back", "sitting", "standing"][idx] || `view_${idx + 1}`,
                        path: img,
                        url: resolveProductImage(img)
                    });
                }
            });
        }

        if (list.length === 0 && productData.image) {
            list.push({
                slot: "front",
                path: productData.image,
                url: resolveProductImage(productData.image)
            });
        }

        // Deduplicate URLs while preserving order
        const seen = new Set();
        return list.filter(item => {
            if (!item.url || seen.has(item.url)) return false;
            seen.add(item.url);
            return true;
        });
    }, [productData]);

    const reviewList = useMemo(() => {
        if (productData?.reviews && Array.isArray(productData.reviews) && productData.reviews.length > 0) {
            return productData.reviews;
        }
        return fallbackReviews;
    }, [productData]);

    const finalRelatedProducts = useMemo(() => {
        if (productData?.related_products && Array.isArray(productData.related_products) && productData.related_products.length > 0) {
            return productData.related_products.map(p => ({
                ...p,
                image: resolveProductImage(p.image)
            }));
        }
        if (catalogFallbackProducts.length > 0) {
            return catalogFallbackProducts
                .filter(p => String(p.id) !== String(productData?.id))
                .slice(0, 4)
                .map(p => ({
                    ...p,
                    image: resolveProductImage(p.image)
                }));
        }
        return [];
    }, [productData, catalogFallbackProducts]);

    /* =====================================================
       QUANTITY CONTROLS
    ===================================================== */
    const increaseQuantity = () => {
        if (isOutOfStock) return;
        setQuantity(prev => {
            if (prev < stockNumber) return prev + 1;
            return prev;
        });
    };

    const decreaseQuantity = () => {
        if (isOutOfStock) return;
        setQuantity(prev => (prev > 1 ? prev - 1 : 1));
    };

    /* =====================================================
       ADD TO CART
    ===================================================== */
    const handleAddToCart = async () => {
        if (!productData || isOutOfStock) return;

        if (!loggedInUser?.id) {
            alert("Please sign in to add products to your bag.");
            navigate("/login");
            return;
        }

        try {
            const response = await fetch("http://localhost/BAD%20TEDDY/backend/api/cart.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: Number(loggedInUser.id),
                    product_id: Number(productData.id),
                    size: selectedSize || "M",
                    quantity: Number(quantity) || 1
                })
            });

            const data = await response.json();
            if (!data.success) {
                alert(data.message || "Unable to add product to cart.");
                return;
            }

            // Sync Local Cart
            const cart = getCart();
            const existingIndex = cart.findIndex(
                item => String(item.productId || item.id) === String(productData.id) && item.size === selectedSize
            );

            if (existingIndex !== -1) {
                cart[existingIndex].quantity += Number(quantity);
            } else {
                cart.push({
                    id: Number(productData.id),
                    productId: Number(productData.id),
                    name: productData.name,
                    price: Number(productData.price),
                    image: resolveProductImage(productData.image),
                    size: selectedSize || "M",
                    quantity: Number(quantity)
                });
            }

            localStorage.setItem("badTeddyCart", JSON.stringify(cart));
            setCartCount(cart.reduce((total, item) => total + Number(item.quantity || 1), 0));
            setAddedToCart(true);

            window.dispatchEvent(new Event("badTeddyCartUpdated"));
            window.dispatchEvent(new Event("cartUpdated"));

            setTimeout(() => {
                setAddedToCart(false);
            }, 1800);
        } catch (error) {
            console.error("Add to cart error:", error);
            alert("Unable to connect to the cart server.");
        }
    };

    /* =====================================================
       BUY NOW
    ===================================================== */
    const handleBuyNow = async () => {
        if (!productData || isOutOfStock) return;

        if (!loggedInUser?.id) {
            alert("Please sign in to proceed with direct checkout.");
            navigate("/login");
            return;
        }

        try {
            // Save to backend cart first to ensure checkout works seamlessly
            await fetch("http://localhost/BAD%20TEDDY/backend/api/cart.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: Number(loggedInUser.id),
                    product_id: Number(productData.id),
                    size: selectedSize || "M",
                    quantity: Number(quantity) || 1
                })
            });

            const buyNowProduct = {
                id: Number(productData.id),
                productId: Number(productData.id),
                name: productData.name,
                price: Number(productData.price),
                image: resolveProductImage(productData.image),
                size: selectedSize || "M",
                quantity: Number(quantity) || 1
            };

            localStorage.setItem("badTeddyBuyNow", JSON.stringify(buyNowProduct));
            window.dispatchEvent(new Event("badTeddyCartUpdated"));
            window.dispatchEvent(new Event("cartUpdated"));

            navigate("/checkout");
        } catch (err) {
            console.error("Buy now error:", err);
            navigate("/checkout");
        }
    };

    /* =====================================================
       WISHLIST
    ===================================================== */
    const handleWishlist = async () => {
        if (!productData) return;

        const currentlyWishlisted = isWishlisted;

        if (loggedInUser?.id) {
            try {
                if (currentlyWishlisted) {
                    await fetch("http://localhost/BAD%20TEDDY/backend/api/wishlist.php", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            user_id: Number(loggedInUser.id),
                            product_id: Number(productData.id)
                        })
                    });
                } else {
                    await fetch("http://localhost/BAD%20TEDDY/backend/api/wishlist.php", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            user_id: Number(loggedInUser.id),
                            product_id: Number(productData.id)
                        })
                    });
                }
            } catch (err) {
                console.error("Wishlist backend update error:", err);
            }
        }

        const wishlist = getWishlist();
        if (currentlyWishlisted) {
            const updated = wishlist.filter(item => String(item.id) !== String(productData.id));
            localStorage.setItem("badTeddyWishlist", JSON.stringify(updated));
            setIsWishlisted(false);
        } else {
            wishlist.push({
                id: productData.id,
                name: productData.name,
                price: productData.price,
                image: resolveProductImage(productData.image),
                category: productData.category
            });
            localStorage.setItem("badTeddyWishlist", JSON.stringify(wishlist));
            setIsWishlisted(true);
        }

        window.dispatchEvent(new Event("badTeddyWishlistUpdated"));
    };

    /* =====================================================
       ADD RELATED PRODUCT TO CART
    ===================================================== */
    const addRelatedToCart = async (product) => {
        const targetProduct = product || productData;
        const targetId = Number(targetProduct.id);
        const targetName = targetProduct.name;
        const targetPrice = Number(targetProduct.price);
        const targetImage = resolveProductImage(targetProduct.image);
        const targetSize = "M";

        if (loggedInUser?.id) {
            try {
                await fetch("http://localhost/BAD%20TEDDY/backend/api/cart.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: Number(loggedInUser.id),
                        product_id: targetId,
                        size: targetSize,
                        quantity: 1
                    })
                });
            } catch (err) {
                console.error("Backend add related to cart error:", err);
            }
        }

        const cart = getCart();
        const existingIndex = cart.findIndex(
            item => String(item.id || item.productId) === String(targetId) && item.size === targetSize
        );

        if (existingIndex !== -1) {
            cart[existingIndex].quantity += 1;
        } else {
            cart.push({
                id: targetId,
                productId: targetId,
                name: targetName,
                price: targetPrice,
                image: targetImage,
                size: targetSize,
                quantity: 1
            });
        }

        localStorage.setItem("badTeddyCart", JSON.stringify(cart));
        setCartCount(cart.reduce((total, item) => total + Number(item.quantity || 1), 0));

        window.dispatchEvent(new Event("badTeddyCartUpdated"));
        window.dispatchEvent(new Event("cartUpdated"));
    };

    /* =====================================================
       TAB CONTENT
    ===================================================== */
    const renderTabContent = () => {
        if (activeTab === "Description") {
            return (
                <div className="tab-pane">
                    <p>
                        {productData.description ||
                            "Crafted from premium heavyweight French Terry cotton, this piece represents Bad Teddy's raw streetwear ethos with signature luxury tailoring."}
                    </p>
                    <ul className="product-highlights-list">
                        <li><i className="fa-solid fa-check"></i> 100% Combed Premium Cotton</li>
                        <li><i className="fa-solid fa-check"></i> Signature Relaxed Streetwear Cut</li>
                        <li><i className="fa-solid fa-check"></i> High-Density Durable Graphics & Puff Print</li>
                        <li><i className="fa-solid fa-check"></i> Pre-shrunk & Colorfast Fabric</li>
                        <li><i className="fa-solid fa-check"></i> Unisex Streetwear Silhouette</li>
                        <li><i className="fa-solid fa-check"></i> Designed & Crafted in India</li>
                    </ul>
                </div>
            );
        }

        if (activeTab === "Details") {
            return (
                <div className="tab-pane">
                    <div className="specs-grid">
                        <div className="spec-item">
                            <span className="spec-label">Category:</span>
                            <span className="spec-value">{productData.category}</span>
                        </div>
                        <div className="spec-item">
                            <span className="spec-label">Style:</span>
                            <span className="spec-value">{productData.style || "Streetwear"}</span>
                        </div>
                        <div className="spec-item">
                            <span className="spec-label">Fit:</span>
                            <span className="spec-value">Oversized / Drop Shoulder</span>
                        </div>
                        <div className="spec-item">
                            <span className="spec-label">SKU:</span>
                            <span className="spec-value">BT-{productData.id.toString().padStart(4, "0")}</span>
                        </div>
                        <div className="spec-item">
                            <span className="spec-label">Available Sizes:</span>
                            <span className="spec-value">{availableSizes.join(", ")}</span>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === "Wash Care") {
            return (
                <div className="tab-pane">
                    <ul className="product-highlights-list">
                        <li><i className="fa-solid fa-droplet"></i> Machine wash cold with similar dark colors</li>
                        <li><i className="fa-solid fa-ban"></i> Do not bleach or use heavy industrial detergents</li>
                        <li><i className="fa-solid fa-shirt"></i> Iron inside-out on low temperature; avoid direct print contact</li>
                        <li><i className="fa-solid fa-wind"></i> Flat dry in shade to preserve relaxed fabric drape</li>
                    </ul>
                </div>
            );
        }

        return (
            <div className="tab-pane">
                <ul className="product-highlights-list">
                    <li><i className="fa-solid fa-truck-fast"></i> <strong>Free Express Shipping:</strong> Orders above ₹999 qualify for complimentary delivery across India.</li>
                    <li><i className="fa-solid fa-clock"></i> <strong>Delivery Timeline:</strong> Dispatched in 24 hours; arrives in 2-4 business days.</li>
                    <li><i className="fa-solid fa-rotate-left"></i> <strong>Easy Returns:</strong> 7-day hassle-free exchange & return policy.</li>
                    <li><i className="fa-solid fa-shield"></i> <strong>Payment Options:</strong> Cash on Delivery (COD), UPI, Cards & Net Banking.</li>
                </ul>
            </div>
        );
    };

    // Calculate approximate original price for luxury discount display
    const currentPrice = Number(productData?.price || 0);
    const oldPrice = productData?.oldPrice || Math.round(currentPrice * 1.35);
    const discountPct = productData?.discount || Math.round(((oldPrice - currentPrice) / oldPrice) * 100);

    /* =====================================================
       LOADING & ERROR STATES
    ===================================================== */
    if (loadingProduct) {
        return (
            <div className="product-page">
                <header className="product-header">
                    <div className="product-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                        <img src={logo} alt="Bad Teddy" />
                    </div>
                </header>
                <div className="product-loading-container">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <h3>Loading piece details...</h3>
                    <p>Fetching the latest Bad Teddy specifications from the catalog.</p>
                </div>
            </div>
        );
    }

    if (productError || !productData) {
        return (
            <div className="product-page">
                <header className="product-header">
                    <div className="product-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                        <img src={logo} alt="Bad Teddy" />
                    </div>
                </header>
                <div className="product-error-container">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <h3>Product Not Found</h3>
                    <p>{productError || "This piece is currently unavailable or has been archived."}</p>
                    <button className="back-shop-btn" onClick={() => navigate("/shop")}>
                        <i className="fa-solid fa-arrow-left"></i> Return To Shop
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="product-page">
            {/* =================================================
                HEADER
            ================================================= */}
            <header className="product-header">
                <div className="product-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                    <img src={logo} alt="Bad Teddy" />
                </div>

                <div className="product-header-actions">
                    <button
                        className={`product-icon-btn ${isWishlisted ? "wishlist-active" : ""}`}
                        onClick={handleWishlist}
                        aria-label="Wishlist"
                        title="Wishlist"
                    >
                        <i className={isWishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart"} />
                    </button>

                    <button
                        className="product-icon-btn"
                        onClick={() => navigate("/cart")}
                        aria-label="Cart"
                        title="Cart"
                    >
                        <i className="fa-solid fa-bag-shopping" />
                        {cartCount > 0 && <span className="header-count-badge">{cartCount}</span>}
                    </button>
                </div>
            </header>

            <main className="product-main-wrapper">
                {/* =================================================
                    BREADCRUMB
                ================================================= */}
                <nav className="product-breadcrumb" aria-label="Breadcrumb">
                    <button onClick={() => navigate(-1)} className="breadcrumb-back-btn">
                        <i className="fa-solid fa-arrow-left"></i> Back
                    </button>
                    <span className="bc-sep">/</span>
                    <Link to="/shop">Shop</Link>
                    <span className="bc-sep">/</span>
                    <span className="bc-cat">{productData.category}</span>
                    <span className="bc-sep">/</span>
                    <span className="bc-curr">{productData.name}</span>
                </nav>

                {/* =================================================
                    PRODUCT HERO SECTION (2-COL BALANCED GRID)
                ================================================= */}
                <section className="product-section">
                    {/* LEFT: GALLERY */}
                    <div className="product-gallery">
                        <div className="thumbnail-column">
                            {galleryImages.map((item, idx) => (
                                <button
                                    key={idx}
                                    className={`thumb-btn ${selectedImage === item.url ? "active" : ""}`}
                                    onClick={() => setSelectedImage(item.url)}
                                    aria-label={`View ${item.slot.replace("_", " ")}`}
                                    title={`View ${item.slot.charAt(0).toUpperCase() + item.slot.slice(1)}`}
                                >
                                    <img src={item.url} alt={`${productData.name} - ${item.slot}`} />
                                </button>
                            ))}
                        </div>

                        <div className="main-image-card">
                            <img
                                src={selectedImage || (galleryImages[0]?.url) || resolveProductImage(productData.image)}
                                alt={productData.name}
                                className="featured-img"
                            />

                            {productData.badge && (
                                <span className="image-badge-pill">{productData.badge}</span>
                            )}

                            <button
                                className={`image-wishlist-float ${isWishlisted ? "active" : ""}`}
                                onClick={handleWishlist}
                                aria-label="Toggle Wishlist"
                            >
                                <i className={isWishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart"} />
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: PRODUCT DETAILS & BUY BOX */}
                    <div className="product-details-panel">
                        {/* Meta Category & Stock Row */}
                        <div className="product-meta-header">
                            <span className="category-tag">{productData.category}</span>

                            <div className={`stock-status-pill ${isOutOfStock ? "out" : isLowStock ? "low" : "in"}`}>
                                <i className={isOutOfStock ? "fa-solid fa-circle-xmark" : "fa-solid fa-circle-check"} />
                                <span>
                                    {isOutOfStock
                                        ? "Out of Stock"
                                        : isLowStock
                                        ? `Only ${stockNumber} left in stock`
                                        : "In Stock & Ready to Ship"}
                                </span>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="product-main-title">{productData.name}</h1>

                        {/* Ratings */}
                        <div className="product-rating-row">
                            <div className="stars-row">
                                {[1, 2, 3, 4, 5].map(star => {
                                    const ratingVal = Number(productData.rating || 4.8);
                                    if (ratingVal >= star) {
                                        return <i key={star} className="fa-solid fa-star" />;
                                    }
                                    if (ratingVal >= star - 0.5) {
                                        return <i key={star} className="fa-solid fa-star-half-stroke" />;
                                    }
                                    return <i key={star} className="fa-regular fa-star" />;
                                })}
                            </div>
                            <span className="rating-num">{Number(productData.rating || 4.8).toFixed(1)}</span>
                            <span className="rating-dot">•</span>
                            <span className="rating-count">{reviewList.length} verified reviews</span>
                        </div>

                        {/* Price Card */}
                        <div className="product-price-container">
                            <div className="price-line">
                                <span className="current-price">
                                    ₹{Number(productData.price).toLocaleString("en-IN")}
                                </span>
                                {oldPrice > currentPrice && (
                                    <span className="strike-price">₹{Number(oldPrice).toLocaleString("en-IN")}</span>
                                )}
                                {discountPct > 0 && (
                                    <span className="save-badge">{discountPct}% OFF</span>
                                )}
                            </div>
                            <p className="tax-inclusive-text">
                                <i className="fa-solid fa-shield-check"></i> Inclusive of all taxes • Free express shipping
                            </p>
                        </div>

                        {/* Short Description */}
                        {productData.description && (
                            <p className="product-excerpt">{productData.description}</p>
                        )}

                        {/* Size Selection */}
                        <div className="size-selector-block">
                            <div className="size-label-row">
                                <span className="block-label">Select Size</span>
                                <button
                                    type="button"
                                    className="size-guide-trigger"
                                    onClick={() => {
                                        setActiveTab("Details");
                                        document.getElementById("product-tabs-section")?.scrollIntoView({ behavior: "smooth" });
                                    }}
                                >
                                    <i className="fa-solid fa-ruler-combined"></i> Size Guide
                                </button>
                            </div>

                            <div className="size-buttons-group">
                                {availableSizes.map(size => (
                                    <button
                                        key={size}
                                        type="button"
                                        className={`size-chip ${selectedSize === size ? "active" : ""}`}
                                        onClick={() => setSelectedSize(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="quantity-selector-block">
                            <span className="block-label">Quantity</span>
                            <div className="quantity-stepper">
                                <button
                                    type="button"
                                    onClick={decreaseQuantity}
                                    disabled={isOutOfStock || quantity <= 1}
                                    aria-label="Decrease quantity"
                                >
                                    <i className="fa-solid fa-minus"></i>
                                </button>
                                <span className="stepper-count">{isOutOfStock ? 0 : quantity}</span>
                                <button
                                    type="button"
                                    onClick={increaseQuantity}
                                    disabled={isOutOfStock || quantity >= stockNumber}
                                    aria-label="Increase quantity"
                                >
                                    <i className="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </div>

                        {/* Main Purchase Action Buttons */}
                        <div className="purchase-buttons-grid">
                            <button
                                type="button"
                                className={`primary-cart-btn ${addedToCart ? "added" : ""} ${isOutOfStock ? "disabled-btn" : ""}`}
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                            >
                                <i className={addedToCart ? "fa-solid fa-circle-check" : isOutOfStock ? "fa-solid fa-ban" : "fa-solid fa-bag-shopping"} />
                                <span>{isOutOfStock ? "Out of Stock" : addedToCart ? "Added to Cart!" : "Add to Cart"}</span>
                            </button>

                            <button
                                type="button"
                                className={`primary-buy-btn ${isOutOfStock ? "disabled-btn" : ""}`}
                                onClick={handleBuyNow}
                                disabled={isOutOfStock}
                            >
                                <i className="fa-solid fa-bolt" />
                                <span>{isOutOfStock ? "Unavailable" : "Buy Now"}</span>
                            </button>
                        </div>

                        {/* Full-width Wishlist Action */}
                        <button
                            type="button"
                            className={`secondary-wishlist-btn ${isWishlisted ? "active" : ""}`}
                            onClick={handleWishlist}
                        >
                            <i className={isWishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart"} />
                            <span>{isWishlisted ? "Saved in Wishlist" : "Add to Wishlist"}</span>
                        </button>

                        {/* Trust Micro-Features */}
                        <div className="product-trust-strip">
                            <div className="trust-cell">
                                <i className="fa-solid fa-shield-halved"></i>
                                <div>
                                    <strong>100% Authentic</strong>
                                    <span>Direct from Bad Teddy</span>
                                </div>
                            </div>
                            <div className="trust-cell">
                                <i className="fa-solid fa-truck-fast"></i>
                                <div>
                                    <strong>Fast Delivery</strong>
                                    <span>2-4 Business Days</span>
                                </div>
                            </div>
                            <div className="trust-cell">
                                <i className="fa-solid fa-rotate-left"></i>
                                <div>
                                    <strong>Easy Returns</strong>
                                    <span>7 Days Return Policy</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* =================================================
                    SHIPPING / VALUE PROPOSITIONS
                ================================================= */}
                <section className="shipping-highlights-grid">
                    <div className="highlight-box">
                        <i className="fa-solid fa-truck-fast"></i>
                        <h3>Free Express Shipping</h3>
                        <p>Complimentary delivery across India on orders ₹999+</p>
                    </div>
                    <div className="highlight-box">
                        <i className="fa-solid fa-rotate-left"></i>
                        <h3>Easy 7-Day Returns</h3>
                        <p>No questions asked size and item replacements</p>
                    </div>
                    <div className="highlight-box">
                        <i className="fa-solid fa-shield-halved"></i>
                        <h3>100% Safe Checkout</h3>
                        <p>Encrypted 256-bit secure gateway & UPI support</p>
                    </div>
                    <div className="highlight-box">
                        <i className="fa-solid fa-money-bill-wave"></i>
                        <h3>Cash on Delivery</h3>
                        <p>Pay at your doorstep with verified tracking</p>
                    </div>
                </section>

                {/* =================================================
                    DESCRIPTION + SIZE GUIDE SECTION
                ================================================= */}
                <section className="details-and-guide-grid" id="product-tabs-section">
                    <div className="details-tabs-card">
                        <div className="tabs-nav-bar">
                            {["Description", "Details", "Wash Care", "Shipping & Returns"].map(tab => (
                                <button
                                    key={tab}
                                    className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="tabs-body-content">
                            {renderTabContent()}
                        </div>
                    </div>

                    <div className="size-guide-card">
                        <div className="guide-header">
                            <i className="fa-solid fa-ruler-horizontal"></i>
                            <h3>Size & Fit Guide</h3>
                        </div>
                        <p className="guide-subtext">All measurements in inches. Designed for an authentic relaxed streetwear drop.</p>

                        <div className="table-responsive">
                            <table className="size-table">
                                <thead>
                                    <tr>
                                        <th>Size</th>
                                        <th>Chest</th>
                                        <th>Length</th>
                                        <th>Shoulder</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>S</strong></td>
                                        <td>40"</td>
                                        <td>27"</td>
                                        <td>19.5"</td>
                                    </tr>
                                    <tr>
                                        <td><strong>M</strong></td>
                                        <td>42"</td>
                                        <td>28"</td>
                                        <td>20.5"</td>
                                    </tr>
                                    <tr>
                                        <td><strong>L</strong></td>
                                        <td>44"</td>
                                        <td>29"</td>
                                        <td>21.5"</td>
                                    </tr>
                                    <tr>
                                        <td><strong>XL</strong></td>
                                        <td>46"</td>
                                        <td>30"</td>
                                        <td>22.5"</td>
                                    </tr>
                                    <tr>
                                        <td><strong>XXL</strong></td>
                                        <td>48"</td>
                                        <td>31"</td>
                                        <td>23.5"</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <p className="model-fit-annotation">
                            <i className="fa-solid fa-circle-info"></i> Model is 6'1" (185 cm) wearing Size L for an oversized drape.
                        </p>
                    </div>
                </section>

                {/* =================================================
                    AI SECTION & COMPLETE THE LOOK
                ================================================= */}
                <section className="ai-curation-section">
                    {/* Left: AI Recommendations */}
                    <div className="curation-card">
                        <div className="curation-title">
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                            <div>
                                <h2>AI Outfit Stylist</h2>
                                <p>Personalized recommendations based on this piece's aesthetic.</p>
                            </div>
                        </div>

                        <div className="ai-grid-mini">
                            {(dynamicAiRecommendations.length > 0 ? dynamicAiRecommendations : finalRelatedProducts)
                                .slice(0, showMoreStyles ? 6 : 3)
                                .map(item => (
                                    <div
                                        className="mini-product-card"
                                        key={item.id}
                                        onClick={() => navigate(`/product/${item.id}`)}
                                    >
                                        <div className="mini-img-wrap">
                                            <img src={item.image} alt={item.name} />
                                        </div>
                                        <div className="mini-info">
                                            <h4>{item.name}</h4>
                                            <span className="mini-price">₹{Number(item.price).toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        <button
                            type="button"
                            className="toggle-more-btn"
                            onClick={() => setShowMoreStyles(prev => !prev)}
                        >
                            <span>{showMoreStyles ? "Show Less" : "Explore More AI Styles"}</span>
                            <i className={`fa-solid ${showMoreStyles ? "fa-chevron-up" : "fa-arrow-right"}`} />
                        </button>
                    </div>

                    {/* Right: Complete The Look */}
                    <div className="curation-card">
                        <div className="curation-title">
                            <i className="fa-solid fa-shirt"></i>
                            <div>
                                <h2>Complete The Look</h2>
                                <p>Curated pairing for an effortless full Bad Teddy fit.</p>
                            </div>
                        </div>

                        <div className="look-grid-mini">
                            {(dynamicCompleteLook.length > 0 ? dynamicCompleteLook : finalRelatedProducts)
                                .slice(0, 4)
                                .map(item => (
                                    <div
                                        className="look-tile-card"
                                        key={item.id}
                                        onClick={() => navigate(`/product/${item.id}`)}
                                    >
                                        <div className="look-img-wrap">
                                            <img src={item.image} alt={item.name} />
                                        </div>
                                        <h4>{item.name}</h4>
                                        <span className="look-price">₹{Number(item.price).toLocaleString("en-IN")}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </section>

                {/* =================================================
                    CUSTOMER REVIEWS
                ================================================= */}
                <section className="reviews-section">
                    <div className="section-heading-row">
                        <div>
                            <span className="sub-tag">CUSTOMER FEEDBACK</span>
                            <h2>Verified Reviews</h2>
                        </div>
                        <div className="overall-badge">
                            <i className="fa-solid fa-star"></i>
                            <strong>{Number(productData.rating || 4.8).toFixed(1)} / 5.0</strong>
                        </div>
                    </div>

                    <div className="reviews-cards-grid">
                        {reviewList.map(rev => (
                            <div className="review-box" key={rev.id}>
                                <div className="rev-header">
                                    <div className="rev-avatar">
                                        {(rev.name || "U").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4>{rev.name}</h4>
                                        <div className="rev-stars">
                                            {[1, 2, 3, 4, 5].map(st => (
                                                <i key={st} className="fa-solid fa-star" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="rev-body">{rev.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* =================================================
                    RELATED PRODUCTS
                ================================================= */}
                {finalRelatedProducts.length > 0 && (
                    <section className="related-products-section">
                        <div className="section-heading-row">
                            <div>
                                <span className="sub-tag">DISCOVER MORE</span>
                                <h2>You May Also Like</h2>
                            </div>
                            <Link to="/shop" className="view-shop-link">
                                View Full Collection <i className="fa-solid fa-arrow-right"></i>
                            </Link>
                        </div>

                        <div className="related-cards-grid">
                            {finalRelatedProducts.map(relProduct => (
                                <div
                                    className="related-item-card"
                                    key={relProduct.id}
                                    onClick={() => navigate(`/product/${relProduct.id}`)}
                                >
                                    <div className="rel-img-wrapper">
                                        <img src={relProduct.image} alt={relProduct.name} />
                                        {relProduct.badge && (
                                            <span className="rel-badge">{relProduct.badge}</span>
                                        )}
                                    </div>
                                    <div className="rel-content">
                                        <span className="rel-category">{relProduct.category || "Streetwear"}</span>
                                        <h4>{relProduct.name}</h4>
                                        <div className="rel-bottom-row">
                                            <span className="rel-price">
                                                ₹{Number(relProduct.price).toLocaleString("en-IN")}
                                            </span>
                                            <button
                                                className="quick-add-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addRelatedToCart(relProduct);
                                                }}
                                                aria-label={`Add ${relProduct.name} to cart`}
                                                title="Add to cart"
                                            >
                                                <i className="fa-solid fa-bag-shopping" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* =================================================
                BOTTOM NAVIGATION
            ================================================= */}
            <nav className="bottom-nav">
                <Link to="/" className={location.pathname === "/" ? "active" : ""}>
                    <i className="fa-solid fa-house"></i>
                    <span>Home</span>
                </Link>

                <Link to="/shop" className={location.pathname === "/shop" ? "active" : ""}>
                    <i className="fa-solid fa-bag-shopping"></i>
                    <span>Shop</span>
                </Link>

                <Link to="/assistant" className={location.pathname === "/assistant" ? "active" : ""}>
                    <i className="fa-solid fa-robot"></i>
                    <span>AI</span>
                </Link>

                <Link to="/profile" className={location.pathname === "/profile" ? "active" : ""}>
                    <i className="fa-regular fa-user"></i>
                    <span>Profile</span>
                </Link>
            </nav>
        </div>
    );
}

export default Product;