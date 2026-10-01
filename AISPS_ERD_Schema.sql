-- AI-Based Student Performance Prediction and Improvement System (AISPS)
-- Consolidated database schema for ERD generation.
-- Reflects the current schema state (all Flyway migrations V1-V4 applied).
--
-- HOW TO USE THIS FILE:
-- 1. Open https://app.diagrams.net/ (draw.io)
-- 2. Extras menu -> Edit Diagram... is NOT this -- instead use:
--    File -> Import from -> Device / SQL, OR use the "+" (Create shape) panel
--    on the left, search "SQL", and choose "Import from SQL" / "Entity Relation".
--    (In current draw.io versions: Extras -> "Edit Diagram" is for XML; the SQL
--    importer is under File > Import From > "SQL" or the "Advanced" section of
--    the shape search box "Insert SQL". If your version only has a plain-text
--    "SQL" import dialog, paste this entire file's contents there.)
-- 3. Paste the contents of this file into the SQL import dialog and click Import.
-- 4. draw.io will auto-generate an ER diagram with tables and relationship
--    lines based on the PRIMARY KEY / FOREIGN KEY declarations below.

CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME NOT NULL
);

CREATE TABLE students (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    registration_no VARCHAR(30) NOT NULL,
    program VARCHAR(100) NOT NULL,
    year_of_study INT NOT NULL,
    previous_gpa DECIMAL(3,2),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE courses (
    id BIGINT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(150) NOT NULL,
    credits INT NOT NULL,
    program VARCHAR(100),
    lecturer_id BIGINT,
    FOREIGN KEY (lecturer_id) REFERENCES users(id)
);

CREATE TABLE enrollments (
    id BIGINT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    semester VARCHAR(20) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE attendance (
    id BIGINT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    semester VARCHAR(20) NOT NULL,
    sessions_attended INT NOT NULL,
    sessions_total INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE assessments (
    id BIGINT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    semester VARCHAR(20) NOT NULL,
    ca_score DECIMAL(5,2),
    assignment_completion DECIMAL(5,2),
    final_score DECIMAL(5,2),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE predictions (
    id BIGINT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    course_id BIGINT,
    semester VARCHAR(20),
    model_used VARCHAR(50),
    risk_level VARCHAR(10) NOT NULL,
    confidence_score DECIMAL(5,2),
    generated_at DATETIME NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE recommendations (
    id BIGINT PRIMARY KEY,
    prediction_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (prediction_id) REFERENCES predictions(id)
);

CREATE TABLE notifications (
    id BIGINT PRIMARY KEY,
    recipient_user_id BIGINT NOT NULL,
    prediction_id BIGINT NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BOOLEAN NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (recipient_user_id) REFERENCES users(id),
    FOREIGN KEY (prediction_id) REFERENCES predictions(id)
);
