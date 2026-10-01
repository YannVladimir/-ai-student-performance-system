package rw.ac.uok.aisps.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "assessments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "course_id", "semester"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false, length = 20)
    private String semester;

    @Column(name = "ca_score", precision = 5, scale = 2)
    private BigDecimal caScore;

    @Column(name = "assignment_completion", precision = 5, scale = 2)
    private BigDecimal assignmentCompletion;

    @Column(name = "final_score", precision = 5, scale = 2)
    private BigDecimal finalScore;
}
