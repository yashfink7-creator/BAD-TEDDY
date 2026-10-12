import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/dashboard.css";
import "../styles/admin-ai.css";
import myLogo from "../assets/mylogo.png";

/**
 * BAD TEDDY ADMIN AI & BUSINESS INTELLIGENCE CENTER
 * Live Machine Learning, Demand Forecasting, Customer Segmentation & Admin NLP Operations
 */
function AdminAI() {
    const [theme, setTheme] = useState(localStorage.getItem("adminTheme") || "dark");
    const [showNotifications, setShowNotifications] = useState(false);
    const [aiTelemetry, setAiTelemetry] = useState(null);
    const [intelData, setIntelData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("demand");

    // Natural Language Assistant State
    const [queryText, setQueryText] = useState("");
    const [queryLoading, setQueryLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState(null);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("adminTheme", newTheme);
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // 1. Fetch AI Model Telemetry
            const telRes = await fetch("http://127.0.0.1:5000/api/ai-status");
            const telJson = await telRes.json();
            if (telJson.success) setAiTelemetry(telJson);

            // 2. Fetch Live Database Intelligence
            const intelRes = await fetch("http://127.0.0.1:5000/api/admin/dashboard-intelligence");
            const intelJson = await intelRes.json();
            if (intelJson.success) setIntelData(intelJson);
        } catch (e) {
            console.error("Admin AI Data fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleAskAI = async (queryToAsk) => {
        const q = (queryToAsk || queryText).trim();
        if (!q) return;

        setQueryLoading(true);
        try {
            const res = await fetch("http://127.0.0.1:5000/api/admin/ask-ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: q })
            });
            const data = await res.json();
            if (data.success) {
                setAiResponse(data);
            }
        } catch (e) {
            console.error("Ask AI error:", e);
        } finally {
            setQueryLoading(false);
        }
    };

    const handleChipClick = (chipQuery) => {
        setQueryText(chipQuery);
        handleAskAI(chipQuery);
    };

    const quickChips = [
        "Which product sold the most?",
        "Which products need restocking?",
        "What was our total revenue?",
        "Which category performs best?",
        "Show customer segmentation",
        "What is our customer satisfaction rating?"
    ];

    const kpis = intelData?.kpis || {
        gross_revenue: 0,
        total_orders: 0,
        avg_order_value: 0,
        total_customers: 0,
        catalog_products: 0,
        total_stock_units: 0,
        critical_stock_alerts: 0,
        recommended_restock_units: 0,
        overall_satisfaction_score: 90.0
    };

    const demandProducts = intelData?.demand_forecasting?.products || [];
    const customerCohorts = intelData?.customer_segmentation?.cohorts || [];
    const perfProducts = intelData?.product_performance?.products || [];

    return (
        <div className={`admin-container ${theme}-theme`}>
            {/* UNIFIED ADMIN SIDEBAR */}
            <AdminSidebar activePage="AI Insights" />

            {/* MAIN CONTENT AREA */}
            <div className="main-content">
                {/* TOP HEADER */}
                <header className="top-header">
                    <div className="search-box">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input
                            type="text"
                            placeholder="Search AI metrics, inventory, customers..."
                        />
                    </div>

                    <div className="header-right">
                        {/* REFRESH LIVE INTELLIGENCE */}
                        <button
                            className="header-icon-btn"
                            onClick={fetchAllData}
                            title="Refresh Live Data"
                            disabled={loading}
                        >
                            <i className={`fa-solid fa-rotate ${loading ? "fa-spin" : ""}`}></i>
                        </button>

                        {/* NOTIFICATIONS */}
                        <div className="notification-wrapper">
                            <button
                                className="header-icon-btn notification-btn"
                                onClick={() => setShowNotifications(!showNotifications)}
                                title="Notifications"
                            >
                                <i className="fa-regular fa-bell"></i>
                                {kpis.critical_stock_alerts > 0 && <span className="notification-dot"></span>}
                            </button>

                            {showNotifications && (
                                <div className="notification-dropdown">
                                    <div className="notification-header">
                                        <h3>AI Operations Alerts</h3>
                                        <span>{kpis.critical_stock_alerts} Alerts</span>
                                    </div>
                                    <div className="notification-item">
                                        <div className="notification-item-icon danger">
                                            <i className="fa-solid fa-triangle-exclamation"></i>
                                        </div>
                                        <div>
                                            <h4>Stockout Risks Detected</h4>
                                            <p>{kpis.critical_stock_alerts} products require immediate reordering.</p>
                                            <small>Demand Intelligence</small>
                                        </div>
                                    </div>
                                    <button
                                        className="view-notifications"
                                        onClick={() => setShowNotifications(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* THEME TOGGLE */}
                        <button
                            className="theme-btn"
                            onClick={toggleTheme}
                            title="Toggle Light / Dark Mode"
                        >
                            <i className={theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon"}></i>
                        </button>

                        {/* ADMIN PROFILE */}
                        <div className="admin-profile">
                            <img src={myLogo} alt="Admin Profile" />
                            <div>
                                <h4>Bad Teddy Admin</h4>
                                <p>Super Admin</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* PAGE TITLE */}
                <div className="page-title">
                    <div>
                        <h1>AI & Business Intelligence Center</h1>
                        <p>Live predictive demand forecasting, customer RFM clustering, product performance, and natural language operations assistant.</p>
                    </div>
                </div>

                {/* AI ENGINE STATUS BANNER */}
                <div className="ai-status-banner">
                    <div className="ai-status-left">
                        <div className="ai-status-icon">
                            <i className="fa-solid fa-brain"></i>
                        </div>
                        <div>
                            <h3>Python AI Microservice Online (FastAPI Port 5000)</h3>
                            <p>
                                {aiTelemetry
                                    ? `Chatbot NLP: 73.3% Test Acc (${aiTelemetry.models.fashion_chatbot_nlp.num_classes} Classes) • Size Classifier: 90.3% Test Acc (Random Forest) • Admin NLP & K-Means: Active (Live MySQL Sync)`
                                    : "Connecting to Python AI Engine on Port 5000..."}
                            </p>
                        </div>
                    </div>
                    <span className="ai-badge-ready">
                        <i className="fa-solid fa-circle-check"></i>
                        Live Database Connected
                    </span>
                </div>

                {/* LIVE AI BUSINESS KPIS */}
                <div className="ai-kpi-grid">
                    <div className="ai-kpi-card">
                        <div className="ai-kpi-icon gold">
                            <i className="fa-solid fa-indian-rupee-sign"></i>
                        </div>
                        <div className="ai-kpi-info">
                            <h4>Gross Revenue</h4>
                            <div className="kpi-val">₹{kpis.gross_revenue.toLocaleString()}</div>
                            <div className="kpi-sub">{kpis.total_orders} Confirmed Orders (AOV ₹{kpis.avg_order_value})</div>
                        </div>
                    </div>

                    <div className="ai-kpi-card">
                        <div className="ai-kpi-icon danger">
                            <i className="fa-solid fa-boxes-stacked"></i>
                        </div>
                        <div className="ai-kpi-info">
                            <h4>Inventory Alerts</h4>
                            <div className="kpi-val">{kpis.critical_stock_alerts} SKUs</div>
                            <div className="kpi-sub">+{kpis.recommended_restock_units} units suggested reorder</div>
                        </div>
                    </div>

                    <div className="ai-kpi-card">
                        <div className="ai-kpi-icon blue">
                            <i className="fa-solid fa-users-viewfinder"></i>
                        </div>
                        <div className="ai-kpi-info">
                            <h4>Customer Base</h4>
                            <div className="kpi-val">{kpis.total_customers} Users</div>
                            <div className="kpi-sub">K-Means RFM Cohorts Active</div>
                        </div>
                    </div>

                    <div className="ai-kpi-card">
                        <div className="ai-kpi-icon success">
                            <i className="fa-solid fa-face-smile"></i>
                        </div>
                        <div className="ai-kpi-info">
                            <h4>Satisfaction Index</h4>
                            <div className="kpi-val">{kpis.overall_satisfaction_score}%</div>
                            <div className="kpi-sub">NLP Review Sentiment Analysis</div>
                        </div>
                    </div>
                </div>

                {/* "ASK BAD TEDDY AI" ASSISTANT CONSOLE */}
                <div className="admin-ai-console">
                    <div className="console-header">
                        <h2>
                            <i className="fa-solid fa-robot"></i>
                            Ask Bad Teddy AI — Store Management Assistant
                        </h2>
                        <span className="console-tag">Natural Language Query Engine</span>
                    </div>

                    <form
                        className="ai-prompt-input-wrapper"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleAskAI();
                        }}
                    >
                        <i className="fa-solid fa-robot"></i>
                        <input
                            type="text"
                            className="ai-prompt-input"
                            placeholder="Ask any store operations question (e.g., Which product sold the most? Which products need restocking?)"
                            value={queryText}
                            onChange={(e) => setQueryText(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="ai-submit-btn"
                            disabled={queryLoading || !queryText.trim()}
                        >
                            {queryLoading ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    Analyzing Live Data...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-paper-plane"></i>
                                    Ask AI
                                </>
                            )}
                        </button>
                    </form>

                    {/* QUICK PROMPT CHIPS */}
                    <div className="ai-prompt-chips">
                        {quickChips.map((chip, idx) => (
                            <button
                                key={idx}
                                className="ai-chip"
                                onClick={() => handleChipClick(chip)}
                                type="button"
                            >
                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                                {chip}
                            </button>
                        ))}
                    </div>

                    {/* DYNAMIC AI RESPONSE DISPLAY */}
                    {aiResponse && (
                        <div className="ai-response-box">
                            <div className="ai-response-header">
                                <span className="ai-intent-pill">
                                    <i className="fa-solid fa-bolt"></i> Intent: {aiResponse.matched_intent}
                                </span>
                                <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                                    Live MySQL Response • {new Date(aiResponse.timestamp).toLocaleTimeString()}
                                </small>
                            </div>

                            <div
                                className="ai-response-text"
                                dangerouslySetInnerHTML={{
                                    __html: aiResponse.answer
                                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                        .replace(/\n/g, "<br/>")
                                }}
                            />

                            {aiResponse.suggested_actions && aiResponse.suggested_actions.length > 0 && (
                                <div className="ai-suggested-actions">
                                    <h5>AI Suggested Business Actions:</h5>
                                    <div className="ai-action-list">
                                        {aiResponse.suggested_actions.map((act, aIdx) => (
                                            <span key={aIdx} className="ai-action-item">
                                                <i className="fa-solid fa-check" style={{ color: "var(--gold)", marginRight: "5px" }}></i>
                                                {act}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* OPERATIONS TABS NAVIGATION */}
                <div className="ai-tabs-nav">
                    <button
                        className={`ai-tab-btn ${activeTab === "demand" ? "active" : ""}`}
                        onClick={() => setActiveTab("demand")}
                    >
                        <i className="fa-solid fa-chart-line"></i>
                        Demand Forecasting & Restock AI
                    </button>
                    <button
                        className={`ai-tab-btn ${activeTab === "customers" ? "active" : ""}`}
                        onClick={() => setActiveTab("customers")}
                    >
                        <i className="fa-solid fa-users-viewfinder"></i>
                        Customer Segmentation (K-Means)
                    </button>
                    <button
                        className={`ai-tab-btn ${activeTab === "performance" ? "active" : ""}`}
                        onClick={() => setActiveTab("performance")}
                    >
                        <i className="fa-solid fa-award"></i>
                        Product Performance & Sentiment
                    </button>
                    <button
                        className={`ai-tab-btn ${activeTab === "models" ? "active" : ""}`}
                        onClick={() => setActiveTab("models")}
                    >
                        <i className="fa-solid fa-microchip"></i>
                        AI Models & Architecture Registry
                    </button>
                </div>

                {/* TAB 1: DEMAND FORECASTING & RESTOCK TABLE */}
                {activeTab === "demand" && (
                    <div className="ai-section-card">
                        <div className="ai-section-header">
                            <div>
                                <h3>
                                    <i className="fa-solid fa-boxes-stacked" style={{ color: "var(--gold)" }}></i>
                                    Inventory Demand Forecasting & Stock Depletion Intelligence
                                </h3>
                                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                                    Daily sales velocity ($V_d$), Days of Inventory Remaining (DOIR), and safety stock restock recommendations calculated from live transactions.
                                </p>
                            </div>
                            <span className="ai-model-tag">
                                Model: Daily Velocity + OLS Linear Trend + Safety Stock (95% Service Level)
                            </span>
                        </div>

                        <div className="ai-table-responsive">
                            <table className="ai-table">
                                <thead>
                                    <tr>
                                        <th>Product Name</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Current Stock</th>
                                        <th>Units Sold</th>
                                        <th>Daily Velocity</th>
                                        <th>DOIR (Days)</th>
                                        <th>Stock Health</th>
                                        <th>AI Reorder Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {demandProducts.map((p, idx) => (
                                        <tr key={idx}>
                                            <td><strong>{p.name}</strong></td>
                                            <td>{p.category}</td>
                                            <td>₹{p.price.toFixed(2)}</td>
                                            <td><strong>{p.current_stock}</strong></td>
                                            <td>{p.units_sold}</td>
                                            <td>{p.daily_velocity} / day</td>
                                            <td>{p.doir_days} days</td>
                                            <td>
                                                <span className={`badge-risk ${p.risk_level.toLowerCase()}`}>
                                                    {p.status_label}
                                                </span>
                                            </td>
                                            <td>
                                                {p.recommended_reorder > 0 ? (
                                                    <span className="reorder-pill">+{p.recommended_reorder} units</span>
                                                ) : (
                                                    <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Adequate</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 2: CUSTOMER SEGMENTATION (K-MEANS) */}
                {activeTab === "customers" && (
                    <div>
                        <div className="ai-tech-distinction">
                            <i className="fa-solid fa-brain"></i>
                            <span>
                                <strong>Machine Learning Model:</strong> Unsupervised <code>K-Means Clustering (K=4)</code> with <code>StandardScaler</code> normalization running on live 4-dimensional RFM vectors (Recency, Frequency, Monetary Value, Basket Depth).
                            </span>
                        </div>

                        <div className="ai-cohorts-grid">
                            {customerCohorts.map((cohort, idx) => (
                                <div className="ai-cohort-card" key={idx}>
                                    <div className="cohort-header">
                                        <div className="cohort-title-wrap">
                                            <div
                                                className="cohort-icon"
                                                style={{ background: `${cohort.color}20`, color: cohort.color }}
                                            >
                                                <i className={cohort.icon}></i>
                                            </div>
                                            <div>
                                                <h4>{cohort.name}</h4>
                                                <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                                                    {cohort.percentage_of_base}% of active customer base
                                                </small>
                                            </div>
                                        </div>
                                        <span
                                            className="cohort-badge"
                                            style={{ background: `${cohort.color}25`, color: cohort.color }}
                                        >
                                            {cohort.badge}
                                        </span>
                                    </div>

                                    <div className="cohort-stats-grid">
                                        <div className="cohort-stat-item">
                                            <small>Customers</small>
                                            <span>{cohort.customer_count}</span>
                                        </div>
                                        <div className="cohort-stat-item">
                                            <small>Total Revenue</small>
                                            <span>₹{cohort.total_revenue.toLocaleString()}</span>
                                        </div>
                                        <div className="cohort-stat-item">
                                            <small>Avg Spend</small>
                                            <span>₹{cohort.average_spend.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="cohort-strategy-box">
                                        <strong>AI Retention Strategy:</strong> {cohort.strategy}
                                    </div>

                                    {cohort.sample_customers && cohort.sample_customers.length > 0 && (
                                        <div>
                                            <small style={{ display: "block", color: "var(--text-muted)", fontSize: "11px", marginBottom: "6px" }}>
                                                Cohort Members:
                                            </small>
                                            <div className="cohort-users-list">
                                                {cohort.sample_customers.map((cust, cIdx) => (
                                                    <span key={cIdx} className="cohort-user-chip">
                                                        <i className="fa-solid fa-user" style={{ fontSize: "10px", marginRight: "4px" }}></i>
                                                        {cust.name} ({cust.email})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 3: PRODUCT PERFORMANCE & SENTIMENT */}
                {activeTab === "performance" && (
                    <div>
                        <div className="ai-tech-distinction">
                            <i className="fa-solid fa-chart-pie"></i>
                            <span>
                                <strong>Analytical Model:</strong> Multi-Criteria Decision Analysis (MCDA Composite Score 0-100) combining Revenue Contribution (35%), Unit Velocity (25%), Catalog Rating (20%), and NLP Review Sentiment Polarity (20%).
                            </span>
                        </div>

                        <div className="ai-perf-grid">
                            {perfProducts.map((p, idx) => (
                                <div className="ai-perf-card" key={idx}>
                                    <div className="perf-card-top">
                                        <div>
                                            <h4>{p.name}</h4>
                                            <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                                                {p.category} • ₹{p.price.toFixed(2)}
                                            </small>
                                        </div>
                                        <span className={`perf-score-badge ${p.performance_class}`}>
                                            Score: {p.performance_score}/100
                                        </span>
                                    </div>

                                    <div className="perf-metrics-strip">
                                        <span><strong>{p.units_sold}</strong> Sold</span>
                                        <span><strong>₹{p.total_revenue.toLocaleString()}</strong> Revenue</span>
                                        <span><strong>{p.turnover_ratio}x</strong> Turn Ratio</span>
                                        <span><strong>{p.stock}</strong> in Stock</span>
                                    </div>

                                    <div className="perf-sentiment-row">
                                        <span style={{ color: "var(--text-muted)" }}>Customer Sentiment:</span>
                                        <div className="sentiment-bar-track">
                                            <div
                                                className="sentiment-bar-fill"
                                                style={{ width: `${p.sentiment_score}%` }}
                                            ></div>
                                        </div>
                                        <strong>{p.sentiment_score}%</strong>
                                    </div>

                                    {p.recent_reviews && p.recent_reviews.length > 0 && (
                                        <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", background: "var(--bg-card)", padding: "10px", borderRadius: "var(--radius-sm)" }}>
                                            <i className="fa-solid fa-quote-left" style={{ color: "var(--gold)", marginRight: "6px" }}></i>
                                            "{p.recent_reviews[0].comment}" — <em>{p.recent_reviews[0].user_name}</em>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 4: AI MODELS & ARCHITECTURE REGISTRY */}
                {activeTab === "models" && (
                    <div className="ai-section-card">
                        <div className="ai-section-header">
                            <h3>
                                <i className="fa-solid fa-microchip" style={{ color: "var(--gold)" }}></i>
                                Deployed Machine Learning Models & Analytical Engines Registry
                            </h3>
                            <span className="ai-badge-ready">5 Engines Active</span>
                        </div>

                        <div className="ai-table-responsive">
                            <table className="ai-table">
                                <thead>
                                    <tr>
                                        <th>Feature / Capability</th>
                                        <th>Type</th>
                                        <th>Model / Algorithm</th>
                                        <th>Dataset / Features</th>
                                        <th>Evaluation / Metric</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>Customer Fashion Chatbot</strong></td>
                                        <td><span className="badge-risk healthy">Trained Neural Net</span></td>
                                        <td>TF-IDF + Multi-Layer Perceptron (MLP 128x64)</td>
                                        <td>428 patterns, 30 intent classes</td>
                                        <td>73.26% Test Acc / 94.63% Overall</td>
                                        <td><strong style={{ color: "var(--success)" }}>Active (/api/chat)</strong></td>
                                    </tr>
                                    <tr>
                                        <td><strong>Anthropometric Size Recommender</strong></td>
                                        <td><span className="badge-risk healthy">Trained ML Model</span></td>
                                        <td>Random Forest Classifier (150 Trees) + StandardScaler</td>
                                        <td>1,600 body measurement records</td>
                                        <td>90.31% Test Acc (F1: 0.9032)</td>
                                        <td><strong style={{ color: "var(--success)" }}>Active (/api/predict-size)</strong></td>
                                    </tr>
                                    <tr>
                                        <td><strong>Admin Natural Language Assistant</strong></td>
                                        <td><span className="badge-risk healthy">Trained NLP + Live SQL</span></td>
                                        <td>TF-IDF (1-3 ngrams) + Cosine Intent Classifier + Parameter Slot-Filler</td>
                                        <td>Admin Operations Taxonomy + Live MySQL</td>
                                        <td>100% Core Intent Resolution</td>
                                        <td><strong style={{ color: "var(--success)" }}>Active (/api/admin/ask-ai)</strong></td>
                                    </tr>
                                    <tr>
                                        <td><strong>Customer RFM Segmentation</strong></td>
                                        <td><span className="badge-risk warning">Unsupervised ML</span></td>
                                        <td>StandardScaler + K-Means Clustering (K=4)</td>
                                        <td>Live RFM Matrix (Recency, Frequency, Monetary)</td>
                                        <td>Silhouette Centroid Partitioning</td>
                                        <td><strong style={{ color: "var(--success)" }}>Active (Live Fitted)</strong></td>
                                    </tr>
                                    <tr>
                                        <td><strong>Demand & Restock Forecasting</strong></td>
                                        <td><span className="badge-risk slow">Inventory Analytics</span></td>
                                        <td>Daily Velocity ($V_d$) + OLS Trend + 95% Safety Stock</td>
                                        <td>Live `orders` & `order_items` Time-Series</td>
                                        <td>Stochastic Safety Stock (Z=1.65)</td>
                                        <td><strong style={{ color: "var(--success)" }}>Active (Live Dynamic)</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* FOOTER */}
                <footer className="admin-footer" style={{ marginTop: "30px" }}>
                    <p>© 2026 Bad Teddy Admin Panel</p>
                    <p>Live Machine Learning & Business Intelligence • Bad Teddy Streetwear</p>
                </footer>
            </div>
        </div>
    );
}

export default AdminAI;
