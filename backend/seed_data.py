import hashlib
from database import SessionLocal, init_db, engine, Base
from models import User, CandidateProfile, JobPosting, Application, SkillTaxonomy, CourseRecommendation
from nlp_pipeline.model1_extraction import model1_extractor
from nlp_pipeline.model2_matcher import model2_matcher
from nlp_pipeline.model3_recommender import model3_recommender

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

SAMPLE_RESUMES = {
    "alex": {
        "name": "Alex Chen",
        "email": "alex.chen@example.com",
        "headline": "Senior Full Stack & React Specialist",
        "experience": 5.0,
        "target_role": "Senior Full Stack Engineer",
        "text": """
Alex Chen
Email: alex.chen@example.com | Phone: +1-555-019-2834 | San Francisco, CA
GitHub: github.com/alexchen-dev | LinkedIn: linkedin.com/in/alexchen-dev

PROFESSIONAL SUMMARY
Senior Full Stack Developer with 5+ years of experience engineering scalable web applications.
Expertise in modern JavaScript/TypeScript ecosystem, React, Node.js, Express, and PostgreSQL.
Passionate about performant UI architectures, clean code, agile methodologies, and REST APIs.

TECHNICAL SKILLS
- Languages: JavaScript, TypeScript, Python, SQL, HTML, CSS
- Frameworks & Libraries: React, Node.js, Express, Next.js, TailwindCSS, Redux
- Databases: PostgreSQL, MongoDB, Redis, SQLite
- Cloud & DevOps: Docker, Git, GitHub Actions, Linux, CI/CD, Nginx
- Tools & Practices: REST API, Postman, Jest, Agile, Scrum, Code Review, Problem Solving

WORK EXPERIENCE
Senior Full Stack Engineer | Veloce Systems (2022 – Present)
- Architected high-performance React and TypeScript frontend with TailwindCSS, improving Core Web Vitals LCP by 42%.
- Built robust RESTful microservices with Node.js and Express connected to PostgreSQL and Redis caching.
- Integrated automated CI/CD deployment pipelines using GitHub Actions and Docker containers.
- Collaborated with product designers in Figma and participated in agile sprints and peer code reviews.

Full Stack Developer | NexaTech Solutions (2019 – 2022)
- Developed responsive user interfaces with React and Redux consumed by millions of active monthly users.
- Designed database schemas in PostgreSQL and MongoDB, creating indexed queries for optimal throughput.
- Implemented unit and integration tests achieving 88% test coverage.

EDUCATION
B.S. in Computer Science | University of California, Berkeley (2015 – 2019)
"""
    },
    "priya": {
        "name": "Priya Sharma",
        "email": "priya.sharma@example.com",
        "headline": "AI/ML Engineer & Data Scientist",
        "experience": 4.0,
        "target_role": "AI/ML Platform Engineer",
        "text": """
Priya Sharma
Email: priya.sharma@example.com | Phone: +1-555-014-9821 | New York, NY
GitHub: github.com/priyasharma-ml | LinkedIn: linkedin.com/in/priyasharma-ai

PROFESSIONAL SUMMARY
AI/ML Engineer with 4 years of experience researching, developing, and deploying deep learning models
and scalable data pipelines. Proficient in PyTorch, TensorFlow, Python, FastAPI, and PostgreSQL.

TECHNICAL SKILLS
- Languages: Python, SQL, R, Bash
- Frameworks: PyTorch, TensorFlow, Scikit-Learn, Pandas, NumPy, FastAPI, Flask
- Cloud & Infrastructure: AWS, Docker, Kubernetes, MLflow, Airflow
- Databases: PostgreSQL, MongoDB, Redis
- Core Competencies: Machine Learning, Deep Learning, NLP, Computer Vision, Model Serving, Git

WORK EXPERIENCE
Machine Learning Engineer | Apex AI Labs (2021 – Present)
- Trained state-of-the-art transformer models using PyTorch for real-time natural language classification.
- Deployed low-latency inference APIs with FastAPI and Docker on AWS ECS.
- Automated data training pipelines with Apache Airflow and PostgreSQL.

Data Scientist | DataPulse Analytics (2020 – 2021)
- Engineered end-to-end predictive models with Scikit-Learn and Pandas, boosting retention forecasts by 28%.
- Built interactive analytics dashboards with Streamlit and SQL.

EDUCATION
M.S. in Artificial Intelligence | Carnegie Mellon University (2018 – 2020)
B.Tech in Computer Science | Indian Institute of Technology (2014 – 2018)
"""
    },
    "david": {
        "name": "David Miller",
        "email": "david.miller@example.com",
        "headline": "Cloud DevOps & Platform Architect",
        "experience": 6.0,
        "target_role": "Cloud DevOps Architect",
        "text": """
David Miller
Email: david.miller@example.com | Phone: +1-555-018-7744 | Austin, TX
GitHub: github.com/davidmiller-cloud | LinkedIn: linkedin.com/in/davidmiller-devops

PROFESSIONAL SUMMARY
Cloud Infrastructure and DevOps Engineer with 6+ years specializing in Kubernetes, AWS, Terraform,
and continuous deployment automation. Experienced in architecting zero-downtime platforms.

TECHNICAL SKILLS
- Cloud Platforms: AWS, GCP, Azure
- DevOps & Orchestration: Kubernetes, Docker, Terraform, Ansible, Helm, Jenkins, GitHub Actions, CI/CD
- Languages & Scripting: Python, Go, Bash, Shell, SQL
- Observability: Prometheus, Grafana, Linux, Nginx
- Practices: Site Reliability, Infrastructure as Code, Agile, System Design, Security

WORK EXPERIENCE
Lead DevOps Engineer | CloudScale Tech (2021 – Present)
- Managed enterprise multi-cluster Kubernetes environments on AWS EKS serving 50M+ daily requests.
- Implemented Infrastructure as Code using Terraform modules, reducing provisioning time from days to 15 minutes.
- Designed comprehensive Prometheus and Grafana dashboards for cluster observability and alerting.

Systems & DevOps Specialist | RedRock Infrastructure (2018 – 2021)
- Migrated on-premise workloads to AWS cloud with automated Docker container builds.
- Built CI/CD pipelines in Jenkins and GitHub Actions with automated security linting.

EDUCATION
B.S. in Information Systems | University of Texas at Austin (2014 – 2018)
"""
    }
}

