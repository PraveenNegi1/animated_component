'use client';

import { memo, useEffect, useRef, useState } from 'react';

/**
 * TileRing
 * Tiles sit on a circle: small on the left, large at the lower right.
 * The ring turns clockwise one slot every 3 seconds and also follows scroll.
 *
 * Usage (app/page.jsx):
 *   import TileRing from '@/components/TileRing';
 *   export default function Page() { return <TileRing />; }
 *
 * Photos: put files in /public/images/ and reference them as '/images/photo-1.jpg'.
 * Every tile has:
 *   img   - photo path or URL
 *   label - title (shown on the tile and in the centre caption)
 *   text  - short description (shown on the tile and in the centre caption)
 * Text inside tiles uses cqw units, so it scales with each tile.
 */

/* ------------------------------------------------------------------ */
/* Tiles: 14 travel scenes. Copy the images folder to /public/images/ (photo-1.svg ... photo-14.svg) */
/* (or change the `img` paths / use full URLs). Edit label + text freely.            */
/* ------------------------------------------------------------------ */

const TILES = [
  {
    id: 'photo-1',
    label: 'Himalayan Sunrise',
    text: 'First light on the high ridges.',
    img: '/photo-1.svg',
  },
  {
    id: 'photo-2',
    label: 'Palm Beach Sunset',
    text: 'Warm sand and a slow tide.',
    img: '/photo-2.svg',
  },
  {
    id: 'photo-3',
    label: 'Desert Caravan',
    text: 'Dunes, heat, and long shadows.',
    img: '/photo-3.svg',
  },
  {
    id: 'photo-4',
    label: 'Alpine Lake',
    text: 'Still water below the peaks.',
    img: '/photo-4.svg',
  },
  {
    id: 'photo-5',
    label: 'Island Escape',
    text: 'Turquoise water, nobody around.',
    img: '/photo-5.svg',
  },
  {
    id: 'photo-6',
    label: 'City After Dark',
    text: 'Neon windows and a late moon.',
    img: '/photo-6.svg',
  },
  {
    id: 'photo-7',
    label: 'Balloon Valley',
    text: 'Dawn flights over green hills.',
    img: '/photo-7.svg',
  },
  {
    id: 'photo-8',
    label: 'Coastal Lighthouse',
    text: 'A beam over the evening sea.',
    img: '/photo-8.svg',
  },
  {
    id: 'photo-9',
    label: 'Cherry Blossom Temple',
    text: 'Spring in old Kyoto.',
    img: '/photo-9.svg',
  },
  {
    id: 'photo-10',
    label: 'Northern Lights',
    text: 'Green skies over snowy pines.',
    img: '/photo-10.svg',
  },
  {
    id: 'photo-11',
    label: 'Mountain Railway',
    text: 'A scenic ride through the hills.',
    img: '/photo-11.svg',
  },
  {
    id: 'photo-12',
    label: 'Harbour Sails',
    text: 'Light wind, bright sails.',
    img: '/photo-12.svg',
  },
  {
    id: 'photo-13',
    label: 'Starlit Camp',
    text: 'A tent, a fire, a clear sky.',
    img: '/photo-13.svg',
  },
  {
    id: 'photo-14',
    label: 'Whitewashed Village',
    text: 'Blue domes above the Aegean.',
    img: '/photo-14.svg',
  },
];


const COUNT = TILES.length;
const STEP = 360 / COUNT; // degrees per tick
const SECONDS_PER_TILE = 3; // one tile slot every 3 seconds, as a constant glide
const AUTO_SPEED = STEP / SECONDS_PER_TILE; // degrees per second
const DEG_PER_VIEWPORT = 110; // scroll: degrees of rotation per viewport of scroll
const START = 196; // angle of tile 0 (0 = 3 o'clock, grows clockwise)
const PEAK = 42; // angle where tiles are largest (lower right)
const MIN_SCALE = 0.06;
const TILE_RATIO = 0.56; // tile size relative to ring radius
const OMEGA = 6; // scroll spring: higher = snappier, lower = softer
const MAX_RADIUS = 760;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const scaleAt = (deg) => {
  const k = (1 + Math.cos(((deg - PEAK) * Math.PI) / 180)) / 2;
  return MIN_SCALE + (1 - MIN_SCALE) * Math.pow(k, 1.8);
};

// Bounding box of the whole ring (in units of radius). It does not depend on
// rotation because tile size only depends on angle, so it is computed once.
const ENV = (() => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let d = 0; d < 360; d += 2) {
    const r = (d * Math.PI) / 180;
    const half = (TILE_RATIO * scaleAt(d)) / 2;
    minX = Math.min(minX, Math.cos(r) - half);
    maxX = Math.max(maxX, Math.cos(r) + half);
    minY = Math.min(minY, Math.sin(r) - half);
    maxY = Math.max(maxY, Math.sin(r) + half);
  }
  return { minX, maxX, minY, maxY };
})();

