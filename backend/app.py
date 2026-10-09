import os
import json
import jwt
import hashlib
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import io

from database import SessionLocal, init_db
from models import User, CandidateProfile, JobPosting, Application, InterviewQuestion, InterviewSession, InterviewResponse, AtsInterview, Candidate
from nlp_pipeline.model1_extraction import model1_extractor
from nlp_pipeline.model2_matcher import model2_matcher
from nlp_pipeline.model3_recommender import model3_recommender
from services.parser_service import parse_resume_file
from services.report_service import generate_pdf_report
from services.interview_question_service import QUESTION_BANK, generate_questions, evaluate_answer
from services.interview_report_service import generate_interview_pdf
from seed_data import SAMPLE_RESUMES

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

JWT_SECRET = os.getenv("JWT_SECRET", "ai_resume_matcher_super_secret_jwt_key_2026")
JWT_ALGORITHM = "HS256"

# Ensure DB initialized on startup
init_db()

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def create_token(user: User) -> str:
    payload = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.full_name,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token is missing or invalid"}), 401
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            db = SessionLocal()
            current_user = db.query(User).filter(User.id == payload["sub"]).first()
            db.close()
            if not current_user:
                return jsonify({"error": "User not found"}), 401
            request.current_user = current_user
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except Exception:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

# ----------------- AUTH ENDPOINTS -----------------

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    role = data.get("role", "candidate").lower()

    if not email or not password or not full_name:
        return jsonify({"error": "Missing email, password, or full name"}), 400

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            return jsonify({"error": "User with this email already exists"}), 400

        user = User(
            email=email,
            password_hash=hash_pw(password),
            full_name=full_name,
            role=role if role in ["candidate", "recruiter"] else "candidate"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        if user.role == "candidate":
            profile = CandidateProfile(
                user_id=user.id,
                headline="Software Developer",
                years_experience=1.0,
                extracted_skills_json="{}"
            )
            db.add(profile)
            db.commit()

        token = create_token(user)
        return jsonify({"user": user.to_dict(), "token": token}), 201
    finally:
        db.close()

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or user.password_hash != hash_pw(password):
            return jsonify({"error": "Invalid email or password"}), 401

        token = create_token(user)
        return jsonify({"user": user.to_dict(), "token": token}), 200
    finally:
        db.close()

# ----------------- USER CONSTRAINTS ENDPOINTS -----------------

@app.route("/api/user/constraints", methods=["GET"])
@token_required
def get_user_constraints():
    """
    Initially set all constraints to 0. After login, load the user's saved constraints;
    for new users, keep them at 0.
    """
    user = request.current_user
    if user.role == "candidate":
        default_constraints = {
            "min_match_score": 0,
            "min_experience_years": 0,
            "skill_gap_threshold": 0,
            "salary_expectation_k": 0,
            "remote_preference": 0
        }
    else:
        default_constraints = {
            "min_candidate_score": 0,
            "min_years_experience": 0,
            "min_matched_skills": 0,
            "max_pool_size": 0
        }

    user_constraints = user.constraints or {}
    merged = {**default_constraints, **user_constraints}
    return jsonify({"constraints": merged, "user_id": user.id})

@app.route("/api/user/constraints", methods=["POST", "PUT"])
@token_required
def update_user_constraints():
    """
    Save any changes to the logged-in user's account and restore them on future logins.
    """
    data = request.get_json() or {}
    new_constraints = data.get("constraints", {})

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == request.current_user.id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Save to user account in database
        user.constraints = new_constraints
        db.commit()
        db.refresh(user)

        return jsonify({
            "message": "Constraints successfully saved to user account",
            "constraints": user.constraints,
            "user": user.to_dict()
        })
    finally:
        db.close()

@app.route("/api/user/saved-state", methods=["GET"])
@token_required
def get_user_saved_state():
    user = request.current_user
    return jsonify({
        "saved_state": user.saved_state or {},
        "user_id": user.id
    })

@app.route("/api/user/saved-state", methods=["POST", "PUT"])
@token_required
def update_user_saved_state():
    data = request.get_json() or {}
    new_state = data.get("saved_state", {})

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == request.current_user.id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        current = user.saved_state or {}
        current.update(new_state)
        user.saved_state = current
        db.commit()
        db.refresh(user)

        return jsonify({
            "message": "User saved state updated successfully",
            "saved_state": user.saved_state,
            "user": user.to_dict()
        })
    finally:
        db.close()

@app.route("/api/auth/me", methods=["GET"])
@token_required
def get_current_user():
    return jsonify({"user": request.current_user.to_dict()})

# ----------------- RESUME & SAMPLE RESUMES -----------------

@app.route("/api/sample-resumes", methods=["GET"])
def get_sample_resumes():
    """Returns sample pre-built resumes for quick 1-click loading."""
    samples = []
    for key, val in SAMPLE_RESUMES.items():
        samples.append({
            "id": key,
            "name": val["name"],
            "headline": val["headline"],
            "target_role": val["target_role"],
            "years_experience": val["experience"],
            "text": val["text"].strip()
        })
    return jsonify({"samples": samples})

@app.route("/api/candidate/profile", methods=["GET"])
@token_required
def get_candidate_profile():
    db = SessionLocal()
    try:
        user = request.current_user
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.id).first()
        if not profile:
            profile = CandidateProfile(user_id=user.id, headline="Software Engineer")
            db.add(profile)
            db.commit()
            db.refresh(profile)

        return jsonify({
            "user": user.to_dict(),
            "profile": profile.to_dict(),
            "resume_text": profile.raw_resume_text or ""
        })
    finally:
        db.close()

