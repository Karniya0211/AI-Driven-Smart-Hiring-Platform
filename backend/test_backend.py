import app
from nlp_pipeline.model1_extraction import model1_extractor
from nlp_pipeline.model2_matcher import model2_matcher
from nlp_pipeline.model3_recommender import model3_recommender
from services.report_service import generate_pdf_report
from database import SessionLocal
from models import User, JobPosting

def test_all():
    print("Testing backend modules...")
    db = SessionLocal()
    user_count = db.query(User).count()
    job_count = db.query(JobPosting).count()
    db.close()
    print(f"DB check: {user_count} users, {job_count} jobs.")

    # Test Model 1
    sample_text = "Proficient in React, TypeScript, Python, Docker, and PostgreSQL with 4 years experience."
    m1_out = model1_extractor.extract_skills(sample_text)
    print(f"Model 1 Extracted {m1_out['skill_count']} skills: {m1_out['all_skills']}")

    # Test Model 2
    req_skills = ["React", "TypeScript", "Node.js", "Docker", "AWS", "Kubernetes"]
    m2_out = model2_matcher.calculate_match(
        resume_text=sample_text,
        job_description="Looking for React and Docker engineer.",
        candidate_skills=m1_out["all_skills"],
        required_skills=req_skills
    )
    print(f"Model 2 Match Score: {m2_out['match_score']}% ({m2_out['fit_level']})")

    # Test Model 3
    m3_out = model3_recommender.analyze_gaps(
        candidate_skills=m1_out["all_skills"],
        required_skills=req_skills,
        job_title="Full Stack Engineer"
    )
    print(f"Model 3 Missing Skills: {m3_out['missing_required_skills']}")
    print(f"Model 3 Severity Bars: {len(m3_out['severity_chart_data'])} items")
    print(f"Model 3 Grouped Chart Items: {len(m3_out['grouped_chart_data'])} items")

    # Test PDF generation
    pdf = generate_pdf_report(
        candidate_name="Alex Chen",
        candidate_email="alex.chen@example.com",
        target_job={"title": "Senior Full Stack Engineer", "company": "CloudScale"},
        model1_data=m1_out,
        model2_data=m2_out,
        model3_data=m3_out
    )
    print(f"PDF generated successfully: {len(pdf)} bytes")
    print("ALL BACKEND TESTS PASSED!")

if __name__ == "__main__":
    test_all()
