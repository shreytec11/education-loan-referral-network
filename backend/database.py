from sqlmodel import SQLModel, create_engine, Session
import os

# Use SQLite for local development by default, but allow override via environment variable for production (Supabase)
DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    # Get the absolute path to the root directory
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DB_PATH = os.path.join(BASE_DIR, "database.db")
    DATABASE_URL = f"sqlite:///{DB_PATH}"

# PostgreSQL (Supabase) and SQLite need different connect_args
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # For PostgreSQL (Production), we don't need check_same_thread
    connect_args = {}

engine = create_engine(DATABASE_URL, echo=True, connect_args=connect_args)

def get_session():
    with Session(engine) as session:
        yield session

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
