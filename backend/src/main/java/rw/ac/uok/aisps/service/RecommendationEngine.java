package rw.ac.uok.aisps.service;

import org.springframework.stereotype.Component;
import rw.ac.uok.aisps.domain.Prediction;
import rw.ac.uok.aisps.domain.Recommendation;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Translates a prediction's underlying weak features into concrete,
 * Self-Regulated-Learning-style suggestions (Thesis Ch.2, Zimmerman 2000),
 * rather than just telling the student they are "at risk".
 */
@Component
public class RecommendationEngine {

    public List<Recommendation> generate(Prediction prediction, double attendanceRate,
                                          BigDecimal caScore, BigDecimal assignmentCompletion) {
        List<Recommendation> recs = new ArrayList<>();

        if (attendanceRate < 75) {
            recs.add(build(prediction, "attendance", String.format(
                    "Your attendance is %.0f%%. Aim for at least 85%% attendance -- missed sessions are one of the " +
                            "strongest predictors of falling behind. Review notes/recordings for sessions you missed.",
                    attendanceRate)));
        }

        if (caScore != null && caScore.doubleValue() < 55) {
            recs.add(build(prediction, "continuous_assessment", String.format(
                    "Your continuous assessment average is %.1f. Revisit the topics covered in recent quizzes/tests " +
                            "and consider booking time with your lecturer or a tutor for the areas you scored lowest on.",
                    caScore.doubleValue())));
        }

        if (assignmentCompletion != null && assignmentCompletion.doubleValue() < 70) {
            recs.add(build(prediction, "assignments", String.format(
                    "You have completed %.0f%% of assignments. Submit outstanding assignments as soon as possible -- " +
                            "each one directly affects your continuous assessment score and final outcome.",
                    assignmentCompletion.doubleValue())));
        }

        if (recs.isEmpty()) {
            recs.add(build(prediction, "general",
                    "You're on track. Keep up consistent attendance, assessment performance, and assignment " +
                            "completion to stay in the low-risk category."));
        }

        return recs;
    }

    private Recommendation build(Prediction prediction, String category, String message) {
        return Recommendation.builder()
                .prediction(prediction)
                .category(category)
                .message(message)
                .build();
    }
}
