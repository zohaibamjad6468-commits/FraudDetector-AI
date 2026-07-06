from app.common.models import ID_TYPE, TimestampMixin
from app.extensions import db


class Prediction(TimestampMixin, db.Model):
    __tablename__ = "predictions"

    id = db.Column(ID_TYPE, primary_key=True)
    transaction_id = db.Column(
        ID_TYPE,
        db.ForeignKey("transactions.id"),
        nullable=False,
        index=True,
    )
    model_version_id = db.Column(
        ID_TYPE,
        db.ForeignKey("model_versions.id"),
        nullable=True,
        index=True,
    )
    fraud_probability = db.Column(db.Numeric(6, 5), nullable=False)
    risk_level = db.Column(
        db.Enum("Low", "Medium", "High", name="risk_level"),
        nullable=False,
        index=True,
    )
    recommended_action = db.Column(db.String(255), nullable=True)
    latency_ms = db.Column(db.Integer, nullable=True)

    transaction = db.relationship("Transaction", back_populates="predictions")
    model_version = db.relationship("ModelVersion", back_populates="predictions")
    explanations = db.relationship(
        "PredictionExplanation",
        back_populates="prediction",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    review_cases = db.relationship(
        "ReviewCase",
        back_populates="prediction",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

    def __repr__(self):
        return (
            f"<Prediction id={self.id} transaction_id={self.transaction_id} "
            f"risk_level={self.risk_level!r}>"
        )


class PredictionExplanation(TimestampMixin, db.Model):
    __tablename__ = "prediction_explanations"

    id = db.Column(ID_TYPE, primary_key=True)
    prediction_id = db.Column(
        ID_TYPE,
        db.ForeignKey("predictions.id"),
        nullable=False,
        index=True,
    )
    feature_name = db.Column(db.String(50), nullable=False, index=True)
    impact = db.Column(db.Numeric(8, 5), nullable=True)
    note = db.Column(db.String(255), nullable=True)

    prediction = db.relationship("Prediction", back_populates="explanations")

    def __repr__(self):
        return f"<PredictionExplanation id={self.id} feature={self.feature_name!r}>"