@app.route("/api/resume/upload", methods=["POST"])
@token_required
def upload_resume():
    """
    Handle resume upload (multipart PDF/DOCX or JSON text) and immediately
    run Model 1 NLP extraction.
    """
    user = request.current_user
    resume_text = ""
    filename = "resume.txt"

    if 'file' in request.files:
        file = request.files['file']
        filename = file.filename
        file_bytes = file.read()
        resume_text = parse_resume_file(filename, file_bytes)
    else:
        data = request.get_json() or {}
        resume_text = data.get("text", "")
        filename = data.get("filename", "pasted_resume.txt")

    if not resume_text.strip():
        return jsonify({"error": "No readable resume text extracted. Please ensure the PDF/DOCX has selectable text."}), 400

    # Execute Model 1: NLP Skill & Metadata Extraction
    extraction_results = model1_extractor.extract_skills(resume_text)

    db = SessionLocal()
    try:
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.id).first()
        if not profile:
            profile = CandidateProfile(user_id=user.id)
            db.add(profile)

        profile.raw_resume_text = resume_text
        profile.resume_filename = filename
        profile.extracted_skills = extraction_results
        
        # Auto-fill metadata if available
        meta = extraction_results.get("metadata", {})
        if meta.get("years_experience"):
            profile.years_experience = meta["years_experience"]
        if not profile.headline:
            profile.headline = f"Software Engineer ({profile.years_experience} yrs exp)"

        # Update user's saved_state
        user_record = db.query(User).filter(User.id == user.id).first()
        if user_record:
            u_state = user_record.saved_state or {}
            u_state["has_user_input"] = True
            user_record.saved_state = u_state

        db.commit()
        db.refresh(profile)

        return jsonify({
            "message": "Resume successfully uploaded and parsed with Model 1!",
            "filename": filename,
            "extraction": extraction_results,
            "profile": profile.to_dict()
        }), 200
    finally:
        db.close()

# ----------------- 3-MODEL AI PIPELINE -----------------

@app.route("/api/pipeline/run", methods=["POST"])
@token_required
def run_pipeline():
    """
    Execute the full 3-model AI pipeline:
    Resume Upload -> Model 1 (Extraction) -> Model 2 (Matching) -> Model 3 (Skill Gap & Recommendations).
    """
    data = request.get_json() or {}
    job_id = data.get("job_id")
    custom_resume_text = data.get("resume_text")
    user = request.current_user

    db = SessionLocal()
    try:
        # 1. Fetch Candidate Resume
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.id).first()
        raw_text = (profile.raw_resume_text if (profile and profile.raw_resume_text) else "")
        resume_text = (custom_resume_text or raw_text or "").strip()

        if not resume_text:
            # Initial state before user inputs resume: Skill Gap, Match Score, Moderate Match are all 0
            if job_id:
                job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
            else:
                job = db.query(JobPosting).first()
            return jsonify({
                "pipeline_stages": [],
                "has_user_input": False,
                "model1": {
                    "skill_count": 0,
                    "all_skills": [],
                    "categories": {},
                    "metadata": {"years_experience": 0}
                },
                "model2": {
                    "match_score": 0.0,
                    "fit_level": "No Resume Input",
                    "fit_color": "slate",
                    "semantic_similarity": 0.0,
                    "required_skill_match_pct": 0.0,
                    "preferred_skill_match_pct": 0.0,
                    "matching_required_skills": [],
                    "missing_required_skills": [],
                    "matching_preferred_skills": [],
                    "missing_preferred_skills": [],
                    "total_candidate_skills": 0,
                    "total_required_skills": len(job.required_skills) if job else 0,
                    "total_matched_skills": 0,
                    "moderate_match": 0
                },
                "model3": {
                    "total_gaps": 0,
                    "gap_analysis": [],
                    "severity_chart_data": [],
                    "grouped_chart_data": [],
                    "course_recommendations": [],
                    "career_roadmap": []
                },
                "target_job": job.to_dict() if job else None
            }), 200

        # Step 1: Model 1 - NLP Skill Extraction
        model1_result = model1_extractor.extract_skills(resume_text)
        cand_skills = model1_result["all_skills"]

        # Step 2: Fetch Target Job
        if job_id:
            job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
        else:
            job = db.query(JobPosting).first()

        if not job:
            return jsonify({"error": "No jobs available in system"}), 404

        # Step 2: Model 2 - Candidate-Job Matching (TF-IDF + Cosine Similarity)
        model2_result = model2_matcher.calculate_match(
            resume_text=resume_text,
            job_description=job.description,
            candidate_skills=cand_skills,
            required_skills=job.required_skills,
            preferred_skills=job.preferred_skills
        )

        # Step 3: Model 3 - Skill Gap Analysis, Charts, Recommendations & Career Roadmap
        model3_result = model3_recommender.analyze_gaps(
            candidate_skills=cand_skills,
            required_skills=job.required_skills,
            preferred_skills=job.preferred_skills,
            job_title=job.title
        )

        # Refresh the cached match only for jobs the candidate has applied to.
        existing_app = db.query(Application).filter(
            Application.candidate_id == user.id,
            Application.job_id == job.id
        ).first()
        if existing_app:
            existing_app.match_score = model2_result["match_score"]
            existing_app.compatibility_breakdown = model2_result

        # Save pipeline and user state to candidate profile and user account
        if profile:
            profile.saved_pipeline = {
                "target_job": job.to_dict(),
                "model1": model1_result,
                "model2": model2_result,
                "model3": model3_result
            }

        user_record = db.query(User).filter(User.id == user.id).first()
        if user_record:
            u_state = user_record.saved_state or {}
            u_state.update({
                "has_user_input": True,
                "selected_job_id": job.id,
                "last_match_score": model2_result["match_score"]
            })
            user_record.saved_state = u_state

        db.commit()

        return jsonify({
            "pipeline_stages": [
                {"stage": 1, "name": "Resume Ingestion", "status": "Completed", "summary": f"Ingested {len(resume_text.split())} words"},
                {"stage": 2, "name": "Model 1: NLP Skill Extraction", "status": "Completed", "summary": f"Extracted {len(cand_skills)} skills across 6 domains"},
                {"stage": 3, "name": "Extracted Skills Structuring", "status": "Completed", "summary": "Classified languages, frameworks, cloud, DBs"},
                {"stage": 4, "name": "Model 2: TF-IDF & Cosine Matcher", "status": "Completed", "summary": f"Calculated {model2_result['match_score']}% match vs {job.company}"},
                {"stage": 5, "name": "Match Scoring & Evaluation", "status": "Completed", "summary": f"Alignment Grade: {model2_result['fit_level']}"},
                {"stage": 6, "name": "Model 3: Skill Gap & Severity Engine", "status": "Completed", "summary": f"Identified {model3_result['total_gaps']} skill gaps"},
                {"stage": 7, "name": "Curated Course Recommendations", "status": "Completed", "summary": f"Generated {len(model3_result['course_recommendations'])} courses"},
                {"stage": 8, "name": "12-Week Career Milestone Roadmap", "status": "Completed", "summary": "Ready for PDF report generation"}
            ],
            "has_user_input": True,
            "target_job": job.to_dict(),
            "model1": model1_result,
            "model2": model2_result,
            "model3": model3_result
        })
    finally:
        db.close()

