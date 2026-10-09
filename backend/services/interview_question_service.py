import os
import random
import re

QUESTION_BANK = {
    "Senior ML Engineer": {
        "technical": [
            "Describe a machine learning project where you optimized model performance. What techniques did you use?",
            "How would you deploy a machine learning model in production? What considerations matter most?",
            "Explain how you monitor ML models in production and handle model drift.",
            "How do you decide when to retrain or replace a model in production?",
        ],
        "behavioral": [
            "Tell me about a time you explained complex ML concepts to non-technical stakeholders.",
            "Describe a situation where you collaborated with cross-functional teams to deliver an ML solution.",
            "Tell us about a time you improved the reliability of an ML system.",
        ],
        "scenario": [
            "A production model's precision drops suddenly. Walk through your investigation.",
            "A feature pipeline starts returning stale features in production. What do you check first?",
        ],
        "hr": [
            "What kind of ML problems are you most motivated to solve?",
            "How do you balance experimentation with production reliability?",
        ],
    },
    "Data Scientist": {
        "technical": [
            "Walk me through your approach to feature engineering.",
            "How do you select evaluation metrics for classification problems?",
            "Explain how you would handle imbalanced datasets.",
            "Describe how you validate a model before production release.",
        ],
        "behavioral": [
            "Describe a time you had to defend your data-driven insights.",
            "How do you prioritize tasks when working on multiple projects?",
            "Tell us about a time your analysis changed a product decision.",
        ],
        "scenario": [
            "A stakeholder challenges your model results in a review. How do you respond?",
            "Two dashboards show different revenue totals. How do you reconcile them?",
        ],
        "hr": [
            "Why does this data science role interest you?",
            "What analysis workflow helps you stay productive and accurate?",
        ],
    },
    "Software Engineer": {
        "technical": [
            "How would you design a reliable service that handles a sudden traffic spike?",
            "What trade-offs do you consider when choosing a database?",
            "Describe how you structure API contracts in large systems.",
        ],
        "behavioral": [
            "Describe a difficult code review and how you handled it.",
            "Tell us about a time you influenced a technical decision with limited context.",
        ],
        "scenario": [
            "A release causes elevated error rates. What do you do first?",
            "A database query times out under load. What steps do you take?",
        ],
        "hr": [
            "What engineering environment helps you do your best work?",
            "What kind of technical systems do you enjoy building most?",
        ],
    },
    "Python Developer": {
        "technical": [
            "What makes Python code maintainable in a large application?",
            "How would you improve the performance of a slow Python endpoint?",
            "How do you structure asynchronous work in Python safely?",
        ],
        "behavioral": [
            "Tell us about a Python project you improved over time.",
            "Describe a time you helped a team adopt better development practices.",
        ],
        "scenario": [
            "A background Python job leaks memory. How would you debug it?",
            "A dependency update breaks a production service. How do you respond?",
        ],
        "hr": [
            "What do you enjoy building with Python?",
            "How do you keep learning as Python tooling evolves?",
        ],
    },
    "Data Analyst": {
        "technical": [
            "How do you check a dataset for quality issues before analysis?",
            "Explain how you would communicate a trend to a non-technical audience.",
            "How do you choose the right metric for a business question?",
        ],
        "behavioral": [
            "Tell us about a time your analysis uncovered an unexpected insight.",
            "Describe a situation where you had to explain a difficult recommendation.",
        ],
        "scenario": [
            "Two dashboards show different revenue totals. How do you reconcile them?",
            "A KPI drops sharply after a product rollout. What do you analyze?",
        ],
        "hr": [
            "Why do you want to work as a data analyst?",
            "How do you balance speed with analytical rigor?",
        ],
    },
    "Full Stack Developer": {
        "technical": [
            "How do you design an API contract between a frontend and backend?",
            "How do you secure a full-stack application?",
            "What do you monitor to keep a distributed application stable?",
        ],
        "behavioral": [
            "Describe a feature you delivered across the full stack.",
            "Tell us about a time you worked across product and engineering teams.",
        ],
        "scenario": [
            "The UI is fast locally but slow in production. How do you investigate?",
            "A front-end release causes broken records in the backend. How do you fix it?",
        ],
        "hr": [
            "Which part of full-stack work do you want to deepen?",
            "What types of customer-facing product problems motivate you?",
        ],
    },
    "AI Engineer": {
        "technical": [
            "How would you evaluate a retrieval-augmented generation system?",
            "What safeguards should surround an AI feature in production?",
            "How do you measure quality for an LLM-based product?",
        ],
        "behavioral": [
            "Tell us about a time you explained an AI limitation to a stakeholder.",
            "Describe a time you improved a model workflow in a cross-functional team.",
        ],
        "scenario": [
            "An AI feature produces inconsistent answers. How would you improve it?",
            "A prompt-based assistant starts giving unsafe recommendations. What do you do?",
        ],
        "hr": [
            "What responsible AI principle matters most to you?",
            "How do you balance innovation speed with reliability?",
        ],
    },
    "Frontend Developer": {
        "technical": [
            "How do you improve the accessibility and performance of a React interface?",
            "How do you decide where frontend state should live?",
            "What patterns do you use to keep complex UI code maintainable?",
        ],
        "behavioral": [
            "Tell us about a UI decision you changed after user feedback.",
            "Describe a time you handled conflicting stakeholder preferences in design.",
        ],
        "scenario": [
            "A page layout breaks on mobile only. Describe your debugging process.",
            "A feature works for power users but confuses new users. What do you do?",
        ],
        "hr": [
            "What makes a frontend experience feel excellent to you?",
            "How do you choose priorities when product requirements conflict?",
        ],
    },
    "Backend Developer": {
        "technical": [
            "How do you design an API for consistency, observability, and backward compatibility?",
            "What techniques do you use to make database access efficient?",
            "How do you handle long-running jobs and retries in backend services?",
        ],
        "behavioral": [
            "Tell us about a backend incident and what you learned.",
            "Describe a time you improved a team’s operational reliability.",
        ],
        "scenario": [
            "A database query times out under load. What steps do you take?",
            "An API client keeps receiving 429 errors in production. How do you respond?",
        ],
        "hr": [
            "What backend systems would you like to work on next?",
            "How do you balance shipping speed with service durability?",
        ],
    },
    "DevOps Engineer": {
        "technical": [
            "How would you design a deployment pipeline with safe rollback?",
            "Which signals do you use to assess service health?",
            "How do you secure access and secrets in a multi-environment deployment setup?",
        ],
        "behavioral": [
            "Tell us about a time you reduced operational risk.",
            "Describe a situation where you helped a team recover from a service outage.",
        ],
        "scenario": [
            "A deployment fails halfway through. How do you restore service safely?",
            "A critical service spikes to 100% CPU in production. What is your response plan?",
        ],
        "hr": [
            "What attracts you to platform and reliability work?",
            "How do you keep operational work sustainable for a team?",
        ],
    },
}

