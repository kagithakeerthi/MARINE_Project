"""
Production Service Integration Guide
Step-by-step instructions to connect real services to FastAPI backend
"""

# ============================================================
# STEP 1: Install Production Requirements
# ============================================================
# Run in terminal:
# pip install -r requirements-production.txt

# This will install:
# - torch & ultralytics (YOLOv8)
# - sqlalchemy & asyncpg (Database)
# - aiohttp & httpx (Real APIs)
# - loguru (Logging)


# ============================================================
# STEP 2: Create Configuration File
# ============================================================
# File: backend/config/production_settings.py

from pydantic_settings import BaseSettings
from typing import Optional

class ProductionSettings(BaseSettings):
    """Production configuration for real services"""
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./marine_debris.db"
    # For PostgreSQL: "postgresql+asyncpg://user:pass@localhost/marine_debris"
    
    # Satellite APIs
    copernicus_username: Optional[str] = None
    copernicus_password: Optional[str] = None
    usgs_username: Optional[str] = None
    usgs_password: Optional[str] = None
    
    # YOLOv8 Model
    model_path: str = "yolov8n.pt"  # nano model (fast), upgrade to yolov8s.pt for accuracy
    detection_device: Optional[str] = None  # auto-detect or 'cuda'/'cpu'
    
    # Caching
    redis_url: str = "redis://localhost:6379"
    wave_cache_ttl: int = 3600  # 1 hour
    satellite_cache_ttl: int = 86400  # 24 hours
    
    model_config = {"env_file": ".env"}

# Usage:
# settings = ProductionSettings()
# print(settings.database_url)


# ============================================================
# STEP 3: Updated Backend Main Application
# ============================================================
# File: backend/main.py

import asyncio
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import io
import uuid
from datetime import datetime, timedelta

# Import production services
from backend.services.real_detection_service import RealDebrisDetectionService
from backend.services.real_satellite_service import RealSatelliteService
from backend.services.real_wave_service import RealWaveService
from backend.services.database_service import ProductionDatabase
from backend.config.production_settings import ProductionSettings

# Initialize FastAPI
app = FastAPI(
    title="Marine Debris Monitoring - Production",
    description="Real-time satellite-based debris detection",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load configuration
settings = ProductionSettings()

# Global service instances
detector: RealDebrisDetectionService = None
satellite_service: RealSatelliteService = None
wave_service: RealWaveService = None
db_service: ProductionDatabase = None


# ============================================================
# Startup & Shutdown
# ============================================================

@app.on_event("startup")
async def startup_event():
    """Initialize all production services on startup"""
    global detector, satellite_service, wave_service, db_service
    
    logger.info("🚀 Starting Marine Debris Monitoring Production System")
    
    try:
        # Initialize ML detector
        logger.info(f"Loading YOLOv8 model: {settings.model_path}")
        detector = RealDebrisDetectionService(
            model_path=settings.model_path,
            device=settings.detection_device
        )
        
        # Initialize satellite service
        logger.info("Initializing satellite service (Copernicus & USGS)")
        satellite_service = RealSatelliteService(
            copernicus_user=settings.copernicus_username,
            copernicus_password=settings.copernicus_password,
            usgs_username=settings.usgs_username,
            usgs_password=settings.usgs_password
        )
        await satellite_service.initialize()
        
        # Initialize wave service
        logger.info("Initializing wave data service (Open-Meteo & NOAA)")
        wave_service = RealWaveService(cache_ttl=settings.wave_cache_ttl)
        await wave_service.initialize()
        
        # Initialize database
        logger.info(f"Connecting to database: {settings.database_url.split('://')[0]}")
        db_service = ProductionDatabase(database_url=settings.database_url)
        await db_service.initialize()
        
        logger.info("✅ All production services initialized successfully")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global detector, satellite_service, wave_service, db_service
    
    logger.info("🛑 Shutting down Marine Debris Monitoring System")
    
    if satellite_service:
        await satellite_service.shutdown()
    if wave_service:
        await wave_service.shutdown()
    if db_service:
        await db_service.shutdown()
    
    logger.info("Shutdown complete")


# ============================================================
# Health Check
# ============================================================

@app.get("/health")
async def health_check():
    """System health status"""
    return {
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "detector": "ready" if detector and detector.initialized else "unavailable",
            "satellite_api": "ready" if satellite_service else "unavailable",
            "wave_api": "ready" if wave_service else "unavailable",
            "database": "ready" if db_service else "unavailable"
        }
    }


