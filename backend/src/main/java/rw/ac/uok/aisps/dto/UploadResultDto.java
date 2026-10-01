package rw.ac.uok.aisps.dto;

import java.util.List;

public record UploadResultDto(
        int recordsProcessed,
        int recordsFailed,
        List<String> errors
) {
}
