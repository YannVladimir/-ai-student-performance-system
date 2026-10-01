-- Adds the University Management role (role diagram: Student / Lecturer /
-- University Management / System Admin) to the users table's role check.
ALTER TABLE users DROP CONSTRAINT chk_users_role;
ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('STUDENT', 'LECTURER', 'ADMIN', 'MANAGEMENT'));
