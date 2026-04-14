import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Droplet,
  TrendingUp,
  Waves as WavesIcon,
  Search,
} from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { WORLDWIDE_BEACHES } from '../data/beaches';
import type { Beach } from '../data/beaches';

// Mock debris data per beach
const generateBeachDebrisData = (beachId: string) => {
  const riskMap: { [key: string]: number } = {
    critical: 45,
    high: 35,
    medium: 20,
    low: 8,
  };

  const beach = WORLDWIDE_BEACHES.find((b) => b.id === beachId);
  const riskLevel = beach?.riskLevel || 'medium';
  const debrisCount = riskMap[riskLevel] + Math.floor(Math.random() * 10);

  return {
    debrisCount,
    coveragePercentage: (debrisCount / 100) * 15 + Math.random() * 5,
    composition: [
      { name: 'Plastic Bags', value: 35, color: '#fb7185' },
      { name: 'Fishing Nets', value: 25, color: '#0ea5e9' },
      { name: 'Wood/Driftwood', value: 20, color: '#78350f' },
      { name: 'Glass', value: 12, color: '#c7d2fe' },
      { name: 'Other', value: 8, color: '#9ca3af' },
    ],
    weeklyTrend: [
      { day: 'Mon', count: debrisCount - 8 },
      { day: 'Tue', count: debrisCount - 5 },
      { day: 'Wed', count: debrisCount - 3 },
      { day: 'Thu', count: debrisCount },
      { day: 'Fri', count: debrisCount + 3 },
      { day: 'Sat', count: debrisCount + 5 },
      { day: 'Sun', count: debrisCount + 2 },
    ],
    waterQuality: {
      transparency: Math.random() * 100,
      pollutionIndex: Math.random() * 100,
      biodiversity: Math.random() * 100,
    },
  };
};

