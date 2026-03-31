from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models import User, Vehicle, normalize_vehicle_type

vehicles_bp = Blueprint("vehicles", __name__, url_prefix="/api/vehicles")


def parse_optional_date(value, field_name):
    raw = (value or "").strip()
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw).date()
    except ValueError as exc:
        raise ValueError(f"{field_name} must be in YYYY-MM-DD format") from exc


@vehicles_bp.get("")
@jwt_required()
def list_vehicles():
    current_user_id = int(get_jwt_identity())
    user = User.query.get_or_404(current_user_id)
    selected_type = (request.args.get("vehicle_type") or "").strip()

    if selected_type and selected_type.lower() != "all":
        try:
            selected_type = normalize_vehicle_type(selected_type)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
    else:
        selected_type = ""

    if user.role == "admin":
        query = Vehicle.query
    else:
        query = Vehicle.query.filter_by(owner_id=current_user_id)

    if selected_type:
        query = query.filter_by(vehicle_type=selected_type)

    vehicles = query.order_by(Vehicle.created_at.desc()).all()

    return jsonify(
        [
            {
                "id": v.id,
                "plate_number": v.plate_number,
                "brand": v.brand,
                "model": v.model,
                "year": v.year,
                "vehicle_type": normalize_vehicle_type(v.vehicle_type),
                "insurance_expiry": v.insurance_expiry.isoformat() if v.insurance_expiry else None,
                "permit_expiry": v.permit_expiry.isoformat() if v.permit_expiry else None,
                "owner_id": v.owner_id,
            }
            for v in vehicles
        ]
    )


@vehicles_bp.post("")
@jwt_required()
def create_vehicle():
    payload = request.get_json() or {}
    required = ["plate_number", "brand", "model", "year"]
    if any(key not in payload for key in required):
        return jsonify({"error": "plate_number, brand, model and year are required"}), 400

    try:
        vehicle_type = normalize_vehicle_type(payload.get("vehicle_type"))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    current_user_id = int(get_jwt_identity())
    if Vehicle.query.filter_by(plate_number=payload["plate_number"].upper().strip()).first():
        return jsonify({"error": "Plate number already exists"}), 409

    try:
        insurance_expiry = parse_optional_date(payload.get("insurance_expiry"), "insurance_expiry")
        permit_expiry = parse_optional_date(payload.get("permit_expiry"), "permit_expiry")
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    vehicle = Vehicle(
        owner_id=current_user_id,
        plate_number=payload["plate_number"].upper().strip(),
        brand=payload["brand"].strip(),
        model=payload["model"].strip(),
        year=int(payload["year"]),
        vehicle_type=vehicle_type,
        insurance_expiry=insurance_expiry,
        permit_expiry=permit_expiry,
    )
    db.session.add(vehicle)
    db.session.commit()
    return jsonify({"message": "Vehicle created", "id": vehicle.id}), 201


@vehicles_bp.put("/<int:vehicle_id>")
@jwt_required()
def update_vehicle(vehicle_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get_or_404(current_user_id)
    vehicle = Vehicle.query.get_or_404(vehicle_id)

    if user.role != "admin" and vehicle.owner_id != current_user_id:
        return jsonify({"error": "Forbidden"}), 403

    payload = request.get_json() or {}
    for field in ["brand", "model", "year"]:
        if field in payload:
            value = payload[field]
            if field in {"brand", "model"} and isinstance(value, str):
                value = value.strip()
            if field == "year":
                value = int(value)
            setattr(vehicle, field, value)

    if "vehicle_type" in payload:
        try:
            vehicle.vehicle_type = normalize_vehicle_type(payload.get("vehicle_type"))
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

    for field in ["insurance_expiry", "permit_expiry"]:
        if field in payload:
            try:
                setattr(vehicle, field, parse_optional_date(payload.get(field), field))
            except ValueError as exc:
                return jsonify({"error": str(exc)}), 400

    db.session.commit()
    return jsonify({"message": "Vehicle updated"})


@vehicles_bp.delete("/<int:vehicle_id>")
@jwt_required()
def delete_vehicle(vehicle_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get_or_404(current_user_id)
    vehicle = Vehicle.query.get_or_404(vehicle_id)

    if user.role != "admin" and vehicle.owner_id != current_user_id:
        return jsonify({"error": "Forbidden"}), 403

    db.session.delete(vehicle)
    db.session.commit()
    return jsonify({"message": "Vehicle deleted"})
