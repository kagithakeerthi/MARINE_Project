from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
import numpy as np
from datetime import datetime
import base64
import io
from PIL import Image

router = APIRouter()

# ============== DEBRIS DETECTION ENDPOINTS ==============

@router.post("/detect/debris")
async def detect_debris(
    file: UploadFile = File(...),
    confidence_threshold: float = Query(0.5, ge=0.1, le=1.0)
):
    """
    Detect marine debris in uploaded satellite/drone image
    """
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Get detection service from app state
        from main import detection_service
        
        # Run detection
        results = await detection_service.detect(
            image=np.array(image),
            confidence_threshold=confidence_threshold
        )
        
        return {
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "detections": results["detections"],
            "debris_count": results["debris_count"],
            "debris_types": results["debris_types"],
            "coverage_percentage": results["coverage_percentage"],
            "heatmap": results["heatmap_base64"],
            "annotated_image": results["annotated_image_base64"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect/batch")
async def detect_debris_batch(files: List[UploadFile] = File(...)):
    """
    Process multiple images for debris detection
    """
    from main import detection_service
    results = []
    
    for file in files:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        result = await detection_service.detect(np.array(image))
        results.append({
            "filename": file.filename,
            "detections": result["detections"],
            "debris_count": result["debris_count"]
        })
    
    return {"success": True, "results": results}

# ============== ECOSYSTEM MONITORING ENDPOINTS ==============

@router.post("/ecosystem/analyze")
async def analyze_ecosystem(
    file: UploadFile = File(...),
    analysis_type: str = Query("full", enum=["full", "coral", "algae", "water_quality"])
):
    """
    Analyze ecosystem features in satellite imagery
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        from main import ecosystem_service
        
        results = await ecosystem_service.analyze(
            image=np.array(image),
            analysis_type=analysis_type
        )
        
        return {
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "segmentation_mask": results["mask_base64"],
            "ecosystem_stats": results["statistics"],
            "health_index": results["health_index"],
            "regions": results["regions"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ecosystem/compare")
async def compare_ecosystem(
    file_before: UploadFile = File(...),
    file_after: UploadFile = File(...)
):
    """
    Compare two temporal images to detect ecosystem changes
    """
    try:
        img_before = Image.open(io.BytesIO(await file_before.read()))
        img_after = Image.open(io.BytesIO(await file_after.read()))
        
        from main import ecosystem_service
        
        results = await ecosystem_service.compare_temporal(
            image_before=np.array(img_before),
            image_after=np.array(img_after)
        )
        
        return {
            "success": True,
            "change_detected": results["change_detected"],
            "change_percentage": results["change_percentage"],
            "change_map": results["change_map_base64"],
            "degradation_zones": results["degradation_zones"],
            "recovery_zones": results["recovery_zones"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== WAVE DATA & RISK ENDPOINTS ==============

@router.get("/wave/current")
async def get_current_wave_data(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180)
):
    """
    Get current wave conditions for a location
    """
    from main import wave_service
    
    data = await wave_service.get_wave_data(lat, lon)
    
    return {
        "success": True,
        "location": {"lat": lat, "lon": lon},
        "wave_height": data["wave_height"],
        "wave_direction": data["wave_direction"],
        "wave_period": data["wave_period"],
        "wind_speed": data["wind_speed"],
        "wind_direction": data["wind_direction"],
        "timestamp": data["timestamp"]
    }

@router.get("/wave/forecast")
async def get_wave_forecast(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    hours: int = Query(24, ge=1, le=168)
):
    """
    Get wave forecast for specified hours ahead
    """
    from main import wave_service
    
    forecast = await wave_service.get_forecast(lat, lon, hours)
    
    return {
        "success": True,
        "location": {"lat": lat, "lon": lon},
        "forecast_hours": hours,
        "forecast_data": forecast
    }

@router.post("/risk/assess")
async def assess_risk(
    lat: float = Query(...),
    lon: float = Query(...),
    debris_data: Optional[dict] = None
):
    """
    Assess debris drift risk based on wave conditions
    """
    from main import wave_service, alert_service
    
    wave_data = await wave_service.get_wave_data(lat, lon)
    risk_assessment = await alert_service.assess_risk(
        location=(lat, lon),
        wave_data=wave_data,
        debris_data=debris_data
    )
    
    return {
        "success": True,
        "risk_level": risk_assessment["risk_level"],
        "risk_score": risk_assessment["risk_score"],
        "drift_prediction": risk_assessment["drift_prediction"],
        "affected_zones": risk_assessment["affected_zones"],
        "recommendations": risk_assessment["recommendations"]
    }

# ============== ALERTS ENDPOINTS ==============

@router.get("/alerts/active")
async def get_active_alerts():
    """
    Get all active alerts
    """
    from main import alert_service
    
    alerts = await alert_service.get_active_alerts()
    
    return {
        "success": True,
        "alert_count": len(alerts),
        "alerts": alerts
    }

@router.post("/alerts/subscribe")
async def subscribe_to_alerts(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_km: float = Query(50.0),
    alert_types: List[str] = Query(["debris", "ecosystem", "wave"])
):
    """
    Subscribe to alerts for a specific region
    """
    from main import alert_service
    
    subscription = await alert_service.create_subscription(
        center=(lat, lon),
        radius_km=radius_km,
        alert_types=alert_types
    )
    
    return {
        "success": True,
        "subscription_id": subscription["id"],
        "message": "Successfully subscribed to alerts"
    }

# ============== MAP DATA ENDPOINTS ==============

@router.get("/map/debris-zones")
async def get_debris_zones(
    bounds: str = Query(..., description="Format: minLat,minLon,maxLat,maxLon")
):
    """
    Get debris detection zones within map bounds
    """
    try:
        min_lat, min_lon, max_lat, max_lon = map(float, bounds.split(","))
        
        # Fetch from database or cache
        zones = [
            {
                "id": "zone_1",
                "center": [15.5, 73.8],
                "radius": 5000,
                "severity": "high",
                "debris_type": "plastic",
                "detected_at": datetime.utcnow().isoformat()
            },
            {
                "id": "zone_2", 
                "center": [16.2, 74.1],
                "radius": 3000,
                "severity": "medium",
                "debris_type": "mixed",
                "detected_at": datetime.utcnow().isoformat()
            }
        ]
        
        return {"success": True, "zones": zones}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/map/ecosystem-regions")
async def get_ecosystem_regions(
    bounds: str = Query(...)
):
    """
    Get ecosystem regions within map bounds
    """
    regions = [
        {
            "id": "eco_1",
            "type": "coral_reef",
            "polygon": [[15.4, 73.7], [15.6, 73.7], [15.6, 73.9], [15.4, 73.9]],
            "health_status": "moderate",
            "health_score": 0.65
        },
        {
            "id": "eco_2",
            "type": "seagrass",
            "polygon": [[16.0, 74.0], [16.3, 74.0], [16.3, 74.2], [16.0, 74.2]],
            "health_status": "good",
            "health_score": 0.82
        }
    ]
    
    return {"success": True, "regions": regions}
