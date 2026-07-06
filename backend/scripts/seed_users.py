import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app import create_app
from app.extensions import db
from app.users.models import User


DEMO_USERS = [
    {
        "email": "admin@finguard.ai",
        "password": "admin123",
        "name": "System Admin",
        "role": "admin",
    },
    {
        "email": "analyst@finguard.ai",
        "password": "analyst123",
        "name": "Fraud Analyst",
        "role": "analyst",
    },
]


def upsert_demo_users():
    created = 0
    updated = 0

    for demo_user in DEMO_USERS:
        user = User.query.filter_by(email=demo_user["email"]).one_or_none()

        if user is None:
            user = User(
                email=demo_user["email"],
                name=demo_user["name"],
                role=demo_user["role"],
                is_active=True,
            )
            user.set_password(demo_user["password"])
            db.session.add(user)
            created += 1
            continue

        user.name = demo_user["name"]
        user.role = demo_user["role"]
        user.is_active = True
        user.set_password(demo_user["password"])
        updated += 1

    db.session.commit()
    return created, updated


def main():
    app = create_app()
    with app.app_context():
        created, updated = upsert_demo_users()
        print(f"Seed complete. Created: {created}. Updated: {updated}.")


if __name__ == "__main__":
    main()
