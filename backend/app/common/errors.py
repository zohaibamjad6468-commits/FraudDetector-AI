from flask_jwt_extended.exceptions import JWTExtendedException
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.exceptions import HTTPException

from app.common.responses import error_response


class ApiError(Exception):
    def __init__(self, message, status_code=400, errors=None, code=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.errors = errors
        self.code = code


class NotImplementedApiError(ApiError):
    def __init__(self, message="Endpoint is registered but not implemented yet"):
        super().__init__(message=message, status_code=501, code="NOT_IMPLEMENTED")


class ValidationError(ApiError):
    def __init__(self, message, errors=None):
        super().__init__(message=message, status_code=400, errors=errors, code="VALIDATION_ERROR")


def register_error_handlers(app):
    from app.extensions import jwt

    @jwt.unauthorized_loader
    def handle_missing_jwt(reason):
        return error_response(
            message=reason,
            status_code=401,
            code="JWT_MISSING",
        )

    @jwt.invalid_token_loader
    def handle_invalid_jwt(reason):
        return error_response(
            message=reason,
            status_code=422,
            code="JWT_INVALID",
        )

    @jwt.expired_token_loader
    def handle_expired_jwt(jwt_header, jwt_payload):
        return error_response(
            message="Token has expired",
            status_code=401,
            code="JWT_EXPIRED",
        )

    @jwt.revoked_token_loader
    def handle_revoked_jwt(jwt_header, jwt_payload):
        return error_response(
            message="Token has been revoked",
            status_code=401,
            code="JWT_REVOKED",
        )

    @jwt.needs_fresh_token_loader
    def handle_stale_jwt(jwt_header, jwt_payload):
        return error_response(
            message="Fresh token required",
            status_code=401,
            code="JWT_FRESH_REQUIRED",
        )

    @app.errorhandler(ApiError)
    def handle_api_error(error):
        return error_response(
            message=error.message,
            status_code=error.status_code,
            errors=error.errors,
            code=error.code,
        )

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        return error_response(
            message=error.description or error.name,
            status_code=error.code or 500,
            code=error.name.upper().replace(" ", "_"),
        )

    @app.errorhandler(JWTExtendedException)
    def handle_jwt_error(error):
        return error_response(
            message=str(error),
            status_code=401,
            code="JWT_ERROR",
        )

    @app.errorhandler(SQLAlchemyError)
    def handle_database_error(error):
        app.logger.exception("Database error: %s", error)
        return error_response(
            message="Database operation failed",
            status_code=500,
            code="DATABASE_ERROR",
        )

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        app.logger.exception("Unhandled application error: %s", error)
        return error_response(
            message="Internal server error",
            status_code=500,
            code="INTERNAL_SERVER_ERROR",
        )
