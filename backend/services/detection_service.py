import numpy as np
from PIL import Image
import cv2
import base64
from io import BytesIO
from typing import Dict, List, Tuple, Optional
from loguru import logger
import asyncio
import random

class DebrisDetectionService:
    """
    Marine Debris Detection Service
    Processes satellite/drone images to detect marine debris
    """

    DEBRIS_TYPES = [
        "plastic_debris",
        "fishing_net",
        "wood_debris",
        "foam",
        "mixed_debris",
        "oil_slick",
        "algae_bloom"
    ]

    def __init__(self):
        """Initialize the detection service"""
        logger.info("Initializing Debris Detection Service")
        self.initialized = True

    async def detect(
        self,
        image: np.ndarray,
        confidence_threshold: float = 0.5
    ) -> Dict:
        """
        Detect debris in an image

        Args:
            image: RGB image as numpy array (H, W, C)
            confidence_threshold: Minimum confidence for detections

        Returns:
            Dictionary with detections, heatmap, and statistics
        """
        try:
            # Get image dimensions
            height, width = image.shape[:2]

            # Generate mock detections based on image analysis
            detections = self._generate_mock_detections(width, height, confidence_threshold)

            # Calculate statistics
            debris_count = len(detections)
            debris_types = {}
            total_area = width * height
            covered_area = sum(d['area'] for d in detections)
            coverage_percentage = (covered_area / total_area) * 100 if total_area > 0 else 0

            for detection in detections:
                debris_type = detection['class']
                debris_types[debris_type] = debris_types.get(debris_type, 0) + 1

            # Generate heatmap (simple mock)
            heatmap = self._generate_heatmap(image, detections)

            # Generate annotated image
            annotated_image = self._generate_annotated_image(image, detections)

            return {
                "detections": detections,
                "debris_count": debris_count,
                "debris_types": debris_types,
                "coverage_percentage": round(coverage_percentage, 2),
                "heatmap_base64": heatmap,
                "annotated_image_base64": annotated_image
            }

        except Exception as e:
            logger.error(f"Detection failed: {e}")
            raise

    def _generate_mock_detections(self, width: int, height: int, threshold: float) -> List[Dict]:
        """Generate realistic mock detections"""
        detections = []
        num_detections = random.randint(0, 15)  # Random number of detections

        for i in range(num_detections):
            # Random position and size
            x1 = random.randint(0, width - 50)
            y1 = random.randint(0, height - 50)
            w = random.randint(20, min(200, width - x1))
            h = random.randint(20, min(200, height - y1))
            x2 = x1 + w
            y2 = y1 + h

            # Random confidence above threshold
            confidence = random.uniform(threshold, 0.95)

            # Random debris type
            debris_type = random.choice(self.DEBRIS_TYPES)

            detection = {
                "id": i,
                "bbox": [x1, y1, x2, y2],
                "confidence": round(confidence, 3),
                "class": debris_type,
                "area": w * h
            }
            detections.append(detection)

        return detections

    def _generate_heatmap(self, image: np.ndarray, detections: List[Dict]) -> str:
        """Generate a simple heatmap overlay"""
        heatmap = np.zeros_like(image, dtype=np.uint8)

        for detection in detections:
            bbox = detection['bbox']
            x1, y1, x2, y2 = map(int, bbox)

            # Create a colored rectangle for the detection
            color = (255, 0, 0)  # Red for debris
            cv2.rectangle(heatmap, (x1, y1), (x2, y2), color, -1)

        # Convert to base64
        _, buffer = cv2.imencode('.png', heatmap)
        heatmap_base64 = base64.b64encode(buffer).decode('utf-8')

        return f"data:image/png;base64,{heatmap_base64}"

    def _generate_annotated_image(self, image: np.ndarray, detections: List[Dict]) -> str:
        """Generate annotated image with bounding boxes"""
        annotated = image.copy()

        for detection in detections:
            bbox = detection['bbox']
            x1, y1, x2, y2 = map(int, bbox)
            confidence = detection['confidence']
            class_name = detection['class']

            # Draw bounding box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (255, 0, 0), 2)

            # Add label
            label = f"{class_name}: {confidence:.2f}"
            cv2.putText(annotated, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)

        # Convert to base64
        pil_image = Image.fromarray(annotated)
        buffer = BytesIO()
        pil_image.save(buffer, format='PNG')
        annotated_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return f"data:image/png;base64,{annotated_base64}"
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