ROLE_ALIASES = {
    "technical": "technical",
    "behavioral": "behavioral",
    "scenario": "scenario",
    "scenario-based": "scenario",
    "scenario based": "scenario",
    "hr": "hr",
    "human resources": "hr",
}


def _normalize_question_type(question_type):
    if isinstance(question_type, (list, tuple, set)):
        if not question_type:
            raise ValueError("At least one question category is required")
        return [ROLE_ALIASES.get(str(item).strip().lower().replace("-", " ").replace("_", " "), str(item).strip().lower()) for item in question_type]

    if question_type is None:
        raise ValueError("Question type is required")

    normalized = str(question_type).strip().lower().replace("-", " ").replace("_", " ")
    key = ROLE_ALIASES.get(normalized)
    if not key:
        raise ValueError(f"Unsupported question type: {question_type}")
    return key


def _normalize_role(job_role):
    if not job_role or not str(job_role).strip():
        raise ValueError("Job role is required")
    normalized = str(job_role).strip()
    if normalized not in QUESTION_BANK:
        raise ValueError(f"Unsupported job role: {job_role}")
    return normalized


def _build_mcq(question_text, correct_option, role=None, category="technical", index=0):
    option_map = {
        "technical": [
            "Apply targeted debugging and validate the root cause with evidence.",
            "Use a broader rollout without checking the signal first.",
            "Increase uncertainty by removing the safeguards in place.",
            "Skip validation and rely on intuition alone."
        ],
        "behavioral": [
            "Explain the situation clearly, describe the trade-offs, and show the result you achieved.",
            "Avoid discussion and move forward without documenting the context.",
            "Focus only on the problem without describing your role.",
            "Blame the process instead of describing what you learned."
        ],
        "scenario": [
            "Start with the most likely root cause and validate with data before acting.",
            "Ignore the evidence and make a guess without checking metrics.",
            "Wait for the issue to resolve itself without monitoring.",
            "Change several unrelated things at once to reduce the risk of a single cause."
        ],
        "hr": [
            "Discuss your goals, strengths, and how your experience aligns with the role.",
            "Only mention personal preferences without any evidence.",
            "Keep the answer vague so it applies to every role.",
            "Avoid talking about your motivations or work style."
        ],
    }

    options = {"A": option_map.get(category, option_map["technical"])[0], "B": option_map.get(category, option_map["technical"])[1], "C": option_map.get(category, option_map["technical"])[2], "D": option_map.get(category, option_map["technical"])[3]}

    correct_key = str(correct_option or "B").upper()
    if correct_key not in options:
        correct_key = "B"

    order = ["A", "B", "C", "D"]
    random.shuffle(order)
    while order[0] == correct_key:
        random.shuffle(order)

    final_options = {}
    for letter in order:
        final_options[letter] = options.get(letter, options[correct_key])
    if correct_key not in final_options:
        final_options[correct_key] = options[correct_key]

    ordered = {"A": final_options.get("A", options["A"]), "B": final_options.get("B", options["B"]), "C": final_options.get("C", options["C"]), "D": final_options.get("D", options["D"])}
    return {"question_text": question_text, "options": ordered, "correct_answer": correct_key}


