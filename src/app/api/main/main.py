from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
import sys

# Configure logging for production
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    from .config.settings import settings
    from .routes import campaigns, claims, health, upload, contact, entertainment, pear, tiktokverify
    logger.info("Successfully imported all modules")
except ImportError as e:
    logger.error(f"Import error: {e}")
    # Create minimal settings if import fails
    class MinimalSettings:
        API_TITLE = "Campaign API"
        API_VERSION = "1.0.0"
        ALLOWED_ORIGINS = ["*"]  # Allow all origins as fallback
    settings = MinimalSettings()

# Initialize FastAPI app
app = FastAPI(
    title=getattr(settings, 'API_TITLE', 'Campaign API'),
    version=getattr(settings, 'API_VERSION', '1.0.0'),
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=getattr(settings, 'ALLOWED_ORIGINS', ["*"]),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add error handler for deployment
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}")
    return {"error": "Internal server error", "detail": str(exc)}

# Include routers with error handling
try:
    app.include_router(health.router, tags=["health"])
    app.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
    app.include_router(upload.router, tags=["upload"])
    app.include_router(contact.router, prefix="/contact", tags=["contact"])
    app.include_router(claims.router, tags=["claims"])
    app.include_router(entertainment.router, prefix="/entertainment-live", tags=["entertainment-live"])
    app.include_router(pear.router, prefix="/pear", tags=["pear"])
    app.include_router(tiktokverify.router, prefix="/tiktokverification", tags=["tiktokverification"])
    app.include_router(campaigns.router, tags=["brand-campaigns"])
    logger.info("Successfully included all routers")
except Exception as e:
    logger.error(f"Error including routers: {e}")

@app.get("/")
async def root():
    """Root endpoint for the API."""
    return {
        "message": "Welcome to the Campaign API",
        "version": getattr(settings, 'API_VERSION', '1.0.0'),
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

# Health check for App Engine
@app.get("/_ah/health")
async def app_engine_health():
    """App Engine health check endpoint."""
    return {"status": "healthy"}
