import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Layers,
  Eye,
  EyeOff,
  Globe,
  Satellite,
  MapPin,
} from 'lucide-react';
import { WORLDWIDE_BEACHES } from '../data/beaches';

interface DebrisPoint {
  id: string;
  x: number;
  y: number;
  z: number;
  size: number;
  type: 'plastic' | 'metal' | 'organic' | 'chemical';
  opacity: number;
}

const Viewer3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedBeach, setSelectedBeach] = useState(WORLDWIDE_BEACHES[0]);
  const [showDebris, setShowDebris] = useState(true);
  const [showTerrain, setShowTerrain] = useState(true);
  const [showWater, setShowWater] = useState(true);
  const [debrisPoints, setDebrisPoints] = useState<DebrisPoint[]>([]);
  const [animationFrame, setAnimationFrame] = useState<number | null>(null);

  // Generate 3D debris data
  useEffect(() => {
    const generateDebrisData = () => {
      const points: DebrisPoint[] = [];
      const types: DebrisPoint['type'][] = ['plastic', 'metal', 'organic', 'chemical'];

      for (let i = 0; i < 200; i++) {
        points.push({
          id: `debris-${i}`,
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 4,
          z: (Math.random() - 0.5) * 4,
          size: Math.random() * 0.05 + 0.01,
          type: types[Math.floor(Math.random() * types.length)],
          opacity: Math.random() * 0.8 + 0.2,
        });
      }
      setDebrisPoints(points);
    };

    generateDebrisData();
  }, [selectedBeach]);

  // 3D Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set up 3D projection
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const focalLength = 300 * zoom;

      // Draw water surface
      if (showWater) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 100, 200, 0.3)';
        ctx.fillRect(0, centerY, canvas.width, canvas.height - centerY);
        ctx.restore();
      }

      // Draw terrain/base
      if (showTerrain) {
        ctx.save();
        ctx.fillStyle = 'rgba(34, 139, 34, 0.4)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 50, 150, 80, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw debris points
      if (showDebris) {
        debrisPoints.forEach(point => {
          // Apply rotation
          const cosX = Math.cos(rotation.x);
          const sinX = Math.sin(rotation.x);
          const cosY = Math.cos(rotation.y);
          const sinY = Math.sin(rotation.y);

          let x = point.x;
          let y = point.y;
          let z = point.z;

          // Rotate around Y axis
          const tempX = x * cosY - z * sinY;
          z = x * sinY + z * cosY;
          x = tempX;

          // Rotate around X axis
          const tempY = y * cosX - z * sinX;
          z = y * sinX + z * cosX;
          y = tempY;

          // Project to 2D
          const scale = focalLength / (focalLength + z);
          const screenX = centerX + x * scale * 100;
          const screenY = centerY + y * scale * 100;

          // Only draw if in front of camera
          if (z > -2 && scale > 0) {
            const size = point.size * scale * 200;

            // Color based on debris type
            let color = '#ffffff';
            switch (point.type) {
              case 'plastic': color = '#ff6b6b'; break;
              case 'metal': color = '#4ecdc4'; break;
              case 'organic': color = '#45b7d1'; break;
              case 'chemical': color = '#f9ca24'; break;
            }

            ctx.save();
            ctx.globalAlpha = point.opacity;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, Math.max(size, 1), 0, Math.PI * 2);
            ctx.fill();

            // Add glow effect
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.restore();
          }
        });
      }

      // Draw beach marker
      const beachX = centerX;
      const beachY = centerY + 20;

      ctx.save();
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(beachX, beachY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(selectedBeach.name.split(',')[0], beachX, beachY - 15);
      ctx.restore();

      if (isPlaying) {
        setRotation(prev => ({
          ...prev,
          y: prev.y + 0.01,
        }));
      }
    };

    const animate = () => {
      render();
      const frame = requestAnimationFrame(animate);
      setAnimationFrame(frame);
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [rotation, zoom, showDebris, showTerrain, showWater, debrisPoints, selectedBeach, isPlaying]);

  const resetView = () => {
    setRotation({ x: 0, y: 0, z: 0 });
    setZoom(1);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Simple interaction - could be expanded for debris selection
    console.log('Clicked at:', x, y);
  };

  const getDebrisStats = () => {
    const stats = {
      plastic: debrisPoints.filter(p => p.type === 'plastic').length,
      metal: debrisPoints.filter(p => p.type === 'metal').length,
      organic: debrisPoints.filter(p => p.type === 'organic').length,
      chemical: debrisPoints.filter(p => p.type === 'chemical').length,
    };
    return stats;
  };

  const stats = getDebrisStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                <Box className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">3D Satellite Viewer</h1>
                <p className="text-purple-200 text-sm mt-1">Interactive 3D visualization of marine debris and coastal environments</p>
              </div>
            </div>

            {/* Beach Selector */}
            <div className="flex items-center gap-4">
              <select
                value={selectedBeach.id}
                onChange={(e) => setSelectedBeach(WORLDWIDE_BEACHES.find(b => b.id === e.target.value) || WORLDWIDE_BEACHES[0])}
                className="bg-slate-700/50 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500/50"
              >
                {WORLDWIDE_BEACHES.slice(0, 10).map(beach => (
                  <option key={beach.id} value={beach.id} className="bg-slate-800">
                    {beach.name.split(',')[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 3D Canvas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
              {/* Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`p-2 rounded-lg transition ${
                      isPlaying ? 'bg-green-500/20 text-green-200' : 'bg-slate-600/50 text-white/50'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={resetView}
                    className="p-2 bg-slate-600/50 text-white/50 rounded-lg hover:bg-slate-500/50 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                      className="p-2 bg-slate-600/50 text-white/50 rounded-lg hover:bg-slate-500/50 transition"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>

                    <span className="text-white/60 text-sm min-w-[60px] text-center">
                      {Math.round(zoom * 100)}%
                    </span>

                    <button
                      onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                      className="p-2 bg-slate-600/50 text-white/50 rounded-lg hover:bg-slate-500/50 transition"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Layer Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDebris(!showDebris)}
                    className={`p-2 rounded-lg transition ${
                      showDebris ? 'bg-red-500/20 text-red-200' : 'bg-slate-600/50 text-white/50'
                    }`}
                    title="Toggle Debris Layer"
                  >
                    {showDebris ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setShowTerrain(!showTerrain)}
                    className={`p-2 rounded-lg transition ${
                      showTerrain ? 'bg-green-500/20 text-green-200' : 'bg-slate-600/50 text-white/50'
                    }`}
                    title="Toggle Terrain Layer"
                  >
                    <Globe className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowWater(!showWater)}
                    className={`p-2 rounded-lg transition ${
                      showWater ? 'bg-blue-500/20 text-blue-200' : 'bg-slate-600/50 text-white/50'
                    }`}
                    title="Toggle Water Layer"
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Canvas */}
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="w-full h-auto border border-white/10 rounded-lg cursor-pointer bg-slate-900/50"
                  onClick={handleCanvasClick}
                />

                {/* Overlay Info */}
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-yellow-400" />
                    <span className="font-semibold">{selectedBeach.name}</span>
                  </div>
                  <div className="text-white/70">
                    {debrisPoints.length} debris points • {selectedBeach.riskLevel} risk
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Debris Statistics */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Satellite className="w-5 h-5 text-purple-400" />
                Debris Analysis
              </h3>

              <div className="space-y-3">
                {[
                  { type: 'Plastic', count: stats.plastic, color: 'bg-red-500' },
                  { type: 'Metal', count: stats.metal, color: 'bg-cyan-500' },
                  { type: 'Organic', count: stats.organic, color: 'bg-blue-500' },
                  { type: 'Chemical', count: stats.chemical, color: 'bg-yellow-500' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-white text-sm">{item.type}</span>
                    </div>
                    <span className="text-white/60 text-sm">{item.count}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Environmental Data */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
              <h3 className="text-lg font-bold text-white mb-4">Environmental Metrics</h3>

              <div className="space-y-4">
                {[
                  { label: 'Water Depth', value: '12.5m', unit: 'avg', trend: 'stable' },
                  { label: 'Current Speed', value: '0.8', unit: 'm/s', trend: 'increasing' },
                  { label: 'Wave Height', value: '1.2m', unit: 'max', trend: 'stable' },
                  { label: 'Temperature', value: '24.3°C', unit: 'surface', trend: 'rising' },
                ].map((metric, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-sm">{metric.label}</span>
                      <span className="text-white/60 text-xs">{metric.unit}</span>
                    </div>
                    <div className="text-cyan-400 font-semibold">{metric.value}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* View Controls */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
              <h3 className="text-lg font-bold text-white mb-4">View Controls</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm block mb-2">Rotation X</label>
                  <input
                    type="range"
                    min="-3.14"
                    max="3.14"
                    step="0.1"
                    value={rotation.x}
                    onChange={(e) => setRotation(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm block mb-2">Rotation Y</label>
                  <input
                    type="range"
                    min="-3.14"
                    max="3.14"
                    step="0.1"
                    value={rotation.y}
                    onChange={(e) => setRotation(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm block mb-2">Zoom Level</label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Viewer3D;
