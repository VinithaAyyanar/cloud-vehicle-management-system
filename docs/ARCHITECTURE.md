# Architecture (Text Diagram)

```text
Users (Web/API Clients)
        |
        v
[Flask App Container]
  - Auth Module (JWT)
  - Vehicle Module
  - Booking Module
  - Admin Analytics Module
  - Metrics Endpoint (/metrics)
        |
        v
[PostgreSQL Database]

DevOps Layer:
GitHub -> Jenkins Pipeline -> Docker Build -> Deploy (Docker/K8s)
                         \
                          -> Run Tests (pytest)

Monitoring Layer:
Prometheus <- scrape /metrics from Flask
Grafana <- query Prometheus and build dashboards
```

## Why this is scalable

- Stateless app containers allow horizontal scaling.
- PostgreSQL is separated as independent service.
- Kubernetes manifests support multi-replica deployment.
- Monitoring gives visibility into performance bottlenecks.

