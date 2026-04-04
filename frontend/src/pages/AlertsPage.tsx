import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { WORLDWIDE_BEACHES } from '../data/beaches';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  location: string;
  beachId: string;
  timestamp: Date;
  severity: 'high' | 'medium' | 'low';
  category: 'debris' | 'ecosystem' | 'weather' | 'maintenance';
  acknowledged: boolean;
  resolved: boolean;
}

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info' | 'success'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'debris' | 'ecosystem' | 'weather' | 'maintenance'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    // Generate mock alerts
    const generateAlerts = () => {

      const mockAlerts: Alert[] = [
        {
          id: '1',
          type: 'critical',
          title: 'Critical Debris Accumulation',
          message: 'Massive debris accumulation detected at Marina Beach. Immediate cleanup required.',
          location: 'Marina Beach, Chennai, India',
          beachId: 'marina-beach',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          severity: 'high',
          category: 'debris',
          acknowledged: false,
          resolved: false,
        },
        {
          id: '2',
          type: 'warning',
          title: 'Coral Bleaching Risk',
          message: 'Water temperature rising above safe levels. Coral bleaching risk increased by 25%.',
          location: 'Great Barrier Reef, Australia',
          beachId: 'great-barrier-reef',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          severity: 'medium',
          category: 'ecosystem',
          acknowledged: true,
          resolved: false,
        },
        {
          id: '3',
          type: 'info',
          title: 'Maintenance Scheduled',
          message: 'Routine sensor calibration scheduled for tomorrow at 09:00 UTC.',
          location: 'Copacabana Beach, Rio de Janeiro, Brazil',
          beachId: 'copacabana',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          severity: 'low',
          category: 'maintenance',
          acknowledged: true,
          resolved: false,
        },
        {
          id: '4',
          type: 'success',
          title: 'Cleanup Completed',
          message: 'Successful debris removal operation completed. Beach cleanliness restored to 95%.',
          location: 'Bondi Beach, Sydney, Australia',
          beachId: 'bondi-beach',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
          severity: 'low',
          category: 'debris',
          acknowledged: true,
          resolved: true,
        },
        {
          id: '5',
          type: 'warning',
          title: 'Storm Warning',
          message: 'Tropical storm approaching. High wave conditions expected in next 24 hours.',
          location: 'Waikiki Beach, Honolulu, USA',
          beachId: 'waikiki',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
          severity: 'medium',
          category: 'weather',
          acknowledged: false,
          resolved: false,
        },
        {
          id: '6',
          type: 'critical',
          title: 'Oil Spill Detected',
          message: 'Potential oil spill detected 2km offshore. Emergency response team dispatched.',
          location: 'Malibu Beach, California, USA',
          beachId: 'malibu',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
          severity: 'high',
          category: 'ecosystem',
          acknowledged: true,
          resolved: false,
        },
      ];

      setAlerts(mockAlerts);
    };

    generateAlerts();

    // Simulate new alerts every 30 seconds
    const interval = setInterval(() => {
      const newAlert: Alert = {
        id: Date.now().toString(),
        type: Math.random() > 0.7 ? 'critical' : Math.random() > 0.5 ? 'warning' : 'info',
        title: 'New Environmental Alert',
        message: 'Automated monitoring system detected unusual activity.',
        location: WORLDWIDE_BEACHES[Math.floor(Math.random() * WORLDWIDE_BEACHES.length)].name,
        beachId: WORLDWIDE_BEACHES[Math.floor(Math.random() * WORLDWIDE_BEACHES.length)].id,
        timestamp: new Date(),
        severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
        category: ['debris', 'ecosystem', 'weather'][Math.floor(Math.random() * 3)] as Alert['category'],
        acknowledged: false,
        resolved: false,
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 9)]); // Keep only 10 most recent
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <Bell className="w-5 h-5 text-blue-400" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'border-red-500/30 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'success':
        return 'border-green-500/30 bg-green-500/10';
      default:
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'debris':
        return '🗑️';
      case 'ecosystem':
        return '🌿';
      case 'weather':
        return '🌊';
      case 'maintenance':
        return '🔧';
      case 'all':
        return '📊';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter !== 'all' && alert.type !== filter) return false;
    if (categoryFilter !== 'all' && alert.category !== categoryFilter) return false;
    return true;
  });

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const activeAlerts = alerts.filter(a => !a.resolved);
  const criticalAlerts = alerts.filter(a => a.type === 'critical' && !a.resolved);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Alert Management System</h1>
                <p className="text-red-200 text-sm mt-1">Real-time environmental monitoring and incident response</p>
              </div>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 bg-slate-700/50 border border-white/20 rounded-lg hover:bg-slate-600/50 transition"
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-white" />
              ) : (
                <VolumeX className="w-5 h-5 text-white/50" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Alerts', value: activeAlerts.length, color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-600/20' },
            { label: 'Critical Alerts', value: criticalAlerts.length, color: 'text-red-400', bg: 'from-red-500/20 to-red-600/20' },
            { label: 'Resolved Today', value: alerts.filter(a => a.resolved && new Date(a.timestamp).toDateString() === new Date().toDateString()).length, color: 'text-green-400', bg: 'from-green-500/20 to-green-600/20' },
            { label: 'Response Time', value: '4.2m', color: 'text-yellow-400', bg: 'from-yellow-500/20 to-yellow-600/20' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className={`bg-gradient-to-br ${stat.bg} border border-white/10 rounded-lg p-4 backdrop-blur-lg`}
            >
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-white/60 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Type Filter */}
            <div className="flex gap-2">
              {(['all', 'critical', 'warning', 'info', 'success'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition capitalize ${
                    filter === type
                      ? 'bg-red-500/20 text-red-200 border border-red-500/30'
                      : 'bg-slate-700/50 text-white/50 border border-white/10 hover:bg-slate-600/50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex gap-2">
              {(['all', 'debris', 'ecosystem', 'weather', 'maintenance'] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition capitalize ${
                    categoryFilter === category
                      ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                      : 'bg-slate-700/50 text-white/50 border border-white/10 hover:bg-slate-600/50'
                  }`}
                >
                  {getCategoryIcon(category)} {category}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Alerts List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alerts Feed */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 space-y-4"
          >
            <AnimatePresence>
              {filteredAlerts.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className={`border rounded-lg p-4 backdrop-blur-lg cursor-pointer transition hover:scale-[1.02] ${getAlertColor(alert.type)} ${
                    selectedAlert?.id === alert.id ? 'ring-2 ring-white/30' : ''
                  }`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{alert.title}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70">
                            {getCategoryIcon(alert.category)} {alert.category}
                          </span>
                        </div>
                        <p className="text-white/70 text-sm mb-2">{alert.message}</p>
                        <div className="flex items-center gap-4 text-xs text-white/50">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {alert.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(alert.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!alert.acknowledged && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            acknowledgeAlert(alert.id);
                          }}
                          className="px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-500/30 rounded text-xs hover:bg-blue-500/30 transition"
                        >
                          Acknowledge
                        </button>
                      )}
                      {!alert.resolved && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resolveAlert(alert.id);
                          }}
                          className="px-3 py-1 bg-green-500/20 text-green-200 border border-green-500/30 rounded text-xs hover:bg-green-500/30 transition"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Indicators */}
                  <div className="flex items-center gap-2 mt-3">
                    {alert.acknowledged && (
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-200 rounded-full">
                        Acknowledged
                      </span>
                    )}
                    {alert.resolved && (
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-200 rounded-full">
                        Resolved
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      alert.severity === 'high' ? 'bg-red-500/20 text-red-200' :
                      alert.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-200' :
                      'bg-green-500/20 text-green-200'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Alert Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-1"
          >
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10 rounded-lg p-6 backdrop-blur-lg sticky top-4">
              {selectedAlert ? (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Alert Details</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-white/60 text-sm">Type</label>
                      <div className="flex items-center gap-2 mt-1">
                        {getAlertIcon(selectedAlert.type)}
                        <span className="text-white capitalize">{selectedAlert.type}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-white/60 text-sm">Category</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg">{getCategoryIcon(selectedAlert.category)}</span>
                        <span className="text-white capitalize">{selectedAlert.category}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-white/60 text-sm">Location</label>
                      <p className="text-white mt-1">{selectedAlert.location}</p>
                    </div>

                    <div>
                      <label className="text-white/60 text-sm">Timestamp</label>
                      <p className="text-white mt-1">{selectedAlert.timestamp.toLocaleString()}</p>
                    </div>

                    <div>
                      <label className="text-white/60 text-sm">Severity</label>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                        selectedAlert.severity === 'high' ? 'bg-red-500/20 text-red-200' :
                        selectedAlert.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-200' :
                        'bg-green-500/20 text-green-200'
                      }`}>
                        {selectedAlert.severity.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <label className="text-white/60 text-sm">Status</label>
                      <div className="flex gap-2 mt-1">
                        {selectedAlert.acknowledged && (
                          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-200 rounded-full">
                            Acknowledged
                          </span>
                        )}
                        {selectedAlert.resolved && (
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-200 rounded-full">
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-white/60 text-sm">Description</label>
                      <p className="text-white mt-1 text-sm">{selectedAlert.message}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60">Select an alert to view details</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
