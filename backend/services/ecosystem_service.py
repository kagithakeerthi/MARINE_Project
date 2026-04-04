import torch
import torch.nn as nn
import segmentation_models_pytorch as smp
import numpy as np
from PIL import Image
import cv2
import base64
from io import BytesIO
from typing import Dict, List, Optional, Tuple
from loguru import logger
import torchvision.transforms as transforms

from config.settings import settings

class EcosystemService:
    """Service for ecosystem feature segmentation and analysis"""
    
    # Ecosystem classes for semantic segmentation
    CLASSES = [
        "background",
        "coral_reef",
        "seagrass",
        "algae",
        "clear_water",
        "turbid_water",
        "sediment",
        "debris_zone"
    ]
    
    # Color map for visualization (BGR)
    COLOR_MAP = {
        "background": [0, 0, 0],
        "coral_reef": [255, 127, 80],      # Coral
        "seagrass": [34, 139, 34],          # Forest Green
        "algae": [0, 255, 0],               # Lime
        "clear_water": [255, 191, 0],       # Deep Sky Blue (BGR)
        "turbid_water": [139, 137, 112],    # Slate Gray
        "sediment": [205, 133, 63],         # Peru
        "debris_zone": [0, 0, 255]          # Red
    }
    
    def __init__(self):
        self.model: Optional[nn.Module] = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        logger.info(f"Ecosystem service initialized on {self.device}")
    
    async def load_model(self):
        """Load the segmentation model"""
        try:
            # Using UNet++ with EfficientNet encoder
            self.model = smp.UnetPlusPlus(
                encoder_name="efficientnet-b4",
                encoder_weights="imagenet",
                in_channels=3,
                classes=len(self.CLASSES),
                activation=None
            )
            
            # Load trained weights if available
            model_path = settings.ECOSYSTEM_MODEL_PATH
            try:
                state_dict = torch.load(model_path, map_location=self.device)
                self.model.load_state_dict(state_dict)
                logger.info(f"Loaded ecosystem model from {model_path}")
            except FileNotFoundError:
                logger.warning("No trained ecosystem model found, using pre-trained encoder")
            
            self.model.to(self.device)
            self.model.eval()
            logger.info("Ecosystem segmentation model loaded")
            
        except Exception as e:
            logger.error(f"Failed to load ecosystem model: {e}")
            raise
    
    async def analyze(
        self,
        image: np.ndarray,
        analysis_type: str = "full"
    ) -> Dict:
        """
        Analyze ecosystem features in an image
        
        Args:
            image: RGB image as numpy array
            analysis_type: Type of analysis (full, coral, algae, water_quality)
        
        Returns:
            Dictionary with segmentation mask and statistics
        """
        original_size = image.shape[:2]
        
        # Resize for model input
        image_resized = cv2.resize(image, (512, 512))
        image_tensor = self.transform(Image.fromarray(image_resized))
        image_tensor = image_tensor.unsqueeze(0).to(self.device)
        
        # Run inference
        with torch.no_grad():
            output = self.model(image_tensor)
            mask = torch.argmax(output, dim=1).squeeze().cpu().numpy()
        
        # Resize mask back to original size
        mask = cv2.resize(
            mask.astype(np.uint8),
            (original_size[1], original_size[0]),
            interpolation=cv2.INTER_NEAREST
        )
        
        # Generate colored mask
        colored_mask = self._colorize_mask(mask)
        mask_base64 = self._array_to_base64(colored_mask)
        
        # Calculate statistics
        statistics = self._calculate_statistics(mask, original_size)
        
        # Calculate health index
        health_index = self._calculate_health_index(statistics)
        
        # Extract regions
        regions = self._extract_regions(mask)
        
        return {
            "mask_base64": mask_base64,
            "statistics": statistics,
            "health_index": health_index,
            "regions": regions
        }
    
    async def compare_temporal(
        self,
        image_before: np.ndarray,
        image_after: np.ndarray
    ) -> Dict:
        """Compare two temporal images to detect ecosystem changes"""
        
        # Analyze both images
        result_before = await self.analyze(image_before)
        result_after = await self.analyze(image_after)
        
        stats_before = result_before["statistics"]
        stats_after = result_after["statistics"]
        
        # Calculate changes
        changes = {}
        degradation_zones = []
        recovery_zones = []
        
        for class_name in self.CLASSES:
            if class_name == "background":
                continue
            
            before_pct = stats_before.get(class_name, {}).get("percentage", 0)
            after_pct = stats_after.get(class_name, {}).get("percentage", 0)
            change = after_pct - before_pct
            
            changes[class_name] = {
                "before": before_pct,
                "after": after_pct,
                "change": change,
                "status": "increased" if change > 0 else "decreased" if change < 0 else "stable"
            }
            
            # Identify degradation (coral/seagrass decrease) or recovery
            if class_name in ["coral_reef", "seagrass"]:
                if change < -5:
                    degradation_zones.append({
                        "type": class_name,
                        "change_percentage": change
                    })
                elif change > 5:
                    recovery_zones.append({
                        "type": class_name,
                        "change_percentage": change
                    })
        
        # Generate change map
        # (simplified - in practice would do pixel-wise comparison)
        total_change = sum(abs(c["change"]) for c in changes.values())
        
        return {
            "change_detected": total_change > 5,
            "change_percentage": total_change,
            "changes": changes,
            "change_map_base64": result_after["mask_base64"],  # Simplified
            "degradation_zones": degradation_zones,
            "recovery_zones": recovery_zones,
            "health_before": result_before["health_index"],
            "health_after": result_after["health_index"]
        }
    
    def _colorize_mask(self, mask: np.ndarray) -> np.ndarray:
        """Convert class mask to colored visualization"""
        colored = np.zeros((*mask.shape, 3), dtype=np.uint8)
        
        for i, class_name in enumerate(self.CLASSES):
            colored[mask == i] = self.COLOR_MAP[class_name]
        
        return colored
    
    def _calculate_statistics(
        self,
        mask: np.ndarray,
        image_size: Tuple[int, int]
    ) -> Dict:
        """Calculate per-class statistics"""
        total_pixels = image_size[0] * image_size[1]
        statistics = {}
        
        for i, class_name in enumerate(self.CLASSES):
            if class_name == "background":
                continue
            
            class_pixels = np.sum(mask == i)
            percentage = (class_pixels / total_pixels) * 100
            
            statistics[class_name] = {
                "pixel_count": int(class_pixels),
                "percentage": round(percentage, 2),
                "area_km2": round(percentage * 0.01, 4)  # Approximate
            }
        
        return statistics
    
    def _calculate_health_index(self, statistics: Dict) -> Dict:
        """
        Calculate ecosystem health index
        Based on presence of healthy vs degraded features
        """
        # Positive indicators
        coral_score = min(statistics.get("coral_reef", {}).get("percentage", 0) / 20, 1) * 30
        seagrass_score = min(statistics.get("seagrass", {}).get("percentage", 0) / 15, 1) * 25
        clear_water_score = min(statistics.get("clear_water", {}).get("percentage", 0) / 40, 1) * 20
        
        # Negative indicators
        debris_penalty = min(statistics.get("debris_zone", {}).get("percentage", 0) / 5, 1) * 15
        turbid_penalty = min(statistics.get("turbid_water", {}).get("percentage", 0) / 30, 1) * 10
        
        # Calculate overall health
        health_score = coral_score + seagrass_score + clear_water_score - debris_penalty - turbid_penalty
        health_score = max(0, min(100, health_score))
        
        # Determine status
        if health_score >= 70:
            status = "good"
        elif health_score >= 40:
            status = "moderate"
        else:
            status = "poor"
        
        return {
            "score": round(health_score, 1),
            "status": status,
            "components": {
                "coral_contribution": round(coral_score, 1),
                "seagrass_contribution": round(seagrass_score, 1),
                "water_clarity": round(clear_water_score, 1),
                "debris_impact": round(-debris_penalty, 1),
                "turbidity_impact": round(-turbid_penalty, 1)
            }
        }
    
    def _extract_regions(self, mask: np.ndarray) -> List[Dict]:
        """Extract distinct regions from mask"""
        regions = []
        
        for i, class_name in enumerate(self.CLASSES):
            if class_name == "background":
                continue
            
            class_mask = (mask == i).astype(np.uint8)
            contours, _ = cv2.findContours(
                class_mask,
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE
            )
            
            for j, contour in enumerate(contours):
                if cv2.contourArea(contour) > 100:  # Filter small regions
                    # Get bounding box
                    x, y, w, h = cv2.boundingRect(contour)
                    
                    # Get centroid
                    M = cv2.moments(contour)
                    if M["m00"] > 0:
                        cx = int(M["m10"] / M["m00"])
                        cy = int(M["m01"] / M["m00"])
                    else:
                        cx, cy = x + w // 2, y + h // 2
                    
                    regions.append({
                        "id": f"{class_name}_{j}",
                        "type": class_name,
                        "bbox": [x, y, w, h],
                        "centroid": [cx, cy],
                        "area_pixels": int(cv2.contourArea(contour))
                    })
        
        return regions
    
    def _array_to_base64(self, array: np.ndarray) -> str:
        """Convert numpy array to base64 string"""
        image = Image.fromarray(array.astype(np.uint8))
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode()
