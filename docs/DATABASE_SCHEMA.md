# Database Schema

The system uses a normalized relational database (MySQL). Below is the breakdown of the core tables and their relationships.

---

## 1. `users` Table
Stores authentication and profile data.
- `id` (PK)
- `email` (String, Unique)
- `password_hash` (String)
- `full_name` (String)
- `role` (Enum: 'admin', 'analyst')
- `created_at` (DateTime)

## 2. `transactions` Table
The core entity representing a financial event.
- `id` (PK)
- `transaction_ref` (String, Unique)
- `amount` (Float)
- `merchant` (String)
- `merchant_type` (String)
- `payment_method` (String)
- `device_type` (String)
- `location` (String)
- `status` (Enum: 'Pending', 'Approved', 'Blocked', 'Refunded')
- `transaction_time` (DateTime)

## 3. `predictions` Table
Stores the exact output of the ML model for a specific transaction.
- `id` (PK)
- `transaction_id` (FK -> transactions.id)
- `fraud_probability` (Float, 0.0 to 1.0)
- `risk_level` (Enum: 'Low', 'Medium', 'High')
- `recommended_action` (String)
- `latency_ms` (Integer)
- `created_at` (DateTime)

## 4. `prediction_explanations` Table
Stores the feature-level breakdown of *why* the AI made a prediction.
- `id` (PK)
- `prediction_id` (FK -> predictions.id)
- `feature_name` (String)
- `impact` (Float)
- `note` (String)

## 5. `alerts` Table
Generated immediately if a prediction scores 'Medium' or 'High' risk.
- `id` (PK)
- `alert_ref` (String, Unique)
- `transaction_id` (FK -> transactions.id)
- `risk_level` (String)
- `confidence` (Float)
- `reason` (String)
- `status` (Enum: 'Open', 'Resolved', 'Dismissed')
- `created_at` (DateTime)

## 6. `review_cases` Table
The analyst workflow queue. Ties together alerts, predictions, and transactions.
- `id` (PK)
- `case_ref` (String, Unique)
- `transaction_id` (FK -> transactions.id)
- `prediction_id` (FK -> predictions.id)
- `priority` (Enum: 'Low', 'Medium', 'High', 'Critical')
- `status` (Enum: 'Open', 'In Review', 'Resolved')
- `assigned_to` (FK -> users.id, Nullable)
- `created_at` (DateTime)
- `resolved_at` (DateTime, Nullable)

## 7. `audit_logs` Table
An immutable record of system events for compliance.
- `id` (PK)
- `actor_user_id` (FK -> users.id, Nullable)
- `action` (String) - e.g., 'login', 'case_resolved', 'predict'
- `target_type` (String) - e.g., 'Case', 'Transaction'
- `target_id` (String)
- `metadata_json` (JSON)
- `ip_address` (String)
- `created_at` (DateTime)

---

### Key Relationships
- A `Transaction` has ONE `Prediction`.
- A `Prediction` has MANY `PredictionExplanations`.
- A `Transaction` can trigger ONE `Alert` and ONE `ReviewCase`.
- An `AuditLog` references a `User` (Actor) and a Target (Polymorphic via string references).
