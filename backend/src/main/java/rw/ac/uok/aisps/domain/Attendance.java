package rw.ac.uok.aisps.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "attendance", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "course_id", "semester"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance {

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

    @Column(name = "sessions_attended", nullable = false)
    private Integer sessionsAttended;

    @Column(name = "sessions_total", nullable = false)
    private Integer sessionsTotal;

    @Transient
    public double getAttendanceRate() {
        if (sessionsTotal == null || sessionsTotal == 0) return 0.0;
        return (sessionsAttended * 100.0) / sessionsTotal;
    }
}