const BeachCard: React.FC<{
  beach: Beach;
  isSelected: boolean;
  onClick: () => void;
}> = ({ beach, isSelected, onClick }) => {
  const debrisData = generateBeachDebrisData(beach.id);

  const riskColors = {
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  } as const;

  const riskBgMap = {
    low: 'bg-green-500/10',
    medium: 'bg-yellow-500/10',
    high: 'bg-orange-500/10',
    critical: 'bg-red-500/10',
  } as const;

  const getRiskColor = (risk: string) => riskColors[risk as keyof typeof riskColors] || '';
  const getRiskBg = (risk: string) => riskBgMap[risk as keyof typeof riskBgMap] || '';

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      className={`glass p-4 rounded-xl cursor-pointer transition-all border-2 ${
        isSelected
          ? 'border-ocean-400 ring-2 ring-ocean-400/50'
          : 'border-white/20 hover:border-ocean-400/50'
      } ${getRiskBg(beach.riskLevel)}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <MapPin size={18} className="text-ocean-400" />
            {beach.name}
          </h3>
          <p className="text-xs text-white/60">{beach.city}</p>
        </div>
        <div
          className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
            getRiskColor(beach.riskLevel)
          }`}
        >
          {beach.riskLevel.toUpperCase()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white/5 p-2 rounded-lg text-center">
          <p className="text-xs text-white/60">Debris</p>
          <p className="text-lg font-bold text-orange-400">{debrisData.debrisCount}</p>
        </div>
        <div className="bg-white/5 p-2 rounded-lg text-center">
          <p className="text-xs text-white/60">Coverage</p>
          <p className="text-lg font-bold text-coral-400">
            {debrisData.coveragePercentage.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white/5 p-2 rounded-lg text-center">
          <p className="text-xs text-white/60">Area</p>
          <p className="text-lg font-bold text-seagrass-400">{beach.area} km²</p>
        </div>
      </div>

      {/* Small Pie Chart */}
      <div className="h-32 mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={debrisData.composition}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={50}
              paddingAngle={1}
              dataKey="value"
            >
              {debrisData.composition.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/50">📍 {beach.lat.toFixed(2)}°N, {beach.lon.toFixed(2)}°E</span>
        <span className="text-white/50">High Priority</span>
      </div>
    </motion.div>
  );
};

const BeachDetailsPanel: React.FC<{
  beach: Beach;
}> = ({ beach }) => {
  const debrisData = generateBeachDebrisData(beach.id);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass p-6 rounded-2xl space-y-4"
    >
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">{beach.name}</h2>
        <p className="text-white/60">{beach.city}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 p-4 rounded-xl">
          <p className="text-white/60 text-sm mb-1">Debris Count</p>
          <p className="text-3xl font-bold text-orange-400">{debrisData.debrisCount}</p>
          <p className="text-xs text-white/50 mt-1">items detected</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl">
          <p className="text-white/60 text-sm mb-1">Coverage Area</p>
          <p className="text-3xl font-bold text-coral-400">
            {debrisData.coveragePercentage.toFixed(1)}%
          </p>
          <p className="text-xs text-white/50 mt-1">of beach</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl">
          <p className="text-white/60 text-sm mb-1">Risk Level</p>
          <p className="text-2xl font-bold text-yellow-400">{beach.riskLevel.toUpperCase()}</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl">
          <p className="text-white/60 text-sm mb-1">Beach Area</p>
          <p className="text-2xl font-bold text-seagrass-400">{beach.area} km²</p>
        </div>
      </div>

      {/* Debris Composition - Pie Chart */}
      <div className="bg-white/5 p-4 rounded-xl">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Droplet size={18} className="text-ocean-400" />
          Debris Composition
        </h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={debrisData.composition}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {debrisData.composition.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {debrisData.composition.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-white/70">
                {item.name} {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Trend - Line Chart */}
      <div className="bg-white/5 p-4 rounded-xl">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp size={18} className="text-ocean-400" />
          7-Day Debris Trend
        </h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={debrisData.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: 'none',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ fill: '#f43f5e', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Environmental Metrics */}
      <div className="bg-white/5 p-4 rounded-xl">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <WavesIcon size={18} className="text-ocean-400" />
          Water Quality Metrics
        </h3>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Water Clarity</span>
              <span className="text-seagrass-400">{debrisData.waterQuality.transparency.toFixed(0)}%</span>
            </div>
            <div className="bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-seagrass-500 h-full"
                style={{ width: `${debrisData.waterQuality.transparency}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Pollution Index</span>
              <span className="text-coral-400">{debrisData.waterQuality.pollutionIndex.toFixed(0)}</span>
            </div>
            <div className="bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-coral-500 h-full"
                style={{ width: `${debrisData.waterQuality.pollutionIndex}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Biodiversity Score</span>
              <span className="text-ocean-400">{debrisData.waterQuality.biodiversity.toFixed(0)}%</span>
            </div>
            <div className="bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-ocean-500 h-full"
                style={{ width: `${debrisData.waterQuality.biodiversity}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="bg-white/5 p-4 rounded-xl text-sm">
        <p className="text-white/60 mb-1">📍 Coordinates</p>
        <p className="font-mono text-ocean-300">
          {beach.lat.toFixed(4)}° N, {beach.lon.toFixed(4)}° E
        </p>
        <p className="text-white/60 mt-2">Monitoring Status</p>
        <p className="text-seagrass-300">Active & Real-time</p>
      </div>
    </motion.div>
  );
};

const BeachMonitoring: React.FC = () => {
  const [selectedBeach, setSelectedBeach] = useState(WORLDWIDE_BEACHES[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBeaches = useMemo(
    () =>
      WORLDWIDE_BEACHES.filter(
        (beach) =>
          beach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          beach.city.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  const riskStats = {
    critical: WORLDWIDE_BEACHES.filter((b) => b.riskLevel === 'critical').length,
    high: WORLDWIDE_BEACHES.filter((b) => b.riskLevel === 'high').length,
    medium: WORLDWIDE_BEACHES.filter((b) => b.riskLevel === 'medium').length,
    low: WORLDWIDE_BEACHES.filter((b) => b.riskLevel === 'low').length,
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-4 rounded-xl"
        >
          <p className="text-white/60 text-sm">Total Beaches</p>
          <p className="text-3xl font-bold mt-1">{WORLDWIDE_BEACHES.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-4 rounded-xl"
        >
          <p className="text-white/60 text-sm">Critical</p>
          <p className="text-3xl font-bold text-red-400 mt-1">{riskStats.critical}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-4 rounded-xl"
        >
          <p className="text-white/60 text-sm">High</p>
          <p className="text-3xl font-bold text-orange-400 mt-1">{riskStats.high}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-4 rounded-xl"
        >
          <p className="text-white/60 text-sm">Monitored</p>
          <p className="text-3xl font-bold text-seagrass-400 mt-1">24/7</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Beach List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-4"
        >
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-white/40" />
            <input
              type="text"
              placeholder="Search beaches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-ocean-400"
            />
          </div>

          {/* Beach Cards */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredBeaches.map((beach) => (
              <BeachCard
                key={beach.id}
                beach={beach}
                isSelected={selectedBeach.id === beach.id}
                onClick={() => setSelectedBeach(beach)}
              />
            ))}
          </div>
        </motion.div>

        {/* Right: Details Panel */}
        <div className="lg:col-span-2">
          {selectedBeach && <BeachDetailsPanel beach={selectedBeach} />}
        </div>
      </div>
    </div>
  );
};

export default BeachMonitoring;
