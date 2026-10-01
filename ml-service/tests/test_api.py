from fastapi.testclient import TestClient

from app.main import app


def test_health_reports_model_ready():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "ok"
        assert body["model_ready"] is True


def test_predict_returns_expected_shape():
    with TestClient(app) as client:
        response = client.post("/predict", json={
            "attendance_rate": 40.0,
            "ca_score": 30.0,
            "assignment_completion": 25.0,
            "previous_gpa": 1.5,
        })
        assert response.status_code == 200
        body = response.json()
        assert body["risk_level"] in {"LOW", "MEDIUM", "HIGH"}
        assert "confidence" in body
        assert "model_used" in body


def test_predict_rejects_out_of_range_input():
    with TestClient(app) as client:
        response = client.post("/predict", json={
            "attendance_rate": 150.0,  # > 100, invalid
            "ca_score": 30.0,
            "assignment_completion": 25.0,
            "previous_gpa": 1.5,
        })
        assert response.status_code == 422


def test_predict_batch_matches_individual_predict_calls():
    with TestClient(app) as client:
        items = [
            {"attendance_rate": 40.0, "ca_score": 30.0, "assignment_completion": 25.0, "previous_gpa": 1.5},
            {"attendance_rate": 95.0, "ca_score": 90.0, "assignment_completion": 92.0, "previous_gpa": 3.6},
        ]
        batch_response = client.post("/predict/batch", json={"items": items})
        assert batch_response.status_code == 200
        results = batch_response.json()["results"]
        assert len(results) == 2

        for item, result in zip(items, results):
            individual_response = client.post("/predict", json=item)
            assert individual_response.status_code == 200
            individual = individual_response.json()
            assert result["risk_level"] == individual["risk_level"]
            assert result["model_used"] == individual["model_used"]


def test_predict_batch_handles_empty_list():
    with TestClient(app) as client:
        response = client.post("/predict/batch", json={"items": []})
        assert response.status_code == 200
        assert response.json()["results"] == []


def test_metrics_endpoint_reports_all_three_models():
    with TestClient(app) as client:
        response = client.get("/metrics")
        assert response.status_code == 200
        body = response.json()
        assert set(body["metrics"].keys()) == {"decision_tree", "logistic_regression", "naive_bayes"}


def test_train_endpoint_retrains_and_updates_active_model():
    with TestClient(app) as client:
        response = client.post("/train")
        assert response.status_code == 200
        body = response.json()
        assert body["active_model"] == "decision_tree"
