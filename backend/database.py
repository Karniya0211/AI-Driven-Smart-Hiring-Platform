import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Support PostgreSQL via environment variable, falling back gracefully to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///resume_matcher.db")

# Fix for Heroku/Render postgres:// vs postgresql:// dialect naming if applicable
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    import models  # import to ensure models are registered
    Base.metadata.create_all(bind=engine)
    try:
        if engine.dialect.name == "sqlite":
            migrations = {
                "users": {
                    "constraints_json": "TEXT DEFAULT '{}'",
                    "saved_state_json": "TEXT DEFAULT '{}'",
                },
                "candidate_profiles": {"saved_pipeline_json": "TEXT DEFAULT '{}'"},
                "candidates": {"recruiter_id": "INTEGER REFERENCES users(id)"},
                "interview_questions": {
                    "options_json": "TEXT DEFAULT '{}'",
                    "correct_answer": "TEXT",
                },
                "interview_sessions": {
                    "interview_type": "VARCHAR(40) NOT NULL DEFAULT 'practice'",
                    "questions_json": "TEXT NOT NULL DEFAULT '[]'",
                },
            }
            with engine.begin() as conn:
                for table, columns in migrations.items():
                    existing = {column["name"] for column in inspect(engine).get_columns(table)}
                    for name, definition in columns.items():
                        if name not in existing:
                            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {definition}"))
        elif engine.dialect.name == "postgresql":
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS questions_json TEXT NOT NULL DEFAULT '[]'"))
                conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS interview_type VARCHAR(40) NOT NULL DEFAULT 'practice'"))
                conn.execute(text("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS recruiter_id INTEGER REFERENCES users(id)"))
    except Exception as e:
        print(f"Auto-migration note: {e}")
