"""
One-off patch applied on top of the synthetic dataset (generate_dataset.py,
random.seed(42)) to rename 8 existing synthetic accounts to specific named
demo accounts for a live presentation, and to make sure the 3 demo students
are enrolled -- with real, risk-differentiated attendance/assessment data --
in every course taught by the 3 demo lecturers, so lecturer/student/admin
dashboards aren't empty for the demo and always tell the same story:

  Gentil Cedric  (student 1) -- HIGH risk   (struggling: low attendance/scores)
  Junior Maxime  (student 2) -- MEDIUM risk (borderline)
  Yvan Tresor    (student 3) -- LOW risk    (strong performer)

This risk ordering also matches each student's pre-existing previous_gpa
(1.52 / 2.56 / 3.02), so the story is consistent everywhere a reviewer might
look, not just in the freshly-generated per-course numbers.

Also syncs dataset/upload_batches/<COURSE>_2025-Sem2.csv for the same 6
courses, inserting/overwriting each demo student's row with the SAME
risk-consistent numbers used in the seed data (final_score left blank there,
matching that file's "before finals are marked" convention) -- so live-
uploading one of those batch files during the demo shows the same story the
seeded dashboards already show.

Renames in place (keeps existing ids/FKs) rather than inserting new rows:
  user 1  (admin)      -> Alain Fabrice
  user 2  (management) -> Nteziryayo Fabrice
  user 3  (lecturer)   -> Gatete Hubert      (teaches IT101, IT301)
  user 4  (lecturer)   -> Mugabo Denys       (teaches IT205, ACC201)
  user 5  (lecturer)   -> Hakamineza Vita    (teaches IT210, BBA210)
  student 1 / user 43  -> Gentil Cedric
  student 2 / user 44  -> Junior Maxime
  student 3 / user 45  -> Yvan Tresor

Writes both dataset/*.csv (source of truth / reference copy) and
backend/src/main/resources/seed/*.csv (what DataSeeder actually loads on an
empty database) so the two stay identical, matching the existing convention.

Run once: `python scripts/apply_demo_accounts.py`. Re-running is idempotent --
it upserts by (student_id, course_id, semester) / registration_no rather than
blindly appending, so it can be safely re-run after tweaking the profile
numbers below.
"""
import csv
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGETS = [ROOT + "/dataset", ROOT + "/backend/src/main/resources/seed"]

DEMO_SEMESTER = "2025-Sem2"

USER_RENAMES = {
    1: ("Alain Fabrice", "alain.fabrice@uok.ac.rw"),
    2: ("Nteziryayo Fabrice", "nteziryayo.fabrice@uok.ac.rw"),
    3: ("Gatete Hubert", "gatete.hubert@uok.ac.rw"),
    4: ("Mugabo Denys", "mugabo.denys@uok.ac.rw"),
    5: ("Hakamineza Vita", "hakamineza.vita@uok.ac.rw"),
    43: ("Gentil Cedric", "gentil.cedric@uok.ac.rw"),
    44: ("Junior Maxime", "junior.maxime@uok.ac.rw"),
    45: ("Yvan Tresor", "yvan.tresor@uok.ac.rw"),
}
STUDENT_ID_RENAMES = {1: "Gentil Cedric", 2: "Junior Maxime", 3: "Yvan Tresor"}

# course_id -> new lecturer_user_id (the 3 demo lecturers, two courses each).
# IT301/BBA210/ACC201 already happened to have these lecturer_user_ids from
# the original random generation -- listed explicitly anyway so the mapping
# doesn't silently depend on that coincidence.
COURSE_LECTURER_REASSIGN = {1: 3, 4: 3, 2: 4, 13: 4, 3: 5, 10: 5}
COURSE_CODE_BY_ID = {1: "IT101", 2: "IT205", 3: "IT210", 4: "IT301", 10: "BBA210", 13: "ACC201"}
REG_NO_BY_STUDENT_ID = {1: "2203420870001", 2: "2203525040002", 3: "2201376530003"}

DEMO_STUDENT_IDS = [1, 2, 3]
DEMO_COURSE_IDS = [1, 2, 3, 4, 10, 13]

