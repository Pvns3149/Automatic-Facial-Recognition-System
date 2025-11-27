from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

from config import config

db = SQLAlchemy()


def create_app(config_name="default"):
    """Application factory for creating Flask app instances."""
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    CORS(app)

    # Register blueprints
    from app.routes import api_bp

    app.register_blueprint(api_bp, url_prefix="/api")

    # Create database tables
    with app.app_context():
        db.create_all()

    return app
