from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from ..extensions import db
from ..models import ServiceBooking, User, Vehicle, normalize_vehicle_type
from ..utils.decorators import roles_required

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/admin")


@dashboard_bp.get("/analytics")
@jwt_required()
@roles_required("admin")
def analytics():
    total_users = db.session.query(func.count(User.id)).scalar()
    total_vehicles = db.session.query(func.count(Vehicle.id)).scalar()
    total_bookings = db.session.query(func.count(ServiceBooking.id)).scalar()
    booking_status = (
        db.session.query(ServiceBooking.status, func.count(ServiceBooking.id))
        .group_by(ServiceBooking.status)
        .all()
    )
    vehicle_type_counts = (
        db.session.query(Vehicle.vehicle_type, func.count(Vehicle.id))
        .group_by(Vehicle.vehicle_type)
        .all()
    )

    return jsonify(
        {
            "totals": {
                "users": total_users,
                "vehicles": total_vehicles,
                "bookings": total_bookings,
            },
            "booking_status_distribution": [
                {"status": status, "count": count} for status, count in booking_status
            ],
            "vehicle_type_distribution": [
                {"vehicle_type": normalize_vehicle_type(vehicle_type), "count": count}
                for vehicle_type, count in vehicle_type_counts
            ],
        }
    )
