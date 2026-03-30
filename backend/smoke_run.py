from app import create_app
from app.extensions import db


def main():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        db.drop_all()
        db.create_all()

    register = client.post(
        "/api/auth/register",
        json={
            "full_name": "Demo User",
            "email": "demo@example.com",
            "password": "Pass123",
            "role": "user",
        },
    )
    login = client.post(
        "/api/auth/login", json={"email": "demo@example.com", "password": "Pass123"}
    )
    token = login.get_json()["access_token"]
    create_vehicle = client.post(
        "/api/vehicles",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "plate_number": "TS09AA1111",
            "brand": "Honda",
            "model": "City",
            "year": 2022,
        },
    )

    print("register", register.status_code)
    print("login", login.status_code)
    print("create_vehicle", create_vehicle.status_code)


if __name__ == "__main__":
    main()
