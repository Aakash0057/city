import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import SessionLocal, engine, Base
from app.routers import auth, activity
from seed import seed_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("citycare")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and auto-seed if empty
    logger.info("Verifying database schema and seeding data if empty...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db, force=False)
    finally:
        db.close()
    yield
    logger.info("Shutting down CityCare API...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CityCare Hospital Full-Stack Medical & Healthcare API",
    lifespan=lifespan
)

# CORS setup
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [o.strip() for o in origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount core routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(activity.router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "hospital": settings.PROJECT_NAME,
        "status": "online",
        "version": settings.VERSION,
        "docs": "/docs"
    }


@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "CityCare Backend API"}
