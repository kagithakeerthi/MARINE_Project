import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

// Ocean surface
const Ocean = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50, 50, 32, 32]} />
      <meshStandardMaterial color="#1e90ff" wireframe />
    </mesh>
  );
};

// Floating debris (boxes)
const Debris = ({ position }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="brown" />
    </mesh>
  );
};

const Ocean3D = () => {
  return (
    <div style={{ height: "100vh" }}>
      <Canvas camera={{ position: [0, 5, 10] }}>
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} />

        {/* Ocean */}
        <Ocean />

        {/* Debris objects */}
        <Debris position={[2, 0.3, 2]} />
        <Debris position={[-3, 0.3, -1]} />
        <Debris position={[1, 0.3, -3]} />

        {/* Controls */}
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default Ocean3D;