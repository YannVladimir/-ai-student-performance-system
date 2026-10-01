package rw.ac.uok.aisps.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import rw.ac.uok.aisps.dto.MlPredictBatchRequest;
import rw.ac.uok.aisps.dto.MlPredictBatchResponse;
import rw.ac.uok.aisps.dto.MlPredictRequest;
import rw.ac.uok.aisps.dto.MlPredictResponse;
import rw.ac.uok.aisps.exception.MlServiceException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MlClientService {

    private final RestClient mlServiceRestClient;
    private final RestClient mlTrainRestClient;

    /**
     * Calls the Python ML microservice's /predict endpoint. On any failure
     * (service down, timeout, bad response) falls back to a deterministic
     * rule-based estimate so the rest of the system keeps working -- the ML
     * service is a plugin, not a single point of failure for the whole app.
     */
    public MlPredictResponse predict(MlPredictRequest request) {
        try {
            return mlServiceRestClient.post()
                    .uri("/predict")
                    .body(request)
                    .retrieve()
                    .body(MlPredictResponse.class);
        } catch (Exception ex) {
            log.warn("ML service unavailable, falling back to rule-based prediction: {}", ex.getMessage());
            return fallbackPredict(request);
        }
    }

    /**
     * Batch variant of predict(): one HTTP round-trip for many students
     * instead of one per student, which is what keeps "generate predictions
     * for a course" from timing out on courses with hundreds or thousands
     * of enrolled students. Falls back to the same rule-based estimate as
     * predict() for every item if the ML service call fails as a whole.
     */
    public List<MlPredictResponse> predictBatch(List<MlPredictRequest> requests) {
        if (requests.isEmpty()) {
            return List.of();
        }
        try {
            MlPredictBatchResponse response = mlServiceRestClient.post()
                    .uri("/predict/batch")
                    .body(new MlPredictBatchRequest(requests))
                    .retrieve()
                    .body(MlPredictBatchResponse.class);
            return response.results();
        } catch (Exception ex) {
            log.warn("ML service batch predict unavailable, falling back to rule-based prediction: {}", ex.getMessage());
            return requests.stream().map(this::fallbackPredict).toList();
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> metrics() {
        try {
            return mlServiceRestClient.get()
                    .uri("/metrics")
                    .retrieve()
                    .body(Map.class);
        } catch (Exception ex) {
            log.warn("ML service metrics unavailable: {}", ex.getMessage());
            return Map.of("status", "unavailable");
        }
    }

    public void triggerRetrain() {
        try {
            mlTrainRestClient.post().uri("/train").retrieve().toBodilessEntity();
        } catch (Exception ex) {
            log.error("ML retrain request failed: {}", ex.getMessage());
            throw new MlServiceException(
                    "The ML service is taking longer than expected to retrain the models "
                            + "(this can take up to two minutes). Please wait a moment and try again.",
                    ex);
        }
    }

    private MlPredictResponse fallbackPredict(MlPredictRequest r) {
        double composite = 0.30 * (r.attendanceRate() / 100.0)
                + 0.30 * (r.caScore() / 100.0)
                + 0.20 * (r.assignmentCompletion() / 100.0)
                + 0.20 * (r.previousGpa() / 4.0);

        String level;
        if (r.attendanceRate() < 55 || r.caScore() < 35) {
            level = "HIGH";
        } else if (composite >= 0.70) {
            level = "LOW";
        } else if (composite >= 0.50) {
            level = "MEDIUM";
        } else {
            level = "HIGH";
        }
        return new MlPredictResponse(level, Math.round(composite * 100.0) / 100.0, "fallback-rule-based");
    }
}
