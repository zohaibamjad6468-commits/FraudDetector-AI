from app.common.models import ID_TYPE, TimestampMixin
from app.extensions import db


class ModelVersion(TimestampMixin, db.Model):
    __tablename__ = "model_versions"
    __table_args__ = (
        db.UniqueConstraint("version", name="uq_model_versions_version"),
    )

    id = db.Column(ID_TYPE, primary_key=True)
    version = db.Column(db.String(50), nullable=False, index=True)
    algorithm = db.Column(db.String(80), nullable=False)
    accuracy = db.Column(db.Numeric(6, 5), nullable=True)
    precision = db.Column(db.Numeric(6, 5), nullable=True)
    recall = db.Column(db.Numeric(6, 5), nullable=True)
    f1 = db.Column(db.Numeric(6, 5), nullable=True)
    auc = db.Column(db.Numeric(6, 5), nullable=True)

    predictions = db.relationship(
        "Prediction",
        back_populates="model_version",
        lazy="dynamic",
    )

    def __repr__(self):
        return f"<ModelVersion id={self.id} version={self.version!r} algorithm={self.algorithm!r}>"