def generate_questions(job_role, question_type="technical", num_questions=3):
    role = _normalize_role(job_role)
    categories = question_type
    if isinstance(question_type, (list, tuple, set)):
        categories = list(question_type)
    else:
        categories = [question_type]

    if not categories:
        raise ValueError("Choose at least one question category")

    try:
        requested_count = int(num_questions)
    except (TypeError, ValueError):
        raise ValueError("Question count must be an integer")

    if requested_count < 1 or requested_count > 20:
        raise ValueError("Choose a question count between 1 and 20")

    selected = []
    seen = set()
    seed_categories = []
    for category in categories:
        normalized = _normalize_question_type(category)
        values = [normalized] if isinstance(normalized, str) else normalized
        for item in values:
            seed_categories.append(item)
            for question in QUESTION_BANK[role].get(item, []):
                if question in seen:
                    continue
                seen.add(question)
                mcq = _build_mcq(question, "B", role, item)
                selected.append({
                    "job_role": role,
                    "category": item,
                    "question_text": mcq["question_text"],
                    "options": mcq["options"],
                    "correct_answer": mcq["correct_answer"]
                })

    practice_contexts = [
        "designing a new feature",
        "responding to a production issue",
        "reviewing an unfamiliar codebase",
        "planning a risky change",
        "handling a tight deadline",
        "improving system reliability",
        "evaluating a technical trade-off",
        "communicating an unexpected result",
        "working across team boundaries",
        "validating an important assumption",
        "prioritizing competing requests",
        "responding to user feedback",
        "investigating a security concern",
        "planning a gradual migration",
        "recovering from a failed release",
        "explaining a complex decision",
        "reducing operational risk",
        "making a data-informed recommendation",
        "improving an existing workflow",
        "learning an unfamiliar technology",
    ]

    fallback_index = 0
    while len(selected) < requested_count:
        fallback = seed_categories[fallback_index % len(seed_categories)]
        context = practice_contexts[fallback_index % len(practice_contexts)]
        text = f"Which response best demonstrates strong {fallback} judgment when {context} in a {role} role?"
        generated = _build_mcq(text, "B", role, fallback, fallback_index)
        selected.append({
            "job_role": role,
            "category": fallback,
            "question_text": generated["question_text"],
            "options": generated["options"],
            "correct_answer": generated["correct_answer"]
        })
        fallback_index += 1

    random.shuffle(selected)
    if len(selected) < requested_count:
        raise ValueError(f"Unable to generate {requested_count} unique questions for {role}")
    return selected[:requested_count]