/** Works out ring radius and centre so it suits any screen shape. */
function computeGeo(w, h) {
  const pad = clamp(Math.min(w, h) * 0.035, 12, 40);
  const wRel = ENV.maxX - ENV.minX;
  const hRel = ENV.maxY - ENV.minY;
  const tall = h / w > 1.1; // phones and tablets held upright

  let R;
  let cx;
  const cyRel = (ENV.minY + ENV.maxY) / 2;

  if (tall) {
    // big tiles stay on screen, the small left side bleeds off the edge
    R = Math.min(w * 0.6, (h - 2 * pad) / hRel, MAX_RADIUS);
    cx = w - pad - ENV.maxX * R;
  } else {
    // whole ring visible and centred
    R = Math.min((w - 2 * pad) / wRel, (h - 2 * pad) / hRel, MAX_RADIUS);
    cx = w / 2 - ((ENV.minX + ENV.maxX) / 2) * R;
  }
  const cy = h / 2 - cyRel * R;

  // free space inside the ring, used for the centre caption
  const left = Math.max(pad, cx - R * 0.7);
  const right = cx + R * 0.62;

  return {
    R,
    cx,
    cy,
    base: R * TILE_RATIO,
    labelX: (left + right) / 2,
    labelW: Math.max(0, right - left),
  };
}

/* ------------------------------------------------------------------ */
/* Tile layer (memoised so the 3-second label change never re-renders) */
/* ------------------------------------------------------------------ */

