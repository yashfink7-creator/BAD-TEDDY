import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../styles/admin-login.css";
import myLogo from "../assets/mylogo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

function AdminLogin() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Determine redirect destination if navigated from protected route
    const redirectPath = location.state?.from || "/admin";

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!email.trim()) {
            setError("Please enter your admin email address.");
            return;
        }

        if (!password.trim()) {
            setError("Please enter your admin password.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch("http://localhost/BAD%20TEDDY/backend/api/admin_login.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password
                })
            });

            const data = await response.json();

            if (data.success && data.admin) {
                setSuccess("Authentication successful. Redirecting to Admin Dashboard...");

                // Store Admin session independently from customer account
                localStorage.setItem("badTeddyAdminUser", JSON.stringify(data.admin));
                localStorage.setItem("badTeddyAdminToken", data.admin.token);

                setTimeout(() => {
                    navigate(redirectPath, { replace: true });
                }, 600);
            } else {
                setError(data.message || "Invalid administrator credentials. Access denied.");
            }
        } catch (err) {
            console.error("Admin Login Error:", err);
            // Fallback for offline demo credentials
            if (email.trim().toLowerCase() === "admin@badteddy.com" && password === "admin123") {
                const fallbackAdmin = {
                    id: 1,
                    name: "Bad Teddy Super Admin",
                    email: "admin@badteddy.com",
                    role: "Super Admin",
                    token: "BT_ADMIN_FALLBACK_TOKEN_2026"
                };
                localStorage.setItem("badTeddyAdminUser", JSON.stringify(fallbackAdmin));
                localStorage.setItem("badTeddyAdminToken", fallbackAdmin.token);
                setSuccess("Demo Administrator Login successful. Redirecting...");
                setTimeout(() => {
                    navigate(redirectPath, { replace: true });
                }, 600);
            } else {
                setError("Unable to authenticate with backend server. Check connection.");
            }
        } finally {
            setLoading(false);
        }
    };

    const fillDemoCredentials = () => {
        setEmail("admin@badteddy.com");
        setPassword("admin123");
        setError("");
    };

    return (
        <div className="admin-login-wrapper">
            <div className="admin-login-container">
                {/* Brand Header */}
                <div className="admin-login-brand">
                    <img src={myLogo} alt="Bad Teddy" className="admin-login-logo" />
                    <span className="admin-badge">PORTAL ACCESS</span>
                    <h1>BAD TEDDY</h1>
                    <p>Super Administrator Control Center</p>
                </div>

                {/* Status Message */}
                {error && (
                    <div className="admin-login-alert error">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="admin-login-alert success">
                        <i className="fa-solid fa-circle-check"></i>
                        <span>{success}</span>
                    </div>
                )}

                {/* Login Form */}
                <form className="admin-login-form" onSubmit={handleAdminLogin}>
                    <div className="form-group">
                        <label>
                            <i className="fa-regular fa-envelope"></i> Admin Email
                        </label>
                        <input
                            type="email"
                            placeholder="admin@badteddy.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <i className="fa-solid fa-lock"></i> Security Password
                        </label>
                        <div className="password-input-wrap">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                            </button>
                        </div>
                    </div>

                    {/* Quick Demo Credentials Autofill */}
                    <div className="demo-credentials-hint" onClick={fillDemoCredentials}>
                        <i className="fa-solid fa-key"></i>
                        <span>Click to auto-fill default admin credentials (<code>admin@badteddy.com / admin123</code>)</span>
                    </div>

                    <button type="submit" className="admin-submit-btn" disabled={loading}>
                        {loading ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i> Authenticating...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-shield-halved"></i> Access Admin Dashboard
                            </>
                        )}
                    </button>
                </form>

                {/* Security Notice & Customer Storefront Link */}
                <div className="admin-login-footer">
                    <p className="security-notice">
                        <i className="fa-solid fa-shield-cat"></i> Authorized personnel only. All access is encrypted & logged.
                    </p>
                    <Link to="/" className="back-to-store">
                        <i className="fa-solid fa-arrow-left"></i> Return to Customer Storefront
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;
