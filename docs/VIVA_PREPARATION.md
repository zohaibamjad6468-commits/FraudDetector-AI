# Viva Preparation Guide

This document contains likely questions and technical explanations to prepare for the final year project presentation and viva.

---

## 1. Machine Learning Concepts

**Q: Why did you choose XGBoost instead of Random Forest or a Neural Network?**
**A**: XGBoost builds decision trees sequentially to correct previous errors (Boosting), while Random Forest builds them independently (Bagging). For tabular, structured financial data, XGBoost is generally faster to train, highly resistant to overfitting, and often outperforms deep neural networks, which require massive amounts of data and compute.

**Q: How did you handle the fact that 99% of transactions are not fraud?**
**A**: This is called the "Class Imbalance" problem. I used SMOTE (Synthetic Minority Over-sampling Technique) on the training set. It synthetically generated new fraud examples based on the characteristics of the real ones, balancing the dataset so the XGBoost model could actually learn fraud patterns instead of just guessing "Not Fraud" every time.

**Q: What is RobustScaler and why didn't you use StandardScaler?**
**A**: `StandardScaler` calculates the mean of the data. In credit card data, a few massive fraudulent transactions can skew the mean horribly. `RobustScaler` uses the median and interquartile range, making it immune to extreme outliers.

## 2. Backend & Architectural Concepts

**Q: Why did you separate the backend into 'routes' and 'services'?**
**A**: It's called the Service Layer pattern. If I put all the database logic inside the API route, the code becomes impossible to test without simulating HTTP requests. By separating them, the `routes.py` only handles web stuff (JSON, Headers), and `services.py` handles the pure Python business logic.

**Q: How does the system handle security and logins?**
**A**: It uses stateless JWT (JSON Web Tokens). When a user logs in, the backend cryptographically signs a token containing their User ID and Role. The React frontend stores this and sends it with every request. The backend verifies the signature. This is better than sessions because it scales infinitely—the server doesn't need to remember who is logged in.

**Q: How do you prevent an Analyst from accessing Admin data?**
**A**: Role-Based Access Control (RBAC). The JWT payload contains the user's role. I wrote custom Python decorators (`@admin_required`). If the decoded token says 'analyst', the decorator blocks the function execution and returns a 403 Forbidden.

## 3. Frontend & Database Concepts

**Q: How does the React frontend communicate with the Flask backend?**
**A**: Through asynchronous REST APIs using the `Axios` library. I built Axios interceptors that automatically attach the JWT to every outgoing request. If the backend returns a 401 Unauthorized (e.g., token expired), the interceptor catches it globally and redirects the user to the login page.

**Q: Why did you use a relational database (MySQL) instead of NoSQL (MongoDB)?**
**A**: Financial systems require strict ACID (Atomicity, Consistency, Isolation, Durability) properties. The relationships between Transactions, Predictions, Alerts, and Audit Logs must maintain perfect referential integrity. A relational database enforces this via Foreign Keys.

**Q: Explain the Audit Log system.**
**A**: To ensure compliance, the database is designed so actions can't be deleted. Whenever a user makes an API request that changes data (like an Analyst reviewing a case), the Flask Service simultaneously creates an `AuditLog` entry detailing the user ID, the action, and the timestamp. This guarantees an immutable trail of accountability.

## 4. Advanced Features (New Additions)

**Q: Your XGBoost model expects 28 PCA features (V1-V28), but your frontend only asks for Merchant and Amount. How does this work?**
**A**: I built a `SyntheticFeatureGenerator` in the backend. When a transaction comes in, the generator evaluates the risk profile of the Merchant, Location, and Amount, and generates a realistic V1-V28 vector with added Gaussian noise. This allows the real XGBoost model to natively predict fraud rather than relying on hardcoded `if` statements.

**Q: How are you showing real-time notifications when a new high-risk transaction occurs?**
**A**: I implemented an asynchronous polling mechanism in React (`useAlertPolling` hook). Every 30 seconds, it queries the backend's review queue in the background. If the count of high-risk cases increases, it triggers a global Toast notification. I chose polling over WebSockets because it is lightweight and perfectly adequate for a 30-second SLA without requiring a complex Redis/Socket.IO infrastructure.

**Q: How did you implement the 15-minute Session Timeout (FR-03)?**
**A**: I created a custom React hook `useIdleTimeout` that listens to global DOM events like `mousemove`, `keydown`, and `click`. If no activity is detected for 14 minutes, it displays an animated warning banner. If 15 minutes pass, it automatically clears the JWT token from localStorage and redirects to the login screen.

**Q: How are the PDF and CSV reports generated?**
**A**: For CSV, I use Python's built-in `csv` module and `io.StringIO` to stream data directly into the HTTP response. For the PDF, I dynamically generate a styled HTML string in Flask and return it to the frontend. When the frontend receives it, it opens in a new tab and automatically triggers the browser's native `window.print()` dialog, allowing the user to seamlessly "Save as PDF" without requiring heavy backend dependencies like ReportLab.