const TileLayer = memo(function TileLayer({ refs }) {
  return (
    <>
      {TILES.map((tile, i) => (
        <div
          key={tile.id}
          ref={(el) => (refs.current[i] = el)}
          className="absolute left-0 top-0 opacity-0 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.38)] will-change-transform"
          style={{ transformOrigin: 'center center' }}
        >
          <div className="relative h-full w-full overflow-hidden bg-neutral-300" style={{ containerType: 'size' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tile.img}
              alt={tile.label}
              draggable={false}
              decoding="async"
              className="h-full w-full object-cover"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />

            {/* caption: title + short text, scales with the tile */}
            {tile.text && (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                style={{ padding: '18cqw 6cqw 6cqw' }}
              >
                <p className="font-serif leading-tight text-white" style={{ fontSize: '8.5cqw' }}>
                  {tile.label}
                </p>
                <p
                  className="font-sans leading-snug text-white/80"
                  style={{ fontSize: '5cqw', marginTop: '1.5cqw' }}
                >
                  {tile.text}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
});

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function TileRing() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const tileRefs = useRef([]);
  const orbitRef = useRef(null);
  const hintRef = useRef(null);
  const labelRef = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tiles = tileRefs.current;

    let w = 0;
    let h = 0;
    let geo = null;
    let raf = 0;
    let running = false;
    let visible = true;
    let last = 0;

    let auto = 0; // constant clockwise glide, never stops
    let sp = reduce ? 0 : -50; // smoothed scroll offset (starts swept back for the intro)
    let vel = 0;
    let pos = 0; // auto + sp
    let scrollDeg = 0; // raw scroll target
    let activeIdx = 0;

    const paint = () => {
      if (!geo) return;
      const { cx, cy, R, base } = geo;
      let best = 0;
      let bestDiff = 999;

      for (let i = 0; i < COUNT; i++) {
        const el = tiles[i];
        if (!el) continue;
        const deg = START + i * STEP + pos;
        const rad = (deg * Math.PI) / 180;
        const s = scaleAt(deg);
        const x = cx + R * Math.cos(rad) - base / 2;
        const y = cy + R * Math.sin(rad) - base / 2;

        el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${s.toFixed(4)})`;
        el.style.zIndex = String(Math.round(s * 100));
        el.style.opacity = String(Math.min(1, 0.3 + s * 3.2).toFixed(3));

        const diff = Math.abs((((deg - PEAK) % 360) + 540) % 360 - 180);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = i;
        }
      }

      if (best !== activeIdx) {
        activeIdx = best;
        setActive(best);
      }
    };

    // Auto rotation is a constant-speed glide (no stop and go).
    // Scroll input goes through a critically damped spring, so it eases in and out.
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!reduce) auto += AUTO_SPEED * dt;

      const x = sp - scrollDeg;
      const tmp = (vel + OMEGA * x) * dt;
      const e = Math.exp(-OMEGA * dt);
      vel = (vel - OMEGA * tmp) * e;
      sp = scrollDeg + (x + tmp) * e;

      pos = auto + sp;
      paint();

      if (reduce && Math.abs(sp - scrollDeg) < 0.004 && Math.abs(vel) < 0.004) {
        sp = scrollDeg;
        vel = 0;
        pos = auto + sp;
        paint();
        running = false; // reduced motion: idle until the next scroll
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (running || !visible) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const measure = () => {
      const r = stage.getBoundingClientRect();
      w = r.width;
      h = r.height;
      if (!w || !h) return;
      geo = computeGeo(w, h);

      for (let i = 0; i < COUNT; i++) {
        const el = tiles[i];
        if (!el) continue;
        el.style.width = `${geo.base}px`;
        el.style.height = `${geo.base}px`;
      }
      if (orbitRef.current) {
        orbitRef.current.setAttribute('cx', geo.cx);
        orbitRef.current.setAttribute('cy', geo.cy);
        orbitRef.current.setAttribute('r', geo.R);
      }
      const label = labelRef.current;
      if (label) {
        label.style.width = `${geo.labelW}px`;
        label.style.transform = `translate3d(${geo.labelX - geo.labelW / 2}px, ${geo.cy}px, 0) translateY(-50%)`;
        label.style.setProperty('--lw', `${geo.labelW}px`);
        label.style.display = geo.labelW < 130 ? 'none' : 'block';
      }
      paint();
      wake();
    };

    const onScroll = () => {
      if (!h) return;
      const r = section.getBoundingClientRect();
      const travel = Math.max(r.height - h, 1);
      const progress = clamp(-r.top, 0, travel);
      scrollDeg = (progress / h) * DEG_PER_VIEWPORT; // absolute, so scrolling back reverses
      if (hintRef.current) hintRef.current.style.opacity = progress > 30 ? '0' : '1';
      wake();
    };

    const ro = new ResizeObserver(measure);
    ro.observe(stage);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
      else {
        cancelAnimationFrame(raf);
        running = false;
      }
    });
    io.observe(section);

    window.addEventListener('scroll', onScroll, { passive: true });
    measure();
    onScroll();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const total = String(COUNT).padStart(2, '0');

  return (
    // tall wrapper gives the page room to scroll; the stage stays pinned
    <section
      ref={sectionRef}
      className="relative h-[320vh] bg-[#ebebe9]"
      aria-label="Rotating collection of design tiles"
    >
      <style>{`
        @keyframes tr-fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes tr-bob { 0%,100% { transform: scaleY(.35); transform-origin: top; } 50% { transform: scaleY(1); transform-origin: top; } }
        .tr-fade { animation: tr-fade .8s cubic-bezier(.2,.7,.2,1) both; }
        .tr-bob { animation: tr-bob 2.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .tr-fade, .tr-bob { animation: none; } }
      `}</style>

      <div
        ref={stageRef}
        className="sticky top-0 h-[100svh] w-full overflow-hidden [contain:layout_paint]"
        style={{
          background:
            'radial-gradient(60% 55% at 72% 72%, rgba(229,34,44,0.07), transparent 70%), radial-gradient(120% 90% at 45% 35%, #f8f8f6 0%, #ebebe9 55%, #dcdcd9 100%)',
        }}
      >
        {/* paper grain */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-multiply"
          style={{ backgroundImage: GRAIN }}
        />

        {/* faint orbit guide */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <circle
            ref={orbitRef}
            fill="none"
            stroke="#0b0b0b"
            strokeOpacity=".08"
            strokeWidth="1"
            strokeDasharray="2 7"
          />
        </svg>

        {/* centre caption: names the tile currently at the front */}
        <div
          ref={labelRef}
          aria-live="polite"
          className="pointer-events-none absolute left-0 top-0 hidden text-center"
          style={{ willChange: 'transform' }}
        >
          <div key={active} className="tr-fade">
            <p
              className="font-sans font-semibold uppercase text-neutral-500"
              style={{ fontSize: 'clamp(9px, calc(var(--lw) * 0.04), 12px)', letterSpacing: '0.34em' }}
            >
              Collection
            </p>
            <p
              className="mt-[0.5em] font-serif leading-[1.05] text-neutral-900"
              style={{ fontSize: 'clamp(18px, calc(var(--lw) * 0.11), 46px)' }}
            >
              {TILES[active].label}
            </p>
            {TILES[active].text && (
              <p
                className="mx-auto mt-[0.8em] max-w-[34ch] font-sans leading-relaxed text-neutral-600"
                style={{ fontSize: 'clamp(11px, calc(var(--lw) * 0.05), 16px)' }}
              >
                {TILES[active].text}
              </p>
            )}
            <div className="mx-auto mt-[1.1em] flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-[#e5222c]" />
              <span
                className="font-sans tabular-nums text-neutral-600"
                style={{ fontSize: 'clamp(10px, calc(var(--lw) * 0.045), 14px)', letterSpacing: '0.2em' }}
              >
                {String(active + 1).padStart(2, '0')} / {total}
              </span>
              <span className="h-px w-8 bg-[#e5222c]" />
            </div>
          </div>
        </div>

        <TileLayer refs={tileRefs} />

        {/* scroll hint, fades once the page moves */}
        <div
          ref={hintRef}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 transition-opacity duration-500"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500">Scroll</span>
          <span className="tr-bob block h-6 w-px bg-neutral-500/70" />
        </div>
      </div>
    </section>
  );
}