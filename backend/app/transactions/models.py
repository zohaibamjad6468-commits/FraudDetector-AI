from app.common.models import ID_TYPE, TimestampMixin
from app.extensions import db


class Transaction(TimestampMixin, db.Model):
    __tablename__ = "transactions"

    id = db.Column(ID_TYPE, primary_key=True)
    transaction_ref = db.Column(db.String(50), nullable=False, unique=True, index=True)
    merchant = db.Column(db.String(120), nullable=True, index=True)
    merchant_type = db.Column(db.String(80), nullable=True, index=True)
    payment_method = db.Column(db.String(50), nullable=True)
    device_type = db.Column(db.String(80), nullable=True)
    location = db.Column(db.String(120), nullable=True)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    transaction_time = db.Column(db.DateTime(timezone=True), nullable=True, index=True)
    status = db.Column(
        db.Enum("Pending", "Approved", "Blocked", name="transaction_status"),
        nullable=False,
        default="Pending",
        index=True,
    )

    predictions = db.relationship(
        "Prediction",
        back_populates="transaction",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    review_cases = db.relationship(
        "ReviewCase",
        back_populates="transaction",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    alerts = db.relationship(
        "Alert",
        back_populates="transaction",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

    def __repr__(self):
        return f"<Transaction id={self.id} ref={self.transaction_ref!r} status={self.status!r}>"
