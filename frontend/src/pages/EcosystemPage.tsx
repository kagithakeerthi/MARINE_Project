import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Leaf,
  Waves,
  Fish,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  Thermometer,
  Droplet,
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { WORLDWIDE_BEACHES } from '../data/beaches';

const EcosystemPage: React.FC = () => {
  const [selectedBeach, setSelectedBeach] = useState(WORLDWIDE_BEACHES[0]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [ecosystemData, setEcosystemData] = useState<any>(null);

  useEffect(() => {
    // Generate mock ecosystem data
    const generateEcosystemData = () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const data = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));

        return {
          date: date.toISOString().split('T')[0],
          waterQuality: Math.random() * 20 + 70, // 70-90%
          biodiversity: Math.random() * 25 + 60, // 60-85%
          coralHealth: Math.random() * 30 + 50, // 50-80%
          temperature: Math.random() * 5 + 25, // 25-30°C
          salinity: Math.random() * 3 + 33, // 33-36 ppt
          turbidity: Math.random() * 10 + 5, // 5-15 NTU
        };
      });

      const currentMetrics = {
        waterQuality: data[data.length - 1].waterQuality,
        biodiversity: data[data.length - 1].biodiversity,
        coralHealth: data[data.length - 1].coralHealth,
        temperature: data[data.length - 1].temperature,
        salinity: data[data.length - 1].salinity,
        turbidity: data[data.length - 1].turbidity,
      };

      const healthScore = Math.round(
        (currentMetrics.waterQuality * 0.3 +
         currentMetrics.biodiversity * 0.3 +
         currentMetrics.coralHealth * 0.4) / 10
      );

      return {
        timeSeries: data,
        current: currentMetrics,
        healthScore,
        trends: {
          waterQuality: data[data.length - 1].waterQuality > data[data.length - 8]?.waterQuality ? 'up' : 'down',
          biodiversity: data[data.length - 1].biodiversity > data[data.length - 8]?.biodiversity ? 'up' : 'down',
          coralHealth: data[data.length - 1].coralHealth > data[data.length - 8]?.coralHealth ? 'up' : 'down',
        },
        alerts: [
          { type: 'warning', message: 'Coral bleaching risk increased by 15%', severity: 'medium' },
          { type: 'info', message: 'Biodiversity index stable', severity: 'low' },
          { type: 'success', message: 'Water quality improved by 8%', severity: 'low' },
        ],
      };
    };

    setEcosystemData(generateEcosystemData());
  }, [selectedBeach, timeRange]);

  const getHealthColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthStatus = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    return 'Critical';
  };

  const radarData = ecosystemData ? [
    { metric: 'Water Quality', value: ecosystemData.current.waterQuality },
    { metric: 'Biodiversity', value: ecosystemData.current.biodiversity },
    { metric: 'Coral Health', value: ecosystemData.current.coralHealth },
    { metric: 'Temperature', value: (30 - ecosystemData.current.temperature) * 3.33 },
    { metric: 'Salinity', value: ecosystemData.current.salinity * 2.5 },
    { metric: 'Turbidity', value: (15 - ecosystemData.current.turbidity) * 6.67 },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Ecosystem Health Monitor</h1>
              <p className="text-green-200 text-sm mt-1">Real-time marine ecosystem analysis and biodiversity tracking</p>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Beach Selector */}
            <div className="flex-1 min-w-[200px]">
              <select
                value={selectedBeach.id}
                onChange={(e) => setSelectedBeach(WORLDWIDE_BEACHES.find(b => b.id === e.target.value) || WORLDWIDE_BEACHES[0])}
                className="w-full bg-gradient-to-r from-slate-800 to-slate-700 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500/50 transition"
              >
                {WORLDWIDE_BEACHES.map(beach => (
                  <option key={beach.id} value={beach.id} className="bg-slate-800">
                    {beach.name} - {beach.city}, {beach.country}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range */}
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    timeRange === range
                      ? 'bg-green-500/20 text-green-200 border border-green-500/30'
                      : 'bg-slate-700/50 text-white/50 border border-white/10 hover:bg-slate-600/50'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {ecosystemData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health Overview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1 space-y-6"
            >
              {/* Health Score */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Ecosystem Health
                </h3>

                <div className="text-center mb-6">
                  <div className={`text-6xl font-bold mb-2 ${getHealthColor(ecosystemData.healthScore)}`}>
                    {ecosystemData.healthScore}/10
                  </div>
                  <div className="text-white/60 text-sm">{getHealthStatus(ecosystemData.healthScore)}</div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Water Quality', value: ecosystemData.current.waterQuality, unit: '%', icon: Droplet, trend: ecosystemData.trends.waterQuality },
                    { label: 'Biodiversity', value: ecosystemData.current.biodiversity, unit: '%', icon: Fish, trend: ecosystemData.trends.biodiversity },
                    { label: 'Coral Health', value: ecosystemData.current.coralHealth, unit: '%', icon: Leaf, trend: ecosystemData.trends.coralHealth },
                  ].map((metric, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <metric.icon className="w-4 h-4 text-cyan-400" />
                        <div>
                          <p className="text-white text-sm">{metric.label}</p>
                          <p className="text-white/60 text-xs">{metric.value.toFixed(1)}{metric.unit}</p>
                        </div>
                      </div>
                      {metric.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Environmental Conditions */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-orange-400" />
                  Environmental Conditions
                </h3>

                <div className="space-y-4">
                  {[
                    { label: 'Water Temperature', value: ecosystemData.current.temperature, unit: '°C', icon: Thermometer },
                    { label: 'Salinity', value: ecosystemData.current.salinity, unit: 'ppt', icon: Droplet },
                    { label: 'Turbidity', value: ecosystemData.current.turbidity, unit: 'NTU', icon: Waves },
                  ].map((condition, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <condition.icon className="w-4 h-4 text-cyan-400" />
                        <div>
                          <p className="text-white text-sm">{condition.label}</p>
                          <p className="text-white/60 text-xs">{condition.value.toFixed(1)} {condition.unit}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Ecosystem Alerts
                </h3>

                <div className="space-y-3">
                  {ecosystemData.alerts.map((alert: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className={`p-3 rounded-lg border ${
                        alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                        alert.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
                        'bg-blue-500/10 border-blue-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {alert.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        ) : alert.type === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Activity className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        )}
                        <p className="text-white text-sm">{alert.message}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Charts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Radar Chart */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
                <h3 className="text-lg font-bold text-white mb-4">Ecosystem Health Radar</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                      />
                      <Radar
                        name="Health Score"
                        dataKey="value"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Time Series Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Water Quality Trend */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-blue-400" />
                    Water Quality Trend
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={ecosystemData.timeSeries}>
                        <defs>
                          <linearGradient id="waterQuality" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 10 }} />
                        <YAxis stroke="rgba(255,255,255,0.5)" domain={[60, 90]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="waterQuality"
                          stroke="#0ea5e9"
                          fillOpacity={1}
                          fill="url(#waterQuality)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Biodiversity Trend */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Fish className="w-5 h-5 text-green-400" />
                    Biodiversity Index
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={ecosystemData.timeSeries}>
                        <defs>
                          <linearGradient id="biodiversity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 10 }} />
                        <YAxis stroke="rgba(255,255,255,0.5)" domain={[50, 85]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="biodiversity"
                          stroke="#10b981"
                          fillOpacity={1}
                          fill="url(#biodiversity)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Coral Health Trend */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-emerald-400" />
                  Coral Health Monitoring
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ecosystemData.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="rgba(255,255,255,0.5)" domain={[40, 80]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="coralHealth"
                        stroke="#059669"
                        strokeWidth={3}
                        dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#059669', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EcosystemPage;
