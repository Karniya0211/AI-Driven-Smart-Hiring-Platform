from typing import Dict, List, Any

# Curated course catalogue for top skills across modern tech stacks
SKILL_COURSE_CATALOG = {
    "Docker": {
        "courses": [
            {"title": "Docker & Kubernetes: The Practical Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/docker-kubernetes-the-practical-guide/", "duration": "4 weeks", "level": "Intermediate", "rating": 4.8, "cert": "Yes"},
            {"title": "Docker for Developers", "provider": "Coursera", "url": "https://www.coursera.org/learn/docker-for-developers", "duration": "3 weeks", "level": "Beginner", "rating": 4.7, "cert": "Yes"}
        ],
        "category": "Cloud & DevOps",
        "est_weeks": 3
    },
    "Kubernetes": {
        "courses": [
            {"title": "Certified Kubernetes Administrator (CKA)", "provider": "Udemy", "url": "https://www.udemy.com/course/certified-kubernetes-administrator-with-practice-tests/", "duration": "6 weeks", "level": "Advanced", "rating": 4.9, "cert": "CKA Exam Prep"},
            {"title": "Google Cloud Kubernetes Engine Specialization", "provider": "Coursera", "url": "https://www.coursera.org/specializations/architecting-with-google-kubernetes-engine", "duration": "5 weeks", "level": "Intermediate", "rating": 4.8, "cert": "Yes"}
        ],
        "category": "Cloud & DevOps",
        "est_weeks": 5
    },
    "AWS": {
        "courses": [
            {"title": "AWS Certified Solutions Architect Associate", "provider": "Udemy", "url": "https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/", "duration": "6 weeks", "level": "Intermediate", "rating": 4.9, "cert": "AWS SAA-C03"},
            {"title": "AWS Cloud Practitioner Essentials", "provider": "Coursera", "url": "https://www.coursera.org/learn/aws-cloud-practitioner-essentials", "duration": "3 weeks", "level": "Beginner", "rating": 4.8, "cert": "Yes"}
        ],
        "category": "Cloud & DevOps",
        "est_weeks": 4
    },
    "TypeScript": {
        "courses": [
            {"title": "Understanding TypeScript - 2024 Edition", "provider": "Udemy", "url": "https://www.udemy.com/course/understanding-typescript/", "duration": "3 weeks", "level": "All Levels", "rating": 4.8, "cert": "Yes"},
            {"title": "TypeScript Official Handbook & Interactive Playground", "provider": "Official Docs", "url": "https://www.typescriptlang.org/docs/", "duration": "2 weeks", "level": "Intermediate", "rating": 4.9, "cert": "No"}
        ],
        "category": "Languages",
        "est_weeks": 2
    },
    "React": {
        "courses": [
            {"title": "The Complete React Developer Course", "provider": "Udemy", "url": "https://www.udemy.com/course/react-2nd-edition/", "duration": "5 weeks", "level": "Intermediate", "rating": 4.8, "cert": "Yes"},
            {"title": "Meta Front-End Developer Professional Certificate", "provider": "Coursera", "url": "https://www.coursera.org/professional-certificates/meta-front-end-developer", "duration": "8 weeks", "level": "Beginner-Intermediate", "rating": 4.8, "cert": "Meta Certified"}
        ],
        "category": "Frameworks",
        "est_weeks": 4
    },
    "Next.js": {
        "courses": [
            {"title": "Next.js 14 & React - The Complete Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/nextjs-react-the-complete-guide/", "duration": "4 weeks", "level": "Intermediate", "rating": 4.8, "cert": "Yes"},
            {"title": "Learn Next.js by Vercel", "provider": "Official Docs", "url": "https://nextjs.org/learn", "duration": "1-2 weeks", "level": "Intermediate", "rating": 4.9, "cert": "No"}
        ],
        "category": "Frameworks",
        "est_weeks": 3
    },
    "PostgreSQL": {
        "courses": [
            {"title": "The Complete Python/PostgreSQL Bootcamp", "provider": "Udemy", "url": "https://www.udemy.com/course/the-complete-python-postgresql-developer-course/", "duration": "4 weeks", "level": "Intermediate", "rating": 4.7, "cert": "Yes"},
            {"title": "PostgreSQL for Everybody Specialization", "provider": "Coursera", "url": "https://www.coursera.org/specializations/postgresql-for-everybody", "duration": "4 weeks", "level": "Beginner-Intermediate", "rating": 4.8, "cert": "Yes"}
        ],
        "category": "Databases",
        "est_weeks": 3
    },
    "MongoDB": {
        "courses": [
            {"title": "MongoDB - The Complete Developer's Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/mongodb-the-complete-developers-guide/", "duration": "3 weeks", "level": "Intermediate", "rating": 4.8, "cert": "Yes"},
            {"title": "MongoDB University Official Courses", "provider": "Official Docs", "url": "https://learn.mongodb.com/", "duration": "3 weeks", "level": "Beginner-Advanced", "rating": 4.9, "cert": "MongoDB Certified"}
        ],
        "category": "Databases",
        "est_weeks": 2
    },
    "GraphQL": {
        "courses": [
            {"title": "GraphQL with React: The Complete Developers Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/graphql-with-react-course/", "duration": "3 weeks", "level": "Intermediate", "rating": 4.7, "cert": "Yes"}
        ],
        "category": "Tools & APIs",
        "est_weeks": 2
    },
    "Terraform": {
        "courses": [
            {"title": "HashiCorp Certified: Terraform Associate", "provider": "Udemy", "url": "https://www.udemy.com/course/terraform-hands-on-labs/", "duration": "4 weeks", "level": "Intermediate", "rating": 4.8, "cert": "Terraform Associate"}
        ],
        "category": "Cloud & DevOps",
        "est_weeks": 3
    },
    "PyTorch": {
        "courses": [
            {"title": "Deep Learning with PyTorch", "provider": "Coursera", "url": "https://www.coursera.org/specializations/deep-learning", "duration": "6 weeks", "level": "Advanced", "rating": 4.9, "cert": "DeepLearning.AI"}
        ],
        "category": "AI / Machine Learning",
        "est_weeks": 5
    },
    "System Design": {
        "courses": [
            {"title": "Grokking Modern System Design for Software Engineers", "provider": "Educative", "url": "https://www.educative.io/courses/grokking-modern-system-design-interview-for-engineers-managers", "duration": "4 weeks", "level": "Advanced", "rating": 4.9, "cert": "Yes"}
        ],
        "category": "Architecture",
        "est_weeks": 4
    },
    "Redis": {
        "courses": [
            {"title": "Redis: The Complete Developer's Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/redis-the-complete-developers-guide-with-microservices/", "duration": "2 weeks", "level": "Intermediate", "rating": 4.8, "cert": "Yes"}
        ],
        "category": "Databases",
        "est_weeks": 2
    }
}

