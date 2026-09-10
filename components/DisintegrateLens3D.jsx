"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * DisintegrateLens3D
 * -------------------
 * A procedural 3D camera-lens shape (built from primitives, no external
 * model file needed) rendered with react-three-fiber. As the user scrolls
 * through this component's section, the lens breaks apart into thousands
 * of small cube "voxels" that fly outward and shrink away — then
 * reassemble on scroll-up.
 *
 * Install first:
 *   npm install three @react-three/fiber @react-three/drei
 *
 * Usage:
 *   <DisintegrateLens3D scrollMultiplier={3} maxDistance={6} />
 */

// ---- Color palette for the front ring segments (matches a camera-lens focus ring) ----
const RING_COLORS = [
  "#ef4444", // red
  "#f59e0b", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
];

function colorForAngle(angle) {
  // angle in [0, 2PI) -> pick a color band, blending slightly at edges is skipped for simplicity
  const t = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const idx = Math.floor((t / (Math.PI * 2)) * RING_COLORS.length);
  return new THREE.Color(RING_COLORS[Math.min(idx, RING_COLORS.length - 1)]);
}

function LensParticles({ progressRef, maxDistance }) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const ringRef = useRef();

  // ---- Build the particle field once ----
  const { bodyData, ringData, bodyCount, ringCount } = useMemo(() => {
    const bodyData = [];
    const radialSegments = 40;
    const heightSegments = 26;
    const radiusTop = 1.0;
    const radiusBottom = 1.55;
    const height = 4.2;

    for (let h = 0; h <= heightSegments; h++) {
      const v = h / heightSegments; // 0 top -> 1 bottom
      const radius = THREE.MathUtils.lerp(radiusTop, radiusBottom, v);
      const y = THREE.MathUtils.lerp(height / 2, -height / 2, v);

      for (let r = 0; r < radialSegments; r++) {
        const angle = (r / radialSegments) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        const normal = new THREE.Vector3(
          Math.cos(angle),
          0.15,
          Math.sin(angle),
        ).normalize();

        // Colorful rainbow gradient: hue cycles around the circumference,
        // shifted a bit by height so bands spiral slightly rather than
        // forming flat horizontal rings.
        const hue = (angle / (Math.PI * 2) + v * 0.35) % 1;
        const color = new THREE.Color().setHSL(
          hue,
          1,
          0.55 + Math.random() * 0.15,
        );

        bodyData.push({
          home: new THREE.Vector3(x, y, z),
          normal,
          color,
          threshold: Math.random() * 0.55, // when (in scroll progress) this piece starts moving
          speed: 0.7 + Math.random() * 1.1,
          scaleBase: 0.06 + Math.random() * 0.035,
        });
      }
    }

    // ---- Front colored ring (focus ring) ----
    const ringData = [];
    const ringCountTotal = 220;
    const ringRadius = 1.62;
    const ringY = -height / 2 - 0.05;
    for (let i = 0; i < ringCountTotal; i++) {
      const angle = (i / ringCountTotal) * Math.PI * 2;
      const x = Math.cos(angle) * ringRadius;
      const z = Math.sin(angle) * ringRadius;
      const normal = new THREE.Vector3(
        Math.cos(angle),
        0,
        Math.sin(angle),
      ).normalize();
      ringData.push({
        home: new THREE.Vector3(x, ringY, z),
        normal,
        color: colorForAngle(angle),
        threshold: Math.random() * 0.4,
        speed: 0.8 + Math.random() * 1.0,
        scaleBase: 0.075,
      });
    }

    return {
      bodyData,
      ringData,
      bodyCount: bodyData.length,
      ringCount: ringData.length,
    };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // ---- Paint initial instance colors once ----
  useEffect(() => {
    if (bodyRef.current) {
      bodyData.forEach((p, i) => bodyRef.current.setColorAt(i, p.color));
      bodyRef.current.instanceColor.needsUpdate = true;
    }
    if (ringRef.current) {
      ringData.forEach((p, i) => ringRef.current.setColorAt(i, p.color));
      ringRef.current.instanceColor.needsUpdate = true;
    }
  }, [bodyData, ringData]);

  // ---- Per-frame: update instance matrices from current scroll progress ----
  useFrame(() => {
    const progress = progressRef.current;

    const updateGroup = (mesh, data) => {
      if (!mesh) return;
      for (let i = 0; i < data.length; i++) {
        const p = data[i];
        const local = THREE.MathUtils.clamp(
          (progress - p.threshold) / Math.max(0.001, 1 - p.threshold),
          0,
          1,
        );
        const eased = 1 - Math.pow(1 - local, 2); // ease-out
        const dist = eased * maxDistance * p.speed;

        dummy.position.set(
          p.home.x + p.normal.x * dist,
          p.home.y +
            p.normal.y * dist +
            eased * 0.6 * (Math.random() - 0.5) * 0.02,
          p.home.z + p.normal.z * dist,
        );
        const scale = p.scaleBase * (1 - local); // shrink to nothing as it disintegrates
        dummy.scale.setScalar(Math.max(scale, 0.0001));
        dummy.rotation.set(local * 3, local * 2, local * 1.5);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };

    updateGroup(bodyRef.current, bodyData);
    updateGroup(ringRef.current, ringData);

    // Tilt from vertical (standing up) to horizontal (lying on its side)
    // as the user scrolls through the section.
    if (groupRef.current) {
      const tiltEased = 1 - Math.pow(1 - progress, 2);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        0,
        Math.PI / 2,
        tiltEased,
      );
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={bodyRef} args={[null, null, bodyCount]}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshBasicMaterial vertexColors toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={ringRef} args={[null, null, ringCount]}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshBasicMaterial vertexColors toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

export default function DisintegrateLens3D({
  className = "",
  scrollMultiplier = 3,
  maxDistance = 6,
  backgroundColor = "#141414",
}) {
  const wrapperRef = useRef(null);
  const progressRef = useRef(0);

  useEffect(() => {
    function handleScroll() {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const totalScrollable = rect.height - viewportH;
      const scrolled = -rect.top;
      let progress = totalScrollable > 0 ? scrolled / totalScrollable : 0;
      progress = Math.min(1, Math.max(0, progress));
      progressRef.current = progress;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ height: `${scrollMultiplier * 100}vh`, position: "relative" }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          background: backgroundColor,
        }}
      >
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <color attach="background" args={[backgroundColor]} />
          <fog attach="fog" args={[backgroundColor, 6, 16]} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <directionalLight position={[-5, -2, -5]} intensity={0.4} />
          <LensParticles progressRef={progressRef} maxDistance={maxDistance} />
        </Canvas>
      </div>
    </div>
  );
}
