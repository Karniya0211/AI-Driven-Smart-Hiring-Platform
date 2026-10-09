from datetime import datetime
import json
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, UniqueConstraint
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="candidate")  # "candidate" or "recruiter"
    constraints_json = Column(Text, default="{}")
    saved_state_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def constraints(self):
        try:
            return json.loads(self.constraints_json or "{}")
        except Exception:
            return {}

    @constraints.setter
    def constraints(self, value):
        self.constraints_json = json.dumps(value)

    @property
    def saved_state(self):
        try:
            return json.loads(self.saved_state_json or "{}")
        except Exception:
            return {}

    @saved_state.setter
    def saved_state(self, value):
        self.saved_state_json = json.dumps(value)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "constraints": self.constraints,
            "saved_state": self.saved_state,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    headline = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)
    years_experience = Column(Float, default=0.0)
    target_role = Column(String(255), nullable=True)
    raw_resume_text = Column(Text, nullable=True)
    resume_filename = Column(String(255), nullable=True)
    # Stored as JSON string: {"languages": [...], "frameworks": [...], "cloud": [...], ...}
    extracted_skills_json = Column(Text, default="{}")
    saved_pipeline_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def extracted_skills(self):
        try:
            return json.loads(self.extracted_skills_json or "{}")
        except Exception:
            return {}

    @extracted_skills.setter
    def extracted_skills(self, value):
        self.extracted_skills_json = json.dumps(value)

    @property
    def saved_pipeline(self):
        try:
            return json.loads(self.saved_pipeline_json or "{}")
        except Exception:
            return {}

    @saved_pipeline.setter
    def saved_pipeline(self, value):
        self.saved_pipeline_json = json.dumps(value)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "headline": self.headline,
            "summary": self.summary,
            "years_experience": self.years_experience,
            "target_role": self.target_role,
            "resume_filename": self.resume_filename,
            "extracted_skills": self.extracted_skills,
            "saved_pipeline": self.saved_pipeline,
            "has_resume": bool(self.raw_resume_text and self.raw_resume_text.strip()),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    job_applied = Column(String(255), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="Applied")
    resume = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "recruiter_id": self.recruiter_id,
            "job_applied": self.job_applied,
            "status": self.status,
            "resume": self.resume,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    experience_level = Column(String(100), default="Mid-Senior")  # Entry, Mid, Senior, Lead
    job_type = Column(String(50), default="Full-time")  # Full-time, Remote, Hybrid, Contract
    salary_range = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    # Stored as JSON array strings
    required_skills_json = Column(Text, default="[]")
    preferred_skills_json = Column(Text, default="[]")
    status = Column(String(50), default="active")  # active, closed
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def required_skills(self):
        try:
            return json.loads(self.required_skills_json or "[]")
        except Exception:
            return []

    @required_skills.setter
    def required_skills(self, value):
        self.required_skills_json = json.dumps(value)

    @property
    def preferred_skills(self):
        try:
            return json.loads(self.preferred_skills_json or "[]")
        except Exception:
            return []

    @preferred_skills.setter
    def preferred_skills(self, value):
        self.preferred_skills_json = json.dumps(value)

    def to_dict(self):
        return {
            "id": self.id,
            "recruiter_id": self.recruiter_id,
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "experience_level": self.experience_level,
            "job_type": self.job_type,
            "salary_range": self.salary_range,
            "description": self.description,
            "required_skills": self.required_skills,
            "preferred_skills": self.preferred_skills,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("job_postings.id"), nullable=False)
    match_score = Column(Float, default=0.0)
    compatibility_breakdown_json = Column(Text, default="{}")
    status = Column(String(50), default="reviewed")  # applied, shortlisted, interviewed, hired
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def compatibility_breakdown(self):
        try:
            return json.loads(self.compatibility_breakdown_json or "{}")
        except Exception:
            return {}

    @compatibility_breakdown.setter
    def compatibility_breakdown(self, value):
        self.compatibility_breakdown_json = json.dumps(value)

    def to_dict(self):
        return {
            "id": self.id,
            "candidate_id": self.candidate_id,
            "job_id": self.job_id,
            "match_score": self.match_score,
            "compatibility_breakdown": self.compatibility_breakdown,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class SkillTaxonomy(Base):
    __tablename__ = "skill_taxonomy"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(100), nullable=False)  # Languages, Frameworks, Cloud, Databases, Tools, SoftSkills
    aliases_json = Column(Text, default="[]")
    importance_weight = Column(Float, default=1.0)

    @property
    def aliases(self):
        try:
            return json.loads(self.aliases_json or "[]")
        except Exception:
            return []

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "aliases": self.aliases,
            "importance_weight": self.importance_weight
        }

