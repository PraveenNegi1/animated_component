'use client';

import { useEffect, useRef } from 'react';

/**
 * TileRing
 * Tiles sit on a circle: small on the left, large at the lower right.
 * The ring turns clockwise one slot every 3 seconds and also with scroll.
 *
 * Usage (app/page.jsx):
 *   import TileRing from '@/components/TileRing';
 *   export default function Page() { return <TileRing />; }
 *
 * Use your own photos: add `img: '/photo.jpg'` to any entry in TILES.
 * Tile text uses cqw units, so artwork scales with each tile.
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
    render: () => <Portrait id="a" from="#2d2d2d" to="#0a0a0a" skin="#d8b9a4" shift={-4} />,
  },
  {
    id: 'serif-s',
    render: () => (
      <div className="grid h-full w-full place-items-center bg-[#0d1a3b]">
        <span className="font-serif font-bold leading-none text-[#f5f1ea]" style={{ fontSize: '104cqw', transform: 'translateY(-4%)' }}>
          S
        </span>
      </div>
    ),
  },
  {
    id: 'red-x',
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
        <path d="M0 62 C30 48 62 70 100 54" fill="none" stroke="#e9b09b" strokeWidth="1.2" strokeDasharray="4 3" opacity=".85" />
        <path d="M0 70 C30 56 62 78 100 62" fill="none" stroke="#000" strokeWidth="6" opacity=".25" />
      </svg>
    ),
  },
  {
    id: 'form',
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
    render: () => <Portrait id="b" from="#1b1b1b" to="#000" skin="#c9a58f" hair="#050505" shades={false} shift={6} />,
  },
  {
    id: 'portrait-c',
    render: () => <Portrait id="c" from="#3a3a3a" to="#111" skin="#b98f78" shift={-2} />,
  },
  {
    id: 'echo',
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
    render: () => (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#f6f6f4]">
        <span className="font-serif leading-none text-[#0b0b0b]" style={{ fontSize: '58cqw' }}>
          Aa
        </span>
        <span className="mt-[4%] font-sans font-bold uppercase tracking-[0.3em] text-[#0b0b0b]" style={{ fontSize: '7cqw' }}>
          Bauhaus
        </span>
      </div>
    ),
  },
  {
    id: 'portrait-d',
    render: () => <Portrait id="d" from="#efefef" to="#bdbdbd" skin="#6b4a3b" hair="#111" shades={false} />,
  },
  {
    id: 'vase',
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
    render: () => (
      <div className="grid h-full w-full place-items-center bg-[#0b0b0b]">
        <div className="h-[34%] w-[34%] rounded-full bg-[#e5222c]" />
      </div>
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Ring settings                                                       */
/* ------------------------------------------------------------------ */

const COUNT = TILES.length;
const STEP = 360 / COUNT; // degrees advanced every tick
const TICK_MS = 3000; // auto-rotate every 3 seconds
const SCROLL_FACTOR = 0.2; // degrees per scrolled pixel
const START = 196; // angle of tile 0 (0 = 3 o'clock, grows clockwise)
const PEAK = 42; // angle where tiles are largest (lower right)
const MIN_SCALE = 0.06;
const DAMPING = 4.5; // higher = snappier easing

function layout(w, h) {
  const portrait = h > w * 1.05;
  if (portrait) {
    // phones: ring bleeds off the left edge, big tiles stay on screen
    const R = w * 0.58;
    return { cx: w * 0.34, cy: h * 0.5, R, base: w * 0.36 };
  }
  const R = Math.min(h * 0.4, w * 0.3);
  return { cx: w * 0.5, cy: h * 0.5, R, base: R * 0.56 };
}

export default function TileRing() {
  const stageRef = useRef(null);
  const tileRefs = useRef([]);
  const orbitRef = useRef(null);
  const hintRef = useRef(null);
  const motion = useRef({ cur: 0, target: 0 });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    let lastY = window.scrollY;

    const measure = () => {
      const r = stage.getBoundingClientRect();
      w = r.width;
      h = r.height;
    };

    const draw = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const m = motion.current;
      m.cur += (m.target - m.cur) * (1 - Math.exp(-DAMPING * dt));

      const { cx, cy, R, base } = layout(w, h);

      if (orbitRef.current) {
        orbitRef.current.setAttribute('cx', cx);
        orbitRef.current.setAttribute('cy', cy);
        orbitRef.current.setAttribute('r', R);
      }

      tileRefs.current.forEach((el, i) => {
        if (!el) return;
        const deg = START + i * STEP + m.cur;
        const rad = (deg * Math.PI) / 180;
        const x = cx + R * Math.cos(rad) - base / 2;
        const y = cy + R * Math.sin(rad) - base / 2;

        const k = (1 + Math.cos(((deg - PEAK) * Math.PI) / 180)) / 2;
        const scale = MIN_SCALE + (1 - MIN_SCALE) * Math.pow(k, 1.8);

        el.style.width = `${base}px`;
        el.style.height = `${base}px`;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
        el.style.zIndex = String(Math.round(scale * 100));
        el.style.opacity = String(Math.min(1, 0.35 + scale * 3));
      });

      raf = requestAnimationFrame(draw);
    };

    const onScroll = () => {
      const y = window.scrollY;
      motion.current.target += (y - lastY) * SCROLL_FACTOR; // scroll down = clockwise
      lastY = y;
      if (hintRef.current) hintRef.current.style.opacity = y > 40 ? '0' : '1';
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    raf = requestAnimationFrame(draw);

    let timer;
    if (!reduce) {
      timer = setInterval(() => {
        if (!document.hidden) motion.current.target += STEP;
      }, TICK_MS);
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    // tall wrapper gives the page room to scroll; the stage stays pinned
    <section
      className="relative h-[320vh] bg-[#ebebe9]"
      aria-label="Rotating collection of design tiles"
    >
      <div
        ref={stageRef}
        className="sticky top-0 h-[100svh] w-full overflow-hidden"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 40%, #f7f7f5 0%, #ebebe9 55%, #dcdcd9 100%)',
        }}
      >
        {/* faint orbit guide */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <circle
            ref={orbitRef}
            fill="none"
            stroke="#0b0b0b"
            strokeOpacity=".07"
            strokeWidth="1"
            strokeDasharray="2 7"
          />
        </svg>

        {TILES.map((tile, i) => (
          <div
            key={tile.id}
            ref={(el) => (tileRefs.current[i] = el)}
            className={`absolute left-0 top-0 opacity-0 will-change-transform ${
              tile.bare ? '' : 'shadow-[0_10px_28px_-6px_rgba(0,0,0,0.35)]'
            }`}
            style={{ transformOrigin: 'center center' }}
          >
            <div className="h-full w-full overflow-hidden" style={{ containerType: 'size' }}>
              {tile.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tile.img} alt="" className="h-full w-full object-cover" />
              ) : (
                tile.render()
              )}
            </div>
          </div>
        ))}

        {/* scroll hint, fades once the page moves */}
        <p
          ref={hintRef}
          className="pointer-events-none absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 text-xs tracking-wide text-neutral-500 transition-opacity duration-500"
        >
          Scroll to turn the ring
        </p>
      </div>
    </section>
  );
}