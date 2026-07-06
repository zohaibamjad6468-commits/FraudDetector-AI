from app.common.models import ID_TYPE, TimestampMixin
from app.extensions import db


class Alert(TimestampMixin, db.Model):
    __tablename__ = "alerts"

    id = db.Column(ID_TYPE, primary_key=True)
    alert_ref = db.Column(db.String(50), nullable=False, unique=True, index=True)
    transaction_id = db.Column(
        ID_TYPE,
        db.ForeignKey("transactions.id"),
        nullable=True,
        index=True,
    )
    risk_level = db.Column(
        db.Enum("Low", "Medium", "High", name="alert_risk_level"),
        nullable=False,
        index=True,
    )
    confidence = db.Column(db.Numeric(6, 5), nullable=True)
    reason = db.Column(db.String(255), nullable=True)
    status = db.Column(
        db.Enum("Open", "Resolved", name="alert_status"),
        nullable=False,
        default="Open",
        index=True,
    )
    resolved_at = db.Column(db.DateTime(timezone=True), nullable=True)

    transaction = db.relationship("Transaction", back_populates="alerts")

    def __repr__(self):
        return f"<Alert id={self.id} ref={self.alert_ref!r} risk_level={self.risk_level!r}>"
