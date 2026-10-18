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
 * Use your own photos: add `img: '/photo.jpg'` to any entry in TILES.
 * Text inside tiles uses cqw units, so artwork scales with each tile.
 */

/* ------------------------------------------------------------------ */
/* Tile artwork                                                        */
/* ------------------------------------------------------------------ */

const Portrait = ({ id, from, to, skin, hair = '#0c0c0c', shades = true, shift = 0 }) => (
  <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={from} />
        <stop offset="1" stopColor={to} />
      </linearGradient>
      <linearGradient id={`sk-${id}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={skin} />
        <stop offset="1" stopColor="#000" stopOpacity=".55" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill={`url(#bg-${id})`} />
    <g transform={`translate(${shift} 0)`}>
      <path d="M2 100 C8 74 30 70 50 70 C72 70 92 74 98 100Z" fill="#0a0a0a" />
      <rect x="43" y="58" width="16" height="16" rx="6" fill={`url(#sk-${id})`} />
      <ellipse cx="51" cy="44" rx="19" ry="25" fill={`url(#sk-${id})`} />
      <path d="M30 42 C28 18 46 12 58 16 C72 20 74 34 71 46 C68 34 58 28 46 30 C38 32 34 36 30 42Z" fill={hair} />
      {shades && <rect x="31" y="38" width="42" height="9" rx="4.5" fill="#020202" />}
      {shades && <rect x="35" y="39.5" width="14" height="2" rx="1" fill="#fff" opacity=".22" />}
    </g>
  </svg>
);

const TILES = [
  {
    id: 'portrait-a',
    label: 'Noir Study',
    render: () => <Portrait id="a" from="#2d2d2d" to="#0a0a0a" skin="#d8b9a4" shift={-4} />,
  },
  {
    id: 'serif-s',
    label: 'Serif S',
    render: () => (
      <div className="grid h-full w-full place-items-center bg-[#0d1a3b]">
        <span
          className="font-serif font-bold leading-none text-[#f5f1ea]"
          style={{ fontSize: '104cqw', transform: 'translateY(-4%)' }}
        >
          S
        </span>
      </div>
    ),
  },
  {
    id: 'red-x',
    label: 'Cross Mark',
    render: () => (
      <div className="grid h-full w-full place-items-center bg-[#fafafa]">
        <svg viewBox="0 0 100 100" className="h-[82%] w-[82%]">
          <path d="M4 10 H38 L52 36 L66 10 H96 L66 50 L98 92 H62 L50 68 L34 92 H4 L36 50Z" fill="#e5222c" />
          <path d="M52 36 L66 10 H96 L72 42Z" fill="#b3101a" opacity=".55" />
        </svg>
      </div>
    ),
  },
  {
    id: 'red-leather',
    label: 'Oxblood Leather',
    render: () => (
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="lea" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3a070b" />
            <stop offset=".5" stopColor="#8e1620" />
            <stop offset="1" stopColor="#2a0508" />
          </linearGradient>
          <radialGradient id="leaGlow" cx=".7" cy=".2" r=".7">
            <stop offset="0" stopColor="#fff" stopOpacity=".3" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#lea)" />
        <rect width="100" height="100" fill="url(#leaGlow)" />
        <path d="M0 70 C30 56 62 78 100 62" fill="none" stroke="#000" strokeWidth="6" opacity=".25" />
        <path d="M0 62 C30 48 62 70 100 54" fill="none" stroke="#e9b09b" strokeWidth="1.2" strokeDasharray="4 3" opacity=".85" />
      </svg>
    ),
  },
  {
    id: 'form',
    label: 'Form',
    render: () => (
      <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-[1.5%] bg-[#0b0b0b] p-[1.5%]">
        {['F', 'O', 'R', 'M'].map((l) => (
          <div key={l} className="grid place-items-center bg-[#fbfbfb]">
            <span className="font-sans font-black leading-none text-[#0b0b0b]" style={{ fontSize: '40cqw' }}>
              {l}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'silver-ribbon',
    label: 'Chrome Fold',
    render: () => (
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sil1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset=".35" stopColor="#a9a9ab" />
            <stop offset=".55" stopColor="#f2f2f3" />
            <stop offset="1" stopColor="#6d6d70" />
          </linearGradient>
          <linearGradient id="sil2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b2b2d" />
            <stop offset=".5" stopColor="#d9d9db" />
            <stop offset="1" stopColor="#ffffff" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="#eeeeee" />
        <path d="M8 70 C20 20 70 8 92 34 C70 30 40 42 30 82Z" fill="url(#sil1)" />
        <path d="M30 82 C40 42 70 30 92 34 C96 52 74 84 52 92 C42 95 34 92 30 82Z" fill="url(#sil2)" />
      </svg>
    ),
  },
  {
    id: 'portrait-b',
    label: 'Profile',
    render: () => (
      <Portrait id="b" from="#1b1b1b" to="#000" skin="#c9a58f" hair="#050505" shades={false} shift={6} />
    ),
  },
  {
    id: 'portrait-c',
    label: 'Shade',
    render: () => <Portrait id="c" from="#3a3a3a" to="#111" skin="#b98f78" shift={-2} />,
  },
  {
    id: 'echo',
    label: 'Echo',
    bare: true,
    render: () => (
      <div className="flex h-full w-full flex-col justify-end">
        {[0, 1, 2].map((n) => (
          <span
            key={n}
            className="font-sans font-black uppercase leading-[0.84] tracking-tighter text-[#d3101f]"
            style={{ fontSize: '38cqw' }}
          >
            Echo
          </span>
        ))}
      </div>
    ),
  },
  {
    id: 'red-sphere',
    label: 'Vermilion Orb',
    render: () => (
      <div className="grid h-full w-full place-items-center bg-[#240407]">
        <div
          className="h-[80%] w-[80%] rounded-full"
          style={{
            background: 'radial-gradient(circle at 32% 28%, #ff7a72 0%, #c4161f 38%, #4a060b 78%, #1a0204 100%)',
            boxShadow: 'inset -4cqw -6cqw 12cqw rgba(0,0,0,.45)',
          }}
        />
      </div>
    ),
  },
  {
    id: 'specimen',
    label: 'Type Specimen',
    render: () => (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#f6f6f4]">
        <span className="font-serif leading-none text-[#0b0b0b]" style={{ fontSize: '58cqw' }}>
          Aa
        </span>
        <span
          className="mt-[4%] font-sans font-bold uppercase tracking-[0.3em] text-[#0b0b0b]"
          style={{ fontSize: '7cqw' }}
        >
          Bauhaus
        </span>
      </div>
    ),
  },
  {
    id: 'portrait-d',
    label: 'Daylight',
    render: () => (
      <Portrait id="d" from="#efefef" to="#bdbdbd" skin="#6b4a3b" hair="#111" shades={false} />
    ),
  },
  {
    id: 'vase',
    label: 'Clay Vase',
    render: () => (
      <div className="relative h-full w-full bg-[#e8dfd2]">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="vase" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#efe5d6" />
              <stop offset=".6" stopColor="#cdbba2" />
              <stop offset="1" stopColor="#a8957b" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="90" rx="26" ry="4" fill="#000" opacity=".12" />
          <path d="M44 10 C40 26 62 34 64 56 C66 78 54 90 42 90 C26 90 24 70 36 54 C46 40 38 26 44 10Z" fill="url(#vase)" />
        </svg>
      </div>
    ),
  },
  {
    id: 'orbit-dot',
    label: 'Signal',
    render: () => (
      <div className="grid h-full w-full place-items-center bg-[#0b0b0b]">
        <div className="h-[34%] w-[34%] rounded-full bg-[#e5222c]" />
      </div>
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

const COUNT = TILES.length;
const STEP = 360 / COUNT; // degrees per tick
const TICK_MS = 3000; // auto-rotate every 3 seconds
const DEG_PER_VIEWPORT = 110; // scroll: degrees of rotation per viewport of scroll
const START = 196; // angle of tile 0 (0 = 3 o'clock, grows clockwise)
const PEAK = 42; // angle where tiles are largest (lower right)
const MIN_SCALE = 0.06;
const TILE_RATIO = 0.56; // tile size relative to ring radius
const OMEGA = 5.2; // spring speed: higher = snappier
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
          className={`absolute left-0 top-0 opacity-0 will-change-transform ${
            tile.bare ? '' : 'shadow-[0_12px_30px_-8px_rgba(0,0,0,0.38)]'
          }`}
          style={{ transformOrigin: 'center center' }}
        >
          <div className="relative h-full w-full overflow-hidden" style={{ containerType: 'size' }}>
            {tile.img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tile.img} alt="" draggable={false} className="h-full w-full object-cover" />
            ) : (
              tile.render()
            )}
            {!tile.bare && (
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
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

    let pos = reduce ? 0 : -50; // start swept back so the ring spins in on load
    let vel = 0;
    let tick = 0;
    let scrollDeg = 0;
    let activeIdx = 0;

    const target = () => tick * STEP + scrollDeg;

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

    // critically damped spring: smooth start, smooth stop, no overshoot
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = target();
      const x = pos - t;
      const tmp = (vel + OMEGA * x) * dt;
      const e = Math.exp(-OMEGA * dt);
      vel = (vel - OMEGA * tmp) * e;
      pos = t + (x + tmp) * e;
      paint();

      if (Math.abs(pos - t) < 0.004 && Math.abs(vel) < 0.004) {
        pos = t;
        vel = 0;
        paint();
        running = false; // idle: no frames are scheduled until something changes
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

    let timer;
    if (!reduce) {
      timer = setInterval(() => {
        if (document.hidden || !visible) return;
        tick += 1;
        wake();
      }, TICK_MS);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    measure();
    onScroll();

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
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