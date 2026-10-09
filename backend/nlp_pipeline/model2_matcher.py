import numpy as np
from typing import Dict, List, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class Model2CandidateJobMatcher:
    """
    Model 2: Candidate-Job Matching using TF-IDF + Cosine Similarity
    augmented with weighted skill intersection analysis.
    """
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),
            max_features=5000
        )

    def calculate_match(
        self,
        resume_text: str,
        job_description: str,
        candidate_skills: List[str],
        required_skills: List[str],
        preferred_skills: List[str] = None
    ) -> Dict[str, Any]:
        """
        Calculate multi-factor match score between candidate and job.
        """
        preferred_skills = preferred_skills or []

        # 1. TF-IDF Cosine Similarity on text corpus
        semantic_sim = 0.0
        try:
            corpus = [resume_text or " ", job_description or " "]
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
            sim_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
            semantic_sim = float(sim_matrix[0][0]) * 100.0
        except Exception:
            semantic_sim = 50.0

        # Normalize skills for set operations (case-insensitive matching)
        cand_skill_map = {s.lower(): s for s in candidate_skills}
        
        # 2. Required Skills Overlap
        req_matched = []
        req_missing = []
        for req in required_skills:
            if req.lower() in cand_skill_map:
                req_matched.append(cand_skill_map[req.lower()])
            else:
                req_missing.append(req)

        req_match_pct = (len(req_matched) / len(required_skills) * 100.0) if required_skills else 100.0

        # 3. Preferred Skills Overlap
        pref_matched = []
        pref_missing = []
        for pref in preferred_skills:
            if pref.lower() in cand_skill_map:
                pref_matched.append(cand_skill_map[pref.lower()])
            else:
                pref_missing.append(pref)

        pref_match_pct = (len(pref_matched) / len(preferred_skills) * 100.0) if preferred_skills else 100.0

        # 4. Composite Match Score
        # 60% Required Skills + 15% Preferred Skills + 25% TF-IDF Cosine Semantic Similarity
        composite_score = (0.60 * req_match_pct) + (0.15 * pref_match_pct) + (0.25 * semantic_sim)
        composite_score = round(min(max(composite_score, 0.0), 100.0), 1)

        # Rating classification
        if composite_score >= 85:
            fit_level = "Excellent Match"
            fit_color = "emerald"
        elif composite_score >= 70:
            fit_level = "Strong Match"
            fit_color = "blue"
        elif composite_score >= 50:
            fit_level = "Moderate Match"
            fit_color = "amber"
        else:
            fit_level = "Low Alignment"
            fit_color = "rose"

        return {
            "match_score": composite_score,
            "fit_level": fit_level,
            "fit_color": fit_color,
            "semantic_similarity": round(semantic_sim, 1),
            "required_skill_match_pct": round(req_match_pct, 1),
            "preferred_skill_match_pct": round(pref_match_pct, 1),
            "matching_required_skills": req_matched,
            "missing_required_skills": req_missing,
            "matching_preferred_skills": pref_matched,
            "missing_preferred_skills": pref_missing,
            "total_candidate_skills": len(candidate_skills),
            "total_required_skills": len(required_skills),
            "total_matched_skills": len(req_matched) + len(pref_matched)
        }

model2_matcher = Model2CandidateJobMatcher()
