"use client";
// YogaHero.jsx — hero image section only. No extra packages needed.
// Put yoga.jpg in your project's /public folder, then: import YogaHero from "@/components/YogaHero";
import { useEffect, useRef, useState } from "react";

const IMG = "/yoga.jpg";
const CLASSES = [
  ["Hatha flow", "Slow, steady, strong."],
  ["Pranayama", "Breathe with the river."],
  ["Sunrise vinyasa", "Start the day in motion."],
];

function Liquid({ src }) {
  const box = useRef(),
    cv = useRef();
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = cv.current,
      ctx = c.getContext("2d"),
      dpr = Math.min(devicePixelRatio || 1, 2),
      R = 143 * dpr,
      D = Math.ceil(R * 2);
    const cover = document.createElement("canvas"),
      brush = document.createElement("canvas"),
      bx = brush.getContext("2d");
    brush.width = brush.height = D;
    const img = new Image();
    img.src = src;
    let W = 0,
      H = 0,
      pts = [],
      last = null,
      idle = 0,
      run = false,
      ok = false;
    const size = () => {
      const r = box.current.getBoundingClientRect();
      W = c.width = Math.round(r.width * dpr);
      H = c.height = Math.round(r.height * dpr);
      cover.width = W;
      cover.height = H;
      if (!img.naturalWidth) return;
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight),
        w = img.naturalWidth * s,
        h = img.naturalHeight * s;
      cover.getContext("2d").drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      ok = true;
    };
    img.onload = size;
    const ro = new ResizeObserver(size);
    ro.observe(box.current);
    const stamp = (x, y) => {
      bx.globalCompositeOperation = "source-over";
      bx.clearRect(0, 0, D, D);
      const g = bx.createRadialGradient(R, R, 0, R, R, R);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.55, "rgba(255,255,255,.82)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      bx.fillStyle = g;
      bx.fillRect(0, 0, D, D);
      bx.globalCompositeOperation = "source-in";
      bx.drawImage(cover, x - R, y - R, D, D, 0, 0, D, D);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(brush, x - R, y - R);
    };
    const frame = () => {
      const drawing = pts.length > 0;
      if (drawing) idle = 0;
      else if (++idle > 120) {
        run = false;
        return;
      }
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0,0,0,${drawing ? 0.016 : Math.min(0.016 + idle * 0.004, 0.5)})`;
      ctx.fillRect(0, 0, W, H);
      if (drawing) {
        pts.forEach((q) => stamp(q[0], q[1]));
        pts = [];
      }
      if (idle >= 120) ctx.clearRect(0, 0, W, H);
      requestAnimationFrame(frame);
    };
    const move = (e) => {
      if (!ok) return;
      const r = c.getBoundingClientRect(),
        x = (e.clientX - r.left) * dpr,
        y = (e.clientY - r.top) * dpr;
      if (x < -R || y < -R || x > W + R || y > H + R) {
        last = null;
        return;
      }
      if (last) {
        const dx = x - last[0],
          dy = y - last[1],
          n = Math.min(
            Math.ceil(Math.hypot(dx, dy) / Math.max(R * 0.3, 1)),
            60,
          );
        for (let k = 1; k <= n; k++)
          pts.push([last[0] + (dx * k) / n, last[1] + (dy * k) / n]);
      } else pts.push([x, y]);
      last = [x, y];
      if (!run) {
        run = true;
        idle = 0;
        requestAnimationFrame(frame);
      }
    };
    addEventListener("pointermove", move);
    return () => {
      removeEventListener("pointermove", move);
      ro.disconnect();
    };
  }, [src]);
  // Base layer is a calm, desaturated version; the cursor paints the full-colour photo over it.
  return (
    <div className="yh-bg" ref={box}>
      <img
        className="yh-base"
        src={src}
        alt="A woman practising yoga on the Ganges ghats in Rishikesh at sunrise"
      />
      <canvas ref={cv} aria-hidden="true" />
    </div>
  );
}

export default function YogaHero() {
  const [i, setI] = useState(0);
  return (
    <section className="yh">
      <style>{CSS}</style>
      <Liquid src={IMG} />
      <div className="yh-vig" />
      <div className="yh-wm" aria-hidden="true">
        PRANA
      </div>

      <div className="yh-in">
        <div className="yh-left">
          <span className="yh-eb yh-a" style={{ "--d": "100ms" }}>
            Yoga on the Ganges · Rishikesh
          </span>
          <h1>
            <span className="yh-ln">
              <span style={{ "--d": "200ms" }}>Find your balance</span>
            </span>
            <span className="yh-ln">
              <span style={{ "--d": "320ms" }}>by the river</span>
            </span>
          </h1>
          <p className="yh-sub yh-a" style={{ "--d": "500ms" }}>
            Small-group classes taught at sunrise on the ghats. Move, breathe
            and slow down with certified teachers, whether it's your first class
            or your thousandth.
          </p>
          <div className="yh-rt yh-a" style={{ "--d": "600ms" }}>
            <span>{"★★★★★"}</span>4.9 from 1,200+ students
          </div>
          <div className="yh-cta yh-a" style={{ "--d": "700ms" }}>
            <a className="yh-btn yh-light" href="#book">
              Book a class
            </a>
            <a className="yh-btn yh-ghost" href="#schedule">
              View schedule
            </a>
          </div>
        </div>

        <div className="yh-right yh-a" style={{ "--d": "500ms" }}>
          <button
            className="yh-card"
            onClick={() => setI((i + 1) % CLASSES.length)}
            aria-label="Next class"
          >
            <small>{CLASSES[i][0]}</small>
            <strong key={i}>{CLASSES[i][1]}</strong>
            <span className="yh-dots">
              {CLASSES.map((_, k) => (
                <i key={k} className={k === i ? "on" : ""} />
              ))}
            </span>
          </button>
          <ul className="yh-facts">
            <li>
              <b>6:30am</b> Daily sunrise class
            </li>
            <li>
              <b>8</b> Students per group
            </li>
            <li>
              <b>200hr</b> Certified teachers
            </li>
          </ul>
        </div>
      </div>

      <div className="yh-bar yh-a" style={{ "--d": "900ms" }}>
        <span>Open daily, 6am to 8pm</span>
        <span className="yh-mid">Rishikesh, Uttarakhand</span>
        <span>Scroll to explore ↓</span>
      </div>
    </section>
  );
}

const CSS = `
.yh,.yh *{box-sizing:border-box}
.yh{position:relative;isolation:isolate;overflow:hidden;min-height:100svh;border-radius:0 0 2rem 2rem;background:#0f1a1c;color:#fff;font-family:'Onest',system-ui,sans-serif}
.yh-bg{position:absolute;inset:0;z-index:0}
.yh-bg img,.yh-bg canvas{position:absolute;inset:0;width:100%;height:100%}
.yh-bg img{object-fit:cover;object-position:60% center;filter:grayscale(.85) brightness(.82) contrast(1.05)}
.yh-bg canvas{pointer-events:none}
.yh-vig{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(90deg,rgba(8,16,18,.78) 0%,rgba(8,16,18,.35) 45%,rgba(8,16,18,.05) 75%),linear-gradient(to top,rgba(8,16,18,.55),transparent 35%)}
.yh-wm{position:absolute;z-index:1;left:0;right:0;bottom:5rem;text-align:center;font-weight:700;font-size:clamp(6rem,18vw,16rem);line-height:1;color:rgba(255,255,255,.07);pointer-events:none;user-select:none}
.yh-in{position:relative;z-index:20;display:grid;grid-template-columns:1.4fr 1fr;gap:2.5rem;align-items:end;min-height:100svh;max-width:88rem;margin:0 auto;padding:8rem 2rem 7rem}
.yh-left{display:flex;flex-direction:column;align-items:flex-start;gap:1.5rem;max-width:40rem}
.yh-eb{display:inline-flex;align-items:center;gap:.5rem;font-size:.875rem;font-weight:500;color:rgba(255,255,255,.8)}
.yh-eb:before{content:"";width:.375rem;height:.375rem;border-radius:9999px;background:#e9a574}
.yh h1{font-size:clamp(2.5rem,6vw,4.75rem);font-weight:600;line-height:1;letter-spacing:-.02em}
.yh-ln{display:block;overflow:hidden;padding-bottom:.08em}
.yh-ln>span{display:block;transform:translateY(105%);animation:yhUp .9s cubic-bezier(.215,.61,.355,1) forwards;animation-delay:var(--d)}
.yh-sub{max-width:34rem;font-size:1.0625rem;line-height:1.55;color:rgba(255,255,255,.78)}
.yh-rt{display:flex;align-items:center;gap:.75rem;font-size:.875rem;font-weight:500;color:rgba(255,255,255,.8)}
.yh-rt span{color:#e9a574;letter-spacing:.1em}
.yh-cta{display:flex;flex-wrap:wrap;gap:.75rem}
.yh-btn{display:inline-flex;align-items:center;border-radius:9999px;padding:.9rem 1.75rem;font-size:.9375rem;font-weight:500;text-decoration:none;transition:transform .3s cubic-bezier(.2,.8,.2,1),background .3s}
.yh-btn:hover{transform:scale(1.04)}
.yh-light{background:#fff;color:#0f1a1c}
.yh-ghost{border:1px solid rgba(255,255,255,.4);color:#fff;backdrop-filter:blur(6px)}
.yh-ghost:hover{background:rgba(255,255,255,.12)}
.yh-right{display:flex;flex-direction:column;align-items:flex-end;gap:1.5rem}
.yh-card{width:100%;max-width:19rem;text-align:left;border:1px solid rgba(255,255,255,.2);border-radius:1.25rem;background:rgba(255,255,255,.12);backdrop-filter:blur(14px);padding:1rem 1.25rem;color:#fff;font:inherit;cursor:pointer;display:flex;flex-direction:column;gap:.35rem}
.yh-card small{font-size:.7rem;font-weight:500;text-transform:uppercase;letter-spacing:.05em;color:rgba(255,255,255,.6)}
.yh-card strong{font-size:1.0625rem;font-weight:500;animation:yhFade .4s ease both}
.yh-dots{display:flex;gap:.25rem;margin-top:.6rem}
.yh-dots i{height:.25rem;width:.375rem;border-radius:9999px;background:rgba(255,255,255,.3);transition:all .3s}
.yh-dots i.on{width:1rem;background:#fff}
.yh-facts{list-style:none;margin:0;padding:0;display:flex;gap:1.5rem;font-size:.75rem;color:rgba(255,255,255,.7)}
.yh-facts b{display:block;font-size:1.25rem;font-weight:600;color:#fff}
.yh-bar{position:absolute;z-index:20;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:.75rem;max-width:88rem;margin:0 auto;border-top:1px solid rgba(255,255,255,.15);padding:1.25rem 2rem;font-size:.75rem;font-weight:500;text-transform:uppercase;letter-spacing:.025em;color:rgba(255,255,255,.7)}
.yh-a{opacity:0;transform:translateY(14px);animation:yhIn .8s cubic-bezier(.16,1,.3,1) forwards;animation-delay:var(--d)}
@keyframes yhUp{to{transform:none}}
@keyframes yhIn{to{opacity:1;transform:none}}
@keyframes yhFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@media(max-width:900px){.yh-in{grid-template-columns:1fr;align-items:end;padding:7rem 1.25rem 7rem}.yh-right{align-items:flex-start}.yh-bar{padding:1.25rem}.yh-mid{display:none}}
@media(prefers-reduced-motion:reduce){.yh-a,.yh-ln>span{animation:none;opacity:1;transform:none}}
`
;
