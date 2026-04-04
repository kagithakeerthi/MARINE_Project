from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from loguru import logger
import uuid
import asyncio

from config.settings import settings

class Alert:
    """Alert data structure"""
    
    def __init__(
        self,
        alert_type: str,
        severity: str,
        location: Tuple[float, float],
        message: str,
        data: Dict = None
    ):
        self.id = str(uuid.uuid4())
        self.type = alert_type
        self.severity = severity
        self.location = location
        self.message = message
        self.data = data or {}
        self.created_at = datetime.utcnow()
        self.expires_at = datetime.utcnow() + timedelta(hours=24)
        self.acknowledged = False
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "type": self.type,
            "severity": self.severity,
            "location": {"lat": self.location[0], "lon": self.location[1]},
            "message": self.message,
            "data": self.data,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat(),
            "acknowledged": self.acknowledged
        }

class AlertService:
    """Service for managing alerts and risk assessment"""
    
    SEVERITY_LEVELS = ["low", "medium", "high", "critical"]
    ALERT_TYPES = ["debris", "ecosystem", "wave", "drift"]
    
    def __init__(self):
        self.active_alerts: Dict[str, Alert] = {}
        self.subscriptions: List[Dict] = []
        logger.info("Alert service initialized")
    
    async def assess_risk(
        self,
        location: Tuple[float, float],
        wave_data: Dict,
        debris_data: Optional[Dict] = None
    ) -> Dict:
        """
        Assess risk level for debris drift and ecosystem impact
        """
        risk_factors = []
        risk_score = 0
        
        # Wave height risk
        wave_height = wave_data.get("wave_height", 0)
        if wave_height > 3:
            risk_factors.append({
                "factor": "high_waves",
                "value": wave_height,
                "contribution": 30
            })
            risk_score += 30
        elif wave_height > 1.5:
            risk_factors.append({
                "factor": "moderate_waves",
                "value": wave_height,
                "contribution": 15
            })
            risk_score += 15
        
        # Wind speed risk
        wind_speed = wave_data.get("wind_speed", 0)
        if wind_speed > 15:
            risk_factors.append({
                "factor": "strong_wind",
                "value": wind_speed,
                "contribution": 25
            })
            risk_score += 25
        elif wind_speed > 8:
            risk_factors.append({
                "factor": "moderate_wind",
                "value": wind_speed,
                "contribution": 10
            })
            risk_score += 10
        
        # Debris concentration risk
        if debris_data:
            debris_count = debris_data.get("debris_count", 0)
            if debris_count > 20:
                risk_factors.append({
                    "factor": "high_debris_concentration",
                    "value": debris_count,
                    "contribution": 35
                })
                risk_score += 35
            elif debris_count > 5:
                risk_factors.append({
                    "factor": "moderate_debris",
                    "value": debris_count,
                    "contribution": 15
                })
                risk_score += 15
        
        # Determine risk level
        if risk_score >= 70:
            risk_level = "critical"
        elif risk_score >= 50:
            risk_level = "high"
        elif risk_score >= 25:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        # Calculate drift prediction
        from services.wave_service import WaveService
        wave_service = WaveService()
        drift = await wave_service.calculate_drift_vector(wave_data, duration_hours=24)
        
        # Identify potentially affected zones
        affected_zones = self._identify_affected_zones(location, drift)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(risk_level, risk_factors)
        
        # Create alert if risk is high
        if risk_level in ["high", "critical"]:
            alert = Alert(
                alert_type="drift",
                severity=risk_level,
                location=location,
                message=f"High debris drift risk detected. Predicted movement: {drift['displacement_km']:.1f} km in 24 hours.",
                data={
                    "risk_score": risk_score,
                    "drift": drift,
                    "affected_zones": affected_zones
                }
            )
            self.active_alerts[alert.id] = alert
        
        return {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "risk_factors": risk_factors,
            "drift_prediction": drift,
            "affected_zones": affected_zones,
            "recommendations": recommendations
        }
    
    def _identify_affected_zones(
        self,
        origin: Tuple[float, float],
        drift: Dict
    ) -> List[Dict]:
        """Identify marine protected areas or sensitive zones that might be affected"""
        # In production, this would query a database of protected areas
        # For demo, return example zones
        
        import math
        
        lat, lon = origin
        direction = drift["drift_direction"]
        distance = drift["displacement_km"]
        
        # Calculate projected position
        # Simplified - doesn't account for Earth's curvature
        rad_dir = math.radians(direction)
        delta_lat = (distance / 111) * math.cos(rad_dir)  # ~111 km per degree
        delta_lon = (distance / (111 * math.cos(math.radians(lat)))) * math.sin(rad_dir)
        
        projected_lat = lat + delta_lat
        projected_lon = lon + delta_lon
        
        # Example protected zones
        protected_zones = [
            {
                "name": "Marine Sanctuary A",
                "center": (lat + 0.5, lon + 0.3),
                "type": "coral_reserve"
            },
            {
                "name": "Coastal Protected Area B",
                "center": (lat - 0.2, lon + 0.5),
                "type": "breeding_ground"
            }
        ]
        
        affected = []
        for zone in protected_zones:
            zone_lat, zone_lon = zone["center"]
            # Simple distance check
            dist_to_zone = math.sqrt(
                (projected_lat - zone_lat) ** 2 +
                (projected_lon - zone_lon) ** 2
            ) * 111  # Approximate km
            
            if dist_to_zone < 50:  # Within 50 km
                affected.append({
                    **zone,
                    "distance_km": round(dist_to_zone, 1),
                    "estimated_arrival_hours": round(dist_to_zone / (drift["drift_speed_ms"] * 3.6), 1) if drift["drift_speed_ms"] > 0 else None
                })
        
        return affected
    
    def _generate_recommendations(
        self,
        risk_level: str,
        risk_factors: List[Dict]
    ) -> List[str]:
        """Generate actionable recommendations based on risk assessment"""
        recommendations = []
        
        if risk_level == "critical":
            recommendations.append("URGENT: Initiate emergency debris collection protocols")
            recommendations.append("Alert coastal communities in projected path")
            recommendations.append("Deploy monitoring vessels to track debris movement")
        
        if risk_level in ["high", "critical"]:
            recommendations.append("Increase aerial surveillance frequency")
            recommendations.append("Notify marine protected area managers")
        
        for factor in risk_factors:
            if factor["factor"] == "high_waves":
                recommendations.append("Postpone water-based cleanup operations due to rough seas")
            if factor["factor"] == "high_debris_concentration":
                recommendations.append("Prioritize this area for cleanup deployment")
        
        if not recommendations:
            recommendations.append("Continue routine monitoring")
            recommendations.append("No immediate action required")
        
        return recommendations
    
    async def get_active_alerts(self) -> List[Dict]:
        """Get all active (non-expired) alerts"""
        now = datetime.utcnow()
        active = [
            alert.to_dict()
            for alert in self.active_alerts.values()
            if alert.expires_at > now and not alert.acknowledged
        ]
        return sorted(active, key=lambda x: x["created_at"], reverse=True)
    
    async def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge an alert"""
        if alert_id in self.active_alerts:
            self.active_alerts[alert_id].acknowledged = True
            return True
        return False
    
    async def create_subscription(
        self,
        center: Tuple[float, float],
        radius_km: float,
        alert_types: List[str]
    ) -> Dict:
        """Create a subscription for alerts in a region"""
        subscription = {
            "id": str(uuid.uuid4()),
            "center": center,
            "radius_km": radius_km,
            "alert_types": alert_types,
            "created_at": datetime.utcnow().isoformat()
        }
        self.subscriptions.append(subscription)
        return subscription
