import hashlib
from datetime import datetime, timezone

from flask_jwt_extended import create_access_token, create_refresh_token, decode_token

from app.auth.models import RefreshToken
from app.auth.schemas import user_to_public_dict
from app.common.errors import ApiError
from app.extensions import db
from app.users.models import User


class AuthService:
    @staticmethod
    def authenticate(email, password):
        user = User.query.filter_by(email=email).one_or_none()

        if not user or not user.is_active or not user.check_password(password):
            raise ApiError("Invalid email or password", status_code=401, code="INVALID_CREDENTIALS")

        return user

    @staticmethod
    def login(email, password):
        user = AuthService.authenticate(email, password)
        tokens = AuthService.issue_token_pair(user)

        return {
            **tokens,
            "user": user_to_public_dict(user),
            "role": user.role,
        }

    @staticmethod
    def issue_token_pair(user):
        claims = {"role": user.role, "email": user.email, "name": user.name}
        identity = str(user.id)
        access_token = create_access_token(identity=identity, additional_claims=claims)
        refresh_token = create_refresh_token(identity=identity, additional_claims=claims)

        AuthService.store_refresh_token(user.id, refresh_token)

        return {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "tokenType": "Bearer",
        }

    @staticmethod
    def refresh(refresh_token, user):
        stored_token = AuthService.get_valid_refresh_token(refresh_token, user.id)
        stored_token.revoked_at = datetime.now(timezone.utc)

        tokens = AuthService.issue_token_pair(user)
        db.session.commit()

        return {
            **tokens,
            "user": user_to_public_dict(user),
            "role": user.role,
        }

    @staticmethod
    def logout(refresh_token=None):
        if refresh_token:
            stored_token = RefreshToken.query.filter_by(
                token_hash=AuthService.hash_token(refresh_token)
            ).one_or_none()
            if stored_token and stored_token.revoked_at is None:
                stored_token.revoked_at = datetime.now(timezone.utc)
                db.session.commit()

        return {"revoked": bool(refresh_token)}

    @staticmethod
    def store_refresh_token(user_id, refresh_token):
        decoded = decode_token(refresh_token)
        expires_at = datetime.fromtimestamp(decoded["exp"], tz=timezone.utc)

        db.session.add(
            RefreshToken(
                user_id=user_id,
                token_hash=AuthService.hash_token(refresh_token),
                expires_at=expires_at,
            )
        )
        db.session.commit()

    @staticmethod
    def get_valid_refresh_token(refresh_token, user_id):
        stored_token = RefreshToken.query.filter_by(
            user_id=user_id,
            token_hash=AuthService.hash_token(refresh_token),
        ).one_or_none()

        if not stored_token:
            raise ApiError("Refresh token is not recognized", status_code=401, code="REFRESH_TOKEN_INVALID")

        now = datetime.now(timezone.utc)
        expires_at = stored_token.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if stored_token.revoked_at is not None:
            raise ApiError("Refresh token has been revoked", status_code=401, code="REFRESH_TOKEN_REVOKED")

        if expires_at <= now:
            raise ApiError("Refresh token has expired", status_code=401, code="REFRESH_TOKEN_EXPIRED")

        return stored_token

    @staticmethod
    def hash_token(token):
        return hashlib.sha256(token.encode("utf-8")).hexdigest()
