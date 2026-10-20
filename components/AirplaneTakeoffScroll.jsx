"use client";

import React, {
  Suspense,
  useRef,
  useEffect,
  useMemo,
  useState,
  useLayoutEffect,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  Html,
  Sky,
  Clouds,
  Cloud,
  PerformanceMonitor,
} from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // Stops the mobile address bar from resizing/jumping the pinned scene
  ScrollTrigger.config({ ignoreMobileResize: true });
}

const AIRPLANE_MODEL_PATH = "/models/airplanetakeoff.glb";
if (typeof window !== "undefined") useGLTF.preload(AIRPLANE_MODEL_PATH);

const { clamp, lerp, damp, smoothstep } = THREE.MathUtils;
const Y_AXIS = new THREE.Vector3(0, 1, 0);

// Critically damped spring: eases in AND out, so motion never starts or stops
// abruptly (exponential damp() only eases out). `vel` is a {v} holder.
function smoothDamp(cur, target, vel, smoothTime, dt) {
  const omega = 2 / Math.max(smoothTime, 0.0001);
  const x = omega * dt;
  const e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = cur - target;
  const temp = (vel.v + omega * change) * dt;
  vel.v = (vel.v - omega * temp) * e;
  let out = target + (change + temp) * e;
  if (target - cur > 0 === out > target) {
    out = target;
    vel.v = 0;
  }
  return out;
}

// ---------------------------------------------------------------------------
// 1. FLIGHT PATH
//    One continuous spline for the whole flight (takeoff -> climb -> banks ->
//    U-turn -> glideslope -> landing). Heading, pitch and bank are derived
//    from the curve, so every phase blends into the next with no snapping.
// ---------------------------------------------------------------------------
const WAYPOINTS = [
  { p: [0, 0, 95], label: "HOLDING SHORT // CLEARED FOR TAKEOFF" },
  { p: [0, 0, 30], label: "TAKEOFF ROLL // ACCELERATING" },
  { p: [0, 0, -70] },
  { p: [0, 0.6, -160], label: "ROTATION (Vr) // LIFTOFF" },
  { p: [0, 14, -230], label: "VALLEY CLIMB" },
  { p: [4, 34, -300] },
  { p: [26, 52, -370], label: "CANYON SLALOM // BANKING RIGHT" },
  { p: [30, 64, -440] },
  { p: [6, 76, -500], label: "RIDGE TRAVERSAL // BANKING LEFT" },
  { p: [-40, 84, -550] },
  { p: [-66, 82, -490], label: "PROCEDURE TURN // DOWNWIND" },
  { p: [-52, 70, -400] },
  { p: [-28, 54, -320], label: "BASE LEG // GLIDESLOPE INTERCEPT" },
  { p: [-6, 38, -250] },
  { p: [0, 24, -190], label: "SHORT FINAL // GEAR DOWN" },
  { p: [0, 13, -130] },
  { p: [0, 5.5, -70] },
  { p: [0, 1.2, -28], label: "FLARE" },
  { p: [0, 0, 0], label: "TOUCHDOWN // WHEELS CONTACT RUNWAY" },
  { p: [0, 0, 60], label: "REVERSE THRUST // ROLLOUT" },
  { p: [0, 0, 130] },
];

const N = 900;

function blur(arr, radius, passes) {
  let src = arr;
  let dst = new Float32Array(arr.length);
  for (let p = 0; p < passes; p++) {
    for (let i = 0; i < src.length; i++) {
      let sum = 0;
      let c = 0;
      for (let j = -radius; j <= radius; j++) {
        const k = i + j;
        if (k >= 0 && k < src.length) {
          sum += src[k];
          c++;
        }
      }
      dst[i] = sum / c;
    }
    [src, dst] = [dst, src];
  }
  return src;
}

