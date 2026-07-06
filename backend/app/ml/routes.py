from flask import Blueprint

from app.auth.decorators import admin_required
from app.common.errors import NotImplementedApiError
from app.common.responses import success_response

ml_bp = Blueprint("ml", __name__)


@ml_bp.get("/health")
def ml_health():
    return success_response(
        data={"module": "ml"},
        message="ML module is registered",
    )


@ml_bp.get("/model")
@admin_required
def active_model():
    raise NotImplementedApiError("Model artifact loading and metadata will be implemented in the ML layer")
