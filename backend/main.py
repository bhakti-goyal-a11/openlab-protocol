import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, SessionLocal, Base
import models
import seed
from routers import (
    auth_routes,
    trustpass_routes,
    equipment_routes,
    booking_routes,
    handover_routes,
    ledger_routes,
    analytics_routes
)

# Ensure upload directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create DB tables and seed if empty
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed.seed_database(db)
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title="OPENLAB TRUSTX – Campus Resource Governance & Trust Platform",
    description="AI-Assisted Pure-Software Governance Protocol for Institutional Equipment & Specialized Labs",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded inspection photographs statically
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Core Platform Routers
app.include_router(auth_routes.router)
app.include_router(trustpass_routes.router)
app.include_router(equipment_routes.router)
app.include_router(booking_routes.router)
app.include_router(handover_routes.router)
app.include_router(ledger_routes.router)
app.include_router(analytics_routes.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "OPENLAB TRUSTX",
        "protocol_version": "1.0.0",
        "architecture": "100% Pure Software Governance Layer (Zero Hardware Dependencies)"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