class Model3SkillGapRecommender:
    """
    Model 3: Skill Gap Analysis & Recommendation Engine for missing skills,
    course pathways, and milestone-based career roadmap.
    """
    def __init__(self):
        pass

    def analyze_gaps(
        self,
        candidate_skills: List[str],
        required_skills: List[str],
        preferred_skills: List[str] = None,
        job_title: str = "Software Engineer"
    ) -> Dict[str, Any]:
        preferred_skills = preferred_skills or []
        cand_lower = {s.lower() for s in candidate_skills}

        # 1. Identify missing skills and assign Severity
        missing_required = [s for s in required_skills if s.lower() not in cand_lower]
        missing_preferred = [s for s in preferred_skills if s.lower() not in cand_lower]
        matched_required = [s for s in required_skills if s.lower() in cand_lower]
        matched_preferred = [s for s in preferred_skills if s.lower() in cand_lower]

        severity_bars = []
        # Missing required get high/critical severity
        for idx, skill in enumerate(missing_required):
            # Critical = first 2 required or heavy tech like Kubernetes/AWS
            base_severity = 90 - (idx * 5)
            sev_val = max(base_severity, 65)
            level = "Critical" if sev_val >= 80 else "High"
            severity_bars.append({
                "skill": skill,
                "severity": sev_val,
                "priority": level,
                "type": "Required",
                "timeToMaster": self._estimate_time(skill),
                "impact": f"+{round(sev_val * 0.15, 1)}% Match"
            })

        # Missing preferred get moderate severity
        for idx, skill in enumerate(missing_preferred):
            base_severity = 55 - (idx * 5)
            sev_val = max(base_severity, 35)
            severity_bars.append({
                "skill": skill,
                "severity": sev_val,
                "priority": "Moderate",
                "type": "Preferred",
                "timeToMaster": self._estimate_time(skill),
                "impact": f"+{round(sev_val * 0.1, 1)}% Match"
            })

        # Sort horizontal bar chart by severity descending
        severity_bars.sort(key=lambda x: x["severity"], reverse=True)

        # 2. Grouped Bar Chart Data (Candidate Skills vs Required Skills)
        # Compare key skills for the target job: Proficiency / Score index
        grouped_chart_data = []
        all_target_skills = list(dict.fromkeys(required_skills + preferred_skills))
        
        for skill in all_target_skills:
            is_matched = skill.lower() in cand_lower
            cand_score = 85 if is_matched else 15
            req_score = 90 if skill in required_skills else 70

            grouped_chart_data.append({
                "skill": skill,
                "candidateScore": cand_score,
                "requiredScore": req_score,
                "status": "Acquired" if is_matched else "Skill Gap",
                "gapSize": max(req_score - cand_score, 0)
            })

        # Also add up to 3 strong candidate skills that are extra value
        extra_cand_skills = [s for s in candidate_skills if s.lower() not in {x.lower() for x in all_target_skills}][:3]
        for extra in extra_cand_skills:
            grouped_chart_data.append({
                "skill": extra,
                "candidateScore": 90,
                "requiredScore": 25,
                "status": "Bonus Strength",
                "gapSize": 0
            })

        # 3. Course Recommendations
        recommendations = self._generate_course_recommendations(missing_required + missing_preferred)

        # 4. Career Milestone Roadmap
        roadmap = self._generate_career_roadmap(job_title, missing_required, missing_preferred)

        return {
            "missing_required_skills": missing_required,
            "missing_preferred_skills": missing_preferred,
            "matched_required_skills": matched_required,
            "matched_preferred_skills": matched_preferred,
            "total_gaps": len(missing_required) + len(missing_preferred),
            "severity_chart_data": severity_bars,
            "grouped_chart_data": grouped_chart_data,
            "course_recommendations": recommendations,
            "career_roadmap": roadmap
        }

    def _estimate_time(self, skill: str) -> str:
        if skill in SKILL_COURSE_CATALOG:
            return f"{SKILL_COURSE_CATALOG[skill]['est_weeks']} weeks"
        return "2-3 weeks"

    def _generate_course_recommendations(self, missing_skills: List[str]) -> List[Dict[str, Any]]:
        recs = []
        seen_skills = set()

        for skill in missing_skills:
            if skill in seen_skills:
                continue
            seen_skills.add(skill)

            if skill in SKILL_COURSE_CATALOG:
                data = SKILL_COURSE_CATALOG[skill]
                for c in data["courses"]:
                    recs.append({
                        "skill": skill,
                        "category": data["category"],
                        "title": c["title"],
                        "provider": c["provider"],
                        "url": c["url"],
                        "duration": c["duration"],
                        "level": c["level"],
                        "rating": c["rating"],
                        "certification": c["cert"]
                    })
            else:
                # Dynamic fallback recommendation
                recs.append({
                    "skill": skill,
                    "category": "Technical Skill",
                    "title": f"Mastering {skill}: Hands-on Comprehensive Guide",
                    "provider": "Coursera / Udemy",
                    "url": f"https://www.google.com/search?q={skill}+online+course",
                    "duration": "3-4 weeks",
                    "level": "Intermediate",
                    "rating": 4.7,
                    "certification": "Yes"
                })

        return recs[:8]  # Top recommendations

    def _generate_career_roadmap(self, job_title: str, missing_req: List[str], missing_pref: List[str]) -> List[Dict[str, Any]]:
        """
        Generate an animated 3-stage milestone career roadmap.
        """
        req_subset1 = missing_req[:2] if missing_req else ["Core Architecture & Advanced Concepts"]
        req_subset2 = missing_req[2:4] if len(missing_req) > 2 else (missing_pref[:2] if missing_pref else ["DevOps & CI/CD Tooling"])
        req_subset3 = missing_pref[2:4] if len(missing_pref) > 2 else ["System Design & Production Readiness"]

        return [
            {
                "phase": "Phase 1: Critical Foundations",
                "timeline": "Weeks 1 – 4",
                "focus": f"Bridge urgent skill gaps for {job_title}",
                "targetSkills": req_subset1,
                "status": "In Progress",
                "milestoneGoal": "Master fundamentals and build sandbox micro-features.",
                "deliverables": [
                    f"Complete foundational tutorials and documentation in {', '.join(req_subset1)}",
                    "Build 2 mini-modules applying these technologies",
                    "Commit code to GitHub with complete README and unit tests"
                ],
                "badge": "Immediate Impact",
                "color": "indigo"
            },
            {
                "phase": "Phase 2: Architectural Mastery",
                "timeline": "Weeks 5 – 8",
                "focus": "Integration, Scalability, and Industry Tooling",
                "targetSkills": req_subset2,
                "status": "Upcoming",
                "milestoneGoal": "Connect frontend, backend, databases and containerized deployment.",
                "deliverables": [
                    f"Implement real-world integration for {', '.join(req_subset2)}",
                    "Set up automated CI/CD workflows and Docker containerization",
                    "Optimize database indexing, query performance, and caching layer"
                ],
                "badge": "Core Competency",
                "color": "cyan"
            },
            {
                "phase": "Phase 3: Production Capstone & Interview Readiness",
                "timeline": "Weeks 9 – 12",
                "focus": f"Capstone Project & Senior {job_title} Portfolio",
                "targetSkills": req_subset3,
                "status": "Upcoming",
                "milestoneGoal": "Deploy live production-grade application and pass mock technical interviews.",
                "deliverables": [
                    f"Develop full-scale capstone project incorporating {', '.join(req_subset1 + req_subset2)}",
                    "Deploy live on Cloud with monitoring, health-checks, and metrics",
                    "Conduct System Design and Behavioral interview prep rounds"
                ],
                "badge": "Job Ready",
                "color": "emerald"
            }
        ]

model3_recommender = Model3SkillGapRecommender()
