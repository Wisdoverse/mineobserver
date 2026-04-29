'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Line } from '@react-three/drei';
import * as THREE from 'three';

/** 线框球体 + 经纬线 */
function WireframeGlobe() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  const latLines = useMemo(() => {
    const lines: { key: string; points: THREE.Vector3[] }[] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      const phi = (90 - lat) * (Math.PI / 180);
      const radius = 1.8 * Math.sin(phi);
      const y = 1.8 * Math.cos(phi);
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(
          radius * Math.cos(theta),
          y,
          radius * Math.sin(theta)
        ));
      }
      lines.push({ key: `lat-${lat}`, points });
    }
    return lines;
  }, []);

  const lonLines = useMemo(() => {
    const lines: { key: string; points: THREE.Vector3[] }[] = [];
    for (let lon = 0; lon < 360; lon += 30) {
      const theta = lon * (Math.PI / 180);
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const phi = (i / 64) * Math.PI;
        points.push(new THREE.Vector3(
          1.8 * Math.sin(phi) * Math.cos(theta),
          1.8 * Math.cos(phi),
          1.8 * Math.sin(phi) * Math.sin(theta)
        ));
      }
      lines.push({ key: `lon-${lon}`, points });
    }
    return lines;
  }, []);

  return (
    <group ref={groupRef}>
      {/* Outer wireframe sphere */}
      <mesh>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial color="#5d9b3a" wireframe transparent opacity={0.06} />
      </mesh>

      {/* Inner subtle glow sphere */}
      <mesh>
        <sphereGeometry args={[1.78, 32, 32]} />
        <meshBasicMaterial color="#d4f5d0" transparent opacity={0.08} />
      </mesh>

      {/* Latitude lines */}
      {latLines.map((l) => (
        <Line
          key={l.key}
          points={l.points}
          color="#5d9b3a"
          lineWidth={0.5}
          transparent
          opacity={0.25}
        />
      ))}

      {/* Longitude lines */}
      {lonLines.map((l) => (
        <Line
          key={l.key}
          points={l.points}
          color="#5d9b3a"
          lineWidth={0.5}
          transparent
          opacity={0.15}
        />
      ))}

      {/* Surface dots */}
      <GlobeDots />
    </group>
  );
}

/** 球面上的散点 - 模拟 Agent 分布 */
function GlobeDots() {
  const dotsRef = useRef<THREE.InstancedMesh>(null);

  const dotData = useMemo(() => {
    const positions: { pos: THREE.Vector3; color: THREE.Color }[] = [];
    const colors = [
      new THREE.Color('#5d9b3a'),
      new THREE.Color('#4ade80'),
      new THREE.Color('#86efac'),
      new THREE.Color('#22c55e'),
      new THREE.Color('#a3e635'),
    ];

    const count = 60;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);
      const r = 1.82;
      positions.push({
        pos: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        ),
        color: colors[i % colors.length],
      });
    }
    return positions;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Set instance matrices and colors after mount
  useFrame(() => {
    if (!dotsRef.current) return;
    dotData.forEach((dot, i) => {
      dummy.position.copy(dot.pos);
      dummy.scale.setScalar(0.03);
      dummy.updateMatrix();
      dotsRef.current!.setMatrixAt(i, dummy.matrix);
      dotsRef.current!.setColorAt(i, dot.color);
    });
    dotsRef.current.instanceMatrix.needsUpdate = true;
    if (dotsRef.current.instanceColor) dotsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={dotsRef} args={[undefined, undefined, dotData.length]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial />
    </instancedMesh>
  );
}

/** 浮动的 Minecraft 方块 */
function FloatingBlock({
  position,
  color,
  rotationSpeed = 0.5,
  size = 0.15,
}: {
  position: [number, number, number];
  color: string;
  rotationSpeed?: number;
  size?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * rotationSpeed;
      meshRef.current.rotation.y += delta * rotationSpeed * 0.7;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
      </mesh>
    </Float>
  );
}

/** 粒子漂浮效果 */
function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);

  const particlePositions = useMemo(() => {
    const positions = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.2 + Math.random() * 1.5;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return positions;
  }, []);

  useFrame((_state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particlePositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#5d9b3a"
        size={0.02}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

/** 场景内容 */
function Scene() {
  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-3, 2, 4]} intensity={0.4} color="#5d9b3a" />

      {/* Globe */}
      <WireframeGlobe />

      {/* Floating Minecraft blocks */}
      <FloatingBlock position={[2.3, 0.8, 0.5]} color="#5d9b3a" rotationSpeed={0.4} size={0.18} />
      <FloatingBlock position={[-2.1, -0.5, 1.0]} color="#4ee4d0" rotationSpeed={0.6} size={0.14} />
      <FloatingBlock position={[1.5, -1.2, -1.5]} color="#866043" rotationSpeed={0.5} size={0.16} />
      <FloatingBlock position={[-1.8, 1.0, -0.8]} color="#a88c5c" rotationSpeed={0.3} size={0.12} />
      <FloatingBlock position={[0.5, 2.0, -1.0]} color="#ffd700" rotationSpeed={0.7} size={0.10} />
      <FloatingBlock position={[-0.8, -1.8, 1.5]} color="#ef4444" rotationSpeed={0.5} size={0.11} />

      {/* Particles */}
      <FloatingParticles />

      {/* Controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        maxPolarAngle={Math.PI * 0.7}
        minPolarAngle={Math.PI * 0.3}
      />
    </>
  );
}

/** Globe3D - 动态 3D 球体组件 */
export default function Globe3D() {
  return (
    <div className="w-full h-full">
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-48 h-48 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 animate-pulse" />
        </div>
      }>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