function buildFlightPath() {
  const curve = new THREE.CatmullRomCurve3(
    WAYPOINTS.map((w) => new THREE.Vector3(...w.p)),
    false,
    "centripetal",
  );
  const pts = curve.getSpacedPoints(N);
  pts.forEach((v) => (v.y = Math.max(0, v.y)));
  const ds = curve.getLength() / N;

  const px = new Float32Array(N + 1);
  const py = new Float32Array(N + 1);
  const pz = new Float32Array(N + 1);
  const yawRaw = new Float32Array(N + 1);
  const pitchRaw = new Float32Array(N + 1);

  let prevYaw = 0;
  for (let i = 0; i <= N; i++) {
    const a = pts[Math.max(i - 1, 0)];
    const b = pts[Math.min(i + 1, N)];
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const tz = b.z - a.z;
    const l = Math.hypot(tx, ty, tz) || 1;

    // Heading: yaw 0 faces -Z. Unwrap so the 180° turn never snaps.
    let yaw = Math.atan2(-tx, -tz);
    yaw += Math.round((prevYaw - yaw) / (Math.PI * 2)) * Math.PI * 2;
    prevYaw = yaw;

    px[i] = pts[i].x;
    py[i] = pts[i].y;
    pz[i] = pts[i].z;
    yawRaw[i] = yaw;
    // Flight-path angle + a little nose-up attitude once airborne
    pitchRaw[i] =
      Math.asin(clamp(ty / l, -1, 1)) + 0.05 * smoothstep(pts[i].y, 0.3, 3);
  }

  // Bank angle from turn rate: tighter turn -> steeper bank
  const rollRaw = new Float32Array(N + 1);
  for (let i = 0; i <= N; i++) {
    const i0 = Math.max(i - 1, 0);
    const i1 = Math.min(i + 1, N);
    const turnRate = (yawRaw[i1] - yawRaw[i0]) / (ds * (i1 - i0));
    rollRaw[i] = clamp(turnRate * 28, -0.72, 0.72);
  }

  const yaw = yawRaw;
  const pitch = blur(pitchRaw, 5, 2);
  const roll = blur(rollRaw, 12, 3);

  // Map HUD labels to arc-length positions
  const stops = WAYPOINTS.filter((w) => w.label)
    .map((w) => {
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i <= N; i++) {
        const d = Math.hypot(
          px[i] - w.p[0],
          py[i] - w.p[1],
          pz[i] - w.p[2],
        );
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return { u: best / N, label: w.label };
    })
    .sort((a, b) => a.u - b.u);

  return { px, py, pz, yaw, pitch, roll, stops };
}

const FLIGHT = buildFlightPath();

function sampleFlight(u, out) {
  const f = clamp(u, 0, 1) * N;
  const i = Math.min(Math.floor(f), N - 1);
  const k = f - i;
  out.x = lerp(FLIGHT.px[i], FLIGHT.px[i + 1], k);
  out.y = lerp(FLIGHT.py[i], FLIGHT.py[i + 1], k);
  out.z = lerp(FLIGHT.pz[i], FLIGHT.pz[i + 1], k);
  out.yaw = lerp(FLIGHT.yaw[i], FLIGHT.yaw[i + 1], k);
  out.pitch = lerp(FLIGHT.pitch[i], FLIGHT.pitch[i + 1], k);
  out.roll = lerp(FLIGHT.roll[i], FLIGHT.roll[i + 1], k);
  return out;
}

function labelAt(u) {
  let label = FLIGHT.stops[0].label;
  for (const s of FLIGHT.stops) if (u >= s.u) label = s.label;
  return label;
}

// Trapezoid speed profile: smooth acceleration, steady flight, smooth braking.
const ACC_END = 0.1;
const DEC_START = 0.9;
const PEAK = 2 / (1 + DEC_START - ACC_END);
function scrollToPath(p) {
  if (p <= ACC_END) return (PEAK * p * p) / (2 * ACC_END);
  if (p >= DEC_START)
    return 1 - (PEAK * (1 - p) * (1 - p)) / (2 * (1 - DEC_START));
  return (PEAK * ACC_END) / 2 + PEAK * (p - ACC_END);
}
const speedFactor = (p) =>
  p < ACC_END ? p / ACC_END : p > DEC_START ? (1 - p) / (1 - DEC_START) : 1;

// Chase-camera offsets (x right, y up, z behind) in the plane's own frame.
// Evenly spaced over the flight; passes behind, beside and in front of it.
const CAM_OFFSETS = new THREE.CatmullRomCurve3(
  [
    [0, 4.6, 24],
    [-8, 5.5, 20],
    [12, 8, 22],
    [-18, 11, 26],
    [24, 11, 22],
    [-22, 13, 26],
    [18, 16, 42],
    [-20, 12, 34],
    [20, 12, 28],
    [-18, 9, 22],
    [-24, 6, -4],
    [-12, 4.5, -28],
    [10, 4, -24],
    [20, 3.5, 8],
    [0, 3.4, 26],
  ].map((v) => new THREE.Vector3(...v)),
);

