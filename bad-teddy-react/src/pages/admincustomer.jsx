import React, {
    useEffect,
    useMemo,
    useState
} from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/admin-customer.css";
import mylogo from "../assets/mylogo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";


function Admincustomers() {
    const navigate = useNavigate();

    /* =========================================
       CUSTOMER DATA
    ========================================== */

    const [customers, setCustomers] = useState([

        {
            id: "CUST001",
            name: "Rahul Verma",
            email: "rahul@gmail.com",
            phone: "+91 98765 43210",
            orders: 8,
            spent: 18450,
            status: "Active",
            joined: "12 May 2026",
            type: "Returning"
        },

        {
            id: "CUST002",
            name: "Priya Sharma",
            email: "priya@gmail.com",
            phone: "+91 98765 12345",
            orders: 5,
            spent: 12499,
            status: "Active",
            joined: "10 May 2026",
            type: "Returning"
        },

        {
            id: "CUST003",
            name: "Aman Singh",
            email: "aman@gmail.com",
            phone: "+91 99887 66554",
            orders: 3,
            spent: 7499,
            status: "Inactive",
            joined: "05 May 2026",
            type: "Returning"
        },

        {
            id: "CUST004",
            name: "Neha Patel",
            email: "neha@gmail.com",
            phone: "+91 91234 56789",
            orders: 12,
            spent: 28999,
            status: "Active",
            joined: "01 May 2026",
            type: "Returning"
        },

        {
            id: "CUST005",
            name: "Karan Mehta",
            email: "karan@gmail.com",
            phone: "+91 90909 80808",
            orders: 1,
            spent: 3999,
            status: "Active",
            joined: "28 Apr 2026",
            type: "New"
        },

        {
            id: "CUST006",
            name: "Simran Kaur",
            email: "simran@gmail.com",
            phone: "+91 98765 99887",
            orders: 7,
            spent: 15999,
            status: "Active",
            joined: "25 Apr 2026",
            type: "Returning"
        },

        {
            id: "CUST007",
            name: "Arjun Shah",
            email: "arjun@gmail.com",
            phone: "+91 98760 11223",
            orders: 1,
            spent: 2499,
            status: "Active",
            joined: "20 Apr 2026",
            type: "New"
        }

    ]);


    /* =========================================
       STATES
    ========================================== */

    const [searchTerm, setSearchTerm] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("All Status");

    const [typeFilter, setTypeFilter] =
        useState("All Customers");

    const [currentPage, setCurrentPage] =
        useState(1);

    const [selectedCustomer, setSelectedCustomer] =
        useState(null);

    const customersPerPage = 6;

    const fetchCustomers = async () => {
        try {
            const response = await fetch("http://localhost/BAD%20TEDDY/backend/api/customers.php");
            const data = await response.json();
            if (data.success && Array.isArray(data.customers) && data.customers.length > 0) {
                const mapped = data.customers.map(c => ({
                    id: "CUST" + String(c.id).padStart(3, "0"),
                    raw_id: c.id,
                    name: c.name,
                    email: c.email,
                    phone: c.phone || "+91 98765 00000",
                    orders: c.orders || c.total_orders || 0,
                    spent: Number(c.total_spent || 0),
                    status: c.status || "Active",
                    joined: c.joined || "May 2026",
                    type: (c.total_orders > 1) ? "Returning" : "New"
                }));
                setCustomers(mapped);
            }
        } catch (err) {
            console.error("Error fetching customers for admin:", err);
        }
    };

    useEffect(() => {
        fetchCustomers();
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


    /* =========================================
       FILTER CUSTOMERS
    ========================================== */

    const filteredCustomers = useMemo(() => {

        return customers.filter((customer) => {

            const search =
                searchTerm
                    .toLowerCase()
                    .trim();


            const matchesSearch =
                customer.name
                    .toLowerCase()
                    .includes(search) ||

                customer.email
                    .toLowerCase()
                    .includes(search) ||

                customer.id
                    .toLowerCase()
                    .includes(search) ||

                customer.phone
                    .toLowerCase()
                    .includes(search);


            const matchesStatus =
                statusFilter === "All Status" ||
                customer.status === statusFilter;


            const matchesType =
                typeFilter === "All Customers" ||
                customer.type === typeFilter;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesType
            );

        });

    }, [
        customers,
        searchTerm,
        statusFilter,
        typeFilter
    ]);


    /* =========================================
       RESET PAGE WHEN FILTER CHANGES
    ========================================== */

    useEffect(() => {

        setCurrentPage(1);

    }, [
        searchTerm,
        statusFilter,
        typeFilter
    ]);


    /* =========================================
       PAGINATION
    ========================================== */

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredCustomers.length /
                customersPerPage
            )
        );


    const startIndex =
        (currentPage - 1) *
        customersPerPage;


    const paginatedCustomers =
        filteredCustomers.slice(
            startIndex,
            startIndex + customersPerPage
        );


    /* =========================================
       STATISTICS
    ========================================== */

    const totalCustomers =
        customers.length;


    const activeCustomers =
        customers.filter(
            (customer) =>
                customer.status === "Active"
        ).length;


    const inactiveCustomers =
        customers.filter(
            (customer) =>
                customer.status === "Inactive"
        ).length;


    const totalRevenue =
        customers.reduce(
            (total, customer) =>
                total + customer.spent,
            0
        );


    /* =========================================
       DELETE CUSTOMER
    ========================================== */

    const deleteCustomer = async (customerId) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this customer?"
            );


        if (!confirmed) {
            return;
        }

        const targetCust = customers.find(c => c.id === customerId);
        const rawId = targetCust ? (targetCust.raw_id || targetCust.id) : customerId;

        try {
            await fetch("http://localhost/BAD%20TEDDY/backend/api/customers.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", id: rawId })
            });
        } catch (err) {
            console.error("Error deleting customer:", err);
        }

        setCustomers((currentCustomers) =>
            currentCustomers.filter(
                (customer) =>
                    customer.id !== customerId
            )
        );


        setSelectedCustomer(null);

    };


    /* =========================================
       EXPORT CUSTOMERS
    ========================================== */

    const exportCustomers = () => {

        const headers = [
            "Customer ID",
            "Name",
            "Email",
            "Phone",
            "Orders",
            "Total Spent",
            "Status",
            "Customer Type",
            "Joined"
        ];


        const rows =
            filteredCustomers.map(
                (customer) => [

                    customer.id,
                    customer.name,
                    customer.email,
                    customer.phone,
                    customer.orders,
                    customer.spent,
                    customer.status,
                    customer.type,
                    customer.joined

                ]
            );


        const csv = [

            headers.join(","),

            ...rows.map(
                (row) =>
                    row
                        .map(
                            (value) =>
                                `"${String(value).replaceAll('"', '""')}"`
                        )
                        .join(",")
            )

        ].join("\n");


        const blob = new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href = url;


        link.download =
            "bad-teddy-customers.csv";


        document.body.appendChild(link);


        link.click();


        document.body.removeChild(link);


        URL.revokeObjectURL(url);

    };


    /* =========================================
       GENERATE CUSTOMER REPORT
    ========================================== */

    const generateReport = () => {

        const returningCustomers =
            customers.filter(
                (customer) =>
                    customer.type === "Returning"
            ).length;


        const newCustomers =
            customers.filter(
                (customer) =>
                    customer.type === "New"
            ).length;


        const averageSpent =
            customers.length > 0
                ? totalRevenue / customers.length
                : 0;


        const report = `
BAD TEDDY CUSTOMER REPORT
=========================

Total Customers: ${totalCustomers}

Active Customers: ${activeCustomers}

Inactive Customers: ${inactiveCustomers}

New Customers: ${newCustomers}

Returning Customers: ${returningCustomers}

Total Customer Spending: ₹${totalRevenue.toLocaleString("en-IN")}

Average Customer Spending: ₹${Math.round(
            averageSpent
        ).toLocaleString("en-IN")}

Generated: ${new Date().toLocaleString()}

AI Recommendation:
Focus on retaining returning customers
and provide loyalty offers to customers
with multiple purchases.
        `.trim();


        const blob = new Blob(
            [report],
            {
                type: "text/plain;charset=utf-8;"
            }
        );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href = url;


        link.download =
            "bad-teddy-customer-report.txt";


        document.body.appendChild(link);


        link.click();


        document.body.removeChild(link);


        URL.revokeObjectURL(url);

    };


    /* =========================================
       PAGINATION FUNCTION
    ========================================== */

    const changePaginationPage = (page) => {

        if (
            page >= 1 &&
            page <= totalPages
        ) {

            setCurrentPage(page);

        }

    };


    /* =========================================
       JSX STARTS
    ========================================== */

    return (

        <div className="admin-container">

            {/* UNIFIED ADMIN SIDEBAR */}
            <AdminSidebar activePage="Customers" />

            {/* =========================================
                MAIN CONTENT
            ========================================== */}

        <div className="main-content">


            {/* =========================================
                TOP HEADER
            ========================================== */}

            <header className="top-header">


                <div className="search-box">

                    <i className="fa-solid fa-magnifying-glass"></i>

                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(
                                e.target.value
                            )
                        }
                    />

                </div>


                <div className="header-right">


                    <i className="fa-regular fa-bell"></i>


                    <i className="fa-solid fa-moon"></i>


                    <div className="admin-profile">


                        <img
                            src={mylogo}
                            alt="Bad Teddy Admin"
                        />


                        <div>

                            <h4>
                                Admin
                            </h4>

                            <p>
                                Super Admin
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
                        Customer Management
                    </h1>

                    <p>
                        View, manage and monitor Bad Teddy customers.
                    </p>

                </div>


            </section>



            {/* =========================================
    CUSTOMER STATISTICS
========================================= */}

