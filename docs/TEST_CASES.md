# Sample Test Cases

## Automated (Pytest)

1. Register a user and login.
2. Create a vehicle with JWT token.
3. Register admin and access analytics endpoint.

## Manual Functional Tests

1. Invalid login should return `401`.
2. Duplicate email registration should return `409`.
3. Duplicate vehicle plate number should return `409`.
4. Non-owner/non-admin update of vehicle should return `403`.
5. Invalid booking status should return `400`.

## Non-Functional Tests

1. API health under concurrent requests (run with JMeter/k6).
2. Container restart behavior (`restart: unless-stopped`).
3. Monitoring verification in Grafana dashboards.

