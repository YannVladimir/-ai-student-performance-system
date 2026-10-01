from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from app.model import Predictor, train, load_metrics, DATA_PATH, MODELS_DIR
from app.schemas import (
    PredictRequest,
    PredictResponse,
    PredictBatchRequest,
    PredictBatchResponse,
    TrainResponse,
)

predictor: Predictor | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global predictor
    predictor = Predictor()
    if not predictor.is_ready():
        # first run -- train immediately so /predict works without a manual step
        train()
        predictor.load()
    yield


app = FastAPI(
    title="AISPS ML Service",
    description="Decision Tree / Logistic Regression / Naive Bayes student-risk prediction service",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health")
def health():
    return {"status": "ok", "model_ready": predictor.is_ready() if predictor else False}


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    if predictor is None or not predictor.is_ready():
        raise HTTPException(status_code=503, detail="Model not trained yet")
    try:
        return predictor.predict(
            request.attendance_rate,
            request.ca_score,
            request.assignment_completion,
            request.previous_gpa,
        )
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@app.post("/predict/batch", response_model=PredictBatchResponse)
def predict_batch(request: PredictBatchRequest):
    if predictor is None or not predictor.is_ready():
        raise HTTPException(status_code=503, detail="Model not trained yet")
    try:
        items = [
            (r.attendance_rate, r.ca_score, r.assignment_completion, r.previous_gpa)
            for r in request.items
        ]
        results = predictor.predict_batch(items)
        return {"results": results}
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@app.post("/train", response_model=TrainResponse)
def retrain():
    try:
        result = train()
        predictor.load()
        return result
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Training data not found at {DATA_PATH}")
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@app.get("/metrics")
def metrics():
    return load_metrics(MODELS_DIR)