<section className="dashboard-cards">


    {/* TOTAL CUSTOMERS */}

    <div className="card">

        <div className="card-icon customers">

            <i className="fa-solid fa-users"></i>

        </div>


        <div>

            <h4>
                Total Customers
            </h4>

            <h2>
                {totalCustomers}
            </h2>

            <p>
                Registered customers
            </p>

        </div>

    </div>



    {/* ACTIVE CUSTOMERS */}

    <div className="card">

        <div className="card-icon active">

            <i className="fa-solid fa-user-check"></i>

        </div>


        <div>

            <h4>
                Active Customers
            </h4>

            <h2>
                {activeCustomers}
            </h2>

            <p>
                Currently active
            </p>

        </div>

    </div>



    {/* INACTIVE CUSTOMERS */}

    <div className="card">

        <div className="card-icon inactive">

            <i className="fa-solid fa-user-slash"></i>

        </div>


        <div>

            <h4>
                Inactive Customers
            </h4>

            <h2>
                {inactiveCustomers}
            </h2>

            <p>
                Inactive accounts
            </p>

        </div>

    </div>



    {/* CUSTOMER REVENUE */}

    <div className="card">

        <div className="card-icon revenue">

            <i className="fa-solid fa-indian-rupee-sign"></i>

        </div>


        <div>

            <h4>
                Customer Revenue
            </h4>

            <h2>
                ₹{totalRevenue.toLocaleString("en-IN")}
            </h2>

            <p>
                Total customer spending
            </p>

        </div>

    </div>


