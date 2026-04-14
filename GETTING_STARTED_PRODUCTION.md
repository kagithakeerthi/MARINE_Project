# Quick Start - Production Deployment (5 Minutes)

## For Patent Publication: Get Running in 5 Steps

### Step 1: Install Dependencies (2 minutes)
```bash
cd c:\Users\keerthi lasya\marine-debris-monitoring
pip install -r requirements-production.txt
```

### Step 2: Download ML Model (1 minute)
```bash
python -c "from ultralytics import YOLO; m = YOLO('yolov8n.pt'); print('✅ Model downloaded')"
```

### Step 3: Create Environment File (optional)
Create `backend/.env`:
```
DATABASE_URL=sqlite+aiosqlite:///./marine_debris.db
COPERNICUS_USERNAME=your_email@example.com
COPERNICUS_PASSWORD=your_esa_password
USGS_USERNAME=your_usgs_username
USGS_PASSWORD=your_usgs_password
```

### Step 4: Start Backend Service (1 minute)
```bash
cd backend
python main.py
```

Expected output:
```
INFO:     Started server process [12345]
INFO:     Uvicorn running on http://0.0.0.0:8000
🚀 Starting Marine Debris Monitoring Production System
Loading YOLOv8 model: yolov8n.pt
Initializing satellite service...
Initializing wave data service...
✅ All production services initialized successfully
```

### Step 5: Test Endpoints (1 minute)

**Health Check:**
```bash
curl http://localhost:8000/health
```

**Get Real Wave Data:**
```bash
curl "http://localhost:8000/api/wave/current?latitude=28.2735&longitude=153.0281"
```

**Access API Documentation:**
Open browser: http://localhost:8000/docs

---

## Available Endpoints

### Detection
- `POST /api/detect/image` - Upload satellite image for debris detection
- `GET /api/detect/location` - Get detections near coordinates

### Satellite Data
- `GET /api/satellite/search` - Find available Sentinel-2/Landsat scenes
- `GET /api/satellite/bounds` - Get coverage bounds

### Wave Data (Real-Time)
- `GET /api/wave/current` - Real wave conditions (Open-Meteo)
- `GET /api/wave/forecast` - Wave forecast (next 24h)

### Database
- `GET /api/statistics` - System statistics for patent claims
- `GET /health` - System health status

---

## Example API Calls

### 1. Get Real Wave Data (Real Open-Meteo API)
```bash
curl "http://localhost:8000/api/wave/current?latitude=28.2735&longitude=153.0281"

# Response:
{
  "timestamp": "2024-01-15T10:30:00",
  "location": {"latitude": 28.2735, "longitude": 153.0281},
  "measurements": {
    "wave_height_m": 1.8,
    "wave_period_s": 8.2,
    "wave_direction_deg": 45,
    "wind_speed_ms": 12.5,
    "water_temperature_c": 22.1
  },
  "debris_impact_analysis": {
    "resuspension_risk": 0.65,
    "offshore_transport_risk": 0.45
  },
  "data_source": "open-meteo"
}
```

### 2. Upload Image for Detection (Real YOLOv8 Inference)
```bash
curl -X POST -F "file=@satellite_image.jpg" \
     "http://localhost:8000/api/detect/image?latitude=28.2735&longitude=153.0281"

# Response:
{
  "detection_id": "det_a1b2c3d4e5",
  "detections": [
    {
      "bbox": [100, 150, 120, 170],
      "class": "plastic_bottle",
      "confidence": 0.92
    },
    {
      "bbox": [200, 250, 240, 290],
      "class": "fishing_net",
      "confidence": 0.87
    }
  ],
  "debris_count": 12,
  "coverage_percentage": 2.3,
  "timestamp": "2024-01-15T10:35:00"
}
```

### 3. Search for Satellite Imagery (Real ESA/USGS APIs)
```bash
curl "http://localhost:8000/api/satellite/search?latitude=28.2735&longitude=153.0281&source=sentinel-2"

# Response:
{
  "search_location": {"latitude": 28.2735, "longitude": 153.0281},
  "available_scenes": [
    {
      "scene_id": "S2A_MSIL1C_20240115T000000_N0208_R000_T56JPP_20240115T000000",
      "acquisition_date": "2024-01-15T10:15:00",
      "cloud_coverage": 12.5,
      "satellite": "S2A"
    }
  ]
}
```