JOBS_DATA = [
    {
        "title": "Senior Full Stack Engineer",
        "company": "CloudScale Technologies",
        "location": "San Francisco, CA (Hybrid)",
        "experience_level": "Senior",
        "job_type": "Full-time",
        "salary_range": "$140,000 - $175,000",
        "description": "We are seeking a Senior Full Stack Engineer to lead the development of our core cloud intelligence web platform. You will build high-traffic user interfaces in React, scalable backend microservices in Node.js and TypeScript, and maintain PostgreSQL and Redis data stores. Experience with Docker containerization and AWS is strongly desired.",
        "required_skills": ["React", "Node.js", "TypeScript", "JavaScript", "PostgreSQL", "Docker", "REST API", "Git"],
        "preferred_skills": ["AWS", "Kubernetes", "Redis", "TailwindCSS", "Next.js", "System Design"]
    },
    {
        "title": "AI/ML Platform Engineer",
        "company": "Nexus AI Labs",
        "location": "New York, NY (Remote)",
        "experience_level": "Mid-Senior",
        "job_type": "Full-time",
        "salary_range": "$150,000 - $190,000",
        "description": "Nexus AI Labs is looking for an AI/ML Platform Engineer to build cutting-edge model deployment and training infrastructure. The ideal candidate has strong foundations in PyTorch, Python, FastAPI, Docker, and distributed machine learning systems.",
        "required_skills": ["Python", "PyTorch", "FastAPI", "Docker", "Scikit-Learn", "PostgreSQL", "Git"],
        "preferred_skills": ["Kubernetes", "AWS", "TensorFlow", "MLflow", "Redis", "Airflow"]
    },
    {
        "title": "Frontend Architect",
        "company": "Apex Fintech",
        "location": "New York, NY (Hybrid)",
        "experience_level": "Lead",
        "job_type": "Full-time",
        "salary_range": "$160,000 - $200,000",
        "description": "Lead the UI architecture of our mission-critical financial trading and analytics dashboards. You will drive component design systems using React, TypeScript, Next.js, and TailwindCSS with GraphQL APIs.",
        "required_skills": ["React", "TypeScript", "Next.js", "TailwindCSS", "JavaScript", "HTML", "CSS", "Git"],
        "preferred_skills": ["GraphQL", "System Design", "Node.js", "Docker", "Jest", "Agile"]
    },
    {
        "title": "Cloud DevOps Architect",
        "company": "HyperScale Cloud",
        "location": "Austin, TX (Remote)",
        "experience_level": "Senior",
        "job_type": "Full-time",
        "salary_range": "$155,000 - $185,000",
        "description": "Seeking an experienced Cloud DevOps Architect to oversee cloud infrastructure, CI/CD automation, and Kubernetes orchestration. Must be fluent in AWS, Terraform, Docker, and Linux system administration.",
        "required_skills": ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD", "Linux", "Git"],
        "preferred_skills": ["Python", "Go", "Prometheus", "Grafana", "Ansible", "System Design"]
    },
    {
        "title": "Backend Python / Django Engineer",
        "company": "DataPulse Analytics",
        "location": "Chicago, IL (Remote)",
        "experience_level": "Mid",
        "job_type": "Full-time",
        "salary_range": "$125,000 - $155,000",
        "description": "Looking for a Backend Python Engineer to build high-performance data processing pipelines and API services using Python, Django, PostgreSQL, Redis, and Celery.",
        "required_skills": ["Python", "Django", "PostgreSQL", "REST API", "SQL", "Git"],
        "preferred_skills": ["Redis", "Docker", "Celery", "AWS", "FastAPI"]
    },
    {
        "title": "Site Reliability Engineer (SRE)",
        "company": "CloudScale Technologies",
        "location": "San Francisco, CA (Hybrid)",
        "experience_level": "Mid-Senior",
        "job_type": "Full-time",
        "salary_range": "$135,000 - $165,000",
        "description": "Ensure high availability and fault tolerance of our core services. Leverage Kubernetes, Docker, Prometheus, Grafana, and Python automation to achieve 99.99% uptime.",
        "required_skills": ["Linux", "Kubernetes", "Docker", "Python", "Prometheus", "Git"],
        "preferred_skills": ["AWS", "Terraform", "Grafana", "Go", "CI/CD"]
    }
]

