# Testing Guide

Testing ensures the reliability and security of the system. This guide covers the various testing methodologies implemented across the stack.

---

## 1. Backend API & Logic Testing
Backend tests focus on business logic and API contracts.
- **Unit Testing Models**: Verifying that `Transaction` objects require valid amounts and `User` objects correctly hash passwords before saving to the database.
- **Service Layer Testing**: Bypassing HTTP to test the `PredictionService` directly. We pass mock transaction dictionaries to ensure it correctly calls the `FraudPredictor`, creates an `Alert`, and generates an `AuditLog` when the probability exceeds 20%.
- **API Endpoint Testing (Postman/PyTest)**:
  - Validating `POST /api/v1/auth/login` returns a 401 for incorrect passwords and a 200 with JWT for correct ones.
  - Ensuring `GET /api/v1/dashboards/admin/summary` returns a 403 Forbidden if accessed with an Analyst-tier JWT.

## 2. Machine Learning Testing
ML testing is fundamentally different from software testing.
- **Hold-Out Validation**: Evaluating the XGBoost model on the 20% test set that was completely hidden during training.
- **Threshold Tuning**: Testing different probability cutoffs (e.g., 0.5 vs 0.75) to find the perfect balance between False Positives (annoying customers) and False Negatives (losing money).
- **Inference Latency**: Benchmarking the `predict()` function to ensure it consistently executes in under 200ms.

## 3. Frontend & Integration Testing
Frontend testing verifies that the UI reacts correctly to backend states.
- **Authentication Flows**: 
  1. Entering invalid credentials shows an error message.
  2. Entering valid credentials redirects to `/analytics/executive`.
  3. Manipulating the `localStorage` token manually forces a redirect back to `/login` upon the next API call (via Axios interceptors).
- **Analyst Workflow Test**:
  1. Log in as Analyst.
  2. Click a pending case in the Review Queue.
  3. Click "Mark as Fraud".
  4. Verify the case disappears from the queue.
  5. Log in as Admin -> check the Audit Logs page to verify the decision was permanently recorded.

## 4. Sample Test Scenario: The "Exploit" Test
**Objective**: Ensure horizontal privilege escalation is impossible.
1. Log in as an Analyst. Extract the JWT from the browser network tab.
2. Open an API client (like Postman).
3. Attempt to `GET /api/v1/dashboards/admin/summary` using the Analyst JWT.
**Expected Result**: System returns `403 Forbidden` because the `@admin_required` decorator validates the role claims baked into the JWT.
