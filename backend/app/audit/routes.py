from flask import Blueprint, request

from app.auth.decorators import staff_required
from app.common.errors import NotImplementedApiError
from app.common.responses import success_response
from app.audit.services import AuditService

audit_bp = Blueprint("audit", __name__)


@audit_bp.get("/health")
def audit_health():
    return success_response(
        data={"module": "audit"},
        message="Audit module is registered",
    )


@audit_bp.get("/logs")
@staff_required
def list_audit_logs():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)
    
    service = AuditService()
    result = service.get_logs(page=page, per_page=per_page)
    
    return success_response(
        data=result,
        message="Audit logs retrieved successfully"
    )
