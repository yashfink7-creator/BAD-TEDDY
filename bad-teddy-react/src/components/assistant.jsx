import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "../styles/Assistant.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import logo from "../assets/mylogo.png";
import resolveProductImage from "../utils/imageResolver";

function Assistant() {

    const navigate = useNavigate();
    const location = useLocation();


    /* =====================================================
       WISHLIST
    ===================================================== */

    const [wishlist, setWishlist] = useState(() => {

        try {

            const savedWishlist = JSON.parse(
                localStorage.getItem("badTeddyWishlist")
            );

            return Array.isArray(savedWishlist)
                ? savedWishlist
                : [];

        } catch {

            return [];

        }

    });


    /* =====================================================
       CART
    ===================================================== */

    const [cart, setCart] = useState(() => {

        try {

            const savedCart = JSON.parse(
                localStorage.getItem("badTeddyCart")
            );

            return Array.isArray(savedCart)
                ? savedCart
                : [];

        } catch {

            return [];

        }

    });


    /* =====================================================
       UPDATE WISHLIST + CART
    ===================================================== */

    useEffect(() => {

        const updateWishlist = () => {

            try {

                const savedWishlist = JSON.parse(
                    localStorage.getItem("badTeddyWishlist")
                );

                setWishlist(
                    Array.isArray(savedWishlist)
                        ? savedWishlist
                        : []
                );

            } catch {

                setWishlist([]);

            }

        };


        const updateCart = () => {

            try {

                const savedCart = JSON.parse(
                    localStorage.getItem("badTeddyCart")
                );

                setCart(
                    Array.isArray(savedCart)
                        ? savedCart
                        : []
                );

            } catch {

                setCart([]);

            }

        };


        window.addEventListener(
            "badTeddyWishlistUpdated",
            updateWishlist
        );

        window.addEventListener(
            "badTeddyCartUpdated",
            updateCart
        );

        window.addEventListener(
            "storage",
            updateWishlist
        );

        window.addEventListener(
            "storage",
            updateCart
        );


        return () => {

            window.removeEventListener(
                "badTeddyWishlistUpdated",
                updateWishlist
            );

            window.removeEventListener(
                "badTeddyCartUpdated",
                updateCart
            );

            window.removeEventListener(
                "storage",
                updateWishlist
            );

            window.removeEventListener(
                "storage",
                updateCart
            );

        };

    }, []);


    /* =====================================================
       CHAT
    ===================================================== */

    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);


    /* =====================================================
       RECOMMENDED PRODUCTS (Live AI & Catalog Synced)
    ===================================================== */

    const [recommendedProducts, setRecommendedProducts] = useState([
        {
            id: 1,
            image: resolveProductImage("prod1.jpeg"),
            name: "Oversized Tee",
            price: 899
        },
        {
            id: 2,
            image: resolveProductImage("prod2.jpg"),
            name: "Classic Hoodie",
            price: 1699
        },
        {
            id: 3,
            image: resolveProductImage("prod3.jpg"),
            name: "Relaxed Cargo",
            price: 1499
        },
        {
            id: 4,
            image: resolveProductImage("prod4.jpg"),
            name: "Graphic Tee",
            price: 999
        }
    ]);

    useEffect(() => {
        const fetchInitialRecommendations = async () => {
            try {
                const res = await fetch("http://127.0.0.1:5000/api/recommendations?limit=4");
                const data = await res.json();
                if (data.success && Array.isArray(data.ai_recommendations) && data.ai_recommendations.length > 0) {
                    const formatted = data.ai_recommendations.map((p) => ({
                        ...p,
                        image: resolveProductImage(p.image)
                    }));
                    setRecommendedProducts(formatted);
                }
            } catch (err) {
                console.error("Failed to load initial AI recommendations:", err);
            }
        };
        fetchInitialRecommendations();
    }, []);


    /* =====================================================
       SEND MESSAGE (Trained NLP Intent Model Inference)
    ===================================================== */

    const sendMessage = async () => {

        const trimmedMessage = message.trim();

        if (!trimmedMessage || isTyping) {
            return;
        }


        const userMessage = {
            id: Date.now(),
            sender: "user",
            text: trimmedMessage
        };


        setMessages((previous) => [
            ...previous,
            userMessage
        ]);

        setMessage("");
        setIsTyping(true);

        try {
            const response = await fetch("http://127.0.0.1:5000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: trimmedMessage
                })
            });

            const data = await response.json();

            let replyText = "";
            if (data.success && data.reply) {
                replyText = data.reply;
                if (Array.isArray(data.recommended_products) && data.recommended_products.length > 0) {
                    const formatted = data.recommended_products.map((p) => ({
                        ...p,
                        image: resolveProductImage(p.image)
                    }));
                    setRecommendedProducts(formatted);
                }
            } else {
                replyText = getFashionResponse(trimmedMessage);
            }

            setMessages((previous) => [
                ...previous,
                {
                    id: Date.now() + 1,
                    sender: "assistant",
                    text: replyText
                }
            ]);

        } catch (error) {
            console.error("AI Chatbot API connection error:", error);
            setMessages((previous) => [
                ...previous,
                {
                    id: Date.now() + 1,
                    sender: "assistant",
                    text: getFashionResponse(trimmedMessage)
                }
            ]);
        } finally {
            setIsTyping(false);
        }

    };


    /* =====================================================
       BASIC FASHION RESPONSE (Fallback Helper)
    ===================================================== */

    const getFashionResponse = (text) => {
        const lowerText = text.toLowerCase();

        if (lowerText.includes("trip") || lowerText.includes("travel") || lowerText.includes("vacation") || lowerText.includes("airport")) {
            return "For a trip or long travel, utility and comfort are essential! I recommend pairing our Relaxed Cargo Pants (multi-functional pockets for your passport & essentials) with our breathable Oversized Signature Tee (₹999). For flights, layer with our Premium Black Hoodie and finish with the Signature Street Cap.";
        }

        if (lowerText.includes("college") || lowerText.includes("university") || lowerText.includes("campus")) {
            return "For college, try our Oversized Signature Tee with Relaxed Jeans. Add the Signature Street Cap to complete the effortless campus drip.";
        }

        if (lowerText.includes("party") || lowerText.includes("club") || lowerText.includes("nightout")) {
            return "For a party look, I'd recommend our Premium Black Hoodie or Dark Graphic Tee paired with relaxed jeans. Keep accessories minimal and let the streetwear silhouette stand out.";
        }

        if (lowerText.includes("cheapest") || lowerText.includes("lowest price") || lowerText.includes("budget")) {
            return "Our most affordable streetwear pieces start with the Signature Teddy Cap at ₹799, followed by our Oversized Signature Tee and Street Graphic Tee at ₹999.";
        }

        if (lowerText.includes("anything else") || lowerText.includes("what else") || lowerText.includes("tell me more")) {
            return "You can also level up your look with our streetwear accessories like the Signature Teddy Cap (₹799), or try monochrome layering with an oversized hoodie under a structured jacket for effortless depth!";
        }

        if (lowerText.includes("casual") || lowerText.includes("everyday")) {
            return "For a casual streetwear look, try our Oversized Tee with Relaxed Jeans. Finish the outfit with a cap.";
        }

        if (lowerText.includes("hoodie")) {
            return "The Premium Black Hoodie is a great choice for a relaxed streetwear look. Pair it with our Relaxed Jeans.";
        }

        if (lowerText.includes("size") || lowerText.includes("fit") || lowerText.includes("cm") || lowerText.includes("kg")) {
            return "Tell me your height in cm and weight in kg right here in chat (e.g. 'I am 175 cm and 70 kg'), and our trained Random Forest AI size model will recommend your exact fit!";
        }

        return "I can help you style outfits for college, parties, trips, recommend the right size for your height/weight, or find specific products. Tell me what you're looking for!";
    };


    /* =====================================================
       ENTER KEY
    ===================================================== */

    const handleKeyDown = (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    };


    /* =====================================================
       QUICK PROMPTS
    ===================================================== */

    const handleQuickPrompt = (prompt) => {

        setMessage(prompt);

    };


    /* =====================================================
       PRODUCT CLICK
    ===================================================== */

    const handleProductClick = (product) => {

        navigate(`/product/${product.id}`);

    };


    /* =====================================================
       CART COUNT
    ===================================================== */

    const cartCount = cart.reduce(
        (total, item) =>
            total + Number(item.quantity || 1),
        0
    );


    return (

        <div className="assistant-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <header className="assistant-header">


                <div className="assistant-brand">

                    <img
                        src={logo}
                        alt="Bad Teddy"
                    />

                </div>


                <div className="assistant-header-title">

                    <span>
                        BAD TEDDY
                    </span>

                    <h1>
                        AI STUDIO
                    </h1>

                </div>


                <div className="assistant-header-actions">


                    {/* WISHLIST */}

                    <button
                        className="assistant-header-btn"
                        type="button"
                        onClick={() => navigate("/wishlist")}
                        aria-label="Wishlist"
                    >

                        <i className="fa-regular fa-heart"></i>

                        {wishlist.length > 0 && (

                            <span className="assistant-header-count">
                                {wishlist.length}
                            </span>

                        )}

                    </button>


                    {/* CART */}

                    <button
                        className="assistant-header-btn"
                        type="button"
                        onClick={() => navigate("/cart")}
                        aria-label="Shopping Cart"
                    >

                        <i className="fa-solid fa-bag-shopping"></i>

                        {cartCount > 0 && (

                            <span className="assistant-header-count">
                                {cartCount}
                            </span>

                        )}

                    </button>


                </div>

            </header>



            {/* =================================================
                MAIN
            ================================================= */}

            <main className="assistant-main">


                {/* =================================================
                    HERO
                ================================================= */}

                <section className="assistant-hero">


                    <div className="assistant-hero-icon">

                        <i className="fa-solid fa-wand-magic-sparkles"></i>

                    </div>


                    <div className="assistant-hero-content">

                        <span className="assistant-label">
                            BAD TEDDY INTELLIGENCE
                        </span>

                        <h2>

                            Your Personal
                            <br />

                            <strong>
                                Fashion Assistant
                            </strong>

                        </h2>

                        <p>
                            Tell me what you're looking for and
                            I'll help you find the right style,
                            outfit or product.
                        </p>

                    </div>

                </section>



                {/* =================================================
                    AI TOOLS
                ================================================= */}

                <section className="assistant-tools">


                    {/* STYLE ASSISTANT */}

                    <button
                        className="assistant-tool active"
                        type="button"
                    >

                        <div className="tool-icon">

                            <i className="fa-solid fa-shirt"></i>

                        </div>

                        <div>

                            <strong>
                                Style Assistant
                            </strong>

                            <span>
                                Find your perfect look
                            </span>

                        </div>

                    </button>



                    {/* SIZE RECOMMENDATION */}

                    <button
                        className="assistant-tool"
                        type="button"
                        onClick={() =>
                            navigate("/size-recommendation")
                        }
                    >

                        <div className="tool-icon">

                            <i className="fa-solid fa-ruler-combined"></i>

                        </div>

                        <div>

                            <strong>
                                Find My Size
                            </strong>

                            <span>
                                Get your recommended size
                            </span>

                        </div>

                        <i className="fa-solid fa-chevron-right tool-arrow"></i>

                    </button>


                </section>



                {/* =================================================
                    CHAT
                ================================================= */}

                <section className="assistant-chat-section">


                    <div className="chat-heading">

                        <div>

                            <span className="online-dot"></span>

                            <strong>
                                Bad Teddy AI
                            </strong>

                        </div>

                        <span className="chat-status">
                            Fashion Intelligence
                        </span>

                    </div>



                    {/* CHAT MESSAGES */}

                    <div className="chat-messages">


                        {messages.length === 0 && (

                            <div className="chat-empty">

                                <div className="empty-icon">

                                    <i className="fa-solid fa-comment-dots"></i>

                                </div>

                                <h3>
                                    What are you looking for?
                                </h3>

                                <p>
                                    Ask about outfits, styles,
                                    products or what to wear
                                    for a particular occasion.
                                </p>

                            </div>

                        )}



                        {messages.map((item) => (

                            <div
                                key={item.id}
                                className={`chat-message ${item.sender}`}
                            >

                                <div className="message-bubble">

                                    {item.text}

                                </div>

                            </div>

                        ))}



                        {isTyping && (

                            <div className="chat-message assistant">

                                <div className="message-bubble typing">

                                    <span></span>
                                    <span></span>
                                    <span></span>

                                </div>

                            </div>

                        )}

                    </div>



                    {/* =================================================
                        QUICK PROMPTS
                    ================================================= */}

                    <div className="quick-prompts">

                        <span>
                            Try asking
                        </span>


                        <button
                            type="button"
                            onClick={() =>
                                handleQuickPrompt(
                                    "Suggest an outfit for college"
                                )
                            }
                        >
                            College outfit
                        </button>


                        <button
                            type="button"
                            onClick={() =>
                                handleQuickPrompt(
                                    "Suggest a casual streetwear outfit"
                                )
                            }
                        >
                            Casual streetwear
                        </button>


                        <button
                            type="button"
                            onClick={() =>
                                handleQuickPrompt(
                                    "Suggest an outfit under ₹2000"
                                )
                            }
                        >
                            Under ₹2000
                        </button>

                    </div>



                    {/* =================================================
                        MESSAGE INPUT
                    ================================================= */}

                    <div className="assistant-input-wrapper">

                        <textarea
                            value={message}
                            onChange={(event) =>
                                setMessage(event.target.value)
                            }
                            onKeyDown={handleKeyDown}
                            placeholder="Ask Bad Teddy AI..."
                            rows="1"
                        />


                        <button
                            type="button"
                            className="send-message-btn"
                            onClick={sendMessage}
                            disabled={
                                !message.trim() ||
                                isTyping
                            }
                            aria-label="Send message"
                        >

                            <i className="fa-solid fa-arrow-up"></i>

                        </button>

                    </div>


                </section>



                {/* =================================================
                    RECOMMENDED PRODUCTS
                ================================================= */}

                <section className="assistant-products">


                    <div className="assistant-section-heading">

                        <div>

                            <span>
                                PERSONALIZED FOR YOU
                            </span>

                            <h2>
                                Recommended Pieces
                            </h2>

                        </div>


                        <i className="fa-solid fa-sparkles"></i>

                    </div>



                    <div className="assistant-product-row">

                        {recommendedProducts.map((product) => (

                            <button
                                className="assistant-product-card"
                                key={product.id}
                                type="button"
                                onClick={() =>
                                    handleProductClick(product)
                                }
                            >

                                <div className="assistant-product-image">

                                    <img
                                        src={product.image}
                                        alt={product.name}
                                    />

                                    <span className="ai-match">

                                        <i className="fa-solid fa-wand-magic-sparkles"></i>

                                        AI Pick

                                    </span>

                                </div>


                                <div className="assistant-product-info">

                                    <h3>
                                        {product.name}
                                    </h3>

                                    <p>
                                        ₹{product.price.toLocaleString("en-IN")}
                                    </p>

                                </div>

                            </button>

                        ))}

                    </div>

                </section>



                {/* =================================================
                    INFORMATION CARD
                ================================================= */}

                <section className="assistant-info-card">


                    <div className="info-card-icon">

                        <i className="fa-solid fa-brain"></i>

                    </div>


                    <div>

                        <span>
                            BUILT FOR BAD TEDDY
                        </span>

                        <h3>
                            Fashion intelligence,
                            your way.
                        </h3>

                        <p>
                            Get personalized fashion guidance
                            based on your style, occasion and
                            Bad Teddy collection.
                        </p>

                    </div>

                </section>


            </main>



            {/* =================================================
                BOTTOM NAVIGATION
            ================================================= */}

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

                    <span>
                        Home
                    </span>

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

                    <span>
                        Shop
                    </span>

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

                    <span>
                        AI
                    </span>

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

                    <span>
                        Profile
                    </span>

                </Link>


            </nav>


        </div>

    );

}


export default Assistant;