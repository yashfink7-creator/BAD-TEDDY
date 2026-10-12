import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "@fortawesome/fontawesome-free/css/all.min.css";
import "../styles/SR.css";

import logo from "../assets/mylogo.png";
import resolveProductImage from "../utils/imageResolver";

function SR() {
  const navigate = useNavigate();

  const [measurements, setMeasurements] = useState({
    height: "",
    weight: "",
    chest: "",
    waist: "",
    hips: "",
  });

  const [fit, setFit] = useState("regular");
  const [result, setResult] = useState(null);
  const [loadingSize, setLoadingSize] = useState(false);

  const [recommendedProducts, setRecommendedProducts] = useState([
    {
      id: 1,
      image: resolveProductImage("prod1.jpeg"),
      name: "Oversized Tee",
      category: "T-SHIRTS",
      price: 899,
      badge: "TOP PICK"
    },
    {
      id: 2,
      image: resolveProductImage("prod2.jpg"),
      name: "Black Hoodie",
      category: "HOODIES",
      price: 1699,
      badge: "POPULAR"
    },
    {
      id: 3,
      image: resolveProductImage("prod3.jpg"),
      name: "Cargo Pants",
      category: "CARGO PANTS",
      price: 1499,
      badge: "NEW"
    }
  ]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/recommendations?limit=3");
        const data = await res.json();
        if (data.success && Array.isArray(data.ai_recommendations) && data.ai_recommendations.length > 0) {
          const mapped = data.ai_recommendations.map(p => ({
            ...p,
            image: resolveProductImage(p.image),
            category: (p.category || "Streetwear").toUpperCase()
          }));
          setRecommendedProducts(mapped);
        }
      } catch (err) {
        console.error("AI recommendations fetch error:", err);
      }
    };
    fetchRecommendations();
  }, []);

  const handleChange = (e) => {
    setMeasurements({
      ...measurements,
      [e.target.name]: e.target.value,
    });

    // Remove previous result when user changes measurements
    if (result) {
      setResult(null);
    }
  };

  const calculateSize = async () => {
    const height = Number(measurements.height);
    const weight = Number(measurements.weight);
    const chest = Number(measurements.chest);
    const waist = Number(measurements.waist);
    const hips = Number(measurements.hips);

    if (
      !height ||
      !weight ||
      !chest ||
      !waist ||
      !hips ||
      height <= 0 ||
      weight <= 0 ||
      chest <= 0 ||
      waist <= 0 ||
      hips <= 0
    ) {
      alert("Please enter all your measurements.");
      return;
    }

    setLoadingSize(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/predict-size", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          height,
          weight,
          chest,
          waist,
          hips,
          fit
        })
      });

      const data = await response.json();

      if (data.success && data.recommended_size) {
        const confLabel = data.confidence_level || (data.confidence_score >= 0.85 ? "High Confidence" : "Good Match");

        setResult({
          size: data.recommended_size,
          confidence: `${confLabel} (${data.confidence})`,
          fitNote: data.fit_note,
          probabilities: data.class_probabilities
        });

        localStorage.setItem(
          "badTeddySizeRecommendation",
          JSON.stringify({
            measurements,
            fit,
            size: data.recommended_size,
            confidence: data.confidence
          })
        );
        setLoadingSize(false);
        return;
      }
    } catch (err) {
      console.error("AI Size Model API error, falling back:", err);
    }

    /* Fallback calculation */
    let size = "M";
    const average = (chest + waist + hips) / 3;

    if (fit === "slim") {
      if (average < 88 && weight < 60) {
        size = "S";
      } else if (average < 98 && weight < 75) {
        size = "M";
      } else if (average < 108 && weight < 90) {
        size = "L";
      } else {
        size = "XL";
      }
    } else if (fit === "oversized") {
      if (average < 88 && weight < 60) {
        size = "M";
      } else if (average < 98 && weight < 75) {
        size = "L";
      } else if (average < 108 && weight < 90) {
        size = "XL";
      } else {
        size = "XXL";
      }
    } else {
      if (average < 88 && weight < 60) {
        size = "S";
      } else if (average < 98 && weight < 75) {
        size = "M";
      } else if (average < 108 && weight < 90) {
        size = "L";
      } else if (average < 118 && weight < 105) {
        size = "XL";
      } else {
        size = "XXL";
      }
    }

    setResult({
      size,
      confidence: "Good Match",
    });

    localStorage.setItem(
      "badTeddySizeRecommendation",
      JSON.stringify({
        measurements,
        fit,
        size,
      })
    );
    setLoadingSize(false);
  };

  const resetMeasurements = () => {
    setMeasurements({
      height: "",
      weight: "",
      chest: "",
      waist: "",
      hips: "",
    });

    setFit("regular");
    setResult(null);
  };

  const location = useLocation();

  return (
    <div className="sr-page">

      {/* ================= HEADER ================= */}

      <header className="sr-header">

        <div
          className="sr-logo"
          onClick={() => navigate("/")}
        >
          <img src={logo} alt="Bad Teddy" />
        </div>

        <div className="sr-header-right">

          <button
            className="sr-icon-btn"
            onClick={() => navigate("/profile")}
            aria-label="Profile"
          >
            <i className="fa-regular fa-user"></i>
          </button>

        </div>

      </header>


      {/* ================= HERO ================= */}

      <section className="sr-hero">

        <div className="sr-eyebrow">
          <i className="fa-solid fa-wand-magic-sparkles"></i>
          BAD TEDDY AI
        </div>

        <h1>Find Your Perfect Size</h1>

        <p>
          Tell us about your fit and we'll recommend the size
          that works best for you.
        </p>

      </section>


      {/* ================= MAIN CARD ================= */}

      <main className="sr-main">

        <section className="sr-card">

          {/* Card Header */}

          <div className="sr-card-header">

            <div className="sr-card-icon">
              <i className="fa-solid fa-ruler-combined"></i>
            </div>

            <div>
              <span>YOUR SIZE</span>
              <h2>Tell us about your fit</h2>
            </div>

          </div>


          <p className="sr-card-description">
            Enter your measurements for a more accurate
            recommendation.
          </p>


          {/* ================= MEASUREMENTS ================= */}

          <div className="sr-measurements">

            {/* Height */}

            <div className="sr-input-group">

              <label>
                <i className="fa-solid fa-arrows-up-down"></i>
                Height
              </label>

              <div className="sr-input-wrapper">

                <input
                  type="number"
                  name="height"
                  value={measurements.height}
                  onChange={handleChange}
                  placeholder="e.g. 175"
                  min="1"
                />

                <span>cm</span>

              </div>

            </div>


            {/* Weight */}

            <div className="sr-input-group">

              <label>
                <i className="fa-solid fa-weight-scale"></i>
                Weight
              </label>

              <div className="sr-input-wrapper">

                <input
                  type="number"
                  name="weight"
                  value={measurements.weight}
                  onChange={handleChange}
                  placeholder="e.g. 65"
                  min="1"
                />

                <span>kg</span>

              </div>

            </div>


            {/* Chest */}

            <div className="sr-input-group">

              <label>
                <i className="fa-solid fa-person"></i>
                Chest
              </label>

              <div className="sr-input-wrapper">

                <input
                  type="number"
                  name="chest"
                  value={measurements.chest}
                  onChange={handleChange}
                  placeholder="e.g. 92"
                  min="1"
                />

                <span>cm</span>

              </div>

            </div>


            {/* Waist */}

            <div className="sr-input-group">

              <label>
                <i className="fa-solid fa-ruler-horizontal"></i>
                Waist
              </label>

              <div className="sr-input-wrapper">

                <input
                  type="number"
                  name="waist"
                  value={measurements.waist}
                  onChange={handleChange}
                  placeholder="e.g. 80"
                  min="1"
                />

                <span>cm</span>

              </div>

            </div>


            {/* Hips */}

            <div className="sr-input-group">

              <label>
                <i className="fa-solid fa-person"></i>
                Hips
              </label>

              <div className="sr-input-wrapper">

                <input
                  type="number"
                  name="hips"
                  value={measurements.hips}
                  onChange={handleChange}
                  placeholder="e.g. 95"
                  min="1"
                />

                <span>cm</span>

              </div>

            </div>

          </div>


          {/* ================= FIT ================= */}

          <div className="sr-fit-section">

            <div className="sr-section-title">

              <span>HOW DO YOU LIKE YOUR CLOTHES?</span>

              <small>
                Choose your preferred fit
              </small>

            </div>


            <div className="sr-fit-options">

              {/* Slim */}

              <button
                className={`sr-fit-option ${
                  fit === "slim" ? "selected" : ""
                }`}
                onClick={() => {
                  setFit("slim");
                  setResult(null);
                }}
              >

                <i className="fa-solid fa-person"></i>

                <strong>Slim</strong>

                <span>
                  Closer to the body
                </span>

              </button>


              {/* Regular */}

              <button
                className={`sr-fit-option ${
                  fit === "regular" ? "selected" : ""
                }`}
                onClick={() => {
                  setFit("regular");
                  setResult(null);
                }}
              >

                <i className="fa-solid fa-user"></i>

                <strong>Regular</strong>

                <span>
                  Comfortable everyday fit
                </span>

              </button>


              {/* Oversized */}

              <button
                className={`sr-fit-option ${
                  fit === "oversized" ? "selected" : ""
                }`}
                onClick={() => {
                  setFit("oversized");
                  setResult(null);
                }}
              >

                <i className="fa-solid fa-shirt"></i>

                <strong>Oversized</strong>

                <span>
                  Relaxed streetwear fit
                </span>

              </button>

            </div>

          </div>


          {/* ================= ACTIONS ================= */}

          <div className="sr-actions">

            <button
              className="sr-reset-btn"
              onClick={resetMeasurements}
            >
              Reset
            </button>

            <button
              className="sr-find-btn"
              onClick={calculateSize}
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              Find My Size
            </button>

          </div>


          {/* ================= RESULT ================= */}

          {result && (

            <section className="sr-result">

              <div className="sr-result-left">

                <div className="sr-result-icon">
                  <i className="fa-solid fa-check"></i>
                </div>

                <div>

                  <span>Your recommended size</span>

                  <h3>
                    Size {result.size}
                  </h3>

                  <p>
                    {result.confidence}
                  </p>

                </div>

              </div>

              <div className="sr-result-badge">
                <i className="fa-solid fa-circle-check"></i>
                Best Match
              </div>

            </section>

          )}

        </section>


        {/* ================= AI HELP ================= */}

        <section className="sr-ai-help">

          <div className="sr-ai-icon">
            <i className="fa-solid fa-robot"></i>
          </div>

          <div className="sr-ai-content">

            <span>BAD TEDDY AI</span>

            <h2>
              Still not sure about your measurements?
            </h2>

            <p>
              Ask our fashion assistant about measuring your
              chest, waist, hips, height or choosing your
              preferred fit.
            </p>

          </div>

          <button
            className="sr-ai-btn"
            onClick={() => navigate("/assistant")}
          >
            Ask AI
            <i className="fa-solid fa-arrow-right"></i>
          </button>

        </section>


        {/* ================= RECOMMENDED ================= */}

        <section className="sr-recommended">

          <div className="sr-section-heading">

            <div>
              <span>COMPLETE YOUR LOOK</span>
              <h2>Recommended For You</h2>
            </div>

            <button
              onClick={() => navigate("/shop")}
            >
              View All
              <i className="fa-solid fa-arrow-right"></i>
            </button>

          </div>


          <div className="sr-product-grid">
            {recommendedProducts.map((p) => (
              <div
                key={p.id}
                className="sr-product-card"
                onClick={() => navigate(`/product/${p.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="sr-product-image">
                  <img src={p.image} alt={p.name} />
                  <span>{p.badge || "AI PICK"}</span>
                </div>
                <div className="sr-product-info">
                  <p>{p.category || "STREETWEAR"}</p>
                  <h3>{p.name}</h3>
                  <strong>₹{Number(p.price).toLocaleString("en-IN")}</strong>
                </div>
              </div>
            ))}
          </div>

        </section>

      </main>


      {/* ================= BOTTOM NAV ================= */}

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

export default SR;