# Hand-picked (sessions_attended, sessions_total, ca_score, assignment_completion)
# per (student_id, course_id) -- deliberately NOT randomised. Every combination
# here clears its risk bucket's threshold with comfortable margin under both the
# thesis's rule-based labeling (generate_dataset.py's risk_from_features) and the
# backend's rule-based fallback classifier (MlClientService.fallbackPredict), so
# the risk level shown is guaranteed regardless of which one is active.
PROFILES = {
    1: {  # Gentil Cedric -- HIGH risk (previous_gpa 1.52)
        1: (16, 36, 30.0, 35.0),   # IT101
        2: (13, 30, 28.0, 38.0),   # IT205
        3: (19, 40, 33.0, 32.0),   # IT210
        4: (20, 45, 31.0, 36.0),   # IT301
        10: (14, 36, 27.0, 34.0),  # BBA210
        13: (14, 30, 29.0, 37.0),  # ACC201
    },
    2: {  # Junior Maxime -- MEDIUM risk (previous_gpa 2.56)
        1: (28, 36, 62.0, 55.0),
        2: (23, 30, 60.0, 52.0),
        3: (32, 40, 64.0, 58.0),
        4: (33, 45, 58.0, 50.0),
        10: (28, 36, 61.0, 54.0),
        13: (23, 30, 59.0, 56.0),
    },
    3: {  # Yvan Tresor -- LOW risk / very good (previous_gpa 3.02)
        1: (33, 36, 88.0, 90.0),
        2: (28, 30, 92.0, 94.0),
        3: (36, 40, 85.0, 88.0),
        4: (42, 45, 90.0, 91.0),
        10: (35, 36, 94.0, 95.0),
        13: (27, 30, 87.0, 89.0),
    },
}


def read_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader), reader.fieldnames


def write_csv(path, rows, fieldnames):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def patch_users(rows):
    emails = {r["email"] for r in rows}
    for uid, (name, email) in USER_RENAMES.items():
        current = next((r["email"] for r in rows if int(r["user_id"]) == uid), None)
        if email in emails and email != current:
            raise SystemExit(f"Email collision: {email} already used by another seeded user")
    for r in rows:
        uid = int(r["user_id"])
        if uid in USER_RENAMES:
            name, email = USER_RENAMES[uid]
            r["full_name"] = name
            r["email"] = email
    return rows


def patch_students(rows):
    for r in rows:
        sid = int(r["student_id"])
        if sid in STUDENT_ID_RENAMES:
            r["full_name"] = STUDENT_ID_RENAMES[sid]
    return rows


def patch_courses(rows):
    for r in rows:
        cid = int(r["course_id"])
        if cid in COURSE_LECTURER_REASSIGN:
            r["lecturer_user_id"] = str(COURSE_LECTURER_REASSIGN[cid])
    return rows


def final_score_for(ca_score, attendance_rate, assignment_completion):
    return round(max(0, min(100,
        0.4 * ca_score + 0.3 * attendance_rate + 0.3 * assignment_completion)), 1)


def upsert_demo_enrollments(enroll_rows, att_rows, assess_rows):
    existing_enroll = {
        (int(r["student_id"]), int(r["course_id"]), r["semester"]): r for r in enroll_rows
    }
    att_by_key = {
        (int(r["student_id"]), int(r["course_id"]), r["semester"]): r for r in att_rows
    }
    assess_by_key = {
        (int(r["student_id"]), int(r["course_id"]), r["semester"]): r for r in assess_rows
    }

    next_enroll_id = max((int(r["enrollment_id"]) for r in enroll_rows), default=0) + 1
    next_att_id = max((int(r["attendance_id"]) for r in att_rows), default=0) + 1
    next_assess_id = max((int(r["assessment_id"]) for r in assess_rows), default=0) + 1

    for student_id in DEMO_STUDENT_IDS:
        for course_id in DEMO_COURSE_IDS:
            key = (student_id, course_id, DEMO_SEMESTER)
            sessions_attended, sessions_total, ca_score, assignment_completion = PROFILES[student_id][course_id]
            attendance_rate = sessions_attended / sessions_total * 100
            final_score = final_score_for(ca_score, attendance_rate, assignment_completion)

            if key not in existing_enroll:
                enroll_rows.append({
                    "enrollment_id": str(next_enroll_id),
                    "student_id": str(student_id),
                    "course_id": str(course_id),
                    "semester": DEMO_SEMESTER,
                })
                next_enroll_id += 1

            if key in att_by_key:
                row = att_by_key[key]
                row["sessions_attended"] = str(sessions_attended)
                row["sessions_total"] = str(sessions_total)
            else:
                att_rows.append({
                    "attendance_id": str(next_att_id),
                    "student_id": str(student_id),
                    "course_id": str(course_id),
                    "semester": DEMO_SEMESTER,
                    "sessions_attended": str(sessions_attended),
                    "sessions_total": str(sessions_total),
                })
                next_att_id += 1

            if key in assess_by_key:
                row = assess_by_key[key]
                row["ca_score"] = str(ca_score)
                row["assignment_completion"] = str(assignment_completion)
                row["final_score"] = str(final_score)
            else:
                assess_rows.append({
                    "assessment_id": str(next_assess_id),
                    "student_id": str(student_id),
                    "course_id": str(course_id),
                    "semester": DEMO_SEMESTER,
                    "ca_score": str(ca_score),
                    "assignment_completion": str(assignment_completion),
                    "final_score": str(final_score),
                })
                next_assess_id += 1

    return enroll_rows, att_rows, assess_rows


