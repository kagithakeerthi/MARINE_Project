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