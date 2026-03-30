# Module Explanation (Simple Viva Style)

## 1. Authentication Module

- Handles register and login.
- Uses JWT token so user stays authenticated securely.
- Role is stored in token claims (`admin` or `user`).

## 2. Vehicle Module

- Users can add and manage their vehicles.
- Admin can view all vehicles.
- Includes CRUD operations and access checks.

## 3. Service Booking Module

- User creates a booking for a vehicle service.
- Booking has lifecycle: `scheduled -> assigned -> in_progress -> completed/cancelled`.
- Every status change is stored in history table for tracking.

## 4. Admin Dashboard Module

- Shows total users, vehicles, and bookings.
- Shows booking count by status.
- Helps admin monitor system activity.

## 5. DevOps Module

- Jenkins automates build/test/deploy.
- Docker packages app for environment consistency.
- Kubernetes manifests show scalable deployment model.
- Prometheus + Grafana provide observability.

## 6. Security and Best Practices

- JWT authentication
- Role-based authorization
- Environment-based secrets
- Structured project layout
- Error handlers and API response consistency

