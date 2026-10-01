-- AI-Based Student Performance Prediction and Improvement System
-- Core schema, normalized to 3NF per Thesis Chapter 4 (Data Dictionary, Tables 4-9).

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('STUDENT', 'LECTURER', 'ADMIN')),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'SUSPENDED'))
) ENGINE=InnoDB;

CREATE TABLE students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    registration_no VARCHAR(30) NOT NULL,
    program VARCHAR(100) NOT NULL,
    year_of_study INT NOT NULL,
    previous_gpa DECIMAL(3,2),
    CONSTRAINT uq_students_user UNIQUE (user_id),
    CONSTRAINT uq_students_reg_no UNIQUE (registration_no),
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(150) NOT NULL,
    credits INT NOT NULL,
    lecturer_id BIGINT,
    CONSTRAINT uq_courses_code UNIQUE (course_code),
    CONSTRAINT fk_courses_lecturer FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE enrollments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    semester VARCHAR(20) NOT NULL,
    CONSTRAINT uq_enrollments UNIQUE (student_id, course_id, semester),
    CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    semester VARCHAR(20) NOT NULL,
    sessions_attended INT NOT NULL,
    sessions_total INT NOT NULL,
    CONSTRAINT uq_attendance UNIQUE (student_id, course_id, semester),
    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE assessments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    semester VARCHAR(20) NOT NULL,
    ca_score DECIMAL(5,2),
    assignment_completion DECIMAL(5,2),
    final_score DECIMAL(5,2),
    CONSTRAINT uq_assessments UNIQUE (student_id, course_id, semester),
    CONSTRAINT fk_assessments_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_assessments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE predictions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    course_id BIGINT,
    semester VARCHAR(20),
    model_used VARCHAR(50),
    risk_level VARCHAR(10) NOT NULL,
    confidence_score DECIMAL(5,2),
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_predictions_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_predictions_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    CONSTRAINT chk_predictions_risk CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH'))
) ENGINE=InnoDB;

CREATE TABLE recommendations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prediction_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recommendations_prediction FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE,
    CONSTRAINT chk_recommendations_status CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED'))
) ENGINE=InnoDB;

-- Indexes on frequently-queried columns (Thesis Section 4.4.6, Physical Data Model)
CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_courses_lecturer ON courses(lecturer_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_course ON attendance(course_id);
CREATE INDEX idx_assessments_student ON assessments(student_id);
CREATE INDEX idx_assessments_course ON assessments(course_id);
CREATE INDEX idx_predictions_student ON predictions(student_id);
CREATE INDEX idx_predictions_course ON predictions(course_id);
CREATE INDEX idx_predictions_generated_at ON predictions(generated_at);
CREATE INDEX idx_recommendations_prediction ON recommendations(prediction_id);
