import { useState } from "react";
import "../styles/login12.css";
import { useNavigate } from "react-router-dom";

import loginBg from "../assets/loginbg.png";
import logo from "../assets/fontimg.png";

import "@fortawesome/fontawesome-free/css/all.min.css";


function Login({ setLoggedIn }) {
    const navigate = useNavigate();

    /* =========================================
       FORM STATE
    ========================================= */

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    /* =========================================
       LOGIN FUNCTION
       Backend-ready
    ========================================= */

    const handleLogin = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        /* Basic frontend validation */

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        if (!password.trim()) {
            setError("Please enter your password.");
            return;
        }


        try {

            setLoading(true);


            /*
                BACKEND REQUEST

                React
                    ↓
                PHP API
                    ↓
                MySQL
            */

            const response = await fetch(
    "http://localhost/BAD%20TEDDY/backend/api/login.php",
    {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            email: email.trim(),
            password: password
        })
    }
);


            /* Check HTTP response */

            if (!response.ok) {
                throw new Error(
                    "Unable to connect to the server."
                );
            }


            /* Convert PHP response to JSON */

            const data = await response.json();


            console.log("Login response:", data);


            /* =========================================
   SUCCESS
========================================= */

if (data.success) {

    setSuccess("Login successful.");

    /* Store user information */

    if (data.user) {

        localStorage.setItem(
            "badTeddyUser",
            JSON.stringify(data.user)
        );

    }

    /* Store login status */

    localStorage.setItem(
        "badTeddyLoggedIn",
        "true"
    );

    /* Tell App.jsx that login succeeded */

    if (setLoggedIn) {
        setLoggedIn(true);
    }

    /* Go to Home */

    navigate("/");

}


            /* =========================================
               LOGIN FAILED
            ========================================= */

            else {

                setError(
                    data.message ||
                    "Invalid email or password."
                );

            }

        }

        catch (error) {

            console.error(
                "Login error:",
                error
            );


            setError(
                "Unable to connect to the server. Please try again."
            );

        }

        finally {

            setLoading(false);

        }

    };


    /* =========================================
       RETURN UI
    ========================================= */

    return (

        <div className="container">


            {/* =====================================
                LEFT SIDE
            ===================================== */}

            <div className="left">

                <div className="overlay"></div>


                <img
                    className="login-bg"
                    src={loginBg}
                    alt="Bad Teddy Model"
                />


                <div className="brand">

                    <img
                        className="brand-logo"
                        src={logo}
                        alt="Bad Teddy"
                    />


                    <p>
                        Premium Streetwear Collection
                    </p>

                </div>

            </div>



            {/* =====================================
                RIGHT SIDE
            ===================================== */}

            <div className="right">

                <div className="login-card">


                    <h2>
                        Welcome To Bad Teddy
                    </h2>


                    <p className="subtitle">
                        Sign in to discover your next
                        favorite streetwear fit.
                    </p>



                    {/* =================================
                        LOGIN FORM
                    ================================= */}

                    <form
                        onSubmit={handleLogin}
                        noValidate
                    >


                        {/* EMAIL */}

                        <div className="input-group">

                            <i className="fa-solid fa-envelope"></i>


                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError("");
                                }}
                                autoComplete="email"
                                required
                            />


                            <label>
                                Email Address
                            </label>

                        </div>



                        {/* PASSWORD */}

                        <div className="input-group">

                            <i className="fa-solid fa-lock"></i>


                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError("");
                                }}
                                autoComplete="current-password"
                                required
                            />


                            <label>
                                Password
                            </label>


                            {/* PASSWORD TOGGLE */}

                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
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



                        {/* =================================
                            ERROR MESSAGE
                        ================================= */}

                        {error && (

                            <div className="login-message error">

                                <i className="fa-solid fa-circle-exclamation"></i>

                                <span>
                                    {error}
                                </span>

                            </div>

                        )}



                        {/* =================================
                            SUCCESS MESSAGE
                        ================================= */}

                        {success && (

                            <div className="login-message success">

                                <i className="fa-solid fa-circle-check"></i>

                                <span>
                                    {success}
                                </span>

                            </div>

                        )}



                        {/* =================================
                            OPTIONS
                        ================================= */}

                        <div className="options">

                            <label>

                                <input
                                    type="checkbox"
                                    name="remember"
                                />

                                Remember Me

                            </label>


                            <button
                                type="button"
                                className="forgot-password"
                            >
                                Forgot Password?
                            </button>

                        </div>



                        {/* =================================
                            LOGIN BUTTON
                        ================================= */}

                        <button
                            type="submit"
                            className="login-btn"
                            disabled={loading}
                        >

                            {loading ? (

                                <>
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    SIGNING IN...
                                </>

                            ) : (

                                "LOGIN"

                            )}

                        </button>



                        {/* =================================
                            DIVIDER
                        ================================= */}

                        <div className="divider">

                            <span></span>

                            OR

                            <span></span>

                        </div>



                        {/* =================================
                            SOCIAL LOGIN
                        ================================= */}

                        <div className="social-login">

                            <button
                                type="button"
                                aria-label="Google Login"
                            >
                                <i className="fab fa-google"></i>
                            </button>


                            <button
                                type="button"
                                aria-label="Apple Login"
                            >
                                <i className="fab fa-apple"></i>
                            </button>


                            <button
                                type="button"
                                aria-label="Facebook Login"
                            >
                                <i className="fab fa-facebook-f"></i>
                            </button>

                        </div>



                        {/* =================================
                            SIGNUP
                        ================================= */}

                        <p className="signup">

                            Don't have an account?

                            <button
                                type="button"
                                className="signup-link"
                                onClick={() => navigate("/register")}
                            >
                                Create Account
                            </button>

                        </p>


                    </form>

                </div>

            </div>

        </div>

    );

}


export default Login;