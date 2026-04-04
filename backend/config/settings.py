from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # API Settings
    APP_NAME: str = "Marine Debris Monitoring System"
    DEBUG: bool = True
    API_VERSION: str = "v1"
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/marine_db"
    REDIS_URL: str = "redis://localhost:6379"
    
    # AI Model Paths
    DEBRIS_MODEL_PATH: str = "models/debris_detection/best_model.pt"
    ECOSYSTEM_MODEL_PATH: str = "models/ecosystem_segmentation/best_model.pt"
    
    # External APIs
    SENTINEL_HUB_API_KEY: Optional[str] = None
    COPERNICUS_API_USER: Optional[str] = None
    COPERNICUS_API_PASSWORD: Optional[str] = None
    NOAA_API_KEY: Optional[str] = None
    
    # Wave Data API (NOAA WAVEWATCH III)
    WAVE_DATA_API_URL: str = "[nomads.ncep.noaa.gov](https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/)"
    
    # Detection Settings
    DEBRIS_CONFIDENCE_THRESHOLD: float = 0.5
    ECOSYSTEM_CONFIDENCE_THRESHOLD: float = 0.6
    RISK_ALERT_THRESHOLD: float = 0.7
    
    # Map Settings
    DEFAULT_CENTER_LAT: float = 20.0
    DEFAULT_CENTER_LON: float = 80.0
    DEFAULT_ZOOM: int = 5
    
    class Config:
        env_file = ".env"

settings = Settings()
