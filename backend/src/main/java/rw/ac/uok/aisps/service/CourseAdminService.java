package rw.ac.uok.aisps.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.ac.uok.aisps.domain.Course;
import rw.ac.uok.aisps.domain.Role;
import rw.ac.uok.aisps.domain.User;
import rw.ac.uok.aisps.dto.CourseAdminDto;
import rw.ac.uok.aisps.dto.CreateCourseRequest;
import rw.ac.uok.aisps.dto.UpdateCourseRequest;
import rw.ac.uok.aisps.exception.BadRequestException;
import rw.ac.uok.aisps.exception.ResourceNotFoundException;
import rw.ac.uok.aisps.repository.CourseRepository;
import rw.ac.uok.aisps.repository.UserRepository;

import java.util.List;

/** Backs the course-management screen: courses are structural data (like user
 * accounts), so this lives alongside UserAdminService under System Admin. */
@Service
@RequiredArgsConstructor
@Transactional
public class CourseAdminService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public List<CourseAdminDto> listAll() {
        return courseRepository.findAll().stream().map(this::toDto).toList();
    }

    public CourseAdminDto create(CreateCourseRequest request) {
        if (request.courseCode() == null || request.courseCode().isBlank()) {
            throw new BadRequestException("course_code is required");
        }
        if (courseRepository.existsByCourseCode(request.courseCode())) {
            throw new BadRequestException("A course with this code already exists: " + request.courseCode());
        }
        Course course = Course.builder()
                .courseCode(request.courseCode().trim())
                .courseName(request.courseName())
                .credits(request.credits())
                .program(request.program())
                .lecturer(resolveLecturer(request.lecturerUserId()))
                .build();
        return toDto(courseRepository.save(course));
    }

    public CourseAdminDto update(Long id, UpdateCourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + id));
        course.setCourseName(request.courseName());
        course.setCredits(request.credits());
        course.setProgram(request.program());
        course.setLecturer(resolveLecturer(request.lecturerUserId()));
        return toDto(courseRepository.save(course));
    }

    private User resolveLecturer(Long lecturerUserId) {
        if (lecturerUserId == null) return null;
        User lecturer = userRepository.findById(lecturerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + lecturerUserId));
        if (lecturer.getRole() != Role.LECTURER) {
            throw new BadRequestException("User " + lecturerUserId + " is not a lecturer");
        }
        return lecturer;
    }

    private CourseAdminDto toDto(Course c) {
        return new CourseAdminDto(
                c.getId(), c.getCourseCode(), c.getCourseName(), c.getCredits(), c.getProgram(),
                c.getLecturer() != null ? c.getLecturer().getId() : null,
                c.getLecturer() != null ? c.getLecturer().getFullName() : null);
    }
}
