import React, { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Circle, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MapPage = () => {
  const [debrisZones, setDebrisZones] = useState([]);
  const [ecosystemRegions, setEcosystemRegions] = useState([]);

  // Fetch debris zones
  const fetchDebris = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/v1/map/debris-zones?bounds=10,70,20,80"
      );
      setDebrisZones(res.data.zones);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch ecosystem regions
  const fetchEcosystem = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/v1/map/ecosystem-regions?bounds=10,70,20,80"
      );
      setEcosystemRegions(res.data.regions);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDebris();
    fetchEcosystem();
  }, []);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer center={[15.5, 73.8]} zoom={6} style={{ height: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Debris Zones */}
        {debrisZones.map((zone) => (
          <Circle
            key={zone.id}
            center={zone.center}
            radius={zone.radius}
            pathOptions={{
              color:
                zone.severity === "high"
                  ? "red"
                  : zone.severity === "medium"
                  ? "orange"
                  : "green",
            }}
          />
        ))}

        {/* Ecosystem Regions */}
        {ecosystemRegions.map((region) => (
          <Polygon
            key={region.id}
            positions={region.polygon}
            pathOptions={{
              color:
                region.healthstatus === "good"
                  ? "green"
                  : region.healthstatus === "moderate"
                  ? "yellow"
                  : "red",
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapPage;