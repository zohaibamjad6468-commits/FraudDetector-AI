from flask import Flask

from app.config import get_config
from app.extensions import cors, db, jwt, migrate
from app.common.errors import register_error_handlers
from app.common.responses import success_response


def create_app(config_name=None):
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))

    initialize_extensions(app)
    register_models()
    register_blueprints(app)
    register_error_handlers(app)
    register_health_routes(app)
    register_cli_context(app)

    return app


def initialize_extensions(app):
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    from app.auth.jwt import register_jwt_callbacks

    register_jwt_callbacks(jwt)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )


def register_models():
    from app.alerts import models as alert_models  # noqa: F401
    from app.audit import models as audit_models  # noqa: F401
    from app.auth import models as auth_models  # noqa: F401
    from app.cases import models as case_models  # noqa: F401
    from app.ml import models as ml_models  # noqa: F401
    from app.predictions import models as prediction_models  # noqa: F401
    from app.transactions import models as transaction_models  # noqa: F401
    from app.users import models as user_models  # noqa: F401


def register_blueprints(app):
    from app.auth.routes import auth_bp
    from app.users.routes import users_bp
    from app.transactions.routes import transactions_bp
    from app.predictions.routes import predictions_bp
    from app.dashboards.routes import dashboards_bp
    from app.audit.routes import audit_bp
    from app.ml.routes import ml_bp
    from app.cases.routes import cases_bp

    api_prefix = app.config["API_PREFIX"]

    app.register_blueprint(auth_bp, url_prefix=f"{api_prefix}/auth")
    app.register_blueprint(users_bp, url_prefix=f"{api_prefix}/users")
    app.register_blueprint(transactions_bp, url_prefix=f"{api_prefix}/transactions")
    app.register_blueprint(predictions_bp, url_prefix=f"{api_prefix}/predictions")
    app.register_blueprint(dashboards_bp, url_prefix=f"{api_prefix}/dashboards")
    app.register_blueprint(audit_bp, url_prefix=f"{api_prefix}/audit")
    app.register_blueprint(ml_bp, url_prefix=f"{api_prefix}/ml")
    app.register_blueprint(cases_bp, url_prefix=f"{api_prefix}/cases")


def register_health_routes(app):
    @app.get(f"{app.config['API_PREFIX']}/health")
    def api_health():
        return success_response(
            data={
                "app": app.config["APP_NAME"],
                "environment": app.config["ENV"],
                "apiPrefix": app.config["API_PREFIX"],
            },
            message="Backend is running",
        )


def register_cli_context(app):
    @app.shell_context_processor
    def make_shell_context():
        return {"app": app, "db": db}


__all__ = ["create_app", "db"]
