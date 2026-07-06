from app.common.models import ID_TYPE, TimestampMixin
from app.extensions import db


class ReviewCase(TimestampMixin, db.Model):
    __tablename__ = "review_cases"

    id = db.Column(ID_TYPE, primary_key=True)
    case_ref = db.Column(db.String(50), nullable=False, unique=True, index=True)
    transaction_id = db.Column(
        ID_TYPE,
        db.ForeignKey("transactions.id"),
        nullable=False,
        index=True,
    )
    prediction_id = db.Column(
        ID_TYPE,
        db.ForeignKey("predictions.id"),
        nullable=False,
        index=True,
    )
    assigned_analyst_id = db.Column(
        ID_TYPE,
        db.ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    priority = db.Column(
        db.Enum("Low", "Medium", "High", name="case_priority"),
        nullable=False,
        default="Medium",
        index=True,
    )
    status = db.Column(
        db.Enum("Open", "In Review", "Resolved", name="case_status"),
        nullable=False,
        default="Open",
        index=True,
    )
    resolved_at = db.Column(db.DateTime(timezone=True), nullable=True)

    transaction = db.relationship("Transaction", back_populates="review_cases")
    prediction = db.relationship("Prediction", back_populates="review_cases")
    assigned_analyst = db.relationship(
        "User",
        back_populates="assigned_cases",
        foreign_keys=[assigned_analyst_id],
    )
    decisions = db.relationship(
        "CaseDecision",
        back_populates="case",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

    def __repr__(self):
        return f"<ReviewCase id={self.id} ref={self.case_ref!r} status={self.status!r}>"


class CaseDecision(TimestampMixin, db.Model):
    __tablename__ = "case_decisions"

    id = db.Column(ID_TYPE, primary_key=True)
    case_id = db.Column(
        ID_TYPE,
        db.ForeignKey("review_cases.id"),
        nullable=False,
        index=True,
    )
    analyst_id = db.Column(
        ID_TYPE,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    decision = db.Column(
        db.Enum("fraud", "safe", "send_to_review", "blocked", "approved", name="case_decision"),
        nullable=False,
        index=True,
    )
    notes = db.Column(db.Text, nullable=True)

    case = db.relationship("ReviewCase", back_populates="decisions")
    analyst = db.relationship(
        "User",
        back_populates="case_decisions",
        foreign_keys=[analyst_id],
    )

    def __repr__(self):
        return f"<CaseDecision id={self.id} case_id={self.case_id} decision={self.decision!r}>"
