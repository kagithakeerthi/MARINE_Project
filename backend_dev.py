"""
Mock Backend - Marine Technology Platform
Lightweight development server for testing frontend without ML dependencies
"""

from fastapi import FastAPI, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import base64
from datetime import datetime
import random

app = FastAPI(
    title="Marine Technology",
    version="1.0.0",
    description="Satellite Debris & Risk Detection Platform"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": "Marine Technology",
        "version": "1.0.0"
    }

# Detection APIs - Mock
@app.post("/api/v1/detect/debris")
async def detect_debris(
    file: UploadFile = File(...),
    confidence_threshold: float = Query(0.5)
):
    """Mock debris detection endpoint"""
    content = await file.read()
    return {
        "debriscount": random.randint(5, 25),
        "coveragepercentage": round(random.uniform(5, 30), 2),
        "debris_types": {
            "plastic": random.randint(2, 15),
            "fishing_nets": random.randint(0, 8),
            "wood": random.randint(1, 5)
        },
        "annotatedimage": base64.b64encode(content).decode(),
        "confidence": confidence_threshold,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/v1/detect/batch")
async def detect_batch(files: list[UploadFile] = File(...)):
    """Mock batch detection endpoint"""
    results = []
    for file in files:
        content = await file.read()
        results.append({
            "filename": file.filename,
            "debriscount": random.randint(3, 20),
            "coveragepercentage": round(random.uniform(5, 25), 2)
        })
    return {"results": results, "timestamp": datetime.now().isoformat()}

# Ecosystem APIs - Mock
@app.post("/api/v1/ecosystem/analyze")
async def analyze_ecosystem(
    file: UploadFile = File(...),
    analysis_type: str = Query("full")
):
    """Mock ecosystem analysis endpoint"""
    return {
        "health_score": round(random.uniform(60, 95), 1),
        "ecosystems": {
            "coral_reef": round(random.uniform(40, 80), 1),
            "seagrass": round(random.uniform(50, 90), 1),
            "algae": round(random.uniform(20, 60), 1)
        },
        "analysis_type": analysis_type,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/v1/ecosystem/compare")
async def compare_ecosystem(
    file_before: UploadFile = File(...),
    file_after: UploadFile = File(...)
):
    """Mock ecosystem comparison endpoint"""
    return {
        "change_percentage": round(random.uniform(-20, 20), 2),
        "health_trend": random.choice(["improving", "stable", "declining"]),
        "regions_affected": random.randint(1, 5),
        "timestamp": datetime.now().isoformat()
    }

# Wave Data APIs - Mock
@app.get("/api/v1/wave/current")
async def get_wave_current(lat: float, lon: float):
    """Mock current wave data endpoint"""
    return {
        "wave_height": round(random.uniform(0.5, 5), 1),
        "wave_direction": random.randint(0, 360),
        "wave_period": round(random.uniform(5, 15), 1),
        "wind_speed": round(random.uniform(5, 25), 1),
        "wind_direction": random.randint(0, 360),
        "sea_surface_temperature": round(random.uniform(18, 28), 1),
        "latitude": lat,
        "longitude": lon,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v1/wave/forecast")
async def get_wave_forecast(lat: float, lon: float, hours: int = Query(24)):
    """Mock wave forecast endpoint"""
    forecast = []
    for i in range(hours):
        forecast.append({
            "hour": i,
            "wave_height": round(random.uniform(0.5, 5), 1),
            "wind_speed": round(random.uniform(5, 25), 1),
            "timestamp": datetime.now().isoformat()
        })
    return {"forecast": forecast, "hours": hours}

# Risk Assessment APIs - Mock
@app.post("/api/v1/risk/assess")
async def assess_risk(lat: float, lon: float, debris_data: dict = None):
    """Mock risk assessment endpoint"""
    return {
        "risk_level": random.choice(["low", "medium", "high", "critical"]),
        "risk_score": round(random.uniform(0, 100), 1),
        "factors": {
            "debris_concentration": round(random.uniform(0, 100), 1),
            "wave_height": round(random.uniform(0.5, 5), 1),
            "ecosystem_health": round(random.uniform(0, 100), 1),
            "vessel_traffic": random.randint(0, 100)
        },
        "recommendations": [
            "Monitor debris accumulation",
            "Watch wave conditions",
            "Assess ecosystem recovery"
        ],
        "timestamp": datetime.now().isoformat()
    }

# Alert APIs - Mock
@app.get("/api/v1/alerts/active")
async def get_active_alerts():
    """Mock active alerts endpoint"""
    alerts = [
        {
            "id": f"alert_{i}",
            "type": random.choice(["debris", "ecosystem", "wave", "drift"]),
            "severity": random.choice(["low", "medium", "high", "critical"]),
            "message": f"Alert {i}: Environmental monitoring event detected",
            "location": {"lat": random.uniform(-90, 90), "lon": random.uniform(-180, 180)},
            "timestamp": datetime.now().isoformat(),
            "read": False
        }
        for i in range(5)
    ]
    return {"alerts": alerts, "count": len(alerts)}

@app.post("/api/v1/alerts/subscribe")
async def subscribe_alerts(
    lat: float,
    lon: float,
    radius_km: float = Query(10),
    alert_types: list[str] = Query(["debris", "ecosystem", "wave"])
):
    """Mock alert subscription endpoint"""
    return {
        "subscription_id": f"sub_{random.randint(1000, 9999)}",
        "latitude": lat,
        "longitude": lon,
        "radius_km": radius_km,
        "alert_types": alert_types,
        "status": "active",
        "timestamp": datetime.now().isoformat()
    }

# Map Data APIs - Mock
@app.get("/api/v1/map/debris-zones")
async def get_debris_zones(bounds: str):
    """Mock debris zones endpoint"""
    zones = [
        {
            "id": f"zone_{i}",
            "center": [random.uniform(15, 25), random.uniform(70, 85)],
            "radius": random.uniform(1, 10),
            "severity": random.choice(["low", "medium", "high", "critical"]),
            "debrisType": random.choice(["plastic", "nets", "wood", "mixed"]),
            "detectedAt": datetime.now().isoformat()
        }
        for i in range(8)
    ]
    return {"zones": zones, "count": len(zones)}

@app.get("/api/v1/map/ecosystem-regions")
async def get_ecosystem_regions(bounds: str):
    """Mock ecosystem regions endpoint"""
    regions = [
        {
            "id": f"region_{i}",
            "type": random.choice(["coral_reef", "seagrass", "algae", "protected_area"]),
            "polygon": [[random.uniform(15, 25), random.uniform(70, 85)] for _ in range(4)],
            "healthStatus": random.choice(["healthy", "degraded", "critical"]),
            "healthScore": round(random.uniform(30, 95), 1)
        }
        for i in range(5)
    ]
    return {"regions": regions, "count": len(regions)}

# Beaches APIs
@app.get("/api/v1/beaches")
async def get_all_beaches():
    """Get all monitored beaches"""
    beaches = [
        {"id": "beach_001", "name": "Marina Beach", "city": "Chennai", "lat": 13.0499, "lon": 80.2819, "area": 13, "riskLevel": "high"},
        {"id": "beach_002", "name": "Kovalam Beach", "city": "Thiruvananthapuram", "lat": 8.4244, "lon": 76.9309, "area": 8, "riskLevel": "medium"},
        {"id": "beach_003", "name": "Goa Golden Beach", "city": "Goa", "lat": 15.3408, "lon": 73.8362, "area": 6.5, "riskLevel": "low"},
        {"id": "beach_004", "name": "Worli Beach", "city": "Mumbai", "lat": 19.0136, "lon": 72.8142, "area": 12, "riskLevel": "critical"},
        {"id": "beach_005", "name": "Radhanagar Beach", "city": "Andaman", "lat": 11.6457, "lon": 92.2506, "area": 4.2, "riskLevel": "low"},
        {"id": "beach_006", "name": "Alibag Beach", "city": "Maharashtra", "lat": 18.6392, "lon": 72.8762, "area": 9, "riskLevel": "medium"},
        {"id": "beach_007", "name": "Calangute Beach", "city": "Goa", "lat": 15.4909, "lon": 73.7618, "area": 7, "riskLevel": "medium"},
        {"id": "beach_008", "name": "Ashvem Beach", "city": "Goa", "lat": 15.6333, "lon": 73.7333, "area": 5, "riskLevel": "low"},
    ]
    return {"beaches": beaches, "count": len(beaches)}

@app.get("/api/v1/beaches/{beach_id}/debris")
async def get_beach_debris(beach_id: str):
    """Get debris data for specific beach"""
    risk_map = {"critical": 45, "high": 35, "medium": 20, "low": 8}
    beaches_ref = {
        "beach_001": "high",
        "beach_002": "medium",
        "beach_003": "low",
        "beach_004": "critical",
        "beach_005": "low",
        "beach_006": "medium",
        "beach_007": "medium",
        "beach_008": "low",
    }
    
    risk = beaches_ref.get(beach_id, "medium")
    debris_count = risk_map[risk] + random.randint(0, 10)
    
    return {
        "beachId": beach_id,
        "debrisCount": debris_count,
        "coveragePercentage": round((debris_count / 100) * 15 + random.uniform(0, 5), 2),
        "composition": {
            "plastic": round(random.uniform(30, 40), 1),
            "fishing_nets": round(random.uniform(20, 30), 1),
            "wood": round(random.uniform(15, 25), 1),
            "glass": round(random.uniform(5, 15), 1),
            "other": round(random.uniform(5, 15), 1),
        },
        "weeklyTrend": [
            {"day": day, "count": debris_count + random.randint(-15, 15)}
            for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        ],
        "waterQuality": {
            "transparency": random.uniform(30, 100),
            "pollutionIndex": random.uniform(10, 100),
            "biodiversity": random.uniform(20, 95),
        },
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
