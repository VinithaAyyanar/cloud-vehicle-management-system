def register_user(client, full_name, email, password, role="user"):
    return client.post(
        "/api/auth/register",
        json={
            "full_name": full_name,
            "email": email,
            "password": password,
            "role": role,
        },
    )


def login_user(client, email, password):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    data = res.get_json()
    return data["access_token"]


def test_register_login_and_create_vehicle(client):
    assert register_user(client, "Alice", "alice@example.com", "pass123").status_code == 201
    token = login_user(client, "alice@example.com", "pass123")

    res = client.post(
        "/api/vehicles",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "plate_number": "KA01AB1234",
            "brand": "Toyota",
            "model": "Etios",
            "year": 2020,
            "vehicle_type": "Car",
        },
    )
    assert res.status_code == 201

    list_res = client.get("/api/vehicles", headers={"Authorization": f"Bearer {token}"})
    vehicle = list_res.get_json()[0]
    assert vehicle["vehicle_type"] == "Car"


def test_vehicle_type_defaults_to_other_and_filtering_works(client):
    assert register_user(client, "Alice", "alice@example.com", "pass123").status_code == 201
    token = login_user(client, "alice@example.com", "pass123")

    create_res = client.post(
        "/api/vehicles",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "plate_number": "KA09CD5678",
            "brand": "Honda",
            "model": "City",
            "year": 2022,
        },
    )
    assert create_res.status_code == 201

    filter_res = client.get(
        "/api/vehicles?vehicle_type=Other",
        headers={"Authorization": f"Bearer {token}"},
    )
    vehicles = filter_res.get_json()
    assert len(vehicles) == 1
    assert vehicles[0]["vehicle_type"] == "Other"


def test_vehicle_type_validation_rejects_invalid_value(client):
    assert register_user(client, "Alice", "alice@example.com", "pass123").status_code == 201
    token = login_user(client, "alice@example.com", "pass123")

    res = client.post(
        "/api/vehicles",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "plate_number": "KA77ZZ0001",
            "brand": "Tata",
            "model": "Safari",
            "year": 2024,
            "vehicle_type": "Plane",
        },
    )
    assert res.status_code == 400
    assert "vehicle_type" in res.get_json()["error"]


def test_admin_analytics_access(client):
    register_user(client, "Admin", "admin@example.com", "admin123", role="admin")
    token = login_user(client, "admin@example.com", "admin123")

    client.post(
        "/api/vehicles",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "plate_number": "DL01AB1111",
            "brand": "Ashok Leyland",
            "model": "City Bus",
            "year": 2021,
            "vehicle_type": "Bus",
        },
    )

    res = client.get("/api/admin/analytics", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.get_json()
    assert any(item["vehicle_type"] == "Bus" for item in data["vehicle_type_distribution"])
