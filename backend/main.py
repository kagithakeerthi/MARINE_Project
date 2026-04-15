"""
Production Marine Debris Monitoring Backend
Real-time system with YOLOv8 ML, satellite APIs, and wave data
For patent publication deployment
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import io
import uuid
from datetime import datetime, timedelta
from typing import AsyncGenerator

# Import production services (with fallback)
PRODUCTION_SERVICES_AVAILABLE = False
try:
    from services.real_detection_service import RealDebrisDetectionService
    from services.real_satellite_service import RealSatelliteService
    from services.real_wave_service import RealWaveService
    from services.database_service import ProductionDatabase
    from config.production_settings import ProductionSettings
    PRODUCTION_SERVICES_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Production services not available: {e}. Using basic API.")
    # Fallback imports
    from services.detection_service import DebrisDetectionService
    from services.ecosystem_service import EcosystemService
    from services.wave_service import WaveService
    from services.alert_service import AlertService

# Global service instances (will be initialized during startup)
detector = None
satellite_service = None
wave_service = None
db_service = None


# ============================================================
# Lifespan Context Manager (replaces on_event)
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Handle startup and shutdown events"""
    global detector, satellite_service, wave_service, db_service, PRODUCTION_SERVICES_AVAILABLE
    
    # STARTUP
    logger.info("🚀 Starting Marine Debris Monitoring System")
    
    if PRODUCTION_SERVICES_AVAILABLE:
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
            logger.error(f"❌ Production services failed: {e}. Using fallback.")
            PRODUCTION_SERVICES_AVAILABLE = False
            await initialize_fallback_services()
    else:
        await initialize_fallback_services()
    
    yield
    
    # SHUTDOWN
    logger.info("🛑 Shutting down Marine Debris Monitoring System")

    if PRODUCTION_SERVICES_AVAILABLE:
        if satellite_service:
            await satellite_service.shutdown()
        if wave_service:
            await wave_service.shutdown()
        if db_service:
            await db_service.shutdown()

    logger.info("Shutdown complete")


# Initialize FastAPI with lifespan
app = FastAPI(
    title="Marine Debris Monitoring - Production",
    description="Real-time satellite-based debris detection",
    version="1.0.0",
    lifespan=lifespan
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
if PRODUCTION_SERVICES_AVAILABLE:
    settings = ProductionSettings()
else:
    # Create a basic settings object for fallback
    class BasicSettings:
        def __init__(self):
            self.database_url = "sqlite:///./marine_debris.db"
            self.model_path = "models/debris_detection/yolov8n.pt"
            self.detection_device = "cpu"
            self.wave_cache_ttl = 3600
            self.copernicus_username = None
            self.copernicus_password = None
            self.usgs_username = None
            self.usgs_password = None
    settings = BasicSettings()

async def initialize_fallback_services() -> None:
    """Initialize basic services when production services unavailable"""
    global detector, satellite_service, wave_service, db_service

    logger.info("Using basic services (mock data)")

    try:
        detector = DebrisDetectionService()
        satellite_service = None  # Not available in basic version
        wave_service = WaveService()
        db_service = None  # Not available in basic version

        logger.info("✅ Basic services initialized")
    except Exception as e:
        logger.error(f"Basic services failed: {e}")


# ============================================================
# Health Check
# ============================================================

@app.get("/health")
async def health_check():
    """System health status"""
    services_status = {
        "detector": "ready" if detector else "unavailable",
        "satellite_api": "ready" if satellite_service else "unavailable",
        "wave_api": "ready" if wave_service else "unavailable",
        "database": "ready" if db_service else "unavailable"
    }

    if PRODUCTION_SERVICES_AVAILABLE:
        services_status["mode"] = "production"
    else:
        services_status["mode"] = "basic"

    return {
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "services": services_status
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
        if not detector:
            raise HTTPException(status_code=503, detail="Detection service unavailable")

        # Read image data once
        contents = await file.read()

        if PRODUCTION_SERVICES_AVAILABLE:
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
            if latitude and longitude and db_service:
                await db_service.store_detection(
                    detection_id=detection_id,
                    latitude=latitude,
                    longitude=longitude,
                    detection_data=results,
                    model_version=settings.model_path
                )

            logger.info(f"Detection complete: {results['debris_count']} items found")
            return results
        else:
            # Basic mock detection
            # Convert bytes to numpy array for the detect method
            import cv2
            import numpy as np
            nparr = np.frombuffer(contents, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            detection_result = await detector.detect(image)

            return {
                "timestamp": datetime.utcnow().isoformat(),
                "filename": file.filename,
                "detections": detection_result.get("detections", []),
                "debris_count": detection_result.get("debris_count", 0),
                "total_area": sum(d["area"] for d in detection_result.get("detections", [])),
                "processing_time": detection_result.get("processing_time", 100),
                "model_version": "mock-v1.0",
                "data_source": "mock",
                "note": "Using mock detection - install production dependencies for real AI analysis"
            }

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
        if PRODUCTION_SERVICES_AVAILABLE and satellite_service:
            # Real satellite search
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
        else:
            # Mock satellite search results
            import random
            mock_scenes = []
            for i in range(random.randint(1, 5)):
                days_ago = random.randint(1, days_back)
                acquisition_date = datetime.utcnow() - timedelta(days=days_ago)
                mock_scenes.append({
                    "scene_id": f"mock_{source}_{uuid.uuid4().hex[:8]}",
                    "acquisition_date": acquisition_date.isoformat(),
                    "cloud_coverage": random.uniform(0, cloud_coverage_max),
                    "satellite": source.upper()
                })

            return {
                "search_location": {"latitude": latitude, "longitude": longitude},
                "source": source,
                "available_scenes": mock_scenes,
                "data_source": "mock",
                "note": "Using mock satellite data - install production dependencies for real satellite imagery"
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

        if PRODUCTION_SERVICES_AVAILABLE:
            # Real wave data from Open-Meteo
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
        else:
            # Basic mock wave data
            wave_data = wave_service.get_wave_data_sync(latitude, longitude)
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "location": {"latitude": latitude, "longitude": longitude},
                "measurements": {
                    "wave_height_m": wave_data.get("wave_height", 0),
                    "wave_period_s": wave_data.get("wave_period", 0),
                    "wave_direction_deg": wave_data.get("wave_direction", 0),
                    "wind_speed_ms": wave_data.get("wind_speed", 0),
                    "water_temperature_c": wave_data.get("sea_surface_temperature", 15)
                },
                "data_source": "mock",
                "note": "Using mock data - install production dependencies for real wave data"
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

    logger.info("Starting production server on http://localhost:8000")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        workers=1  # Keep 1 for GPU model sharing
    )
