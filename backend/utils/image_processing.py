import cv2
import numpy as np
from PIL import Image
from typing import Tuple, List, Optional
import base64
from io import BytesIO

def resize_image(
    image: np.ndarray,
    target_size: Tuple[int, int],
    keep_aspect: bool = True
) -> np.ndarray:
    """Resize image while optionally maintaining aspect ratio"""
    if keep_aspect:
        h, w = image.shape[:2]
        target_w, target_h = target_size
        
        # Calculate scaling factor
        scale = min(target_w / w, target_h / h)
        new_w, new_h = int(w * scale), int(h * scale)
        
        resized = cv2.resize(image, (new_w, new_h))
        
        # Pad to target size
        pad_w = (target_w - new_w) // 2
        pad_h = (target_h - new_h) // 2
        
        padded = np.zeros((target_h, target_w, 3), dtype=np.uint8)
        padded[pad_h:pad_h + new_h, pad_w:pad_w + new_w] = resized
        
        return padded
    else:
        return cv2.resize(image, target_size)

def normalize_satellite_image(image: np.ndarray) -> np.ndarray:
    """
    Normalize satellite imagery for model input
    Handles different band configurations
    """
    # Convert to float
    image = image.astype(np.float32)
    
    # Per-channel normalization
    for c in range(image.shape[2]):
        channel = image[:, :, c]
        min_val, max_val = np.percentile(channel, [2, 98])
        image[:, :, c] = np.clip((channel - min_val) / (max_val - min_val + 1e-8), 0, 1)
    
    return (image * 255).astype(np.uint8)

def apply_water_enhancement(image: np.ndarray) -> np.ndarray:
    """
    Enhance water features in satellite imagery
    Useful for debris detection
    """
    # Convert to LAB color space
    lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    
    # Apply CLAHE to L channel
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    
    # Merge and convert back
    enhanced = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2RGB)
    
    return enhanced

def calculate_ndwi(
    green_band: np.ndarray,
    nir_band: np.ndarray
) -> np.ndarray:
    """
    Calculate Normalized Difference Water Index
    NDWI = (Green - NIR) / (Green + NIR)
    """
    green = green_band.astype(np.float32)
    nir = nir_band.astype(np.float32)
    
    ndwi = (green - nir) / (green + nir + 1e-8)
    return np.clip(ndwi, -1, 1)

def calculate_fdi(
    red_band: np.ndarray,
    nir_band: np.ndarray,
    swir_band: np.ndarray
) -> np.ndarray:
    """
    Calculate Floating Debris Index
    FDI = NIR - (RED + (SWIR - RED) * λ_factor)
    """
    red = red_band.astype(np.float32)
    nir = nir_band.astype(np.float32)
    swir = swir_band.astype(np.float32)
    
    # Wavelength factor (simplified)
    lambda_factor = 0.5
    
    fdi = nir - (red + (swir - red) * lambda_factor)
    return fdi

def detect_edges(
    image: np.ndarray,
    threshold1: int = 50,
    threshold2: int = 150
) -> np.ndarray:
    """Detect edges using Canny algorithm"""
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, threshold1, threshold2)
    return edges

def create_overlay(
    base_image: np.ndarray,
    mask: np.ndarray,
    color: Tuple[int, int, int],
    alpha: float = 0.5
) -> np.ndarray:
    """Create semi-transparent overlay on image"""
    overlay = base_image.copy()
    
    # Create colored mask
    colored_mask = np.zeros_like(base_image)
    colored_mask[mask > 0] = color
    
    # Blend
    overlay = cv2.addWeighted(overlay, 1 - alpha, colored_mask, alpha, 0)
    
    return overlay

def image_to_base64(image: np.ndarray, format: str = "PNG") -> str:
    """Convert numpy array to base64 encoded string"""
    pil_image = Image.fromarray(image)
    buffer = BytesIO()
    pil_image.save(buffer, format=format)
    return base64.b64encode(buffer.getvalue()).decode()

def base64_to_image(base64_string: str) -> np.ndarray:
    """Convert base64 string to numpy array"""
    image_data = base64.b64decode(base64_string)
    image = Image.open(BytesIO(image_data))
    return np.array(image)

def tile_image(
    image: np.ndarray,
    tile_size: int = 512,
    overlap: int = 64
) -> List[Tuple[np.ndarray, Tuple[int, int]]]:
    """
    Split image into overlapping tiles for processing large images
    Returns list of (tile, (x_offset, y_offset))
    """
    tiles = []
    h, w = image.shape[:2]
    if tile_size <= 0:
        raise ValueError("tile_size must be a positive integer")
    if overlap < 0 or overlap >= tile_size:
        raise ValueError("overlap must be non-negative and smaller than tile_size")
    step = tile_size - overlap
    channels = image.shape[2] if image.ndim == 3 else 1
    
    for y in range(0, h, step):
        for x in range(0, w, step):
            tile = image[y:y + tile_size, x:x + tile_size]
            
            if tile.shape[0] < tile_size or tile.shape[1] < tile_size:
                if channels == 1:
                    padded = np.zeros((tile_size, tile_size), dtype=tile.dtype)
                else:
                    padded = np.zeros((tile_size, tile_size, channels), dtype=tile.dtype)
                padded[:tile.shape[0], :tile.shape[1]] = tile
                tile = padded
            
            tiles.append((tile, (x, y)))
    
    return tiles

def merge_tiles(
    tiles: List[Tuple[np.ndarray, Tuple[int, int]]],
    output_size: Tuple[int, int],
    tile_size: int = 512,
    overlap: int = 64
) -> np.ndarray:
    """Merge tiles back into full image with overlap blending"""
    h, w = output_size
    channels = tiles[0][0].shape[2] if tiles and tiles[0][0].ndim == 3 else 1
    output = np.zeros((h, w, channels), dtype=np.float32)
    weights = np.zeros((h, w), dtype=np.float32)

    for tile, (x, y) in tiles:
        tile_h = min(tile_size, h - y)
        tile_w = min(tile_size, w - x)
        tile_crop = tile[:tile_h, :tile_w]

        weight = np.ones((tile_h, tile_w), dtype=np.float32)
        if overlap > 0:
            x_overlap = min(overlap, tile_w)
            y_overlap = min(overlap, tile_h)

            wx = np.ones(tile_w, dtype=np.float32)
            wy = np.ones(tile_h, dtype=np.float32)

            if x > 0:
                wx[:x_overlap] = np.linspace(0.0, 1.0, x_overlap, endpoint=False)
            if x + tile_w < w:
                wx[-x_overlap:] = np.linspace(1.0, 0.0, x_overlap, endpoint=False)
            if y > 0:
                wy[:y_overlap] = np.linspace(0.0, 1.0, y_overlap, endpoint=False)
            if y + tile_h < h:
                wy[-y_overlap:] = np.linspace(1.0, 0.0, y_overlap, endpoint=False)

            weight = wy[:, np.newaxis] * wx[np.newaxis, :]

        output[y:y + tile_h, x:x + tile_w] += tile_crop * weight[:, :, np.newaxis]
        weights[y:y + tile_h, x:x + tile_w] += weight

    weights = np.maximum(weights, 1e-8)
    output = output / weights[:, :, np.newaxis]

    return output.astype(np.uint8)