</section>



{/* =========================================
    CUSTOMER TOOLBAR
========================================= */}

<section className="customer-toolbar">


    <div className="toolbar-left">


        {/* CUSTOMER SEARCH */}

        <div className="customer-search">

            <i className="fa-solid fa-magnifying-glass"></i>

            <input
                type="text"
                placeholder="Search name, email or customer ID..."
                value={searchTerm}
                onChange={(e) =>
                    setSearchTerm(
                        e.target.value
                    )
                }
            />

        </div>



        {/* STATUS FILTER */}

        <select
            value={statusFilter}
            onChange={(e) =>
                setStatusFilter(
                    e.target.value
                )
            }
        >

            <option>
                All Status
            </option>

            <option>
                Active
            </option>

            <option>
                Inactive
            </option>

        </select>



        {/* CUSTOMER TYPE FILTER */}

        <select
            value={typeFilter}
            onChange={(e) =>
                setTypeFilter(
                    e.target.value
                )
            }
        >

            <option>
                All Customers
            </option>

            <option>
                New
            </option>

            <option>
                Returning
            </option>

        </select>


    </div>



    {/* EXPORT BUTTON */}

    <div className="toolbar-right">

        <button
            className="export-btn"
            onClick={exportCustomers}
        >

            <i className="fa-solid fa-download"></i>

            Export Customers

        </button>

    </div>


</section>



{/* =========================================
    CUSTOMER TABLE
========================================= */}

