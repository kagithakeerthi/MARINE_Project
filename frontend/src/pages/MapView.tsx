import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Satellite,
  Eye,
  ZoomIn,
  ZoomOut,
  Layers,
  Filter,
} from 'lucide-react';
import type { Beach } from '../data/beaches';
import { WORLDWIDE_BEACHES, generateSatelliteDebrisData, getGlobalStats, getAllWaterbodyTypes, getWaterbodyType } from '../data/beaches';

const MapView: React.FC = () => {
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
  const [zoom, setZoom] = useState(3);
  const [showLayers, setShowLayers] = useState({
    beaches: true,
    debris: true,
    risk: true,
  });
  const [filterRegion, setFilterRegion] = useState('All');
  const [selectedType, setSelectedType] = useState('All Types');

  const globalStats = getGlobalStats();
  const satelliteData = selectedBeach ? generateSatelliteDebrisData(selectedBeach.id) : null;

  const regions = ['All', ...Array.from(new Set(WORLDWIDE_BEACHES.map(b => b.region)))];
  const waterbodyTypes = ['All Types', ...getAllWaterbodyTypes()];
  const filteredBeaches = WORLDWIDE_BEACHES.filter((beach) => {
    const matchesRegion = filterRegion === 'All' || beach.region === filterRegion;
    const matchesType = selectedType === 'All Types' || getWaterbodyType(beach) === selectedType;
    return matchesRegion && matchesType;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Global Satellite Map</h1>
              <p className="text-cyan-200 text-sm mt-1">Interactive monitoring of {globalStats.totalBeaches} beaches worldwide</p>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Region Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="bg-gradient-to-r from-slate-800 to-slate-700 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition"
              >
                {regions.map(region => (
                  <option key={region} value={region} className="bg-slate-800">{region}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-gradient-to-r from-slate-800 to-slate-700 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition"
              >
                {waterbodyTypes.map(type => (
                  <option key={type} value={type} className="bg-slate-800">{type}</option>
                ))}
              </select>
            </div>

            {/* Layer Controls */}
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 text-cyan-400" />
              <div className="flex gap-2">
                {Object.entries(showLayers).map(([layer, enabled]) => (
                  <button
                    key={layer}
                    onClick={() => setShowLayers(prev => ({ ...prev, [layer as keyof typeof prev]: !prev[layer as keyof typeof prev] }))}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      enabled
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
                        : 'bg-slate-700/50 text-white/50 border border-white/10'
                    }`}
                  >
                    {layer.charAt(0).toUpperCase() + layer.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(1, zoom - 1))}
                className="p-2 bg-slate-700/50 hover:bg-slate-600/50 border border-white/10 rounded-lg transition"
              >
                <ZoomOut className="w-4 h-4 text-white" />
              </button>
              <span className="text-white/70 text-sm">Zoom: {zoom}</span>
              <button
                onClick={() => setZoom(Math.min(10, zoom + 1))}
                className="p-2 bg-slate-700/50 hover:bg-slate-600/50 border border-white/10 rounded-lg transition"
              >
                <ZoomIn className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Satellite className="w-5 h-5 text-cyan-400" />
                  Satellite View
                </h2>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Live Data
                </div>
              </div>

              {/* Interactive Map Placeholder */}
              <div className="relative bg-gradient-to-br from-blue-900/50 to-slate-900/50 rounded-lg overflow-hidden border border-white/10" style={{ height: '500px' }}>
                {/* World Map Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900">
                  {/* Simplified world map representation */}
                  <svg viewBox="0 0 800 400" className="w-full h-full opacity-20">
                    <path d="M100,200 Q150,150 200,180 Q250,160 300,200 Q350,180 400,220 Q450,200 500,240 Q550,220 600,260 Q650,240 700,280"
                          stroke="#0ea5e9" strokeWidth="2" fill="none" />
                    <path d="M50,250 Q100,220 150,240 Q200,220 250,250 Q300,230 350,260 Q400,240 450,270 Q500,250 550,280 Q600,260 650,290"
                          stroke="#0ea5e9" strokeWidth="1" fill="none" />
                  </svg>
                </div>

                {/* Beach Markers */}
                {filteredBeaches.map((beach, i) => {
                  // Convert lat/lng to screen coordinates (simplified)
                  const x = ((beach.lon + 180) / 360) * 100;
                  const y = ((90 - beach.lat) / 180) * 100;

                  return (
                    <motion.button
                      key={beach.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02 }}
                      whileHover={{ scale: 1.2 }}
                      onClick={() => setSelectedBeach(beach)}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                        style={{
                          backgroundColor: getRiskColor(beach.riskLevel),
                          boxShadow: `0 0 10px ${getRiskColor(beach.riskLevel)}`,
                        }}
                      />
                    </motion.button>
                  );
                })}

                {/* Selected Beach Highlight */}
                {selectedBeach && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${((selectedBeach.lon + 180) / 360) * 100}%`,
                      top: `${((90 - selectedBeach.lat) / 180) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className="w-8 h-8 border-4 border-cyan-400 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute inset-0 w-8 h-8 border-4 border-cyan-400 rounded-full"></div>
                  </motion.div>
                )}

                {/* Map Legend */}
                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-xs text-white/80 mb-2">Risk Levels</div>
                  <div className="space-y-1">
                    {[
                      { level: 'Critical', color: '#ef4444' },
                      { level: 'High', color: '#f97316' },
                      { level: 'Medium', color: '#eab308' },
                      { level: 'Low', color: '#22c55e' },
                    ].map(({ level, color }) => (
                      <div key={level} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                        <span className="text-xs text-white/70">{level}</span>
                      </div>
                    ))}
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
            {/* Selected Beach Details */}
            {selectedBeach ? (
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  {selectedBeach.name}
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/70">Location</span>
                    <span className="text-white">{selectedBeach.city}, {selectedBeach.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Coordinates</span>
                    <span className="text-white text-sm">{selectedBeach.lat.toFixed(2)}°, {selectedBeach.lon.toFixed(2)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Area</span>
                    <span className="text-white">{selectedBeach.area} km²</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Risk Level</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      selectedBeach.riskLevel === 'critical' ? 'bg-red-500/20 text-red-300' :
                      selectedBeach.riskLevel === 'high' ? 'bg-orange-500/20 text-orange-300' :
                      selectedBeach.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      {selectedBeach.riskLevel.toUpperCase()}
                    </span>
                  </div>
                </div>

                {satelliteData && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2">Latest Satellite Data</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-white/70">Debris Count</span>
                        <div className="text-white font-bold">{satelliteData.debrisCount}</div>
                      </div>
                      <div>
                        <span className="text-white/70">Coverage</span>
                        <div className="text-white font-bold">{satelliteData.coveragePercentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg text-center">
                <MapPin className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/60">Click on a beach marker to view details</p>
              </div>
            )}

            {/* Statistics */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                Global Statistics
              </h3>

              <div className="space-y-3">
                {[
                  { label: 'Total Beaches', value: globalStats.totalBeaches, color: 'text-blue-400' },
                  { label: 'Critical Risk', value: globalStats.criticalBeaches, color: 'text-red-400' },
                  { label: 'High Risk', value: globalStats.highRiskBeaches, color: 'text-orange-400' },
                  { label: 'Medium Risk', value: globalStats.mediumRiskBeaches, color: 'text-yellow-400' },
                  { label: 'Low Risk', value: globalStats.lowRiskBeaches, color: 'text-green-400' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex justify-between items-center"
                  >
                    <span className="text-white/70">{stat.label}</span>
                    <span className={`font-bold ${stat.color}`}>{stat.value}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
