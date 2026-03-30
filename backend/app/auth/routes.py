from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token

from ..extensions import db
from ..models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    payload = request.get_json() or {}
    required = ["full_name", "email", "password"]
    if any(key not in payload or not payload[key] for key in required):
        return jsonify({"error": "full_name, email and password are required"}), 400

    if User.query.filter_by(email=payload["email"].lower()).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(
        full_name=payload["full_name"].strip(),
        email=payload["email"].lower().strip(),
        role=payload.get("role", "user"),
    )
    user.set_password(payload["password"])
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201


@auth_bp.post("/login")
def login():
    payload = request.get_json() or {}
    email = payload.get("email", "").lower().strip()
    password = payload.get("password", "")
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify(
        {
            "access_token": token,
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
            },
        }
    )

