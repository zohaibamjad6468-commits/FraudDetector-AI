"""
Synthetic Feature Generator for Fraud Detection.

Since the frontend UI collects business-level features (merchant, location, amount, etc.)
but the XGBoost model expects PCA-transformed features (V1-V28 + Amount), this module
bridges the gap by generating realistic synthetic PCA features based on the transaction's
risk profile.

The generated features produce varied, organic predictions from the real XGBoost model
instead of relying on hardcoded probability overrides.
"""

import random
import math


class SyntheticFeatureGenerator:
    """Generates realistic V1-V28 PCA features from business-level transaction data."""

    # Risk signal profiles for key PCA features (based on Kaggle creditcard.csv analysis)
    # V14, V12, V10 are the most fraud-discriminative features in the dataset
    RISK_PROFILES = {
        "high": {
            "V14": (-8.0, -4.0),   # Strong negative = fraud signal
            "V12": (-7.0, -3.0),
            "V10": (-6.0, -2.5),
            "V4":  (3.0, 6.0),     # Strong positive = fraud signal
            "V11": (-5.0, -2.0),
            "V3":  (-5.0, -1.5),
            "V17": (-6.0, -2.0),
            "V16": (-5.0, -1.5),
        },
        "medium": {
            "V14": (-4.0, -1.0),
            "V12": (-3.5, -0.5),
            "V10": (-3.0, 0.0),
            "V4":  (1.0, 3.5),
            "V11": (-2.5, 0.0),
            "V3":  (-2.0, 1.0),
            "V17": (-3.0, 0.0),
            "V16": (-2.5, 0.5),
        },
        "low": {
            "V14": (-0.5, 1.5),
            "V12": (-0.5, 2.0),
            "V10": (-0.5, 1.5),
            "V4":  (-1.0, 1.5),
            "V11": (-0.5, 1.5),
            "V3":  (-1.0, 2.0),
            "V17": (-0.5, 1.0),
            "V16": (-0.5, 1.5),
        },
    }

    # Merchant risk mapping
    MERCHANT_RISK = {
        "Crypto Exchange": 0.85,
        "Rolex Boutique": 0.6,
        "Best Buy": 0.3,
        "Apple Store": 0.25,
        "Steam Games": 0.2,
        "Nike": 0.15,
        "Amazon": 0.15,
        "Airbnb": 0.2,
        "Uber": 0.1,
        "Netflix": 0.05,
        "Starbucks": 0.05,
        "Walmart": 0.05,
        "Local Grocery": 0.03,
    }

    # Location risk mapping
    LOCATION_RISK = {
        "High-Risk Country": 0.7,
        "International": 0.35,
        "Unknown": 0.25,
        "Local": 0.05,
    }

    # Payment method risk
    PAYMENT_RISK = {
        "Bank Transfer": 0.4,
        "Credit Card": 0.2,
        "Digital Wallet": 0.15,
        "Debit Card": 0.1,
    }

    def generate_features(self, transaction_data: dict) -> dict:
        """
        Generate V1-V28 + Amount features from business-level transaction data.
        
        Args:
            transaction_data: Dict with keys like amount, merchant, location, etc.
            
        Returns:
            Dict with V1-V28 and Amount keys suitable for the XGBoost model.
        """
        amount = float(transaction_data.get("amount", 0.0))
        merchant = transaction_data.get("merchant", "")
        location = transaction_data.get("location", "Local")
        payment_method = transaction_data.get("payment_method", "Credit Card")
        merchant_type = transaction_data.get("merchant_type", "Retail")

        # Calculate composite risk score (0.0 to 1.0)
        risk_score = self._calculate_risk_score(amount, merchant, location, payment_method, merchant_type)

        # Determine risk category
        if risk_score >= 0.6:
            risk_category = "high"
        elif risk_score >= 0.3:
            risk_category = "medium"
        else:
            risk_category = "low"

        # Generate V1-V28 features
        features = {}
        profile = self.RISK_PROFILES[risk_category]

        for i in range(1, 29):
            feature_name = f"V{i}"
            if feature_name in profile:
                low, high = profile[feature_name]
                # Add noise proportional to the range
                noise = random.gauss(0, (high - low) * 0.15)
                features[feature_name] = random.uniform(low, high) + noise
            else:
                # Non-discriminative features: normal distribution around 0
                features[feature_name] = random.gauss(0, 1.0)

        features["Amount"] = amount

        return features

    def _calculate_risk_score(self, amount: float, merchant: str, 
                               location: str, payment_method: str,
                               merchant_type: str) -> float:
        """Calculate a composite risk score from 0.0 (safe) to 1.0 (fraud)."""
        
        # Amount risk (sigmoid curve: gradual increase, steeper after 10k)
        amount_risk = 1.0 / (1.0 + math.exp(-0.0003 * (amount - 8000)))

        # Merchant risk
        merchant_risk = self.MERCHANT_RISK.get(merchant, 0.15)

        # Location risk
        location_risk = self.LOCATION_RISK.get(location, 0.1)

        # Payment risk
        payment_risk = self.PAYMENT_RISK.get(payment_method, 0.15)

        # Merchant type boost
        type_boost = 0.0
        if merchant_type in ("High Risk",):
            type_boost = 0.2
        elif merchant_type in ("Electronics",):
            type_boost = 0.05

        # Weighted composite
        composite = (
            amount_risk * 0.35 +
            merchant_risk * 0.25 +
            location_risk * 0.20 +
            payment_risk * 0.10 +
            type_boost * 0.10
        )

        # Add small random variation to prevent identical scores
        jitter = random.uniform(-0.05, 0.05)
        return max(0.0, min(1.0, composite + jitter))