// ---------------------------------------------------------------------------
// 2. SKY & CLOUDS
// ---------------------------------------------------------------------------
function SkyAndAtmosphere({ low }) {
  const cloudRef = useRef();

  useFrame(({ clock }) => {
    // Gentle drift, no teleporting
    if (cloudRef.current)
      cloudRef.current.position.z = -80 + Math.sin(clock.elapsedTime * 0.04) * 45;
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
      <mesh position={[240, 42, -500]}>
        <sphereGeometry args={[30, 24, 24]} />
        <meshBasicMaterial color="#fed7aa" fog={false} />
      </mesh>
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

      <group ref={cloudRef} position={[0, 58, -80]}>
        <Clouds material={THREE.MeshLambertMaterial} limit={low ? 80 : 200}>
          <Cloud
            position={[0, 10, 0]}
            segments={low ? 10 : 24}
            bounds={[130, 18, 140]}
            volume={low ? 18 : 28}
            color="#fed7aa"
            opacity={0.32}
          />
          {!low && (
            <>
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
            </>
          )}
        </Clouds>
      </group>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3. MOUNTAINS (lower mesh density on weak devices)
// ---------------------------------------------------------------------------
function buildMountain(side, segW, segD) {
  const width = 450;
  const depth = 1200;
  const geom = new THREE.PlaneGeometry(width, depth, segW, segD);
  geom.rotateX(-Math.PI / 2);

  const pos = geom.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const valley = new THREE.Color("#1e293b");
  const rock = new THREE.Color("#475569");
  const lit = new THREE.Color("#78716c");
  const snow = new THREE.Color("#f8fafc");
  const c = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const u = (x + width / 2) / width;
    const d = side === 1 ? u : 1 - u;
    const slope = Math.pow(d, 1.4) * 110;
    const n =
      Math.sin(x * 0.015 + z * 0.008) * 26 +
      Math.cos(x * 0.035 - z * 0.02) * 14 +
      Math.sin((x + z) * 0.06) * 6 +
      Math.cos(x * 0.1) * 2.5;
    const h = Math.max((slope + n) * d, 0.2);
    pos.setY(i, h);

    if (h < 25) c.copy(valley).lerp(rock, h / 25);
    else if (h < 65) c.copy(rock).lerp(lit, (h - 25) / 40);
    else c.copy(lit).lerp(snow, Math.min((h - 65) / 35, 1));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geom.computeVertexNormals();
  return geom;
}

function MountainRanges({ low }) {
  const [segW, segD] = low ? [40, 55] : [80, 100];
  const left = useMemo(() => buildMountain(-1, segW, segD), [segW, segD]);
  const right = useMemo(() => buildMountain(1, segW, segD), [segW, segD]);

  return (
    <group>
      {[
        [left, -260],
        [right, 260],
      ].map(([geometry, x], i) => (
        <mesh key={i} geometry={geometry} position={[x, 0, -260]}>
          <meshStandardMaterial
            vertexColors
            roughness={0.82}
            metalness={0.12}
          />
        </mesh>
      ))}
      {[-320, 0, 320].map((x, i) => (
        <mesh key={i} position={[x, 15, -780]}>
          <coneGeometry args={[260, 140, low ? 10 : 16]} />
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
// 4. RUNWAY (repeated lights/markings are instanced = a handful of draw calls)
// ---------------------------------------------------------------------------
function Instanced({ positions, children }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    positions.forEach((p, i) => {
      o.position.set(p[0], p[1], p[2]);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [positions]);
  return (
    <instancedMesh
      ref={ref}
      args={[null, null, positions.length]}
      frustumCulled={false}
    >
      {children}
    </instancedMesh>
  );
}

function Runway() {
  const edgeLights = useMemo(() => {
    const a = [];
    for (let i = 0; i < 50; i++) {
      const z = 130 - i * 16;
      a.push([-14.2, 0.25, z], [14.2, 0.25, z]);
    }
    return a;
  }, []);
  const dashes = useMemo(
    () => Array.from({ length: 60 }, (_, i) => [0, 0.02, 125 - i * 15]),
    [],
  );
  const keys = useMemo(
    () => [-9, -6.5, -4, -1.5, 1.5, 4, 6.5, 9].map((x) => [x, 0.02, 132]),
    [],
  );
  const greens = useMemo(
    () => [-12, -8, -4, 0, 4, 8, 12].map((x) => [x, 0.25, 142]),
    [],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -220]}>
        <planeGeometry args={[28, 920]} />
        <meshStandardMaterial color="#080c14" roughness={0.94} metalness={0.12} />
      </mesh>

      {[-16.5, 16.5].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.015, -220]}>
          <planeGeometry args={[5, 920]} />
          <meshStandardMaterial color="#1e293b" roughness={1} />
        </mesh>
      ))}
      {[-13.5, 13.5].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.015, -220]}>
          <planeGeometry args={[0.5, 920]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
      ))}

      <Instanced positions={dashes}>
        <boxGeometry args={[0.85, 0.02, 9]} />
        <meshStandardMaterial
          color="#facc15"
          roughness={0.25}
          emissive="#ca8a04"
          emissiveIntensity={0.35}
        />
      </Instanced>

      <Instanced positions={keys}>
        <boxGeometry args={[1.2, 0.02, 20]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </Instanced>

      <Instanced positions={edgeLights}>
        <boxGeometry args={[0.18, 0.45, 0.18]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={2.8}
          toneMapped={false}
        />
      </Instanced>

      <Instanced positions={greens}>
        <sphereGeometry args={[0.2, 10, 10]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={4.2}
          toneMapped={false}
        />
      </Instanced>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[2400, 2400]} />
        <meshStandardMaterial color="#020617" roughness={1} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 5. AIRPLANE + SHADOW + CHASE CAMERA (single rig, driven by scroll progress)
// ---------------------------------------------------------------------------
const PLANE_LENGTH = 11.2;

function makeShadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const blob = (cx, cy, rx, ry) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, "rgba(0,0,0,0.9)");
    g.addColorStop(0.6, "rgba(0,0,0,0.5)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  blob(128, 128, 14, 112); // fuselage
  blob(128, 118, 118, 20); // wings
  blob(128, 212, 44, 12); // tailplane
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Flight({ progressRef, hud, reduced, smoothTime }) {
  const { scene } = useGLTF(AIRPLANE_MODEL_PATH);
  const planeRef = useRef();
  const shadowRef = useRef();
  const shadowMatRef = useRef();

  const model = useMemo(() => {
    const m = scene.clone(true);
    const box = new THREE.Box3().setFromObject(m);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const k = PLANE_LENGTH / (Math.max(size.x, size.y, size.z) || 1);
    m.position.set(-center.x * k, -box.min.y * k, -center.z * k);
    m.scale.setScalar(k);
    m.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material.roughness = 0.22;
        o.material.metalness = 0.65;
        o.material.needsUpdate = true;
      }
    });
    return m;
  }, [scene]);

  const shadowTex = useMemo(() => makeShadowTexture(), []);

  const st = useMemo(
    () => ({
      p: 0,
      s: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0 },
      off: new THREE.Vector3(),
      look: new THREE.Vector3(0, 2, 90),
      camYaw: 0,
      v: { p: { v: 0 }, cx: { v: 0 }, cy: { v: 0 }, cz: { v: 0 }, lx: { v: 0 }, ly: { v: 0 }, lz: { v: 0 }, yaw: { v: 0 } },
      fov: 42,
      lastFov: 0,
      init: false,
    }),
    [],
  );

  useFrame(({ camera, size, clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05); // tab-switch spikes never cause jumps
    const S = st.s;

    // Smooth the raw scroll value once, here, instead of stacking scrub + damp
    st.p = smoothDamp(st.p, progressRef.current, st.v.p, reduced ? 0.08 : smoothTime, dt);
    const u = scrollToPath(st.p);
    sampleFlight(u, S);

    // --- airplane -------------------------------------------------------
    const t = clock.elapsedTime;
    const air = smoothstep(S.y, 0.5, 6);
    const calm = reduced ? 0 : air;
    const roll = S.roll + (Math.sin(t * 1.7) * 0.012 + Math.sin(t * 4.3) * 0.005) * calm;
    const pitch = S.pitch + (Math.sin(t * 1.3 + 1) * 0.006 + Math.sin(t * 3.7) * 0.003) * calm;
    if (planeRef.current) {
      planeRef.current.position.set(S.x, S.y, S.z);
      planeRef.current.rotation.set(pitch, S.yaw, roll, "YXZ");
    }

    // --- ground shadow --------------------------------------------------
    if (shadowRef.current && shadowMatRef.current) {
      const alt = S.y;
      const sc = lerp(1, 3.2, Math.min(alt / 70, 1));
      const op = lerp(0.8, 0, Math.min(alt / 55, 1));
      shadowRef.current.visible = op > 0.01;
      shadowRef.current.position.set(S.x - alt * 0.18, 0.04, S.z + alt * 0.12);
      shadowRef.current.rotation.y = S.yaw;
      shadowRef.current.scale.set(sc, 1, sc);
      shadowMatRef.current.opacity = op;
    }

    // --- chase camera ---------------------------------------------------
    const aspect = size.width / size.height;
    // Pull back on tall/narrow screens so the plane always fits the frame
    const dist = Math.pow(clamp(1.5 / aspect, 1, 2.2), 0.7);
    st.camYaw = smoothDamp(st.camYaw, S.yaw, st.v.yaw, 0.6, dt);
    CAM_OFFSETS.getPoint(u, st.off);
    st.off.multiplyScalar(dist).applyAxisAngle(Y_AXIS, st.camYaw);

    const tx = S.x + st.off.x;
    const ty = Math.max(S.y + st.off.y, 2.2);
    const tz = S.z + st.off.z;
    const tCam = reduced ? 0.08 : 0.35;
    const tLook = reduced ? 0.05 : 0.16;

    if (!st.init) {
      camera.position.set(tx, ty, tz);
      st.look.set(S.x, S.y + 1.6, S.z);
      st.init = true;
    } else {
      camera.position.x = smoothDamp(camera.position.x, tx, st.v.cx, tCam, dt);
      camera.position.y = smoothDamp(camera.position.y, ty, st.v.cy, tCam, dt);
      camera.position.z = smoothDamp(camera.position.z, tz, st.v.cz, tCam, dt);
      st.look.x = smoothDamp(st.look.x, S.x, st.v.lx, tLook, dt);
      st.look.y = smoothDamp(st.look.y, S.y + 1.6, st.v.ly, tLook, dt);
      st.look.z = smoothDamp(st.look.z, S.z, st.v.lz, tLook, dt);
    }
    camera.lookAt(st.look);

    const targetFov = 42 + 3 * Math.sin(Math.PI * u) + (aspect < 1 ? 5 : 0);
    st.fov = damp(st.fov, targetFov, 4, dt);
    if (Math.abs(st.fov - st.lastFov) > 0.01) {
      camera.fov = st.fov;
      camera.updateProjectionMatrix();
      st.lastFov = st.fov;
    }

    // --- HUD (direct DOM writes: zero React re-renders) -------------------
    const h = hud.current;
    const label = labelAt(u);
    if (h.label && h.lastLabel !== label) {
      h.label.textContent = label;
      h.lastLabel = label;
    }
    const kts = Math.round(speedFactor(st.p) * 160);
    if (h.speed && h.lastSpeed !== kts) {
      h.speed.textContent = `${kts} KTS`;
      h.lastSpeed = kts;
    }
    const ft = Math.round((S.y * 12) / 10) * 10;
    if (h.alt && h.lastAlt !== ft) {
      h.alt.textContent = `${ft} FT`;
      h.lastAlt = ft;
    }
    if (h.bar) h.bar.style.transform = `scaleX(${st.p})`;
    if (h.hint) h.hint.style.opacity = st.p > 0.02 ? "0" : "1";
  });

  return (
    <>
      <group ref={planeRef} position={[0, 0, 95]}>
        <primitive object={model} />
      </group>

      <group ref={shadowRef} position={[0, 0.04, 95]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
          <planeGeometry args={[PLANE_LENGTH * 1.5, PLANE_LENGTH * 1.5]} />
          <meshBasicMaterial
            ref={shadowMatRef}
            map={shadowTex}
            transparent
            opacity={0.8}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-2}
          />
        </mesh>
      </group>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6. MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function AirplaneTakeoffScroll() {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const progressRef = useRef(0);
  const hud = useRef({
    label: null,
    speed: null,
    alt: null,
    bar: null,
    hint: null,
    lastLabel: "",
    lastSpeed: -1,
    lastAlt: -1,
  });

  const [env, setEnv] = useState(null);
  const [maxDpr, setMaxDpr] = useState(1.5);

  // Detect device capability once on the client
  useEffect(() => {
    const mobile =
      window.matchMedia("(max-width: 768px)").matches ||
      window.matchMedia("(pointer: coarse)").matches;
    const weakCpu = (navigator.hardwareConcurrency || 4) <= 4;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const low = mobile || weakCpu;
    setMaxDpr(low ? 1.5 : 2);
    setEnv({ low, mobile, reduced });
  }, []);

  // Scroll -> progress (0..1). Pin the canvas for the length of the flight.
  useEffect(() => {
    if (!env) return;
    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: () => `+=${Math.round(window.innerHeight * (env.mobile ? 8 : 11))}`,
      pin: wrapperRef.current,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });
    progressRef.current = trigger.progress;

    return () => trigger.kill();
  }, [env]);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-slate-950 text-white font-sans selection:bg-amber-400 selection:text-black"
    >
      <div
        ref={wrapperRef}
        className="relative w-full overflow-hidden"
        style={{ height: "100svh" }}
      >
        {env && (
          <Canvas
            dpr={[1, maxDpr]}
            frameloop="always"
            gl={{
              antialias: !env.low,
              powerPreference: "high-performance",
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.35,
            }}
            camera={{ position: [0, 4.6, 119], fov: 42, near: 0.5, far: 1800 }}
            className="h-full w-full"
          >
            {/* Drops resolution automatically if the GPU can't keep up */}
            <PerformanceMonitor
              flipflops={2}
              onDecline={() => setMaxDpr(1)}
            />

            <fog attach="fog" args={["#1e293b", 320, 1400]} />
            <ambientLight intensity={1.3} color="#fed7aa" />
            <directionalLight position={[120, 80, 50]} intensity={4.5} color="#ffedd5" />
            <directionalLight position={[-100, 60, -40]} intensity={1.8} color="#93c5fd" />

            <Suspense
              fallback={
                <Html center>
                  <div className="flex items-center gap-2.5 whitespace-nowrap px-4 py-2 rounded-full border border-amber-500/40 bg-slate-900/90 text-xs font-mono text-amber-200 backdrop-blur-md">
                    <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    LOADING ALPINE FLIGHT CORRIDOR...
                  </div>
                </Html>
              }
            >
              <SkyAndAtmosphere low={env.low} />
              <MountainRanges low={env.low} />
              <Runway />
              <Flight
                progressRef={progressRef}
                hud={hud}
                reduced={env.reduced}
                smoothTime={0.42}
              />
            </Suspense>
          </Canvas>
        )}

        {/* HUD */}
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate text-[11px] sm:text-sm font-mono font-semibold tracking-wider text-slate-100 drop-shadow">
              RUNWAY 08 // ALPINE DEPARTURE &amp; ARRIVAL
            </span>
          </div>
          <div
            ref={(el) => (hud.current.label = el)}
            className="self-start max-w-full truncate font-mono text-[10px] sm:text-xs text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 bg-slate-950/80 backdrop-blur-md tracking-wider shadow-lg"
          >
            HOLDING SHORT // CLEARED FOR TAKEOFF
          </div>
        </header>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-4"
          style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        >
          <div
            ref={(el) => (hud.current.hint = el)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-slate-950/80 backdrop-blur-md text-[11px] sm:text-xs font-mono text-amber-200/90 shadow-xl transition-opacity duration-500"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Scroll to fly: takeoff, banking, landing
          </div>

          <div className="flex w-full max-w-md items-center gap-3 font-mono text-[10px] sm:text-xs text-slate-200">
            <span ref={(el) => (hud.current.speed = el)} className="w-16 text-right tabular-nums">
              0 KTS
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                ref={(el) => (hud.current.bar = el)}
                className="h-full w-full origin-left bg-amber-400"
                style={{ transform: "scaleX(0)" }}
              />
            </div>
            <span ref={(el) => (hud.current.alt = el)} className="w-16 tabular-nums">
              0 FT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}