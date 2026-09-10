"use client";

import React, { Suspense, useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, Center } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const AIRPLANE_MODEL_PATH = "/models/airplane.glb";
const SKY_MODEL_PATH = "/models/sunrise_sky.glb";

if (typeof window !== "undefined") {
  useGLTF.preload(AIRPLANE_MODEL_PATH);
  useGLTF.preload(SKY_MODEL_PATH);
}

// ---------------------------------------------------------------------------
// 1. PARTS DATA
// ---------------------------------------------------------------------------
const PARTS = [
  {
    id: "overview",
    name: "",
    category: "",
    description: "",
    keywords: [],
    cameraPos: [15, 8, 16],
    lookAt: [0, 0, 0],
    color: "#38bdf8",
    explodeOffset: [0, 0, 0],
  },
  {
    id: "fuselage",
    name: "Fuselage Shell",
    category: "Structure",
    description:
      "Pressurized semi-monocoque airframe containing the passenger cabin and avionics bays.",
    keywords: ["fuselage", "body", "hull", "cabin_outer", "shell", "airframe"],
    cameraPos: [12, 6, 14],
    lookAt: [0, 0, 0],
    color: "#38bdf8",
    explodeOffset: [0, 3.5, 0],
  },
  {
    id: "cockpit",
    name: "Flight Deck",
    category: "Avionics",
    description:
      "Primary flight command center housing pilot controls, navigation displays, and weather radar.",
    keywords: ["cockpit", "nose", "windshield", "window", "glass", "radome"],
    cameraPos: [3, 2.5, 8],
    lookAt: [0, 1.5, 5],
    color: "#00f0ff",
    explodeOffset: [0, 2.2, 4],
  },
  {
    id: "cabin",
    name: "Passenger Cabin",
    category: "Interior",
    description:
      "Pressurized interior outfitted with standard passenger seating, central aisle, and stowage.",
    keywords: ["interior", "seat", "cabin", "floor"],
    cameraPos: [6, 4.5, 3.5],
    lookAt: [0, 2, 0],
    color: "#10b981",
    explodeOffset: [0, 3, 0],
  },
  {
    id: "cargoHold",
    name: "Cargo Hold",
    category: "Storage",
    description:
      "Reinforced underfloor compartment engineered for containerized luggage and palletized freight.",
    keywords: ["cargo", "hold", "door_cargo", "baggage"],
    cameraPos: [5.5, -2.5, 2.5],
    lookAt: [0, -2, 0.5],
    color: "#f97316",
    explodeOffset: [0, -3, 0],
  },
  {
    id: "leftWing",
    name: "Port Wing",
    category: "Aero Structure",
    description:
      "Cantilever lifting airfoil containing main structural spars, fuel chambers, and flight controls.",
    keywords: ["wing_l", "left_wing", "wing.l", "wingleft", "slat_l", "flap_l"],
    cameraPos: [-12, 4.5, 2],
    lookAt: [-6, 0.5, 0],
    color: "#6366f1",
    explodeOffset: [-5, 0.5, -0.5],
  },
  {
    id: "rightWing",
    name: "Starboard Wing",
    category: "Aero Structure",
    description:
      "Right wing framework housing structural ribs, fuel lines, ailerons, and roll spoilers.",
    keywords: [
      "wing_r",
      "right_wing",
      "wing.r",
      "wingright",
      "slat_r",
      "flap_r",
    ],
    cameraPos: [12, 4.5, 2],
    lookAt: [6, 0.5, 0],
    color: "#6366f1",
    explodeOffset: [5, 0.5, -0.5],
  },
  {
    id: "engineLeft",
    name: "Port Turbofan",
    category: "Propulsion",
    description:
      "High-bypass turbofan powerplant providing primary forward thrust and electrical generator power.",
    keywords: [
      "engine_l",
      "turbofan_l",
      "jet_l",
      "engine.l",
      "nacelle_l",
      "fan_l",
    ],
    cameraPos: [-6.5, -0.2, 4.5],
    lookAt: [-4, -1, 2],
    color: "#ef4444",
    explodeOffset: [-3.5, -1.5, 2.5],
  },
  {
    id: "engineRight",
    name: "Starboard Turbofan",
    category: "Propulsion",
    description:
      "Under-wing turbofan nacelle housing multi-stage compression blades and core exhaust channels.",
    keywords: [
      "engine_r",
      "turbofan_r",
      "jet_r",
      "engine.r",
      "nacelle_r",
      "fan_r",
    ],
    cameraPos: [6.5, -0.2, 4.5],
    lookAt: [4, -1, 2],
    color: "#ef4444",
    explodeOffset: [3.5, -1.5, 2.5],
  },
  {
    id: "fuelTank",
    name: "Center Fuel Tank",
    category: "Fuel System",
    description:
      "Main fuselage center reservoir equipped with fuel pumps and nitrogen inerting systems.",
    keywords: ["fuel", "tank", "centertank"],
    cameraPos: [3.5, 2.5, 1],
    lookAt: [0, 1, 0],
    color: "#eab308",
    explodeOffset: [0, 1.8, -1],
  },
  {
    id: "landingGear",
    name: "Landing Gear",
    category: "Hydraulics",
    description:
      "Hydraulic multi-wheel bogies paired with shock struts and carbon heat-pack brakes.",
    keywords: ["gear", "wheel", "tire", "strut", "landing"],
    cameraPos: [3, -3.5, 2.5],
    lookAt: [0, -2.8, 0.5],
    color: "#94a3b8",
    explodeOffset: [0, -3.2, 0.5],
  },
  {
    id: "tail",
    name: "Tail Unit",
    category: "Control Surface",
    description:
      "Vertical stabilizer fin and horizontal tailplane providing directional pitch and yaw control.",
    keywords: [
      "tail",
      "fin",
      "rudder",
      "stabilizer",
      "elevator",
      "empennage",
      "apu",
    ],
    cameraPos: [5.5, 4.5, -12],
    lookAt: [0, 2.5, -7],
    color: "#a855f7",
    explodeOffset: [0, 2.5, -4],
  },
];

