from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    attendance_rate: float = Field(ge=0, le=100)
    ca_score: float = Field(ge=0, le=100)
    assignment_completion: float = Field(ge=0, le=100)
    previous_gpa: float = Field(ge=0, le=4)


class PredictResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    risk_level: str
    confidence: float
    model_used: str


class PredictBatchRequest(BaseModel):
    items: list[PredictRequest]


class PredictBatchResponse(BaseModel):
    results: list[PredictResponse]


class TrainResponse(BaseModel):
    trained_on_rows: int
    metrics: dict
    active_model: str