<section className="customers-table">


    {paginatedCustomers.length > 0 ? (

        <table>

            {/* =========================================
                TABLE HEADER
            ========================================== */}

            <thead>

                <tr>

                    <th>
                        Customer
                    </th>

                    <th>
                        Customer ID
                    </th>

                    <th>
                        Phone
                    </th>

                    <th>
                        Orders
                    </th>

                    <th>
                        Total Spent
                    </th>

                    <th>
                        Status
                    </th>

                    <th>
                        Joined
                    </th>

                    <th>
                        Action
                    </th>

                </tr>

            </thead>


            {/* =========================================
                CUSTOMER DATA
            ========================================== */}

            <tbody>

                {paginatedCustomers.map(
                    (customer) => (

                        <tr
                            key={customer.id}
                        >


                            {/* CUSTOMER */}

                            <td>

                                <div className="customer-info">


                                    <div className="customer-avatar">

                                        {customer.name
                                            .split(" ")
                                            .map(
                                                (word) =>
                                                    word[0]
                                            )
                                            .join("")
                                            .substring(0, 2)
                                            .toUpperCase()}

                                    </div>


                                    <div>

                                        <h4>
                                            {customer.name}
                                        </h4>

                                        <p>
                                            {customer.email}
                                        </p>

                                    </div>


                                </div>

                            </td>



                            {/* CUSTOMER ID */}

                            <td>

                                #{customer.id}

                            </td>



                            {/* PHONE */}

                            <td>

                                {customer.phone}

                            </td>



                            {/* ORDERS */}

                            <td>

                                {customer.orders}

                            </td>



                            {/* TOTAL SPENT */}

                            <td>

                                ₹{customer.spent.toLocaleString("en-IN")}

                            </td>



                            {/* STATUS */}

                            <td>

                                <span
                                    className={`customer-status ${customer.status.toLowerCase()}`}
                                >

                                    {customer.status}

                                </span>

                            </td>



                            {/* JOINED */}

                            <td>

                                {customer.joined}

                            </td>



                            {/* ACTION */}

                            <td>

                                <button
                                    className="view-btn"
                                    onClick={() =>
                                        setSelectedCustomer(
                                            customer
                                        )
                                    }
                                >

                                    <i className="fa-solid fa-eye"></i>

                                    View

                                </button>

                            </td>


                        </tr>

                    )
                )}

            </tbody>

        </table>


    ) : (


        /* =========================================
           NO CUSTOMERS FOUND
        ========================================== */

        <div className="no-customers">

            <i className="fa-solid fa-users-slash"></i>

            <h3>
                No customers found
            </h3>

            <p>
                Try changing your search or filters.
            </p>

        </div>


    )}


</section>



{/* =========================================
    PAGINATION
========================================= */}

<div className="customers-footer">


    {/* SHOWING RESULTS */}

    <p>

        Showing{" "}

        <strong>

            {filteredCustomers.length === 0
                ? 0
                : startIndex + 1}

        </strong>

        {" "}to{" "}

        <strong>

            {Math.min(
                startIndex + customersPerPage,
                filteredCustomers.length
            )}

        </strong>

        {" "}of{" "}

        <strong>
            {filteredCustomers.length}
        </strong>

        {" "}Customers

    </p>



    {/* PAGINATION BUTTONS */}

    <div className="pagination">


        {/* PREVIOUS BUTTON */}

        <button
            disabled={currentPage === 1}
            onClick={() =>
                goToPage(
                    currentPage - 1
                )
            }
        >

            <i className="fa-solid fa-angle-left"></i>

        </button>



        {/* PAGE NUMBERS */}

        {Array.from(
            {
                length: totalPages
            },
            (_, index) =>
                index + 1

        ).map((page) => (

            <button
                key={page}
                className={
                    currentPage === page
                        ? "active"
                        : ""
                }
                onClick={() =>
                    goToPage(page)
                }
            >

                {page}

            </button>

        ))}



        {/* NEXT BUTTON */}

        <button
            disabled={
                currentPage === totalPages
            }
            onClick={() =>
                goToPage(
                    currentPage + 1
                )
            }
        >

            <i className="fa-solid fa-angle-right"></i>

        </button>


    </div>

</div>



{/* =========================================
    CUSTOMER INSIGHTS
========================================= */}

