from fastapi import FastAPI
import os
from .database import create_db_and_tables
from .routers import ambassadors, leads, analytics, admin, auth, documents, notifications
from contextlib import asynccontextmanager

# Trigger reload (argon2 installed in venv)
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

from starlette.middleware.cors import CORSMiddleware

app = FastAPI(title="Education Loan Referral API", lifespan=lifespan)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_URL", "http://localhost:3000").split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ambassadors.router)
app.include_router(leads.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(notifications.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Education Loan Referral API. Visit /docs for Swagger UI."}
