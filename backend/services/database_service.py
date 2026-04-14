"""
Production Database Persistence Layer
Stores real detection results, wave data, and ecosystem metrics
For production patent-quality deployment
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON, Boolean
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from loguru import logger
from dataclasses import asdict

Base = declarative_base()


class DebrisDetection(Base):
    """Persistent storage for debris detections"""
    __tablename__ = "debris_detections"

    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(String, unique=True, index=True)
    latitude = Column(Float, index=True)
    longitude = Column(Float, index=True)
    satellite_source = Column(String)  # "sentinel-2", "landsat-8", etc.
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Detection results
    debris_count = Column(Integer)
    coverage_percentage = Column(Float)
    debris_types = Column(JSON)  # {"plastic_bottle": 5, "fishing_net": 2, ...}
    confidence_scores = Column(JSON)  # [0.92, 0.87, ...]
    
    # Image references
    heatmap_path = Column(String, nullable=True)
    annotated_image_path = Column(String, nullable=True)
    original_image_path = Column(String, nullable=True)
    
    # Metadata
    scene_id = Column(String, nullable=True)
    cloud_coverage = Column(Float, nullable=True)
    processing_time_ms = Column(Float)
    model_version = Column(String)
    
    # QA/QC
    is_validated = Column(Boolean, default=False)
    manual_review_notes = Column(String, nullable=True)
    
    def __repr__(self):
        return f"<DebrisDetection id={self.id} lat={self.latitude} lon={self.longitude}>"


class WaveDataRecord(Base):
    """Persistent storage for wave measurements"""
    __tablename__ = "wave_data"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String, unique=True, index=True)
    latitude = Column(Float, index=True)
    longitude = Column(Float, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Wave measurements (real data from NOAA/Open-Meteo)
    significant_wave_height = Column(Float)  # meters
    dominant_period = Column(Float)  # seconds
    mean_direction = Column(Float)  # degrees 0-360
    peak_frequency = Column(Float)  # Hz
    wind_speed = Column(Float)  # m/s
    wind_direction = Column(Float)  # degrees
    water_temperature = Column(Float)  # Celsius
    swell_height = Column(Float, nullable=True)
    
    # Wave impact analysis
    impact_analysis = Column(JSON)  # {"resuspension_risk": 0.7, ...}
    data_source = Column(String)  # "open-meteo", "noaa", etc.
    
    def __repr__(self):
        return f"<WaveDataRecord id={self.id} wave_height={self.significant_wave_height}m>"


class EcosystemMetric(Base):
    """Persistent storage for ecosystem health metrics"""
    __tablename__ = "ecosystem_metrics"

    id = Column(Integer, primary_key=True, index=True)
    metric_id = Column(String, unique=True, index=True)
    latitude = Column(Float, index=True)
    longitude = Column(Float, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Ecosystem health indicators
    vegetation_index = Column(Float)  # NDVI
    water_clarity_index = Column(Float)  # Based on SWIR bands
    algae_bloom_presence = Column(Boolean)
    coastal_erosion_risk = Column(String)  # 'low', 'medium', 'high'
    
    # Debris impact on ecosystem
    debris_impact_score = Column(Float)  # 0-1 scale
    affected_species_count = Column(Integer, nullable=True)
    habitat_degradation_level = Column(String)  # 'none', 'minor', 'moderate', 'severe'
    
    # Recommendations
    remediation_priority = Column(String)  # 'low', 'medium', 'high', 'critical'
    recommended_actions = Column(JSON)  # ["manual_cleanup", "monitoring", ...]
    
    def __repr__(self):
        return f"<EcosystemMetric id={self.id} debris_impact={self.debris_impact_score}>"


class DetectionAlert(Base):
    """Real-time alert system for significant findings"""
    __tablename__ = "detection_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String, unique=True, index=True)
    latitude = Column(Float, index=True)
    longitude = Column(Float, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Alert details
    alert_type = Column(String)  # "high_debris", "pollution_event", "ecosystem_threat"
    severity = Column(String)  # 'warning', 'alarm', 'critical'
    message = Column(String)
    
    # Trigger data
    trigger_metric = Column(String)  # What caused the alert
    trigger_value = Column(Float)
    threshold_value = Column(Float)
    
    # Response tracking
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    response_notes = Column(String, nullable=True)
    
    def __repr__(self):
        return f"<DetectionAlert id={self.id} type={self.alert_type} severity={self.severity}>"


class ProductionDatabase:
    """
    Production Database Manager
    - Async SQLAlchemy ORM
    - Support for SQLite (dev) and PostgreSQL (production)
    - Connection pooling & performance optimization
    """

    def __init__(self, database_url: str = "sqlite+aiosqlite:///./marine_debris.db"):
        """
        Initialize database connection
        
        Args:
            database_url: SQLAlchemy async database URL
                - SQLite: sqlite+aiosqlite:///./marine_debris.db
                - PostgreSQL: postgresql+asyncpg://user:password@localhost/dbname
        """
        self.database_url = database_url
        self.engine = None
        self.async_session = None
        
        logger.info(f"🗄️  Initializing production database: {database_url.split('://')[0]}")

    async def initialize(self):
        """Initialize database engine and create tables"""
        try:
            self.engine = create_async_engine(
                self.database_url,
                echo=False,
                pool_pre_ping=True,
                pool_size=20,
                max_overflow=10
            )

            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

            self.async_session = sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False
            )

            logger.info("✅ Production database initialized successfully")

        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            raise

    async def shutdown(self):
        """Close database connections"""
        if self.engine:
            await self.engine.dispose()
            logger.info("Database connection closed")

    async def store_detection(
        self,
        detection_id: str,
        latitude: float,
        longitude: float,
        detection_data: Dict,
        satellite_source: str = "unknown",
        model_version: str = "yolov8n-v1"
    ) -> Optional[DebrisDetection]:
        """
        Store debris detection result in database
        
        Args:
            detection_id: Unique detection identifier
            latitude: Detection latitude
            longitude: Detection longitude
            detection_data: Raw detection output from service
            satellite_source: Source satellite/image
            model_version: ML model version used
            
        Returns:
            Stored DebrisDetection record
        """
        try:
            async with self.async_session() as session:
                record = DebrisDetection(
                    detection_id=detection_id,
                    latitude=latitude,
                    longitude=longitude,
                    satellite_source=satellite_source,
                    debris_count=detection_data.get("debris_count", 0),
                    coverage_percentage=detection_data.get("coverage_percentage", 0),
                    debris_types=detection_data.get("debris_types", {}),
                    confidence_scores=detection_data.get("confidence_scores", []),
                    processing_time_ms=detection_data.get("processing_time_ms", 0),
                    model_version=model_version,
                    cloud_coverage=detection_data.get("cloud_coverage")
                )

                session.add(record)
                await session.commit()
                await session.refresh(record)

                logger.info(f"💾 Stored detection {detection_id}: {record.debris_count} items")
                return record

        except Exception as e:
            logger.error(f"Failed to store detection: {e}")
            return None

    async def store_wave_data(
        self,
        record_id: str,
        wave_data: "WaveData",  # Import from real_wave_service
        impact_analysis: Dict
    ) -> Optional[WaveDataRecord]:
        """
        Store wave measurement in database
        
        Args:
            record_id: Unique record identifier
            wave_data: WaveData object from real_wave_service
            impact_analysis: Wave impact on debris analysis
            
        Returns:
            Stored WaveDataRecord
        """
        try:
            async with self.async_session() as session:
                record = WaveDataRecord(
                    record_id=record_id,
                    latitude=wave_data.latitude,
                    longitude=wave_data.longitude,
                    timestamp=wave_data.timestamp,
                    significant_wave_height=wave_data.significant_wave_height,
                    dominant_period=wave_data.dominant_period,
                    mean_direction=wave_data.mean_direction,
                    peak_frequency=wave_data.peak_frequency,
                    wind_speed=wave_data.wind_speed,
                    wind_direction=wave_data.wind_direction,
                    water_temperature=wave_data.water_temperature,
                    swell_height=wave_data.swell_height,
                    impact_analysis=impact_analysis,
                    data_source=wave_data.source
                )

                session.add(record)
                await session.commit()
                await session.refresh(record)

                logger.info(f"💾 Stored wave data {record_id}: {wave_data.significant_wave_height}m")
                return record

        except Exception as e:
            logger.error(f"Failed to store wave data: {e}")
            return None

    async def get_detections_by_location(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 5.0,
        days_back: int = 30
    ) -> List[DebrisDetection]:
        """
        Query detections near a location in recent history
        
        Args:
            latitude: Center latitude
            longitude: Center longitude
            radius_km: Search radius
            days_back: Historical days to query
            
        Returns:
            List of DebrisDetection records
        """
        try:
            async with self.async_session() as session:
                # Simplified distance calculation (real implementation should use PostGIS)
                lat_offset = radius_km / 110.6  # 1 degree ≈ 110.6 km
                lon_offset = radius_km / (111.3 * abs(np.cos(np.radians(latitude))))

                start_date = datetime.utcnow() - timedelta(days=days_back)

                stmt = (
                    select(DebrisDetection)
                    .where(
                        DebrisDetection.latitude.between(
                            latitude - lat_offset,
                            latitude + lat_offset
                        ),
                        DebrisDetection.longitude.between(
                            longitude - lon_offset,
                            longitude + lon_offset
                        ),
                        DebrisDetection.timestamp >= start_date
                    )
                    .order_by(DebrisDetection.timestamp.desc())
                )

                result = await session.execute(stmt)
                detections = result.scalars().all()

                logger.info(f"📊 Found {len(detections)} detections near ({latitude}, {longitude})")
                return detections

        except Exception as e:
            logger.error(f"Location query failed: {e}")
            return []

    async def get_detections_by_time_range(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> List[DebrisDetection]:
        """
        Query detections within time range
        
        Args:
            start_date: Start of range
            end_date: End of range
            
        Returns:
            List of DebrisDetection records
        """
        try:
            async with self.async_session() as session:
                stmt = (
                    select(DebrisDetection)
                    .where(
                        DebrisDetection.timestamp.between(start_date, end_date)
                    )
                    .order_by(DebrisDetection.timestamp.desc())
                )

                result = await session.execute(stmt)
                detections = result.scalars().all()

                logger.info(f"📊 Found {len(detections)} detections in time range")
                return detections

        except Exception as e:
            logger.error(f"Time range query failed: {e}")
            return []

    async def create_alert(
        self,
        alert_id: str,
        latitude: float,
        longitude: float,
        alert_type: str,
        severity: str,
        message: str,
        trigger_metric: str,
        trigger_value: float,
        threshold_value: float
    ) -> Optional[DetectionAlert]:
        """
        Create a real-time detection alert
        
        Args:
            alert_id: Unique alert identifier
            latitude: Alert location latitude
            longitude: Alert location longitude
            alert_type: Type of alert
            severity: Alert severity level
            message: Alert message
            trigger_metric: What triggered alert
            trigger_value: Actual measured value
            threshold_value: Alert threshold
            
        Returns:
            Created DetectionAlert record
        """
        try:
            async with self.async_session() as session:
                alert = DetectionAlert(
                    alert_id=alert_id,
                    latitude=latitude,
                    longitude=longitude,
                    alert_type=alert_type,
                    severity=severity,
                    message=message,
                    trigger_metric=trigger_metric,
                    trigger_value=trigger_value,
                    threshold_value=threshold_value
                )

                session.add(alert)
                await session.commit()
                await session.refresh(alert)

                logger.warning(f"🚨 Created {severity.upper()} alert: {message}")
                return alert

        except Exception as e:
            logger.error(f"Failed to create alert: {e}")
            return None

    async def acknowledge_alert(
        self,
        alert_id: str,
        acknowledged_by: str,
        response_notes: str
    ) -> bool:
        """
        Mark an alert as acknowledged with response
        
        Args:
            alert_id: Alert identifier
            acknowledged_by: User/system acknowledging
            response_notes: Response and action taken
            
        Returns:
            Success status
        """
        try:
            async with self.async_session() as session:
                stmt = select(DetectionAlert).where(DetectionAlert.alert_id == alert_id)
                result = await session.execute(stmt)
                alert = result.scalar_one_or_none()

                if alert:
                    alert.is_acknowledged = True
                    alert.acknowledged_by = acknowledged_by
                    alert.acknowledged_at = datetime.utcnow()
                    alert.response_notes = response_notes

                    await session.commit()
                    logger.info(f"✅ Alert {alert_id} acknowledged by {acknowledged_by}")
                    return True

                return False

        except Exception as e:
            logger.error(f"Failed to acknowledge alert: {e}")
            return False

    async def get_statistics(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict:
        """
        Get statistics for patent documentation
        
        Args:
            start_date: Analysis start date
            end_date: Analysis end date
            
        Returns:
            Statistics dictionary
        """
        try:
            async with self.async_session() as session:
                # Total detections
                total_detections_query = select(func.count(DebrisDetection.id)).where(
                    DebrisDetection.timestamp.between(start_date, end_date)
                )
                total_detections = await session.execute(total_detections_query)
                total_detections = total_detections.scalar() or 0

                # Average coverage
                avg_coverage_query = select(func.avg(DebrisDetection.coverage_percentage)).where(
                    DebrisDetection.timestamp.between(start_date, end_date)
                )
                avg_coverage = await session.execute(avg_coverage_query)
                avg_coverage = float(avg_coverage.scalar() or 0)

                # Alert count
                alert_count_query = select(func.count(DetectionAlert.id)).where(
                    DetectionAlert.timestamp.between(start_date, end_date)
                )
                alert_count = await session.execute(alert_count_query)
                alert_count = alert_count.scalar() or 0

                stats = {
                    "total_detections": total_detections,
                    "average_coverage_percentage": round(avg_coverage, 2),
                    "total_alerts": alert_count,
                    "date_range": {
                        "start": start_date.isoformat(),
                        "end": end_date.isoformat()
                    }
                }

                logger.info(f"📈 Generated statistics: {stats}")
                return stats

        except Exception as e:
            logger.error(f"Statistics generation failed: {e}")
            return {}


# Import for use in database queries
from sqlalchemy import select
import numpy as np
