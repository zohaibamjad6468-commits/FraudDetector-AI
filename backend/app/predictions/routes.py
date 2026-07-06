from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.auth.decorators import staff_required
from app.common.errors import NotImplementedApiError, ValidationError
from app.common.responses import success_response
from app.predictions.services import PredictionService

predictions_bp = Blueprint("predictions", __name__)


@predictions_bp.get("/health")
def predictions_health():
    return success_response(
        data={"module": "predictions"},
        message="Predictions module is registered",
    )


@predictions_bp.post("/analyze")
@jwt_required()
@staff_required
def analyze_transaction():
    data = request.get_json()
    if not data:
        raise ValidationError("Transaction data is required")
        
    current_user_id = get_jwt_identity()
    service = PredictionService()
    result = service.analyze_transaction(data, current_user_id)
    
    return success_response(
        data=result,
        message="Transaction analyzed successfully",
        status_code=201
    )


@predictions_bp.get("/<int:prediction_id>")
@staff_required
def get_prediction(prediction_id):
    raise NotImplementedApiError(f"Prediction lookup for {prediction_id} is not implemented yet")
