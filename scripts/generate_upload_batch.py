"""
Generates one CSV per course in the format the lecturer 'Upload Data' page
expects: registration_no,sessions_attended,sessions_total,ca_score,
assignment_completion,final_score

The course and semester are no longer columns in the file -- since the
Upload Data page redesign, the lecturer picks the course and semester from
dropdowns, and this script mirrors that by writing one file per course under
dataset/upload_batches/<course_code>_<semester>.csv. Reuses the
registration_no's already seeded in the DB (dataset/students.csv) so the
upload succeeds without any backend/DB changes. final_score is left blank,
matching the app's "predict before finals are marked" workflow.
"""
import csv
import os
import random

random.seed(7)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
OUT_DIR = os.path.join(DATASET_DIR, "upload_batches")
os.makedirs(OUT_DIR, exist_ok=True)

SEMESTER = "2025-Sem2"
MIN_COURSES_PER_STUDENT = 2
MAX_COURSES_PER_STUDENT = 3


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def read_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


students = read_csv(os.path.join(DATASET_DIR, "students.csv"))
courses = read_csv(os.path.join(DATASET_DIR, "courses.csv"))
course_codes = [c["course_code"] for c in courses]

rows_by_course = {code: [] for code in course_codes}

for student in students:
    reg_no = student["registration_no"]
    prev_gpa = float(student["previous_gpa"])
    # baseline ability correlated with previous_gpa, plus noise, so risk
    # levels come out realistically mixed rather than uniform/random
    ability = clamp(prev_gpa / 4.0 + random.gauss(0, 0.12), 0.05, 0.98)

    n_courses = random.randint(MIN_COURSES_PER_STUDENT, MAX_COURSES_PER_STUDENT)
    chosen_courses = random.sample(course_codes, n_courses)

    for course_code in chosen_courses:
        sessions_total = random.choice([30, 36, 40, 45])
        attended_ratio = clamp(random.gauss(ability * 0.9 + 0.08, 0.15), 0.30, 1.0)
        sessions_attended = round(sessions_total * attended_ratio)

        ca_score = round(clamp(random.gauss(ability * 100, 12), 20, 100), 1)
        assignment_completion = round(clamp(random.gauss(ability * 100 + 5, 15), 0, 100), 1)

        rows_by_course[course_code].append({
            "registration_no": reg_no,
            "sessions_attended": sessions_attended,
            "sessions_total": sessions_total,
            "ca_score": ca_score,
            "assignment_completion": assignment_completion,
            "final_score": "",
        })

fieldnames = ["registration_no", "sessions_attended", "sessions_total",
              "ca_score", "assignment_completion", "final_score"]

total_rows = 0
for course_code, rows in rows_by_course.items():
    if not rows:
        continue
    out_path = os.path.join(OUT_DIR, f"{course_code}_{SEMESTER}.csv")
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    total_rows += len(rows)

print(f"Wrote {total_rows} rows across {len(rows_by_course)} course files to {OUT_DIR}")
print(f"When uploading, pick the matching course + semester ({SEMESTER}) in the UI.")
