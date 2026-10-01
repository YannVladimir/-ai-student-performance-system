"""
Generates 10 purpose-built CSVs for manually testing the Upload Data page,
each targeting a specific scenario (happy path, risk extremes, boundary
values, bad input, duplicates, volume, optional fields). Written to
dataset/test_batches/. See the numbered guide printed at the end (and given
to the user in chat) for what to select in the UI and what to expect.

Format matches the current per-course upload (course/semester chosen via
dropdown, not CSV columns):
registration_no,sessions_attended,sessions_total,ca_score,assignment_completion,final_score
"""
import csv
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
OUT_DIR = os.path.join(DATASET_DIR, "test_batches")
os.makedirs(OUT_DIR, exist_ok=True)

FIELDS = ["registration_no", "sessions_attended", "sessions_total",
          "ca_score", "assignment_completion", "final_score"]


def read_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(name, rows):
    path = os.path.join(OUT_DIR, name)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        for r in rows:
            writer.writerow({k: r.get(k, "") for k in FIELDS})
    print(f"  {name} -- {len(rows)} rows")


students = read_csv(os.path.join(DATASET_DIR, "students.csv"))
reg = [s["registration_no"] for s in students]

# Disjoint slices of the 500-student pool so each scenario uses fresh students
pool = iter(reg)
def take(n):
    return [next(pool) for _ in range(n)]

print("Writing to", OUT_DIR)

# 1. Happy path -- naturally mixed risk levels
rows = []
pattern = [  # (attendance%, ca, assignment)
    (92, 88, 90), (45, 30, 40), (70, 60, 65), (95, 92, 96), (50, 33, 48),
    (80, 70, 75), (60, 55, 58), (88, 80, 85), (40, 28, 35), (75, 68, 70),
]
for i, r in enumerate(take(30)):
    att_pct, ca, ass = pattern[i % len(pattern)]
    rows.append({"registration_no": r, "sessions_attended": round(36 * att_pct / 100),
                 "sessions_total": 36, "ca_score": ca, "assignment_completion": ass, "final_score": ""})
write_csv("01_happy_path_mixed_risk.csv", rows)

# 2. All high risk -- poor attendance and CA score
rows = []
for r in take(15):
    rows.append({"registration_no": r, "sessions_attended": 12, "sessions_total": 36,
                 "ca_score": 25, "assignment_completion": 30, "final_score": ""})
write_csv("02_all_high_risk.csv", rows)

# 3. All low risk -- excellent across the board
rows = []
for r in take(15):
    rows.append({"registration_no": r, "sessions_attended": 35, "sessions_total": 36,
                 "ca_score": 90, "assignment_completion": 92, "final_score": ""})
write_csv("03_all_low_risk.csv", rows)

# 4. Boundary values around the hard risk cutoffs (attendance<55 or ca<35 => HIGH)
boundary_rows = [
    (0, 100, 60, 60),    # 0% attendance -- guaranteed HIGH
    (54, 100, 60, 60),   # just below the 55% attendance cutoff -- guaranteed HIGH
    (55, 100, 60, 60),   # exactly at the 55% attendance cutoff -- NOT HIGH via this rule
    (100, 100, 60, 60),  # 100% attendance
    (80, 100, 34, 60),   # just below the 35 CA cutoff -- guaranteed HIGH
    (80, 100, 35, 60),   # exactly at the 35 CA cutoff -- NOT HIGH via this rule
    (80, 100, 100, 60),  # perfect CA score
    (80, 100, 60, 0),    # 0% assignment completion
    (80, 100, 60, 100),  # 100% assignment completion
    (70, 100, 50, 50),   # mid-range, lands near the MEDIUM/HIGH composite boundary
]
rows = []
for r, (att, tot, ca, ass) in zip(take(10), boundary_rows):
    rows.append({"registration_no": r, "sessions_attended": att, "sessions_total": tot,
                 "ca_score": ca, "assignment_completion": ass, "final_score": ""})
write_csv("04_boundary_values.csv", rows)