# ============================================================
# Real Debris Detection Endpoints
# ============================================================

@app.post("/api/detect/image")
async def detect_debris_from_image(
    file: UploadFile = File(...),
    latitude: float = None,
    longitude: float = None
):
    """
    Detect debris in uploaded satellite image
    
    Args:
        file: Satellite image (PNG, JPG, TIFF)
        latitude: Optional location latitude
        longitude: Optional location longitude
        
    Returns:
        Detection results with confidence scores
    """
    try:
        if not detector or not detector.initialized:
            raise HTTPException(status_code=503, detail="ML detector unavailable")
        
        # Read image
        contents = await file.read()
        import cv2
        import numpy as np
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Run detection
        detection_id = f"det_{uuid.uuid4().hex[:12]}"
        results = await detector.detect(image)
        results["detection_id"] = detection_id
        
        # Store in database if location provided
        if latitude and longitude:
            await db_service.store_detection(
                detection_id=detection_id,
                latitude=latitude,
                longitude=longitude,
                detection_data=results,
                model_version=settings.model_path
            )
        
        logger.info(f"Detection complete: {results['debris_count']} items found")
        return results
        
    except Exception as e:
        logger.error(f"Detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/detect/location")
async def detect_debris_at_location(
    latitude: float,
    longitude: float,
    days_back: int = 7
):
    """
    Get detection results for a specific location
    
    Args:
        latitude: Target latitude
        longitude: Target longitude
        days_back: Look back N days
        
    Returns:
        Historical detections for location
    """
    try:
        if not db_service:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Query detections from database
        detections = await db_service.get_detections_by_location(
            latitude=latitude,
            longitude=longitude,
            days_back=days_back
        )
        
        # Fetch current wave conditions
        wave_data = await wave_service.get_current_wave_data(latitude, longitude)
        
        return {
            "location": {"latitude": latitude, "longitude": longitude},
            "detections": [
                {
                    "id": d.detection_id,
                    "timestamp": d.timestamp.isoformat(),
                    "debris_count": d.debris_count,
                    "coverage": d.coverage_percentage,
                    "types": d.debris_types
                }
                for d in detections
            ],
            "current_wave_conditions": {
                "height": wave_data.significant_wave_height if wave_data else None,
                "period": wave_data.dominant_period if wave_data else None,
                "wind_speed": wave_data.wind_speed if wave_data else None
            }
        }
        
    except Exception as e:
        logger.error(f"Location query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Satellite Imagery Endpoints
# ============================================================

@app.get("/api/satellite/search")
async def search_satellite_imagery(
    latitude: float,
    longitude: float,
    source: str = "sentinel-2",
    cloud_coverage_max: float = 20.0,
    days_back: int = 30
):
    """
    Search for available satellite imagery
    
    Sources: 'sentinel-2', 'landsat-8', 'landsat-9'
    """
    try:
        if not satellite_service:
            raise HTTPException(status_code=503, detail="Satellite service unavailable")
        
        if source == "sentinel-2":
            scenes = await satellite_service.search_sentinel2_imagery(
                latitude=latitude,
                longitude=longitude,
                days_back=days_back,
                max_cloud_coverage=cloud_coverage_max
            )
        elif source in ["landsat-8", "landsat-9"]:
            scenes = await satellite_service.search_landsat_imagery(
                latitude=latitude,
                longitude=longitude,
                days_back=days_back,
                max_cloud_coverage=cloud_coverage_max
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unknown source: {source}")
        
        return {
            "search_location": {"latitude": latitude, "longitude": longitude},
            "source": source,
            "available_scenes": [
                {
                    "scene_id": s.scene_id,
                    "acquisition_date": s.acquisition_date.isoformat(),
                    "cloud_coverage": s.cloud_coverage,
                    "satellite": s.satellite_id
                }
                for s in scenes
            ]
        }
        
    except Exception as e:
        logger.error(f"Satellite search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Wave Data Endpoints
# ============================================================

@app.get("/api/wave/current")
async def get_current_wave_data(latitude: float, longitude: float):
    """
    Get current real-time wave conditions
    """
    try:
        if not wave_service:
            raise HTTPException(status_code=503, detail="Wave service unavailable")
        
        wave_data = await wave_service.get_current_wave_data(
            latitude=latitude,
            longitude=longitude
        )
        
        if not wave_data:
            raise HTTPException(status_code=404, detail="Wave data unavailable for location")
        
        # Assess impact on debris
        impact = wave_service.assess_wave_impact_on_debris(wave_data)
        
        return {
            "timestamp": wave_data.timestamp.isoformat(),
            "location": {"latitude": latitude, "longitude": longitude},
            "measurements": {
                "wave_height_m": wave_data.significant_wave_height,
                "wave_period_s": wave_data.dominant_period,
                "wave_direction_deg": wave_data.mean_direction,
                "wind_speed_ms": wave_data.wind_speed,
                "wind_direction_deg": wave_data.wind_direction,
                "water_temperature_c": wave_data.water_temperature
            },
            "debris_impact_analysis": impact,
            "data_source": wave_data.source
        }
        
    except Exception as e:
        logger.error(f"Wave data fetch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/wave/forecast")
async def get_wave_forecast(
    latitude: float,
    longitude: float,
    hours: int = 24
):
    """
    Get wave forecast for next N hours
    """
    try:
        if not wave_service:
            raise HTTPException(status_code=503, detail="Wave service unavailable")
        
        forecast = await wave_service.get_wave_forecast(
            latitude=latitude,
            longitude=longitude,
            hours_ahead=hours
        )
        
        return {
            "location": {"latitude": latitude, "longitude": longitude},
            "forecast_hours": hours,
            "forecasts": [
                {
                    "timestamp": w.timestamp.isoformat(),
                    "wave_height_m": w.significant_wave_height,
                    "wave_period_s": w.dominant_period,
                    "wind_speed_ms": w.wind_speed
                }
                for w in forecast
            ]
        }
        
    except Exception as e:
        logger.error(f"Forecast failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Database Query Endpoints
# ============================================================

@app.get("/api/statistics")
async def get_system_statistics(
    start_date: str = None,
    end_date: str = None
):
    """
    Get system-wide statistics for patent documentation
    
    Args:
        start_date: ISO format (YYYY-MM-DD), default 30 days ago
        end_date: ISO format (YYYY-MM-DD), default today
    """
    try:
        if not db_service:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.utcnow().strftime("%Y-%m-%d")
        
        stats = await db_service.get_statistics(
            start_date=datetime.fromisoformat(start_date),
            end_date=datetime.fromisoformat(end_date)
        )
        
        return {
            "period": f"{start_date} to {end_date}",
            "statistics": stats
        }
        
    except Exception as e:
        logger.error(f"Statistics query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Main Entry Point
# ============================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        workers=1  # Keep 1 for GPU model sharing
    )


# ============================================================
# DEPLOYMENT INSTRUCTIONS
# ============================================================

"""
1. ENVIRONMENT SETUP
   - Install: pip install -r requirements-production.txt
   - Download model: python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

2. CONFIGURE .env FILE
   Create backend/.env with:
   
   DATABASE_URL=postgresql+asyncpg://user:pass@localhost/marine_debris
   COPERNICUS_USERNAME=your_esa_username
   COPERNICUS_PASSWORD=your_esa_password
   
   OR use SQLite (dev):
   DATABASE_URL=sqlite+aiosqlite:///./marine_debris.db

3. START PRODUCTION BACKEND
   cd backend
   python main.py
   
   Or with Gunicorn:
   gunicorn -w 1 -b 0.0.0.0:8000 main:app

4. TEST ENDPOINTS
   curl http://localhost:8000/health
   
   curl "http://localhost:8000/api/wave/current?latitude=28.2735&longitude=153.0281"
   
   curl -X POST -F "file=@image.jpg" \
        "http://localhost:8000/api/detect/image?latitude=28.2735&longitude=153.0281"

5. ACCESS API DOCUMENTATION
   http://localhost:8000/docs  (Swagger)
   http://localhost:8000/redoc (ReDoc)
"""
