"""
Training/prediction pipeline for the AI-Based Student Performance
Prediction and Improvement System's ML component (Thesis Section 4.5).

Trains and compares three classifiers on the four core predictive features
(attendance rate, CA score, assignment completion, previous GPA):
Decision Tree, Logistic Regression, Naive Bayes. The best-performing model
by accuracy is promoted to "active" and used to serve /predict.
"""
import json
import os
from pathlib import Path

import joblib
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.naive_bayes import GaussianNB
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = Path(os.environ.get("TRAINING_DATA_PATH", BASE_DIR / "data" / "ml_training_dataset.csv"))
MODELS_DIR = Path(os.environ.get("MODELS_DIR", BASE_DIR / "models"))

FEATURE_COLUMNS = ["attendance_rate", "ca_score", "assignment_completion", "previous_gpa"]
TARGET_COLUMN = "risk_level"

MODEL_BUILDERS = {
    "decision_tree": lambda: DecisionTreeClassifier(max_depth=6, random_state=42),
    "logistic_regression": lambda: LogisticRegression(max_iter=1000),
    "naive_bayes": lambda: GaussianNB(),
}


def _preprocess(df: pd.DataFrame):
    df = df.copy()
    for col in FEATURE_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        df[col] = df[col].fillna(df[col].mean())
    df = df.dropna(subset=[TARGET_COLUMN])
    return df


def train(data_path: Path = DATA_PATH, models_dir: Path = MODELS_DIR) -> dict:
    models_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(data_path)
    df = _preprocess(df)

    X = df[FEATURE_COLUMNS].values
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(df[TARGET_COLUMN])

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.3, random_state=42, stratify=y
    )

    metrics = {}
    best_name, best_score = None, -1.0

    for name, builder in MODEL_BUILDERS.items():
        model = builder()
        model.fit(X_train, y_train)
        preds = model.predict(X_test)

        acc = accuracy_score(y_test, preds)
        prec = precision_score(y_test, preds, average="macro", zero_division=0)
        rec = recall_score(y_test, preds, average="macro", zero_division=0)
        f1 = f1_score(y_test, preds, average="macro", zero_division=0)
        cv_scores = cross_val_score(builder(), X_scaled, y, cv=10)

        metrics[name] = {
            "accuracy": round(acc * 100, 1),
            "precision": round(prec * 100, 1),
            "recall": round(rec * 100, 1),
            "f1_score": round(f1 * 100, 1),
            "cv_accuracy_mean": round(cv_scores.mean() * 100, 1),
            "cv_accuracy_min": round(cv_scores.min() * 100, 1),
            "cv_accuracy_max": round(cv_scores.max() * 100, 1),
        }

        joblib.dump(model, models_dir / f"{name}.joblib")

        if acc > best_score:
            best_name, best_score = name, acc

    joblib.dump(scaler, models_dir / "scaler.joblib")
    joblib.dump(label_encoder, models_dir / "label_encoder.joblib")

    result = {
        "trained_on_rows": len(df),
        "metrics": metrics,
        "active_model": best_name,
    }
    with open(models_dir / "metrics.json", "w") as f:
        json.dump(result, f, indent=2)
    with open(models_dir / "active_model.txt", "w") as f:
        f.write(best_name)

    return result


class Predictor:
    """Loads persisted model artifacts and serves predictions. Reloadable
    after a /train call without restarting the process."""

    def __init__(self, models_dir: Path = MODELS_DIR):
        self.models_dir = models_dir
        self.model = None
        self.scaler = None
        self.label_encoder = None
        self.active_model_name = None
        self.load()

    def is_ready(self) -> bool:
        return self.model is not None

    def load(self):
        active_file = self.models_dir / "active_model.txt"
        if not active_file.exists():
            return
        self.active_model_name = active_file.read_text().strip()
        self.model = joblib.load(self.models_dir / f"{self.active_model_name}.joblib")
        self.scaler = joblib.load(self.models_dir / "scaler.joblib")
        self.label_encoder = joblib.load(self.models_dir / "label_encoder.joblib")

    def predict(self, attendance_rate: float, ca_score: float,
                assignment_completion: float, previous_gpa: float) -> dict:
        return self.predict_batch([(attendance_rate, ca_score, assignment_completion, previous_gpa)])[0]

    def predict_batch(self, items: list[tuple[float, float, float, float]]) -> list[dict]:
        """Predicts for many students in one call. scikit-learn's transform/
        predict/predict_proba all operate on the full matrix at once, so this
        is a single vectorised pass rather than a Python loop calling
        predict() per row -- the point is to let a caller replace N separate
        HTTP round-trips (one per student) with a single request."""
        if not self.is_ready():
            raise RuntimeError("Model not trained yet -- call /train first")
        if not items:
            return []

        X_scaled = self.scaler.transform(items)

        pred_encoded = self.model.predict(X_scaled)
        risk_levels = self.label_encoder.inverse_transform(pred_encoded)

        if hasattr(self.model, "predict_proba"):
            confidences = self.model.predict_proba(X_scaled).max(axis=1)
        else:
            confidences = [1.0] * len(items)

        return [
            {
                "risk_level": risk_level.upper(),
                "confidence": round(float(confidence), 4),
                "model_used": self.active_model_name,
            }
            for risk_level, confidence in zip(risk_levels, confidences)
        ]


def load_metrics(models_dir: Path = MODELS_DIR) -> dict:
    metrics_file = models_dir / "metrics.json"
    if not metrics_file.exists():
        return {"status": "not_trained_yet"}
    with open(metrics_file) as f:
        return json.load(f)
