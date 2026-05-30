import os
from dotenv import load_dotenv

load_dotenv()

# Config to load variables for diff phases. Use class below to overwrite parent.
#Written by Puvan 2026 - Dev, Prod and testing server configs
class Config:
    """Base configuration."""
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG = True

class ProductionConfig(Config):
    """Production configuration."""

    DEBUG = False


class TestingConfig(Config):
    """Testing configuration."""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