def seed_database():
    print("Initializing database tables...")
    init_db()
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_user = db.query(User).first()
        if existing_user:
            print("Database already contains data. Refreshing seed records...")
            # Delete old data in order
            db.query(Application).delete()
            db.query(JobPosting).delete()
            db.query(CandidateProfile).delete()
            db.query(User).delete()
            db.commit()

        print("Seeding Recruiters...")
        sarah = User(
            email="sarah.jenkins@techcorp.com",
            password_hash=hash_pw("recruiter123"),
            full_name="Sarah Jenkins",
            role="recruiter"
        )
        marcus = User(
            email="marcus.vance@fintech.io",
            password_hash=hash_pw("recruiter123"),
            full_name="Marcus Vance",
            role="recruiter"
        )
        db.add_all([sarah, marcus])
        db.commit()
        db.refresh(sarah)
        db.refresh(marcus)

        print("Seeding Job Postings...")
        job_objects = []
        for idx, j_data in enumerate(JOBS_DATA):
            rec_id = sarah.id if idx % 2 == 0 else marcus.id
            job = JobPosting(
                recruiter_id=rec_id,
                title=j_data["title"],
                company=j_data["company"],
                location=j_data["location"],
                experience_level=j_data["experience_level"],
                job_type=j_data["job_type"],
                salary_range=j_data["salary_range"],
                description=j_data["description"]
            )
            job.required_skills = j_data["required_skills"]
            job.preferred_skills = j_data["preferred_skills"]
            db.add(job)
            job_objects.append(job)
        db.commit()
        for j in job_objects:
            db.refresh(j)

        print("Seeding Candidates and extracting skills with Model 1...")
        candidate_users = []
        candidate_profiles = []

        for key, cand in SAMPLE_RESUMES.items():
            user = User(
                email=cand["email"],
                password_hash=hash_pw("candidate123"),
                full_name=cand["name"],
                role="candidate"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            candidate_users.append(user)

            # Run Model 1 Extraction
            extracted = model1_extractor.extract_skills(cand["text"])
            profile = CandidateProfile(
                user_id=user.id,
                headline=cand["headline"],
                summary=cand["text"][:300].strip() + "...",
                years_experience=cand["experience"],
                target_role=cand["target_role"],
                raw_resume_text=cand["text"],
                resume_filename=f"{key}_resume.pdf"
            )
            profile.extracted_skills = extracted
            db.add(profile)
            candidate_profiles.append(profile)

        db.commit()

        print("Computing Model 2 Match Scores & Model 3 Recommendations for Applications...")
        # Create applications for Alex against all jobs
        alex_user = candidate_users[0]
        alex_cand_data = SAMPLE_RESUMES["alex"]
        alex_skills = model1_extractor.extract_skills(alex_cand_data["text"])["all_skills"]

        for job in job_objects:
            m2_res = model2_matcher.calculate_match(
                resume_text=alex_cand_data["text"],
                job_description=job.description,
                candidate_skills=alex_skills,
                required_skills=job.required_skills,
                preferred_skills=job.preferred_skills
            )
            app = Application(
                candidate_id=alex_user.id,
                job_id=job.id,
                match_score=m2_res["match_score"],
                status="reviewed"
            )
            app.compatibility_breakdown = m2_res
            db.add(app)

        # Also create applications for Priya and David so Recruiter dashboard has candidate lists
        priya_user = candidate_users[1]
        priya_skills = model1_extractor.extract_skills(SAMPLE_RESUMES["priya"]["text"])["all_skills"]
        for job in job_objects:
            m2_res = model2_matcher.calculate_match(
                resume_text=SAMPLE_RESUMES["priya"]["text"],
                job_description=job.description,
                candidate_skills=priya_skills,
                required_skills=job.required_skills,
                preferred_skills=job.preferred_skills
            )
            app = Application(
                candidate_id=priya_user.id,
                job_id=job.id,
                match_score=m2_res["match_score"],
                status="shortlisted" if m2_res["match_score"] >= 70 else "reviewed"
            )
            app.compatibility_breakdown = m2_res
            db.add(app)

        david_user = candidate_users[2]
        david_skills = model1_extractor.extract_skills(SAMPLE_RESUMES["david"]["text"])["all_skills"]
        for job in job_objects:
            m2_res = model2_matcher.calculate_match(
                resume_text=SAMPLE_RESUMES["david"]["text"],
                job_description=job.description,
                candidate_skills=david_skills,
                required_skills=job.required_skills,
                preferred_skills=job.preferred_skills
            )
            app = Application(
                candidate_id=david_user.id,
                job_id=job.id,
                match_score=m2_res["match_score"],
                status="interviewed" if m2_res["match_score"] >= 75 else "reviewed"
            )
            app.compatibility_breakdown = m2_res
            db.add(app)

        db.commit()
        print("Database successfully seeded with realistic demo data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
