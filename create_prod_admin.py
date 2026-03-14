import os
import sys
from sqlmodel import Session, create_engine, select
from passlib.context import CryptContext

# Manually set path to backend for imports
sys.path.append(os.path.abspath('backend'))
from models import Admin

# Setup hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

# Paste your DATABASE_URL here or use env var
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL not found in environment.")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

def create_admin(username, password):
    with Session(engine) as session:
        # Check if exists
        statement = select(Admin).where(Admin.username == username)
        existing = session.exec(statement).first()
        if existing:
            print(f"Admin '{username}' already exists.")
            return

        admin = Admin(
            username=username,
            password_hash=get_password_hash(password)
        )
        session.add(admin)
        session.commit()
        print(f"Successfully created admin: {username}")

if __name__ == "__main__":
    # You can change these
    create_admin("admin", "admin123")
