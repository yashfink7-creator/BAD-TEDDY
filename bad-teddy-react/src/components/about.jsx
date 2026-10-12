import React, { useEffect, useState } from "react";
import {
    Link,
    useLocation,
    useNavigate
} from "react-router-dom";

import "../styles/about.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import logo from "../assets/mylogo.png";
import banner from "../assets/bannerimg.jpg";
import resolveProductImage from "../utils/imageResolver";


function About() {

    const navigate = useNavigate();
    const location = useLocation();


    /* =====================================
       WISHLIST
    ===================================== */

    const [wishlist, setWishlist] = useState(() => {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem("badTeddyWishlist")
                );

            return Array.isArray(saved)
                ? saved
                : [];

        } catch {

            return [];

        }

    });


    /* =====================================
       CART
    ===================================== */

    const [cart, setCart] = useState(() => {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem("badTeddyCart")
                );

            return Array.isArray(saved)
                ? saved
                : [];

        } catch {

            return [];

        }

    });


    /* =====================================
       UPDATE COUNTS
    ===================================== */

    useEffect(() => {

        const updateWishlist = () => {

            try {

                const saved =
                    JSON.parse(
                        localStorage.getItem(
                            "badTeddyWishlist"
                        )
                    );

                setWishlist(
                    Array.isArray(saved)
                        ? saved
                        : []
                );

            } catch {

                setWishlist([]);

            }

        };


        const updateCart = () => {

            try {

                const saved =
                    JSON.parse(
                        localStorage.getItem(
                            "badTeddyCart"
                        )
                    );

                setCart(
                    Array.isArray(saved)
                        ? saved
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


    /* =====================================
       TIMELINE
    ===================================== */

    const timeline = [

        {
            year: "2023",
            title: "THE BEGINNING",
            text:
                "Bad Teddy emerged in the heart of the city with a simple idea — create streetwear that feels different, comfortable and unapologetically bold."
        },

        {
            year: "01",
            title: "THE INSPIRATION",
            text:
                "A deep love for denim, street culture and individuality became one of the foundations behind the brand's visual identity and attitude."
        },

        {
            year: "02",
            title: "THE NAME",
            text:
                "The bold energy of 'Bad' met the warmth and personal meaning of 'Teddy', creating a name that felt both rebellious and personal."
        },

        {
            year: "NOW",
            title: "THE MOVEMENT",
            text:
                "Bad Teddy continues to build pieces for people who don't follow the crowd and aren't afraid to create their own style."
        }

    ];


    /* =====================================
       PRODUCT ACTION
    ===================================== */

    const openProduct = (id) => {

        navigate(`/product/${id}`);

    };


    return (

        <div className="about-page">


            {/* =================================
                HEADER
            ================================= */}

            <header className="about-header">

                <button
                    className="about-back"
                    onClick={() => navigate(-1)}
                >

                    <i className="fa-solid fa-arrow-left"></i>

                </button>


                <img
                    src={logo}
                    alt="Bad Teddy"
                    className="about-logo"
                />


                <div className="about-header-actions">

                    <button
                        className="about-header-btn"
                        onClick={() => navigate("/wishlist")}
                        aria-label="Wishlist"
                    >

                        <i className="fa-regular fa-heart"></i>

                        {wishlist.length > 0 && (

                            <span>
                                {wishlist.length}
                            </span>

                        )}

                    </button>


                    <button
                        className="about-header-btn"
                        onClick={() => navigate("/cart")}
                        aria-label="Cart"
                    >

                        <i className="fa-solid fa-bag-shopping"></i>

                        {cart.length > 0 && (

                            <span>
                                {cart.reduce(
                                    (total, item) =>
                                        total +
                                        Number(
                                            item.quantity || 1
                                        ),
                                    0
                                )}
                            </span>

                        )}

                    </button>

                </div>

            </header>


            {/* =================================
                HERO
            ================================= */}

            <section className="about-hero">

                <img
                    src={banner}
                    alt="Bad Teddy streetwear"
                />

                <div className="about-hero-overlay"></div>


                <div className="about-hero-content">

                    <span>
                        THE BAD TEDDY STORY
                    </span>

                    <h1 className="text-col">

                        NOT MADE
                        <br />

                        <strong>
                            TO BLEND IN.
                        </strong>

                    </h1>

                    <p>

                        Born from denim, street culture,
                        individuality and something much more
                        personal.

                    </p>

                </div>


                <div className="hero-stamp">

                    <strong>
                        BT
                    </strong>

                    <span>
                        EST. 2023
                    </span>

                </div>

            </section>


            {/* =================================
                INTRO
            ================================= */}

            <section className="about-intro">

                <div className="about-intro-heading">

                    <span>
                        01 / ORIGIN
                    </span>

                    <h2 className="text-col">
                        Every brand has a story.
                        <br />
                        <strong>
                            Ours started with a name.
                        </strong>
                    </h2>

                </div>


                <div className="about-intro-text">

                    <p>

                        The name <strong>“Bad Teddy”</strong>
                        wasn't just chosen; it was crafted
                        from a deep love for style and a special
                        bond between two souls.

                    </p>

                    <p>

                        It all began with a passion for streetwear and denim.
                        Bold silhouettes and custom denim pieces held a special
                        place in the founder's vision.

                    </p>

                    <p>

                        Their bold designs, unique flair and
                        iconic status became an inspiration —
                        not just in fashion, but in life.

                    </p>

                </div>

            </section>


            {/* =================================
                NAME STORY
            ================================= */}

            <section className="name-story-section">

                <div className="name-story-visual">

                    <div className="name-word bad">

                        BAD

                    </div>

                    <div className="name-plus">

                        +

                    </div>

                    <div className="name-word teddy">

                        TEDDY

                    </div>

                    <div className="name-equals">

                        =

                    </div>

                    <div className="name-result">

                        BAD TEDDY

                    </div>

                </div>


                <div className="name-story-content">

                    <span>
                        02 / THE NAME
                    </span>

                    <h2>
                        Two meanings.
                        <br />
                        <strong>
                            One identity.
                        </strong>
                    </h2>

                    <p>

                        Then came the personal touch.
                        <strong> “Teddy”</strong> wasn't just
                        a nickname; it was a term of endearment
                        given by the founder's wife — a symbol
                        of love, warmth and everything that
                        made them feel at home.

                    </p>

                    <p>

                        Combining the edgy, modern vibe of
                        <strong> “Bad”</strong> with the
                        comforting, personal essence of
                        <strong> “Teddy”</strong>, the perfect
                        brand name was born.

                    </p>


                    <div className="name-quote">

                        <i className="fa-solid fa-quote-left"></i>

                        <span>
                            Rebellion meets comfort.
                        </span>

                    </div>

                </div>

            </section>


            {/* =================================
                2023 STORY
            ================================= */}

            <section className="origin-section">

                <div className="origin-heading">

                    <span>
                        03 / THE BEGINNING
                    </span>

                    <h2 className="text-col">

                        Born in
                        <strong>
                            2023.
                        </strong>

                    </h2>

                </div>


                <div className="origin-story">

                    <p>

                        In the bustling heart of the city,
                        where the streets never sleep and
                        fashion is a statement of identity,
                        a new force emerged in 2023:
                        <strong> Bad Teddy.</strong>

                    </p>

                    <p>

                        Born from a blend of rebellion and
                        comfort, Bad Teddy quickly became
                        a destination for oversized
                        t-shirts that effortlessly blend
                        streetwear with a touch of edginess.

                    </p>

                </div>

            </section>


            {/* =================================
                TIMELINE
            ================================= */}

            <section className="about-timeline">

                <div className="timeline-heading">

                    <span>
                        THE JOURNEY
                    </span>

                    <h2 className="text-col">
                        From an idea
                        <br />
                        <strong>to an identity.</strong>
                    </h2>

                </div>


                <div className="timeline-list">

                    {timeline.map((item, index) => (

                        <article
                            className="timeline-item"
                            key={item.year}
                        >

                            <div className="timeline-number">

                                {String(index + 1).padStart(2, "0")}

                            </div>


                            <div className="timeline-year">

                                {item.year}

                            </div>


                            <div className="timeline-content">

                                <h3>
                                    {item.title}
                                </h3>

                                <p>
                                    {item.text}
                                </p>

                            </div>

                        </article>

                    ))}

                </div>

            </section>


            {/* =================================
                BRAND VALUES
            ================================= */}

            <section className="brand-values">

                <div className="values-heading">

                    <span>
                        WHAT WE STAND FOR
                    </span>

                    <h2 className="text-col">
                        WEAR THE
                        <br />
                        <strong>ATTITUDE.</strong>
                    </h2>

                </div>


                <div className="values-grid">

                    <article className="value-card">

                        <div className="value-number">
                            01
                        </div>

                        <i className="fa-solid fa-bolt"></i>

                        <h3>
                            BOLD
                        </h3>

                        <p>
                            Designs that don't ask for
                            attention. They command it.
                        </p>

                    </article>


                    <article className="value-card">

                        <div className="value-number">
                            02
                        </div>

                        <i className="fa-solid fa-heart"></i>

                        <h3>
                            PERSONAL
                        </h3>

                        <p>
                            Fashion should feel connected
                            to who you actually are.
                        </p>

                    </article>


                    <article className="value-card">

                        <div className="value-number">
                            03
                        </div>

                        <i className="fa-solid fa-star"></i>

                        <h3>
                            ORIGINAL
                        </h3>

                        <p>
                            Your style doesn't need permission
                            from everyone else.
                        </p>

                    </article>

                </div>

            </section>


            {/* =================================
                FEATURED PRODUCTS
            ================================= */}

            <section className="about-products">

                <div className="about-products-heading">

                    <div>

                        <span>
                            WEAR THE STORY
                        </span>

                        <h2 className="text-col">
                            Pieces that carry
                            <strong> the attitude.</strong>
                        </h2>

                    </div>

                    <button
                        onClick={() => navigate("/shop")}
                    >
                        SHOP ALL
                        <i className="fa-solid fa-arrow-right"></i>
                    </button>

                </div>


                <div className="about-product-grid">

                    <button
                        className="about-product-card"
                        onClick={() => openProduct(1)}
                    >

                        <img
                            src={resolveProductImage("prod1.jpeg")}
                            alt="Oversized Tee"
                        />

                        <div>

                            <span>
                                BAD TEDDY
                            </span>

                            <h3>
                                Oversized Tee
                            </h3>

                        </div>

                    </button>


                    <button
                        className="about-product-card"
                        onClick={() => openProduct(2)}
                    >

                        <img
                            src={resolveProductImage("prod2.jpg")}
                            alt="Classic Hoodie"
                        />

                        <div>

                            <span>
                                BAD TEDDY
                            </span>

                            <h3>
                                Classic Hoodie
                            </h3>

                        </div>

                    </button>


                    <button
                        className="about-product-card"
                        onClick={() => openProduct(3)}
                    >

                        <img
                            src={resolveProductImage("prod3.jpg")}
                            alt="Cargo Pants"
                        />

                        <div>

                            <span>
                                BAD TEDDY
                            </span>

                            <h3>
                                Relaxed Cargo
                            </h3>

                        </div>

                    </button>

                </div>

            </section>


            {/* =================================
                FINAL CTA
            ================================= */}

            <section className="about-final">

                <div className="final-background"></div>

                <div className="final-content">

                    <span>
                        THIS IS BAD TEDDY
                    </span>

                    <h2 className="text-col">

                        DON'T FOLLOW
                        <br />

                        <strong>
                            THE CROWD.
                        </strong>

                    </h2>

                    <p>

                        Find your fit. Create your style.
                        Wear your attitude.

                    </p>


                    <div className="final-actions">

                        <button
                            onClick={() => navigate("/shop")}
                        >

                            SHOP THE COLLECTION

                            <i className="fa-solid fa-arrow-right"></i>

                        </button>


                        <button
                            className="secondary-final-btn"
                            onClick={() => navigate("/assistant")}
                        >

                            <i className="fa-solid fa-robot"></i>

                            ASK BAD TEDDY AI

                        </button>

                    </div>

                </div>

            </section>


            {/* =================================
                BOTTOM NAV
            ================================= */}

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


export default About;