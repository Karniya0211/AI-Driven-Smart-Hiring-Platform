# 🤖 AI Skill Resume Matcher & Recommender

An AI-powered recruitment platform that analyzes resumes, matches candidates with suitable jobs, identifies skill gaps, and provides personalized career recommendations.

## ✨ Features

* 📄 **Resume Analysis** – Extract skills and information from resumes using NLP.
* 🎯 **Job Matching** – Match candidate profiles with job requirements using TF-IDF and Cosine Similarity.
* 📊 **Skill Gap Analysis** – Identify missing skills and areas for improvement.
* 📚 **Career Recommendations** – Suggest learning resources and career roadmaps.
* 👤 **Candidate Dashboard** – View skills, matching scores, job recommendations, and reports.
* 🏢 **Recruiter Dashboard** – Manage candidates and track recruitment progress.
* 📋 **Applicant Tracking System (ATS)** – Track candidates through recruitment stages.
* 🎤 **AI Interview Assistance** – Generate interview questions and provide feedback.
* 🗣️ **Voice-Based Screening** – Support spoken interview responses.
* 📈 **Analytics Dashboard** – Visualize recruitment data and candidate insights.

## 🛠️ Tech Stack

| Component  | Technologies              |
| ---------- | ------------------------- |
| Frontend   | React, Tailwind CSS       |
| Animations | Framer Motion             |
| Charts     | Recharts                  |
| Backend    | Python, Flask             |
| Database   | PostgreSQL                |
| NLP        | spaCy, Hugging Face       |
| Matching   | TF-IDF, Cosine Similarity |

## 🔄 ML Pipeline

```text
Resume + Job Description
          ↓
   Text Preprocessing
          ↓
 Model 1: Skill Extraction
          ↓
 Model 2: Candidate-Job Matching
          ↓
 Model 3: Skill Gap Analysis
          ↓
 Recommendations & Career Roadmap
          ↓
 Candidate and Recruiter Dashboards
```

## ⚙️ Installation

### Prerequisites

* Node.js and npm
* Python 3.10+
* PostgreSQL
* Git

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <your-project-folder>
```

### 2. Set Up the Backend

Navigate to your backend directory:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows:**

```bash
venv\Scripts\activate
```

**Linux/macOS:**

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure your database connection and other required environment variables using a `.env` file.

Start the Flask server using your project's configured entry point.

### 3. Set Up the Frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

The frontend development URL is typically:

```text
http://localhost:5173
```

The actual URL may vary depending on your configuration.

## 🔐 Environment Variables

Create a `.env` file in the appropriate backend directory and configure the variables required by your application.

Example:

```env
DATABASE_URL=your_postgresql_connection_string
SECRET_KEY=your_secret_key
FLASK_DEBUG=False
```

Add any additional API keys or service configuration required by your implementation.

**Security:** Never commit passwords, secret keys, database credentials, or API keys to GitHub.

## 🗄️ Database

PostgreSQL stores application data such as user accounts, candidate information, resumes, and recruitment records, depending on the implemented database schema.

## 🚀 Project Workflow

1. Register and log in as a candidate or recruiter.
2. Upload a resume and extract relevant skills.
3. Compare candidate skills with job requirements.
4. Generate a job-matching score.
5. Identify missing skills and provide recommendations.
6. Support interview preparation and screening.
7. Allow recruiters to manage candidates through recruitment stages.
8. Display relevant results and analytics on the dashboards.

## 🎯 Project Goals

* Reduce manual resume-screening effort.
* Improve candidate-job matching.
* Help candidates identify and address skill gaps.
* Streamline recruitment and interview workflows.
* Support data-driven recruitment decisions while keeping final hiring decisions with recruiters.

## 🔮 Future Enhancements

* Improve AI-powered voice screening.
* Enhance matching accuracy.
* Expand recruitment analytics.
* Optimize application performance.
* Deploy the platform for production use.

## 🤝 Contributing

Contributions, suggestions, and feedback are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Submit a pull request.

## 📄 License

Choose an appropriate open-source license for your project before publishing it.

---

**Developed as an AI-powered recruitment project.** 💙
