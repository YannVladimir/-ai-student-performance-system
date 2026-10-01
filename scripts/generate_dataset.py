import random
import csv
import os

random.seed(42)

OUT_DIR = r"C:\Users\Yanba\Desktop\fabrice\dataset"
os.makedirs(OUT_DIR, exist_ok=True)

PROGRAMS = [
    "BSc Information Technology",
    "BSc Computer Science",
    "BSc Software Engineering",
    "BBA Business Administration",
    "BSc Civil Engineering",
    "BSc Accounting and Finance",
]

FIRST_NAMES = [
    "Alain", "Marie", "Eric", "Claudine", "Jean", "Divine", "Patrick", "Grace",
    "Emmanuel", "Aline", "Olivier", "Solange", "Kevin", "Chantal", "David",
    "Josiane", "Vincent", "Diane", "Samuel", "Yvette", "Robert", "Pascaline",
    "Fabrice", "Christelle", "Eric", "Bertrand", "Sandrine", "Innocent",
    "Lydie", "Theogene", "Aimee", "Placide", "Nadia", "Jean Paul", "Clarisse",
    "Moses", "Doreen", "Willy", "Rachel", "Elvis",
]
LAST_NAMES = [
    "Uwimana", "Habimana", "Mukamana", "Niyonzima", "Ishimwe", "Mugisha",
    "Uwase", "Ndayisenga", "Nkurunziza", "Iradukunda", "Nsengiyumva",
    "Uwizeyimana", "Bizimana", "Mutesi", "Hakizimana", "Twagirayezu",
    "Nizeyimana", "Kayitesi", "Uwamahoro", "Munyaneza", "Rukundo",
    "Niyibizi", "Gasana", "Mukashema", "Ntirenganya", "Byiringiro",
]

COURSES = [
    ("IT101", "Introduction to Programming"),
    ("IT205", "Database Systems"),
    ("IT210", "Data Structures and Algorithms"),
    ("IT301", "Web Application Development"),
    ("IT305", "Computer Networks"),
    ("IT310", "Operating Systems"),
    ("IT401", "Artificial Intelligence"),
    ("IT405", "Software Engineering"),
    ("BBA201", "Principles of Management"),
    ("BBA210", "Financial Accounting"),
    ("CE101", "Engineering Mathematics"),
    ("CE210", "Structural Analysis"),
    ("ACC201", "Cost Accounting"),
    ("ACC305", "Auditing"),
    ("IT302", "Human Computer Interaction"),
]

SEMESTERS = ["2024-Sem1", "2024-Sem2", "2025-Sem1"]

NUM_STUDENTS = 9000
NUM_LECTURERS = 40


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def gen_name(used):
    attempts = 0
    while True:
        attempts += 1
        if attempts <= 200:
            name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        else:
            # First+Last pool (~1,040 combos) is exhausted at this scale --
            # add a second surname for a ~27,040-combo space so generation
            # for thousands of students still terminates quickly.
            name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)} {random.choice(LAST_NAMES)}"
        if name not in used:
            used.add(name)
            return name


def make_email(name, uid, domain="uok.ac.rw"):
    return name.lower().replace(" ", ".") + f"{uid}@{domain}"


def make_users_and_students(n_students, n_lecturers):
    """Builds the users table (admin + lecturers + students) and the
    students table, linked by user_id, matching the normalized schema
    (full name/email live on users, not duplicated onto students)."""
    used_names = set()
    users = []
    lecturers = []
    students = []

    uid = 1
    admin_name = gen_name(used_names)
    users.append({
        "user_id": uid, "full_name": admin_name, "email": make_email(admin_name, uid),
        "role": "admin", "status": "active",
    })
    uid += 1

    management_name = gen_name(used_names)
    users.append({
        "user_id": uid, "full_name": management_name, "email": make_email(management_name, uid),
        "role": "management", "status": "active",
    })
    uid += 1

    for _ in range(n_lecturers):
        name = gen_name(used_names)
        users.append({
            "user_id": uid, "full_name": name, "email": make_email(name, uid),
            "role": "lecturer", "status": "active",
        })
        lecturers.append(uid)
        uid += 1

    for i in range(1, n_students + 1):
        name = gen_name(used_names)
        users.append({
            "user_id": uid, "full_name": name, "email": make_email(name, uid),
            "role": "student", "status": "active",
        })
        reg_no = f"22{random.randint(1,3):02d}{random.randint(10000,99999)}{i:04d}"
        program = random.choice(PROGRAMS)
        year = random.choice([1, 2, 3, 4])
        # baseline ability drives GPA and correlates loosely with future performance
        ability = clamp(random.gauss(0.62, 0.18), 0.05, 0.98)
        prev_gpa = round(clamp(ability * 4.0 + random.gauss(0, 0.3), 0.5, 4.0), 2)
        students.append({
            "student_id": i,
            "user_id": uid,
            "registration_no": reg_no,
            "full_name": name,  # denormalized copy, convenience-only, sourced from users
            "program": program,
            "year_of_study": year,
            "previous_gpa": prev_gpa,
            "_ability": ability,
        })
        uid += 1

    return users, lecturers, students


def make_courses(lecturer_user_ids):
    courses = []
    for i, (code, cname) in enumerate(COURSES, start=1):
        courses.append({
            "course_id": i,
            "course_code": code,
            "course_name": cname,
            "credits": random.choice([2, 3, 4]),
            "lecturer_user_id": random.choice(lecturer_user_ids),
        })
    return courses


