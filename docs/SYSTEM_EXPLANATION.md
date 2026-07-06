# System Explanation & Implementation Journey

This document provides a highly detailed, beginner-friendly explanation of how the entire AI-Powered Credit Card Fraud Detection System was built, from the ground up.

---

## 1. How the Frontend was Built
The frontend is the visual interface of the system, built using **React** (via **Vite** for incredibly fast build times). 
- **Styling**: We used **Tailwind CSS**, a utility-first CSS framework, which allows us to style components directly in the HTML markup, ensuring a consistent, dark-themed "fintech" aesthetic.
- **Animations**: **Framer Motion** was integrated to provide smooth page transitions and micro-animations, making the dashboard feel premium and responsive.
- **Data Visualization**: **Recharts** translates complex statistical data (like risk distribution and fraud trends) into easily digestible Pie and Bar charts.
- **Routing**: **React Router** ensures users can navigate between the Dashboard, Detection Tool, and History pages without reloading the browser.

## 2. How the Backend was Structured
The backend serves as the brain of the operation, built with **Flask** (Python).
We utilized an **Enterprise Modular Architecture** (Application Factory Pattern). Instead of writing all routes in one massive file, the application is broken down into specific domains called "Blueprints":
- `auth`: Handles logins and tokens.
- `predictions`: Handles ML inference.
- `cases`: Manages the analyst review queue.
- `transactions`: Provides data for history tables.
- `dashboards`: Aggregates statistics for the UI.
- `audit`: Tracks user actions.

Each domain has its own `routes.py` (for HTTP logic), `services.py` (for business logic), and `models.py` (for database schemas).

## 3. How JWT Authentication Works
Security is critical in financial systems. We use **JSON Web Tokens (JWT)**.
1. When a user logs in via the React frontend, Flask validates the password.
2. If correct, Flask generates an encrypted String (the JWT) containing the user's ID and Role.
3. React stores this token in `localStorage`.
4. For every subsequent API request (like viewing cases), Axios (our frontend HTTP client) automatically attaches this token to the `Authorization` header.
5. Flask intercepts the request, decrypts the token, and verifies the user's identity before responding.

## 4. How Role-Based Access Control (RBAC) Works
Not everyone should be able to view sensitive data. RBAC restricts access based on user roles:
- **Admin**: Can view system-wide dashboards, model health, and audit logs.
- **Analyst**: Can only view the review queue and perform case decisions.
In Flask, we enforce this using custom decorators like `@admin_required`. If an Analyst tries to access an Admin route, Flask instantly rejects the request with a `403 Forbidden` error.

## 5. How ML Training Works
The machine learning pipeline is contained in `scripts/train_model.py`.
1. **Loading**: It reads historical credit card transaction data (typically CSV).
2. **Preprocessing**: It handles missing data and scales numerical values.
3. **Balancing**: It addresses the "Class Imbalance" problem (explained below).
4. **Learning**: It feeds the processed data into an algorithm to find patterns associated with fraud.

## 6. How SMOTE Works
In fraud detection, 99% of transactions are legitimate, and only 1% are fraudulent. If an AI simply guesses "Legitimate" every time, it would be 99% accurate but completely useless.
**SMOTE (Synthetic Minority Over-sampling Technique)** solves this. It analyzes the 1% of fraud cases and mathematically generates *synthetic* (fake but statistically realistic) fraud examples until the dataset is perfectly balanced (50/50). This forces the AI to learn the actual patterns of fraud.

## 7. How XGBoost Works
**Extreme Gradient Boosting (XGBoost)** is the algorithm we chose. It builds a "forest" of decision trees.
Instead of building trees independently, XGBoost builds them sequentially. The first tree makes predictions. It will make mistakes. The second tree is built specifically to correct the mistakes of the first tree. The third corrects the second, and so on. This "boosting" process results in an incredibly accurate and lightning-fast model.

## 8. How APIs Work
APIs (Application Programming Interfaces) are the bridges between the Frontend and Backend.
We built RESTful APIs. When the React app needs data, it sends an HTTP request (GET, POST, PATCH) to a specific URL (e.g., `GET /api/v1/transactions`). Flask receives this, queries the database, formats the data into JSON (JavaScript Object Notation), and sends it back to React to be displayed.

## 9. How Frontend/Backend Integration Works
We replaced all static "mock" data in React with dynamic API calls using **Axios**.
For example, in the `AdminDashboardPage.jsx`, the `useEffect` hook triggers an Axios request to `GET /api/v1/dashboards/admin/summary` as soon as the page loads. While waiting for the backend, React shows a Loading Spinner. Once the JSON response arrives, React updates its internal state and re-renders the charts with live data.

## 10. How the Review Workflow Works
When the ML model predicts a transaction has a >20% chance of being fraud, it automatically creates a `ReviewCase` in the database.
1. The Analyst logs into the UI and sees the queue.
2. They click a transaction and review the AI's "Fraud Explanation" (top contributing features).
3. They click "Mark as Fraud" or "Mark as Safe".
4. React sends a `PATCH /api/v1/cases/<id>/decision` request to Flask.
5. Flask updates the Transaction status to `Blocked` or `Approved` and removes the case from the queue.

## 11. How Audit Logging Works
To maintain strict compliance, every action is recorded.
When an analyst makes a decision, the `CaseService` in Flask doesn't just update the case. It also creates a new `AuditLog` entry detailing exactly *who* performed the action, *what* they did, and *when* they did it. This is stored permanently and displayed on the Admin's Audit Logs page, ensuring total transparency and accountability.
