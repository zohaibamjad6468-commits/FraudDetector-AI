# Machine Learning Pipeline

The AI Fraud Detection system utilizes a robust, automated Machine Learning pipeline built using `scikit-learn` and `XGBoost`. 

---

## 1. Dataset & Loading
The pipeline expects historical credit card transaction data.
- **Source**: `data/creditcard.csv` (A standard dataset such as the Kaggle ULB dataset, or an equivalent mock).
- **Class Imbalance**: Fraud datasets are heavily imbalanced (e.g., 99.8% legitimate, 0.2% fraud). Handling this is the primary challenge of the pipeline.

## 2. Preprocessing
Before algorithms can learn from data, it must be cleaned and standardized.
- **Feature Separation**: The target variable (`Class` or `is_fraud`) is separated from the predictive features.
- **Scaling**: We use `RobustScaler` from scikit-learn. Unlike `StandardScaler` which uses the mean and variance, `RobustScaler` uses the median and interquartile range. This makes it impervious to extreme outliers (like a highly unusual $50,000 transaction), which are common in fraud data.

## 3. Resampling (SMOTE)
To combat class imbalance, the pipeline utilizes **SMOTE** (Synthetic Minority Over-sampling Technique).
- Rather than duplicating existing fraud cases (which leads to overfitting), SMOTE interpolates between existing fraud data points to generate entirely new, synthetic fraud examples.
- This ensures the model has enough "fraud" data to learn from without biasing itself towards the majority "legitimate" class.

## 4. Train/Test Split
The data is split into Training (80%) and Testing (20%) sets *before* SMOTE is applied to the test set. It is critical that the test set remains imbalanced exactly as it would appear in the real world to get an accurate evaluation.

## 5. Model Selection & Training
We evaluated multiple algorithms (like Random Forest) but selected **XGBoost (Extreme Gradient Boosting)** for production.
- **Why XGBoost?** It builds decision trees sequentially, with each new tree correcting the errors of the previous ones. It is highly resistant to overfitting, handles non-linear relationships well, and executes predictions in milliseconds.
- **Hyperparameters**: Tuned for maximum precision and recall, optimizing the `scale_pos_weight` if necessary.

## 6. Evaluation Metrics
Because the dataset is imbalanced, simply measuring "Accuracy" is misleading. We evaluate using:
- **Precision**: When the model predicts fraud, how often is it actually fraud? (Minimizes false positives).
- **Recall (Sensitivity)**: Out of all actual fraud, how much did the model catch? (Minimizes false negatives).
- **F1-Score**: The harmonic mean of Precision and Recall.
- **ROC-AUC**: Evaluates the model's ability to distinguish between the two classes across different probability thresholds.

## 7. Model Serialization
Once trained, the pipeline saves the artifacts to the `app/ml/artifacts/` directory so they can be loaded by the REST APIs without retraining:
- `best_model.joblib`: The trained XGBoost model.
- `scaler.joblib`: The fitted `RobustScaler` to ensure incoming API data is scaled exactly like the training data.
- `metadata.json`: Stores training timestamps, dataset shapes, and evaluation metrics.

## 8. Feature Importance & Explainability
The pipeline incorporates an Explainable AI (XAI) component.
When a prediction is made via the API, the system doesn't just output a probability. It uses the model's internal feature weights to explain *why* it made the decision.
- Example: `{"feature": "Amount", "impact": 0.45, "note": "Unusually high transaction volume for this user"}`.
This directly empowers analysts in the review workflow.
