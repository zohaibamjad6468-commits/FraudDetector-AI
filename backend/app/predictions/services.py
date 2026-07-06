import time
import uuid
from datetime import datetime, timezone
from flask import request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.ml.predictor import FraudPredictor
from app.ml.explainability import PredictionExplainer
from app.transactions.models import Transaction
from app.predictions.models import Prediction, PredictionExplanation
from app.cases.models import ReviewCase
from app.alerts.models import Alert
from app.audit.models import AuditLog

class PredictionService:
    def __init__(self):
        self.predictor = FraudPredictor()
        self.explainer = PredictionExplainer()

    def analyze_transaction(self, transaction_data: dict, current_user_id: int = None) -> dict:
        start_time = time.time()
        
        # 1 & 2 & 3. Predict fraud probability
        prediction_result = self.predictor.predict(transaction_data)
        probability = prediction_result["fraud_probability"]
        risk_level = prediction_result["risk_level"]
        recommended_action = prediction_result["recommended_action"]
        
        # 4. Store Transaction
        transaction_ref = transaction_data.get("transaction_ref", f"TXN-{uuid.uuid4().hex[:8].upper()}")
        amount = transaction_data.get("amount", 0.0)
        
        transaction = Transaction(
            transaction_ref=transaction_ref,
            merchant=transaction_data.get("merchant"),
            merchant_type=transaction_data.get("merchant_type"),
            payment_method=transaction_data.get("payment_method"),
            device_type=transaction_data.get("device_type"),
            location=transaction_data.get("location"),
            amount=amount,
            transaction_time=datetime.now(timezone.utc),
            status="Blocked" if risk_level == "High" else "Pending" if risk_level == "Medium" else "Approved"
        )
        db.session.add(transaction)
        db.session.flush() # get ID
        
        # 5. Store Prediction
        latency_ms = int((time.time() - start_time) * 1000)
        prediction = Prediction(
            transaction_id=transaction.id,
            fraud_probability=probability,
            risk_level=risk_level,
            recommended_action=recommended_action,
            latency_ms=latency_ms
        )
        db.session.add(prediction)
        db.session.flush()
        
        # 6. Store Explanations
        top_features = self.explainer.explain(transaction_data, top_k=3)
        for feature in top_features:
            explanation = PredictionExplanation(
                prediction_id=prediction.id,
                feature_name=feature["feature_name"],
                impact=feature["impact"],
                note=feature["note"]
            )
            db.session.add(explanation)
            
        # 7. Create ReviewCase & Alert if Medium/High
        if risk_level in ["Medium", "High"]:
            case = ReviewCase(
                case_ref=f"CASE-{uuid.uuid4().hex[:8].upper()}",
                transaction_id=transaction.id,
                prediction_id=prediction.id,
                priority="High" if risk_level == "High" else "Medium",
                status="Open"
            )
            db.session.add(case)
            
            alert = Alert(
                alert_ref=f"ALT-{uuid.uuid4().hex[:8].upper()}",
                transaction_id=transaction.id,
                risk_level=risk_level,
                confidence=probability,
                reason=f"Fraud probability {probability*100:.1f}%",
                status="Open"
            )
            db.session.add(alert)
            
        # 8. Audit Log
        audit = AuditLog(
            actor_user_id=current_user_id,
            action="predict_transaction",
            target_type="Transaction",
            target_id=str(transaction.id),
            metadata_json={"risk_level": risk_level, "probability": probability},
            ip_address=request.remote_addr if request else None
        )
        db.session.add(audit)
        
        db.session.commit()
        
        return {
            "transactionId": transaction_ref,
            "fraudProbability": probability,
            "riskLevel": risk_level,
            "decision": transaction.status,
            "recommendedAction": recommended_action,
            "topFeatures": top_features
        }
