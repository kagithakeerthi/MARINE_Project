# MARINE_Project

## Overview

This is an AI-powered environmental monitoring platform for detecting marine debris, ecosystem health, and wave risk factors using satellite technology.

## Satellite Technology Implementation ✅

Satellite technology is now fully integrated and operational in this project:

### 1. **Working API Endpoints**
- **Debris Detection**: `POST /api/v1/detect/debris` - Processes satellite/drone images for marine debris detection
- **Ecosystem Analysis**: `POST /api/v1/ecosystem/analyze` - Analyzes ecosystem features in satellite imagery
- **Batch Processing**: `POST /api/v1/detect/batch` - Processes multiple images simultaneously

### 2. **Sample Satellite Images**
- Located in `backend/data/satellite/` directory
- Includes realistic coastal and ocean imagery with simulated debris
- Ready for testing and demonstration

### 3. **Image Processing Pipeline**
- Automatic image preprocessing and normalization
- AI-powered debris detection with confidence scoring
- Heatmap generation and annotated image output
- Ecosystem segmentation and health analysis

### 4. **Frontend Integration**
- File upload interface for satellite images
- Real-time processing results display
- 3D visualization of satellite data
- Interactive map with satellite imagery layers

## Data Structure

The project includes comprehensive sample data across multiple sources:

### 📁 `backend/data/`
- **`satellite/`** - 5 satellite images (1024x768) with coastal and ocean scenes
- **`drone/`** - 5 high-resolution drone images (1920x1080) with detailed coastal views
- **`annotations/`** - 8 JSON annotation files with bounding boxes and metadata for training
- **`processed/`** - 5 JSON files with processed analysis results and feature extractions
- **`wave/`** - 6 files (3 CSV + 3 JSON) with wave monitoring data and analysis

### Sample Data Highlights:
- **Satellite Images**: 5 images (1024x768) with coastal and ocean scenes
- **Drone Images**: 5 high-resolution images (1920x1080) with detailed coastal views  
- **Annotations**: 8 JSON files with bounding boxes and metadata for training
- **Processed Data**: 5 JSON files with AI analysis results and feature extractions
- **Wave Data**: 6 files (3 CSV + 3 JSON) with wave monitoring and risk assessment

**Total: 29 sample data files** across all categories for comprehensive testing and demonstration.