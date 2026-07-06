import os
import json
import joblib
import threading

class ModelLoader:
    """Singleton for loading and providing ML artifacts."""
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ModelLoader, cls).__new__(cls)
                cls._instance._initialize()
            return cls._instance
            
    def _initialize(self):
        self.model = None
        self.scaler = None
        self.metadata = None
        self.artifacts_dir = os.path.join(os.path.dirname(__file__), 'artifacts')
        self.load_artifacts()
        
    def load_artifacts(self):
        model_path = os.path.join(self.artifacts_dir, 'best_model.joblib')
        scaler_path = os.path.join(self.artifacts_dir, 'scaler.joblib')
        metadata_path = os.path.join(self.artifacts_dir, 'metadata.json')
        
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
        if os.path.exists(scaler_path):
            self.scaler = joblib.load(scaler_path)
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                self.metadata = json.load(f)

    def get_model(self):
        return self.model
        
    def get_scaler(self):
        return self.scaler
        
    def get_metadata(self):
        return self.metadata
