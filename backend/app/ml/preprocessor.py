import pandas as pd
from app.ml.model_loader import ModelLoader

class FeaturePreprocessor:
    """Feature preprocessing logic."""
    def __init__(self):
        self.loader = ModelLoader()

    def preprocess(self, transaction_data: dict) -> pd.DataFrame:
        """Preprocess a single transaction dictionary."""
        scaler = self.loader.get_scaler()
        metadata = self.loader.get_metadata()
        
        if not scaler or not metadata:
            raise RuntimeError("ML artifacts not loaded.")
            
        features = metadata.get("features", [])
        
        # Build dataframe with correct order
        # Default to 0 for missing features
        row = {f: transaction_data.get(f, 0.0) for f in features}
        df = pd.DataFrame([row], columns=features)
        
        # Scale
        scaled_data = scaler.transform(df)
        return pd.DataFrame(scaled_data, columns=features)
