package rw.ac.uok.aisps.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.ac.uok.aisps.domain.DataUpload;

import java.util.List;

public interface DataUploadRepository extends JpaRepository<DataUpload, Long> {
    List<DataUpload> findByCourse_IdOrderByUploadedAtDesc(Long courseId);
}
