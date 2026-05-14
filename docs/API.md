# API Documentation — [PROJECT_NAME]

---

## Base URL

| Environment | URL |
|---|---|
| Local | `http://localhost:3000/api/v1` |
| Staging | `https://staging.example.com/api/v1` |
| Production | `https://api.example.com/api/v1` |

---

## Authentication

All endpoints except those marked **Public** require a JWT bearer token.

```
Authorization: Bearer <access_token>
```

Tokens are obtained via `POST /auth/login` or `POST /auth/register`.
Access tokens expire after 15 minutes. Use `POST /auth/refresh` to get a new one.

---

## Request/Response Format

All requests and responses use `Content-Type: application/json`.

### Success Response
```json
{ "data": { ... } }
```

### Paginated Response
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 42,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found",
    "details": []
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body/params failed validation |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Authenticated but not authorized for this action |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate resource (e.g., email already registered) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limiting

| Endpoint Group | Limit |
|---|---|
| All authenticated routes | 1000 req/min per user |
| `POST /auth/login` | 5 req/15 min per IP |
| `POST /auth/register` | 10 req/hour per IP |
| All unauthenticated routes | 100 req/min per IP |

Rate limit headers included on every response:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset` (Unix timestamp)

---

## Endpoints

### System

#### `GET /health` — Public
Returns service health status.

**Response 200**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": { "status": "ok", "latencyMs": 12 },
    "redis": { "status": "ok", "latencyMs": 3 }
  }
}
```

---

### Auth

#### `POST /auth/register` — Public
Create a new user account.

**Request**:
```json
{ "email": "alice@example.com", "password": "SecurePass1!", "name": "Alice" }
```

**Response 201**:
```json
{
  "data": {
    "accessToken": "eyJ...",
    "user": { "id": "uuid", "email": "alice@example.com", "name": "Alice" }
  }
}
```

---

#### `POST /auth/login` — Public
Authenticate with email and password.

**Request**:
```json
{ "email": "alice@example.com", "password": "SecurePass1!" }
```

**Response 200**: same as register.
**Response 401**: Invalid credentials.

---

#### `POST /auth/refresh` — Public (requires valid refresh token in cookie or body)
Exchange a refresh token for a new access token.

**Response 200**:
```json
{ "data": { "accessToken": "eyJ..." } }
```

---

### Users

#### `GET /users` — Requires Auth, Admin only
List all users with pagination.

**Query params**: `page`, `pageSize` (default: 1, 20)

#### `GET /users/me` — Requires Auth
Get the current authenticated user's profile.

#### `GET /users/:id` — Requires Auth
Get a user by ID.

#### `PUT /users/:id` — Requires Auth (own profile or Admin)
Update user profile.

**Request**:
```json
{ "name": "Alice Smith" }
```

#### `DELETE /users/:id` — Requires Auth, Admin only
Soft-delete a user.
