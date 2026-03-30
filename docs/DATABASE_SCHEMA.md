# Database Schema

## Tables

1. `users`
- `id` (PK)
- `full_name`
- `email` (unique)
- `password_hash`
- `role` (`admin` or `user`)
- `created_at`

2. `vehicles`
- `id` (PK)
- `owner_id` (FK -> users.id)
- `plate_number` (unique)
- `brand`
- `model`
- `year`
- `created_at`

3. `service_bookings`
- `id` (PK)
- `vehicle_id` (FK -> vehicles.id)
- `customer_id` (FK -> users.id)
- `assigned_to` (FK -> users.id, nullable)
- `service_type`
- `scheduled_for`
- `status`
- `notes`
- `created_at`
- `updated_at`

4. `service_status_history`
- `id` (PK)
- `booking_id` (FK -> service_bookings.id)
- `previous_status`
- `new_status`
- `changed_by` (FK -> users.id)
- `changed_at`

## Relationships

- One user can own many vehicles.
- One vehicle can have many bookings.
- One booking can have many status history records.
- Admin can be assigned to manage booking progress.

