import React, { useState, useMemo, useEffect, useRef } from "react";
import AdminSidebar from "../components/AdminSidebar";
import myLogo from "../assets/mylogo.png";
import "../styles/admin-product.css";
import { useNavigate } from "react-router-dom";
import resolveProductImage from "../utils/imageResolver";

function AdminProducts() {
    const navigate = useNavigate();
    const [theme, setTheme] = useState(
    localStorage.getItem("adminTheme") || "dark"
);

const [showNotifications, setShowNotifications] = useState(false);

const [searchTerm, setSearchTerm] = useState("");

const [categoryFilter, setCategoryFilter] = useState("All Categories");

const [statusFilter, setStatusFilter] = useState("All Status");

const [sortOption, setSortOption] = useState("Newest");

const [editingProduct, setEditingProduct] = useState(null);

const [showEditModal, setShowEditModal] = useState(false);

const [showAddModal, setShowAddModal] = useState(false);

const [showAIReport, setShowAIReport] = useState(false);

/* =========================================
   AI REPORT — CSV GENERATOR
========================================= */

const generateAIReport = () => {

    const headers = [
        "Product ID",
        "Product Name",
        "Category",
        "Price",
        "Stock",
        "Status"
    ];

    const rows = products.map((product) => [
        product.id,
        product.name,
        product.category,
        product.price,
        product.stock,
        product.status
    ]);

    const csvContent = [
        headers,
        ...rows
    ]
        .map((row) =>
            row
                .map((value) =>
                    `"${String(value).replace(/"/g, '""')}"`
                )
                .join(",")
        )
        .join("\n");


    const blob = new Blob(
        [csvContent],
        {
            type: "text/csv;charset=utf-8;"
        }
    );


    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "bad-teddy-ai-product-report.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};


const [newProduct, setNewProduct] = useState({
    name: "",
    category: "T-Shirts",
    price: "",
    stock: "",
    status: "Active",
    image: "prod1.jpeg"
});

// Gallery slots configuration (4 standard angles)
const GALLERY_SLOTS = [
    { key: "front", label: "Front View", subtitle: "Main Primary View", icon: "fa-shirt", isPrimary: true },
    { key: "back", label: "Back View", subtitle: "Reverse Street Angle", icon: "fa-arrows-rotate", isPrimary: false },
    { key: "sitting", label: "Sitting Pose", subtitle: "Editorial Lifestyle Look", icon: "fa-chair", isPrimary: false },
    { key: "standing", label: "Standing Pose", subtitle: "Full Silhouette Fit", icon: "fa-person", isPrimary: false }
];

const [newProductGallery, setNewProductGallery] = useState({
    front: "",
    back: "",
    sitting: "",
    standing: ""
});

const [editProductGallery, setEditProductGallery] = useState({
    front: "",
    back: "",
    sitting: "",
    standing: ""
});

const [uploadingSlotState, setUploadingSlotState] = useState({ isEditing: false, slot: null });
const slotFileInputRef = useRef(null);
const [activeUploadContext, setActiveUploadContext] = useState({ isEditing: false, slot: "front" });

const triggerSlotUpload = (slotKey, isEditing) => {
    setActiveUploadContext({ isEditing, slot: slotKey });
    if (slotFileInputRef.current) {
        slotFileInputRef.current.value = "";
        slotFileInputRef.current.click();
    }
};

const handleSlotFileUpload = async (file, slotKey, isEditing = false) => {
    if (!file) return;

    // Validate MIME type
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validMimes.includes(file.type)) {
        alert("Invalid file type (" + file.type + "). Please upload JPG, PNG, WEBP, or GIF image files only.");
        return;
    }

    // Validate size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        alert("Image size exceeds the 10MB limit. Please upload an image under 10MB.");
        return;
    }

    try {
        setUploadingSlotState({ isEditing, slot: slotKey });
        const formData = new FormData();
        formData.append("image", file);
        formData.append("slot", slotKey);

        const res = await fetch("http://localhost/BAD%20TEDDY/backend/api/upload.php", {
            method: "POST",
            body: formData
        });
        const data = await res.json();

        if (data.success && data.image) {
            if (isEditing) {
                setEditProductGallery(prev => ({
                    ...prev,
                    [slotKey]: data.image
                }));
            } else {
                setNewProductGallery(prev => ({
                    ...prev,
                    [slotKey]: data.image
                }));
            }
        } else {
            alert(data.message || "Failed to upload image.");
        }
    } catch (err) {
        console.error("Upload error:", err);
        alert("Image upload failed. Please verify your connection.");
    } finally {
        setUploadingSlotState({ isEditing: false, slot: null });
    }
};

