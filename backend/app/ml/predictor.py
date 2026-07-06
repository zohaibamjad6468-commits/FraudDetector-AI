from app.ml.model_loader import ModelLoader
from app.ml.preprocessor import FeaturePreprocessor
from app.ml.synthetic_features import SyntheticFeatureGenerator


class FraudPredictor:
    """Fraud prediction logic using real XGBoost model with synthetic feature generation."""
    def __init__(self):
        self.loader = ModelLoader()
        self.preprocessor = FeaturePreprocessor()
        self.feature_generator = SyntheticFeatureGenerator()

    def predict(self, transaction_data: dict) -> dict:
        """Predict fraud probability and risk level."""
        model = self.loader.get_model()
        if not model:
            raise RuntimeError("Model not loaded.")

        # Generate realistic V1-V28 features from business-level data
        synthetic_features = self.feature_generator.generate_features(transaction_data)

        # Preprocess and scale features for the model
        preprocessed_df = self.preprocessor.preprocess(synthetic_features)
        
        # xgboost predict_proba output is [P(class=0), P(class=1)]
        probability = float(model.predict_proba(preprocessed_df)[0][1])
        
        risk_level = self._determine_risk(probability)
        
        return {
            "fraud_probability": probability,
            "risk_level": risk_level,
            "recommended_action": self._get_action(risk_level)
        }

    def _determine_risk(self, probability: float) -> str:
        if probability >= 0.70:
            return "High"
        elif probability <= 0.30:
            return "Low"
        return "Medium"

    def _get_action(self, risk_level: str) -> str:
        if risk_level == "High":
            return "Block"
        elif risk_level == "Low":
            return "Approve"
        return "Review"