### 4. Get System Statistics (For Patent Claims)
```bash
curl "http://localhost:8000/api/statistics?start_date=2024-01-01&end_date=2024-01-31"

# Response:
{
  "period": "2024-01-01 to 2024-01-31",
  "statistics": {
    "total_detections": 2847,
    "average_coverage_percentage": 2.1,
    "total_alerts": 23
  }
}
```

---

## Useful Commands

### View API Documentation (Interactive)
```bash
# Open in browser
http://localhost:8000/docs
```

### Check System Logs
```bash
tail -f marine_debris.log
```

### Monitor Metrics
```bash
curl http://localhost:8000/metrics
```

### Export Database Data (for patent filing)
```bash
# SQLite export
sqlite3 marine_debris.db "SELECT * FROM debris_detections LIMIT 10;" > detections.csv

# PostgreSQL export
pg_dump marine_debris > backup.sql
```

### Stop Backend
```bash
# Press Ctrl+C in the terminal running the backend
```

---

## Database Setup (Optional PostgreSQL)

For production patent deployment, use PostgreSQL:

### 1. Install PostgreSQL
```bash
# Windows: Download from https://www.postgresql.org/download/windows/
# Or use Docker:
docker run -d -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=marine_debris \
  -p 5432:5432 postgres:15
```

### 2. Update .env
```
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/marine_debris
```

### 3. Restart Backend
```bash
cd backend
python main.py
```

The database tables will be created automatically on first run.

---

## Troubleshooting

### Problem: "Model not initialized"
**Solution**: YOLOv8 model not downloaded
```bash
python -c "from ultralytics import YOLO; m = YOLO('yolov8n.pt')"
python main.py
```

### Problem: "Satellite service unavailable"
**Solution**: Missing Copernicus credentials (optional, system will warn but continue)
- API calls will use mock data
- To use real data, add ESA credentials to .env

### Problem: "Wave service failed"
**Solution**: Internet connectivity issue
- Open-Meteo API requires internet connection
- Service will retry automatically

### Problem: Port 8000 already in use
**Solution**:
```bash
# Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID [PID] /F

# Or use different port
# Edit main.py: uvicorn.run(port=8001)
```

### Problem: Database locked (SQLite)
**Solution**: Close other terminal accessing database
- SQLite has limited concurrent access
- Switch to PostgreSQL for production

---

## Production Checklist

Before filing patent, complete:

- [ ] All endpoints tested and working
- [ ] 60 days of real data collected (detections, wave data, satellite scenes)
- [ ] Database contains >1000 detections
- [ ] Statistics endpoint shows meaningful numbers
- [ ] API documentation complete (access at /docs)
- [ ] Real satellite imagery stored with detections
- [ ] Wave correlations computed
- [ ] Heatmaps generated from real data

---

## Patent Filing Data Export

### Export Detection Results
```bash
# Create patent data dump including:
# 1. Sample detections with real confidence scores
# 2. Satellite scene metadata
# 3. Wave conditions at time of detection
# 4. System statistics

curl "http://localhost:8000/api/statistics?start_date=2024-01-01&end_date=2024-01-31" \
  > patent_statistics.json

# Access database directly
sqlite3 marine_debris.db << EOF
.headers on
.mode csv
SELECT detection_id, latitude, longitude, timestamp, debris_count, 
       coverage_percentage, debris_types, model_version 
FROM debris_detections 
LIMIT 100;
EOF > patent_detections.csv
```

### Generate Patent Figures
- Detection images with confidence scores visible
- Heatmaps showing debris distribution
- Wave data correlation plots
- System architecture diagram (provided in PRODUCTION_DEPLOYMENT.md)

---

## Next Steps for Patent Publication

1. **Run system for 60 days** to collect real data
   ```bash
   # Start with cron job for periodic detections
   0 */4 * * * python /path/to/backend/batch_detection.py
   ```

2. **Export statistics monthly**
   ```bash
   curl http://localhost:8000/api/statistics > month_stats.json
   ```

3. **Generate patent figures** from real results
   - Use detection images + heatmaps
   - Include wave correlation data
   - Show system architecture

4. **File patent application** with:
   - System design document
   - Real detection examples
   - Performance metrics
   - Reproducibility package

---

## Support

- **API Docs**: http://localhost:8000/docs (interactive)
- **Health Status**: http://localhost:8000/health
- **Logs**: Check terminal output or marine_debris.log
- **Issues**: Check PRODUCTION_DEPLOYMENT.md for troubleshooting

---

**You're ready to go! Start the backend and begin collecting real patent-quality data.** 🚀

All real services (ML, satellite APIs, oceanographic data, database) are ready to use.
