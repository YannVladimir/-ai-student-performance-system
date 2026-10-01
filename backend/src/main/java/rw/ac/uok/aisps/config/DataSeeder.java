package rw.ac.uok.aisps.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import rw.ac.uok.aisps.domain.*;
import rw.ac.uok.aisps.repository.*;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Loads the synthetic demo dataset (dataset/*.csv, bundled under
 * src/main/resources/seed) on first startup, so the system is immediately
 * explorable without a manual data-loading step. Only runs when the users
 * table is empty -- safe to leave enabled across restarts.
 *
 * Demo login passwords (same for every seeded account of that role):
 *   admin@...       -> Admin@12345
 *   management@...  -> Management@12345
 *   *lecturer...    -> Lecturer@12345
 *   *student...     -> Student@12345
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final AssessmentRepository assessmentRepository;
    private final PasswordEncoder passwordEncoder;

    private final Map<Long, User> userById = new HashMap<>();
    private final Map<Long, Student> studentById = new HashMap<>();
    private final Map<Long, Course> courseById = new HashMap<>();

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            log.info("Seed skipped -- users table already populated");
            return;
        }

        log.info("Seeding demo dataset...");
        seedUsers();
        seedStudents();
        seedCourses();
        seedEnrollments();
        seedAttendance();
        seedAssessments();
        log.info("Seed complete: {} users, {} students, {} courses",
                userRepository.count(), studentRepository.count(), courseRepository.count());
    }

    private void seedUsers() throws Exception {
        String adminHash = passwordEncoder.encode("Admin@12345");
        String managementHash = passwordEncoder.encode("Management@12345");
        String lecturerHash = passwordEncoder.encode("Lecturer@12345");
        String studentHash = passwordEncoder.encode("Student@12345");

        for (CSVRecord r : parse("seed/users.csv")) {
            Role role = Role.valueOf(r.get("role").toUpperCase());
            String hash = switch (role) {
                case ADMIN -> adminHash;
                case MANAGEMENT -> managementHash;
                case LECTURER -> lecturerHash;
                case STUDENT -> studentHash;
            };
            User user = User.builder()
                    .fullName(r.get("full_name"))
                    .email(r.get("email"))
                    .passwordHash(hash)
                    .role(role)
                    .status(UserStatus.valueOf(r.get("status").toUpperCase()))
                    .build();
            user = userRepository.save(user);
            userById.put(Long.parseLong(r.get("user_id")), user);
        }
    }

    private void seedStudents() throws Exception {
        for (CSVRecord r : parse("seed/students.csv")) {
            Student student = Student.builder()
                    .user(userById.get(Long.parseLong(r.get("user_id"))))
                    .registrationNo(r.get("registration_no"))
                    .program(r.get("program"))
                    .yearOfStudy(Integer.parseInt(r.get("year_of_study")))
                    .previousGpa(new BigDecimal(r.get("previous_gpa")))
                    .build();
            student = studentRepository.save(student);
            studentById.put(Long.parseLong(r.get("student_id")), student);
        }
    }

    private void seedCourses() throws Exception {
        for (CSVRecord r : parse("seed/courses.csv")) {
            Course course = Course.builder()
                    .courseCode(r.get("course_code"))
                    .courseName(r.get("course_name"))
                    .credits(Integer.parseInt(r.get("credits")))
                    .lecturer(userById.get(Long.parseLong(r.get("lecturer_user_id"))))
                    .build();
            course = courseRepository.save(course);
            courseById.put(Long.parseLong(r.get("course_id")), course);
        }
    }

    private void seedEnrollments() throws Exception {
        for (CSVRecord r : parse("seed/enrollments.csv")) {
            enrollmentRepository.save(Enrollment.builder()
                    .student(studentById.get(Long.parseLong(r.get("student_id"))))
                    .course(courseById.get(Long.parseLong(r.get("course_id"))))
                    .semester(r.get("semester"))
                    .build());
        }
    }

    private void seedAttendance() throws Exception {
        for (CSVRecord r : parse("seed/attendance.csv")) {
            attendanceRepository.save(Attendance.builder()
                    .student(studentById.get(Long.parseLong(r.get("student_id"))))
                    .course(courseById.get(Long.parseLong(r.get("course_id"))))
                    .semester(r.get("semester"))
                    .sessionsAttended(Integer.parseInt(r.get("sessions_attended")))
                    .sessionsTotal(Integer.parseInt(r.get("sessions_total")))
                    .build());
        }
    }

    private void seedAssessments() throws Exception {
        for (CSVRecord r : parse("seed/assessments.csv")) {
            assessmentRepository.save(Assessment.builder()
                    .student(studentById.get(Long.parseLong(r.get("student_id"))))
                    .course(courseById.get(Long.parseLong(r.get("course_id"))))
                    .semester(r.get("semester"))
                    .caScore(new BigDecimal(r.get("ca_score")))
                    .assignmentCompletion(new BigDecimal(r.get("assignment_completion")))
                    .finalScore(new BigDecimal(r.get("final_score")))
                    .build());
        }
    }

    private Iterable<CSVRecord> parse(String classpathLocation) throws Exception {
        var resource = new ClassPathResource(classpathLocation);
        var reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8);
        return CSVParser.parse(reader, CSVFormat.DEFAULT.builder()
                .setHeader().setSkipHeaderRecord(true).setTrim(true).build());
    }
}
