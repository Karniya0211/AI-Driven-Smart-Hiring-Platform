import os
from abc import ABC, abstractmethod

from models import Candidate


VALID_CANDIDATE_STATUSES = ["Applied", "Screening", "Interview", "Selected", "Rejected"]


class ATSService(ABC):
    @abstractmethod
    def add_candidate(self, db, candidate_data):
        raise NotImplementedError

    @abstractmethod
    def get_candidates(self, db, user=None):
        raise NotImplementedError

    @abstractmethod
    def get_candidate(self, db, candidate_id, user=None):
        raise NotImplementedError

    @abstractmethod
    def update_candidate(self, db, candidate_id, updates, user=None):
        raise NotImplementedError

    @abstractmethod
    def delete_candidate(self, db, candidate_id, user=None):
        raise NotImplementedError


class MockATSService(ATSService):
    def add_candidate(self, db, candidate_data):
        candidate = Candidate(
            name=(candidate_data.get("name") or "").strip(),
            email=(candidate_data.get("email") or "").strip().lower(),
            recruiter_id=user.id if user and user.role == "recruiter" else None,
            job_applied=(candidate_data.get("job_applied") or "").strip(),
            status=(candidate_data.get("status") or "Applied").strip(),
            resume=(candidate_data.get("resume") or "").strip(),
        )
        if not candidate.name or not candidate.email or not candidate.job_applied:
            raise ValueError("Name, email, and job_applied are required")
        if candidate.status not in VALID_CANDIDATE_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(VALID_CANDIDATE_STATUSES)}")
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        return candidate

    def get_candidates(self, db, user=None):
        query = db.query(Candidate)
        if user:
            if user.role == "recruiter":
                query = query.filter(Candidate.recruiter_id == user.id)
            else:
                query = query.filter(Candidate.email == (user.email or "").lower())
        return query.order_by(Candidate.created_at.desc()).all()

    def get_candidate(self, db, candidate_id, user=None):
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            return None
        if user:
            if user.role == "recruiter" and candidate.recruiter_id != user.id:
                return None
            if user.role != "recruiter" and candidate.email.lower() != (user.email or "").lower():
                return None
        return candidate

    def update_candidate(self, db, candidate_id, updates, user=None):
        candidate = self.get_candidate(db, candidate_id, user=user)
        if not candidate:
            raise LookupError("Candidate not found")
        if "name" in updates:
            candidate.name = (updates["name"] or "").strip()
        if "email" in updates:
            candidate.email = (updates["email"] or "").strip().lower()
        if "job_applied" in updates:
            candidate.job_applied = (updates["job_applied"] or "").strip()
        if "status" in updates:
            status = (updates["status"] or "").strip()
            if status not in VALID_CANDIDATE_STATUSES:
                raise ValueError(f"Status must be one of: {', '.join(VALID_CANDIDATE_STATUSES)}")
            candidate.status = status
        if "resume" in updates:
            candidate.resume = (updates["resume"] or "").strip()
        db.commit()
        db.refresh(candidate)
        return candidate

    def delete_candidate(self, db, candidate_id, user=None):
        candidate = self.get_candidate(db, candidate_id, user=user)
        if not candidate:
            raise LookupError("Candidate not found")
        db.delete(candidate)
        db.commit()
        return candidate


class GreenhouseATSService(MockATSService):
    def __init__(self):
        self.provider_name = "greenhouse"
        self.configured = bool(os.getenv("GREENHOUSE_API_KEY"))


class LeverATSService(MockATSService):
    def __init__(self):
        self.provider_name = "lever"
        self.configured = bool(os.getenv("LEVER_API_KEY"))


class WorkdayATSService(MockATSService):
    def __init__(self):
        self.provider_name = "workday"
        self.configured = bool(os.getenv("WORKDAY_API_KEY"))


def get_ats_service():
    provider = (os.getenv("ATS_PROVIDER") or "mock").lower()
    if provider == "greenhouse":
        return GreenhouseATSService()
    if provider == "lever":
        return LeverATSService()
    if provider == "workday":
        return WorkdayATSService()
    return MockATSService()
