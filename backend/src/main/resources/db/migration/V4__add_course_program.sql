-- Links courses to a program (e.g. "BSc Computer Science"), so newly-created
-- courses can be properly associated with a program instead of the seeded
-- dataset's disconnected student.program / course pairing.
ALTER TABLE courses ADD COLUMN program VARCHAR(100);
