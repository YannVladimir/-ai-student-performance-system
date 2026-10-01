# AI-Based Student Performance Prediction and Improvement System

Web system for the University of Kigali that predicts student academic risk
(Low/Medium/High) from attendance, continuous assessment, and assignment data,
and turns each prediction into personalized improvement recommendations.
Built from the thesis in this repo's root `.docx` files -- see `PROJECT_PLAN.md`
for the full architecture and rationale.

- **Backend**: Spring Boot 3 (Java 21) -- `backend/`
- **ML service**: FastAPI + scikit-learn (Decision Tree / Logistic Regression / Naive Bayes) -- `ml-service/`
- **Frontend**: React 18 + TypeScript + Tailwind -- `frontend/`
- **Database**: MySQL 8
- **Sample data**: `dataset/` (500 synthetic students, 15 courses, fictional names, 3-4 courses per student)

## Run everything with Docker

Requires Docker Desktop running.

```
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- ML service: http://localhost:8000

The backend seeds the `dataset/` CSVs into MySQL automatically on first boot.

## Demo logins

Every seeded account of a given role shares one password. Four roles map to the four
stakeholders in the system's use-case diagram (Student, Lecturer, University Management,
System Admin):

| Role | Password | Example email |
|---|---|---|
| System Admin | `Admin@12345` | see `dataset/users.csv`, role=admin |
| University Management | `Management@12345` | see `dataset/users.csv`, role=management |
| Lecturer | `Lecturer@12345` | see `dataset/users.csv`, role=lecturer |
| Student | `Student@12345` | see `dataset/users.csv`, role=student |

- **Student**: views their own grades, attendance records, assignment scores, and predictions.
- **Lecturer**: views at-risk students in their own courses, uploads assessment/attendance data
  (restricted to courses they teach), tracks performance trends, and generates predictions.
- **University Management**: read-only institution-wide reports/analytics dashboard, student
  welfare monitoring (at-risk students across every course), and performance trends over time.
- **System Admin**: manages user accounts (create/activate/suspend), maintains the ML models
  (metrics + retrain), monitors system performance/uptime, and reviews the audit trail.

## Run without Docker (local dev)

**ML service**
```
cd ml-service
python -m venv .venv
./.venv/Scripts/pip install -r requirements.txt   # .venv/bin/pip on macOS/Linux
./.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

**Backend** (needs a local MySQL on 3306, db `aisps`, user/pass `aisps`/`aisps` --
or override via `DB_HOST`/`DB_USER`/`DB_PASSWORD` env vars)
```
cd backend
mvn spring-boot:run
```

**Frontend**
```
cd frontend
npm install
npm run dev
```
Opens on http://localhost:5173, proxying `/api` to `http://localhost:8080`.

## Running the automated tests

```
cd backend && mvn test                                          # 17 tests, recreates Thesis Table 11
cd ml-service && ./.venv/Scripts/python -m pytest                # 11 tests: preprocessing, accuracy guard, API contract
cd frontend && npm test                                         # component tests (Vitest + RTL)
```

## Regenerating the sample dataset

```
python scripts/generate_dataset.py   # writes into dataset/
```
Then copy the relevant files into `backend/src/main/resources/seed/` and
`ml-service/data/` if you want the running system to pick up the new data.

## Repo layout

```
fabrice/
├── dataset/            synthetic CSVs (students, courses, attendance, assessments, users)
├── backend/             Spring Boot API
├── ml-service/          FastAPI + scikit-learn prediction service
├── frontend/            React + TypeScript UI
├── docker-compose.yml
└── PROJECT_PLAN.md      full architecture/roadmap doc
```
