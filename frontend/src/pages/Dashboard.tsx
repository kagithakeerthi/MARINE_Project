import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Satellite,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Droplet,
  Activity,
  Globe,
  Eye,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import type { Beach } from '../data/beaches';
import { WORLDWIDE_BEACHES, generateSatelliteDebrisData, getGlobalStats, getAllRegions, getBeachesByRegion, getAllWaterbodyTypes, getWaterbodyType } from '../data/beaches';


export const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions');
  const [selectedType, setSelectedType] = useState<string>('All Types');
  const [sortBy, setSortBy] = useState<'name' | 'risk' | 'area'>('risk');

  const regions = ['All Regions', ...getAllRegions()];
  const waterbodyTypes = ['All Types', ...getAllWaterbodyTypes()];
  const globalStats = getGlobalStats();

  // Filter beaches based on search and region
  const filteredBeaches = useMemo(() => {
    let result = selectedRegion === 'All Regions' 
      ? WORLDWIDE_BEACHES 
      : getBeachesByRegion(selectedRegion);

    if (selectedType !== 'All Types') {
      result = result.filter((beach) => getWaterbodyType(beach) === selectedType);
    }

    if (searchQuery.trim()) {
      result = result.filter(
        (beach) =>
          beach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          beach.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          beach.country?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'risk') {
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      result.sort((a, b) => riskOrder[a.riskLevel as keyof typeof riskOrder] - riskOrder[b.riskLevel as keyof typeof riskOrder]);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'area') {
      result.sort((a, b) => b.area - a.area);
    }

    return result;
  }, [searchQuery, selectedRegion, selectedType, sortBy]);

  // Get suggestions only when search is active
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filteredBeaches;
  }, [searchQuery, filteredBeaches]);

  const satelliteData = selectedBeach ? generateSatelliteDebrisData(selectedBeach.id) : null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'from-red-500 to-red-600 shadow-lg shadow-red-500/50';
      case 'high':
        return 'from-orange-500 to-orange-600 shadow-lg shadow-orange-500/50';
      case 'medium':
        return 'from-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/50';
      case 'low':
        return 'from-green-500 to-green-600 shadow-lg shadow-green-500/50';
      default:
        return 'from-blue-500 to-blue-600';
    }
  };

  const getRiskBadge = (risk: string) => {
    const colors: Record<'critical' | 'high' | 'medium' | 'low', string> = {
      critical: 'bg-red-500/20 text-red-200 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-200 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
      low: 'bg-green-500/20 text-green-200 border-green-500/30',
    };
    return colors[risk as keyof typeof colors] || 'bg-blue-500/20 text-blue-200 border-blue-500/30';
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
              <Satellite className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Global Marine Debris Monitor</h1>
              <p className="text-cyan-200 text-sm mt-1">Real-time satellite monitoring of {globalStats.totalBeaches} beaches worldwide</p>
            </div>
          </div>
        </motion.div>

        {/* Global Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Beaches', value: globalStats.totalBeaches, icon: Globe, color: 'from-blue-500 to-cyan-500' },
            { label: 'Critical', value: globalStats.criticalBeaches, icon: AlertTriangle, color: 'from-red-500 to-orange-500' },
            { label: 'High Risk', value: globalStats.highRiskBeaches, icon: Zap, color: 'from-orange-500 to-yellow-500' },
            { label: 'Coastal Area', value: `${Math.round(globalStats.totalCoastalArea)} km²`, icon: Activity, color: 'from-teal-500 to-green-500' },
            { label: 'Monitoring Live', value: '24/7', icon: Eye, color: 'from-purple-500 to-pink-500' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className={`p-4 rounded-lg bg-gradient-to-br ${stat.color} backdrop-blur-lg bg-opacity-10 border border-white/10`}
            >
              <div className="flex items-center gap-3">
                <stat.icon className="w-5 h-5 text-white/80" />
                <div>
                  <p className="text-xs text-white/70">{stat.label}</p>
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {selectedBeach ? (
          // Beach Details View
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            {/* Beach Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedBeach.name}</h2>
                  <div className="flex gap-3 items-center flex-wrap">
                    <span className="flex items-center gap-2 text-cyan-200">
                      <MapPin className="w-4 h-4" /> {selectedBeach.city}, {selectedBeach.country}
                    </span>
                    <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${getRiskBadge(selectedBeach.riskLevel)}`}>
                      {selectedBeach.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBeach(null)}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-lg text-red-200 transition"
                >
                  Back to Search
                </button>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Debris Count', value: satelliteData?.debrisCount, unit: 'items', icon: AlertTriangle },
                  { label: 'Coverage', value: satelliteData?.coveragePercentage?.toFixed(1), unit: '%', icon: Eye },
                  { label: 'Area', value: selectedBeach.area, unit: 'km²', icon: Activity },
                  { label: 'Coordinates', value: `${selectedBeach.lat.toFixed(2)}°, ${selectedBeach.lon.toFixed(2)}°`, unit: '', icon: MapPin },
                ].map((metric, i) => (
                  <div key={i} className="bg-slate-700/50 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon className="w-4 h-4 text-cyan-400" />
                      <p className="text-xs text-white/70">{metric.label}</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {metric.value} <span className="text-sm text-white/50">{metric.unit}</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Satellite Info */}
              <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center gap-3">
                <Satellite className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div className="text-sm text-cyan-200">
                  <p className="font-semibold">Sentinel-2 MSI Satellite Feed • 10m Resolution • Updated Every 24hrs</p>
                  <p className="text-xs text-cyan-300 mt-1">Real-time debris classification using AI-powered spectral analysis</p>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Debris Composition */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" /> Debris Composition
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={satelliteData?.composition || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {satelliteData?.composition?.map((entry: { color: string }, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Weekly Trend */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" /> 7-Day Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={satelliteData?.weeklyTrend || []}>
                    <defs>
                      <linearGradient id="colorDebris" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="debris"
                      stroke="#0ea5e9"
                      fillOpacity={1}
                      fill="url(#colorDebris)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Water Quality */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-blue-400" /> Water Quality Metrics
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Transparency', value: satelliteData?.waterQuality?.transparency || 0, max: 100, color: 'from-blue-500 to-cyan-500' },
                    { label: 'Biodiversity Index', value: satelliteData?.waterQuality?.biodiversity || 0, max: 100, color: 'from-green-500 to-emerald-500' },
                    { label: 'Pollution Level', value: satelliteData?.waterQuality?.pollutionIndex || 0, max: 100, color: 'from-red-500 to-orange-500', isNegative: true },
                  ].map((metric, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-white/80">{metric.label}</span>
                        <span className="text-sm font-bold text-cyan-400">{metric.value.toFixed(1)}/100</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden border border-white/10">
                        <div
                          className={`h-full bg-gradient-to-r ${metric.color} transition-all duration-500`}
                          style={{ width: `${metric.value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Debris Distribution */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-purple-400" /> Debris Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={satelliteData?.composition || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          // Beach Search & Grid View
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-4 w-5 h-5 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Search beaches by name, city, or country... (e.g., 'Marina', 'Bali', 'Australia')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gradient-to-r from-slate-800 to-slate-700 border border-white/20 rounded-lg pl-12 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/30 transition"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-4 flex-wrap">
                {/* Region Filter */}
                <div className="flex-1 min-w-[200px]">
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full bg-gradient-to-r from-slate-800 to-slate-700 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition"
                  >
                    {regions.map((region) => (
                      <option key={region} value={region} className="bg-slate-800">
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Waterbody Type Filter */}
                <div className="flex-1 min-w-[180px]">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full bg-gradient-to-r from-slate-800 to-slate-700 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition"
                  >
                    {waterbodyTypes.map((type) => (
                      <option key={type} value={type} className="bg-slate-800">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Filter */}
                <div className="flex-1 min-w-[150px]">
                  <select
                    value={sortBy}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as 'risk' | 'name' | 'area')}
                    className="w-full bg-gradient-to-r from-slate-800 to-slate-700 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition"
                  >
                    <option value="risk" className="bg-slate-800">Sort by Risk Level</option>
                    <option value="name" className="bg-slate-800">Sort by Name</option>
                    <option value="area" className="bg-slate-800">Sort by Area</option>
                  </select>
                </div>

                {/* Results Count */}
                <div className="px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white/80 text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  {filteredBeaches.length} beaches found
                </div>
              </div>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {searchQuery.trim() && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 right-0 top-24 z-50 bg-slate-800 border border-cyan-500/30 rounded-lg overflow-hidden shadow-2xl max-h-64 overflow-y-auto"
                  >
                    {suggestions.map((beach) => (
                      <button
                        key={beach.id}
                        onClick={() => setSelectedBeach(beach)}
                        className="w-full px-4 py-3 hover:bg-cyan-500/20 border-b border-white/10 last:border-0 text-left transition flex items-center gap-3"
                      >
                        <Satellite className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{beach.name}</p>
                          <p className="text-xs text-white/60 truncate">{beach.city}, {beach.country}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${getRiskBadge(beach.riskLevel)}`}>
                          {beach.riskLevel}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Beaches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBeaches.map((beach, i) => (
                <motion.button
                  key={beach.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedBeach(beach)}
                  className={`text-left p-4 rounded-lg bg-gradient-to-br ${getRiskColor(beach.riskLevel)} border border-white/20 backdrop-blur-lg hover:border-white/40 transition group cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-200 transition">{beach.name}</h3>
                      <p className="text-sm text-white/80">{beach.city}, {beach.country}</p>
                    </div>
                    <Satellite className="w-5 h-5 text-white/60 group-hover:text-white transition" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-black/20 rounded-lg p-2">
                      <p className="text-xs text-white/70">Area</p>
                      <p className="text-sm font-bold text-white">{beach.area} km²</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2">
                      <p className="text-xs text-white/70">Risk</p>
                      <p className="text-sm font-bold text-white capitalize">{beach.riskLevel}</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    {getWaterbodyType(beach)}
                  </div>

                  <div className="text-xs text-white/70 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {beach.lat.toFixed(2)}°, {beach.lon.toFixed(2)}°
                  </div>
                </motion.button>
              ))}
            </div>

            {filteredBeaches.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <AlertTriangle className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/60 text-lg">No beaches found matching your search</p>
                <p className="text-white/40 text-sm mt-2">Try different keywords or browse by region</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
