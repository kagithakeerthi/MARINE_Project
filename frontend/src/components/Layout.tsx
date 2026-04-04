import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Map,
  Radar,
  Leaf,
  AlertTriangle,
  Box,
  Menu,
  X,
  Waves,
  Settings,
  Bell,
  Anchor
} from 'lucide-react';
import { useAlertStore } from '../stores/alertStore';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/map', icon: Map, label: 'Map View' },
  { path: '/beaches', icon: Anchor, label: 'Beaches' },
  { path: '/detection', icon: Radar, label: 'Detection' },
  { path: '/ecosystem', icon: Leaf, label: 'Ecosystem' },
  { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { path: '/3d-view', icon: Box, label: '3D View' },
];

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { unreadCount } = useAlertStore();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 80 }}
        className="glass-dark flex flex-col h-full z-20"
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <Waves className="w-8 h-8 text-ocean-400" />
                <span className="font-bold text-lg">Marine Technology</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-ocean-500/30 text-ocean-300 shadow-lg'
                    : 'hover:bg-white/10 text-white/70 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.path === '/alerts' && unreadCount > 0 && (
                <span className="ml-auto bg-coral-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Settings */}
        <div className="p-4 border-t border-white/10">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-white/10 transition-colors">
            <Settings size={20} />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="glass-dark sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              Marine Technology: Satellite Debris & Risk Detection
            </h1>
            <p className="text-sm text-white/60">
              Environmental monitoring for debris, ecosystems, and wave risk.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral-500 rounded-full text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-seagrass-500/20 border border-seagrass-500/30">
              <span className="w-2 h-2 bg-seagrass-400 rounded-full animate-pulse" />
              <span className="text-sm text-seagrass-400">System Active</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
