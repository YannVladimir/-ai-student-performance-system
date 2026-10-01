package rw.ac.uok.aisps.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.ac.uok.aisps.domain.Recommendation;

import java.util.List;

public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {
    List<Recommendation> findByPrediction_Id(Long predictionId);
    List<Recommendation> findByPrediction_Student_IdOrderByCreatedAtDesc(Long studentId);
}
