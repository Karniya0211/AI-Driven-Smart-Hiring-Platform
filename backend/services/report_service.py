import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf_report(
    candidate_name: str,
    candidate_email: str,
    target_job: dict,
    model1_data: dict,
    model2_data: dict,
    model3_data: dict
) -> bytes:
    """
    Generate a sleek, comprehensive PDF report for the candidate and recruiter.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=15
    )
    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=12,
        spaceAfter=8
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    badge_style = ParagraphStyle(
        'Badge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.HexColor('#0284C7')
    )

    story = []

    # 1. Header Block
    story.append(Paragraph("AI Skill Resume Matcher & Career Recommender", title_style))
    report_date = datetime.now().strftime("%B %d, %Y - %H:%M UTC")
    story.append(Paragraph(f"Comprehensive AI Pipeline Evaluation Report • Generated {report_date}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#E2E8F0'), spaceAfter=15))

    # 2. Executive Summary Info Table
    job_title = target_job.get("title", "Target Role")
    company = target_job.get("company", "Tech Company")
    score = model2_data.get("match_score", 0.0)
    fit_level = model2_data.get("fit_level", "Moderate")

    overview_data = [
        [
            Paragraph("<b>Candidate:</b>", body_style),
            Paragraph(candidate_name, body_style),
            Paragraph("<b>Target Job:</b>", body_style),
            Paragraph(f"{job_title} @ {company}", body_style)
        ],
        [
            Paragraph("<b>Email:</b>", body_style),
            Paragraph(candidate_email, body_style),
            Paragraph("<b>Match Score:</b>", body_style),
            Paragraph(f"<font color='#059669'><b>{score}% ({fit_level})</b></font>", body_style)
        ],
        [
            Paragraph("<b>Semantic Match:</b>", body_style),
            Paragraph(f"{model2_data.get('semantic_similarity', 0)}%", body_style),
            Paragraph("<b>Required Skills:</b>", body_style),
            Paragraph(f"{model2_data.get('required_skill_match_pct', 0)}% Matched", body_style)
        ]
    ]

    overview_table = Table(overview_data, colWidths=[1.1*inch, 2.5*inch, 1.2*inch, 2.5*inch])
    overview_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#F1F5F9')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(overview_table)
    story.append(Spacer(1, 15))

    # 3. Model 1 - NLP Extracted Skills
    story.append(Paragraph("1. Model 1 – Extracted Resume Skills by Domain", h2_style))
    cats = model1_data.get("categories", {})
    
    cat_rows = [["Domain Category", "Identified Competencies & Skills"]]
    for cat_name, skill_list in cats.items():
        if skill_list:
            display_name = cat_name.replace("_", " ").title()
            skills_str = ", ".join(skill_list)
            cat_rows.append([
                Paragraph(f"<b>{display_name}</b>", body_style),
                Paragraph(skills_str, body_style)
            ])
    
    if len(cat_rows) > 1:
        cat_table = Table(cat_rows, colWidths=[1.8*inch, 5.5*inch])
        cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(cat_table)

    story.append(Spacer(1, 15))

    # 4. Model 2 - Candidate-Job Match & Overlap
    story.append(Paragraph("2. Model 2 – Candidate-Job Alignment & Skill Overlap", h2_style))
    matched_req = model2_data.get("matching_required_skills", [])
    missing_req = model2_data.get("missing_required_skills", [])
    matched_pref = model2_data.get("matching_preferred_skills", [])
    missing_pref = model2_data.get("missing_preferred_skills", [])

    m2_rows = [
        ["Evaluation Aspect", "Skill List", "Impact"],
        [
            Paragraph("<b>Matched Required</b>", body_style),
            Paragraph(", ".join(matched_req) if matched_req else "None", body_style),
            Paragraph("<font color='#059669'><b>High Strength</b></font>", body_style)
        ],
        [
            Paragraph("<b>Missing Required</b>", body_style),
            Paragraph(", ".join(missing_req) if missing_req else "None (Complete Alignment)", body_style),
            Paragraph("<font color='#DC2626'><b>High Priority Gap</b></font>", body_style)
        ],
        [
            Paragraph("<b>Matched Preferred</b>", body_style),
            Paragraph(", ".join(matched_pref) if matched_pref else "None", body_style),
            Paragraph("<font color='#2563EB'><b>Added Bonus</b></font>", body_style)
        ],
        [
            Paragraph("<b>Missing Preferred</b>", body_style),
            Paragraph(", ".join(missing_pref) if missing_pref else "None", body_style),
            Paragraph("<font color='#D97706'><b>Moderate Gap</b></font>", body_style)
        ]
    ]

    m2_table = Table(m2_rows, colWidths=[1.8*inch, 4.0*inch, 1.5*inch])
    m2_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(m2_table)

    story.append(Spacer(1, 15))

    # 5. Model 3 - Skill Gap Severity & Recommendations
    story.append(Paragraph("3. Model 3 – Skill Gap Severity & Recommended Learning Path", h2_style))
    recs = model3_data.get("course_recommendations", [])
    rec_rows = [["Target Skill", "Recommended Course / Certification", "Platform", "Duration", "Rating"]]
    for r in recs[:5]:
        rec_rows.append([
            Paragraph(f"<b>{r.get('skill', '')}</b>", body_style),
            Paragraph(r.get('title', ''), body_style),
            Paragraph(r.get('provider', ''), body_style),
            Paragraph(r.get('duration', ''), body_style),
            Paragraph(f"★ {r.get('rating', 4.8)}", body_style)
        ])

    if len(rec_rows) > 1:
        rec_table = Table(rec_rows, colWidths=[1.2*inch, 3.2*inch, 1.2*inch, 1.0*inch, 0.7*inch])
        rec_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#334155')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(rec_table)

    story.append(Spacer(1, 15))

    # 6. Career Roadmap Summary
    story.append(Paragraph("4. Milestone Career Roadmap (12-Week Progression)", h2_style))
    roadmap = model3_data.get("career_roadmap", [])
    for phase in roadmap:
        title = phase.get("phase", "")
        timeline = phase.get("timeline", "")
        focus = phase.get("focus", "")
        skills = ", ".join(phase.get("targetSkills", []))
        story.append(Paragraph(f"<b>{title}</b> ({timeline}) - <i>{focus}</i>", body_style))
        story.append(Paragraph(f"&nbsp;&nbsp;&bull; Priority Focus: <b>{skills}</b>", body_style))
        story.append(Paragraph(f"&nbsp;&nbsp;&bull; Milestone Goal: {phase.get('milestoneGoal', '')}", body_style))
        story.append(Spacer(1, 4))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
