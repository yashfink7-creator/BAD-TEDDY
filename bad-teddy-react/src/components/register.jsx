import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../styles/Register.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import logo from "../assets/mylogo.png";


function Register() {

    const navigate = useNavigate();


    /* =========================================
       FORM STATES
    ========================================= */

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");


    /* =========================================
       UI STATES
    ========================================= */

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    /* =========================================
       PASSWORD STRENGTH
    ========================================= */

    const getPasswordStrength = () => {

        if (!password) {
            return {
                text: "",
                level: 0
            };
        }

        let score = 0;

        if (password.length >= 8) {
            score++;
        }

        if (/[A-Z]/.test(password)) {
            score++;
        }

        if (/[0-9]/.test(password)) {
            score++;
        }

        if (/[^A-Za-z0-9]/.test(password)) {
            score++;
        }


        if (score <= 1) {
            return {
                text: "Weak",
                level: 1
            };
        }

        if (score === 2) {
            return {
                text: "Fair",
                level: 2
            };
        }

        if (score === 3) {
            return {
                text: "Good",
                level: 3
            };
        }

        return {
            text: "Strong",
            level: 4
        };
    };


    const passwordStrength = getPasswordStrength();


    /* =========================================
       REGISTER
    ========================================= */

    const handleRegister = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");


        /* =====================================
           BASIC VALIDATION
        ===================================== */

        if (
            !name.trim() ||
            !email.trim() ||
            !phone.trim() ||
            !password ||
            !confirmPassword
        ) {

            setError("Please fill in all the fields.");

            return;
        }


        /* =====================================
           PASSWORD MATCH
        ===================================== */

        if (password !== confirmPassword) {

            setError("Passwords do not match.");

            return;
        }


        /* =====================================
           PASSWORD LENGTH
        ===================================== */

        if (password.length < 8) {

            setError(
                "Password must be at least 8 characters."
            );

            return;
        }


        /* =====================================
           PHONE VALIDATION
        ===================================== */

        const phonePattern = /^[0-9]{10}$/;

        if (!phonePattern.test(phone.trim())) {

            setError(
                "Please enter a valid 10-digit phone number."
            );

            return;
        }


        /* =====================================
           START LOADING
        ===================================== */

        setLoading(true);


        try {

            /* =================================
               SEND DATA TO PHP
            ================================= */

            const response = await fetch(
                "http://localhost/BAD%20TEDDY/backend/api/register.php",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        name: name.trim(),

                        email: email.trim(),

                        phone: phone.trim(),

                        password: password

                    })
                }
            );


            /* =================================
               HTTP ERROR
            ================================= */

            if (!response.ok) {

                throw new Error(
                    "Unable to connect to the server."
                );

            }


            /* =================================
               PHP RESPONSE
            ================================= */

            const data = await response.json();


            console.log(
                "Register response:",
                data
            );


            /* =================================
               SUCCESS
            ================================= */

            if (data.success) {

                setSuccess(
                    "Account created successfully!"
                );


                /* ===============================
                   CLEAR FORM
                =============================== */

                setName("");
                setEmail("");
                setPhone("");
                setPassword("");
                setConfirmPassword("");


                /* ===============================
                   REDIRECT TO LOGIN
                =============================== */

                setTimeout(() => {

                    navigate("/login");

                }, 1800);

            }


            /* =================================
               ERROR FROM PHP
            ================================= */

            else {

                setError(
                    data.message ||
                    "Unable to create account."
                );

            }


        } catch (error) {

            console.error(
                "Register error:",
                error
            );

            setError(
                "Unable to connect to the server. Please try again."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="register-page">


            {/* =====================================
                BACKGROUND DECORATION
            ===================================== */}

            <div className="register-glow register-glow-one"></div>

            <div className="register-glow register-glow-two"></div>


            {/* =====================================
                TOP BRAND
            ===================================== */}

            <header className="register-header">

                <Link
                    to="/"
                    className="register-logo"
                >

                    <img
                        src={logo}
                        alt="Bad Teddy"
                    />

                </Link>

                <span>
                    PREMIUM STREETWEAR
                </span>

            </header>


            {/* =====================================
                MAIN
            ===================================== */}

            <main className="register-container">


                {/* =================================
                    LEFT BRAND SECTION
                ================================= */}

                <section className="register-showcase">

                    <div className="showcase-content">

                        <span className="showcase-eyebrow">
                            JOIN THE MOVEMENT
                        </span>

                        <h1>
                            Wear Your
                            <span> Attitude.</span>
                        </h1>

                        <p>
                            Create your Bad Teddy account and
                            step into a world where streetwear
                            meets individuality.
                        </p>


                        {/* FEATURE ITEMS */}

                        <div className="register-features">

                            <div className="register-feature">

                                <div className="feature-icon">
                                    <i className="fa-solid fa-bolt"></i>
                                </div>

                                <div>
                                    <strong>
                                        Early Access
                                    </strong>

                                    <span>
                                        Be first to discover new drops.
                                    </span>
                                </div>

                            </div>


                            <div className="register-feature">

                                <div className="feature-icon">
                                    <i className="fa-solid fa-crown"></i>
                                </div>

                                <div>
                                    <strong>
                                        Streetwear Insider
                                    </strong>

                                    <span>
                                        Earn rewards while you shop.
                                    </span>
                                </div>

                            </div>


                            <div className="register-feature">

                                <div className="feature-icon">
                                    <i className="fa-solid fa-robot"></i>
                                </div>

                                <div>
                                    <strong>
                                        AI Style Assistant
                                    </strong>

                                    <span>
                                        Get personalized fashion help.
                                    </span>
                                </div>

                            </div>

                        </div>


                        {/* BRAND QUOTE */}

                        <div className="register-quote">

                            <span>
                                "DON'T FOLLOW THE CROWD."
                            </span>

                            <small>
                                BAD TEDDY
                            </small>

                        </div>

                    </div>

                </section>


                {/* =================================
                    REGISTER CARD
                ================================= */}

                <section className="register-card">


                    {/* CARD HEADER */}

                    <div className="register-card-header">

                        <span className="card-eyebrow">
                            CREATE ACCOUNT
                        </span>

                        <h2>
                            Welcome to
                            <span> Bad Teddy.</span>
                        </h2>

                        <p>
                            Create your account and make
                            streetwear yours.
                        </p>

                    </div>


                    {/* =================================
                        FORM
                    ================================= */}

                    <form
                        className="register-form"
                        onSubmit={handleRegister}
                    >


                        {/* NAME */}

                        <div className="register-input-group">

                            <label>
                                Full Name
                            </label>

                            <div className="register-input">

                                <i className="fa-regular fa-user"></i>

                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={name}
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                />

                            </div>

                        </div>


                        {/* EMAIL */}

                        <div className="register-input-group">

                            <label>
                                Email Address
                            </label>

                            <div className="register-input">

                                <i className="fa-regular fa-envelope"></i>

                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                />

                            </div>

                        </div>


                        {/* PHONE */}

                        <div className="register-input-group">

                            <label>
                                Phone Number
                            </label>

                            <div className="register-input">

                                <i className="fa-solid fa-mobile-screen"></i>

                                <input
                                    type="tel"
                                    placeholder="10-digit mobile number"
                                    maxLength="10"
                                    value={phone}
                                    onChange={(e) =>
                                        setPhone(
                                            e.target.value.replace(
                                                /\D/g,
                                                ""
                                            )
                                        )
                                    }
                                />

                            </div>

                        </div>


                        {/* PASSWORD */}

                        <div className="register-input-group">

                            <label>
                                Password
                            </label>

                            <div className="register-input">

                                <i className="fa-solid fa-lock"></i>

                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(
                                            e.target.value
                                        )
                                    }
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                >

                                    <i
                                        className={
                                            showPassword
                                                ? "fa-solid fa-eye-slash"
                                                : "fa-solid fa-eye"
                                        }
                                    ></i>

                                </button>

                            </div>


                            {/* PASSWORD STRENGTH */}

                            {password && (

                                <div className="password-strength">

                                    <div className="strength-bars">

                                        {[1, 2, 3, 4].map(
                                            (bar) => (

                                                <span
                                                    key={bar}
                                                    className={
                                                        bar <=
                                                        passwordStrength.level
                                                            ? "filled"
                                                            : ""
                                                    }
                                                ></span>

                                            )
                                        )}

                                    </div>

                                    <small>
                                        {passwordStrength.text}
                                    </small>

                                </div>

                            )}

                        </div>


                        {/* CONFIRM PASSWORD */}

                        <div className="register-input-group">

                            <label>
                                Confirm Password
                            </label>

                            <div className="register-input">

                                <i className="fa-solid fa-shield-halved"></i>

                                <input
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(
                                            e.target.value
                                        )
                                    }
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                >

                                    <i
                                        className={
                                            showConfirmPassword
                                                ? "fa-solid fa-eye-slash"
                                                : "fa-solid fa-eye"
                                        }
                                    ></i>

                                </button>

                            </div>

                        </div>


                        {/* TERMS */}

                        <label className="terms-check">

                            <input
                                type="checkbox"
                                required
                            />

                            <span>
                                I agree to the Bad Teddy
                                <a href="#terms">
                                    Terms & Conditions
                                </a>
                                and
                                <a href="#privacy">
                                    Privacy Policy
                                </a>
                            </span>

                        </label>


                        {/* ERROR */}

                        {error && (

                            <div className="register-message error">

                                <i className="fa-solid fa-circle-exclamation"></i>

                                <span>
                                    {error}
                                </span>

                            </div>

                        )}


                        {/* SUCCESS */}

                        {success && (

                            <div className="register-message success">

                                <i className="fa-solid fa-circle-check"></i>

                                <span>
                                    {success}
                                </span>

                            </div>

                        )}


                        {/* REGISTER BUTTON */}

                        <button
                            type="submit"
                            className="register-btn"
                            disabled={loading}
                        >

                            {loading ? (

                                <>
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    Creating Account...
                                </>

                            ) : (

                                <>
                                    CREATE ACCOUNT
                                    <i className="fa-solid fa-arrow-right"></i>
                                </>

                            )}

                        </button>


                    </form>


                    {/* LOGIN */}

                    <div className="login-link">

                        <span>
                            Already have an account?
                        </span>

                        <Link to="/login">
                            LOGIN
                            <i className="fa-solid fa-arrow-right"></i>
                        </Link>

                    </div>


                    {/* SECURITY */}

                    <div className="register-security">

                        <i className="fa-solid fa-shield-halved"></i>

                        <span>
                            Your information is protected
                        </span>

                    </div>

                </section>

            </main>


            {/* =====================================
                FOOTER
            ===================================== */}

            <footer className="register-footer">

                <span>
                    © 2026 BAD TEDDY
                </span>

                <span>
                    EST. 2023
                </span>

                <span>
                    PREMIUM STREETWEAR
                </span>

            </footer>


        </div>

    );

}

export default Register;