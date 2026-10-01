package rw.ac.uok.aisps.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.ac.uok.aisps.domain.Prediction;
import rw.ac.uok.aisps.domain.RiskLevel;

import java.util.List;
import java.util.Optional;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {
    List<Prediction> findByStudent_IdOrderByGeneratedAtDesc(Long studentId);

    Optional<Prediction> findTopByStudent_IdAndCourse_IdOrderByGeneratedAtDesc(Long studentId, Long courseId);

    List<Prediction> findByCourse_Id(Long courseId);

    List<Prediction> findByCourse_IdAndSemester(Long courseId, String semester);

    List<Prediction> findByCourse_IdAndSemesterAndRiskLevel(Long courseId, String semester, RiskLevel riskLevel);

    List<Prediction> findAllByOrderByGeneratedAtDesc();
}