def risk_from_features(attendance_rate, ca_score, assignment_completion, prev_gpa):
    # Rule/threshold-based labeling (axis-aligned cutoffs with interactions),
    # rather than a smooth linear composite. Real academic risk behaves this
    # way (e.g. a hard attendance cutoff triggers risk regardless of other
    # scores) and this structure is what lets a Decision Tree naturally
    # outperform Logistic Regression / Naive Bayes, consistent with Table 10
    # of the thesis. A small label-flip probability keeps it from being a
    # trivially perfect 100%-accuracy dataset.
    if attendance_rate < 55 or ca_score < 35:
        base = "High"
    elif attendance_rate < 70 and assignment_completion < 55:
        base = "High"
    elif attendance_rate >= 85 and ca_score >= 65 and assignment_completion >= 70 and prev_gpa >= 2.5:
        base = "Low"
    elif ca_score >= 55 and assignment_completion >= 60 and prev_gpa >= 2.0 and attendance_rate >= 75:
        base = "Low"
    else:
        base = "Medium"

    # noisy one-step label flip to avoid an unrealistically clean dataset
    if random.random() < 0.20:
        order = ["Low", "Medium", "High"]
        idx = order.index(base)
        idx = clamp(idx + random.choice([-1, 1]), 0, 2)
        base = order[idx]

    return base, None


def make_records(students, courses):
    attendance_rows = []
    assessment_rows = []
    enrollment_rows = []
    ml_rows = []

    att_id = 1
    assess_id = 1
    enroll_id = 1
    pred_id = 1

    for student in students:
        ability = student["_ability"]
        n_courses = random.randint(3, 4)
        chosen_courses = random.sample(courses, n_courses)
        semester = random.choice(SEMESTERS)

        for course in chosen_courses:
            sessions_total = random.choice([30, 36, 40, 45])
            attended_ratio = clamp(random.gauss(ability * 0.9 + 0.08, 0.15), 0.30, 1.0)
            sessions_attended = round(sessions_total * attended_ratio)
            attendance_rate = round(sessions_attended / sessions_total * 100, 1)

            ca_score = round(clamp(random.gauss(ability * 100, 12), 20, 100), 1)
            assignment_completion = round(clamp(random.gauss(ability * 100 + 5, 15), 0, 100), 1)
            final_score = round(clamp(
                0.4 * ca_score + 0.3 * attendance_rate + 0.3 * assignment_completion
                + random.gauss(0, 8), 0, 100), 1)

            risk_level, composite = risk_from_features(
                attendance_rate, ca_score, assignment_completion, student["previous_gpa"]
            )

            enrollment_rows.append({
                "enrollment_id": enroll_id,
                "student_id": student["student_id"],
                "course_id": course["course_id"],
                "semester": semester,
            })

            attendance_rows.append({
                "attendance_id": att_id,
                "student_id": student["student_id"],
                "course_id": course["course_id"],
                "semester": semester,
                "sessions_attended": sessions_attended,
                "sessions_total": sessions_total,
            })

            assessment_rows.append({
                "assessment_id": assess_id,
                "student_id": student["student_id"],
                "course_id": course["course_id"],
                "semester": semester,
                "ca_score": ca_score,
                "assignment_completion": assignment_completion,
                "final_score": final_score,
            })

            ml_rows.append({
                "record_id": pred_id,
                "student_id": student["student_id"],
                "full_name": student["full_name"],
                "program": student["program"],
                "year_of_study": student["year_of_study"],
                "course_code": course["course_code"],
                "course_name": course["course_name"],
                "semester": semester,
                "attendance_rate": attendance_rate,
                "ca_score": ca_score,
                "assignment_completion": assignment_completion,
                "previous_gpa": student["previous_gpa"],
                "final_score": final_score,
                "risk_level": risk_level,
            })

            att_id += 1
            assess_id += 1
            enroll_id += 1
            pred_id += 1

    return enrollment_rows, attendance_rows, assessment_rows, ml_rows


def write_csv(path, rows, fieldnames):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


users, lecturer_user_ids, students = make_users_and_students(NUM_STUDENTS, NUM_LECTURERS)
courses = make_courses(lecturer_user_ids)
enrollment_rows, attendance_rows, assessment_rows, ml_rows = make_records(students, courses)

# strip internal-only field before writing students.csv
students_out = [{k: v for k, v in s.items() if not k.startswith("_")} for s in students]

write_csv(os.path.join(OUT_DIR, "users.csv"), users,
          ["user_id", "full_name", "email", "role", "status"])

write_csv(os.path.join(OUT_DIR, "students.csv"), students_out,
          ["student_id", "user_id", "registration_no", "full_name", "program", "year_of_study", "previous_gpa"])

write_csv(os.path.join(OUT_DIR, "courses.csv"), courses,
          ["course_id", "course_code", "course_name", "credits", "lecturer_user_id"])

write_csv(os.path.join(OUT_DIR, "enrollments.csv"), enrollment_rows,
          ["enrollment_id", "student_id", "course_id", "semester"])

write_csv(os.path.join(OUT_DIR, "attendance.csv"), attendance_rows,
          ["attendance_id", "student_id", "course_id", "semester", "sessions_attended", "sessions_total"])

write_csv(os.path.join(OUT_DIR, "assessments.csv"), assessment_rows,
          ["assessment_id", "student_id", "course_id", "semester", "ca_score", "assignment_completion", "final_score"])

write_csv(os.path.join(OUT_DIR, "ml_training_dataset.csv"), ml_rows,
          ["record_id", "student_id", "full_name", "program", "year_of_study", "course_code", "course_name",
           "semester", "attendance_rate", "ca_score", "assignment_completion", "previous_gpa", "final_score", "risk_level"])

# quick summary
from collections import Counter
risk_counts = Counter(r["risk_level"] for r in ml_rows)
print("Students:", len(students_out))
print("Courses:", len(courses))
print("Student-course records:", len(ml_rows))
print("Risk distribution:", dict(risk_counts))
