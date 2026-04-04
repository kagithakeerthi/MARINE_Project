# Marine Technology - Satellite Debris & Risk Detection Platform

AI-powered environmental monitoring platform for detecting marine debris, ecosystem health, and wave risk factors using satellite imagery.

## Quick Start

### Frontend Setup

```bash
cd frontend
npm install
```

### Environment Configuration

Create `.env` file in frontend directory:

```
VITE_API_URL=http://localhost:8000/api/v1
```

### Development

```bash
# Install dependencies
npm install

# Start development server (hot reload)
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The backend API will run at `http://localhost:8000`

## Architecture

### Frontend Technologies
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Lucide React** - Icons

### Key Features
- **Dashboard** - Real-time monitoring of debris zones, ecosystem health, and alerts
- **Debris Detection** - Upload satellite images for debris detection and analysis
- **Map View** - Interactive visualization of debris zones and ecosystem regions
- **Ecosystem Analysis** - Change detection and health scoring
- **Alerts System** - Real-time notifications for environmental events
- **Wave Monitoring** - Current conditions and forecasts

### Project Structure

```
frontend/
├── src/
│   ├── pages/           # Route pages
│   ├── components/      # Reusable components
│   ├── stores/          # Zustand state management
│   ├── services/        # API client
│   ├── hooks/           # Custom React hooks
│   ├── assets/          # Images and media
│   ├── styles/          # Global styles
│   ├── utils/           # Helper functions
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── vite.config.ts       # Vite config
└── tailwind.config.ts   # Tailwind config
```

## Building for Production

### Frontend
```bash
cd frontend
npm install
npm run build
```

Build output will be in `frontend/dist/`

### Backend
```bash
cd backend
pip install -r requirements.txt
# Configure environment variables
python main.py
```

## API Integration

The frontend communicates with the backend API at:
- Default: `http://localhost:8000/api/v1`
- Configurable via `VITE_API_URL` environment variable

### Main Endpoints
- `POST /detect/debris` - Detect debris in satellite images
- `POST /ecosystem/analyze` - Analyze ecosystem health
- `GET /wave/current` - Current wave conditions
- `GET /alerts/active` - Active environmental alerts

## Troubleshooting

### Build Issues
1. Ensure all dependencies are installed: `npm install`
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check Node.js version: `node --version` (v18+ recommended)

### API Connection Issues
1. Backend must be running on port 8000
2. CORS is configured to allow localhost:5173
3. Check `VITE_API_URL` environment variable

### TypeScript Errors
- Run `npm run build` to check for type errors
- TypeScript version is locked to ~5.9.3 in package.json

## Development Notes

- Frontend uses Vite for fast development builds
- TypeScript strict mode is enabled
- Tailwind CSS provides utility-first styling
- Components use React hooks and functional patterns
- State is managed with Zustand for simplicity
