import os

from app import create_app

app = create_app()

def auto_seed_if_empty():
    with app.app_context():
        try:
            from app.cases.models import ReviewCase
            from scripts.seed_transactions import seed_data
            # Check if review queue is empty
            open_cases = ReviewCase.query.filter(ReviewCase.status.in_(["Open", "In Review"])).count()
            if open_cases == 0:
                print("No pending cases found. Auto-generating test data for presentation...")
                seed_data()
        except Exception as e:
            print(f"Auto-seed failed: {e}")

# Run auto-seed before starting the server
auto_seed_if_empty()



def _as_bool(value, default=False):
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


if __name__ == "__main__":
    host = os.getenv("FLASK_RUN_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_RUN_PORT", "5000"))
    use_reloader = _as_bool(os.getenv("FLASK_USE_RELOADER"), False)
    app.run(host=host, port=port, use_reloader=use_reloader)
