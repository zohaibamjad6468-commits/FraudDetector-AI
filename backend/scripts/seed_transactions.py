import os
import sys
import random

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, backend_dir)

from app import create_app
from app.extensions import db
from app.predictions.services import PredictionService
from app.users.models import User

def seed_data():
    app = create_app()
    with app.app_context():
        print("Clearing old mock transactions...")
        from app.transactions.models import Transaction
        from app.cases.models import CaseDecision, ReviewCase
        from app.alerts.models import Alert
        from app.predictions.models import Prediction, PredictionExplanation
        from app.audit.models import AuditLog
        
        # Delete in order to respect foreign key constraints
        db.session.query(CaseDecision).delete()
        db.session.query(ReviewCase).delete()
        db.session.query(Alert).delete()
        db.session.query(PredictionExplanation).delete()
        db.session.query(Prediction).delete()
        db.session.query(Transaction).delete()
        db.session.query(AuditLog).filter_by(target_type='ReviewCase').delete()
        db.session.commit()
        
        print("Generating diverse mock transactions for insights...")
        
        # Get an analyst user to assign actions to
        analyst = User.query.filter_by(email='analyst@finguard.ai').first()
        user_id = analyst.id if analyst else 1

        service = PredictionService()

        # Diverse options
        merchants = ["Amazon", "Apple Store", "Steam Games", "Nike", "Local Grocery", "Crypto Exchange", "Rolex Boutique", "Starbucks", "Uber", "Airbnb", "Netflix", "Walmart", "Best Buy"]
        methods = ["Credit Card", "Debit Card", "Digital Wallet", "Bank Transfer"]
        devices = ["Mobile", "Desktop", "Tablet", "Unknown Device"]

        total_transactions = random.randint(15, 20)
        
        for _ in range(total_transactions):
            risk_category = random.choices(["low", "medium", "high"], weights=[60, 25, 15])[0]
            
            if risk_category == "low":
                amount = round(random.uniform(5.0, 4999.0), 2)
                location = random.choice(["Local", "Unknown"])
                m_type = random.choice(["Retail", "Food & Beverage", "Subscription"])
            elif risk_category == "medium":
                amount = round(random.uniform(5000.0, 10000.0), 2)
                location = random.choice(["International", "Local"])
                m_type = random.choice(["Electronics", "Travel", "Retail"])
            else: # high
                amount = round(random.uniform(10001.0, 95000.0), 2)
                location = random.choice(["High-Risk Country", "International"])
                m_type = random.choice(["High Risk", "Electronics"])
                
            data = {
                "amount": amount,
                "merchant": random.choice(merchants),
                "merchant_type": m_type,
                "payment_method": random.choice(methods),
                "device_type": random.choice(devices),
                "location": location
            }
            service.analyze_transaction(data, user_id)

        print(f"Data generation complete! Added {total_transactions} diverse transactions.")

if __name__ == "__main__":
    seed_data()