const handleRemoveSlot = (slotKey, isEditing = false) => {
    if (isEditing) {
        setEditProductGallery(prev => ({
            ...prev,
            [slotKey]: ""
        }));
    } else {
        setNewProductGallery(prev => ({
            ...prev,
            [slotKey]: ""
        }));
    }
};

const renderGallerySlots = (galleryState, isEditing) => (
    <div className="gallery-section-wrapper">
        <div className="gallery-section-header">
            <h4>
                <i className="fa-solid fa-images"></i>
                Product Gallery (4 Angles)
            </h4>
            <span>
                {Object.values(galleryState).filter(Boolean).length} of 4 slots filled
            </span>
        </div>

        <div className="gallery-slots-grid">
            {GALLERY_SLOTS.map((slot) => {
                const imgPath = galleryState[slot.key];
                const isSlotUploading = uploadingSlotState.isEditing === isEditing && uploadingSlotState.slot === slot.key;

                return (
                    <div
                        key={slot.key}
                        className={`gallery-slot-card ${imgPath ? "has-image" : ""}`}
                    >
                        <div className="gallery-slot-meta">
                            <span className="gallery-slot-label">
                                <i className={`fa-solid ${slot.icon}`}></i>
                                {slot.label}
                            </span>
                            <span className={`gallery-slot-badge ${slot.isPrimary ? "primary" : "optional"}`}>
                                {slot.isPrimary ? "Primary" : "Optional"}
                            </span>
                        </div>

                        <div className="gallery-slot-preview-box">
                            {isSlotUploading ? (
                                <div className="gallery-slot-loading">
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    <span>Uploading...</span>
                                </div>
                            ) : imgPath ? (
                                <img
                                    src={resolveProductImage(imgPath)}
                                    alt={slot.label}
                                    className="gallery-slot-img"
                                />
                            ) : (
                                <button
                                    type="button"
                                    className="gallery-slot-dropzone"
                                    onClick={() => triggerSlotUpload(slot.key, isEditing)}
                                    title={`Upload ${slot.label}`}
                                >
                                    <i className="fa-solid fa-cloud-arrow-up"></i>
                                    <span>Upload {slot.label}</span>
                                    <small>{slot.subtitle}</small>
                                </button>
                            )}
                        </div>

                        {imgPath && (
                            <div className="gallery-slot-actions">
                                <button
                                    type="button"
                                    className="gallery-slot-btn"
                                    onClick={() => triggerSlotUpload(slot.key, isEditing)}
                                    title="Replace Image"
                                >
                                    <i className="fa-solid fa-arrow-rotate-right"></i>
                                    Replace
                                </button>
                                <button
                                    type="button"
                                    className="gallery-slot-btn remove-btn"
                                    onClick={() => handleRemoveSlot(slot.key, isEditing)}
                                    title="Remove Image"
                                >
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
);

const [currentPage, setCurrentPage] = useState(1);

const productsPerPage = 6;

const [products, setProducts] = useState([]);

const fetchProducts = async () => {
    try {
        const res = await fetch("http://localhost/BAD%20TEDDY/backend/api/products.php");
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
            const mapped = data.products.map(p => {
                const stock = Number(p.stock ?? 10);
                const status = stock === 0 ? "Out of Stock" : (stock <= 5 ? "Low Stock" : "Active");
                return {
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    price: Number(p.price),
                    stock: stock,
                    image: resolveProductImage(p.image),
                    rawImage: p.image || "prod1.jpeg",
                    images: p.images || [p.image || "prod1.jpeg"],
                    gallery: p.gallery || {
                        front: p.image || "prod1.jpeg",
                        back: null,
                        sitting: null,
                        standing: null
                    },
                    status: status
                };
            });
            setProducts(mapped);
        }
    } catch (err) {
        console.error("Error fetching admin products:", err);
    }
};

useEffect(() => {
    fetchProducts();
}, []);

// page navigation logic
const goToPage = (page) => {

    switch (page) {

        case "Dashboard":
            navigate("/dashboard");
            break;

        case "Products":
            navigate("/products");
            break;

        case "Orders":
            navigate("/orders");
            break;

        case "Customers":
            navigate("/customers");
            break;

        case "AI Insights":
            navigate("/admin/ai");
            break;

        case "Reports":
            navigate("/reports");
            break;

        case "Settings":
            navigate("/settings");
            break;

        case "logout":
            localStorage.removeItem("badTeddyAdminUser");
            localStorage.removeItem("badTeddyAdminToken");
            navigate("/admin/login");
            break;

        default:
            break;
    }

};


/* =========================================
   THEME TOGGLE
========================================= */

const toggleTheme = () => {

    const newTheme =
        theme === "dark"
            ? "light"
            : "dark";

    setTheme(newTheme);

    localStorage.setItem(
        "adminTheme",
        newTheme
    );
};

const filteredProducts = useMemo(() => {

    let result = [...products];


    // SEARCH
    if (searchTerm.trim() !== "") {

        const search = searchTerm.toLowerCase();

        result = result.filter((product) =>
            product.name.toLowerCase().includes(search) ||
            product.category.toLowerCase().includes(search)
        );

    }


    // CATEGORY FILTER
    if (categoryFilter !== "All Categories") {

        result = result.filter(
            (product) => product.category === categoryFilter
        );

    }


    // STATUS FILTER
    if (statusFilter !== "All Status") {

        result = result.filter(
            (product) => product.status === statusFilter
        );

    }


    // SORT
    if (sortOption === "Price Low-High") {

        result.sort((a, b) => a.price - b.price);

    }

    else if (sortOption === "Price High-Low") {

        result.sort((a, b) => b.price - a.price);

    }

    else if (sortOption === "Oldest") {

        result.sort((a, b) => a.id - b.id);

    }

    else {

        // Newest
        result.sort((a, b) => b.id - a.id);

    }


    return result;

}, [
    products,
    searchTerm,
    categoryFilter,
    statusFilter,
    sortOption
]);

// pagination logic
/* =========================================
   PAGINATION
========================================= */

const totalPages = Math.ceil(
    filteredProducts.length / productsPerPage
);


const startIndex =
    (currentPage - 1) * productsPerPage;


const paginatedProducts =
    filteredProducts.slice(
        startIndex,
        startIndex + productsPerPage
    );
    useEffect(() => {

    setCurrentPage(1);

}, [
    searchTerm,
    categoryFilter,
    statusFilter,
    sortOption
]);

    return (

        <div className={`admin-container ${theme}-theme`}>

            {/* UNIFIED ADMIN SIDEBAR */}
            <AdminSidebar activePage="Products" />

            {/* ==========================
                MAIN CONTENT
            =========================== */}

            <div className="main-content">


                {/* ==========================
                    HEADER
                =========================== */}

                <header className="top-header">

                    <div className="search-box">

                        <i className="fa-solid fa-magnifying-glass"></i>

                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                    </div>


                    <div className="header-right">

                        <div className="notification-wrapper">

    <button
        className="header-icon-btn notification-btn"
        onClick={() =>
            setShowNotifications(
                !showNotifications
            )
        }
        title="Notifications"
    >

        <i className="fa-regular fa-bell"></i>

        <span className="notification-dot"></span>

    </button>


    {showNotifications && (

        <div className="notification-dropdown">

            <div className="notification-header">

                <h3>Notifications</h3>

                <span>3</span>

            </div>


            <div className="notification-item">

                <div className="notification-item-icon order">

                    <i className="fa-solid fa-box"></i>

                </div>

                <div>

                    <h4>New Order</h4>

                    <p>
                        A new order has been placed.
                    </p>

                    <small>
                        Just now
                    </small>

                </div>

            </div>


            <div className="notification-item">

                <div className="notification-item-icon stock">

                    <i className="fa-solid fa-triangle-exclamation"></i>

                </div>

                <div>

                    <h4>Low Stock</h4>

                    <p>
                        Cargo Pants are running low.
                    </p>

                    <small>
                        10 minutes ago
                    </small>

                </div>

            </div>


            <div className="notification-item">

                <div className="notification-item-icon customer">

                    <i className="fa-solid fa-user"></i>

                </div>

                <div>

                    <h4>New Customer</h4>

                    <p>
                        A new customer registered.
                    </p>

                    <small>
                        1 hour ago
                    </small>

                </div>

            </div>


            <button
                className="view-notifications"
                onClick={() =>
                    setShowNotifications(false)
                }
            >
                Close
            </button>

        </div>

    )}

</div>

                         {/* DARK MODE ICON */}

                   <button
    className="theme-btn"
    onClick={toggleTheme}
    title={
        theme === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode"
    }
>
    <i
        className={
            theme === "dark"
                ? "fa-solid fa-sun"
                : "fa-solid fa-moon"
        }
    ></i>
</button>


                        <div className="admin-profile">

                            <img
        src={myLogo}
        alt="Bad Teddy"
    />

    <div>

        <h4>Bad Teddy</h4>

        <p>Super Admin</p>

    </div>

</div>

                    </div>

                </header>


                {/* ==========================
                    PAGE TITLE
                =========================== */}

                <section className="page-title">

                    <h1>Products</h1>

                    <p>
                        Manage your store inventory, prices and stock.
                    </p>

                </section>


                {/* ==========================
                    PRODUCT STATISTICS
                =========================== */}

                <section className="dashboard-cards">


                    <div className="card">

                        <div className="card-icon">

                            <i className="fa-solid fa-box"></i>

                        </div>

                        <div>

                            <h4>Total Products</h4>

                            <h2>{products.length}</h2>

                        </div>

                    </div>


                    <div className="card">

                        <div className="card-icon">

                            <i className="fa-solid fa-circle-check"></i>

                        </div>

                        <div>

                            <h4>Active Products</h4>

                            <h2>{products.filter((p) => p.status === "Active").length}</h2>

                        </div>

                    </div>


                    <div className="card">

                        <div className="card-icon">

                            <i className="fa-solid fa-triangle-exclamation"></i>

                        </div>

                        <div>

                            <h4>Low Stock</h4>

                            <h2>{products.filter((p) => p.stock > 0 && p.stock <= 5).length}</h2>

                        </div>

                    </div>


                    <div className="card">

                        <div className="card-icon">

                            <i className="fa-solid fa-circle-xmark"></i>

                        </div>

                        <div>

                            <h4>Out of Stock</h4>

                            <h2>{products.filter((p) => p.stock === 0).length}</h2>

                        </div>

                    </div>


                </section>





                {/* ==========================
                    FILTER SECTION
                =========================== */}

                <section className="product-toolbar">

                    <div className="toolbar-left">

                        <div className="search-product">

                            <i className="fa-solid fa-magnifying-glass"></i>

                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                        </div>


                        <select
    value={categoryFilter}
    onChange={(e) => setCategoryFilter(e.target.value)}
>

                            <option>All Categories</option>
                            <option>T-Shirts</option>
                            <option>Hoodies</option>
                            <option>Cargo/Jeans</option>
                            <option>Shirts</option>
                            <option>Caps</option>

                        </select>


                        <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
>

                            <option>All Status</option>
                            <option>Active</option>
                            <option>Low Stock</option>
                            <option>Out of Stock</option>

                        </select>


                        <select
    value={sortOption}
    onChange={(e) => setSortOption(e.target.value)}
>

                            <option>Newest</option>
                            <option>Oldest</option>
                            <option>Price Low-High</option>
                            <option>Price High-Low</option>

                        </select>

                    </div>


                    <div className="toolbar-right">

                        <button
    className="add-product-btn"
    onClick={() => {

        setNewProduct({
            name: "",
            category: "T-Shirts",
            price: "",
            stock: "",
            status: "Active",
            image: "prod1.jpeg"
        });

        setNewProductGallery({
            front: "",
            back: "",
            sitting: "",
            standing: ""
        });

        setShowAddModal(true);

    }}
>
    <i className="fa-solid fa-plus"></i>

    Add New Product
</button>

                    </div>

                </section>


                {/* ==========================
                    PRODUCT GRID
                =========================== */}

                {/* =========================================
    PRODUCT GRID
========================================= */}

<div className="product-grid">

    {paginatedProducts.length > 0 ? (

        paginatedProducts.map((product) => (

            <div
                className="product-card"
                key={product.id}
            >

                {/* PRODUCT IMAGE */}

                <div className="product-image">

                    <img
                        src={product.image}
                        alt={product.name}
                    />


                    {/* STATUS */}

                    <span
                        className={`product-status ${
                            product.status
                                .toLowerCase()
                                .replace(" ", "-")
                        }`}
                    >
                        {product.status}
                    </span>

                    <span
                        className="gallery-count-pill"
                        style={{
                            position: "absolute",
                            bottom: "10px",
                            left: "10px",
                            background: "rgba(10, 10, 10, 0.88)",
                            backdropFilter: "blur(6px)"
                        }}
                    >
                        <i className="fa-solid fa-images"></i> {product.images?.length || 1} {product.images?.length === 1 ? "Image" : "Images"}
                    </span>

                </div>


                {/* PRODUCT INFORMATION */}

                <div className="product-info">

                    <div className="product-info-top">

                        <div>

                            <h3>
                                {product.name}
                            </h3>

                            <p>
                                {product.category}
                            </p>

                        </div>


                        <strong className="product-price">
                            ₹{product.price.toLocaleString("en-IN")}
                        </strong>

                    </div>


                    {/* STOCK */}

                    <div className="product-stock">

                        <span>
                            Stock: {product.stock}
                        </span>


                        <div className="stock-bar">

                            <div
                                className={`stock-progress ${
                                    product.stock <= 5
                                        ? "low"
                                        : ""
                                }`}
                                style={{
                                    width: `${Math.min(
                                        product.stock,
                                        100
                                    )}%`
                                }}
                            ></div>

                        </div>

                    </div>


                    {/* ACTIONS */}

                    <div className="product-actions">

                        <button
    className="edit-btn"
    onClick={() => {

        setEditingProduct({
            ...product
        });

        setEditProductGallery({
            front: product.gallery?.front || product.rawImage || product.image || "",
            back: product.gallery?.back || "",
            sitting: product.gallery?.sitting || "",
            standing: product.gallery?.standing || ""
        });

        setShowEditModal(true);

    }}
>
    <i className="fa-solid fa-pen"></i>

    Edit
</button>


                        <button
                            className="delete-btn"
                            onClick={async () => {

    const confirmDelete = window.confirm(
        `Are you sure you want to delete ${product.name}?`
    );

    if (confirmDelete) {
        try {
            await fetch("http://localhost/BAD%20TEDDY/backend/api/products.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", id: product.id })
            });
        } catch (err) {
            console.error("Delete product error:", err);
        }

        setProducts((currentProducts) =>
            currentProducts.filter(
                (item) => item.id !== product.id
            )
        );

    }

}}
                        >

                            <i className="fa-solid fa-trash"></i>

                            Delete

                        </button>

                    </div>

                </div>

            </div>

        ))

    ) : (

        /* =====================================
           NO PRODUCTS FOUND
        ====================================== */

        <div className="no-products">

            <i className="fa-solid fa-box-open"></i>

            <h3>
                No Products Found
            </h3>

            <p>
                Try changing your search or filters.
            </p>

        </div>

    )}

</div>

{totalPages > 1 && (

    <div className="pagination">

        <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() =>
                setCurrentPage((page) => page - 1)
            }
        >
            <i className="fa-solid fa-chevron-left"></i>
        </button>

        {Array.from(
            { length: totalPages },
            (_, index) => index + 1
        ).map((page) => (

            <button
                key={page}
                className={`pagination-btn ${
                    currentPage === page
                        ? "active"
                        : ""
                }`}
                onClick={() => setCurrentPage(page)}
            >
                {page}
            </button>

        ))}

        <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() =>
                setCurrentPage((page) => page + 1)
            }
        >
            <i className="fa-solid fa-chevron-right"></i>
        </button>

    </div>

)}

                {/* ==========================
                    AI PRODUCT INSIGHTS
                =========================== */}

                <section className="ai-insights">

                    <div className="insights-header">

                        <h2>

                            <i className="fa-solid fa-robot"></i>

                            AI Product Insights

                        </h2>


                        <button
    className="generate-report-btn"
    onClick={generateAIReport}
>
    <i className="fa-solid fa-wand-magic-sparkles"></i>
    Generate Report
</button>

                    </div>


                    <div className="insights-grid">


                        {/* Trending Product */}

                        <div className="insight-card">

                            <div className="insight-icon trending">

                                <i className="fa-solid fa-fire"></i>

                            </div>


                            <div>

                                <h3>Trending Product</h3>

                                <h4>Oversized Hoodie</h4>

                                <p>
                                    Highest demand this week
                                </p>

                            </div>

                        </div>


                        {/* Low Stock */}

                        <div className="insight-card">

                            <div className="insight-icon warning">

                                <i className="fa-solid fa-triangle-exclamation"></i>

                            </div>


                            <div>

                                <h3>Low Stock Alert</h3>

                                <h4>Cargo Pants</h4>

                                <p>
                                    Only 3 units left
                                </p>

                            </div>

                        </div>


                        {/* AI Suggestion */}

                        <div className="insight-card">

                            <div className="insight-icon suggestion">

                                <i className="fa-solid fa-lightbulb"></i>

                            </div>


                            <div>

                                <h3>AI Suggestion</h3>

                                <h4>Restock 25 Hoodies</h4>

                                <p>
                                    Based on current sales trend
                                </p>

                            </div>

                        </div>


                    </div>

                </section>


                {/* ==========================
                    PRODUCT PERFORMANCE
                =========================== */}

                <section className="performance-section">


                    <div className="performance-card">

                        <h3>

                            <i className="fa-solid fa-chart-line"></i>

                            Best Performing Category

                        </h3>

                        <p>
                            Oversized T-Shirts generated{" "}
                            <strong>38%</strong> of total sales
                            this month.
                        </p>

                    </div>


                    <div className="performance-card">

                        <h3>

                            <i className="fa-solid fa-eye"></i>

                            Most Viewed Product

                        </h3>

                        <p>
                            Chaos Tee received{" "}
                            <strong>2,540 views</strong>{" "}
                            this week.
                        </p>

                    </div>


                    <div className="performance-card">

                        <h3>

                            <i className="fa-solid fa-box-open"></i>

                            Inventory Health

                        </h3>

                        <p>
                            74 Active Products<br />
                            5 Low Stock<br />
                            3 Out of Stock
                        </p>

                    </div>


                </section>


                {/* ==========================
                    FOOTER
                =========================== */}

                <footer className="admin-footer">

                    <p>
                        © 2026 Bad Teddy Admin Panel
                    </p>

                    <p>
                        Built using React • PHP • MySQL
                    </p>

                </footer>

                {showAIReport && (
    <div className="ai-report">

        <div className="ai-report-header">

            <div>
                <h2>
                    <i className="fa-solid fa-robot"></i>
                    AI Product Report
                </h2>

                <p>
                    Generated from your current product inventory.
                </p>
            </div>

            <button
                className="close-report-btn"
                onClick={() => setShowAIReport(false)}
            >
                <i className="fa-solid fa-xmark"></i>
            </button>

        </div>


        <div className="ai-report-content">

            <div className="report-item">
                <span>Total Products</span>
                <strong>{products.length}</strong>
            </div>

            <div className="report-item">
                <span>Active Products</span>
                <strong>
                    {products.filter(
                        product => product.status === "Active"
                    ).length}
                </strong>
            </div>

            <div className="report-item">
                <span>Low Stock</span>
                <strong>
                    {products.filter(
                        product =>
                            product.stock > 0 &&
                            product.stock <= 5
                    ).length}
                </strong>
            </div>

            <div className="report-item">
                <span>Out of Stock</span>
                <strong>
                    {products.filter(
                        product => product.stock === 0
                    ).length}
                </strong>
            </div>

        </div>

    </div>
)}

{/* edit starts here */}
                {/* =========================================
    EDIT PRODUCT MODAL
========================================= */}

{showEditModal && editingProduct && (

    <div
        className="product-modal-overlay"
        onClick={() => setShowEditModal(false)}
    >

        <div
            className="product-modal"
            onClick={(e) => e.stopPropagation()}
        >

            {/* MODAL HEADER */}

            <div className="modal-header">

                <div>

                    <h2>
                        Edit Product
                    </h2>

                    <p>
                        Update product information.
                    </p>

                </div>

                <button
                    className="modal-close"
                    onClick={() =>
                        setShowEditModal(false)
                    }
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>

            </div>


            {/* PRODUCT NAME */}

            <div className="form-group">

                <label>
                    Product Name
                </label>

                <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) =>
                        setEditingProduct({
                            ...editingProduct,
                            name: e.target.value
                        })
                    }
                />

            </div>


            {/* CATEGORY */}

            <div className="form-group">

                <label>
                    Category
                </label>

                <select
                    value={editingProduct.category}
                    onChange={(e) =>
                        setEditingProduct({
                            ...editingProduct,
                            category: e.target.value
                        })
                    }
                >

                    <option value="T-Shirts">T-Shirts</option>
                    <option value="Hoodies">Hoodies</option>
                    <option value="Cargo/Jeans">Cargo/Jeans</option>
                    <option value="Shirts">Shirts</option>
                    <option value="Caps">Caps</option>

                </select>

            </div>


            {/* PRICE */}

            <div className="form-group">

                <label>
                    Price
                </label>

                <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) =>
                        setEditingProduct({
                            ...editingProduct,
                            price: Number(e.target.value)
                        })
                    }
                />

            </div>


            {/* STOCK */}

            <div className="form-group">

                <label>
                    Stock
                </label>

                <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) =>
                        setEditingProduct({
                            ...editingProduct,
                            stock: Number(e.target.value)
                        })
                    }
                />

            </div>


            {/* STATUS */}

            <div className="form-group">

                <label>
                    Status
                </label>

                <select
                    value={editingProduct.status}
                    onChange={(e) =>
                        setEditingProduct({
                            ...editingProduct,
                            status: e.target.value
                        })
                    }
                >

                    <option value="Active">
                        Active
                    </option>

                    <option value="Low Stock">
                        Low Stock
                    </option>

                    <option value="Out of Stock">
                        Out of Stock
                    </option>

                </select>

            </div>

            {/* MULTI-IMAGE GALLERY IN EDIT MODAL */}
            {renderGallerySlots(editProductGallery, true)}


            {/* BUTTONS */}

            <div className="modal-actions">

                <button
                    className="modal-cancel"
                    onClick={() =>
                        setShowEditModal(false)
                    }
                >
                    Cancel
                </button>


                <button
                    className="modal-save"
                    onClick={async () => {
                        const primaryImage = editProductGallery.front ||
                            editProductGallery.back ||
                            editProductGallery.sitting ||
                            editProductGallery.standing ||
                            editingProduct.rawImage ||
                            "prod1.jpeg";

                        try {
                            await fetch("http://localhost/BAD%20TEDDY/backend/api/products.php", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    action: "update",
                                    id: editingProduct.id,
                                    name: editingProduct.name,
                                    category: editingProduct.category,
                                    price: Number(editingProduct.price),
                                    stock: Number(editingProduct.stock),
                                    image: primaryImage,
                                    status: editingProduct.status,
                                    gallery: {
                                        front: editProductGallery.front || null,
                                        back: editProductGallery.back || null,
                                        sitting: editProductGallery.sitting || null,
                                        standing: editProductGallery.standing || null
                                    }
                                })
                            });
                        } catch (err) {
                            console.error("Save product error:", err);
                        }

                        await fetchProducts();
                        setShowEditModal(false);
                        setEditingProduct(null);
                    }}
                >

                    <i className="fa-solid fa-check"></i>

                    Save Changes

                </button>

            </div>

        </div>

    </div>

)}
{/* edit ends here */}

