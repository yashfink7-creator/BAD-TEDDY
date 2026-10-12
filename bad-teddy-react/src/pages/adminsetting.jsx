import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/admin-setting.css";
import { useNavigate } from "react-router-dom";
import myLogo from "../assets/mylogo.png";


function Adminsettings() {
    const navigate = useNavigate();

    /* =========================================
       ACTIVE SETTINGS TAB
    ========================================== */

    const [activeTab, setActiveTab] =
        useState("profile");


    /* =========================================
       SEARCH
    ========================================== */

    const [searchTerm, setSearchTerm] =
        useState("");


    /* =========================================
       ADMIN PROFILE
    ========================================== */

    const [profile, setProfile] = useState({

        fullName: "Admin",

        email: "admin@badteddy.com",

        phone: "+91 98765 43210",

        role: "Super Admin"

    });


    /* =========================================
       STORE INFORMATION
    ========================================== */

    const [store, setStore] = useState({

        name: "Bad Teddy",

        email: "support@badteddy.com",

        phone: "+91 98765 43210",

        currency: "Indian Rupee (₹)",

        address:
            "Mumbai, Maharashtra, India"

    });


    /* =========================================
       NOTIFICATION SETTINGS
    ========================================== */

    const [notifications, setNotifications] =
        useState({

            newOrders: true,

            lowStock: true,

            newCustomers: true,

            orderUpdates: false

        });


    /* =========================================
       ORDER SETTINGS
    ========================================== */

    const [orderSettings, setOrderSettings] =
        useState({

            defaultStatus: "Pending",

            ordersPerPage: "20"

        });


    /* =========================================
       SECURITY
    ========================================== */

    const [passwords, setPasswords] =
        useState({

            current: "",

            newPassword: "",

            confirm: ""

        });


    /* =========================================
       STATUS MESSAGE
    ========================================== */

    const [message, setMessage] =
        useState("");

    const [messageType, setMessageType] =
        useState("success");


    /* =========================================
       PROFILE CHANGE
    ========================================== */

    const handleProfileChange = (e) => {

        const { name, value } = e.target;

        setProfile((previous) => ({

            ...previous,

            [name]: value

        }));

    };


    /* =========================================
       LOAD SETTINGS FROM LOCALSTORAGE
    ========================================== */

    useEffect(() => {
        try {
            const savedProfile = localStorage.getItem("adminProfile");
            if (savedProfile) setProfile(JSON.parse(savedProfile));

            const savedStore = localStorage.getItem("adminStore");
            if (savedStore) setStore(JSON.parse(savedStore));

            const savedNotifs = localStorage.getItem("adminNotifications");
            if (savedNotifs) setNotifications(JSON.parse(savedNotifs));

            const savedOrderSettings = localStorage.getItem("adminOrderSettings");
            if (savedOrderSettings) setOrderSettings(JSON.parse(savedOrderSettings));
        } catch (e) {
            console.error("Error loading admin settings from localStorage:", e);
        }
    }, []);

    // page navigation 
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

const goToDashboard = () => navigate("/dashboard");
const goToProducts = () => navigate("/products");
const goToOrders = () => navigate("/orders");
const goToCustomers = () => navigate("/customers");
const goToReports = () => navigate("/reports");
const goToSettings = () => navigate("/settings");



    /* =========================================
       STORE CHANGE
    ========================================== */

    const handleStoreChange = (e) => {

        const { name, value } = e.target;

        setStore((previous) => ({

            ...previous,

            [name]: value

        }));

    };


    /* =========================================
       NOTIFICATION TOGGLE
    ========================================== */

    const handleNotificationChange = (name) => {

        setNotifications((previous) => ({

            ...previous,

            [name]: !previous[name]

        }));

    };


    /* =========================================
       ORDER SETTINGS CHANGE
    ========================================== */

    const handleOrderSettingChange = (e) => {

        const { name, value } = e.target;

        setOrderSettings((previous) => ({

            ...previous,

            [name]: value

        }));

    };


    /* =========================================
       PASSWORD CHANGE
    ========================================== */

    const handlePasswordChange = (e) => {

        const { name, value } = e.target;

        setPasswords((previous) => ({

            ...previous,

            [name]: value

        }));

    };


    /* =========================================
       SHOW MESSAGE
    ========================================== */

    const showMessage = (
        text,
        type = "success"
    ) => {

        setMessage(text);

        setMessageType(type);


        setTimeout(() => {

            setMessage("");

        }, 3000);

    };
        /* =========================================
       TAB SWITCHING
    ========================================== */

    const handleTabChange = (tab) => {

        setActiveTab(tab);

        setSearchTerm("");

        setMessage("");

    };


    /* =========================================
       SEARCH SETTINGS
    ========================================== */

    const handleSearch = (e) => {

        setSearchTerm(
            e.target.value
        );

    };


    /* =========================================
       SAVE SETTINGS
    ========================================== */

    const handleSave = () => {


        /* =====================================
           PASSWORD VALIDATION
        ====================================== */

        if (
            passwords.newPassword ||
            passwords.confirm ||
            passwords.current
        ) {


            if (!passwords.current) {

                showMessage(
                    "Please enter your current password.",
                    "error"
                );

                return;

            }


            if (
                passwords.newPassword.length < 6
            ) {

                showMessage(
                    "New password must contain at least 6 characters.",
                    "error"
                );

                return;

            }


            if (
                passwords.newPassword !==
                passwords.confirm
            ) {

                showMessage(
                    "New password and confirm password do not match.",
                    "error"
                );

                return;

            }

        }


        /* =====================================
           SAVE SETTINGS
           
           Persisted to localStorage
        ====================================== */

        try {
            localStorage.setItem("adminProfile", JSON.stringify(profile));
            localStorage.setItem("adminStore", JSON.stringify(store));
            localStorage.setItem("adminNotifications", JSON.stringify(notifications));
            localStorage.setItem("adminOrderSettings", JSON.stringify(orderSettings));
        } catch (e) {
            console.error("Error saving settings to localStorage:", e);
        }

        console.log(
            "Settings saved:",
            {
                profile,
                store,
                notifications,
                orderSettings
            }
        );


        /* =====================================
           CLEAR PASSWORD FIELDS
        ====================================== */

        setPasswords({

            current: "",

            newPassword: "",

            confirm: ""

        });


        /* =====================================
           SUCCESS MESSAGE
        ====================================== */

        showMessage(
            "Settings saved successfully!",
            "success"
        );

    };


    /* =========================================
       CANCEL / RESET CHANGES
    ========================================== */

    const handleCancel = () => {


        const confirmCancel =
            window.confirm(
                "Are you sure you want to discard your changes?"
            );


        if (!confirmCancel) {

            return;

        }


        /* =====================================
           RESET PROFILE
        ====================================== */

        setProfile({

            fullName: "Admin",

            email: "admin@badteddy.com",

            phone: "+91 98765 43210",

            role: "Super Admin"

        });


        /* =====================================
           RESET STORE
        ====================================== */

        setStore({

            name: "Bad Teddy",

            email: "support@badteddy.com",

            phone: "+91 98765 43210",

            currency: "Indian Rupee (₹)",

            address:
                "Mumbai, Maharashtra, India"

        });


        /* =====================================
           RESET NOTIFICATIONS
        ====================================== */

        setNotifications({

            newOrders: true,

            lowStock: true,

            newCustomers: true,

            orderUpdates: false

        });


        /* =====================================
           RESET ORDER SETTINGS
        ====================================== */

        setOrderSettings({

            defaultStatus: "Pending",

            ordersPerPage: "20"

        });


        /* =====================================
           RESET PASSWORD
        ====================================== */

        setPasswords({

            current: "",

            newPassword: "",

            confirm: ""

        });


        showMessage(
            "Changes discarded.",
            "success"
        );

    };


    /* =========================================
       CAMERA / PROFILE IMAGE
    ========================================== */

    const handleProfileImage = () => {

        showMessage(
            "Profile image upload will be connected to the backend later.",
            "success"
        );

    };


    /* =========================================
       SIDEBAR NAVIGATION
    ========================================== */



    /* =========================================
       LOGOUT
    ========================================== */

    const handleLogout = () => {
        const confirmLogout = window.confirm("Are you sure you want to logout from Admin Panel?");
        if (!confirmLogout) {
            return;
        }
        localStorage.removeItem("badTeddyAdminUser");
        localStorage.removeItem("badTeddyAdminToken");
        navigate("/admin/login");
    };


    /* =========================================
       SETTINGS TAB SEARCH
    ========================================== */

    const tabMatchesSearch = (tabName) => {

        if (!searchTerm.trim()) {

            return true;

        }


        return tabName
            .toLowerCase()
            .includes(
                searchTerm.toLowerCase()
            );

    };
        /* =========================================
       PAGE JSX
    ========================================== */

    return (

        <div className="admin-container">

            {/* UNIFIED ADMIN SIDEBAR */}
            <AdminSidebar activePage="Settings" />

            {/* =========================================
                MAIN CONTENT
            ========================================== */}

            <main className="main-content">


                {/* =========================================
                    TOP HEADER
                ========================================== */}

                <header className="top-header">


                    {/* =====================================
                        SEARCH
                    ====================================== */}

                    <div className="search-box">

                        <i className="fa-solid fa-magnifying-glass"></i>


                        <input
                            type="text"
                            placeholder="Search settings..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />


                        {searchTerm && (

                            <button
                                className="clear-search"
                                onClick={() =>
                                    setSearchTerm("")
                                }
                                title="Clear search"
                            >

                                <i className="fa-solid fa-xmark"></i>

                            </button>

                        )}

                    </div>



                    {/* =====================================
                        HEADER RIGHT
                    ====================================== */}

                    <div className="header-right">


                        {/* NOTIFICATIONS */}

                        <button
                            className="header-icon-btn"
                            title="Notifications"
                            onClick={() =>
                                showMessage(
                                    "You have no new notifications.",
                                    "success"
                                )
                            }
                        >

                            <i className="fa-regular fa-bell"></i>

                            <span className="notification-dot"></span>

                        </button>



                        {/* THEME */}

                        <button
                            className="header-icon-btn"
                            title="Theme"
                            onClick={() =>
                                showMessage(
                                    "Dark mode is currently active.",
                                    "success"
                                )
                            }
                        >

                            <i className="fa-solid fa-moon"></i>

                        </button>



                        {/* ADMIN PROFILE */}

                        <div className="admin-profile">


                            <div className="admin-avatar">

                                {profile.fullName
                                    .charAt(0)
                                    .toUpperCase()
                                }

                            </div>


                            <div>

                                <h4>
                                    {profile.fullName}
                                </h4>

                                <p>
                                    {profile.role}
                                </p>

                            </div>


                        </div>


                    </div>


                </header>



                {/* =========================================
                    PAGE TITLE
                ========================================== */}

                <section className="page-title">


                    <div>

                        <h1>
                            Settings
                        </h1>


                        <p>
                            Manage your store and account settings.
                        </p>

                    </div>


                </section>



                {/* =========================================
                    STATUS MESSAGE
                ========================================== */}

                {message && (

                    <div
                        className={
                            `settings-message ${messageType}`
                        }
                    >

                        <i
                            className={
                                messageType === "error"
                                    ? "fa-solid fa-circle-exclamation"
                                    : "fa-solid fa-circle-check"
                            }
                        ></i>


                        <span>
                            {message}
                        </span>


                        <button
                            onClick={() =>
                                setMessage("")
                            }
                        >

                            <i className="fa-solid fa-xmark"></i>

                        </button>

                    </div>

                )}



                {/* =========================================
                    SETTINGS ACTIONS
                ========================================== */}

                <div className="settings-actions">


                    <button
                        className="cancel-btn"
                        onClick={handleCancel}
                    >

                        <i className="fa-solid fa-rotate-left"></i>

                        Cancel

                    </button>


                    <button
                        className="save-btn"
                        onClick={handleSave}
                    >

                        <i className="fa-solid fa-floppy-disk"></i>

                        Save Changes

                    </button>


                </div>
                                {/* =========================================
                    SETTINGS LAYOUT
                ========================================== */}

                <div className="settings-layout">


                    {/* =====================================
                        SETTINGS SIDEBAR / TABS
                    ====================================== */}

                    <aside className="settings-nav">


                        {/* PROFILE TAB */}

                        {tabMatchesSearch("Profile") && (

                            <button
                                className={
                                    activeTab === "profile"
                                        ? "settings-tab active"
                                        : "settings-tab"
                                }
                                onClick={() =>
                                    handleTabChange("profile")
                                }
                            >

                                <i className="fa-solid fa-user"></i>

                                <span>
                                    Profile
                                </span>

                            </button>

                        )}



                        {/* STORE TAB */}

                        {tabMatchesSearch("Store Information") && (

                            <button
                                className={
                                    activeTab === "store"
                                        ? "settings-tab active"
                                        : "settings-tab"
                                }
                                onClick={() =>
                                    handleTabChange("store")
                                }
                            >

                                <i className="fa-solid fa-store"></i>

                                <span>
                                    Store Information
                                </span>

                            </button>

                        )}



                        {/* NOTIFICATIONS TAB */}

                        {tabMatchesSearch("Notifications") && (

                            <button
                                className={
                                    activeTab === "notifications"
                                        ? "settings-tab active"
                                        : "settings-tab"
                                }
                                onClick={() =>
                                    handleTabChange(
                                        "notifications"
                                    )
                                }
                            >

                                <i className="fa-solid fa-bell"></i>

                                <span>
                                    Notifications
                                </span>

                            </button>

                        )}



                        {/* ORDER SETTINGS TAB */}

                        {tabMatchesSearch("Order Settings") && (

                            <button
                                className={
                                    activeTab === "orders"
                                        ? "settings-tab active"
                                        : "settings-tab"
                                }
                                onClick={() =>
                                    handleTabChange("orders")
                                }
                            >

                                <i className="fa-solid fa-cart-shopping"></i>

                                <span>
                                    Order Settings
                                </span>

                            </button>

                        )}



                        {/* SECURITY TAB */}

                        {tabMatchesSearch("Security") && (

                            <button
                                className={
                                    activeTab === "security"
                                        ? "settings-tab active"
                                        : "settings-tab"
                                }
                                onClick={() =>
                                    handleTabChange(
                                        "security"
                                    )
                                }
                            >

                                <i className="fa-solid fa-shield-halved"></i>

                                <span>
                                    Security
                                </span>

                            </button>

                        )}


                    </aside>



                    {/* =====================================
                        SETTINGS CONTENT
                    ====================================== */}

                    <div className="settings-content">


                        {/* =================================
                            PROFILE
                        ================================== */}

                        {activeTab === "profile" && (

                            <section className="settings-card">


                                {/* HEADER */}

                                <div className="settings-card-header">

                                    <div>

                                        <h2>
                                            Profile
                                        </h2>

                                        <p>
                                            Manage your administrator profile information.
                                        </p>

                                    </div>

                                </div>



                                {/* PROFILE IMAGE */}

                                <div className="profile-section">


                                    <div className="profile-picture">


                                        <div className="profile-avatar-large">

                                            {profile.fullName
                                                .charAt(0)
                                                .toUpperCase()
                                            }

                                        </div>


                                        <button
                                            className="change-photo-btn"
                                            onClick={
                                                handleProfileImage
                                            }
                                        >

                                            <i className="fa-solid fa-camera"></i>

                                        </button>


                                    </div>


                                    <div className="profile-picture-info">

                                        <h3>
                                            Profile Picture
                                        </h3>

                                        <p>
                                            JPG, PNG or WEBP. Maximum size 2MB.
                                        </p>

                                    </div>


                                </div>



                                {/* PROFILE FORM */}

                                <div className="settings-form">


                                    {/* FULL NAME */}

                                    <div className="form-group">

                                        <label>
                                            Full Name
                                        </label>


                                        <input
                                            type="text"
                                            name="fullName"
                                            value={
                                                profile.fullName
                                            }
                                            onChange={
                                                handleProfileChange
                                            }
                                            placeholder="Enter full name"
                                        />

                                    </div>



                                    {/* EMAIL */}

                                    <div className="form-group">

                                        <label>
                                            Email Address
                                        </label>


                                        <input
                                            type="email"
                                            name="email"
                                            value={
                                                profile.email
                                            }
                                            onChange={
                                                handleProfileChange
                                            }
                                            placeholder="Enter email address"
                                        />

                                    </div>



                                    {/* PHONE */}

                                    <div className="form-group">

                                        <label>
                                            Phone Number
                                        </label>


                                        <input
                                            type="tel"
                                            name="phone"
                                            value={
                                                profile.phone
                                            }
                                            onChange={
                                                handleProfileChange
                                            }
                                            placeholder="Enter phone number"
                                        />

                                    </div>



                                    {/* ROLE */}

                                    <div className="form-group">

                                        <label>
                                            Role
                                        </label>


                                        <input
                                            type="text"
                                            name="role"
                                            value={
                                                profile.role
                                            }
                                            readOnly
                                        />


                                        <small>
                                            Your administrator role cannot be changed here.
                                        </small>

                                    </div>


                                </div>


                            </section>

                        )}

                    
                
                                        {/* =================================
                            STORE INFORMATION
                        ================================== */}

                        {activeTab === "store" && (

                            <section className="settings-card">


                                {/* =================================
                                    CARD HEADER
                                ================================== */}

                                <div className="settings-card-header">

                                    <div>

                                        <h2>
                                            Store Information
                                        </h2>

                                        <p>
                                            Manage your store's basic information and contact details.
                                        </p>

                                    </div>

                                </div>



                                {/* =================================
                                    STORE FORM
                                ================================== */}

                                <div className="settings-form">


                                    {/* =================================
                                        STORE NAME
                                    ================================== */}

                                    <div className="form-group">

                                        <label>
                                            Store Name
                                        </label>


                                        <input
                                            type="text"
                                            name="name"
                                            value={store.name}
                                            onChange={
                                                handleStoreChange
                                            }
                                            placeholder="Enter store name"
                                        />

                                    </div>



                                    {/* =================================
                                        STORE EMAIL
                                    ================================== */}

                                    <div className="form-group">

                                        <label>
                                            Store Email
                                        </label>


                                        <input
                                            type="email"
                                            name="email"
                                            value={store.email}
                                            onChange={
                                                handleStoreChange
                                            }
                                            placeholder="Enter store email"
                                        />

                                    </div>



                                    {/* =================================
                                        STORE PHONE
                                    ================================== */}

                                    <div className="form-group">

                                        <label>
                                            Phone Number
                                        </label>


                                        <input
                                            type="tel"
                                            name="phone"
                                            value={store.phone}
                                            onChange={
                                                handleStoreChange
                                            }
                                            placeholder="Enter store phone number"
                                        />

                                    </div>



                                    {/* =================================
                                        CURRENCY
                                    ================================== */}

                                    <div className="form-group">

                                        <label>
                                            Currency
                                        </label>


                                        <select
                                            name="currency"
                                            value={
                                                store.currency
                                            }
                                            onChange={
                                                handleStoreChange
                                            }
                                        >

                                            <option value="Indian Rupee (₹)">
                                                Indian Rupee (₹)
                                            </option>


                                            <option value="US Dollar ($)">
                                                US Dollar ($)
                                            </option>


                                            <option value="Euro (€)">
                                                Euro (€)
                                            </option>


                                            <option value="British Pound (£)">
                                                British Pound (£)
                                            </option>

                                        </select>

                                    </div>



                                    {/* =================================
                                        STORE ADDRESS
                                    ================================== */}

                                    <div className="form-group full-width">

                                        <label>
                                            Store Address
                                        </label>


                                        <textarea
                                            name="address"
                                            value={
                                                store.address
                                            }
                                            onChange={
                                                handleStoreChange
                                            }
                                            placeholder="Enter store address"
                                            rows="4"
                                        ></textarea>

                                    </div>


                                </div>


                            </section>

                        )}
                                                {/* =================================
                            NOTIFICATIONS
                        ================================== */}

                        {activeTab === "notifications" && (

                            <section className="settings-card">


                                {/* =================================
                                    CARD HEADER
                                ================================== */}

                                <div className="settings-card-header">

                                    <div>

                                        <h2>
                                            Notifications
                                        </h2>

                                        <p>
                                            Choose which notifications you want to receive.
                                        </p>

                                    </div>

                                </div>



                                {/* =================================
                                    NOTIFICATION SETTINGS
                                ================================== */}

                                <div className="notification-settings">


                                    {/* =================================
                                        NEW ORDERS
                                    ================================== */}

                                    <div className="notification-row">


                                        <div className="notification-info">

                                            <div className="notification-icon">

                                                <i className="fa-solid fa-cart-shopping"></i>

                                            </div>


                                            <div>

                                                <h3>
                                                    New Orders
                                                </h3>

                                                <p>
                                                    Get notified whenever a new order is placed.
                                                </p>

                                            </div>

                                        </div>



                                        <button
                                            type="button"
                                            className={
                                                notifications.newOrders
                                                    ? "toggle active"
                                                    : "toggle"
                                            }
                                            onClick={() =>
                                                handleNotificationChange(
                                                    "newOrders"
                                                )
                                            }
                                            aria-label="Toggle new order notifications"
                                        >

                                            <span></span>

                                        </button>


                                    </div>



                                    {/* =================================
                                        LOW STOCK
                                    ================================== */}

                                    <div className="notification-row">


                                        <div className="notification-info">

                                            <div className="notification-icon">

                                                <i className="fa-solid fa-triangle-exclamation"></i>

                                            </div>


                                            <div>

                                                <h3>
                                                    Low Stock Alerts
                                                </h3>

                                                <p>
                                                    Receive alerts when products are running low.
                                                </p>

                                            </div>

                                        </div>



                                        <button
                                            type="button"
                                            className={
                                                notifications.lowStock
                                                    ? "toggle active"
                                                    : "toggle"
                                            }
                                            onClick={() =>
                                                handleNotificationChange(
                                                    "lowStock"
                                                )
                                            }
                                            aria-label="Toggle low stock notifications"
                                        >

                                            <span></span>

                                        </button>


                                    </div>



                                    {/* =================================
                                        NEW CUSTOMERS
                                    ================================== */}

                                    <div className="notification-row">


                                        <div className="notification-info">

                                            <div className="notification-icon">

                                                <i className="fa-solid fa-user-plus"></i>

                                            </div>


                                            <div>

                                                <h3>
                                                    New Customers
                                                </h3>

                                                <p>
                                                    Get notified when a new customer registers.
                                                </p>

                                            </div>

                                        </div>



                                        <button
                                            type="button"
                                            className={
                                                notifications.newCustomers
                                                    ? "toggle active"
                                                    : "toggle"
                                            }
                                            onClick={() =>
                                                handleNotificationChange(
                                                    "newCustomers"
                                                )
                                            }
                                            aria-label="Toggle new customer notifications"
                                        >

                                            <span></span>

                                        </button>


                                    </div>



                                    {/* =================================
                                        ORDER UPDATES
                                    ================================== */}

                                    <div className="notification-row">


                                        <div className="notification-info">

                                            <div className="notification-icon">

                                                <i className="fa-solid fa-truck"></i>

                                            </div>


                                            <div>

                                                <h3>
                                                    Order Updates
                                                </h3>

                                                <p>
                                                    Receive updates when an order status changes.
                                                </p>

                                            </div>

                                        </div>



                                        <button
                                            type="button"
                                            className={
                                                notifications.orderUpdates
                                                    ? "toggle active"
                                                    : "toggle"
                                            }
                                            onClick={() =>
                                                handleNotificationChange(
                                                    "orderUpdates"
                                                )
                                            }
                                            aria-label="Toggle order update notifications"
                                        >

                                            <span></span>

                                        </button>


                                    </div>


                                </div>


                            </section>

                        )}
                                                {/* =================================
                            ORDER SETTINGS
                        ================================== */}

                        {activeTab === "orders" && (

                            <section className="settings-card">


                                {/* =================================
                                    CARD HEADER
                                ================================== */}

                                <div className="settings-card-header">

                                    <div>

                                        <h2>
                                            Order Settings
                                        </h2>

                                        <p>
                                            Configure how orders are handled in your store.
                                        </p>

                                    </div>

                                </div>



                                {/* =================================
                                    ORDER SETTINGS FORM
                                ================================== */}

                                <div className="settings-form">


                                    {/* =================================
                                        DEFAULT ORDER STATUS
                                    ================================== */}

                                    <div className="form-group">

                                        <label>
                                            Default Order Status
                                        </label>


                                        <select
                                            name="defaultStatus"
                                            value={
                                                orderSettings.defaultStatus
                                            }
                                            onChange={
                                                handleOrderSettingChange
                                            }
                                        >

                                            <option value="Pending">
                                                Pending
                                            </option>

                                            <option value="Processing">
                                                Processing
                                            </option>

                                            <option value="Shipped">
                                                Shipped
                                            </option>

                                            <option value="Delivered">
                                                Delivered
                                            </option>

                                        </select>


                                        <small>
                                            New orders will initially use this status.
                                        </small>

                                    </div>



                                    {/* =================================
                                        ORDERS PER PAGE
                                    ================================== */}

                                    <div className="form-group">

                                        <label>
                                            Orders Per Page
                                        </label>


                                        <select
                                            name="ordersPerPage"
                                            value={
                                                orderSettings.ordersPerPage
                                            }
                                            onChange={
                                                handleOrderSettingChange
                                            }
                                        >

                                            <option value="10">
                                                10
                                            </option>

                                            <option value="20">
                                                20
                                            </option>

                                            <option value="30">
                                                30
                                            </option>

                                            <option value="50">
                                                50
                                            </option>

                                            <option value="100">
                                                100
                                            </option>

                                        </select>


                                        <small>
                                            Number of orders displayed on each page.
                                        </small>

                                    </div>


                                </div>


                            </section>

                        )}



                        {/* =================================
                            SECURITY
                        ================================== */}

                        {activeTab === "security" && (

                            <section className="settings-card">


                                {/* =================================
                                    CARD HEADER
                                ================================== */}

                                <div className="settings-card-header">

                                    <div>

                                        <h2>
                                            Security
                                        </h2>

                                        <p>
                                            Manage your administrator password and account security.
                                        </p>

                                    </div>

                                </div>



                                {/* =================================
                                    PASSWORD FORM
                                ================================== */}

                                <div className="settings-form">


                                    {/* =================================
                                        CURRENT PASSWORD
                                    ================================== */}

                                    <div className="form-group full-width">

                                        <label>
                                            Current Password
                                        </label>


                                        <input
                                            type="password"
                                            name="current"
                                            value={
                                                passwords.current
                                            }
                                            onChange={
                                                handlePasswordChange
                                            }
                                            placeholder="Enter your current password"
                                            autoComplete="current-password"
                                        />


                                        <small>
                                            Enter your current password to make security changes.
                                        </small>

                                    </div>



                                    {/* =================================
                                        NEW PASSWORD
                                    ================================== */}

                                    <div className="form-group">

                                        <label>
                                            New Password
                                        </label>


                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={
                                                passwords.newPassword
                                            }
                                            onChange={
                                                handlePasswordChange
                                            }
                                            placeholder="Enter new password"
                                            autoComplete="new-password"
                                        />


                                        <small>
                                            Password must contain at least 6 characters.
                                        </small>

                                    </div>



                                    {/* =================================
                                        CONFIRM PASSWORD
                                    ================================== */}

                                    <div className="form-group">

                                        <label>
                                            Confirm New Password
                                        </label>


                                        <input
                                            type="password"
                                            name="confirm"
                                            value={
                                                passwords.confirm
                                            }
                                            onChange={
                                                handlePasswordChange
                                            }
                                            placeholder="Confirm new password"
                                            autoComplete="new-password"
                                        />


                                        <small>

                                            {passwords.confirm &&
                                            passwords.newPassword !==
                                            passwords.confirm ? (

                                                <span className="password-error">
                                                    Passwords do not match.
                                                </span>

                                            ) : passwords.confirm &&
                                              passwords.newPassword ===
                                              passwords.confirm ? (

                                                <span className="password-success">
                                                    Passwords match.
                                                </span>

                                            ) : (

                                                "Re-enter your new password."

                                            )}

                                        </small>

                                    </div>


                                </div>



                                {/* =================================
                                    SECURITY NOTICE
                                ================================== */}

                                <div className="security-notice">


                                    <i className="fa-solid fa-shield-halved"></i>


                                    <div>

                                        <h3>
                                            Keep your account secure
                                        </h3>


                                        <p>
                                            Use a strong password and never share your administrator credentials with anyone.
                                        </p>

                                    </div>


                                </div>


                            </section>

                        )}
                                        {/* =========================================
                    END SETTINGS CONTENT
                ========================================== */}

   
                    </div>


                </div>


                {/* =========================================
                    SETTINGS FOOTER
                ========================================== */}

                <footer className="admin-footer">

                    <p>
                        © 2026 Bad Teddy Admin Panel
                    </p>

                    <p>
                        Built using React • PHP • MySQL
                    </p>

                </footer>


            </main>


        </div>

    );

}


export default Adminsettings;