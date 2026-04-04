import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision.models.detection import fasterrcnn_resnet50_fpn_v2, FasterRCNN_ResNet50_FPN_V2_Weights
import numpy as np
from PIL import Image
import cv2
import base64
from io import BytesIO
from typing import Dict, List, Tuple, Optional
from loguru import logger
import asyncio

from config.settings import settings

class DebrisDetectionModel(nn.Module):
    """
    Marine Debris Detection Model based on Faster R-CNN
    Trained to detect: plastic, fishing nets, wood, foam, mixed debris
    """
    
    DEBRIS_CLASSES = [
        "__background__",
        "plastic_debris",
        "fishing_net",
        "wood_debris", 
        "foam",
        "mixed_debris",
        "oil_slick",
        "algae_bloom"
    ]
    
    def __init__(self, num_classes: int = 8):
        super().__init__()
        # Load pre-trained Faster R-CNN
        self.model = fasterrcnn_resnet50_fpn_v2(
            weights=FasterRCNN_ResNet50_FPN_V2_Weights.DEFAULT
        )
        
        # Replace head for our classes
        in_features = self.model.roi_heads.box_predictor.cls_score.in_features
        self.model.roi_heads.box_predictor = FastRCNNPredictor(
            in_features, num_classes
        )
    
    def forward(self, images, targets=None):
        return self.model(images, targets)

class FastRCNNPredictor(nn.Module):
    def __init__(self, in_channels, num_classes):
        super().__init__()
        self.cls_score = nn.Linear(in_channels, num_classes)
        self.bbox_pred = nn.Linear(in_channels, num_classes * 4)
    
    def forward(self, x):
        scores = self.cls_score(x)
        bbox_deltas = self.bbox_pred(x)
        return scores, bbox_deltas

class DetectionService:
    """Service for marine debris detection"""
    
    def __init__(self):
        self.model: Optional[DebrisDetectionModel] = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        logger.info(f"Detection service initialized on {self.device}")
    
    async def load_model(self):
        """Load the trained detection model"""
        try:
            self.model = DebrisDetectionModel(
                num_classes=len(DebrisDetectionModel.DEBRIS_CLASSES)
            )
            
            # Load trained weights if available
            model_path = settings.DEBRIS_MODEL_PATH
            try:
                state_dict = torch.load(model_path, map_location=self.device)
                self.model.load_state_dict(state_dict)
                logger.info(f"Loaded trained model from {model_path}")
            except FileNotFoundError:
                logger.warning("No trained model found, using pre-trained weights")
            
            self.model.to(self.device)
            self.model.eval()
            logger.info("Debris detection model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    async def detect(
        self,
        image: np.ndarray,
        confidence_threshold: float = None
    ) -> Dict:
        """
        Detect debris in an image
        
        Args:
            image: RGB image as numpy array (H, W, C)
            confidence_threshold: Minimum confidence for detections
        
        Returns:
            Dictionary with detections, heatmap, and statistics
        """
        if confidence_threshold is None:
            confidence_threshold = settings.DEBRIS_CONFIDENCE_THRESHOLD
        
        # Preprocess image
        image_tensor = self.transform(Image.fromarray(image))
        image_tensor = image_tensor.unsqueeze(0).to(self.device)
        
        # Run inference
        with torch.no_grad():
            predictions = self.model([image_tensor[0]])
        
        pred = predictions[0]
        
        # Filter by confidence
        mask = pred["scores"] >= confidence_threshold
        boxes = pred["boxes"][mask].cpu().numpy()
        scores = pred["scores"][mask].cpu().numpy()
        labels = pred["labels"][mask].cpu().numpy()
        
        # Build detections list
        detections = []
        debris_types = {}
        
        for i, (box, score, label) in enumerate(zip(boxes, scores, labels)):
            class_name = DebrisDetectionModel.DEBRIS_CLASSES[label]
            detection = {
                "id": i,
                "bbox": box.tolist(),  # [x1, y1, x2, y2]
                "confidence": float(score),
                "class": class_name,
                "area": float((box[2] - box[0]) * (box[3] - box[1]))
            }
            detections.append(detection)
            
            debris_types[class_name] = debris_types.get(class_name, 0) + 1
        
        # Generate heatmap
        heatmap = self._generate_heatmap(image.shape[:2], boxes, scores)
        heatmap_base64 = self._array_to_base64(heatmap)
        
        # Generate annotated image
        annotated = self._draw_detections(image.copy(), detections)
        annotated_base64 = self._array_to_base64(annotated)
        
        # Calculate coverage
        total_debris_area = sum(d["area"] for d in detections)
        image_area = image.shape[0] * image.shape[1]
        coverage = (total_debris_area / image_area) * 100
        
        return {
            "detections": detections,
            "debris_count": len(detections),
            "debris_types": debris_types,
            "coverage_percentage": round(coverage, 2),
            "heatmap_base64": heatmap_base64,
            "annotated_image_base64": annotated_base64
        }
    
    def _generate_heatmap(
        self,
        image_shape: Tuple[int, int],
        boxes: np.ndarray,
        scores: np.ndarray
    ) -> np.ndarray:
        """Generate a heatmap showing debris concentration"""
        heatmap = np.zeros(image_shape, dtype=np.float32)
        
        for box, score in zip(boxes, scores):
            x1, y1, x2, y2 = box.astype(int)
            heatmap[y1:y2, x1:x2] += score
        
        # Normalize
        if heatmap.max() > 0:
            heatmap = heatmap / heatmap.max()
        
        # Apply colormap
        heatmap_colored = cv2.applyColorMap(
            (heatmap * 255).astype(np.uint8),
            cv2.COLORMAP_JET
        )
        
        return heatmap_colored
    
    def _draw_detections(
        self,
        image: np.ndarray,
        detections: List[Dict]
    ) -> np.ndarray:
        """Draw bounding boxes and labels on image"""
        colors = {
            "plastic_debris": (255, 0, 0),
            "fishing_net": (0, 255, 0),
            "wood_debris": (139, 69, 19),
            "foam": (255, 255, 0),
            "mixed_debris": (255, 165, 0),
            "oil_slick": (0, 0, 0),
            "algae_bloom": (0, 128, 0)
        }
        
        for det in detections:
            box = np.array(det["bbox"]).astype(int)
            color = colors.get(det["class"], (255, 255, 255))
            
            # Draw box
            cv2.rectangle(image, (box[0], box[1]), (box[2], box[3]), color, 2)
            
            # Draw label
            label = f"{det['class']}: {det['confidence']:.2f}"
            cv2.putText(
                image, label,
                (box[0], box[1] - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5, color, 2
            )
        
        return image
    
    def _array_to_base64(self, array: np.ndarray) -> str:
        """Convert numpy array to base64 string"""
        image = Image.fromarray(array.astype(np.uint8))
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode()
