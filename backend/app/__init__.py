from flask import Flask, jsonify, render_template
from sqlalchemy import inspect, text

from .auth.routes import auth_bp
from .bookings.routes import bookings_bp
from .config import Config
from .dashboard.routes import dashboard_bp
from .extensions import db, jwt, metrics, migrate
from .vehicles.routes import vehicles_bp


def ensure_vehicle_type_column():
    inspector = inspect(db.engine)
    columns = {column["name"] for column in inspector.get_columns("vehicles")}

    if "vehicle_type" not in columns:
        db.session.execute(
            text("ALTER TABLE vehicles ADD COLUMN vehicle_type VARCHAR(20) NOT NULL DEFAULT 'Other'")
        )
        db.session.commit()

    db.session.execute(
        text("UPDATE vehicles SET vehicle_type = 'Other' WHERE vehicle_type IS NULL OR TRIM(vehicle_type) = ''")
    )
    db.session.commit()


def create_app(config_class=Config):
    app = Flask(__name__, template_folder="../templates", static_folder="../static")
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    metrics.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(vehicles_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(dashboard_bp)

    with app.app_context():
        db.create_all()
        ensure_vehicle_type_column()

    @app.get("/")
    def home():
        return render_template("index.html")

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "Not Found"}), 404

    @app.errorhandler(500)
    def server_error(_):
        return jsonify({"error": "Internal Server Error"}), 500

    return app