def patch_ml_training(rows):
    for r in rows:
        sid = int(r["student_id"])
        if sid in STUDENT_ID_RENAMES:
            r["full_name"] = STUDENT_ID_RENAMES[sid]
    return rows


def sync_upload_batches():
    """Inserts/overwrites the 3 demo students' rows in each target course's
    upload-batch CSV (the files a lecturer live-uploads during the demo),
    using the same risk-consistent numbers as the seed data. final_score is
    left blank, matching this file's existing "before finals" convention."""
    batches_dir = os.path.join(ROOT, "dataset", "upload_batches")
    fieldnames = ["registration_no", "sessions_attended", "sessions_total",
                  "ca_score", "assignment_completion", "final_score"]

    for course_id, course_code in COURSE_CODE_BY_ID.items():
        path = os.path.join(batches_dir, f"{course_code}_{DEMO_SEMESTER}.csv")
        rows, _ = read_csv(path) if os.path.exists(path) else ([], fieldnames)
        by_reg_no = {r["registration_no"]: r for r in rows}

        for student_id in DEMO_STUDENT_IDS:
            reg_no = REG_NO_BY_STUDENT_ID[student_id]
            sessions_attended, sessions_total, ca_score, assignment_completion = PROFILES[student_id][course_id]
            new_row = {
                "registration_no": reg_no,
                "sessions_attended": str(sessions_attended),
                "sessions_total": str(sessions_total),
                "ca_score": str(ca_score),
                "assignment_completion": str(assignment_completion),
                "final_score": "",
            }
            if reg_no in by_reg_no:
                by_reg_no[reg_no].update(new_row)
            else:
                rows.append(new_row)
                by_reg_no[reg_no] = new_row

        write_csv(path, rows, fieldnames)


def main():
    users_rows, users_fields = read_csv(os.path.join(ROOT, "dataset", "users.csv"))
    students_rows, students_fields = read_csv(os.path.join(ROOT, "dataset", "students.csv"))
    courses_rows, courses_fields = read_csv(os.path.join(ROOT, "dataset", "courses.csv"))
    enroll_rows, enroll_fields = read_csv(os.path.join(ROOT, "dataset", "enrollments.csv"))
    att_rows, att_fields = read_csv(os.path.join(ROOT, "dataset", "attendance.csv"))
    assess_rows, assess_fields = read_csv(os.path.join(ROOT, "dataset", "assessments.csv"))

    users_rows = patch_users(users_rows)
    students_rows = patch_students(students_rows)
    courses_rows = patch_courses(courses_rows)
    enroll_rows, att_rows, assess_rows = upsert_demo_enrollments(enroll_rows, att_rows, assess_rows)

    for target in TARGETS:
        write_csv(os.path.join(target, "users.csv"), users_rows, users_fields)
        write_csv(os.path.join(target, "students.csv"), students_rows, students_fields)
        write_csv(os.path.join(target, "courses.csv"), courses_rows, courses_fields)
        write_csv(os.path.join(target, "enrollments.csv"), enroll_rows, enroll_fields)
        write_csv(os.path.join(target, "attendance.csv"), att_rows, att_fields)
        write_csv(os.path.join(target, "assessments.csv"), assess_rows, assess_fields)

    # ml_training_dataset.csv only exists under dataset/ (not loaded by DataSeeder)
    ml_path = os.path.join(ROOT, "dataset", "ml_training_dataset.csv")
    if os.path.exists(ml_path):
        ml_rows, ml_fields = read_csv(ml_path)
        ml_rows = patch_ml_training(ml_rows)
        write_csv(ml_path, ml_rows, ml_fields)

    sync_upload_batches()

    print("Demo accounts applied:")
    for uid, (name, email) in USER_RENAMES.items():
        print(f"  user_id={uid:<3} {name:<20} {email}")
    print("Courses reassigned:", COURSE_LECTURER_REASSIGN)
    print(f"Demo students {DEMO_STUDENT_IDS} enrolled+profiled in courses "
          f"{list(COURSE_CODE_BY_ID.values())} for semester {DEMO_SEMESTER}")
    print("Upload-batch CSVs synced:", list(COURSE_CODE_BY_ID.values()))


if __name__ == "__main__":
    main()