class CourseRecommendation(Base):
    __tablename__ = "course_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    skill_name = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    provider = Column(String(100), nullable=False)  # Coursera, Udemy, edX, YouTube, Official Docs
    url = Column(String(500), nullable=False)
    duration = Column(String(50), default="4-6 weeks")
    level = Column(String(50), default="Intermediate")  # Beginner, Intermediate, Advanced
    rating = Column(Float, default=4.8)
    certification_offered = Column(String(50), default="Yes")

    def to_dict(self):
        return {
            "id": self.id,
            "skill_name": self.skill_name,
            "title": self.title,
            "provider": self.provider,
            "url": self.url,
            "duration": self.duration,
            "level": self.level,
            "rating": self.rating,
            "certification_offered": self.certification_offered
        }

class InterviewQuestion(Base):
    __tablename__ = "interview_questions"
    id = Column(Integer, primary_key=True, index=True)
    job_role = Column(String(255), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    options_json = Column(Text, default='{}')
    correct_answer = Column(String(10), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def options(self):
        try:
            return json.loads(self.options_json or '{}')
        except Exception:
            return {}

    @options.setter
    def options(self, value):
        self.options_json = json.dumps(value)

    def to_dict(self):
        return {"id": self.id, "job_role": self.job_role, "category": self.category, "question_text": self.question_text, "options": self.options, "correct_answer": self.correct_answer}

class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("job_postings.id"), nullable=True, index=True)
    job_role = Column(String(255), nullable=False)
    status = Column(String(50), default="in_progress", index=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    total_questions = Column(Integer, default=0)
    interview_type = Column(String(40), default="practice", nullable=False)
    questions_json = Column(Text, default="[]", nullable=False)

    @property
    def question_ids(self):
        try:
            return json.loads(self.questions_json or "[]")
        except Exception:
            return []

    @question_ids.setter
    def question_ids(self, value):
        self.questions_json = json.dumps(value)

    def to_dict(self, responses=None, questions=None, candidate_name=None):
        response_data = [response.to_dict() for response in (responses or [])]
        scores = [item["feedback"].get("score", 0) for item in response_data if item["feedback"]]
        return {"id": self.id, "candidate_id": self.candidate_id, "candidate_name": candidate_name, "job_id": self.job_id, "job_role": self.job_role, "interview_type": self.interview_type, "status": self.status, "started_at": self.started_at.isoformat() if self.started_at else None, "completed_at": self.completed_at.isoformat() if self.completed_at else None, "total_questions": self.total_questions, "questions": questions or [], "responses": response_data, "score": round(sum(scores) / len(scores), 1) if scores else None}

class InterviewResponse(Base):
    __tablename__ = "interview_responses"
    __table_args__ = (UniqueConstraint("session_id", "question_id", name="uq_interview_response_question"),)
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("interview_questions.id"), nullable=True)
    question_text = Column(Text, nullable=False)
    candidate_answer = Column(Text, nullable=False)
    feedback_json = Column(Text, default="{}")
    submitted_at = Column(DateTime, default=datetime.utcnow)

    @property
    def feedback(self):
        try:
            return json.loads(self.feedback_json or "{}")
        except Exception:
            return {}

    @feedback.setter
    def feedback(self, value):
        self.feedback_json = json.dumps(value)

    def to_dict(self):
        return {"id": self.id, "session_id": self.session_id, "question_id": self.question_id, "question_text": self.question_text, "candidate_answer": self.candidate_answer, "feedback": self.feedback, "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None}

class AtsInterview(Base):
    __tablename__ = "ats_interviews"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="scheduled", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {"id": self.id, "application_id": self.application_id, "session_id": self.session_id, "scheduled_at": self.scheduled_at.isoformat() if self.scheduled_at else None, "status": self.status, "created_at": self.created_at.isoformat() if self.created_at else None}