// ---------------------------------------------------------------------------
// 2. SUNRISE SKY ENVIRONMENT COMPONENT
// ---------------------------------------------------------------------------
function SunriseSkyEnvironment() {
  const { scene } = useGLTF(SKY_MODEL_PATH);
  const skyRef = useRef();

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        // Prevent sky dome geometry from writing to depth buffer over our plane
        child.material.side = THREE.BackSide;
        child.material.depthWrite = false;
        child.renderOrder = -1;
      }
    });
  }, [scene]);

  // Slow subtle rotation for living atmosphere
  useFrame((_, delta) => {
    if (skyRef.current) {
      skyRef.current.rotation.y += delta * 0.015;
    }
  });

  return (
    <primitive ref={skyRef} object={scene} scale={200} position={[0, 0, 0]} />
  );
}

// ---------------------------------------------------------------------------
// 3. SMOOTH AIRPLANE MODEL COMPONENT
// ---------------------------------------------------------------------------
function SmoothAirplaneModel({ activePartId, isExploded, targetsRef }) {
  const { scene } = useGLTF(AIRPLANE_MODEL_PATH);
  const { size, viewport } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(...PARTS[0].lookAt));

  const categorizedMeshes = useRef({});
  const initialPositions = useRef(new Map());

  const isPortrait = size.width < size.height;
  const responsiveScale = isPortrait
    ? Math.min(viewport.width / 18, 0.32)
    : 0.48;

  useEffect(() => {
    categorizedMeshes.current = {};

    scene.traverse((child) => {
      if (child.isMesh) {
        if (!initialPositions.current.has(child)) {
          initialPositions.current.set(child, child.position.clone());
        }

        if (Array.isArray(child.material)) {
          child.material = child.material.map((m) => m.clone());
        } else if (child.material) {
          child.material = child.material.clone();
        }

        const childName = (child.name || "").toLowerCase();
        let matchedCategory = "fuselage";
        for (const part of PARTS) {
          if (part.keywords.some((kw) => childName.includes(kw))) {
            matchedCategory = part.id;
            break;
          }
        }

        if (!categorizedMeshes.current[matchedCategory]) {
          categorizedMeshes.current[matchedCategory] = [];
        }
        categorizedMeshes.current[matchedCategory].push(child);
      }
    });
  }, [scene]);

  // Exploded displacements
  useEffect(() => {
    PARTS.forEach((part) => {
      if (part.id === "overview") return;
      const meshes = categorizedMeshes.current[part.id] || [];
      meshes.forEach((mesh) => {
        const base = initialPositions.current.get(mesh);
        if (!base) return;

        const targetX = isExploded ? base.x + part.explodeOffset[0] : base.x;
        const targetY = isExploded ? base.y + part.explodeOffset[1] : base.y;
        const targetZ = isExploded ? base.z + part.explodeOffset[2] : base.z;

        gsap.to(mesh.position, {
          x: targetX,
          y: targetY,
          z: targetZ,
          duration: 1.0,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
    });
  }, [isExploded]);

  // Highlight and cutaway materials
  useEffect(() => {
    const isOverview = activePartId === "overview";

    PARTS.forEach((part) => {
      if (part.id === "overview") return;
      const meshes = categorizedMeshes.current[part.id] || [];
      const isTarget = part.id === activePartId;
      const isFuselage = part.id === "fuselage";

      let targetOpacity = 1.0;
      let targetEmissive = new THREE.Color(0x000000);

      if (isOverview) {
        targetOpacity = 1.0;
      } else if (isTarget) {
        targetOpacity = 1.0;
        targetEmissive = new THREE.Color(part.color);
      } else if (isFuselage) {
        targetOpacity = 0.15;
      } else {
        targetOpacity = 0.45;
      }

      meshes.forEach((mesh) => {
        const mat = mesh.material;
        if (!mat) return;

        mat.transparent = true;

        gsap.to(mat, {
          opacity: targetOpacity,
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });

        if (mat.emissive) {
          gsap.to(mat.emissive, {
            r: targetEmissive.r,
            g: targetEmissive.g,
            b: targetEmissive.b,
            duration: 0.35,
            ease: "power2.out",
            overwrite: "auto",
          });
        }
      });
    });
  }, [activePartId]);

  // Frame-rate independent camera damping
  useFrame(({ camera }, delta) => {
    const t = targetsRef.current;

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      t.camX,
      4,
      delta,
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      t.camY,
      4,
      delta,
    );
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      t.camZ,
      4,
      delta,
    );

    currentLookAt.current.x = THREE.MathUtils.damp(
      currentLookAt.current.x,
      t.lookX,
      4,
      delta,
    );
    currentLookAt.current.y = THREE.MathUtils.damp(
      currentLookAt.current.y,
      t.lookY,
      4,
      delta,
    );
    currentLookAt.current.z = THREE.MathUtils.damp(
      currentLookAt.current.z,
      t.lookZ,
      4,
      delta,
    );

    camera.lookAt(currentLookAt.current);
  });

  const activePart = PARTS.find((p) => p.id === activePartId);

  return (
    <Center scale={responsiveScale}>
      <primitive object={scene} />

      {/* 3D Callout Label for Active Part */}
      {isExploded && activePart && activePart.id !== "overview" && (
        <group
          position={[
            activePart.explodeOffset[0],
            activePart.explodeOffset[1] + 1.0,
            activePart.explodeOffset[2],
          ]}
        >
          <Html distanceFactor={15} center>
            <div className="flex items-center gap-2 rounded-full border border-amber-300/60 bg-slate-950/80 px-3 py-1 shadow-lg backdrop-blur-md pointer-events-none">
              <span
                className="h-2 w-2 rounded-full animate-pulse flex-shrink-0"
                style={{ backgroundColor: activePart.color }}
              />
              <span className="whitespace-nowrap text-xs font-semibold text-white">
                {activePart.name}
              </span>
            </div>
          </Html>
        </group>
      )}
    </Center>
  );
}

// ---------------------------------------------------------------------------
// 4. MAIN SCROLL CONTAINER
// ---------------------------------------------------------------------------
export default function AirplaneScrollReveal() {
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [isExploded, setIsExploded] = useState(true);
  const [isOrbitActive, setIsOrbitActive] = useState(false);

  const containerRef = useRef(null);
  const canvasWrapperRef = useRef(null);

  const targetsRef = useRef({
    camX: PARTS[0].cameraPos[0],
    camY: PARTS[0].cameraPos[1],
    camZ: PARTS[0].cameraPos[2],
    lookX: PARTS[0].lookAt[0],
    lookY: PARTS[0].lookAt[1],
    lookZ: PARTS[0].lookAt[2],
  });

  useEffect(() => {
    const totalStages = PARTS.length;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: `+=${totalStages * 100}%`,
          pin: canvasWrapperRef.current,
          scrub: 1.2,
          anticipatePin: 1,
          onUpdate: (self) => {
            const index = Math.min(
              Math.floor(self.progress * totalStages),
              totalStages - 1,
            );
            setActivePartIndex(index);
          },
        },
      });

      PARTS.forEach((part, i) => {
        if (i === 0) return;

        tl.to(
          targetsRef.current,
          {
            camX: part.cameraPos[0],
            camY: part.cameraPos[1],
            camZ: part.cameraPos[2],
            lookX: part.lookAt[0],
            lookY: part.lookAt[1],
            lookZ: part.lookAt[2],
            ease: "sine.inOut",
            duration: 1,
          },
          `step-${i}`,
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const activePart = PARTS[activePartIndex];
  const isOverview = activePart.id === "overview";

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-slate-950 text-white font-sans selection:bg-amber-400 selection:text-black"
    >
      <div
        ref={canvasWrapperRef}
        className="relative h-screen w-full overflow-hidden"
      >
        {/* 3D Viewport */}
        <Canvas
          dpr={[1, 1.5]}
          frameloop="always"
          camera={{ position: PARTS[0].cameraPos, fov: 42 }}
          className="h-full w-full"
        >
          {/* Warm sunrise lighting setup */}
          <ambientLight intensity={1.2} color="#ffe8d6" />
          <directionalLight
            position={[30, 20, 20]}
            intensity={2.8}
            color="#ffb07c"
          />
          <directionalLight
            position={[-20, -10, -15]}
            intensity={0.8}
            color="#90b8f8"
          />

          <Suspense
            fallback={
              <Html center>
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-amber-500/40 text-xs font-medium text-amber-200 backdrop-blur-md whitespace-nowrap">
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  Loading Sunrise Environment...
                </div>
              </Html>
            }
          >
            {/* 3D Sky Dome Environment */}
            <SunriseSkyEnvironment />

            {/* Airplane Subassembly Model */}
            <SmoothAirplaneModel
              activePartId={activePart.id}
              isExploded={isExploded}
              targetsRef={targetsRef}
            />
          </Suspense>

          <OrbitControls
            enabled={isOrbitActive}
            enableDamping
            dampingFactor={0.05}
            maxDistance={50}
            minDistance={3}
          />
        </Canvas>

        {/* Minimal Navigation Header */}
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:p-6">
          <div className="pointer-events-auto flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/80" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-100 drop-shadow">
              Golden Horizon Cutaway
            </span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOrbitActive((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors backdrop-blur-md ${
                isOrbitActive
                  ? "bg-amber-950/80 border-amber-400 text-amber-300"
                  : "bg-slate-950/60 border-slate-700/80 text-slate-300 hover:border-slate-500"
              }`}
            >
              Orbit {isOrbitActive ? "On" : "Off"}
            </button>
            <button
              type="button"
              onClick={() => setIsExploded((prev) => !prev)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors backdrop-blur-md ${
                isExploded
                  ? "bg-amber-950/80 border-amber-400 text-amber-300"
                  : "bg-slate-950/60 border-slate-700/80 text-slate-300 hover:border-slate-500"
              }`}
            >
              {isExploded ? "Assemble" : "Explode"}
            </button>
          </div>
        </header>

        {/* Start-Screen Scroll Prompt */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center transition-all duration-500 ${
            isOverview ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-slate-950/70 backdrop-blur-md text-xs text-amber-200/90 shadow-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Scroll to inspect airplane parts
          </div>
        </div>

        {/* Part Detail Card */}
        <div
          className={`pointer-events-none absolute bottom-4 inset-x-4 sm:left-6 sm:bottom-6 sm:max-w-sm z-20 transition-all duration-500 ease-out ${
            !isOverview
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6 pointer-events-none"
          }`}
        >
          <div className="pointer-events-auto rounded-xl border border-white/15 bg-slate-950/75 p-4 sm:p-5 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                {activePart.category}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {activePartIndex} / {PARTS.length - 1}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-white">
              {activePart.name}
            </h2>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-200/90">
              {activePart.description}
            </p>
          </div>
        </div>

        {/* Right Step Indicators */}
        <nav
          aria-label="Component Steps"
          className={`pointer-events-none absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-1.5 md:flex transition-opacity duration-300 ${
            !isOverview ? "opacity-100" : "opacity-0"
          }`}
        >
          {PARTS.slice(1).map((part, index) => (
            <div
              key={part.id}
              className={`rounded-full transition-all duration-300 ${
                index + 1 === activePartIndex
                  ? "h-4 w-1.5 bg-amber-400 shadow-sm shadow-amber-400/80"
                  : "h-1.5 w-1.5 bg-white/25"
              }`}
            />
          ))}
        </nav>
      </div>

      {/* Spacer for GSAP Scroll Length */}
      <div className="pointer-events-none h-full w-full" />
    </div>
  );
}
