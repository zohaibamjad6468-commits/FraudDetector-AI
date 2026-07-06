from sqlalchemy import func
from datetime import datetime, timedelta, timezone

from app.extensions import db
from app.transactions.models import Transaction
from app.predictions.models import Prediction
from app.cases.models import ReviewCase
from app.alerts.models import Alert

class DashboardService:
    def get_admin_summary(self) -> dict:
        # Basic Counts
        total_transactions = Transaction.query.count()
        blocked_tx = Transaction.query.filter_by(status="Blocked").count()
        approved_tx = Transaction.query.filter_by(status="Approved").count()
        
        fraud_count = blocked_tx  # Assuming blocked = fraud for summary
        fraud_rate = (fraud_count / total_transactions * 100) if total_transactions > 0 else 0.0
        
        pending_reviews = ReviewCase.query.filter(ReviewCase.status.in_(["Open", "In Review"])).count()
        total_alerts = Alert.query.count()
        
        # Risk Distribution Summary
        high_risk = Prediction.query.filter_by(risk_level="High").count()
        medium_risk = Prediction.query.filter_by(risk_level="Medium").count()
        low_risk = Prediction.query.filter_by(risk_level="Low").count()
        
        # Fraud Trend Summary (last 7 days mock or simple count if we have data)
        # We'll group by date if we have real dates, or just provide a placeholder trend.
        # Since the transactions are populated recently, we'll just mock the trend shape for charts 
        # or do a simple query if there's enough data. Let's do a safe fallback.
        
        trend = [
            {"date": (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d"), "fraud": 0}
            for i in range(6, -1, -1)
        ]
        
        # Real query for trend
        # SELECT DATE(transaction_time), COUNT(id) FROM transactions WHERE status='Blocked' GROUP BY DATE(transaction_time)
        try:
            from sqlalchemy.sql import extract
            seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
            recent_fraud = db.session.query(
                func.date(Transaction.transaction_time).label('date'),
                func.count(Transaction.id).label('count')
            ).filter(Transaction.status == "Blocked", Transaction.transaction_time >= seven_days_ago)\
             .group_by(func.date(Transaction.transaction_time)).all()
             
            fraud_map = {str(r.date): r.count for r in recent_fraud}
            for t in trend:
                if t["date"] in fraud_map:
                    t["fraud"] = fraud_map[t["date"]]
        except Exception:
            pass # fallback to zeros if dialect doesn't support date()
            
        return {
            "totalTransactions": total_transactions,
            "fraudCount": fraud_count,
            "fraudRate": round(fraud_rate, 2),
            "pendingReviews": pending_reviews,
            "blockedTransactions": blocked_tx,
            "approvedTransactions": approved_tx,
            "totalAlerts": total_alerts,
            "riskDistribution": {
                "high": high_risk,
                "medium": medium_risk,
                "low": low_risk
            },
            "fraudTrend": trend
        }
