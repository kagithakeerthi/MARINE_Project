import httpx
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from loguru import logger
import asyncio
import random

from config.settings import settings

class WaveService:
    """Service for fetching and processing wave data"""
    
    def __init__(self):
        self.cache: Dict = {}
        self.cache_duration = timedelta(minutes=30)
        logger.info("Wave service initialized")
    
    async def get_wave_data(
        self,
        lat: float,
        lon: float
    ) -> Dict:
        """
        Get current wave conditions for a location
        
        In production, this would fetch from NOAA WAVEWATCH III or similar API
        """
        cache_key = f"{lat:.2f}_{lon:.2f}"
        
        # Check cache
        if cache_key in self.cache:
            cached_data, cached_time = self.cache[cache_key]
            if datetime.utcnow() - cached_time < self.cache_duration:
                return cached_data
        
        # Fetch new data (simulated - replace with actual API call)
        try:
            data = await self._fetch_wave_data(lat, lon)
            self.cache[cache_key] = (data, datetime.utcnow())
            return data
        except Exception as e:
            logger.error(f"Error fetching wave data: {e}")
            # Return simulated data as fallback
            return self._generate_simulated_data(lat, lon)
    
    async def _fetch_wave_data(
        self,
        lat: float,
        lon: float
    ) -> Dict:
        """
        Fetch wave data from external API
        
        In production, implement actual API calls to:
        - NOAA WAVEWATCH III
        - Copernicus Marine Service
        - ECMWF
        """
        # Simulated API call - replace with real implementation
        await asyncio.sleep(0.1)  # Simulate network delay
        
        return self._generate_simulated_data(lat, lon)
    
    def _generate_simulated_data(
        self,
        lat: float,
        lon: float
    ) -> Dict:
        """Generate realistic simulated wave data for demo purposes"""
        # Base values vary by latitude (rougher seas at higher latitudes)
        lat_factor = abs(lat) / 90.0
        
        # Add some randomness
        wave_height = 0.5 + lat_factor * 2 + random.uniform(-0.3, 0.3)
        wave_period = 6 + lat_factor * 4 + random.uniform(-1, 1)
        wave_direction = (lon * 2 + random.uniform(-30, 30)) % 360
        
        wind_speed = 5 + lat_factor * 15 + random.uniform(-3, 3)
        wind_direction = (lon * 2 + 180 + random.uniform(-20, 20)) % 360
        
        return {
            "wave_height": round(max(0.1, wave_height), 2),  # meters
            "wave_direction": round(wave_direction, 1),  # degrees
            "wave_period": round(max(3, wave_period), 1),  # seconds
            "wind_speed": round(max(0, wind_speed), 1),  # m/s
            "wind_direction": round(wind_direction, 1),  # degrees
            "sea_surface_temperature": round(20 + (90 - abs(lat)) / 90 * 10 + random.uniform(-2, 2), 1),
            "current_speed": round(random.uniform(0.1, 1.5), 2),  # m/s
            "current_direction": round(random.uniform(0, 360), 1),
            "timestamp": datetime.utcnow().isoformat(),
            "source": "simulated"
        }
    
    async def get_forecast(
        self,
        lat: float,
        lon: float,
        hours: int = 24
    ) -> List[Dict]:
        """Get wave forecast for specified hours ahead"""
        current = await self.get_wave_data(lat, lon)
        forecast = []
        
        base_height = current["wave_height"]
        base_direction = current["wave_direction"]
        
        for h in range(0, hours, 3):  # 3-hour intervals
            # Simulate gradual changes
            height_change = np.sin(h / 12 * np.pi) * 0.5 + random.uniform(-0.2, 0.2)
            dir_change = random.uniform(-10, 10)
            
            forecast.append({
                "forecast_hour": h,
                "timestamp": (datetime.utcnow() + timedelta(hours=h)).isoformat(),
                "wave_height": round(max(0.1, base_height + height_change), 2),
                "wave_direction": round((base_direction + dir_change) % 360, 1),
                "confidence": round(max(0.5, 1 - h / hours * 0.5), 2)
            })
        
        return forecast
    
    async def calculate_drift_vector(
        self,
        wave_data: Dict,
        duration_hours: float = 1.0
    ) -> Dict:
        """
        Calculate debris drift vector based on wave and current data
        
        Uses simplified Stokes drift approximation
        """
        wave_height = wave_data["wave_height"]
        wave_period = wave_data["wave_period"]
        wave_dir = np.radians(wave_data["wave_direction"])
        
        current_speed = wave_data.get("current_speed", 0)
        current_dir = np.radians(wave_data.get("current_direction", 0))
        
        # Stokes drift velocity (simplified)
        # V_stokes ≈ (π * H²) / (λ * T) where λ ≈ 1.56 * T²
        wavelength = 1.56 * wave_period ** 2
        stokes_speed = (np.pi * wave_height ** 2) / (wavelength * wave_period)
        
        # Combined drift (wave + current)
        wave_vx = stokes_speed * np.sin(wave_dir)
        wave_vy = stokes_speed * np.cos(wave_dir)
        
        current_vx = current_speed * np.sin(current_dir)
        current_vy = current_speed * np.cos(current_dir)
        
        total_vx = wave_vx + current_vx
        total_vy = wave_vy + current_vy
        
        # Calculate displacement
        drift_speed = np.sqrt(total_vx ** 2 + total_vy ** 2)
        drift_direction = np.degrees(np.arctan2(total_vx, total_vy)) % 360
        
        displacement_km = drift_speed * duration_hours * 3.6  # Convert m/s to km/h
        
        return {
            "drift_speed_ms": round(drift_speed, 3),
            "drift_direction": round(drift_direction, 1),
            "displacement_km": round(displacement_km, 2),
            "components": {
                "wave_contribution": round(stokes_speed, 3),
                "current_contribution": round(current_speed, 3)
            }
        }
