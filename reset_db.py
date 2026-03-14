import os
import sys
from sqlmodel import Session, SQLModel
# Add current directory to path so we can import backend modules
sys.path.append(os.getcwd())

from backend.database import engine, create_db_and_tables
from backend.models import Admin
from passlib.context import CryptContext

DB_FILE = "database.db"

def reset_database():
    # 1. Drop all tables (works even if file is locked, usually)
    print("Dropping existing tables...")
    try:
        # Import models to ensure they are registered in metadata
        from backend.models import Ambassador, Admin, Lead, Notification, Document
        SQLModel.metadata.drop_all(engine)
        print("Tables dropped.")
    except Exception as e:
        print(f"Error dropping tables: {e}")
        # If dropping fails, likely due to lock, fallback to file deletion attempt (will likely fail too)
        if os.path.exists(DB_FILE):
             try:
                 os.remove(DB_FILE)
                 print(f"Fallback: Removed {DB_FILE}")
             except Exception as dev_null:
                 print(f"CRITICAL: Database is locked by the server. Please stop the backend server and try again.")
                 sys.exit(1)

    # 2. Create Tables
    print("Creating new database schema...")
    try:
        create_db_and_tables()
    except Exception as e:
        print(f"Error creating tables: {e}")
        sys.exit(1)
    
    # 3. Seed Data
    print("Seeding default data...")
    pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
    
    try:
        hashed = pwd_context.hash("admin123")
        admin = Admin(username="admin", password_hash=hashed)
        
        with Session(engine) as session:
            session.add(admin)
            session.commit()
            print("✅ Database reset successfully!")
            print("👉 Default Admin: username='admin', password='admin123'")
            
    except Exception as e:
        print(f"Error seeding data: {e}")

if __name__ == "__main__":
    reset_database()