# ----------------- JOBS & CANDIDATE MATCHING -----------------

@app.route("/api/jobs", methods=["GET"])
def get_jobs():
    db = SessionLocal()
    try:
        jobs = db.query(JobPosting).filter(JobPosting.status == "active").all()
        return jsonify({"jobs": [j.to_dict() for j in jobs]})
    finally:
        db.close()

@app.route("/api/jobs/<int:job_id>", methods=["GET"])
def get_job_detail(job_id):
    db = SessionLocal()
    try:
        job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
        if not job:
            return jsonify({"error": "Job not found"}), 404
        return jsonify({"job": job.to_dict()})
    finally:
        db.close()

@app.route("/api/jobs", methods=["POST"])
@token_required
def create_job():
    user = request.current_user
    if user.role != "recruiter":
        return jsonify({"error": "Only recruiters can post new jobs"}), 403

    data = request.get_json() or {}
    title = data.get("title", "").strip()
    company = data.get("company", "").strip()
    location = data.get("location", "Remote")
    description = data.get("description", "").strip()
    required_skills = data.get("required_skills", [])
    preferred_skills = data.get("preferred_skills", [])
    experience_level = data.get("experience_level", "Mid-Senior")
    salary_range = data.get("salary_range", "$120,000 - $160,000")

    if not title or not company or not description:
        return jsonify({"error": "Title, company, and description are required"}), 400

    # Auto-extract skills if none provided explicitly
    if not required_skills:
        extracted = model1_extractor.extract_skills(description)
        required_skills = extracted["all_skills"][:6]
        preferred_skills = extracted["all_skills"][6:10]

    db = SessionLocal()
    try:
        job = JobPosting(
            recruiter_id=user.id,
            title=title,
            company=company,
            location=location,
            experience_level=experience_level,
            salary_range=salary_range,
            description=description
        )
        job.required_skills = required_skills
        job.preferred_skills = preferred_skills
        db.add(job)
        db.commit()
        db.refresh(job)

        return jsonify({"message": "Job posted successfully", "job": job.to_dict()}), 201
    finally:
        db.close()

@app.route("/api/jobs/<int:job_id>/match-candidates", methods=["GET"])
@token_required
def match_candidates_for_job(job_id):
    """
    Recruiter Dashboard: Rank all applicants for a given job using Model 2 match scores.
    """
    db = SessionLocal()
    try:
        job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
        if not job:
            return jsonify({"error": "Job not found"}), 404
        if request.current_user.role != "recruiter" or job.recruiter_id != request.current_user.id:
            return jsonify({"error": "Recruiter authorization required"}), 403

        ranked_candidates = []
        applications = db.query(Application).filter(Application.job_id == job.id).all()
        for app_record in applications:
            cand = db.query(User).filter(User.id == app_record.candidate_id, User.role == "candidate").first()
            if not cand:
                continue
            profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == cand.id).first()
            resume_text = profile.raw_resume_text if profile else ""
            extracted_skills = profile.extracted_skills.get("all_skills", []) if profile else []

            if app_record and app_record.compatibility_breakdown:
                m2_res = app_record.compatibility_breakdown
                score = app_record.match_score
            else:
                m2_res = model2_matcher.calculate_match(
                    resume_text=resume_text,
                    job_description=job.description,
                    candidate_skills=extracted_skills,
                    required_skills=job.required_skills,
                    preferred_skills=job.preferred_skills
                )
                score = m2_res["match_score"]
                app_record.match_score = score
                app_record.compatibility_breakdown = m2_res

            latest_session = db.query(InterviewSession).filter(
                InterviewSession.candidate_id == cand.id,
                InterviewSession.job_id == job.id,
            ).order_by(InterviewSession.started_at.desc()).first()
            interview_responses = db.query(InterviewResponse).filter(InterviewResponse.session_id == latest_session.id).all() if latest_session else []
            interview_scores = [response.feedback.get("score", 0) for response in interview_responses if response.feedback]
            gap_analysis = model3_recommender.analyze_gaps(
                candidate_skills=extracted_skills,
                required_skills=job.required_skills,
                preferred_skills=job.preferred_skills,
                job_title=job.title,
            )

            ranked_candidates.append({
                "candidate_id": cand.id,
                "candidate_name": cand.full_name,
                "candidate_email": cand.email,
                "headline": profile.headline if profile else "Software Developer",
                "years_experience": profile.years_experience if profile else 0,
                "match_score": score,
                "fit_level": m2_res.get("fit_level", "Moderate Match"),
                "fit_color": m2_res.get("fit_color", "blue"),
                "semantic_similarity": m2_res.get("semantic_similarity", 0),
                "matching_required_skills": m2_res.get("matching_required_skills", []),
                "missing_required_skills": m2_res.get("missing_required_skills", []),
                "extracted_skills": extracted_skills,
                "resume_text": resume_text,
                "education": (profile.extracted_skills.get("metadata", {}) or {}).get("education", []) if profile else [],
                "certifications": (profile.extracted_skills.get("metadata", {}) or {}).get("certifications", []) if profile else [],
                "projects": (profile.extracted_skills.get("metadata", {}) or {}).get("projects", []) if profile else [],
                "application_id": app_record.id,
                "job_id": job.id,
                "job_applied": job.title,
                "status": app_record.status,
                "interview_session_id": latest_session.id if latest_session else None,
                "interview_status": latest_session.status if latest_session else None,
                "interview_score": round(sum(interview_scores) / len(interview_scores), 1) if interview_scores else None,
                "skill_gap_analysis": gap_analysis,
            })

        db.commit()
        # Sort highest match score first
        ranked_candidates.sort(key=lambda x: x["match_score"], reverse=True)

        return jsonify({
            "job": job.to_dict(),
            "candidates": ranked_candidates,
            "total_candidates": len(ranked_candidates)
        })
    finally:
        db.close()

