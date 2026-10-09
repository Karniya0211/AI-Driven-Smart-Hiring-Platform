import io
from html import escape
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable


def _safe_feedback(response):
    feedback = getattr(response, "feedback", {}) if hasattr(response, "feedback") else {}
    if isinstance(feedback, dict):
        return feedback
    return {}


def generate_interview_pdf(candidate_name, session, responses):
    buffer = io.BytesIO()
    document = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=0.6 * inch, leftMargin=0.6 * inch, topMargin=0.6 * inch, bottomMargin=0.6 * inch)
    styles = getSampleStyleSheet()

    response_items = responses or []
    scores = [_safe_feedback(response).get("score", 0) for response in response_items]
    average_score = round(sum(scores) / len(scores), 1) if scores else 0
    score_pct = round(average_score * 10, 1)
    strengths = list(dict.fromkeys(
        item for response in response_items for item in _safe_feedback(response).get("strengths", [])
    ))
    improvements = list(dict.fromkeys(
        item for response in response_items for item in _safe_feedback(response).get("improvements", [])
    ))

    def paragraph(value):
        return Paragraph(escape(str(value or "Not provided")), styles["BodyText"])

    story = [
        Paragraph("AI Skill Resume Matcher & Career Recommender", styles["Heading2"]),
        Paragraph("INTERVIEW REPORT", styles["Title"]),
        HRFlowable(width="100%", thickness=1, spaceAfter=12),
        Spacer(1, 12),
        paragraph(f"Candidate: {candidate_name or 'Candidate'}"),
        paragraph(f"Job role: {session.job_role}"),
        paragraph(f"Interview type: {getattr(session, 'interview_type', 'practice').title()}"),
        paragraph(f"Interview date: {session.started_at.isoformat() if getattr(session, 'started_at', None) else 'N/A'}"),
        paragraph(f"Questions answered: {len(response_items)} of {session.total_questions}"),
        paragraph(f"Overall score: {average_score}/10 ({score_pct}%)"),
        paragraph(f"Final status: {getattr(session, 'status', 'unknown').replace('_', ' ').title()}"),
        Spacer(1, 12),
        Paragraph("Interview summary", styles["Heading2"]),
        paragraph(f"The candidate completed {len(response_items)} of {session.total_questions} role-related questions. The average rubric score was {average_score}/10."),
        Paragraph("Strengths", styles["Heading3"]),
        paragraph("; ".join(strengths) if strengths else "No strengths were recorded."),
        Paragraph("Areas for improvement", styles["Heading3"]),
        paragraph("; ".join(improvements) if improvements else "No improvement notes were recorded."),
        Spacer(1, 12),
    ]

    for number, response in enumerate(response_items, 1):
        feedback = _safe_feedback(response)
        rubric = [
            f"Score: {feedback.get('score', 0)}/10",
            f"Relevance: {feedback.get('relevance', 0)}%",
            f"Completeness: {feedback.get('completeness', 0)}%",
            f"Clarity: {feedback.get('clarity', 0)}%",
            f"Structure: {feedback.get('structure', 0)}%",
        ]
        story.extend([
            Paragraph(f"Question {number}", styles["Heading3"]),
            paragraph(response.question_text),
            paragraph(f"Transcript: {response.candidate_answer}"),
            paragraph(" | ".join(rubric)),
            paragraph(f"Feedback: {feedback.get('feedback', 'No feedback recorded.') }"),
            paragraph(f"Strengths: {'; '.join(feedback.get('strengths', []))}"),
            paragraph(f"Improvements: {'; '.join(feedback.get('improvements', []))}"),
            Spacer(1, 12),
        ])

    document.build(story)
    return buffer.getvalue()