<section className="customer-insights">


    {/* INSIGHTS HEADER */}

    <div className="insights-header">


        <div>

            <h2>

                <i className="fa-solid fa-chart-line"></i>

                Customer Insights

            </h2>


            <p>
                Overview of customer behaviour and activity.
            </p>

        </div>



        {/* GENERATE REPORT BUTTON */}

        <button
            className="report-btn"
            onClick={generateReport}
        >

            <i className="fa-solid fa-wand-magic-sparkles"></i>

            Generate Report

        </button>


    </div>



    {/* =========================================
        INSIGHTS GRID
    ========================================== */}

    <div className="insights-grid">


        {/* NEW CUSTOMERS */}

        <div className="insight-card">


            <div className="insight-icon">

                <i className="fa-solid fa-user-plus"></i>

            </div>


            <h3>

                {
                    customers.filter(
                        (customer) =>
                            customer.type === "New"
                    ).length
                }

            </h3>


            <p>
                New Customers
            </p>


            <span>
                Customers with their first order
            </span>


        </div>



        {/* RETURNING CUSTOMERS */}

        <div className="insight-card">


            <div className="insight-icon">

                <i className="fa-solid fa-repeat"></i>

            </div>


            <h3>

                {
                    customers.filter(
                        (customer) =>
                            customer.type === "Returning"
                    ).length
                }

            </h3>


            <p>
                Returning Customers
            </p>


            <span>
                Customers with multiple purchases
            </span>


        </div>



        {/* CUSTOMER SATISFACTION */}

        <div className="insight-card">


            <div className="insight-icon">

                <i className="fa-solid fa-star"></i>

            </div>


            <h3>
                4.7
            </h3>


            <p>
                Customer Satisfaction
            </p>


            <span>
                Average customer rating
            </span>


        </div>



        {/* AVERAGE CUSTOMER VALUE */}

        <div className="insight-card">


            <div className="insight-icon">

                <i className="fa-solid fa-indian-rupee-sign"></i>

            </div>


            <h3>

                ₹{Math.round(
                    totalRevenue /
                    Math.max(
                        totalCustomers,
                        1
                    )
                ).toLocaleString("en-IN")}

            </h3>


            <p>
                Average Customer Value
            </p>


            <span>
                Average spending per customer
            </span>


        </div>



        {/* AI SUGGESTION */}

        <div className="insight-card">


            <div className="insight-icon">

                <i className="fa-solid fa-lightbulb"></i>

            </div>


            <h3>
                AI Suggestion
            </h3>


            <p>
                Reward returning customers with exclusive offers.
            </p>


            <span>
                Based on customer activity
            </span>


        </div>


    </div>


</section>



{/* =========================================
    CUSTOMER DETAILS MODAL
========================================= */}

{selectedCustomer && (

    <div
        className="customer-modal-overlay"
        onClick={() =>
            setSelectedCustomer(null)
        }
    >


        <div
            className="customer-modal"
            onClick={(e) =>
                e.stopPropagation()
            }
        >


            {/* =========================================
                MODAL HEADER
            ========================================== */}

            <div className="customer-modal-header">


                <div>

                    <h2>
                        Customer Details
                    </h2>

                    <p>
                        #{selectedCustomer.id}
                    </p>

                </div>


                <button
                    className="modal-close"
                    onClick={() =>
                        setSelectedCustomer(null)
                    }
                >

                    <i className="fa-solid fa-xmark"></i>

                </button>


            </div>



            {/* =========================================
                MODAL BODY
            ========================================== */}

            <div className="customer-modal-body">


                {/* CUSTOMER PROFILE */}

                <div className="modal-customer-profile">


                    <div className="large-customer-avatar">

                        {selectedCustomer.name
                            .split(" ")
                            .map(
                                (word) =>
                                    word[0]
                            )
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}

                    </div>


                    <div>

                        <h3>
                            {selectedCustomer.name}
                        </h3>

                        <p>
                            {selectedCustomer.email}
                        </p>

                    </div>


                </div>



                {/* =========================================
                    CUSTOMER DETAILS
                ========================================== */}

                <div className="customer-detail-grid">


                    <div>

                        <span>
                            Customer ID
                        </span>

                        <strong>
                            #{selectedCustomer.id}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Status
                        </span>

                        <strong>
                            {selectedCustomer.status}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Phone
                        </span>

                        <strong>
                            {selectedCustomer.phone}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Customer Type
                        </span>

                        <strong>
                            {selectedCustomer.type}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Total Orders
                        </span>

                        <strong>
                            {selectedCustomer.orders}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Total Spent
                        </span>

                        <strong>
                            ₹{selectedCustomer.spent.toLocaleString("en-IN")}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Joined
                        </span>

                        <strong>
                            {selectedCustomer.joined}
                        </strong>

                    </div>


                </div>



                {/* =========================================
                    MODAL ACTIONS
                ========================================== */}

                <div className="modal-actions">


                    <button
                        className="modal-delete-btn"
                        onClick={() =>
                            deleteCustomer(
                                selectedCustomer.id
                            )
                        }
                    >

                        <i className="fa-solid fa-trash"></i>

                        Delete Customer

                    </button>


                    <button
                        className="modal-cancel-btn"
                        onClick={() =>
                            setSelectedCustomer(null)
                        }
                    >

                        Close

                    </button>


                </div>


            </div>


        </div>

    </div>

)}



{/* =========================================
    FOOTER
========================================= */}

<footer className="admin-footer">


    <p>
        © 2026 Bad Teddy Admin Panel
    </p>


    <p>
        Built using React • PHP • MySQL
    </p>


</footer>

        </div>


    </div>

    );

}


export default Admincustomers;