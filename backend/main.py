from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import os
from database import create_db_and_tables
from routers import ambassadors, leads, analytics, admin, auth, documents, notifications
from contextlib import asynccontextmanager
from starlette.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from logging_config import logger
import sentry_sdk

# ── Sentry (error tracking) ─────────────────────────────────────
SENTRY_DSN = os.getenv("SENTRY_DSN", "")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=0.2,   # 20% of requests traced (free-tier friendly)
        environment=os.getenv("ENVIRONMENT", "production"),
    )
    logger.info("Sentry initialized")
else:
    logger.warning("SENTRY_DSN not set — error tracking disabled")

# ── Rate Limiter ─────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
auth.router.state = {"limiter": limiter}  # expose to auth router

# ── App lifespan ─────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting FinConnect API — creating DB tables if needed")
    create_db_and_tables()
    yield
    logger.info("FinConnect API shutting down")

app = FastAPI(
    title="Education Loan Referral API",
    description="FinConnect backend — /docs for Swagger UI",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Rate limit error handler ─────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS — locked to FRONTEND_URL only ──────────────────────────
raw_origins = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
logger.info(f"CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Routers ──────────────────────────────────────────────────────
app.include_router(ambassadors.router)
app.include_router(leads.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(notifications.router)

@app.get("/")
def read_root():
    return {"message": "FinConnect API v1.0 — visit /docs for Swagger UI."}

@app.get("/health")
def health_check():
    return {"status": "ok"}
