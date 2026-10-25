from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from app.core.config import settings
from app.api import (
    dashboard,
    diseases,
    cases,
    patients,
    facilities,
    regions,
    lab_reports,
    outbreak_alerts,
    reports,
    database_insights
)

app = FastAPI(
    title="Disease Surveillance and Epidemiology Database API",
    description="Academic DBMS Project REST API connecting React frontend to MySQL 8.0/MariaDB InnoDB database.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local Vite dev server and phpMyAdmin test origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Timing Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

# Include Sub-Routers
app.include_router(dashboard.router)
app.include_router(diseases.router)
app.include_router(cases.router)
app.include_router(patients.router)
app.include_router(facilities.router)
app.include_router(regions.router)
app.include_router(lab_reports.router)
app.include_router(outbreak_alerts.router)
app.include_router(reports.router)
app.include_router(database_insights.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Disease Surveillance & Epidemiology Database API",
        "database": settings.DB_NAME,
        "environment": settings.APP_ENV
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=True)
