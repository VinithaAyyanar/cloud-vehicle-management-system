# 🚗 Cloud-Based Vehicle Management System with DevOps

A cloud-based vehicle management system built using **Flask**, **PostgreSQL**, and modern **DevOps tools**. The project demonstrates secure authentication, vehicle and service management, CI/CD automation, containerization, and real-time monitoring.

---

## ✨ Features

- 🔐 JWT Authentication & Role-Based Access
- 🚘 Vehicle Management (CRUD)
- 🛠️ Service Booking & Tracking
- 📜 Service History
- 📊 Admin Dashboard
- 🐳 Docker Support
- ⚙️ Jenkins CI/CD
- 📈 Prometheus & Grafana Monitoring
- ☸️ Kubernetes Deployment

---

## 🛠️ Tech Stack

- Flask
- PostgreSQL
- JWT Authentication
- Docker
- Jenkins
- Kubernetes
- Prometheus
- Grafana
- Pytest

---

## 🚀 Run with Docker

```bash
copy .env.example .env
docker compose up -d --build
```

**Application:** http://localhost:5000

**Prometheus:** http://localhost:9090

**Grafana:** http://localhost:3000

---

## 💻 Run Locally

```bash
python -m venv .venv

.\.venv\Scripts\activate

pip install -r backend\requirements.txt

set DATABASE_URL=postgresql+psycopg2://vehicle_user:vehicle_pass@localhost:5432/vehicle_db

python backend\run.py
```

---

## 📂 Project Structure

```text
backend/
deploy/
docs/
docker-compose.yml
Jenkinsfile
```

---

## 📚 Documentation

- Architecture
- Database Schema
- API Endpoints
- Test Cases
- Viva Guide

---

## 📜 License

This project is developed for educational and portfolio purposes.

---

## 👩‍💻 Author

**Vinitha A**
