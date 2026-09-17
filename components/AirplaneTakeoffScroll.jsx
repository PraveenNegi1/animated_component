"use client";

import React, { Suspense, useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Html, Sky, Clouds, Cloud } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const AIRPLANE_MODEL_PATH = "/models/airplanetakeoff.glb";

if (typeof window !== "undefined") {
  useGLTF.preload(AIRPLANE_MODEL_PATH);
}

// ---------------------------------------------------------------------------
// 1. SKY, SUN DISC & VOLUMETRIC VALLEY CLOUDS
// ---------------------------------------------------------------------------
function SkyAndAtmosphere() {
  const cloudGroupRef = useRef();

  useFrame((_, delta) => {
    if (cloudGroupRef.current) {
      cloudGroupRef.current.position.z += delta * 2.0;
      if (cloudGroupRef.current.position.z > 160) {
        cloudGroupRef.current.position.z = -160;
      }
    }
  });

  return (
    <>
      <Sky
        sunPosition={[130, 22, -260]}
        turbidity={4.5}
        rayleigh={1.8}
        mieCoefficient={0.005}
        mieDirectionalG={0.88}
      />

      {/* Sun Disc */}
      <mesh position={[240, 42, -500]}>
        <sphereGeometry args={[30, 32, 32]} />
        <meshBasicMaterial color="#fed7aa" />
      </mesh>

      {/* Atmospheric Mist Plane */}
      <mesh position={[0, 26, -460]}>
        <planeGeometry args={[1600, 220]} />
        <meshBasicMaterial
          color="#f97316"
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Volumetric Clouds */}
      <group ref={cloudGroupRef} position={[0, 58, -80]}>
        <Clouds material={THREE.MeshLambertMaterial} limit={200}>
          <Cloud
            position={[0, 10, 0]}
            segments={24}
            bounds={[130, 18, 140]}
            volume={28}
            color="#fed7aa"
            opacity={0.32}
          />
          <Cloud
            position={[-95, 14, -60]}
            segments={20}
            bounds={[85, 14, 90]}
            volume={20}
            color="#fdba74"
            opacity={0.25}
          />
          <Cloud
            position={[100, 14, -90]}
            segments={20}
            bounds={[85, 14, 90]}
            volume={20}
            color="#f1f5f9"
            opacity={0.38}
          />
        </Clouds>
      </group>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2. PROCEDURAL ALPINE MOUNTAIN RIDGES (Snow Caps & Height Gradients)
// ---------------------------------------------------------------------------
function MountainRanges() {
  const createMountainGeometry = (sideMultiplier = 1) => {
    const width = 450;
    const depth = 1200;
    const segW = 80;
    const segD = 100;
    const geom = new THREE.PlaneGeometry(width, depth, segW, segD);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    const colors = [];

    const valleyColor = new THREE.Color("#1e293b");
    const rockColor = new THREE.Color("#475569");
    const sunLitRock = new THREE.Color("#78716c");
    const snowColor = new THREE.Color("#f8fafc");

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      const u = (x + width / 2) / width;
      const distFromRunway = sideMultiplier === 1 ? u : 1 - u;
      const baseSlope = Math.pow(distFromRunway, 1.4) * 110;

      const n1 = Math.sin(x * 0.015 + z * 0.008) * 26;
      const n2 = Math.cos(x * 0.035 - z * 0.02) * 14;
      const n3 = Math.sin((x + z) * 0.06) * 6;
      const n4 = Math.cos(x * 0.1) * 2.5;

      let elevation = (baseSlope + n1 + n2 + n3 + n4) * distFromRunway;
      if (elevation < 0.2) elevation = 0.2;

      pos.setY(i, elevation);

      const vertexColor = new THREE.Color();
      if (elevation < 25) {
        vertexColor.copy(valleyColor).lerp(rockColor, elevation / 25);
      } else if (elevation < 65) {
        vertexColor.copy(rockColor).lerp(sunLitRock, (elevation - 25) / 40);
      } else {
        vertexColor
          .copy(sunLitRock)
          .lerp(snowColor, Math.min((elevation - 65) / 35, 1));
      }

      colors.push(vertexColor.r, vertexColor.g, vertexColor.b);
    }

    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();
    return geom;
  };

  const leftMountainGeom = useMemo(() => createMountainGeometry(-1), []);
  const rightMountainGeom = useMemo(() => createMountainGeometry(1), []);

  return (
    <group>
      {/* Left Alpine Mountain Ridge */}
      <mesh
        geometry={leftMountainGeom}
        position={[-260, 0, -260]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          vertexColors={true}
          roughness={0.82}
          metalness={0.12}
        />
      </mesh>

      {/* Right Alpine Mountain Ridge */}
      <mesh
        geometry={rightMountainGeom}
        position={[260, 0, -260]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          vertexColors={true}
          roughness={0.82}
          metalness={0.12}
        />
      </mesh>

      {/* Distant Mountain Peak Backdrop */}
      {[-320, 0, 320].map((xOffset, i) => (
        <mesh key={i} position={[xOffset, 15, -780]}>
          <coneGeometry args={[260, 140, 16]} />
          <meshStandardMaterial
            color={i === 1 ? "#334155" : "#1e293b"}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// 3. VALLEY RUNWAY INFRASTRUCTURE
// ---------------------------------------------------------------------------
function Runway() {
  const edgeLights = useMemo(() => {
    const lights = [];
    for (let i = 0; i < 50; i++) {
      const z = 130 - i * 16;
      lights.push([-14.2, 0.25, z]);
      lights.push([14.2, 0.25, z]);
    }
    return lights;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* Asphalt Deck */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, -220]}
        receiveShadow
      >
        <planeGeometry args={[28, 920]} />
        <meshStandardMaterial
          color="#080c14"
          roughness={0.94}
          metalness={0.12}
        />
      </mesh>

      {/* Gravel Transition Shoulder */}
      {[-16.5, 16.5].map((x, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, -0.015, -220]}
        >
          <planeGeometry args={[5, 920]} />
          <meshStandardMaterial color="#1e293b" roughness={1.0} />
        </mesh>
      ))}

      {/* Perimeter White Boundary Lines */}
      {[-13.5, 13.5].map((x, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.015, -220]}
        >
          <planeGeometry args={[0.5, 920]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
      ))}

      {/* Centerline Dashes */}
      {Array.from({ length: 60 }).map((_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, 125 - i * 15]}
        >
          <planeGeometry args={[0.85, 9]} />
          <meshStandardMaterial
            color="#facc15"
            roughness={0.25}
            emissive="#ca8a04"
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}

      {/* Threshold White Piano Keys */}
      {[-9, -6.5, -4, -1.5, 1.5, 4, 6.5, 9].map((x, idx) => (
        <mesh
          key={idx}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.02, 132]}
        >
          <planeGeometry args={[1.2, 20]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
      ))}

      {/* Elevated White Boundary Lights */}
      {edgeLights.map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <boxGeometry args={[0.18, 0.45, 0.18]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={2.8}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Threshold Green Light Stanchions */}
      {[-12, -8, -4, 0, 4, 8, 12].map((x, idx) => (
        <mesh key={idx} position={[x, 0.25, 142]}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#22c55e"
            emissiveIntensity={4.2}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Valley Floor Ground Base */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        receiveShadow
      >
        <planeGeometry args={[2400, 2400]} />
        <meshStandardMaterial color="#020617" roughness={1.0} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 4. AIRPLANE RIG & PROCEDURAL DIRECTIONAL GROUND SHADOW
// ---------------------------------------------------------------------------
function AirplaneWithShadow({ timelineRefs }) {
  const { scene } = useGLTF(AIRPLANE_MODEL_PATH);
  const { size } = useThree();

  const planeGroupRef = useRef();
  const shadowMeshRef = useRef();
  const shadowMaterialRef = useRef();

  const isPortrait = size.width < size.height;
  const responsiveLength = isPortrait ? 8.2 : 11.2;

  const normalizedScene = useMemo(() => {
    const cloned = scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const currentSize = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(currentSize);
    box.getCenter(center);

    const maxDim = Math.max(currentSize.x, currentSize.y, currentSize.z);
    const scaleFactor = responsiveLength / (maxDim || 1);

    cloned.position.x = -center.x * scaleFactor;
    cloned.position.y = -box.min.y * scaleFactor;
    cloned.position.z = -center.z * scaleFactor;
    cloned.scale.setScalar(scaleFactor);
    cloned.rotation.y = 0;

    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.roughness = 0.22;
          child.material.metalness = 0.65;
          child.material.envMapIntensity = 1.8;
          child.material.needsUpdate = true;
        }
      }
    });

    return cloned;
  }, [scene, responsiveLength]);

  const shadowTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 256, 256);

    // Wings shadow lobe
    const wingGrad = ctx.createRadialGradient(128, 128, 4, 128, 128, 110);
    wingGrad.addColorStop(0, "rgba(0, 0, 0, 0.85)");
    wingGrad.addColorStop(0.45, "rgba(0, 0, 0, 0.45)");
    wingGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.save();
    ctx.scale(1.2, 0.35);
    ctx.fillStyle = wingGrad;
    ctx.beginPath();
    ctx.arc(106, 365, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Fuselage shadow lobe
    const bodyGrad = ctx.createRadialGradient(128, 128, 4, 128, 128, 120);
    bodyGrad.addColorStop(0, "rgba(0, 0, 0, 0.95)");
    bodyGrad.addColorStop(0.35, "rgba(0, 0, 0, 0.6)");
    bodyGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.save();
    ctx.scale(0.35, 1.2);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(365, 106, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame(({ clock }) => {
    const t = timelineRefs.current;
    const time = clock.getElapsedTime();

    // Natural mountain thermal turbulence buffet
    const turbulenceRoll =
      Math.sin(time * 18) * 0.003 * (t.planeY > 0.5 ? 1 : 0.05);
    const turbulencePitch =
      Math.cos(time * 14) * 0.002 * (t.planeY > 0.5 ? 1 : 0.05);

    if (planeGroupRef.current) {
      planeGroupRef.current.position.set(t.planeX, t.planeY, t.planeZ);
      planeGroupRef.current.rotation.set(
        t.pitch + turbulencePitch,
        t.yaw,
        t.roll + turbulenceRoll,
      );
    }

    // Directional shadow tracking
    if (shadowMeshRef.current && shadowMaterialRef.current) {
      const altitude = Math.max(0, t.planeY);

      const shadowOffsetX = -altitude * 0.18;
      const shadowOffsetZ = altitude * 0.12;

      shadowMeshRef.current.position.set(
        t.planeX + shadowOffsetX,
        0.025,
        t.planeZ + shadowOffsetZ,
      );
      shadowMeshRef.current.rotation.z = -t.yaw;

      const shadowScale = THREE.MathUtils.lerp(
        1.0,
        3.8,
        Math.min(altitude / 70, 1),
      );
      shadowMeshRef.current.scale.set(shadowScale, shadowScale, 1);

      const shadowOpacity = THREE.MathUtils.lerp(
        0.85,
        0.0,
        Math.min(altitude / 65, 1),
      );
      shadowMaterialRef.current.opacity = shadowOpacity;
    }
  });

  return (
    <>
      <group ref={planeGroupRef} position={[0, 0, 80]}>
        <primitive object={normalizedScene} />
      </group>

      <mesh
        ref={shadowMeshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.025, 80]}
      >
        <planeGeometry args={[16, 22]} />
        <meshBasicMaterial
          ref={shadowMaterialRef}
          map={shadowTexture}
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5. CHASE CAMERA RIG & DYNAMIC FOV
// ---------------------------------------------------------------------------
function TakeoffScene({ timelineRefs }) {
  const currentLookAt = useRef(new THREE.Vector3(0, 2.5, 0));
  const { size } = useThree();
  const isPortrait = size.width < size.height;

  useFrame(({ camera }, delta) => {
    const t = timelineRefs.current;

    const responsiveCamZ = t.camZ + (isPortrait ? 9.0 : 0);
    const responsiveCamY = t.camY + (isPortrait ? 1.8 : 0);

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      t.camX,
      3.2,
      delta,
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      responsiveCamY,
      3.2,
      delta,
    );
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      responsiveCamZ,
      3.2,
      delta,
    );

    currentLookAt.current.x = THREE.MathUtils.damp(
      currentLookAt.current.x,
      t.lookX,
      3.8,
      delta,
    );
    currentLookAt.current.y = THREE.MathUtils.damp(
      currentLookAt.current.y,
      t.lookY,
      3.8,
      delta,
    );
    currentLookAt.current.z = THREE.MathUtils.damp(
      currentLookAt.current.z,
      t.lookZ,
      3.8,
      delta,
    );

    camera.lookAt(currentLookAt.current);

    if (t.fov) {
      const targetFov = t.fov + (isPortrait ? 6 : 0);
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 2.4, delta);
      camera.updateProjectionMatrix();
    }
  });

  return (
    <>
      <SkyAndAtmosphere />
      <MountainRanges />
      <Runway />
      <AirplaneWithShadow timelineRefs={timelineRefs} />
    </>
  );
}

// ---------------------------------------------------------------------------
// 6. MAIN SCROLL WRAPPER (TAKEOFF -> MID-SKY TILTS -> PATTERN -> TOUCHDOWN)
// ---------------------------------------------------------------------------
export default function AirplaneTakeoffScroll() {
  const containerRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const phaseLabelRef = useRef(null);

  const timelineRefs = useRef({
    planeX: 0,
    planeY: 0,
    planeZ: 80,
    pitch: 0,
    yaw: 0,
    roll: 0,
    camX: 0,
    camY: 4.6,
    camZ: 104,
    lookX: 0,
    lookY: 2.5,
    lookZ: 65,
    fov: 42,
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      const t = timelineRefs.current;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=1100%",
          pin: canvasWrapperRef.current,
          scrub: 1.8,
          anticipatePin: 1,
        },
      });

      // ---------------------------------------------------------------------
      // PHASE 1: TAKEOFF ACCELERATION (0 to 145 knots)
      // ---------------------------------------------------------------------
      tl.to(
        t,
        {
          planeZ: -35,
          camZ: -10,
          camY: 4.2,
          lookZ: -50,
          fov: 46,
          duration: 2.0,
          ease: "power2.in",
          onStart: () => {
            if (phaseLabelRef.current) {
              phaseLabelRef.current.innerText = "TAKEOFF ROLL // 145 KTS";
            }
          },
        },
        "roll",
      );

      // ---------------------------------------------------------------------
      // PHASE 2: ROTATION (Vr) & LIFTOFF
      // ---------------------------------------------------------------------
      tl.to(
        t,
        {
          planeZ: -110,
          planeY: 14.0,
          pitch: 0.25,
          camX: 6.5,
          camY: 9.5,
          camZ: -76,
          lookX: 0,
          lookY: 12.0,
          lookZ: -130,
          fov: 43,
          duration: 1.8,
          ease: "power2.out",
          onStart: () => {
            if (phaseLabelRef.current) {
              phaseLabelRef.current.innerText = "ROTATION (Vr) // LIFTOFF";
            }
          },
        },
        "rotate",
      );

      // ---------------------------------------------------------------------
      // PHASE 3: VALLEY CLIMB
      // ---------------------------------------------------------------------
      tl.to(
        t,
        {
          planeZ: -210,
          planeY: 44.0,
          pitch: 0.18,
          camX: 20,
          camY: 32,
          camZ: -155,
          lookX: -5,
          lookY: 38,
          lookZ: -230,
          fov: 40,
          duration: 2.2,
          ease: "power1.inOut",
          onStart: () => {
            if (phaseLabelRef.current) {
              phaseLabelRef.current.innerText =
                "VALLEY CLIMB // AIRBORNE FL050";
            }
          },
        },
        "climb",
      );

      // ---------------------------------------------------------------------
      // PHASE 4: MID-SKY TILT RIGHT (Banking right through canyon pass)
      // ---------------------------------------------------------------------
      tl.to(
        t,
        {
          planeX: 28,
          planeZ: -280,
          planeY: 62.0,
          roll: 0.38, // Tilt right
          yaw: -0.22,
          pitch: 0.08,
          camX: -15,
          camY: 52,
          camZ: -210,
          lookX: 28,
          lookY: 58,
          lookZ: -280,
          duration: 2.4,
          ease: "power1.inOut",
          onStart: () => {
            if (phaseLabelRef.current) {
              phaseLabelRef.current.innerText =
                "CANYON SLALOM // BANKING RIGHT (35°)";
            }
          },
        },
        "tiltRight",
      );

      // ---------------------------------------------------------------------
      // PHASE 5: MID-SKY TILT LEFT (Counter-bank left over the ridge)
      // ---------------------------------------------------------------------
      tl.to(
        t,
        {
          planeX: -36,
          planeZ: -360,
          planeY: 82.0,
          roll: -0.42, // Tilt left
          yaw: 0.28,
          pitch: 0.06,
          camX: 35,
          camY: 68,
          camZ: -270,
          lookX: -36,
          lookY: 76,
          lookZ: -360,
          duration: 2.6,
          ease: "power1.inOut",
          onStart: () => {
            if (phaseLabelRef.current) {
              phaseLabelRef.current.innerText =
                "RIDGE TRAVERSAL // BANKING LEFT (40°)";
            }
          },
        },
        "tiltLeft",
      );

      // ---------------------------------------------------------------------
      // PHASE 6: LEVEL OFF & TEARDROP TRAFFIC PATTERN TURN
      // ---------------------------------------------------------------------
      tl.to(
        t,
        {
          planeX: -55,
          planeZ: -280,
          planeY: 68.0,
          roll: -0.18,
          yaw: 0.45,
          pitch: 0.02,
          camX: 25,
          camY: 62,
          camZ: -210,
          lookX: -55,
          lookY: 64,
          lookZ: -280,
          duration: 2.4,
          ease: "power1.inOut",
          onStart: () => {
            if (phaseLabelRef.current) {
              phaseLabelRef.current.innerText = "DOWNWIND ENTRY // LEVEL FL070";
            }
          },
        },
        "downwind",
      );

      // ---------------------------------------------------------------------
      // PHASE 7: BASE LEG & GLIDESLOPE INTERCEPT
      // ---------------------------------------------------------------------
      tl.to(
        t,
        {
          planeX: -15,
          planeZ: -120,
          planeY: 42.0,
          roll: 0.16,
          yaw: -0.15,
          pitch: -0.05,
          camX: 18,
          camY: 36,
          camZ: -60,
          lookX: -10,
          lookY: 36,
          lookZ: -150,
          duration: 2.4,
          ease: "power1.inOut",
          onStart: () => {
            if (phaseLabelRef.current) {
              phaseLabelRef.current.innerText =
                "TURNING BASE // GLIDESLOPE INTERCEPT";
            }
          },
        },
        "base",
      );

      // ---------------------------------------------------------------------
      // PHASE 8: SHORT FINAL (Wings level, stabilized glide path)
      // ---------------------------------------------------------------------
      tl.to(
        t,
        {
          planeX: 0,
          planeZ: 25,
          planeY: 9.5,
          roll: 0, // Level wings
          yaw: 0,
          pitch: 0.04,
          camX: 0,
          camY: 13.5,
          camZ: 68,
          lookX: 0,
          lookY: 5.5,
          lookZ: -20,
          fov: 42,
          duration: 2.5,
          ease: "power1.out",
          onStart: () => {
            if (phaseLabelRef.current) {
              phaseLabelRef.current.innerText =
                "ESTABLISHED SHORT FINAL // GEAR DOWN";
            }
          },
        },
        "final",
      );

      // ---------------------------------------------------------------------
      // PHASE 9: FLARE & TOUCHDOWN (Wheels touch down on tarmac)
      // ---------------------------------------------------------------------
      tl.to(
        t,
        {
          planeX: 0,
          planeZ: -45,
          planeY: 0, // Touchdown level on wheels
          roll: 0,
          yaw: 0,
          pitch: 0.08, // Aerodynamic flare
          camX: 0,
          camY: 4.6,
          camZ: -10,
          lookX: 0,
          lookY: 2.0,
          lookZ: -70,
          fov: 44,
          duration: 1.8,
          ease: "power2.inOut",
          onStart: () => {
            if (phaseLabelRef.current) {
              phaseLabelRef.current.innerText =
                "TOUCHDOWN // WHEELS CONTACT RUNWAY";
            }
          },
        },
        "touchdown",
      );

      // ---------------------------------------------------------------------
      // PHASE 10: ROLLOUT & BRAKING (Reverse thrust, nose settled)
      // ---------------------------------------------------------------------
      tl.to(
        t,
        {
          planeX: 0,
          planeZ: -115,
          planeY: 0,
          roll: 0,
          yaw: 0,
          pitch: 0,
          camX: 0,
          camY: 4.4,
          camZ: -82,
          lookX: 0,
          lookY: 2.2,
          lookZ: -135,
          fov: 42,
          duration: 2.2,
          ease: "power3.out",
          onStart: () => {
            if (phaseLabelRef.current) {
              phaseLabelRef.current.innerText =
                "REVERSE THRUST // ROLLOUT COMPLETE";
            }
          },
        },
        "rollout",
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-slate-950 text-white font-sans selection:bg-amber-400 selection:text-black"
    >
      <div
        ref={canvasWrapperRef}
        className="relative h-screen w-full overflow-hidden"
      >
        <Canvas
          shadows
          dpr={[1, 2]}
          frameloop="always"
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.35,
          }}
          camera={{ position: [0, 4.6, 104], fov: 42, near: 0.5, far: 1800 }}
          className="h-full w-full"
        >
          {/* Depth Fog */}
          <fog attach="fog" args={["#1e293b", 320, 1400]} />

          {/* Ambient Lighting */}
          <ambientLight intensity={1.3} color="#fed7aa" />

          {/* Golden Key Sun Light */}
          <directionalLight
            position={[120, 80, 50]}
            intensity={4.5}
            color="#ffedd5"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
          />

          {/* Cool Mountain Valley Fill Light */}
          <directionalLight
            position={[-100, 60, -40]}
            intensity={1.8}
            color="#93c5fd"
          />

          <Suspense
            fallback={
              <Html center>
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-amber-500/40 bg-slate-900/90 text-xs font-mono text-amber-200 backdrop-blur-md">
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  LOADING ALPINE FLIGHT CORRIDOR...
                </div>
              </Html>
            }
          >
            <TakeoffScene timelineRefs={timelineRefs} />
          </Suspense>
        </Canvas>

        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-mono font-semibold tracking-wider text-slate-100 drop-shadow">
              RUNWAY 08 // ALPINE DEPARTURE & ARRIVAL
            </span>
          </div>

          <div
            ref={phaseLabelRef}
            className="font-mono text-[11px] sm:text-xs text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 bg-slate-950/80 backdrop-blur-md tracking-wider shadow-lg"
          >
            HOLDING SHORT // CLEARED FOR TAKEOFF
          </div>
        </header>

        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-slate-950/80 backdrop-blur-md text-xs font-mono text-amber-200/90 shadow-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Scroll to pilot departure, mid-air banking & landing
          </div>
        </div>
      </div>

      <div className="pointer-events-none h-full w-full" />
    </div>
  );
}
