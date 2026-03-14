from sqlmodel import SQLModel, create_engine, Session
import os

# Use SQLite for local development, can be swapped for PostgreSQL
# Get the absolute path to the root directory (one level up from this file)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "database.db")

# Use SQLite for local development
DATABASE_URL = f"sqlite:///{DB_PATH}"
# For PostgreSQL: "postgresql://user:password@localhost/dbname"

connect_args = {"check_same_thread": False}
engine = create_engine(DATABASE_URL, echo=True, connect_args=connect_args)

def get_session():
    with Session(engine) as session:
        yield session

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
