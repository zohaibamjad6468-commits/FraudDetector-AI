from werkzeug.security import check_password_hash, generate_password_hash

from app.common.models import ID_TYPE, SoftDeleteStatusMixin, TimestampMixin
from app.extensions import db


class User(TimestampMixin, SoftDeleteStatusMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(ID_TYPE, primary_key=True)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.Enum("admin", "analyst", name="user_role"), nullable=False, index=True)

    refresh_tokens = db.relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    assigned_cases = db.relationship(
        "ReviewCase",
        back_populates="assigned_analyst",
        foreign_keys="ReviewCase.assigned_analyst_id",
        lazy="dynamic",
    )
    case_decisions = db.relationship(
        "CaseDecision",
        back_populates="analyst",
        foreign_keys="CaseDecision.analyst_id",
        lazy="dynamic",
    )
    audit_logs = db.relationship(
        "AuditLog",
        back_populates="actor",
        foreign_keys="AuditLog.actor_user_id",
        lazy="dynamic",
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def is_admin(self):
        return self.role == "admin"

    @property
    def is_analyst(self):
        return self.role == "analyst"

    def __repr__(self):
        return f"<User id={self.id} email={self.email!r} role={self.role!r}>"
