from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.auth.decorators import staff_required
from app.common.errors import ValidationError
from app.common.responses import success_response
from app.cases.services import CaseService

cases_bp = Blueprint("cases", __name__)


@cases_bp.get("/health")
def cases_health():
    return success_response(
        data={"module": "cases"},
        message="Cases module is registered",
    )


@cases_bp.get("/queue")
@jwt_required()
@staff_required
def get_queue():
    service = CaseService()
    cases = service.get_pending_cases()
    return success_response(
        data={"cases": cases},
        message="Pending cases retrieved successfully"
    )


@cases_bp.patch("/<int:case_id>/decision")
@jwt_required()
@staff_required
def update_decision(case_id):
    data = request.get_json()
    if not data or "decision" not in data:
        raise ValidationError("Decision is required")
        
    decision = data["decision"]
    if decision not in ["fraud", "safe", "review"]:
        raise ValidationError("Invalid decision value")
        
    notes = data.get("notes")
    current_user_id = get_jwt_identity()
    
    service = CaseService()
    try:
        result = service.update_case_decision(case_id, current_user_id, decision, notes)
    except ValueError as e:
        raise ValidationError(str(e))
        
    return success_response(
        data=result,
        message=f"Case {case_id} decision updated successfully"
    )
