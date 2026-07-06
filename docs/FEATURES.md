# System Features Breakdown

The system is highly modular, with distinct features segmented by operational roles.

---

## 1. Machine Learning Features
- **Real-Time Inference API**: Analyzes complex transaction structures in under 200ms.
- **Explainable AI (XAI)**: Outputs the exact mathematical reasons (top contributing features) for every prediction to aid human understanding.
- **Automated Workflow Routing**: Dynamically categorizes transactions into `Low`, `Medium`, or `High` risk, automatically pushing Medium/High to the manual review queue.

## 2. Administrator Features
- **Executive Dashboard**: Real-time aggregation of total transactions, total fraud, and fraud rates.
- **Risk Distribution Visuals**: Pie charts and trend lines mapping the financial portfolio's risk exposure over time.
- **System Audit Trail**: A read-only, paginated view of every action taken by any user in the system, ensuring complete compliance and transparency.

## 3. Analyst Features
- **Review Workspace**: A specialized queue displaying prioritized pending cases.
- **Contextual Investigation**: Analysts can view the transaction details, the AI's probability score, and the exact reasons the AI flagged it.
- **Decision Engine**: One-click actions to mark cases as `Fraud` (blocking the transaction) or `Safe` (releasing it).

## 4. Security & Architecture Features
- **JWT Authentication**: Stateless, cryptographically secure session management.
- **Role-Based Access Control (RBAC)**: Strict API-level separation. Analysts cannot view system-wide audit logs, and external requests are completely blocked.
- **Axios Interceptors**: The frontend automatically catches expired sessions and forces re-authentication seamlessly.
- **Immutable Audit Logging**: The database is designed such that actions cannot be silently altered or deleted. Every API mutation triggers an audit record automatically.

## 5. UI/UX Features
- **Fintech Dark Mode Aesthetics**: Professional, high-contrast design optimized for prolonged analyst use.
- **Framer Motion Micro-Animations**: Fluid transitions that indicate system state without jarring the user.
- **Loading Skeletons**: Prevents layout shift while the React frontend fetches data from the Flask API.