{/* add modal starts here */}
{/* =========================================
    ADD PRODUCT MODAL
========================================= */}

{showAddModal && (

    <div
        className="product-modal-overlay"
        onClick={() => setShowAddModal(false)}
    >

        <div
            className="product-modal"
            onClick={(e) => e.stopPropagation()}
        >


            {/* MODAL HEADER */}

            <div className="modal-header">

                <div>

                    <h2>
                        Add New Product
                    </h2>

                    <p>
                        Add a new product to your store.
                    </p>

                </div>


                <button
                    className="modal-close"
                    onClick={() =>
                        setShowAddModal(false)
                    }
                >

                    <i className="fa-solid fa-xmark"></i>

                </button>

            </div>



            {/* PRODUCT NAME */}

            <div className="form-group">

                <label>
                    Product Name
                </label>

                <input
                    type="text"
                    placeholder="Enter product name"
                    value={newProduct.name}
                    onChange={(e) =>
                        setNewProduct({
                            ...newProduct,
                            name: e.target.value
                        })
                    }
                />

            </div>



            {/* CATEGORY */}

            <div className="form-group">

                <label>
                    Category
                </label>

                <select
                    value={newProduct.category}
                    onChange={(e) =>
                        setNewProduct({
                            ...newProduct,
                            category: e.target.value
                        })
                    }
                >

                    <option value="T-Shirts">T-Shirts</option>
                    <option value="Hoodies">Hoodies</option>
                    <option value="Cargo/Jeans">Cargo/Jeans</option>
                    <option value="Shirts">Shirts</option>
                    <option value="Caps">Caps</option>

                </select>

            </div>



            {/* PRICE */}

            <div className="form-group">

                <label>
                    Price
                </label>

                <input
                    type="number"
                    placeholder="Enter price"
                    value={newProduct.price}
                    onChange={(e) =>
                        setNewProduct({
                            ...newProduct,
                            price: e.target.value
                        })
                    }
                />

            </div>



            {/* STOCK */}

            <div className="form-group">

                <label>
                    Stock
                </label>

                <input
                    type="number"
                    placeholder="Enter stock quantity"
                    value={newProduct.stock}
                    onChange={(e) =>
                        setNewProduct({
                            ...newProduct,
                            stock: e.target.value
                        })
                    }
                />

            </div>



            {/* STATUS */}

            <div className="form-group">

                <label>
                    Status
                </label>

                <select
                    value={newProduct.status}
                    onChange={(e) =>
                        setNewProduct({
                            ...newProduct,
                            status: e.target.value
                        })
                    }
                >

                    <option value="Active">
                        Active
                    </option>

                    <option value="Low Stock">
                        Low Stock
                    </option>

                    <option value="Out of Stock">
                        Out of Stock
                    </option>

                </select>

            </div>



            {/* MULTI-IMAGE GALLERY IN ADD MODAL */}
            {renderGallerySlots(newProductGallery, false)}



            {/* BUTTONS */}

            <div className="modal-actions">

                <button
                    className="modal-cancel"
                    onClick={() =>
                        setShowAddModal(false)
                    }
                >

                    Cancel

                </button>


                <button
                    className="modal-save"
                    onClick={async () => {

                        /* VALIDATION */

                        if (
                            newProduct.name.trim() === "" ||
                            newProduct.price === "" ||
                            newProduct.stock === ""
                        ) {

                            alert(
                                "Please fill in all required fields."
                            );

                            return;

                        }

                        const primaryImage = newProductGallery.front ||
                            newProductGallery.back ||
                            newProductGallery.sitting ||
                            newProductGallery.standing ||
                            "prod1.jpeg";

                        try {
                            const res = await fetch("http://localhost/BAD%20TEDDY/backend/api/products.php", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    name: newProduct.name.trim(),
                                    category: newProduct.category,
                                    price: Number(newProduct.price),
                                    stock: Number(newProduct.stock),
                                    status: newProduct.status,
                                    image: primaryImage,
                                    description: newProduct.name.trim(),
                                    style: "Streetwear",
                                    gallery: {
                                        front: newProductGallery.front || null,
                                        back: newProductGallery.back || null,
                                        sitting: newProductGallery.sitting || null,
                                        standing: newProductGallery.standing || null
                                    }
                                })
                            });
                            const data = await res.json();
                            if (data.success) {
                                await fetchProducts();
                            }
                        } catch (err) {
                            console.error("Add product error:", err);
                        }

                        /* CLOSE MODAL & RESET */
                        setShowAddModal(false);
                        setNewProduct({
                            name: "",
                            category: "T-Shirts",
                            price: "",
                            stock: "",
                            status: "Active",
                            image: "prod1.jpeg"
                        });
                        setNewProductGallery({
                            front: "",
                            back: "",
                            sitting: "",
                            standing: ""
                        });
                    }}
                >

                    <i className="fa-solid fa-plus"></i>

                    Add Product

                </button>

            </div>

        </div>

    </div>

)}
{/* add modal ends here */}

            {/* HIDDEN FILE INPUT FOR 4-SLOT GALLERY UPLOADS */}
            <input
                type="file"
                ref={slotFileInputRef}
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                    if (e.target.files && e.target.files[0] && activeUploadContext.slot) {
                        handleSlotFileUpload(
                            e.target.files[0],
                            activeUploadContext.slot,
                            activeUploadContext.isEditing
                        );
                    }
                }}
            />

            </div>

        </div>

    );

}


export default AdminProducts;