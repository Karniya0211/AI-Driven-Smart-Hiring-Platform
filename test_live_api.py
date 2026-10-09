import requests
import uuid

def test_live_api():
    print("Testing live Flask backend on http://localhost:5000...")

    # 1. Register a fresh candidate with no initial resume
    test_id = str(uuid.uuid4())[:8]
    candidate_email = f"candidate_{test_id}@example.com"
    password = "password123"

    reg_res = requests.post("http://localhost:5000/api/auth/register", json={
        "email": candidate_email,
        "password": password,
        "full_name": f"Candidate {test_id}",
        "role": "candidate"
    })
    assert reg_res.status_code in [200, 201], f"Candidate registration failed: {reg_res.text}"
    token = reg_res.json()["token"]
    user = reg_res.json()["user"]
    print(f"[OK] Successfully registered new candidate: {user['full_name']} (Role: {user['role']})")

    # 2. Test Initial Zero State: Candidate Skill Gap, Match Score, and Moderate Match must be 0
    headers = {"Authorization": f"Bearer {token}"}
    p_initial = requests.post("http://localhost:5000/api/pipeline/run", headers=headers, json={"job_id": 1})
    assert p_initial.status_code == 200, f"Initial pipeline run failed: {p_initial.text}"
    initial_data = p_initial.json()

    initial_score = initial_data["model2"]["match_score"]
    initial_gaps = initial_data["model3"]["total_gaps"]
    initial_moderate = initial_data["model2"]["moderate_match"]
    print(f"[OK] Initial Candidate Metrics -> Skill Gap: {initial_gaps}, Moderate Match: {initial_moderate}, Match Score: {initial_score}%")
    assert initial_score == 0, f"Expected initial match score to be 0, got {initial_score}"
    assert initial_gaps == 0, f"Expected initial candidate skill gap to be 0, got {initial_gaps}"
    assert initial_moderate == 0, f"Expected initial moderate match to be 0, got {initial_moderate}"

    # 3. Test Metric Update: Provide resume input and verify metrics change
    sample_resume = (
        "Experienced Full Stack Developer with 4 years building scalable web applications. "
        "Proficient in Python, Django, React, TypeScript, Node.js, PostgreSQL, Docker, AWS, "
        "REST APIs, Git, and Agile development. Bachelor's in Computer Science."
    )
    p_updated = requests.post("http://localhost:5000/api/pipeline/run", headers=headers, json={
        "job_id": 1,
        "resume_text": sample_resume
    })
    assert p_updated.status_code == 200, f"Updated pipeline run failed: {p_updated.text}"
    updated_data = p_updated.json()
    updated_score = updated_data["model2"]["match_score"]
    updated_gaps = updated_data["model3"]["total_gaps"]
    print(f"[OK] After Resume Input -> Match Score: {updated_score}%, Gaps: {updated_gaps}, Fit Level: {updated_data['model2']['fit_level']}")
    assert updated_score > 0, "Match score should be > 0 after providing resume input"
    assert updated_gaps > 0, "Skill gaps should be evaluated after providing resume input"

    # 4. Upload Resume to Candidate Profile
    upload_res = requests.post("http://localhost:5000/api/resume/upload", headers=headers, json={
        "text": sample_resume,
        "filename": "my_uploaded_resume.txt"
    })
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    print(f"[OK] Resume uploaded and parsed for {candidate_email}")

    # 5. Candidate updates constraints and selects job #2
    constraints_update = {
        "min_match_score": 75,
        "min_experience_years": 3,
        "skill_gap_threshold": 2
    }
    c_res = requests.post("http://localhost:5000/api/user/constraints", headers=headers, json={"constraints": constraints_update})
    assert c_res.status_code == 200, f"Update constraints failed: {c_res.text}"

    state_update = {
        "has_user_input": True,
        "selected_job_id": 2
    }
    s_res = requests.post("http://localhost:5000/api/user/saved-state", headers=headers, json={"saved_state": state_update})
    assert s_res.status_code == 200, f"Update saved state failed: {s_res.text}"
    print(f"[OK] Candidate saved constraints and target job #2 to account")

    # 6. Re-Login with SAME email and verify persistent saved state is loaded
    login_res = requests.post("http://localhost:5000/api/auth/login", json={
        "email": candidate_email,
        "password": password
    })
    assert login_res.status_code == 200, f"Candidate re-login failed: {login_res.text}"
    new_token = login_res.json()["token"]
    relogin_headers = {"Authorization": f"Bearer {new_token}"}

    # Verify profile has resume and saved state
    prof_res = requests.get("http://localhost:5000/api/candidate/profile", headers=relogin_headers)
    assert prof_res.status_code == 200
    prof_data = prof_res.json()
    assert prof_data["profile"]["has_resume"] == True, "Profile should retain has_resume = True"
    assert "Python" in prof_data["resume_text"], "Resume text should be preserved across logins"

    # Verify saved state retrieved
    saved_state_res = requests.get("http://localhost:5000/api/user/saved-state", headers=relogin_headers)
    assert saved_state_res.status_code == 200
    retrieved_state = saved_state_res.json()["saved_state"]
    assert retrieved_state.get("has_user_input") == True, "Saved state should have has_user_input = True"
    assert retrieved_state.get("selected_job_id") == 2, "Saved state should retain selected_job_id = 2"

    # Verify saved constraints retrieved
    retrieved_constraints = requests.get("http://localhost:5000/api/user/constraints", headers=relogin_headers).json()["constraints"]
    assert retrieved_constraints.get("min_match_score") == 75, "Constraints should retain min_match_score = 75"
    print(f"[OK] Candidate re-login loaded saved state, resume, and constraints: {retrieved_constraints}")

    # Verify pipeline execution for saved job automatically produces non-zero results with has_user_input = True
    pipe_relogin = requests.post("http://localhost:5000/api/pipeline/run", headers=relogin_headers, json={"job_id": retrieved_state["selected_job_id"]})
    assert pipe_relogin.status_code == 200
    relogin_pipe_data = pipe_relogin.json()
    assert relogin_pipe_data.get("has_user_input") == True, "Pipeline should return has_user_input = True for returning user"
    assert relogin_pipe_data["model2"]["match_score"] > 0, "Match score should be non-zero from saved resume"
    print(f"[OK] Re-login pipeline automatic match score: {relogin_pipe_data['model2']['match_score']}% (Target Job: {relogin_pipe_data['target_job']['title']})")

    # 7. Test Recruiter Registration, Changes & Re-Login Persistence
    recruiter_email = f"recruiter_{test_id}@example.com"
    rec_reg = requests.post("http://localhost:5000/api/auth/register", json={
        "email": recruiter_email,
        "password": password,
        "full_name": f"Recruiter {test_id}",
        "role": "recruiter"
    })
    assert rec_reg.status_code in [200, 201], f"Recruiter registration failed: {rec_reg.text}"
    rec_token = rec_reg.json()["token"]
    rec_headers = {"Authorization": f"Bearer {rec_token}"}

    # Recruiter updates constraints and saved state
    requests.post("http://localhost:5000/api/user/constraints", headers=rec_headers, json={
        "constraints": {"min_candidate_score": 60, "min_years_experience": 2}
    })
    requests.post("http://localhost:5000/api/user/saved-state", headers=rec_headers, json={
        "saved_state": {"has_recruiter_input": True, "selected_job_id": 2}
    })

    # Recruiter re-login
    rec_login = requests.post("http://localhost:5000/api/auth/login", json={
        "email": recruiter_email,
        "password": password
    })
    assert rec_login.status_code == 200
    rec_new_token = rec_login.json()["token"]
    rec_new_headers = {"Authorization": f"Bearer {rec_new_token}"}

    rec_state_check = requests.get("http://localhost:5000/api/user/saved-state", headers=rec_new_headers).json()["saved_state"]
    assert rec_state_check.get("has_recruiter_input") == True, "Recruiter saved state should have has_recruiter_input = True"
    assert rec_state_check.get("selected_job_id") == 2, "Recruiter saved state should retain selected_job_id = 2"
    rec_const_check = requests.get("http://localhost:5000/api/user/constraints", headers=rec_new_headers).json()["constraints"]
    assert rec_const_check.get("min_candidate_score") == 60, "Recruiter constraints should retain min_candidate_score = 60"
    print(f"[OK] Recruiter re-login loaded saved state and constraints: {rec_const_check}")

    # 8. Test PDF Report Generation Endpoint
    pdf_res = requests.get("http://localhost:5000/api/reports/download-pdf?job_id=2")
    assert pdf_res.status_code == 200
    print(f"[OK] Downloadable PDF Report stream size: {len(pdf_res.content)} bytes")

    print("\nALL PERSISTENCE AND RE-LOGIN VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_live_api()
