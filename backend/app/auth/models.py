from app.common.models import ID_TYPE, TimestampMixin
from app.extensions import db


class RefreshToken(TimestampMixin, db.Model):
    __tablename__ = "refresh_tokens"

    id = db.Column(ID_TYPE, primary_key=True)
    user_id = db.Column(ID_TYPE, db.ForeignKey("users.id"), nullable=False, index=True)
    token_hash = db.Column(db.String(255), nullable=False, unique=True, index=True)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False, index=True)
    revoked_at = db.Column(db.DateTime(timezone=True), nullable=True)

    user = db.relationship("User", back_populates="refresh_tokens")

    @property
    def is_revoked(self):
        return self.revoked_at is not None

    def __repr__(self):
        return f"<RefreshToken id={self.id} user_id={self.user_id} revoked={self.is_revoked}>"
