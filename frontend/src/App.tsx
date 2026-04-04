import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import DetectionPage from './pages/DetectionPage';
import EcosystemPage from './pages/EcosystemPage';
import AlertsPage from './pages/AlertsPage';
import Viewer3D from './pages/Viewer3D';
import BeachMonitoring from './pages/BeachMonitoring';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="map" element={<MapView />} />
          <Route path="beaches" element={<BeachMonitoring />} />
          <Route path="detection" element={<DetectionPage />} />
          <Route path="ecosystem" element={<EcosystemPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="3d-view" element={<Viewer3D />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
