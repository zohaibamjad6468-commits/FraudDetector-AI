# System Architecture

The AI-Powered Fraud Detection System implements an Enterprise-grade 3-Tier Architecture.

---

## 1. Overall System Flow

```mermaid
graph TD
    Client[React Frontend] -->|HTTPS / JSON| API[Flask REST API]
    
    subgraph Backend [Flask Application Server]
        API --> Auth[JWT Middleware & RBAC]
        Auth --> Services[Service Layer]
        
        Services --> ML[ML Singleton Loader]
        ML --> Model[(XGBoost Artifacts)]
        
        Services --> ORM[SQLAlchemy ORM]
    end
    
    ORM --> DB[(MySQL Database)]
```

## 2. Frontend Architecture (React + Vite)
- **Component-Driven**: UIs are constructed from reusable components (e.g., `RiskBadge`, `LoadingSkeleton`).
- **Context API**: Global state management for authentication (`AuthContext.jsx`).
- **Axios Interceptors**: The API service layer automatically injects JWT tokens into headers and intercepts `401` errors globally to redirect users to the login screen.
- **Routing**: `react-router-dom` handles client-side routing securely.

## 3. Backend Architecture (Flask)
We employ the **Application Factory Pattern** with **Blueprints**:
- `app/__init__.py`: Initializes the app, database, and JWT manager.
- `app/auth`, `app/predictions`, etc.: Blueprints encapsulate distinct domain logic.
- **Service Layer Pattern**: Controllers (`routes.py`) are thin. They parse requests and immediately pass data to `services.py`. This separation ensures business logic is testable independently of HTTP contexts.
- **Error Handling**: Custom exception handlers automatically format Python errors into standardized JSON responses (`{ status: "error", message: "..." }`).

## 4. Machine Learning Architecture
```mermaid
sequenceDiagram
    participant API as Predictions API
    participant SVC as Prediction Service
    participant PR as Preprocessor
    participant ML as XGBoost Model
    
    API->>SVC: analyze(transaction)
    SVC->>PR: format & scale features
    PR->>SVC: scaled_tensor
    SVC->>ML: predict(scaled_tensor)
    ML-->>SVC: Probability (e.g. 0.85)
    SVC->>SVC: Apply Business Logic (High Risk)
    SVC->>API: Return JSON Response
```
- **Thread-Safe Singleton**: The `ModelLoader` ensures the 85KB XGBoost model is only loaded from disk *once* when the server starts, preventing Memory/IO bottlenecks during concurrent API requests.

## 5. Database Flow (SQLAlchemy)
The system uses the Unit of Work pattern implicitly provided by SQLAlchemy sessions.
When a transaction is predicted as "High Risk":
1. `Transaction` is `add()`ed.
2. `Prediction` and `Explanations` are `add()`ed.
3. `Alert` and `ReviewCase` are `add()`ed.
4. `AuditLog` is `add()`ed.
5. `db.session.commit()` ensures atomicity. If any step fails, the entire block rolls back, preventing orphaned alerts.
