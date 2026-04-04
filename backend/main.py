from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from loguru import logger

# Global service instances (mock)
detection_service = None
ecosystem_service = None
wave_service = None
alert_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup services on startup/shutdown"""
    global detection_service, ecosystem_service, wave_service, alert_service

    logger.info("Starting Marine Debris Monitoring System (Demo Mode)...")

    # Mock services - no heavy ML dependencies
    detection_service = {"status": "mock"}
    ecosystem_service = {"status": "mock"}
    wave_service = {"status": "mock"}
    alert_service = {"status": "mock"}

    logger.info("All services initialized successfully (Mock Mode)")

    yield

    # Cleanup
    logger.info("Shutting down services...")

# Create FastAPI application
app = FastAPI(
    title="Marine Debris Monitoring API",
    version="1.0.0",
    description="AI-Powered Marine Debris Detection and Ecosystem Monitoring System (Demo)",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock API endpoints
@app.get("/")
async def root():
    return {"message": "Marine Debris Monitoring API", "status": "running", "mode": "demo"}

@app.get("/health")
async def health():
    return {"status": "healthy", "services": ["detection", "ecosystem", "wave", "alert"]}

@app.post("/api/detect")
async def detect_debris():
    """Mock debris detection endpoint"""
    return {
        "success": True,
        "results": {
            "debris_count": 42,
            "coverage_percentage": 15.7,
            "confidence": 87.3,
            "composition": [
                {"type": "plastic", "percentage": 45.2},
                {"type": "metal", "percentage": 23.1},
                {"type": "organic", "percentage": 31.7}
            ]
        }
    }

@app.get("/api/beaches")
async def get_beaches():
    """Mock beaches endpoint"""
    return {
        "beaches": [
            {"id": "marina-beach", "name": "Marina Beach", "country": "India", "risk": "high"},
            {"id": "bondi-beach", "name": "Bondi Beach", "country": "Australia", "risk": "medium"}
        ]
    }

@app.get("/api/ecosystem/{beach_id}")
async def get_ecosystem_data(beach_id: str):
    """Mock ecosystem data endpoint"""
    return {
        "beach_id": beach_id,
        "health_score": 8.2,
        "water_quality": 85.3,
        "biodiversity": 72.1,
        "coral_health": 68.9
    }

@app.get("/api/alerts")
async def get_alerts():
    """Mock alerts endpoint"""
    return {
        "alerts": [
            {
                "id": "1",
                "type": "critical",
                "title": "High Debris Concentration",
                "message": "Critical debris levels detected",
                "location": "Marina Beach, India",
                "timestamp": "2024-01-15T10:30:00Z"
            }
        ]
    }

if __name__ == "__main__":
    logger.info("Starting server on http://localhost:8002")
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8002,
        reload=True,
        log_level="info"
    )
