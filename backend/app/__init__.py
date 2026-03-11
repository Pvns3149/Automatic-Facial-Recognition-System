from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import config

db = SQLAlchemy()
migrate = Migrate()


def create_app(config_name):

    #Create flask instance
    app = Flask(__name__)
    app.config.from_object(config[config_name]) #Change from dev to prod when done

    # Initialize db and CORS extensions
    db.init_app(app)
    migrate.init_app(app, db)

    #Allow all origins
    CORS(app)

    # Register blueprints
    from app.routes import api_bp

    app.register_blueprint(api_bp, url_prefix="/api")

    return app
