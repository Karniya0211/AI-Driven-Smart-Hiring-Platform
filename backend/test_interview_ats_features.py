import uuid

import pytest

from app import app
from services.interview_question_service import generate_questions, generate_ai_questions


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_generate_questions_valid_role_and_no_duplicates():
    questions = generate_questions("Senior ML Engineer", "technical", 3)
    assert len(questions) == 3
    texts = [item["question_text"] for item in questions]
    assert len(texts) == len(set(texts))
    assert all(item["category"] == "technical" for item in questions)


def test_generate_questions_invalid_role_and_invalid_type():
    with pytest.raises(ValueError):
        generate_questions("Not A Real Role", "technical", 2)

    with pytest.raises(ValueError):
        generate_questions("Data Scientist", "unknown", 2)


def test_generate_questions_behavioral():
    questions = generate_questions("Data Scientist", "behavioral", 2)
    assert len(questions) == 2
    assert all(item["category"] == "behavioral" for item in questions)


def test_generate_questions_returns_mcq_format_with_exact_count():
    questions = generate_questions("Senior ML Engineer", "technical", 5)
    assert len(questions) == 5
    assert all(set(item["options"]) == {"A", "B", "C", "D"} for item in questions)
    assert all(item["correct_answer"] in {"A", "B", "C", "D"} for item in questions)


def test_generate_questions_fills_requested_count_for_small_categories():
    questions = generate_questions("Software Engineer", ["behavioral", "scenario"], 10)
    texts = [item["question_text"] for item in questions]

    assert len(questions) == 10
    assert len(texts) == len(set(texts))
    assert {item["category"] for item in questions} == {"behavioral", "scenario"}


def test_generate_ai_questions_falls_back_to_rule_bank():
    result = generate_ai_questions(
        "Senior ML Engineer",
        "technical",
        2,
        candidate_resume="Strong experience with ML workflows and deployment.",
        job_description="Build production ML systems with strong monitoring and experimentation."
    )
    assert result["provider"] in {"rule_based_question_bank", "mock_ai_provider", "llm"}
    assert len(result["questions"]) == 2


