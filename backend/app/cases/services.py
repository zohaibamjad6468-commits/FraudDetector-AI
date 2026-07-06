from datetime import datetime, timezone
from flask import request

from app.extensions import db
from app.cases.models import ReviewCase, CaseDecision
from app.audit.models import AuditLog

class CaseService:
    def get_pending_cases(self) -> list:
        # Get cases that are Open or In Review
        cases = ReviewCase.query.filter(ReviewCase.status.in_(["Open", "In Review"])).all()
        
        # Format the response
        result = []
        for case in cases:
            tx = case.transaction
            pred = case.prediction
            explanations = []
            if pred:
                for exp in pred.explanations:
                    explanations.append({"feature": exp.feature_name, "note": exp.note, "impact": float(exp.impact) if exp.impact else 0})
                    
            result.append({
                "id": case.id,
                "caseRef": case.case_ref,
                "status": case.status,
                "priority": case.priority,
                "transactionId": tx.transaction_ref if tx else None,
                "amount": float(tx.amount) if tx else None,
                "merchant": tx.merchant if tx else None,
                "riskLevel": pred.risk_level if pred else None,
                "fraudProbability": float(pred.fraud_probability) if pred else None,
                "explanations": explanations,
                "createdAt": case.created_at.isoformat() if case.created_at else None
            })
        return result

    def update_case_decision(self, case_id: int, analyst_id: int, decision: str, notes: str = None) -> dict:
        case = ReviewCase.query.get(case_id)
        if not case:
            raise ValueError(f"Case {case_id} not found")
            
        # Map frontend decision to DB enums
        db_decision = decision
        if decision == "review":
            db_decision = "send_to_review"
            
        # Create CaseDecision
        case_decision = CaseDecision(
            case_id=case.id,
            analyst_id=analyst_id,
            decision=db_decision,
            notes=notes
        )
        db.session.add(case_decision)
        
        # Update case and transaction statuses based on decision
        tx = case.transaction
        
        if decision == "fraud":
            case.status = "Resolved"
            case.resolved_at = datetime.now(timezone.utc)
            if tx:
                tx.status = "Blocked"
        elif decision == "safe":
            case.status = "Resolved"
            case.resolved_at = datetime.now(timezone.utc)
            if tx:
                tx.status = "Approved"
        elif decision == "review":
            case.status = "In Review"
            
        # Create AuditLog
        audit = AuditLog(
            actor_user_id=analyst_id,
            action="case_decision",
            target_type="ReviewCase",
            target_id=str(case.id),
            metadata_json={"decision": decision, "notes": notes},
            ip_address=request.remote_addr if request else None
        )
        db.session.add(audit)
        
        db.session.commit()
        
        return {
            "caseId": case.id,
            "status": case.status,
            "decision": db_decision,
            "transactionStatus": tx.status if tx else None
        }
