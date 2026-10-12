import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "../styles/savedadd.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import logo from "../assets/mylogo.png";


function SavedAdd() {

    const navigate = useNavigate();
    const location = useLocation();


    /* =====================================================
       DEFAULT ADDRESS
    ===================================================== */

    const emptyAddress = {
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        landmark: "",
        city: "",
        state: "",
        pincode: "",
    };


    /* =====================================================
       STATE
    ===================================================== */

    const [formData, setFormData] = useState(emptyAddress);

    const [saved, setSaved] = useState(false);

    const [errors, setErrors] = useState({});

    const [isSaving, setIsSaving] = useState(false);


    const loggedInUser = (() => {
        try {
            const savedUser = localStorage.getItem("badTeddyUser");
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    })();

    /* =====================================================
       LOAD SAVED ADDRESS
    ===================================================== */

    useEffect(() => {
        const loadAddress = async () => {
            // First check localStorage
            try {
                const storedAddress = localStorage.getItem("badTeddyAddress");
                if (storedAddress) {
                    const parsedAddress = JSON.parse(storedAddress);
                    setFormData({
                        firstName: parsedAddress.firstName || "",
                        lastName: parsedAddress.lastName || "",
                        phone: parsedAddress.phone || "",
                        address: parsedAddress.address || "",
                        landmark: parsedAddress.landmark || "",
                        city: parsedAddress.city || "",
                        state: parsedAddress.state || "",
                        pincode: parsedAddress.pincode || "",
                    });
                    setSaved(true);
                }
            } catch (error) {
                console.error("Unable to load saved address from storage:", error);
            }

            // If user is logged in, fetch default address from backend
            if (loggedInUser?.id) {
                try {
                    const response = await fetch(
                        `http://localhost/BAD%20TEDDY/backend/api/addresses.php?user_id=${loggedInUser.id}`
                    );
                    const data = await response.json();
                    if (data.success && Array.isArray(data.addresses) && data.addresses.length > 0) {
                        const defaultAddr = data.addresses.find(a => a.isDefault) || data.addresses[0];
                        const cleanAddr = {
                            firstName: defaultAddr.firstName || "",
                            lastName: defaultAddr.lastName || "",
                            phone: defaultAddr.phone || "",
                            address: defaultAddr.address || "",
                            landmark: defaultAddr.landmark || "",
                            city: defaultAddr.city || "",
                            state: defaultAddr.state || "",
                            pincode: defaultAddr.pincode || "",
                        };
                        setFormData(cleanAddr);
                        setSaved(true);
                        localStorage.setItem("badTeddyAddress", JSON.stringify(cleanAddr));
                    }
                } catch (error) {
                    console.error("Unable to load address from API:", error);
                }
            }
        };

        loadAddress();
    }, []);


    /* =====================================================
       HANDLE INPUT
    ===================================================== */

    const handleChange = (e) => {

        const { name, value } = e.target;

        let newValue = value;


        /* PHONE */

        if (name === "phone") {

            newValue = value
                .replace(/\D/g, "")
                .slice(0, 10);

        }


        /* PINCODE */

        if (name === "pincode") {

            newValue = value
                .replace(/\D/g, "")
                .slice(0, 6);

        }


        setFormData((previous) => ({
            ...previous,
            [name]: newValue,
        }));


        /* REMOVE FIELD ERROR */

        setErrors((previous) => ({
            ...previous,
            [name]: "",
        }));


        setSaved(false);

    };


    /* =====================================================
       VALIDATE ADDRESS
    ===================================================== */

    const validateAddress = () => {

        const newErrors = {};


        /* FIRST NAME */

        if (!formData.firstName.trim()) {

            newErrors.firstName =
                "Please enter your first name.";

        } else if (formData.firstName.trim().length < 2) {

            newErrors.firstName =
                "First name must contain at least 2 characters.";

        }


        /* LAST NAME */

        if (!formData.lastName.trim()) {

            newErrors.lastName =
                "Please enter your last name.";

        } else if (formData.lastName.trim().length < 2) {

            newErrors.lastName =
                "Last name must contain at least 2 characters.";

        }


        /* PHONE */

        if (!formData.phone.trim()) {

            newErrors.phone =
                "Please enter your mobile number.";

        } else if (!/^[6-9][0-9]{9}$/.test(formData.phone)) {

            newErrors.phone =
                "Enter a valid 10-digit Indian mobile number.";

        }


        /* ADDRESS */

        if (!formData.address.trim()) {

            newErrors.address =
                "Please enter your complete address.";

        } else if (formData.address.trim().length < 5) {

            newErrors.address =
                "Please enter a more complete address.";

        }


        /* CITY */

        if (!formData.city.trim()) {

            newErrors.city =
                "Please enter your city.";

        }


        /* STATE */

        if (!formData.state.trim()) {

            newErrors.state =
                "Please enter your state.";

        }


        /* PINCODE */

        if (!formData.pincode.trim()) {

            newErrors.pincode =
                "Please enter your pincode.";

        } else if (!/^[1-9][0-9]{5}$/.test(formData.pincode)) {

            newErrors.pincode =
                "Enter a valid 6-digit Indian pincode.";

        }


        setErrors(newErrors);


        return Object.keys(newErrors).length === 0;

    };


    /* =====================================================
       SAVE ADDRESS
    ===================================================== */

    const handleSaveAddress = async (e) => {
        e.preventDefault();

        /* VALIDATE */
        const isValid = validateAddress();
        if (!isValid) {
            return;
        }

        setIsSaving(true);

        try {
            /* CREATE CLEAN ADDRESS OBJECT */
            const addressToSave = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                landmark: formData.landmark.trim(),
                city: formData.city.trim(),
                state: formData.state.trim(),
                pincode: formData.pincode.trim(),
            };

            /* SAVE TO LOCAL STORAGE */
            localStorage.setItem(
                "badTeddyAddress",
                JSON.stringify(addressToSave)
            );

            /* SAVE TO BACKEND IF LOGGED IN */
            if (loggedInUser?.id) {
                try {
                    await fetch("http://localhost/BAD%20TEDDY/backend/api/addresses.php", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            user_id: loggedInUser.id,
                            ...addressToSave,
                            is_default: 1
                        })
                    });
                } catch (err) {
                    console.error("Backend address sync error:", err);
                }
            }

            /* UPDATE STATE */
            setFormData(addressToSave);
            setSaved(true);
            setErrors({});

            /* NOTIFY OTHER COMPONENTS */
            window.dispatchEvent(
                new Event("badTeddyAddressUpdated")
            );

            /* SUCCESS MESSAGE */
            setTimeout(() => {
                setIsSaving(false);
            }, 500);

        } catch (error) {
            console.error("Unable to save address:", error);
            setIsSaving(false);
            alert("Unable to save your address. Please try again.");
        }
    };


    /* =====================================================
       REMOVE ADDRESS
    ===================================================== */

    const handleRemoveAddress = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to remove your saved address?"
        );

        if (!confirmed) {
            return;
        }

        localStorage.removeItem("badTeddyAddress");

        if (loggedInUser?.id) {
            try {
                await fetch(`http://localhost/BAD%20TEDDY/backend/api/addresses.php?user_id=${loggedInUser.id}`, {
                    method: "DELETE"
                });
            } catch (err) {
                console.error("Backend address delete error:", err);
            }
        }

        setFormData({
            ...emptyAddress
        });
        setErrors({});
        setSaved(false);

        window.dispatchEvent(
            new Event("badTeddyAddressUpdated")
        );
    };


    /* =====================================================
       RESET FORM
    ===================================================== */

    const handleReset = () => {

        const storedAddress =
            localStorage.getItem("badTeddyAddress");


        if (storedAddress) {

            try {

                const parsed =
                    JSON.parse(storedAddress);

                setFormData({
                    firstName: parsed.firstName || "",
                    lastName: parsed.lastName || "",
                    phone: parsed.phone || "",
                    address: parsed.address || "",
                    landmark: parsed.landmark || "",
                    city: parsed.city || "",
                    state: parsed.state || "",
                    pincode: parsed.pincode || "",
                });

                setSaved(true);
                setErrors({});

            } catch {

                setFormData({
                    ...emptyAddress
                });

            }

        } else {

            setFormData({
                ...emptyAddress
            });

            setSaved(false);

        }

    };


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className="saved-address-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <header className="saved-address-header">


                {/* BACK */}

                <button
                    className="saved-address-back"
                    onClick={() => navigate("/profile")}
                    aria-label="Back to profile"
                >

                    <i className="fa-solid fa-arrow-left"></i>

                </button>


                {/* LOGO */}

                <img
                    src={logo}
                    alt="Bad Teddy"
                    className="saved-address-logo"
                />


                {/* HEADER ACTIONS */}

                <div className="saved-address-header-actions">


                    {/* WISHLIST */}

                    <button
                        className="saved-header-icon"
                        onClick={() => navigate("/wishlist")}
                        aria-label="Wishlist"
                    >

                        <i className="fa-regular fa-heart"></i>

                    </button>


                    {/* CART */}

                    <button
                        className="saved-header-icon"
                        onClick={() => navigate("/cart")}
                        aria-label="Cart"
                    >

                        <i className="fa-solid fa-bag-shopping"></i>

                    </button>


                </div>

            </header>


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="saved-address-main">


                {/* HEADING */}

                <section className="saved-address-heading">

                    <span>
                        ACCOUNT / DELIVERY
                    </span>

                    <h1 className="text-col">
                        Saved Address
                    </h1>

                    <p>
                        Keep your delivery details ready for
                        a faster Bad Teddy checkout.
                    </p>

                </section>


                {/* =================================================
                    FORM
                ================================================= */}

                <form
                    className="saved-address-form"
                    onSubmit={handleSaveAddress}
                >


                    {/* =================================================
                        PERSONAL DETAILS
                    ================================================= */}

                    <section className="address-card">


                        <div className="address-card-heading">

                            <div className="address-number">
                                01
                            </div>

                            <div>

                                <span>
                                    RECIPIENT
                                </span>

                                <h2 className="text-col">
                                    Personal Details
                                </h2>

                            </div>

                        </div>


                        <div className="address-grid">


                            {/* FIRST NAME */}

                            <div className="address-field">

                                <label>
                                    First Name
                                </label>

                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="Enter first name"
                                    autoComplete="given-name"
                                />

                                {errors.firstName && (

                                    <small className="field-error">
                                        {errors.firstName}
                                    </small>

                                )}

                            </div>


                            {/* LAST NAME */}

                            <div className="address-field">

                                <label>
                                    Last Name
                                </label>

                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Enter last name"
                                    autoComplete="family-name"
                                />

                                {errors.lastName && (

                                    <small className="field-error">
                                        {errors.lastName}
                                    </small>

                                )}

                            </div>


                            {/* PHONE */}

                            <div className="address-field full">

                                <label>
                                    Mobile Number
                                </label>

                                <div className="phone-input">

                                    <span>
                                        +91
                                    </span>

                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="10-digit mobile number"
                                        maxLength="10"
                                        inputMode="numeric"
                                        autoComplete="tel"
                                    />

                                </div>

                                {errors.phone && (

                                    <small className="field-error">
                                        {errors.phone}
                                    </small>

                                )}

                            </div>


                        </div>

                    </section>


                    {/* =================================================
                        ADDRESS DETAILS
                    ================================================= */}

                    <section className="address-card">


                        <div className="address-card-heading">

                            <div className="address-number">
                                02
                            </div>

                            <div>

                                <span>
                                    DELIVERY
                                </span>

                                <h2 className="text-col">
                                    Address Details
                                </h2>

                            </div>

                        </div>


                        <div className="address-grid">


                            {/* ADDRESS */}

                            <div className="address-field full">

                                <label>
                                    House / Flat / Street Address
                                </label>

                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="House no., building, street, area..."
                                    rows="4"
                                    autoComplete="street-address"
                                />

                                {errors.address && (

                                    <small className="field-error">
                                        {errors.address}
                                    </small>

                                )}

                            </div>


                            {/* LANDMARK */}

                            <div className="address-field full">

                                <label>

                                    Landmark

                                    <span>
                                        Optional
                                    </span>

                                </label>

                                <input
                                    type="text"
                                    name="landmark"
                                    value={formData.landmark}
                                    onChange={handleChange}
                                    placeholder="Nearby landmark"
                                />

                            </div>


                            {/* CITY */}

                            <div className="address-field">

                                <label>
                                    City
                                </label>

                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="Mumbai"
                                    autoComplete="address-level2"
                                />

                                {errors.city && (

                                    <small className="field-error">
                                        {errors.city}
                                    </small>

                                )}

                            </div>


                            {/* STATE */}

                            <div className="address-field">

                                <label>
                                    State
                                </label>

                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="Maharashtra"
                                    autoComplete="address-level1"
                                />

                                {errors.state && (

                                    <small className="field-error">
                                        {errors.state}
                                    </small>

                                )}

                            </div>


                            {/* PINCODE */}

                            <div className="address-field">

                                <label>
                                    Pincode
                                </label>

                                <input
                                    type="text"
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    placeholder="400050"
                                    maxLength="6"
                                    inputMode="numeric"
                                    autoComplete="postal-code"
                                />

                                {errors.pincode && (

                                    <small className="field-error">
                                        {errors.pincode}
                                    </small>

                                )}

                            </div>


                        </div>

                    </section>


                    {/* =================================================
                        SECURITY
                    ================================================= */}

                    <div className="address-security">

                        <i className="fa-solid fa-shield-halved"></i>

                        <div>

                            <strong>
                                Your address is saved securely
                            </strong>

                            <span>
                                Your details stay on this device
                                and are used to speed up checkout.
                            </span>

                        </div>

                    </div>


                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    <div className="address-actions">


                        {/* REMOVE */}

                        {saved && (

                            <button
                                type="button"
                                className="clear-address-btn"
                                onClick={handleRemoveAddress}
                            >

                                <i className="fa-regular fa-trash-can"></i>

                                REMOVE ADDRESS

                            </button>

                        )}


                        {/* RESET */}

                        <button
                            type="button"
                            className="reset-address-btn"
                            onClick={handleReset}
                        >

                            RESET

                        </button>


                        {/* SAVE */}

                        <button
                            type="submit"
                            className="save-address-btn"
                            disabled={isSaving}
                        >

                            <span>

                                {isSaving
                                    ? "SAVING..."
                                    : saved
                                        ? "UPDATE ADDRESS"
                                        : "SAVE ADDRESS"
                                }

                            </span>

                            <i
                                className={
                                    isSaving
                                        ? "fa-solid fa-spinner fa-spin"
                                        : saved
                                            ? "fa-solid fa-check"
                                            : "fa-solid fa-arrow-right"
                                }
                            ></i>

                        </button>


                    </div>


                    {/* =================================================
                        SUCCESS MESSAGE
                    ================================================= */}

                    {saved && (

                        <div className="address-success">

                            <i className="fa-solid fa-circle-check"></i>

                            <div>

                                <strong>
                                    Address saved successfully
                                </strong>

                                <span>
                                    This address will be available
                                    for your Bad Teddy checkout.
                                </span>

                            </div>

                        </div>

                    )}


                </form>

            </main>


            {/* =================================================
                BOTTOM NAV
            ================================================= */}

            <BottomNav location={location} />

        </div>

    );

}


/* =====================================================
   BOTTOM NAVIGATION
===================================================== */

function BottomNav({ location }) {

    return (

        <nav className="bottom-nav">


            {/* HOME */}

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


            {/* SHOP */}

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


            {/* AI */}

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


            {/* PROFILE */}

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

    );

}


export default SavedAdd;