# ----------------- RECRUITER ANALYTICS -----------------

@app.route("/api/recruiter/analytics", methods=["GET"])
@token_required
def get_recruiter_analytics():
    """
    Aggregated skill distribution, top in-demand skills, and candidate pool statistics.
    """
    db = SessionLocal()
    try:
        if request.current_user.role != "recruiter":
            return jsonify({"error": "Recruiter authorization required"}), 403
        jobs = db.query(JobPosting).filter(JobPosting.recruiter_id == request.current_user.id).all()
        job_ids = [job.id for job in jobs]
        applications = db.query(Application).filter(Application.job_id.in_(job_ids)).all() if job_ids else []
        candidate_ids = list({application.candidate_id for application in applications})
        profiles = db.query(CandidateProfile).filter(CandidateProfile.user_id.in_(candidate_ids)).all() if candidate_ids else []
        sessions = db.query(InterviewSession).filter(InterviewSession.job_id.in_(job_ids)).all() if job_ids else []

        # Aggregate skill occurrences across candidates
        skill_counts = {}
        for p in profiles:
            for s in p.extracted_skills.get("all_skills", []):
                skill_counts[s] = skill_counts.get(s, 0) + 1

        top_candidate_skills = sorted(
            [{"skill": k, "count": v} for k, v in skill_counts.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:10]

        # Aggregate demand across jobs owned by this recruiter
        job_demand_counts = {}
        for j in jobs:
            for s in j.required_skills:
                job_demand_counts[s] = job_demand_counts.get(s, 0) + 1

        top_demanded_skills = sorted(
            [{"skill": k, "demand": v} for k, v in job_demand_counts.items()],
            key=lambda x: x["demand"],
            reverse=True
        )[:10]

        avg_match = 0.0
        if applications:
            avg_match = round(sum(a.match_score for a in applications) / len(applications), 1)

        status_counts = {}
        for application in applications:
            status = application.status or "Applied"
            status_counts[status] = status_counts.get(status, 0) + 1

        skill_gap_counts = {"High": 0, "Medium": 0, "Low": 0}
        matching_distribution = []
        for application in applications:
            matching_distribution.append({"candidate_id": application.candidate_id, "score": application.match_score or 0})
            job = next((item for item in jobs if item.id == application.job_id), None)
            profile = next((item for item in profiles if item.user_id == application.candidate_id), None)
            if not job or not profile:
                continue
            gap_result = model3_recommender.analyze_gaps(
                candidate_skills=profile.extracted_skills.get("all_skills", []),
                required_skills=job.required_skills,
                preferred_skills=job.preferred_skills,
                job_title=job.title,
            )
            for gap in gap_result.get("severity_chart_data", []):
                severity = gap.get("severity", 0)
                level = "High" if severity >= 70 else "Medium" if severity >= 45 else "Low"
                skill_gap_counts[level] += 1

        funnel = [
            {"stage": "Applied", "count": sum(1 for item in applications if item.status in {"Applied", "applied"})},
            {"stage": "Screening", "count": sum(1 for item in applications if item.status in {"Screening", "Under Review", "Shortlisted"})},
            {"stage": "Interview", "count": sum(1 for item in applications if item.status in {"Interview", "Interview Scheduled", "Interview In Progress", "Interview Completed"})},
            {"stage": "Selected", "count": sum(1 for item in applications if item.status == "Selected")},
        ]

        return jsonify({
            "total_jobs": len(jobs),
            "total_candidates": len(candidate_ids),
            "total_applications": len(applications),
            "candidates_screened": sum(1 for item in applications if item.status in {"Screening", "Under Review", "Shortlisted", "Interview", "Interview Scheduled", "Interview In Progress", "Interview Completed", "Selected", "Rejected"}),
            "candidates_shortlisted": sum(1 for item in applications if item.status in {"Shortlisted", "Interview", "Interview Scheduled", "Interview In Progress", "Interview Completed", "Selected"}),
            "interviews_scheduled": sum(1 for item in sessions if item.status in {"scheduled", "in_progress"}),
            "interviews_completed": sum(1 for item in sessions if item.status == "completed"),
            "selected_candidates": sum(1 for item in applications if item.status == "Selected"),
            "rejected_candidates": sum(1 for item in applications if item.status == "Rejected"),
            "average_match_score": avg_match,
            "top_candidate_skills": top_candidate_skills,
            "top_demanded_skills": top_demanded_skills,
            "skill_gap_severity": skill_gap_counts,
            "matching_distribution": matching_distribution,
            "recruitment_funnel": funnel,
        })
    finally:
        db.close()

# ----------------- INTERVIEW ASSISTANCE & INTERNAL ATS -----------------

INTERVIEW_STATUSES = {"Applied", "Screening", "Under Review", "Shortlisted", "Interview Scheduled", "Interview", "Interview In Progress", "Interview Completed", "Selected", "Rejected"}


def public_interview_question(question):
    return {
        "id": question.id,
        "job_role": question.job_role,
        "category": question.category,
        "question_text": question.question_text,
    }


def recruiter_owns_job(db, user, job_id):
    return user.role == "recruiter" and db.query(JobPosting).filter(JobPosting.id == job_id, JobPosting.recruiter_id == user.id).first()


@app.route("/api/interview/questions", methods=["GET", "POST"])
@app.route("/api/interviews/questions", methods=["GET", "POST"])
@token_required
def interview_questions():
    data = request.get_json(silent=True) or {}
    role = data.get("job_role") or request.args.get("job_role")
    categories = data.get("categories") or request.args.getlist("category")
    try:
        count = int(data.get("count") or data.get("num_questions") or request.args.get("count") or request.args.get("num_questions", 5))
    except (TypeError, ValueError):
        return jsonify({"error": "Question count must be an integer from 1 to 20"}), 400
    if request.method == "GET" and not role:
        return jsonify({"roles": list(QUESTION_BANK), "categories": ["technical", "behavioral", "scenario", "hr"]})
    if not role:
        return jsonify({"error": "Job role is required"}), 400
    if not categories:
        categories = ["technical"]
    if isinstance(categories, str):
        categories = [categories]
    try:
        questions = generate_questions(role, categories, count)
    except (ValueError, TypeError):
        return jsonify({"error": "Choose a supported role, at least one category, and a question count from 1 to 20"}), 400
    return jsonify({
        "provider": "rule_based_question_bank",
        "llm_configured": False,
        "questions": [{"job_role": item["job_role"], "category": item["category"], "question_text": item["question_text"]} for item in questions],
    })


@app.route("/api/interview/start", methods=["POST"])
@app.route("/api/interviews/sessions", methods=["POST", "GET"])
@token_required
def interview_sessions():
    db = SessionLocal()
    try:
        if request.method == "GET":
            if request.current_user.role == "candidate":
                sessions = db.query(InterviewSession).filter(InterviewSession.candidate_id == request.current_user.id).order_by(InterviewSession.started_at.desc()).all()
            else:
                owned_job_ids = [job.id for job in db.query(JobPosting).filter(JobPosting.recruiter_id == request.current_user.id).all()]
                sessions = db.query(InterviewSession).filter(InterviewSession.job_id.in_(owned_job_ids)).order_by(InterviewSession.started_at.desc()).all() if owned_job_ids else []
            session_data = []
            for session in sessions:
                questions_by_id = {item.id: item for item in db.query(InterviewQuestion).filter(InterviewQuestion.id.in_(session.question_ids)).all()} if session.question_ids else {}
                questions = [public_interview_question(questions_by_id[item_id]) for item_id in session.question_ids if item_id in questions_by_id]
                candidate = db.query(User).filter(User.id == session.candidate_id).first()
                responses = db.query(InterviewResponse).filter(InterviewResponse.session_id == session.id).order_by(InterviewResponse.id).all()
                session_data.append(session.to_dict(responses, questions, candidate.full_name if candidate else None))
            return jsonify({"sessions": session_data})

        data = request.get_json() or {}
        role = data.get("job_role") or data.get("jobRole") or "Software Engineer"
        if role not in QUESTION_BANK:
            return jsonify({"error": "Choose a supported interview role"}), 400
        candidate_id = request.current_user.id
        application = None
        job_id = data.get("job_id")
        if request.current_user.role == "recruiter":
            candidate_id = data.get("candidate_id")
            if not candidate_id or not job_id or not recruiter_owns_job(db, request.current_user, job_id):
                return jsonify({"error": "Select an applicant and a job posting you own"}), 400
            application = db.query(Application).filter(Application.candidate_id == candidate_id, Application.job_id == job_id).first()
            if not application:
                return jsonify({"error": "Candidate application not found for this job"}), 404
            if not db.query(User).filter(User.id == candidate_id, User.role == "candidate").first():
                return jsonify({"error": "Candidate not found"}), 404
        elif request.current_user.role != "candidate":
            return jsonify({"error": "Candidate or recruiter access is required"}), 403

        question_payload = data.get("questions", [])
        if not question_payload:
            question_payload = data.get("question_set", [])
        if not question_payload:
            try:
                q_type = data.get("question_type", "technical")
                count = int(data.get("num_questions") or data.get("count") or 3)
                question_payload = generate_questions(role, q_type, count)
            except ValueError as exc:
                return jsonify({"error": str(exc)}), 400
        if not question_payload or role not in QUESTION_BANK:
            return jsonify({"error": "A supported job role and generated questions are required"}), 400
        if job_id and not db.query(JobPosting).filter(JobPosting.id == job_id).first():
            return jsonify({"error": "Job not found"}), 404
        interview_type = data.get("interview_type", "practice")
        if interview_type not in {"practice", "voice"}:
            return jsonify({"error": "Interview type must be practice or voice"}), 400
        session = InterviewSession(candidate_id=candidate_id, job_id=job_id, job_role=role, total_questions=len(question_payload), interview_type=interview_type)
        db.add(session)
        db.flush()
        questions = []
        for item in question_payload:
            text = (item.get("question_text") if isinstance(item, dict) else str(item)).strip()
            if not text or text in {question.question_text for question in questions}:
                continue
            question = db.query(InterviewQuestion).filter(InterviewQuestion.job_role == role, InterviewQuestion.question_text == text).first()
            if not question:
                question = InterviewQuestion(
                    job_role=role,
                    category=item.get("category", "technical") if isinstance(item, dict) else "technical",
                    question_text=text,
                    correct_answer=(item.get("correct_answer") if isinstance(item, dict) else "B")
                )
                if isinstance(item, dict):
                    question.options = item.get("options") or {"A": "A", "B": "B", "C": "C", "D": "D"}
                db.add(question)
                db.flush()
            elif isinstance(item, dict):
                question.options = item.get("options") or question.options
                if item.get("correct_answer"):
                    question.correct_answer = item.get("correct_answer")
            questions.append(question)
        session.total_questions = len(questions)
        session.question_ids = [question.id for question in questions]
        if application:
            application.status = "Interview In Progress"
            ats_interview = db.query(AtsInterview).filter(AtsInterview.application_id == application.id).order_by(AtsInterview.created_at.desc()).first()
            if not ats_interview:
                ats_interview = AtsInterview(application_id=application.id)
                db.add(ats_interview)
            ats_interview.status = "in_progress"
            ats_interview.session_id = session.id
        db.commit()
        return jsonify({"session": session.to_dict(questions=[public_interview_question(question) for question in questions]), "questions": [public_interview_question(question) for question in questions]}), 201
    finally:
        db.close()

@app.route("/api/interview/<int:session_id>/answer", methods=["POST"])
@app.route("/api/interviews/sessions/<int:session_id>/responses", methods=["POST"])
@token_required
def submit_interview_response(session_id):
    db = SessionLocal()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not session:
            return jsonify({"error": "Interview session not found"}), 404
        if request.current_user.role == "candidate" and session.candidate_id != request.current_user.id:
            return jsonify({"error": "You can only access your own interview"}), 403
        if request.current_user.role == "recruiter" and not recruiter_owns_job(db, request.current_user, session.job_id):
            return jsonify({"error": "Recruiter authorization required"}), 403
        data = request.get_json() or {}
        answer = (data.get("candidate_answer") or "").strip()
        question_text = (data.get("question_text") or "").strip()
        if not answer or not question_text:
            return jsonify({"error": "Question and candidate answer are required"}), 400
        question_id = data.get("question_id")
        if question_id and int(question_id) not in session.question_ids:
            return jsonify({"error": "Question does not belong to this interview"}), 400
        question = db.query(InterviewQuestion).filter(InterviewQuestion.id == question_id).first() if question_id else None
        response = db.query(InterviewResponse).filter(InterviewResponse.session_id == session.id, InterviewResponse.question_id == question_id).first() if question_id else None
        if not response:
            response = InterviewResponse(session_id=session.id, question_id=question_id, question_text=question_text, candidate_answer=answer)
            db.add(response)
        else:
            response.candidate_answer = answer

        response.feedback = evaluate_answer(question_text, answer)

        submitted_count = db.query(InterviewResponse).filter(InterviewResponse.session_id == session.id).count()
        if submitted_count + (0 if response.id else 1) >= session.total_questions:
            session.status = "completed"
            session.completed_at = datetime.utcnow()
            if session.job_id:
                application = db.query(Application).filter(Application.candidate_id == session.candidate_id, Application.job_id == session.job_id).first()
                if application:
                    application.status = "Interview Completed"
                    ats_interview = db.query(AtsInterview).filter(AtsInterview.application_id == application.id, AtsInterview.session_id == session.id).first()
                    if ats_interview:
                        ats_interview.status = "completed"
        db.commit()
        return jsonify({"response": response.to_dict(), "session": session.to_dict()}), 201
    finally:
        db.close()

@app.route("/api/interview/<int:session_id>", methods=["GET"])
@app.route("/api/interviews/sessions/<int:session_id>", methods=["GET"])
@token_required
def get_interview_session(session_id):
    db = SessionLocal()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not session:
            return jsonify({"error": "Interview session not found"}), 404
        if request.current_user.role == "candidate" and session.candidate_id != request.current_user.id:
            return jsonify({"error": "You can only access your own interview"}), 403
        if request.current_user.role == "recruiter" and not recruiter_owns_job(db, request.current_user, session.job_id):
            return jsonify({"error": "Recruiter authorization required"}), 403
        responses = db.query(InterviewResponse).filter(InterviewResponse.session_id == session.id).all()
        questions_by_id = {item.id: item for item in db.query(InterviewQuestion).filter(InterviewQuestion.id.in_(session.question_ids)).all()} if session.question_ids else {}
        questions = [public_interview_question(questions_by_id[item_id]) for item_id in session.question_ids if item_id in questions_by_id]
        candidate = db.query(User).filter(User.id == session.candidate_id).first()
        return jsonify({"session": session.to_dict(responses, questions, candidate.full_name if candidate else None)})
    finally:
        db.close()

@app.route("/api/ats/add_candidate", methods=["POST"])
@app.route("/api/ats/candidates", methods=["POST", "GET"])
@token_required
def ats_candidates():
    db = SessionLocal()
    try:
        if request.method == "POST":
            data = request.get_json() or {}
            if "name" in data and "email" in data and "job_applied" in data:
                if request.current_user.role != "recruiter":
                    return jsonify({"error": "Recruiter authorization required to manage ATS candidate records"}), 403
                candidate = Candidate(
                    name=data["name"].strip(),
                    email=data["email"].strip().lower(),
                    recruiter_id=request.current_user.id,
                    job_applied=data["job_applied"].strip(),
                    status=data.get("status", "Applied"),
                    resume=data.get("resume", "")
                )
                if not candidate.name or not candidate.email or not candidate.job_applied:
                    return jsonify({"error": "Name, email, and job_applied are required"}), 400
                if candidate.status not in {"Applied", "Screening", "Interview", "Selected", "Rejected"}:
                    return jsonify({"error": "Invalid candidate status"}), 400
                db.add(candidate)
                db.commit()
                db.refresh(candidate)
                return jsonify({"message": "Candidate added successfully", "candidate": candidate.to_dict()}), 201

            if request.current_user.role != "candidate":
                return jsonify({"error": "Only candidates can submit applications"}), 403
            job_id = data.get("job_id")
            job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
            if not job:
                return jsonify({"error": "Job not found"}), 404
            existing = db.query(Application).filter(Application.candidate_id == request.current_user.id, Application.job_id == job_id).first()
            if existing:
                return jsonify({"error": "You have already applied to this job", "application": existing.to_dict()}), 409
            application = Application(candidate_id=request.current_user.id, job_id=job_id, status="Applied")
            db.add(application)
            db.commit()
            db.refresh(application)
            return jsonify({"application": application.to_dict()}), 201

        if request.current_user.role == "recruiter":
            job_ids = [job.id for job in db.query(JobPosting).filter(JobPosting.recruiter_id == request.current_user.id).all()]
            applications = db.query(Application).filter(Application.job_id.in_(job_ids)).all() if job_ids else []
        else:
            applications = db.query(Application).filter(Application.candidate_id == request.current_user.id).all()
        if request.current_user.role == "recruiter":
            candidate_records = db.query(Candidate).filter(Candidate.recruiter_id == request.current_user.id).order_by(Candidate.created_at.desc()).all()
        else:
            candidate_records = db.query(Candidate).filter(Candidate.email == request.current_user.email.lower()).order_by(Candidate.created_at.desc()).all()
        return jsonify({"applications": [application.to_dict() for application in applications], "candidates": [candidate.to_dict() for candidate in candidate_records]})
    finally:
        db.close()

@app.route("/api/ats/candidates/<int:candidate_id>", methods=["GET", "PUT", "DELETE"])
@token_required
def ats_candidate_detail(candidate_id):
    db = SessionLocal()
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            return jsonify({"error": "Candidate not found"}), 404
        if request.current_user.role == "recruiter" and candidate.recruiter_id != request.current_user.id:
            return jsonify({"error": "Recruiter authorization required"}), 403
        if request.current_user.role != "recruiter" and candidate.email.lower() != (request.current_user.email or "").lower():
            return jsonify({"error": "You are not authorized to access this candidate"}), 403

        if request.method == "GET":
            return jsonify({"candidate": candidate.to_dict()})

        if request.method == "PUT":
            data = request.get_json() or {}
            for key in ["name", "email", "job_applied", "status", "resume"]:
                if key in data:
                    value = data[key]
                    if key in {"name", "job_applied"}:
                        value = (value or "").strip()
                    if key == "email":
                        value = (value or "").strip().lower()
                    if key == "status":
                        if value not in {"Applied", "Screening", "Interview", "Selected", "Rejected"}:
                            return jsonify({"error": "Invalid candidate status"}), 400
                    setattr(candidate, key, value)
            db.commit(); db.refresh(candidate)
            return jsonify({"message": "Candidate updated successfully", "candidate": candidate.to_dict()})

        db.delete(candidate)
        db.commit()
        return jsonify({"message": "Candidate deleted successfully", "candidate_id": candidate.id})
    finally:
        db.close()

@app.route("/api/ats/candidates/<int:candidate_id>/status", methods=["PUT"])
@token_required
def update_ats_candidate_status(candidate_id):
    if request.current_user.role != "recruiter":
        return jsonify({"error": "Recruiter authorization required"}), 403
    data = request.get_json() or {}
    status = data.get("status")
    if status not in INTERVIEW_STATUSES:
        return jsonify({"error": "Invalid ATS status"}), 400
    db = SessionLocal()
    try:
        applications = db.query(Application).join(JobPosting, Application.job_id == JobPosting.id).filter(Application.candidate_id == candidate_id, JobPosting.recruiter_id == request.current_user.id).all()
        if not applications:
            return jsonify({"error": "Candidate application not found"}), 404
        for application in applications:
            application.status = status
        db.commit()
        return jsonify({"applications": [application.to_dict() for application in applications]})
    finally:
        db.close()

@app.route("/api/ats/jobs/<int:job_id>/candidates", methods=["GET"])
@token_required
def get_ats_job_candidates(job_id):
    db = SessionLocal()
    try:
        if not recruiter_owns_job(db, request.current_user, job_id):
            return jsonify({"error": "Recruiter authorization required"}), 403
        applications = db.query(Application).filter(Application.job_id == job_id).all()
        return jsonify({"applications": [application.to_dict() for application in applications]})
    finally:
        db.close()

@app.route("/api/ats/interviews", methods=["POST", "GET"])
@token_required
def ats_interviews():
    db = SessionLocal()
    try:
        if request.method == "POST":
            if request.current_user.role != "recruiter":
                return jsonify({"error": "Recruiter authorization required"}), 403
            data = request.get_json() or {}
            application = db.query(Application).join(JobPosting, Application.job_id == JobPosting.id).filter(Application.id == data.get("application_id"), JobPosting.recruiter_id == request.current_user.id).first()
            if not application:
                return jsonify({"error": "Application not found"}), 404
            scheduled_at = None
            if data.get("scheduled_at"):
                scheduled_at = datetime.fromisoformat(data["scheduled_at"].replace("Z", "+00:00")).replace(tzinfo=None)
            interview = AtsInterview(application_id=application.id, scheduled_at=scheduled_at, status="scheduled")
            application.status = "Interview Scheduled"
            db.add(interview)
            db.commit()
            db.refresh(interview)
            return jsonify({"interview": interview.to_dict()}), 201
        if request.current_user.role == "recruiter":
            job_ids = [job.id for job in db.query(JobPosting).filter(JobPosting.recruiter_id == request.current_user.id).all()]
            application_ids = [item.id for item in db.query(Application).filter(Application.job_id.in_(job_ids)).all()] if job_ids else []
            interviews = db.query(AtsInterview).filter(AtsInterview.application_id.in_(application_ids)).all() if application_ids else []
        else:
            application_ids = [item.id for item in db.query(Application).filter(Application.candidate_id == request.current_user.id).all()]
            interviews = db.query(AtsInterview).filter(AtsInterview.application_id.in_(application_ids)).all() if application_ids else []
        return jsonify({"interviews": [interview.to_dict() for interview in interviews]})
    finally:
        db.close()

@app.route("/api/ats/interviews/<int:interview_id>", methods=["GET"])
@token_required
def get_ats_interview(interview_id):
    db = SessionLocal()
    try:
        interview = db.query(AtsInterview).filter(AtsInterview.id == interview_id).first()
        if not interview:
            return jsonify({"error": "Interview not found"}), 404
        application = db.query(Application).filter(Application.id == interview.application_id).first()
        job = db.query(JobPosting).filter(JobPosting.id == application.job_id).first()
        if request.current_user.role == "candidate" and application.candidate_id != request.current_user.id:
            return jsonify({"error": "You can only access your own interview"}), 403
        if request.current_user.role == "recruiter" and job.recruiter_id != request.current_user.id:
            return jsonify({"error": "Recruiter authorization required"}), 403
        return jsonify({"interview": interview.to_dict(), "application": application.to_dict()})
    finally:
        db.close()

@app.route("/api/ats/interviews/<int:interview_id>/status", methods=["PUT"])
@token_required
def update_ats_interview_status(interview_id):
    if request.current_user.role != "recruiter":
        return jsonify({"error": "Recruiter authorization required"}), 403
    db = SessionLocal()
    try:
        interview = db.query(AtsInterview).filter(AtsInterview.id == interview_id).first()
        application = db.query(Application).filter(Application.id == interview.application_id).first() if interview else None
        job = db.query(JobPosting).filter(JobPosting.id == application.job_id).first() if application else None
        if not interview or not job or job.recruiter_id != request.current_user.id:
            return jsonify({"error": "Interview not found"}), 404
        status = (request.get_json() or {}).get("status")
        if status not in {"scheduled", "in_progress", "completed", "cancelled"}:
            return jsonify({"error": "Invalid interview status"}), 400
        interview.status = status
        db.commit()
        return jsonify({"interview": interview.to_dict()})
    finally:
        db.close()

@app.route("/api/interview/generate-ai", methods=["POST"])
@token_required
def generate_ai_interview_questions():
    data = request.get_json() or {}
    role = data.get("job_role")
    question_type = data.get("question_type", "technical")
    num_questions = int(data.get("num_questions", data.get("count", 3)))
    candidate_resume = data.get("candidate_resume")
    job_description = data.get("job_description")
    if not role:
        return jsonify({"error": "Job role is required"}), 400
    try:
        result = generate_ai_questions(role, question_type, num_questions, candidate_resume, job_description)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(result)


@app.route("/api/interview/<int:session_id>/complete", methods=["POST"])
@token_required
def complete_interview_session(session_id):
    db = SessionLocal()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not session:
            return jsonify({"error": "Interview session not found"}), 404
        if request.current_user.role == "candidate" and session.candidate_id != request.current_user.id:
            return jsonify({"error": "You can only complete your own interview"}), 403
        if request.current_user.role == "recruiter" and not recruiter_owns_job(db, request.current_user, session.job_id):
            return jsonify({"error": "Recruiter authorization required"}), 403
        response_count = db.query(InterviewResponse).filter(InterviewResponse.session_id == session.id).count()
        if response_count < session.total_questions:
            return jsonify({"error": "Submit every answer before completing the interview"}), 400
        session.status = "completed"
        session.completed_at = session.completed_at or datetime.utcnow()
        if session.job_id:
            application = db.query(Application).filter(Application.candidate_id == session.candidate_id, Application.job_id == session.job_id).first()
            if application:
                application.status = "Interview Completed"
                ats_interview = db.query(AtsInterview).filter(AtsInterview.application_id == application.id, AtsInterview.session_id == session.id).first()
                if ats_interview:
                    ats_interview.status = "completed"
        db.commit()
        return jsonify({"session": session.to_dict()})
    finally:
        db.close()


@app.route("/api/interviews/sessions/<int:session_id>/report", methods=["GET"])
@token_required
def download_interview_report(session_id):
    db = SessionLocal()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not session:
            return jsonify({"error": "Interview session not found"}), 404
        if request.current_user.role == "candidate" and session.candidate_id != request.current_user.id:
            return jsonify({"error": "You can only access your own interview report"}), 403
        if request.current_user.role == "recruiter":
            job = db.query(JobPosting).filter(JobPosting.id == session.job_id, JobPosting.recruiter_id == request.current_user.id).first()
            if not job:
                return jsonify({"error": "Recruiter authorization required"}), 403
        candidate = db.query(User).filter(User.id == session.candidate_id).first()
        responses = db.query(InterviewResponse).filter(InterviewResponse.session_id == session.id).order_by(InterviewResponse.id).all()
        pdf_bytes = generate_interview_pdf(candidate.full_name, session, responses)
        return send_file(io.BytesIO(pdf_bytes), mimetype="application/pdf", as_attachment=True, download_name=f"interview_{session.id}_report.pdf")
    finally:
        db.close()

# ----------------- DOWNLOADABLE PDF REPORT -----------------

@app.route("/api/reports/download-pdf", methods=["GET", "POST"])
@token_required
def download_pdf():
    """
    Generate and stream downloadable professional PDF report.
    """
    job_id = request.args.get("job_id", type=int)
    requested_candidate_id = request.args.get("candidate_id", type=int)

    db = SessionLocal()
    try:
        if request.current_user.role == "candidate":
            if requested_candidate_id and requested_candidate_id != request.current_user.id:
                return jsonify({"error": "You can only download your own report"}), 403
            candidate = request.current_user
        elif request.current_user.role == "recruiter":
            if not requested_candidate_id or not job_id or not recruiter_owns_job(db, request.current_user, job_id):
                return jsonify({"error": "Select an applicant and a job posting you own"}), 403
            application = db.query(Application).filter(
                Application.candidate_id == requested_candidate_id,
                Application.job_id == job_id,
            ).first()
            if not application:
                return jsonify({"error": "Candidate application not found"}), 404
            candidate = db.query(User).filter(User.id == requested_candidate_id, User.role == "candidate").first()
        else:
            return jsonify({"error": "Authentication is required to download a report"}), 403

        if not candidate:
            return jsonify({"error": "Candidate not found"}), 404
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == candidate.id).first()
        if not profile or not (profile.raw_resume_text or "").strip():
            return jsonify({"error": "This candidate has not uploaded a readable resume"}), 404
        job = db.query(JobPosting).filter(JobPosting.id == job_id).first() if job_id else None
        if not job:
            return jsonify({"error": "Select an available job to generate the matching report"}), 404
        if request.current_user.role == "recruiter" and job.recruiter_id != request.current_user.id:
            return jsonify({"error": "Recruiter authorization required"}), 403

        cand_name = candidate.full_name
        cand_email = candidate.email
        resume_text = profile.raw_resume_text

        # Run pipeline models
        m1 = model1_extractor.extract_skills(resume_text)
        m2 = model2_matcher.calculate_match(
            resume_text=resume_text,
            job_description=job.description if job else "",
            candidate_skills=m1["all_skills"],
            required_skills=job.required_skills if job else [],
            preferred_skills=job.preferred_skills if job else []
        )
        m3 = model3_recommender.analyze_gaps(
            candidate_skills=m1["all_skills"],
            required_skills=job.required_skills if job else [],
            preferred_skills=job.preferred_skills if job else [],
            job_title=job.title if job else "Software Engineer"
        )

        pdf_bytes = generate_pdf_report(
            candidate_name=cand_name,
            candidate_email=cand_email,
            target_job=job.to_dict(),
            model1_data=m1,
            model2_data=m2,
            model3_data=m3
        )

        filename = f"{cand_name.replace(' ', '_')}_AI_Match_Report.pdf"
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    finally:
        db.close()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
