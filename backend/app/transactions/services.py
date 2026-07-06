from flask import request
from sqlalchemy import desc

from app.extensions import db
from app.transactions.models import Transaction

class TransactionService:
    def get_transactions(self, page: int = 1, per_page: int = 50, filters: dict = None) -> dict:
        query = Transaction.query
        
        if filters:
            if "status" in filters and filters["status"]:
                query = query.filter(Transaction.status == filters["status"])
            if "merchant" in filters and filters["merchant"]:
                query = query.filter(Transaction.merchant.ilike(f"%{filters['merchant']}%"))
            # We could add more filters as needed

        # Order by latest
        query = query.order_by(desc(Transaction.transaction_time))
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        results = []
        for tx in pagination.items:
            # get latest prediction
            pred = tx.predictions.order_by(db.desc("created_at")).first()
            results.append({
                "id": tx.id,
                "transactionRef": tx.transaction_ref,
                "merchant": tx.merchant,
                "merchantType": tx.merchant_type,
                "amount": float(tx.amount),
                "status": tx.status,
                "transactionTime": tx.transaction_time.isoformat() if tx.transaction_time else None,
                "riskLevel": pred.risk_level if pred else "Unknown",
                "fraudProbability": float(pred.fraud_probability) if pred else 0.0
            })
            
        return {
            "transactions": results,
            "total": pagination.total,
            "pages": pagination.pages,
            "page": pagination.page,
            "perPage": pagination.per_page
        }
