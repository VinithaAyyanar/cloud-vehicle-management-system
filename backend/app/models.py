from datetime import datetime

from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db

ALLOWED_VEHICLE_TYPES = ("Car", "Bike", "Truck", "Bus", "Other")


def normalize_vehicle_type(value) -> str:
    raw = (value or "").strip()
    if not raw:
        return "Other"

    match = next(
        (vehicle_type for vehicle_type in ALLOWED_VEHICLE_TYPES if vehicle_type.lower() == raw.lower()),
        None,
    )
    if not match:
        raise ValueError(
            f"vehicle_type must be one of: {', '.join(ALLOWED_VEHICLE_TYPES)}"
        )
    return match


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="user")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    vehicles = db.relationship("Vehicle", backref="owner", lazy=True, cascade="all, delete")
    assigned_bookings = db.relationship(
        "ServiceBooking",
        foreign_keys="ServiceBooking.assigned_to",
        backref="assignee",
        lazy=True,
    )
    customer_bookings = db.relationship(
        "ServiceBooking",
        foreign_keys="ServiceBooking.customer_id",
        backref="customer",
        lazy=True,
    )

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


class Vehicle(db.Model):
    __tablename__ = "vehicles"

    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    plate_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    brand = db.Column(db.String(80), nullable=False)
    model = db.Column(db.String(80), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    vehicle_type = db.Column(db.String(20), nullable=False, default="Other", server_default="Other")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    bookings = db.relationship(
        "ServiceBooking", backref="vehicle", lazy=True, cascade="all, delete"
    )


class ServiceBooking(db.Model):
    __tablename__ = "service_bookings"

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey("vehicles.id"), nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    assigned_to = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    service_type = db.Column(db.String(120), nullable=False)
    scheduled_for = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(30), nullable=False, default="scheduled")
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    history = db.relationship(
        "ServiceStatusHistory", backref="booking", lazy=True, cascade="all, delete"
    )


class ServiceStatusHistory(db.Model):
    __tablename__ = "service_status_history"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(
        db.Integer, db.ForeignKey("service_bookings.id"), nullable=False, index=True
    )
    previous_status = db.Column(db.String(30), nullable=False)
    new_status = db.Column(db.String(30), nullable=False)
    changed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    changed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
