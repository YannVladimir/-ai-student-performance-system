package rw.ac.uok.aisps.dto;

import java.util.List;

public record MlPredictBatchRequest(
        List<MlPredictRequest> items
) {
}
