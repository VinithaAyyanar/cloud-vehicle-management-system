from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models import ServiceBooking, ServiceStatusHistory, User, Vehicle

bookings_bp = Blueprint("bookings", __name__, url_prefix="/api/bookings")
VALID_STATUSES = {"scheduled", "assigned", "in_progress", "completed", "cancelled"}


@bookings_bp.post("")
@jwt_required()
def create_booking():
    payload = request.get_json() or {}
    required = ["vehicle_id", "service_type", "scheduled_for"]
    if any(key not in payload or not payload[key] for key in required):
        return jsonify({"error": "vehicle_id, service_type and scheduled_for are required"}), 400

    current_user_id = int(get_jwt_identity())
    vehicle = Vehicle.query.get_or_404(payload["vehicle_id"])
    user = User.query.get_or_404(current_user_id)
    if user.role != "admin" and vehicle.owner_id != current_user_id:
        return jsonify({"error": "Forbidden"}), 403

    try:
        scheduled_for = datetime.fromisoformat(payload["scheduled_for"])
    except ValueError:
        return jsonify({"error": "Use ISO datetime format for scheduled_for"}), 400

    booking = ServiceBooking(
        vehicle_id=vehicle.id,
        customer_id=vehicle.owner_id,
        service_type=payload["service_type"].strip(),
        scheduled_for=scheduled_for,
        notes=payload.get("notes"),
    )
    db.session.add(booking)
    db.session.flush()

    db.session.add(
        ServiceStatusHistory(
            booking_id=booking.id,
            previous_status="none",
            new_status="scheduled",
            changed_by=current_user_id,
        )
    )
    db.session.commit()
    return jsonify({"message": "Booking created", "id": booking.id}), 201


@bookings_bp.get("")
@jwt_required()
def list_bookings():
    current_user_id = int(get_jwt_identity())
    user = User.query.get_or_404(current_user_id)
    query = ServiceBooking.query.order_by(ServiceBooking.created_at.desc())
    if user.role != "admin":
        query = query.filter_by(customer_id=current_user_id)

    bookings = query.all()
    return jsonify(
        [
            {
                "id": b.id,
                "vehicle_id": b.vehicle_id,
                "customer_id": b.customer_id,
                "assigned_to": b.assigned_to,
                "service_type": b.service_type,
                "scheduled_for": b.scheduled_for.isoformat(),
                "status": b.status,
                "notes": b.notes,
            }
            for b in bookings
        ]
    )


@bookings_bp.put("/<int:booking_id>/status")
@jwt_required()
def update_status(booking_id):
    payload = request.get_json() or {}
    new_status = payload.get("status", "").strip()
    if new_status not in VALID_STATUSES:
        return jsonify({"error": f"Invalid status. Use one of: {sorted(VALID_STATUSES)}"}), 400

    current_user_id = int(get_jwt_identity())
    user = User.query.get_or_404(current_user_id)
    booking = ServiceBooking.query.get_or_404(booking_id)

    if user.role != "admin" and booking.customer_id != current_user_id:
        return jsonify({"error": "Forbidden"}), 403

    previous = booking.status
    booking.status = new_status
    if "assigned_to" in payload and user.role == "admin":
        booking.assigned_to = payload["assigned_to"]

    db.session.add(
        ServiceStatusHistory(
            booking_id=booking.id,
            previous_status=previous,
            new_status=new_status,
            changed_by=current_user_id,
        )
    )
    db.session.commit()
    return jsonify({"message": "Booking status updated"})


@bookings_bp.put("/<int:booking_id>/reschedule")
@jwt_required()
def reschedule_booking(booking_id):
    payload = request.get_json() or {}
    scheduled_raw = payload.get("scheduled_for", "").strip()
    if not scheduled_raw:
        return jsonify({"error": "scheduled_for is required"}), 400

    try:
        scheduled_for = datetime.fromisoformat(scheduled_raw)
    except ValueError:
        return jsonify({"error": "Use ISO datetime format for scheduled_for"}), 400

    current_user_id = int(get_jwt_identity())
    user = User.query.get_or_404(current_user_id)
    booking = ServiceBooking.query.get_or_404(booking_id)

    if user.role != "admin" and booking.customer_id != current_user_id:
        return jsonify({"error": "Forbidden"}), 403

    booking.scheduled_for = scheduled_for
    db.session.commit()
    return jsonify({"message": "Booking rescheduled"})


@bookings_bp.get("/<int:booking_id>/history")
@jwt_required()
def booking_history(booking_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get_or_404(current_user_id)
    booking = ServiceBooking.query.get_or_404(booking_id)
    if user.role != "admin" and booking.customer_id != current_user_id:
        return jsonify({"error": "Forbidden"}), 403

    history = (
        ServiceStatusHistory.query.filter_by(booking_id=booking_id)
        .order_by(ServiceStatusHistory.changed_at.desc())
        .all()
    )
    return jsonify(
        [
            {
                "id": row.id,
                "previous_status": row.previous_status,
                "new_status": row.new_status,
                "changed_by": row.changed_by,
                "changed_at": row.changed_at.isoformat(),
            }
            for row in history
        ]
    )