def generate_ai_questions(job_role, question_type="technical", num_questions=3, candidate_resume=None, job_description=None, difficulty="medium"):
    role = _normalize_role(job_role)
    q_type = _normalize_question_type(question_type)
    requested_count = int(num_questions)

    if requested_count < 1 or requested_count > 20:
        raise ValueError("Question count must be between 1 and 20")

    rule_based = generate_questions(role, q_type, requested_count)
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY")
    provider = os.getenv("LLM_PROVIDER") or os.getenv("AI_PROVIDER") or ""

    if api_key and provider:
        return {
            "provider": "llm",
            "llm_configured": True,
            "job_role": role,
            "question_type": q_type,
            "difficulty": difficulty,
            "questions": rule_based,
            "candidate_resume": candidate_resume,
            "job_description": job_description,
        }

    return {
        "provider": "rule_based_question_bank",
        "llm_configured": False,
        "job_role": role,
        "question_type": q_type,
        "difficulty": difficulty,
        "questions": rule_based,
        "candidate_resume": candidate_resume,
        "job_description": job_description,
    }


def evaluate_answer(question, answer):
    answer_text = (answer or "").strip()
    words = answer_text.split()
    word_count = len(words)
    stop_words = {"about", "after", "also", "approach", "describe", "does", "from", "have", "into", "that", "their", "them", "then", "there", "these", "they", "this", "through", "what", "when", "where", "which", "with", "would", "your"}
    question_terms = {term for term in re.findall(r"[a-zA-Z0-9+#.]+", (question or "").lower()) if len(term) > 3 and term not in stop_words}
    answer_terms = {term for term in re.findall(r"[a-zA-Z0-9+#.]+", answer_text.lower()) if len(term) > 3 and term not in stop_words}
    relevance = len(question_terms & answer_terms) / max(len(question_terms), 1)
    completeness = min(word_count / 45, 1)
    structure_markers = {"because", "first", "then", "finally", "result", "measure", "trade-off", "tradeoff", "validate", "example"}
    structure = min(len(answer_terms & structure_markers) / 2, 1)
    clarity = min(word_count / 25, 1)
    score = max(1, min(10, round(2 + relevance * 4 + completeness * 2 + structure + clarity))) if word_count else 1

    strengths = []
    if relevance >= 0.2:
        strengths.append("The response addresses terminology from the question.")
    if word_count >= 25:
        strengths.append("The response includes enough detail to assess the candidate's approach.")
    if structure >= 0.5:
        strengths.append("The response describes reasoning, validation, or outcomes.")
    improvements = []
    if relevance < 0.2:
        improvements.append("Tie the response more directly to the technical or role-specific question.")
    if completeness < 0.7:
        improvements.append("Add a concrete example and enough detail to explain the approach.")
    if structure < 0.5:
        improvements.append("Explain the reasoning, validation steps, and result in a clearer sequence.")
    if not strengths:
        strengths.append("A response was submitted for review.")
    if not improvements:
        improvements.append("Add measurable outcomes or trade-offs to make the explanation more specific.")
    feedback = f"Role-related relevance: {round(relevance * 100)}%; completeness: {round(completeness * 100)}%; clarity: {round(clarity * 100)}%; structure and problem-solving evidence: {round(structure * 100)}%."

    return {
        "score": score,
        "strengths": strengths,
        "improvements": improvements,
        "feedback": feedback,
        "follow_up_question": "What evidence or outcome would you use to validate this approach?" if structure < 0.5 else "What trade-off did you consider, and how did you validate the result?",
        "available": True,
        "method": "rule_based",
        "relevance": round(relevance * 100),
        "completeness": round(completeness * 100),
        "clarity": round(clarity * 100),
        "structure": round(structure * 100),
    }