import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Radar,
  Leaf,
  Waves,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  MapPin
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
  Cell
} from 'recharts';
import { waveApi, alertApi } from '../services/api';

// Stats Card Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
}> = ({ title, value, change, icon: Icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass p-6 rounded-2xl"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-white/60 text-sm">{title}</p>
        <h3 className="text-3xl font-bold mt-1">{value}</h3>
        {change !== undefined && (
          <div className={`flex items-center mt-2 ${change >= 0 ? 'text-seagrass-400' : 'text-coral-400'}`}>
            {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="ml-1 text-sm">{Math.abs(change)}% vs last week</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  </motion.div>
);

// Real-time Wave Widget
const WaveWidget: React.FC = () => {
  const [waveData, setWaveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWaveData = async () => {
      try {
        const data = await waveApi.getCurrent(20.0, 80.0);
        setWaveData(data);
      } catch (error) {
        console.error('Error fetching wave data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWaveData();
    const interval = setInterval(fetchWaveData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass p-6 rounded-2xl animate-pulse">
        <div className="h-32 bg-white/10 rounded-lg" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass p-6 rounded-2xl"
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Waves className="text-ocean-400" />
        Current Wave Conditions
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-white/5 rounded-xl">
          <p className="text-white/60 text-sm">Wave Height</p>
          <p className="text-2xl font-bold text-ocean-300">
            {waveData?.wave_height || '--'} m
          </p>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-xl">
          <p className="text-white/60 text-sm">Wave Direction</p>
          <p className="text-2xl font-bold text-ocean-300">
            {waveData?.wave_direction || '--'}°
          </p>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-xl">
          <p className="text-white/60 text-sm">Wind Speed</p>
          <p className="text-2xl font-bold text-ocean-300">
            {waveData?.wind_speed || '--'} m/s
          </p>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-xl">
          <p className="text-white/60 text-sm">Sea Temp</p>
          <p className="text-2xl font-bold text-ocean-300">
            {waveData?.sea_surface_temperature || '--'}°C
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// Debris Detection Chart
const DebrisChart: React.FC = () => {
  const data = [
    { date: 'Mon', plastic: 45, nets: 12, wood: 8 },
    { date: 'Tue', plastic: 52, nets: 15, wood: 10 },
    { date: 'Wed', plastic: 38, nets: 8, wood: 6 },
    { date: 'Thu', plastic: 65, nets: 20, wood: 12 },
    { date: 'Fri', plastic: 48, nets: 14, wood: 9 },
    { date: 'Sat', plastic: 55, nets: 18, wood: 11 },
    { date: 'Sun', plastic: 42, nets: 10, wood: 7 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass p-6 rounded-2xl"
    >
      <h3 className="text-lg font-semibold mb-4">Debris Detection Trends</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="plasticGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="netsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
          <YAxis stroke="rgba(255,255,255,0.5)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: 'none',
              borderRadius: '8px',
            }}
          />
          <Area
            type="monotone"
            dataKey="plastic"
            stroke="#f43f5e"
            fill="url(#plasticGradient)"
            name="Plastic"
          />
          <Area
            type="monotone"
            dataKey="nets"
            stroke="#0ea5e9"
            fill="url(#netsGradient)"
            name="Fishing Nets"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// Ecosystem Health Pie Chart
const EcosystemPieChart: React.FC = () => {
  const data = [
    { name: 'Healthy Coral', value: 35, color: '#4ade80' },
    { name: 'Degraded Coral', value: 20, color: '#fb7185' },
    { name: 'Seagrass', value: 25, color: '#22c55e' },
    { name: 'Algae Bloom', value: 10, color: '#eab308' },
    { name: 'Clear Water', value: 10, color: '#38bdf8' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass p-6 rounded-2xl"
    >
      <h3 className="text-lg font-semibold mb-4">Ecosystem Composition</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: 'none',
              borderRadius: '8px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-white/60">{item.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Recent Alerts Widget
const RecentAlertsWidget: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await alertApi.getActive();
        setAlerts(data.alerts?.slice(0, 5) || []);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };
    fetchAlerts();
  }, []);

  const severityColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass p-6 rounded-2xl"
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle className="text-coral-400" />
        Recent Alerts
      </h3>
      
      <div className="space-y-3">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 bg-white/5 rounded-xl"
            >
              <div
                className={`w-2 h-2 mt-2 rounded-full ${
                  severityColors[alert.severity as keyof typeof severityColors]
                }`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{alert.message}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-white/50">
                  <MapPin size={12} />
                  <span>
                    {alert.location?.lat?.toFixed(2)}, {alert.location?.lon?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-white/50 text-center py-4">No active alerts</p>
        )}
      </div>
    </motion.div>
  );
};

// Main Dashboard Component
const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Debris Zones"
          value={23}
          change={12}
          icon={Radar}
          color="bg-coral-500/20 text-coral-400"
        />
        <StatCard
          title="Ecosystem Health"
          value="72%"
          change={-3}
          icon={Leaf}
          color="bg-seagrass-500/20 text-seagrass-400"
        />
        <StatCard
          title="Active Alerts"
          value={5}
          change={25}
          icon={AlertTriangle}
          color="bg-yellow-500/20 text-yellow-400"
        />
        <StatCard
          title="Areas Monitored"
          value="1,247 km²"
          icon={Activity}
          color="bg-ocean-500/20 text-ocean-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DebrisChart />
        <EcosystemPieChart />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WaveWidget />
        <RecentAlertsWidget />
      </div>
    </div>
  );
};

export default Dashboard;
