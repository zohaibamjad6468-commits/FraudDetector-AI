from app.common.models import ID_TYPE, TimestampMixin
from app.extensions import db


class AuditLog(TimestampMixin, db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(ID_TYPE, primary_key=True)
    actor_user_id = db.Column(
        ID_TYPE,
        db.ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    action = db.Column(db.String(120), nullable=False, index=True)
    target_type = db.Column(db.String(80), nullable=True, index=True)
    target_id = db.Column(db.String(80), nullable=True, index=True)
    metadata_json = db.Column("metadata", db.JSON, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)

    actor = db.relationship(
        "User",
        back_populates="audit_logs",
        foreign_keys=[actor_user_id],
    )

    def __repr__(self):
        return f"<AuditLog id={self.id} action={self.action!r} target={self.target_type}:{self.target_id}>"