def test_ats_add_candidate_and_list_candidates(client):
    unique_email = f"ats_candidate_test_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post(
        "/api/auth/register",
        json={
            "email": unique_email,
            "password": "securepass123",
            "full_name": "ATS Recruiter",
            "role": "recruiter",
        },
    )
    assert reg.status_code in (200, 201)
    token = reg.get_json()["token"]

    candidate_payload = {
        "name": "Test Applicant",
        "email": "test.applicant@example.com",
        "job_applied": "Senior ML Engineer",
        "status": "Applied",
        "resume": "Experience in ML deployment and analytics.",
    }

    create = client.post(
        "/api/ats/add_candidate",
        json=candidate_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert create.status_code == 201, create.get_data(as_text=True)
    payload = create.get_json()
    assert payload["candidate"]["name"] == "Test Applicant"
    assert payload["candidate"]["status"] == "Applied"

    list_resp = client.get(
        "/api/ats/candidates",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_resp.status_code == 200
    data = list_resp.get_json()
    assert any(item["name"] == "Test Applicant" for item in data["candidates"])


def test_recruitment_voice_screening_workflow_is_application_scoped(client):
    suffix = uuid.uuid4().hex[:8]

    def register(name, role):
        response = client.post("/api/auth/register", json={
            "email": f"{role}_{suffix}_{name.lower()}@example.com",
            "password": "securepass123",
            "full_name": name,
            "role": role,
        })
        assert response.status_code == 201
        return response.get_json()

    recruiter = register("Workflow Recruiter", "recruiter")
    applicant = register("Voice Applicant", "candidate")
    other_candidate = register("Unapplied Candidate", "candidate")
    recruiter_headers = {"Authorization": f"Bearer {recruiter['token']}"}
    applicant_headers = {"Authorization": f"Bearer {applicant['token']}"}
    other_headers = {"Authorization": f"Bearer {other_candidate['token']}"}

    job_response = client.post("/api/jobs", headers=recruiter_headers, json={
        "title": "Python Developer",
        "company": "Workflow Test",
        "description": "Build Python APIs and reliable database services.",
        "required_skills": ["Python", "PostgreSQL"],
    })
    assert job_response.status_code == 201
    job_id = job_response.get_json()["job"]["id"]

    resume_text = "Python developer experienced with PostgreSQL APIs and automated testing."
    upload = client.post("/api/resume/upload", headers=applicant_headers, json={"text": resume_text})
    assert upload.status_code == 200

    analysis = client.post("/api/pipeline/run", headers=applicant_headers, json={
        "job_id": job_id,
        "resume_text": resume_text,
    })
    assert analysis.status_code == 200
    assert client.get(f"/api/jobs/{job_id}/match-candidates", headers=recruiter_headers).get_json()["candidates"] == []

    application_response = client.post("/api/ats/candidates", headers=applicant_headers, json={"job_id": job_id})
    assert application_response.status_code == 201
    applicant_id = applicant["user"]["id"]

    matches = client.get(f"/api/jobs/{job_id}/match-candidates", headers=recruiter_headers)
    assert matches.status_code == 200
    assert [candidate["candidate_id"] for candidate in matches.get_json()["candidates"]] == [applicant_id]
    assert matches.get_json()["candidates"][0]["match_score"] > 0
    match_report = client.get(f"/api/reports/download-pdf?job_id={job_id}&candidate_id={applicant_id}", headers=recruiter_headers)
    assert match_report.status_code == 200
    assert match_report.mimetype == "application/pdf"
    assert match_report.data.startswith(b"%PDF")
    assert client.get("/api/recruiter/analytics", headers=other_headers).status_code == 403

    question_response = client.post("/api/interviews/questions", headers=recruiter_headers, json={
        "job_role": "Python Developer",
        "categories": ["technical"],
        "count": 1,
    })
    assert question_response.status_code == 200
    question = question_response.get_json()["questions"][0]
    assert "correct_answer" not in question

    start_response = client.post("/api/interviews/sessions", headers=recruiter_headers, json={
        "candidate_id": applicant_id,
        "job_id": job_id,
        "job_role": "Python Developer",
        "questions": [question],
    })
    assert start_response.status_code == 201, start_response.get_data(as_text=True)
    session_id = start_response.get_json()["session"]["id"]
    persisted_question = start_response.get_json()["questions"][0]
    assert client.get(f"/api/interviews/sessions/{session_id}", headers=other_headers).status_code == 403

    session_for_candidate = client.get(f"/api/interviews/sessions/{session_id}", headers=applicant_headers)
    assert session_for_candidate.status_code == 200
    assert len(session_for_candidate.get_json()["session"]["questions"]) == 1

    answer_response = client.post(f"/api/interviews/sessions/{session_id}/responses", headers=applicant_headers, json={
        "question_id": persisted_question["id"],
        "question_text": persisted_question["question_text"],
        "candidate_answer": "I profile the Python endpoint, inspect database query plans, and validate the change with load tests.",
    })
    assert answer_response.status_code == 201
    assert answer_response.get_json()["session"]["status"] == "completed"
    assert answer_response.get_json()["response"]["feedback"]["score"] > 0

    report = client.get(f"/api/interviews/sessions/{session_id}/report", headers=recruiter_headers)
    assert report.status_code == 200
    assert report.mimetype == "application/pdf"
    assert report.data.startswith(b"%PDF")
    assert client.get(f"/api/interviews/sessions/{session_id}/report", headers=other_headers).status_code == 403

    status_response = client.put(f"/api/ats/candidates/{applicant_id}/status", headers=recruiter_headers, json={"status": "Selected"})
    assert status_response.status_code == 200
