from app.ml.model_loader import ModelLoader

class PredictionExplainer:
    """Prediction explainability logic."""
    def __init__(self):
        self.loader = ModelLoader()

    def explain(self, transaction_data: dict, top_k: int = 3) -> list:
        """Return top features contributing to the prediction based on model's global importance."""
        model = self.loader.get_model()
        metadata = self.loader.get_metadata()
        
        if not model or not metadata:
            raise RuntimeError("Model not loaded.")
            
        features = metadata.get("features", [])
        
        # Get feature importances from XGBoost
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
        else:
            return []
        
        # Sort importances
        feature_importance_map = dict(zip(features, importances))
        sorted_features = sorted(feature_importance_map.items(), key=lambda x: x[1], reverse=True)
        
        explanations = []
        for feature, impact in sorted_features[:top_k]:
            explanations.append({
                "feature_name": feature,
                "impact": float(impact),
                "note": "High global importance"
            })
            
        return explanations
