# Cloud-Based Vehicle Management System with DevOps

Production-ready final-year project using Flask, PostgreSQL, Docker, Jenkins, Prometheus, and Grafana.

## 1. Folder Structure

```text
cloud-vehicle-management-system/
  backend/
    app/
      auth/
      vehicles/
      bookings/
      dashboard/
      utils/
      __init__.py
      config.py
      extensions.py
      models.py
    static/
    templates/
    tests/
    Dockerfile
    requirements.txt
    run.py
  deploy/
    k8s/
    monitoring/
  docs/
    API_ENDPOINTS.md
    ARCHITECTURE.md
    DATABASE_SCHEMA.md
    TEST_CASES.md
    VIVA_GUIDE.md
  .env.example
  Jenkinsfile
  docker-compose.yml
```

## 2. Key Features

- JWT authentication (register/login)
- Role-based authorization (`admin` and `user`)
- Vehicle CRUD operations
- Service booking and status tracking
- Service history logging
- Admin analytics dashboard API
- `/metrics` endpoint for Prometheus scraping

## 3. Quick Start (Local with Docker)

1. Copy env file:
   `copy .env.example .env`
2. Start stack:
   `docker compose up -d --build`
3. Open:
   - App: `http://localhost:5000`
   - Prometheus: `http://localhost:9090`
   - Grafana: `http://localhost:3000` (admin/admin123)

## 4. Run Locally Without Docker

1. `python -m venv .venv`
2. `.\.venv\Scripts\activate`
3. `pip install -r backend\requirements.txt`
4. `set DATABASE_URL=postgresql+psycopg2://vehicle_user:vehicle_pass@localhost:5432/vehicle_db`
5. `python backend\run.py`

## 5. Jenkins CI/CD Pipeline

`Jenkinsfile` includes:
- Checkout from GitHub (with webhook trigger)
- Dependency installation
- Pytest execution
- Docker image build
- Container deployment with Docker Compose

## 6. Kubernetes Deployment (Optional/Preferred)

Apply manifests:

```bash
kubectl apply -f deploy/k8s/namespace.yaml
kubectl apply -f deploy/k8s/postgres.yaml
kubectl apply -f deploy/k8s/app.yaml
```

## 7. Monitoring and Observability

- Prometheus scrapes Flask app metrics from `/metrics`
- Grafana visualizes response times, throughput, errors
- Logs visible via Docker logs and Kubernetes logs

## 8. DevOps Concepts Applied

- Infrastructure as Code: Docker Compose and Kubernetes YAML
- CI/CD automation: Jenkins pipeline
- Continuous testing: Pytest stage in pipeline
- Containerization: Optimized Python slim image with non-root user
- Monitoring: Prometheus + Grafana integration
- Security basics: JWT auth, RBAC, environment-based secrets

## 9. Useful Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [API Endpoints](docs/API_ENDPOINTS.md)
- [Sample Tests](docs/TEST_CASES.md)
- [Viva Explanation](docs/VIVA_GUIDE.md)

