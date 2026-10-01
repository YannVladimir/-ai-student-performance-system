"""
Tests for the training/prediction pipeline (Thesis Section 4.5 / 4.7.4).
Each test trains into an isolated tmp_path so it never touches the real
committed models/ directory used by the running service.
"""
import pandas as pd
import pytest

from app.model import train, Predictor, _preprocess, DATA_PATH, FEATURE_COLUMNS


@pytest.fixture
def trained(tmp_path):
    result = train(data_path=DATA_PATH, models_dir=tmp_path)
    return result, tmp_path


def test_train_produces_metrics_for_all_three_algorithms(trained):
    result, _ = trained
    assert set(result["metrics"].keys()) == {"decision_tree", "logistic_regression", "naive_bayes"}
    assert result["trained_on_rows"] > 0


def test_decision_tree_is_selected_as_active_model(trained):
    """Matches Thesis Table 10: Decision Tree has the highest accuracy and is
    the model actually deployed."""
    result, _ = trained
    assert result["active_model"] == "decision_tree"


def test_accuracy_regression_guard(trained):
    """Guards against a future dataset/preprocessing change silently tanking
    model quality -- thresholds set comfortably below the ~84% observed so
    small natural variation across runs/reseeds doesn't cause flakiness."""
    result, _ = trained
    dt = result["metrics"]["decision_tree"]
    assert dt["accuracy"] >= 70.0
    assert dt["cv_accuracy_mean"] >= 70.0


def test_predictor_loads_trained_model_and_predicts(trained):
    _, models_dir = trained
    predictor = Predictor(models_dir=models_dir)
    assert predictor.is_ready()

    result = predictor.predict(
        attendance_rate=30, ca_score=25, assignment_completion=20, previous_gpa=1.2
    )
    assert result["risk_level"] in {"LOW", "MEDIUM", "HIGH"}
    assert 0.0 <= result["confidence"] <= 1.0
    assert result["model_used"] == "decision_tree"


def test_predictor_not_ready_before_training(tmp_path):
    predictor = Predictor(models_dir=tmp_path)
    assert not predictor.is_ready()
    with pytest.raises(RuntimeError):
        predictor.predict(50, 50, 50, 2.0)


def test_preprocessing_fills_missing_values_instead_of_dropping_rows():
    df = pd.DataFrame({
        "attendance_rate": [80.0, None, 60.0],
        "ca_score": [70.0, 65.0, None],
        "assignment_completion": [90.0, 85.0, 80.0],
        "previous_gpa": [3.0, 2.5, 2.0],
        "risk_level": ["Low", "Medium", "High"],
    })

    cleaned = _preprocess(df)

    assert len(cleaned) == 3, "rows with a single missing feature should be repaired, not dropped"
    assert cleaned[FEATURE_COLUMNS].isnull().sum().sum() == 0
