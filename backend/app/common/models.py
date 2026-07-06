from datetime import datetime, timezone

from app.extensions import db

ID_TYPE = db.BigInteger().with_variant(db.Integer(), "sqlite")


def utc_now():
    return datetime.now(timezone.utc)


class TimestampMixin:
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
    )


class SoftDeleteStatusMixin:
    is_active = db.Column(db.Boolean, nullable=False, default=True, index=True)
