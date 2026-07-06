import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


def _as_bool(value, default=False):
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _split_csv(value, default=None):
    if not value:
        return default or []
    return [item.strip() for item in value.split(",") if item.strip()]


def _mysql_uri_from_env():
    user = os.getenv("MYSQL_USER", "root")
    password = os.getenv("MYSQL_PASSWORD", "")
    host = os.getenv("MYSQL_HOST", "127.0.0.1")
    port = os.getenv("MYSQL_PORT", "3306")
    database = os.getenv("MYSQL_DATABASE", "fraud_detection")

    auth = user if not password else f"{user}:{password}"
    return f"mysql+pymysql://{auth}@{host}:{port}/{database}"


class BaseConfig:
    APP_NAME = os.getenv("APP_NAME", "FinGuard AI Backend")
    API_PREFIX = os.getenv("API_PREFIX", "/api/v1")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me-please-use-at-least-32-bytes")

    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL") or _mysql_uri_from_env()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": int(os.getenv("SQLALCHEMY_POOL_RECYCLE", "280")),
    }

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change-me-please-use-at-least-32-bytes")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "30"))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "7"))
    )

    CORS_ORIGINS = _split_csv(
        os.getenv("CORS_ORIGINS"),
        default=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5175",
            "http://localhost:5176",
            "http://127.0.0.1:5176",
        ],
    )

    JSON_SORT_KEYS = False
    PROPAGATE_EXCEPTIONS = False


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    ENV = "development"


class TestingConfig(BaseConfig):
    TESTING = True
    ENV = "testing"
    SQLALCHEMY_DATABASE_URI = os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)


class ProductionConfig(BaseConfig):
    DEBUG = False
    ENV = "production"
    PROPAGATE_EXCEPTIONS = _as_bool(os.getenv("PROPAGATE_EXCEPTIONS"), False)


CONFIG_BY_NAME = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config(config_name=None):
    selected = config_name or os.getenv("FLASK_ENV") or os.getenv("APP_ENV") or "development"
    return CONFIG_BY_NAME.get(selected.lower(), DevelopmentConfig)
