import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

import "../styles/profile.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import logo from "../assets/mylogo.png";
import resolveProductImage from "../utils/imageResolver";

function Profile() {

  const navigate = useNavigate();
  const location = useLocation();

  const loggedInUser = (() => {
    try {
      const savedUser = localStorage.getItem("badTeddyUser");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  })();

  /* =====================================
     IMAGE HELPER
  ===================================== */
  const getProductImage = (img) => {
    return resolveProductImage(img);
  };

  /* =========================
     PROFILE DATA
  ========================= */
  const defaultProfile = {
    name: loggedInUser?.name || "Bad Teddy Member",
    email: loggedInUser?.email || "member@bad-teddy.com",
    phone: loggedInUser?.phone || "+91 XXXXX XXXXX",
    points: loggedInUser?.points || 250
  };

  const [profile, setProfile] = useState(defaultProfile);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(defaultProfile);
  const [activeSetting, setActiveSetting] = useState(null);

  /* =========================
     STATS STATE
  ========================= */
  const [orderCount, setOrderCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  /* =========================
     WISHLIST STATE & SYNC
  ========================= */
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("badTeddyWishlist"));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const toggleWishlist = async (product) => {
    const exists = wishlist.some(item =>
      typeof item === "string" ? item === product.name : item.id === product.id || item.name === product.name
    );

    let updated;
    if (exists) {
      updated = wishlist.filter(item =>
        typeof item === "string" ? item !== product.name : item.id !== product.id && item.name !== product.name
      );
      if (loggedInUser?.id && product.id) {
        try {
          await fetch(`http://localhost/BAD%20TEDDY/backend/api/wishlist.php?user_id=${loggedInUser.id}&product_id=${product.id}`, { method: "DELETE" });
        } catch (err) {
          console.error("Wishlist API delete error:", err);
        }
      }
    } else {
      const newItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image
      };
      updated = [...wishlist, newItem];
      if (loggedInUser?.id && product.id) {
        try {
          await fetch("http://localhost/BAD%20TEDDY/backend/api/wishlist.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: loggedInUser.id, product_id: product.id })
          });
        } catch (err) {
          console.error("Wishlist API add error:", err);
        }
      }
    }

    setWishlist(updated);
    setWishlistCount(updated.length);
    localStorage.setItem("badTeddyWishlist", JSON.stringify(updated));
    window.dispatchEvent(new Event("badTeddyWishlistUpdated"));
  };

  /* =========================
     NOTIFICATIONS & PREFERENCES
  ========================= */
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("badTeddyNotifications");
      return saved ? JSON.parse(saved) : { orders: true, offers: true, drops: true };
    } catch {
      return { orders: true, offers: true, drops: true };
    }
  });

  const toggleNotification = (type) => {
    setNotifications((current) => {
      const updated = {
        ...current,
        [type]: !current[type]
      };
      localStorage.setItem("badTeddyNotifications", JSON.stringify(updated));
      return updated;
    });
  };

  const [keepSignedIn, setKeepSignedIn] = useState(() => {
    return localStorage.getItem("badTeddyKeepSignedIn") === "true";
  });

  const toggleKeepSignedIn = () => {
    setKeepSignedIn((current) => {
      const updated = !current;
      localStorage.setItem("badTeddyKeepSignedIn", String(updated));
      return updated;
    });
  };

  /* =========================
     RECOMMENDED PRODUCTS
  ========================= */
  const defaultRecommended = [
    { id: 1, image: resolveProductImage("prod1.jpeg"), name: "Oversized Signature Tee", price: "₹999" },
    { id: 2, image: resolveProductImage("prod2.jpg"), name: "Premium Black Hoodie", price: "₹1,799" },
    { id: 3, image: resolveProductImage("prod3.jpg"), name: "Relaxed Cargo Pants", price: "₹1,599" },
    { id: 4, image: resolveProductImage("prod4.jpg"), name: "Street Graphic Tee", price: "₹999" }
  ];

  const [recommendedProducts, setRecommendedProducts] = useState(defaultRecommended);

  useEffect(() => {
    const fetchRecProducts = async () => {
      try {
        const res = await fetch("http://localhost/BAD%20TEDDY/backend/api/products.php");
        const data = await res.json();
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          const mapped = data.products.slice(0, 4).map(p => ({
            id: Number(p.id),
            name: p.name,
            price: `₹${Number(String(p.price).replace(/[₹,]/g, "")).toLocaleString("en-IN")}`,
            image: getProductImage(p.image)
          }));
          setRecommendedProducts(mapped);
        }
      } catch (err) {
        console.error("Recommended products error:", err);
      }
    };
    fetchRecProducts();
  }, []);

  /* =========================
     LOAD PROFILE & DASHBOARD METRICS
  ========================= */
  useEffect(() => {
    const loadProfileData = async () => {
      // 1. Initial local wishlist count
      try {
        const savedWishlist = JSON.parse(localStorage.getItem("badTeddyWishlist")) || [];
        setWishlistCount(savedWishlist.length);
        setWishlist(savedWishlist);
      } catch {
        setWishlistCount(0);
      }

      // 2. Initial local orders count
      try {
        const savedOrders = JSON.parse(localStorage.getItem("badTeddyOrders")) || [];
        setOrderCount(savedOrders.length);
      } catch {
        setOrderCount(0);
      }

      if (!loggedInUser?.id) {
        setLoadingProfile(false);
        return;
      }

      // Fetch Live Profile from PHP API
      try {
        const response = await fetch(
          `http://localhost/BAD%20TEDDY/backend/api/profile.php?id=${loggedInUser.id}`
        );
        const data = await response.json();
        if (data.success && data.user) {
          const merged = {
            ...data.user,
            points: data.user.points || 250
          };
          setProfile(merged);
          setEditData(merged);
        }
      } catch (error) {
        console.error("Unable to fetch profile from API:", error);
      }

      // Fetch Live Order Count
      try {
        const orderRes = await fetch(
          `http://localhost/BAD%20TEDDY/backend/api/orders.php?user_id=${loggedInUser.id}`
        );
        const orderData = await orderRes.json();
        if (orderData.success && Array.isArray(orderData.orders)) {
          setOrderCount(orderData.orders.length);
          localStorage.setItem("badTeddyOrders", JSON.stringify(orderData.orders));
        }
      } catch (orderErr) {
        console.error("Order count fetch error:", orderErr);
      }

      // Fetch Live Wishlist Count
      try {
        const wishRes = await fetch(
          `http://localhost/BAD%20TEDDY/backend/api/wishlist.php?user_id=${loggedInUser.id}`
        );
        const wishData = await wishRes.json();
        if (wishData.success && Array.isArray(wishData.items)) {
          setWishlistCount(wishData.items.length);
          setWishlist(wishData.items);
          localStorage.setItem("badTeddyWishlist", JSON.stringify(wishData.items));
        }
      } catch (wishErr) {
        console.error("Wishlist count fetch error:", wishErr);
      }

      setLoadingProfile(false);
    };

    loadProfileData();
  }, []);

  /* =========================
     EDIT PROFILE HANDLERS
  ========================= */
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: value
    });
  };

  const saveProfile = async () => {
    if (!loggedInUser || !loggedInUser.id) {
      alert("Please login again to update profile.");
      return;
    }

    if (!editData.name.trim() || !editData.email.trim()) {
      alert("Name and email are required.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost/BAD%20TEDDY/backend/api/profile.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: loggedInUser.id,
            name: editData.name.trim(),
            email: editData.email.trim(),
            phone: editData.phone.trim()
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        const updatedUser = {
          ...loggedInUser,
          ...data.user
        };
        setProfile(updatedUser);
        localStorage.setItem("badTeddyUser", JSON.stringify(updatedUser));
        setEditMode(false);
        alert("Profile updated successfully!");
      } else {
        alert(data.message || "Profile update failed.");
      }
    } catch (error) {
      console.error("Profile save error:", error);
      alert("Unable to connect to the server. Please check your connection.");
    }
  };

  const cancelEdit = () => {
    setEditData(profile);
    setEditMode(false);
  };

  /* =========================
     LOGOUT HANDLER
  ========================= */
  const handleLogout = () => {
    localStorage.removeItem("badTeddyUser");
    navigate("/login");
  };

  return (
    <div className="profile-page">

      {/* =====================================
          TOP HEADER
      ===================================== */}
      <header className="profile-header">
        <div className="profile-header-logo">
          <img src={logo} alt="Bad Teddy" />
        </div>

        <div className="profile-header-title">
          <span>MY ACCOUNT</span>
        </div>

        <button
          className="profile-settings-btn"
          onClick={() => {
            document
              .getElementById("settings-section")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          aria-label="Account Settings"
        >
          <i className="fa-solid fa-gear"></i>
        </button>
      </header>

      {/* =====================================
          PROFILE HERO
      ===================================== */}
      <section className="profile-hero">
        <div className="profile-avatar">
          <span>
            {profile.name ? profile.name.charAt(0).toUpperCase() : "B"}
          </span>

          <button
            className="avatar-edit-btn"
            onClick={() => setEditMode(true)}
            aria-label="Edit Profile"
          >
            <i className="fa-solid fa-camera"></i>
          </button>
        </div>

        <div className="profile-hero-info">
          <span className="member-label">
            BAD TEDDY MEMBER
          </span>

          <h1>{profile.name}</h1>

          <p>{profile.email}</p>

          <div className="member-status">
            <i className="fa-solid fa-crown"></i>
            <span>Streetwear Insider</span>
          </div>
        </div>

        <button
          className="edit-profile-btn"
          onClick={() => setEditMode(true)}
        >
          <i className="fa-solid fa-pen"></i>
          Edit Profile
        </button>
      </section>

      {/* =====================================
          MEMBER STATS
      ===================================== */}
      <section className="profile-stats">
        <div
          className="profile-stat"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/myorders")}
        >
          <i className="fa-solid fa-bag-shopping"></i>
          <div>
            <strong>{orderCount}</strong>
            <span>{orderCount === 1 ? "Order" : "Orders"}</span>
          </div>
        </div>

        <div
          className="profile-stat"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/wishlist")}
        >
          <i className="fa-regular fa-heart"></i>
          <div>
            <strong>{wishlistCount}</strong>
            <span>Wishlist</span>
          </div>
        </div>

        <div className="profile-stat">
          <i className="fa-solid fa-ticket"></i>
          <div>
            <strong>3</strong>
            <span>Coupons</span>
          </div>
        </div>

        <div className="profile-stat">
          <i className="fa-solid fa-coins"></i>
          <div>
            <strong>{profile.points || 250}</strong>
            <span>Points</span>
          </div>
        </div>
      </section>

      {/* =====================================
          EDIT PROFILE
      ===================================== */}
      {editMode && (
        <section className="edit-profile-section">
          <div className="section-title">
            <div>
              <span>PERSONAL INFORMATION</span>
              <h2>Edit Profile</h2>
            </div>
          </div>

          <div className="profile-form">
            <div className="profile-input">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={editData.name}
                onChange={handleEditChange}
                placeholder="Enter your full name"
              />
            </div>

            <div className="profile-input">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={editData.email}
                onChange={handleEditChange}
                placeholder="Enter your email address"
              />
            </div>

            <div className="profile-input">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={editData.phone}
                onChange={handleEditChange}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div className="edit-actions">
            <button
              className="cancel-btn"
              onClick={cancelEdit}
            >
              Cancel
            </button>

            <button
              type="button"
              className="save-profile-btn"
              onClick={saveProfile}
            >
              Save Changes
            </button>
          </div>
        </section>
      )}

      {/* =====================================
          QUICK ACTIONS
      ===================================== */}
      <section className="profile-section">
        <div className="section-title">
          <span>ACCOUNT</span>
          <h2>Quick Access</h2>
        </div>

        <div className="account-grid">
          <button
            className="account-card"
            onClick={() => navigate("/myorders")}
          >
            <div className="account-card-icon">
              <i className="fa-solid fa-box"></i>
            </div>

            <div>
              <h3>My Orders</h3>
              <p>Track and manage your orders</p>
            </div>

            <i className="fa-solid fa-chevron-right"></i>
          </button>

          <button
            className="account-card"
            onClick={() => navigate("/wishlist")}
          >
            <div className="account-card-icon">
              <i className="fa-regular fa-heart"></i>
            </div>

            <div>
              <h3>Wishlist</h3>
              <p>Your saved streetwear pieces</p>
            </div>

            <i className="fa-solid fa-chevron-right"></i>
          </button>

          <button
            className="account-card"
            onClick={() => navigate("/savedadd")}
          >
            <div className="account-card-icon">
              <i className="fa-solid fa-location-dot"></i>
            </div>

            <div>
              <h3>Saved Address</h3>
              <p>Manage your delivery address</p>
            </div>

            <i className="fa-solid fa-chevron-right"></i>
          </button>

          <button
            className="account-card"
            onClick={() => navigate("/paymethod")}
          >
            <div className="account-card-icon">
              <i className="fa-regular fa-credit-card"></i>
            </div>

            <div>
              <h3>Payment Methods</h3>
              <p>Manage your payment options</p>
            </div>

            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </section>

      {/* =====================================
          BAD TEDDY REWARDS
      ===================================== */}
      <section className="rewards-card">
        <div className="rewards-left">
          <div className="rewards-icon">
            <i className="fa-solid fa-crown"></i>
          </div>

          <div>
            <span className="rewards-label">
              BAD TEDDY REWARDS
            </span>

            <h2>Streetwear Insider</h2>

            <p>
              Earn points every time you shop.
            </p>
          </div>
        </div>

        <div className="rewards-points">
          <strong>{profile.points || 250}</strong>
          <span>POINTS</span>
        </div>
      </section>

      {/* =====================================
          REWARD PROGRESS
      ===================================== */}
      <section className="reward-progress">
        <div className="progress-header">
          <span>Next reward</span>
          <strong>{profile.points || 250} / 500 points</strong>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, (((profile.points || 250) / 500) * 100))}%` }}
          ></div>
        </div>

        <p>
          Earn {Math.max(0, 500 - (profile.points || 250))} more points to unlock your next reward.
        </p>
      </section>

      {/* =====================================
          OFFERS
      ===================================== */}
      <section className="profile-section">
        <div className="section-title">
          <span>EXCLUSIVE</span>
          <h2>Offers & Benefits</h2>
        </div>

        <div className="benefits-grid">
          <div className="benefit-card">
            <i className="fa-solid fa-tag"></i>
            <div>
              <h3>Exclusive Coupons</h3>
              <p>Special discounts reserved for members.</p>
            </div>
          </div>

          <div className="benefit-card">
            <i className="fa-solid fa-truck-fast"></i>
            <div>
              <h3>Fast Delivery</h3>
              <p>Track your orders from dispatch to doorstep.</p>
            </div>
          </div>

          <div className="benefit-card">
            <i className="fa-solid fa-star"></i>
            <div>
              <h3>Member Access</h3>
              <p>Get early access to new drops.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          RECOMMENDED PRODUCTS
      ===================================== */}
      <section className="profile-section">
        <div className="section-title-row">
          <div className="section-title">
            <span>JUST FOR YOU</span>
            <h2>Recommended</h2>
          </div>

          <button
            className="view-all-profile"
            onClick={() => navigate("/shop")}
          >
            View All
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        <div className="recommended-row">
          {recommendedProducts.map((product) => (
            <div
              key={product.id}
              className="recommended-card"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <button
                type="button"
                className={`recommended-heart ${
                  wishlist.some((item) =>
                    typeof item === "string" ? item === product.name : item.id === product.id || item.name === product.name
                  )
                    ? "wish-active"
                    : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleWishlist(product);
                }}
                aria-label="Toggle wishlist"
              >
                <i
                  className={
                    wishlist.some((item) =>
                      typeof item === "string" ? item === product.name : item.id === product.id || item.name === product.name
                    )
                      ? "fa-solid fa-heart"
                      : "fa-regular fa-heart"
                  }
                ></i>
              </button>

              <img
                src={product.image}
                alt={product.name}
              />

              <div className="recommended-info">
                <h3>{product.name}</h3>
                <p>{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================
          SETTINGS
      ===================================== */}
      <section
        className="profile-section"
        id="settings-section"
      >
        <div className="section-title">
          <span>PREFERENCES</span>
          <h2>Settings</h2>
        </div>

        <div className="settings-list">
          <button
            className="settings-item"
            onClick={() => setActiveSetting("notifications")}
          >
            <div className="settings-icon">
              <i className="fa-solid fa-bell"></i>
            </div>

            <div>
              <h3>Notifications</h3>
              <p>Manage order and offer notifications</p>
            </div>

            <i className="fa-solid fa-chevron-right"></i>
          </button>

          <button
            className="settings-item"
            onClick={() => setActiveSetting("privacy")}
          >
            <div className="settings-icon">
              <i className="fa-solid fa-shield-halved"></i>
            </div>

            <div>
              <h3>Privacy & Security</h3>
              <p>Manage your account security</p>
            </div>

            <i className="fa-solid fa-chevron-right"></i>
          </button>

          <button
            className="settings-item"
            onClick={() => setActiveSetting("help")}
          >
            <div className="settings-icon">
              <i className="fa-solid fa-circle-question"></i>
            </div>

            <div>
              <h3>Help & Support</h3>
              <p>Need help with your Bad Teddy account?</p>
            </div>

            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </section>

      {/* =====================================
          SETTINGS MODAL
      ===================================== */}
      {activeSetting && (
        <div
          className="settings-overlay"
          onClick={() => setActiveSetting(null)}
        >
          <div
            className="settings-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="settings-close"
              onClick={() => setActiveSetting(null)}
              aria-label="Close Settings"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            {/* NOTIFICATIONS */}
            {activeSetting === "notifications" && (
              <div className="settings-modal-content">
                <span className="modal-eyebrow">
                  PREFERENCES
                </span>

                <h2>Notifications</h2>

                <p className="modal-description">
                  Choose what you want Bad Teddy to notify you about.
                </p>

                <div className="setting-option">
                  <div className="setting-option-icon">
                    <i className="fa-solid fa-box"></i>
                  </div>

                  <div className="setting-option-info">
                    <strong>Order Updates</strong>
                    <span>Get updates about your orders.</span>
                  </div>

                  <button
                    className={`toggle-switch ${notifications.orders ? "on" : ""}`}
                    onClick={() => toggleNotification("orders")}
                    aria-label="Toggle order notifications"
                  >
                    <span></span>
                  </button>
                </div>

                <div className="setting-option">
                  <div className="setting-option-icon">
                    <i className="fa-solid fa-tag"></i>
                  </div>

                  <div className="setting-option-info">
                    <strong>Offers & Discounts</strong>
                    <span>Receive exclusive offers and coupons.</span>
                  </div>

                  <button
                    className={`toggle-switch ${notifications.offers ? "on" : ""}`}
                    onClick={() => toggleNotification("offers")}
                    aria-label="Toggle offer notifications"
                  >
                    <span></span>
                  </button>
                </div>

                <div className="setting-option">
                  <div className="setting-option-icon">
                    <i className="fa-solid fa-shirt"></i>
                  </div>

                  <div className="setting-option-info">
                    <strong>New Drops</strong>
                    <span>Be the first to know about new collections.</span>
                  </div>

                  <button
                    className={`toggle-switch ${notifications.drops ? "on" : ""}`}
                    onClick={() => toggleNotification("drops")}
                    aria-label="Toggle new drop notifications"
                  >
                    <span></span>
                  </button>
                </div>
              </div>
            )}

            {/* PRIVACY */}
            {activeSetting === "privacy" && (
              <div className="settings-modal-content">
                <span className="modal-eyebrow">
                  ACCOUNT SECURITY
                </span>

                <h2>Privacy & Security</h2>

                <p className="modal-description">
                  Manage how your Bad Teddy account and browsing preferences are handled.
                </p>

                <div className="security-status">
                  <div className="security-status-icon">
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>

                  <div>
                    <strong>Account Protected</strong>
                    <span>Your account preferences are stored securely in this browser.</span>
                  </div>
                </div>

                <div className="setting-option">
                  <div className="setting-option-icon">
                    <i className="fa-solid fa-right-to-bracket"></i>
                  </div>

                  <div className="setting-option-info">
                    <strong>Keep Me Signed In</strong>
                    <span>Remember this device for your next visit.</span>
                  </div>

                  <button
                    className={`toggle-switch ${keepSignedIn ? "on" : ""}`}
                    onClick={toggleKeepSignedIn}
                    aria-label="Toggle keep signed in"
                  >
                    <span></span>
                  </button>
                </div>

                <button
                  className="clear-data-btn"
                  onClick={() => {
                    localStorage.removeItem("badTeddyRecentlyViewed");
                    alert("Browsing data has been cleared.");
                  }}
                >
                  <i className="fa-solid fa-trash"></i>
                  Clear Browsing Data
                </button>
              </div>
            )}

            {/* HELP */}
            {activeSetting === "help" && (
              <div className="settings-modal-content">
                <span className="modal-eyebrow">
                  BAD TEDDY SUPPORT
                </span>

                <h2>How can we help?</h2>

                <p className="modal-description">
                  Find quick answers about your Bad Teddy shopping experience.
                </p>

                <div className="help-list">
                  <div className="help-item">
                    <i className="fa-solid fa-box"></i>
                    <div>
                      <strong>Track an Order</strong>
                      <span>Open My Orders from your profile to check your order status.</span>
                    </div>
                  </div>

                  <div className="help-item">
                    <i className="fa-solid fa-rotate-left"></i>
                    <div>
                      <strong>Returns & Refunds</strong>
                      <span>Returns can be requested for eligible purchases.</span>
                    </div>
                  </div>

                  <div className="help-item">
                    <i className="fa-solid fa-credit-card"></i>
                    <div>
                      <strong>Payment Help</strong>
                      <span>Manage your saved payment methods from your account.</span>
                    </div>
                  </div>

                  <div className="help-item">
                    <i className="fa-solid fa-truck"></i>
                    <div>
                      <strong>Delivery</strong>
                      <span>Your order status can be checked from My Orders.</span>
                    </div>
                  </div>
                </div>

                <button
                  className="support-btn"
                  onClick={() => {
                    window.location.href = "mailto:support@bad-teddy.com";
                  }}
                >
                  <i className="fa-solid fa-headset"></i>
                  CONTACT SUPPORT
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================
          LOGOUT
      ===================================== */}
      <button
        className="logout-btn"
        onClick={handleLogout}
      >
        <i className="fa-solid fa-right-from-bracket"></i>
        Log Out
      </button>

      {/* =====================================
          BOTTOM NAVIGATION
      ===================================== */}
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

export default Profile;