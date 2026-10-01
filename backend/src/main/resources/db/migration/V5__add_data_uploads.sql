-- Tracks each academic-data CSV upload as a first-class record, so the
-- Upload Data page can show a lecturer what's already been uploaded for a
-- selected course before they upload something new (previously nothing
-- recorded that a file was ever uploaded -- only the resulting
-- enrollment/attendance/assessment rows existed).
CREATE TABLE data_uploads (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    uploaded_by BIGINT NOT NULL,
    semester VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    records_processed INT NOT NULL,
    records_failed INT NOT NULL,
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_data_uploads_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_data_uploads_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_data_uploads_course ON data_uploads(course_id);
CREATE INDEX idx_data_uploads_uploaded_at ON data_uploads(uploaded_at);
