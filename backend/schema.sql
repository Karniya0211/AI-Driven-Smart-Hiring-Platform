-- PostgreSQL Production Database Schema
-- AI Skill Resume Matcher & Recommender

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'candidate', -- 'candidate' or 'recruiter'
    constraints_json TEXT DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(255),
    summary TEXT,
    years_experience NUMERIC(4, 1) DEFAULT 0.0,
    target_role VARCHAR(255),
    raw_resume_text TEXT,
    resume_filename VARCHAR(255),
    extracted_skills_json TEXT DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_postings (
    id SERIAL PRIMARY KEY,
    recruiter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    experience_level VARCHAR(100) DEFAULT 'Mid-Senior',
    job_type VARCHAR(50) DEFAULT 'Full-time',
    salary_range VARCHAR(100),
    description TEXT NOT NULL,
    required_skills_json TEXT DEFAULT '[]',
    preferred_skills_json TEXT DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    match_score NUMERIC(5, 2) DEFAULT 0.0,
    compatibility_breakdown_json TEXT DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'reviewed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skill_taxonomy (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Languages', 'Frameworks', 'Cloud', 'Databases', 'Tools', 'SoftSkills'
    aliases_json TEXT DEFAULT '[]',
    importance_weight NUMERIC(3, 2) DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS course_recommendations (
    id SERIAL PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    duration VARCHAR(50) DEFAULT '4-6 weeks',
    level VARCHAR(50) DEFAULT 'Intermediate',
    rating NUMERIC(2, 1) DEFAULT 4.8,
    certification_offered VARCHAR(50) DEFAULT 'Yes'
);

CREATE TABLE IF NOT EXISTS interview_questions (
    id SERIAL PRIMARY KEY,
    job_role VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interview_sessions (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES job_postings(id) ON DELETE SET NULL,
    job_role VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_questions INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS interview_responses (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES interview_questions(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    candidate_answer TEXT NOT NULL,
    feedback_json TEXT DEFAULT '{}',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_interview_response_question UNIQUE (session_id, question_id)
);

CREATE TABLE IF NOT EXISTS ats_interviews (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES interview_sessions(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid querying & matching
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user_id ON candidate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_recruiter_id ON job_postings(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_course_recommendations_skill_name ON course_recommendations(skill_name);
CREATE INDEX IF NOT EXISTS idx_interview_questions_role_category ON interview_questions(job_role, category);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate ON interview_sessions(candidate_id, status);
CREATE INDEX IF NOT EXISTS idx_interview_responses_session ON interview_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_ats_interviews_application ON ats_interviews(application_id, status);
