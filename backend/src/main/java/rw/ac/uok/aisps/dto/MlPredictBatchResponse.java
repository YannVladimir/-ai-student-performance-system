package rw.ac.uok.aisps.dto;

import java.util.List;

public record MlPredictBatchResponse(
        List<MlPredictResponse> results
) {
}
