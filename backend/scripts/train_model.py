import os
import sys
import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler
from sklearn.metrics import classification_report, f1_score, roc_auc_score, precision_score, recall_score, accuracy_score
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, backend_dir)

from app import create_app
from app.extensions import db
from app.ml.models import ModelVersion

def train_model():
    app = create_app()
    with app.app_context():
        # Setup paths
        project_root = os.path.abspath(os.path.join(backend_dir, '..'))
        dataset_path = os.path.join(project_root, 'creditcard.csv')
        artifacts_dir = os.path.join(backend_dir, 'app', 'ml', 'artifacts')
        
        os.makedirs(artifacts_dir, exist_ok=True)
        
        print("Loading dataset...")
        df = pd.read_csv(dataset_path)
        
        # Features and target
        X = df.drop(['Time', 'Class'], axis=1)
        y = df['Class']
        
        print("Splitting data...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        print("Scaling data...")
        scaler = RobustScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        print("Applying SMOTE...")
        smote = SMOTE(random_state=42)
        X_train_resampled, y_train_resampled = smote.fit_resample(X_train_scaled, y_train)
        
        print("Training XGBoost...")
        # Limiting estimators to 50 and depth to 4 for faster execution in this environment
        xgb_model = XGBClassifier(
            n_estimators=50,
            max_depth=4,
            learning_rate=0.1,
            random_state=42,
            n_jobs=-1
        )
        xgb_model.fit(X_train_resampled, y_train_resampled)
        
        print("Evaluating XGBoost...")
        y_pred = xgb_model.predict(X_test_scaled)
        y_prob = xgb_model.predict_proba(X_test_scaled)[:, 1]
        
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred)
        recall = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        auc = roc_auc_score(y_test, y_prob)
        
        print(f"XGBoost F1: {f1:.4f}, AUC: {auc:.4f}")
        
        # Save artifacts
        print("Saving artifacts...")
        model_path = os.path.join(artifacts_dir, 'best_model.joblib')
        scaler_path = os.path.join(artifacts_dir, 'scaler.joblib')
        metadata_path = os.path.join(artifacts_dir, 'metadata.json')
        
        joblib.dump(xgb_model, model_path)
        joblib.dump(scaler, scaler_path)
        
        version_str = "v1.0.0"
        metadata = {
            "version": version_str,
            "algorithm": "XGBoost",
            "features": list(X.columns),
            "metrics": {
                "accuracy": accuracy,
                "precision": precision,
                "recall": recall,
                "f1": f1,
                "auc": auc
            }
        }
        
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=4)
        
        print("Updating Database...")
        try:
            # Check if version exists
            existing_version = db.session.query(ModelVersion).filter_by(version=version_str).first()
            if existing_version:
                existing_version.algorithm = "XGBoost"
                existing_version.accuracy = accuracy
                existing_version.precision = precision
                existing_version.recall = recall
                existing_version.f1 = f1
                existing_version.auc = auc
            else:
                new_version = ModelVersion(
                    version=version_str,
                    algorithm="XGBoost",
                    accuracy=accuracy,
                    precision=precision,
                    recall=recall,
                    f1=f1,
                    auc=auc
                )
                db.session.add(new_version)
            
            db.session.commit()
            print("Database updated successfully!")
        except Exception as e:
            print(f"Warning: Could not update database ({e}). Make sure MySQL is running.")
            db.session.rollback()
            
        print("Done!")

if __name__ == "__main__":
    train_model()