# 5. Unknown registration numbers -- every row should fail
rows = []
for i in range(10):
    rows.append({"registration_no": f"000000000{i:04d}", "sessions_attended": 30,
                 "sessions_total": 36, "ca_score": 70, "assignment_completion": 75, "final_score": ""})
write_csv("05_invalid_registration_numbers.csv", rows)

# 6. Missing required fields -- one control row + rows missing each required column
control = take(1)[0]
missing_targets = take(4)
rows = [
    {"registration_no": control, "sessions_attended": 30, "sessions_total": 36,
     "ca_score": 70, "assignment_completion": 75, "final_score": ""},  # valid control
    {"registration_no": missing_targets[0], "sessions_attended": "", "sessions_total": 36,
     "ca_score": 70, "assignment_completion": 75, "final_score": ""},  # missing sessions_attended
    {"registration_no": missing_targets[1], "sessions_attended": 30, "sessions_total": "",
     "ca_score": 70, "assignment_completion": 75, "final_score": ""},  # missing sessions_total
    {"registration_no": missing_targets[2], "sessions_attended": 30, "sessions_total": 36,
     "ca_score": "", "assignment_completion": 75, "final_score": ""},  # missing ca_score
    {"registration_no": missing_targets[3], "sessions_attended": 30, "sessions_total": 36,
     "ca_score": 70, "assignment_completion": "", "final_score": ""},  # missing assignment_completion
]
write_csv("06_missing_required_fields.csv", rows)

# 7. Malformed / out-of-range values
targets = take(6)
rows = [
    {"registration_no": targets[0], "sessions_attended": "abc", "sessions_total": 36,
     "ca_score": 70, "assignment_completion": 75, "final_score": ""},  # non-numeric
    {"registration_no": targets[1], "sessions_attended": 40, "sessions_total": 36,
     "ca_score": 70, "assignment_completion": 75, "final_score": ""},  # attended > total
    {"registration_no": targets[2], "sessions_attended": 0, "sessions_total": 0,
     "ca_score": 70, "assignment_completion": 75, "final_score": ""},  # total = 0
    {"registration_no": targets[3], "sessions_attended": -5, "sessions_total": 36,
     "ca_score": 70, "assignment_completion": 75, "final_score": ""},  # negative attendance
    {"registration_no": targets[4], "sessions_attended": 30, "sessions_total": 36,
     "ca_score": -10, "assignment_completion": 75, "final_score": ""},  # negative CA score
    {"registration_no": targets[5], "sessions_attended": 30, "sessions_total": 36,
     "ca_score": 150, "assignment_completion": 75, "final_score": ""},  # CA score > 100 (out of range, not rejected today)
]
write_csv("07_malformed_and_out_of_range_values.csv", rows)

# 8. Duplicate rows -- same student appears twice with different values
targets = take(5)
rows = []
for r in targets:
    rows.append({"registration_no": r, "sessions_attended": 20, "sessions_total": 36,
                 "ca_score": 50, "assignment_completion": 55, "final_score": ""})
for r in targets:
    rows.append({"registration_no": r, "sessions_attended": 33, "sessions_total": 36,
                 "ca_score": 85, "assignment_completion": 88, "final_score": ""})
write_csv("08_duplicate_rows_same_file.csv", rows)

# 9. Large volume -- for pagination/stress testing (>15 rows = more than one page)
rows = []
for i, r in enumerate(take(40)):
    att = 15 + (i * 2) % 22   # spread attendance 15..36
    rows.append({"registration_no": r, "sessions_attended": att, "sessions_total": 36,
                 "ca_score": 30 + (i * 3) % 65, "assignment_completion": 25 + (i * 4) % 70, "final_score": ""})
write_csv("09_large_volume_40_students.csv", rows)

# 10. Final scores populated -- post-exam scenario
rows = []
for i, r in enumerate(take(20)):
    rows.append({"registration_no": r, "sessions_attended": 25 + i % 10, "sessions_total": 36,
                 "ca_score": 50 + i % 40, "assignment_completion": 55 + i % 35,
                 "final_score": 45 + i % 50})
write_csv("10_final_scores_post_exam.csv", rows)

print("Done.")
