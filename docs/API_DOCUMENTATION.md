# API Documentation

The backend exposes a RESTful API communicating via JSON. The base URL for all endpoints is `http://127.0.0.1:5000/api/v1`.

---

## 1. Authentication APIs

### Login
- **Endpoint**: `POST /auth/login`
- **Description**: Authenticates a user and returns JWT tokens.
- **Request Body**:
  ```json
  {
    "email": "admin@finguard.ai",
    "password": "password123"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "status": "success",
    "message": "Login successful",
    "data": {
      "accessToken": "eyJhb...",
      "refreshToken": "eyJhb...",
      "user": { "id": 1, "email": "admin@finguard.ai", "role": "admin" }
    }
  }
  ```

### Get Current User
- **Endpoint**: `GET /auth/me`
- **Requires**: JWT Bearer Token (Any Role)
- **Response** (200 OK): Returns the logged-in user's profile and role.

---

## 2. Prediction APIs

### Analyze Transaction
- **Endpoint**: `POST /predictions/analyze`
- **Requires**: JWT Bearer Token (Any Role)
- **Description**: Evaluates a transaction through the XGBoost ML pipeline.
- **Request Body**:
  ```json
  {
    "amount": 1250.00,
    "merchant_type": "Retail",
    "device_type": "Mobile",
    "payment_method": "Credit Card",
    "location": "International"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "status": "success",
    "data": {
      "transactionId": "...",
      "fraudProbability": 0.89,
      "riskLevel": "High",
      "decision": "Blocked",
      "topFeatures": [
        {"feature_name": "amount", "impact": 0.45, "note": "Unusually high amount"}
      ]
    }
  }
  ```

---

## 3. Workflow & Cases APIs

### Get Pending Queue
- **Endpoint**: `GET /cases/queue`
- **Requires**: JWT Bearer Token (Analyst or Admin)
- **Description**: Retrieves all cases currently requiring manual review.
- **Response** (200 OK): Returns an array of cases including embedded transaction details and explanations.

### Submit Decision
- **Endpoint**: `PATCH /cases/<case_id>/decision`
- **Requires**: JWT Bearer Token (Analyst)
- **Request Body**:
  ```json
  {
    "decision": "fraud",
    "notes": "Verified unauthorized IP address."
  }
  ```
- **Response** (200 OK): Confirms case closure and transaction status update.

---

## 4. Transaction APIs

### List Transactions
- **Endpoint**: `GET /transactions`
- **Requires**: JWT Bearer Token (Any Role)
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `per_page`: Items per page (default: 50)
  - `status`: Filter by status (e.g., 'Blocked', 'Approved')
- **Response** (200 OK): Returns paginated transaction history.

---

## 5. Dashboard APIs

### Admin Summary
- **Endpoint**: `GET /dashboards/admin/summary`
- **Requires**: JWT Bearer Token (Admin Only)
- **Description**: Aggregates platform-wide statistics for the UI.
- **Response** (200 OK):
  ```json
  {
    "status": "success",
    "data": {
      "totalTransactions": 1520,
      "fraudCount": 42,
      "fraudRate": 2.76,
      "pendingReviews": 5,
      "riskDistribution": { "high": 42, "medium": 120, "low": 1358 }
    }
  }
  ```

---

## 6. Audit APIs

### Get Audit Logs
- **Endpoint**: `GET /audit/logs`
- **Requires**: JWT Bearer Token (Admin Only)
- **Description**: Retrieves the immutable history of system actions.
- **Response** (200 OK): Returns paginated audit logs detailing actors, actions, and timestamps.
