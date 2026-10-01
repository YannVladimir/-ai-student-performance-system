package rw.ac.uok.aisps.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import rw.ac.uok.aisps.dto.CourseAdminDto;
import rw.ac.uok.aisps.dto.CreateCourseRequest;
import rw.ac.uok.aisps.dto.UpdateCourseRequest;
import rw.ac.uok.aisps.service.CourseAdminService;

import java.util.List;

/** System Admin course management -- courses are structural/reference data,
 * managed the same way user accounts are (Section: System Admin duties). */
@RestController
@RequestMapping("/api/admin/courses")
@RequiredArgsConstructor
public class AdminCourseController {

    private final CourseAdminService courseAdminService;

    @GetMapping
    public List<CourseAdminDto> list() {
        return courseAdminService.listAll();
    }

    @PostMapping
    public CourseAdminDto create(@RequestBody CreateCourseRequest request) {
        return courseAdminService.create(request);
    }

    @PatchMapping("/{id}")
    public CourseAdminDto update(@PathVariable Long id, @RequestBody UpdateCourseRequest request) {
        return courseAdminService.update(id, request);
    }
}
