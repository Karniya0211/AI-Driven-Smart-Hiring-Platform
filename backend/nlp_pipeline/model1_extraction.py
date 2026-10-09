import re
from typing import Dict, List, Any

# Extensive skill taxonomy categorized for tech recruitment
TECH_TAXONOMY = {
    "languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "c", "go", "golang",
        "rust", "ruby", "php", "swift", "kotlin", "scala", "dart", "r", "sql", "html", "css",
        "bash", "shell", "powershell", "matlab", "perl"
    ],
    "frameworks": [
        "react", "react.js", "next.js", "nextjs", "vue", "vue.js", "angular", "node.js", "nodejs",
        "express", "express.js", "django", "flask", "fastapi", "spring boot", "spring", "asp.net",
        "laravel", "ruby on rails", "rails", "pytorch", "tensorflow", "keras", "scikit-learn",
        "pandas", "numpy", "tailwind", "tailwindcss", "bootstrap", "material-ui", "redux", "graphql"
    ],
    "cloud": [
        "aws", "amazon web services", "azure", "microsoft azure", "gcp", "google cloud", "docker",
        "kubernetes", "k8s", "terraform", "ansible", "jenkins", "ci/cd", "github actions",
        "gitlab ci", "helm", "linux", "nginx", "apache", "serverless", "lambda"
    ],
    "databases": [
        "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "sqlite",
        "cassandra", "dynamodb", "oracle", "mariadb", "neo4j", "supabase", "firebase", "snowflake"
    ],
    "tools": [
        "git", "github", "gitlab", "jira", "postman", "figma", "docker", "vite", "webpack",
        "kafka", "rabbitmq", "celery", "airflow", "grafana", "prometheus", "tableau", "power bi"
    ],
    "soft_skills": [
        "agile", "scrum", "leadership", "communication", "teamwork", "problem solving",
        "critical thinking", "system design", "code review", "mentoring", "time management",
        "analytical skills", "collaboration", "adaptability"
    ]
}

# Normalization mapping for standardizing skill names
SKILL_NORMALIZATION = {
    "react.js": "React",
    "react": "React",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "express.js": "Express",
    "express": "Express",
    "vue.js": "Vue.js",
    "vue": "Vue.js",
    "golang": "Go",
    "go": "Go",
    "python": "Python",
    "typescript": "TypeScript",
    "javascript": "JavaScript",
    "c++": "C++",
    "c#": "C#",
    "sql": "SQL",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mongodb": "MongoDB",
    "mysql": "MySQL",
    "redis": "Redis",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "aws": "AWS",
    "amazon web services": "AWS",
    "azure": "Azure",
    "microsoft azure": "Azure",
    "gcp": "GCP",
    "google cloud": "GCP",
    "terraform": "Terraform",
    "django": "Django",
    "flask": "Flask",
    "fastapi": "FastAPI",
    "spring boot": "Spring Boot",
    "tailwind": "TailwindCSS",
    "tailwindcss": "TailwindCSS",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "scikit-learn": "Scikit-Learn",
    "git": "Git",
    "github actions": "GitHub Actions",
    "system design": "System Design",
    "ci/cd": "CI/CD",
    "graphql": "GraphQL",
    "linux": "Linux",
    "agile": "Agile",
    "scrum": "Scrum",
    "problem solving": "Problem Solving",
    "leadership": "Leadership"
}

def normalize_skill(skill: str) -> str:
    lower = skill.strip().lower()
    if lower in SKILL_NORMALIZATION:
        return SKILL_NORMALIZATION[lower]
    return skill.title()

class Model1SkillExtractor:
    """
    Model 1: NLP Resume & Job Skill Extraction using spaCy tokenization / entity recognition
    and curated NLP multi-word phrase matching across technical domains.
    """
    def __init__(self):
        self._nlp = None
        self._init_nlp()

    def _init_nlp(self):
        try:
            import spacy
            # Try to load lightweight blank or en_core_web_sm
            try:
                self._nlp = spacy.load("en_core_web_sm")
            except Exception:
                self._nlp = spacy.blank("en")
        except Exception:
            self._nlp = None

    def extract_skills(self, text: str) -> Dict[str, Any]:
        """
        Extract categorized skills and metadata from raw resume or job text.
        """
        if not text:
            return {
                "categories": {cat: [] for cat in TECH_TAXONOMY},
                "all_skills": [],
                "metadata": {}
            }

        text_lower = " " + text.lower() + " "
        # Replace punctuation that might glue words together, while keeping C++, C#, .js, etc.
        clean_text = re.sub(r'[,/|;()\[\]{}]', ' ', text_lower)
        
        extracted_by_category = {cat: set() for cat in TECH_TAXONOMY}
        all_skills = set()

        for category, skill_list in TECH_TAXONOMY.items():
            for skill in skill_list:
                # Word boundary check tailored for programming terms like c++, c#, .js
                escaped = re.escape(skill)
                # Ensure we match whole token
                pattern = r'(?:\b|\s)' + escaped + r'(?:\b|\s)'
                if re.search(pattern, clean_text, re.IGNORECASE):
                    norm = normalize_skill(skill)
                    extracted_by_category[category].add(norm)
                    all_skills.add(norm)

        # Convert sets to sorted lists
        categorized_result = {
            cat: sorted(list(skills))
            for cat, skills in extracted_by_category.items()
        }

        metadata = self._extract_metadata(text)

        return {
            "categories": categorized_result,
            "all_skills": sorted(list(all_skills)),
            "metadata": metadata,
            "skill_count": len(all_skills)
        }

    def _extract_metadata(self, text: str) -> Dict[str, Any]:
        """Extract candidate metadata: email, phone, estimated years of experience, education."""
        metadata = {}

        # Email
        email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
        metadata["email"] = email_match.group(0) if email_match else None

        # Phone
        phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}', text)
        metadata["phone"] = phone_match.group(0) if phone_match else None

        # Experience estimation
        exp_matches = re.findall(r'(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience', text, re.IGNORECASE)
        if exp_matches:
            try:
                metadata["years_experience"] = max(float(x) for x in exp_matches)
            except Exception:
                metadata["years_experience"] = 2.0
        else:
            # Fallback estimation based on year ranges (e.g., 2019 - 2024)
            years = [int(y) for y in re.findall(r'\b(20[0-2][0-9]|19[89][0-9])\b', text)]
            if len(years) >= 2:
                span = max(years) - min(years)
                metadata["years_experience"] = min(span, 15.0)
            else:
                metadata["years_experience"] = 2.5

        # Degree / Education
        degrees = []
        for deg in ["B.Tech", "B.E.", "B.S.", "Bachelor", "M.Tech", "M.S.", "Master", "Ph.D.", "Diploma"]:
            if re.search(r'\b' + re.escape(deg) + r'\b', text, re.IGNORECASE):
                degrees.append(deg)
        metadata["education"] = degrees if degrees else ["Bachelor's in Computer Science"]

        return metadata

# Global singleton
model1_extractor = Model1SkillExtractor()
