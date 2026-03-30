# API Endpoints

Base URL: `http://localhost:5000`

## Authentication

1. `POST /api/auth/register`
- Body:
```json
{
  "full_name": "Alice",
  "email": "alice@example.com",
  "password": "pass123",
  "role": "user"
}
```

2. `POST /api/auth/login`
- Body:
```json
{
  "email": "alice@example.com",
  "password": "pass123"
}
```
- Response returns `access_token`.

## Vehicle Management

1. `GET /api/vehicles` (JWT required)
2. `POST /api/vehicles` (JWT required)
3. `PUT /api/vehicles/{vehicle_id}` (JWT required)
4. `DELETE /api/vehicles/{vehicle_id}` (JWT required)

## Booking Management

1. `POST /api/bookings` (JWT required)
2. `GET /api/bookings` (JWT required)
3. `PUT /api/bookings/{booking_id}/status` (JWT required)
4. `GET /api/bookings/{booking_id}/history` (JWT required)

## Admin Analytics

1. `GET /api/admin/analytics` (JWT + role=admin)

## Monitoring

1. `GET /metrics` (Prometheus scrape endpoint)

