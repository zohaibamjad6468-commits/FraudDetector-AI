from flask import Blueprint

from app.auth.decorators import admin_required, analyst_required
from app.common.errors import NotImplementedApiError
from app.common.responses import success_response
from app.dashboards.services import DashboardService

dashboards_bp = Blueprint("dashboards", __name__)


@dashboards_bp.get("/health")
def dashboards_health():
    return success_response(
        data={"module": "dashboards"},
        message="Dashboards module is registered",
    )


@dashboards_bp.get("/admin/summary")
@admin_required
def admin_summary():
    service = DashboardService()
    summary = service.get_admin_summary()
    return success_response(
        data=summary,
        message="Admin summary retrieved successfully"
    )


@dashboards_bp.get("/analyst/summary")
@analyst_required
def analyst_summary():
    service = DashboardService()
    summary = service.get_admin_summary()
    return success_response(
        data=summary,
        message="Analyst summary retrieved successfully"
    )


@dashboards_bp.get("/model-health")
@admin_required
def model_health():
    raise NotImplementedApiError("Model health metrics will be implemented after ML integration")
