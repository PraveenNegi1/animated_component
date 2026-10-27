"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Head from "next/head";
const CSS = `:root {
  --bg-color: #0a0a0a;
  --text-color: #ffffff;
  --accent-color: #ffffff;
  --muted-color: rgba(255, 255, 255, 0.7);
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --font-main: 'Inter', sans-serif;
  --font-heading: 'Galada', cursive;
  --bg-inner: #0b8a78;
  --bg-mid: #044e3b;
  --bg-outer: #011411;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: radial-gradient(circle at center, var(--bg-inner) 0%, var(--bg-mid) 50%, var(--bg-outer) 100%);
  color: var(--text-color);
  font-family: var(--font-main);
  overflow: hidden;
  height: 100vh;
  transition: background 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}
body.blue-theme { --bg-inner: #0b4f8a; --bg-mid: #04294e; --bg-outer: #010c14; }

#bubbles-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; overflow: hidden; }
.bubble-img { position: absolute; pointer-events: none; }
@keyframes floatUpImg {
  0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.4; }
  90% { opacity: 0.4; }
  100% { transform: translateY(-110vh) translateX(30px) rotate(360deg); opacity: 0; }
}

.header { display: flex; justify-content: space-between; align-items: center; padding: 2rem 4%; position: fixed; top: 0; width: 100%; z-index: 100; }
.logo { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 1.2rem; font-family: var(--font-heading); }
.nav { display: flex; gap: 0.5rem; background: var(--glass-bg); padding: 0.4rem; border-radius: 100px; border: 1px solid var(--glass-border); }
.nav.glass {
  position: relative; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
}
.nav-item { font-family: 'Manrope', sans-serif; color: var(--muted-color); text-decoration: none; font-size: 0.85rem; font-weight: 500; padding: 0.5rem 1.2rem; border-radius: 100px; transition: all 0.3s ease; }
.nav-item:hover, .nav-item.active { background: #fbcfe8; color: #011d17; }
.contact-btn { background: rgba(0, 0, 0, 0.5); color: white; border: none; padding: 0.9rem 2rem; border-radius: 100px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.3s ease; }
.contact-btn:hover { background: rgba(0, 0, 0, 0.7); transform: translateY(-2px); }

.hero { height: 100vh; display: flex; align-items: center; justify-content: center; padding: 0 4%; padding-top: 5rem; }
.hero-content { display: flex; justify-content: space-between; align-items: stretch; width: 100%; max-width: 100%; padding: 0; height: 100%; position: relative; }
.main-title, .side-title { font-family: var(--font-heading); font-size: clamp(5rem, 10vw, 12rem); line-height: 0.8; font-weight: 400; text-transform: none; white-space: nowrap; color: white; letter-spacing: normal; }
.outline { color: var(--text-color); }

.leaves-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1; transition: transform 0.1s ease-out; }
.leaf { position: absolute; width: 60px; height: 60px; pointer-events: none; z-index: -1; filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.2)); }
.l1 { top: 10%; left: 15%; }
.l2 { top: 40%; left: 80%; width: 140px; height: 140px; opacity: 0.4; }
.l3 { top: 70%; left: 75%; width: 80px; height: 80px; }
.l4 { top: 85%; left: 20%; width: 120px; height: 120px; opacity: 0.3; }

.hero-left { display: flex; flex-direction: column; height: 100%; padding: 6rem 0; gap: 2rem; z-index: 100; }
.description { color: var(--muted-color); font-size: 1.1rem; line-height: 1.6; max-width: 400px; }
.primary-btn { display: flex; align-items: center; gap: 1.5rem; background: rgba(0, 0, 0, 0.5); color: white; border: none; padding: 0.4rem 0.4rem 0.4rem 1.5rem; border-radius: 100px; font-weight: 700; cursor: pointer; width: fit-content; transition: all 0.3s ease; }
.primary-btn:hover { background: rgba(0, 0, 0, 0.7); transform: translateY(-3px); }
.plus-icon { background: #fbcfe8; color: #011d17; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 1.4rem; font-weight: 900; line-height: 1; padding-bottom: 2px; border: none; }
.award-badge { display: flex; align-items: center; gap: 1rem; margin-top: auto; }
.award-icon { width: 48px; height: 48px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.award-text { display: flex; flex-direction: column; }
.award-title { font-size: 0.7rem; letter-spacing: 0.1em; color: var(--muted-color); }
.award-subtitle { font-size: 0.85rem; font-weight: 600; }

.hero-center {
  display: flex; justify-content: center; align-items: center; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  z-index: 1; opacity: 0; animation: fadeIn 1.5s ease-out 0.3s forwards, float 6s ease-in-out infinite;
  pointer-events: none; background: radial-gradient(circle at center, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
}
@keyframes fadeIn { to { opacity: 1; } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
.main-product-3d { width: 80vw; height: 80vh; outline: none; --progress-bar-color: transparent; --poster-color: transparent; z-index: 1; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(25deg); pointer-events: none; }
.main-product-3d[camera-controls] { pointer-events: auto; }

.berries-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 110; transition: transform 0.1s ease-out; }
.berries-container-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; transition: transform 0.1s ease-out; }
.berry { position: absolute; width: 120px; height: 120px; outline: none; --progress-bar-color: transparent; filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3)); transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); }
.berry.no-animation { animation: none !important; }
.b1 { top: 25%; left: 30%; width: 220px; height: 220px; }
.b2 { top: 60%; left: 42%; width: 100px; height: 100px; }
.b3 { top: 30%; left: 62%; width: 250px; height: 250px; }
.b4 { top: 15%; left: 48%; width: 140px; height: 140px; }
.b5 { top: 75%; left: 20%; width: 120px; height: 120px; }
.b6 { top: 45%; left: 75%; width: 180px; height: 180px; }
.b7 { top: 15%; left: 40%; width: 80px; height: 80px; opacity: 0.7; }
.b8 { top: 50%; left: 55%; width: 70px; height: 70px; opacity: 0.6; }
.b9 { top: 80%; left: 35%; width: 75px; height: 75px; opacity: 0.7; }

.hero-right { display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; text-align: right; height: 100%; padding: 6rem 0; z-index: 100; width: 450px; pointer-events: none; }
.product-carousel { display: flex; flex-direction: column; gap: 1.5rem; align-items: flex-end; pointer-events: auto; }
.carousel-cards { display: flex; gap: 1rem; }
.card { background: var(--glass-bg); border: 1px solid var(--glass-border); padding: 1rem; padding-top: 5rem; border-radius: 28px; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; cursor: pointer; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); width: 135px; position: relative; backdrop-filter: blur(10px); text-align: center; }
.card:hover { background: rgba(255, 255, 255, 0.12); border-color: rgba(255, 255, 255, 0.4); }
.card.active { border-color: #fbcfe8; border-width: 1px; background: var(--glass-bg); }
.card img { width: 140px; height: auto; margin-top: -8rem; filter: drop-shadow(0 20px 35px rgba(0, 0, 0, 0.5)); transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) !important; display: block; will-change: transform; pointer-events: none; }
.card:hover img { transform: translateY(-30px) rotate(-12deg) scale(1.15) !important; }
.card-info { display: flex; flex-direction: column; font-size: 0.7rem; width: 100%; word-wrap: break-word; }
.card-info span:first-child { font-weight: 600; }
.card-info span:last-child { color: var(--muted-color); }
.carousel-nav { display: flex; gap: 1rem; }
.nav-arrow { background: var(--glass-bg); border: 1px solid var(--glass-border); color: white; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.3s; }
.nav-arrow:hover { background: rgba(255, 255, 255, 0.1); }
.side-title { align-self: flex-end; text-align: right; }

@keyframes shine {
  from { transform: translateX(-100%) rotate(45deg); }
  to { transform: translateX(200%) rotate(45deg); }
}
@media (max-width: 1200px) {
  .main-product-3d { width: 100vw; height: 60vh; top: 40%; }
  .hero-content { grid-template-columns: 1fr; padding-top: 8rem; }
  .hero-center { order: -1; }
  .main-title, .side-title { font-size: 5rem; }
  .hero-right { align-items: center; text-align: center; }
  .side-title { align-self: center; text-align: center; }
}
`;
const BASE = "https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d";
const A = {
  leaves: `${BASE}/leaves.glb`,
  cherry: `${BASE}/cherry.glb`,
  blueberry: `${BASE}/blueberry.glb`,
  can: `${BASE}/deit_soda2.glb`,
  greenSoda: `${BASE}/Green%20Soda.png`,
  blueSoda: `${BASE}/Blue%20Soda.png`,
  greenTex: `${BASE}/green%20base%20color.jpg`,
  blueTex: `${BASE}/blue%20base%20color.jpg`,
  bubble: `${BASE}/bubble.png`
};
const LEAVES = [
  ["l1", "45deg 75deg 105%"],
  ["l2", "-30deg 60deg 105%"],
  ["l3", "120deg 85deg 105%"],
  ["l4", "10deg 45deg 105%"]
];
const BG_BERRIES = [
  ["b7", "-20deg 110deg 105%"],
  ["b8", "160deg 45deg 105%"],
  ["b9", "45deg 20deg 105%"]
];
const FG_BERRIES = [
  ["b1", "45deg 120deg 105%"],
  ["b2", "-120deg 45deg 105%"],
  ["b3", "200deg 90deg 105%"],
  ["b4", "10deg 20deg 105%"],
  ["b5", "-45deg 160deg 105%"],
  ["b6", "80deg 75deg 105%"]
];
export default function Home() {
  const rootRef = useRef(null);
  useEffect(() => {
    import("@google/model-viewer");
    const root = rootRef.current;
    const modelViewer = root.querySelector("#product-model");
    const berriesFG = root.querySelector(".berries-container");
    const berriesBG = root.querySelector(".berries-container-bg");
    const leavesBG = root.querySelector(".leaves-container");
    const allBerries = root.querySelectorAll(".berry");
    const cards = root.querySelectorAll(".card");
    const bubblesContainer = root.querySelector("#bubbles-container");
    let isSwitching = false;
    let switchSpin = 0;
    let blueTexture = null;
    let greenTexture = null;
    const onLoad = async () => {
      try {
        blueTexture = await modelViewer.createTexture(A.blueTex);
        greenTexture = await modelViewer.createTexture(A.greenTex);
        if (modelViewer.model) {
          const material = modelViewer.model.materials[0];
          if (material && material.pbrMetallicRoughness.baseColorTexture) {
            material.pbrMetallicRoughness.baseColorTexture.setTexture(blueTexture);
            await new Promise((r) => requestAnimationFrame(r));
            material.pbrMetallicRoughness.baseColorTexture.setTexture(greenTexture);
          }
        }
      } catch (e) {
        console.error("Texture preload failed", e);
      }
    };
    modelViewer.addEventListener("load", onLoad);
    const onCardClick = (card) => () => {
      if (isSwitching) return;
      cards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      switchFlavor(card.dataset.flavor);
    };
    const cardHandlers = Array.from(cards).map((card) => {
      const h = onCardClick(card);
      card.addEventListener("click", h);
      return [card, h];
    });
    function setTextures(tex) {
      if (!modelViewer.model || !tex) return;
      modelViewer.model.materials.forEach((material) => {
        if (material.pbrMetallicRoughness.baseColorTexture) {
          material.pbrMetallicRoughness.baseColorTexture.setTexture(tex);
        }
      });
    }
    async function switchFlavor(flavor) {
      if (isSwitching) return;
      isSwitching = true;
      const body = document.body;
      const berries = root.querySelectorAll(".berry");
      const heroCenter = root.querySelector(".hero-center");
      const targetColors = flavor === "blue" ? { inner: "#0b4f8a", mid: "#04294e", outer: "#010c14" } : { inner: "#0b8a78", mid: "#044e3b", outer: "#011411" };
      gsap.to(body, {
        "--bg-inner": targetColors.inner,
        "--bg-mid": targetColors.mid,
        "--bg-outer": targetColors.outer,
        duration: 1.5,
        ease: "power2.inOut"
      });
      const spinObj = { val: 0, blur: 0 };
      gsap.to(spinObj, {
        val: 360,
        blur: 15,
        duration: 0.6,
        ease: "power2.in",
        onUpdate: () => {
          switchSpin = spinObj.val;
          modelViewer.style.filter = `blur(${spinObj.blur}px)`;
        },
        onComplete: () => {
          if (flavor === "blue") {
            body.classList.add("blue-theme");
            setTextures(blueTexture);
          } else {
            body.classList.remove("blue-theme");
            setTextures(greenTexture);
          }
          gsap.to(spinObj, {
            val: 720,
            blur: 0,
            duration: 1.5,
            ease: "back.out(0.7)",
            onUpdate: () => {
              switchSpin = spinObj.val;
              modelViewer.style.filter = `blur(${spinObj.blur}px)`;
            },
            onComplete: () => {
              switchSpin = 0;
              modelViewer.style.filter = "none";
            }
          });
        }
      });
      let completedBerries = 0;
      berries.forEach((berry) => {
        const bW = berry.offsetWidth / 2;
        const bH = berry.offsetHeight / 2;
        const centerX = window.innerWidth / 2 - berry.offsetLeft - bW;
        const centerY = window.innerHeight / 2 - berry.offsetTop - bH;
        const startAngle = parseFloat(berry.dataset.angle) || 0;
        const currentBaseX = parseFloat(berry.dataset.baseX) || 0;
        const currentBaseY = parseFloat(berry.dataset.baseY) || 0;
        const nextBaseX = (Math.random() - 0.5) * 200;
        const nextBaseY = (Math.random() - 0.5) * 200;
        gsap.set(berry, { rotation: startAngle, x: currentBaseX, y: currentBaseY });
        gsap.timeline().to(berry, {
          x: centerX,
          y: centerY,
          rotation: startAngle + 45,
          scale: 0.1,
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => {
            berry.src = flavor === "blue" ? A.blueberry : A.cherry;
            heroCenter.style.zIndex = "50";
          }
        }).to(berry, { duration: 0.3 }).to(berry, {
          onStart: () => {
            heroCenter.style.zIndex = "1";
          },
          x: nextBaseX,
          y: nextBaseY,
          rotation: startAngle + 90,
          scale: 1,
          opacity: 1,
          duration: 0.9,
          ease: "back.out(1.5)",
          onComplete: () => {
            berry.dataset.angle = startAngle + 90;
            berry.dataset.baseX = nextBaseX;
            berry.dataset.baseY = nextBaseY;
            berry.dataset.rx = 0;
            berry.dataset.ry = 0;
            completedBerries++;
            if (completedBerries === berries.length) isSwitching = false;
          }
        });
      });
    }
    allBerries.forEach((b) => {
      b.dataset.rx = 0;
      b.dataset.ry = 0;
      b.dataset.angle = Math.random() * 360;
      b.dataset.baseX = 0;
      b.dataset.baseY = 0;
      b.dataset.targetRx = 0;
      b.dataset.targetRy = 0;
    });
    const mouse = { x: 0, y: 0, px: 0, py: 0 };
    const currentMouse = { x: 0, y: 0 };
    const onMouseMove = (e) => {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
      mouse.px = e.clientX;
      mouse.py = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove);
    let raf = 0;
    function animate() {
      const time = Date.now() * 1e-3;
      currentMouse.x += (mouse.x - currentMouse.x) * 0.05;
      currentMouse.y += (mouse.y - currentMouse.y) * 0.05;
      modelViewer.cameraOrbit = `${currentMouse.x * 40 + switchSpin}deg ${90 + currentMouse.y * 20}deg 380%`;
      berriesFG.style.transform = `translate(${currentMouse.x * 60}px, ${currentMouse.y * 60}px)`;
      berriesBG.style.transform = `translate(${currentMouse.x * -30}px, ${currentMouse.y * -30}px)`;
      leavesBG.style.transform = `translate(${currentMouse.x * -15}px, ${currentMouse.y * -15}px)`;
      if (!isSwitching) {
        allBerries.forEach((berry, i) => {
          const r = berry.getBoundingClientRect();
          const berryX = r.left + r.width / 2;
          const berryY = r.top + r.height / 2;
          const diffX = mouse.px - berryX;
          const diffY = mouse.py - berryY;
          const distance = Math.sqrt(diffX * diffX + diffY * diffY);
          let targetRx = 0, targetRy = 0, speedMult = 1;
          if (distance < 400) {
            const force = (400 - distance) / 400;
            targetRx = diffX / distance * force * -80;
            targetRy = diffY / distance * force * -80;
            speedMult = 1 + force * 5;
          }
          let rx = parseFloat(berry.dataset.rx) || 0;
          let ry = parseFloat(berry.dataset.ry) || 0;
          let angle = parseFloat(berry.dataset.angle) || 0;
          const baseX = parseFloat(berry.dataset.baseX) || 0;
          const baseY = parseFloat(berry.dataset.baseY) || 0;
          rx += (targetRx - rx) * 0.1;
          ry += (targetRy - ry) * 0.1;
          angle += 0.2 * speedMult;
          berry.dataset.rx = rx;
          berry.dataset.ry = ry;
          berry.dataset.angle = angle;
          const dur = [5, 7, 6, 8, 5.5, 6.5, 9, 11, 10][i % 9];
          const phase = (time + i * 0.7) * (Math.PI * 2 / dur);
          const floatY = Math.sin(phase) * 15;
          const floatAngle = Math.cos(phase) * 6;
          berry.style.transform = `translate(calc(${rx + baseX}px), calc(${ry + baseY}px + ${floatY}px)) rotate(calc(${angle}deg + ${floatAngle}deg))`;
        });
      }
      root.querySelectorAll(".leaf").forEach((leaf, i) => {
        const dur = 10 + i * 2;
        const phase = (time + i * 1.2) * (Math.PI * 2 / dur);
        const floatY = Math.sin(phase) * 20;
        const floatX = Math.cos(phase * 0.5) * 15;
        const floatAngle = Math.sin(phase * 0.3) * 15;
        leaf.style.transform = `translate(${floatX}px, ${floatY}px) rotate(${floatAngle}deg)`;
      });
      raf = requestAnimationFrame(animate);
    }
    animate();
    const timeouts = /* @__PURE__ */ new Set();
    function createBubble() {
      const bubble = document.createElement("img");
      bubble.src = A.bubble;
      bubble.className = "bubble-img";
      bubble.style.width = Math.random() * 20 + 10 + "px";
      bubble.style.height = "auto";
      bubble.style.left = Math.random() * 100 + "%";
      bubble.style.bottom = "-50px";
      bubble.style.opacity = String(Math.random() * 0.4 + 0.2);
      const duration = Math.random() * 6 + 4;
      bubble.style.animation = `floatUpImg ${duration}s linear forwards`;
      bubblesContainer.appendChild(bubble);
      const t = setTimeout(() => {
        bubble.remove();
        timeouts.delete(t);
      }, duration * 1e3);
      timeouts.add(t);
    }
    const bubbleInterval = setInterval(createBubble, 400);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(bubbleInterval);
      timeouts.forEach(clearTimeout);
      window.removeEventListener("mousemove", onMouseMove);
      modelViewer.removeEventListener("load", onLoad);
      cardHandlers.forEach(([c, h]) => c.removeEventListener("click", h));
      gsap.killTweensOf(document.body);
      document.body.classList.remove("blue-theme");
      document.body.style.removeProperty("--bg-inner");
      document.body.style.removeProperty("--bg-mid");
      document.body.style.removeProperty("--bg-outer");
    };
  }, []);
  const mv = (src, cls, orbit, exposure) => <model-viewer
    key={cls}
    class={`${cls.startsWith("l") ? "leaf" : "berry"} ${cls}`}
    src={src}
    environment-image="neutral"
    exposure={exposure}
    interaction-prompt="none"
    camera-orbit={orbit}
  />;
  return <div ref={rootRef}>
      <Head>
        <title>Diet Soda | Pure Zero Refreshment</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Experience the crisp, clean taste of Diet Soda. Zero sugar, zero compromise." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
    href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Inter:wght@400;500&family=Manrope:wght@400;700&family=Galada&display=swap"
    rel="stylesheet"
  />
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </Head>
      <div id="bubbles-container" />

      <header className="header">
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>Soda</span>
        </div>
        <nav className="nav glass">
          <a href="#" className="nav-item active">Home</a>
          <a href="#" className="nav-item">Ingredients</a>
          <a href="#" className="nav-item">Taste</a>
          <a href="#" className="nav-item">Eco</a>
          <a href="#" className="nav-item">Reviews</a>
        </nav>
        <button className="contact-btn">Contact Us</button>
      </header>

      <main className="hero">
        <div className="hero-content">
          <div className="leaves-container">
            {LEAVES.map(([c, o]) => mv(A.leaves, c, o, "1.0"))}
          </div>

          <div className="hero-left">
            <h1 className="main-title large-animation-1">
              <span className="outline">Pure</span>
              <br />
              Zero
            </h1>
            <p className="description">
              Unleash the crisp taste of zero sugar. <br />
              Refreshment redefined in every bubble — <br />
              all in one sleek design.
            </p>
            <div className="cta-group">
              <button className="primary-btn">
                Shop Now
                <span className="plus-icon">+</span>
              </button>
            </div>
            <div className="award-badge">
              <div className="award-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15L15 18L19 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="award-text">
                <span className="award-title">DESIGN AWARDS</span>
                <span className="award-subtitle">PREMIUM BEVERAGE 2025</span>
              </div>
            </div>
          </div>

          <div className="berries-container-bg">
            {BG_BERRIES.map(([c, o]) => mv(A.cherry, c, o, "1.0"))}
          </div>

          <div className="hero-center">
            <model-viewer
    id="product-model"
    src={A.can}
    alt="Diet Soda 3D Model"
    camera-controls=""
    disable-zoom=""
    shadow-intensity="0"
    environment-image="neutral"
    exposure="1.5"
    interaction-prompt="none"
    camera-orbit="0deg 90deg 380%"
    field-of-view="30deg"
    class="main-product-3d"
  />
          </div>

          <div className="berries-container">
            {FG_BERRIES.map(([c, o]) => mv(A.cherry, c, o, "1.2"))}
          </div>

          <div className="hero-right">
            <div className="product-carousel">
              <div className="carousel-cards">
                <div className="card active" data-flavor="classic">
                  {
    /* eslint-disable-next-line @next/next/no-img-element */
  }
                  <img src={A.greenSoda} alt="Diet Classic" />
                  <div className="card-info">
                    <span>Diet Classic</span>
                    <span>$2.99</span>
                  </div>
                </div>
                <div className="card" data-flavor="blue">
                  {
    /* eslint-disable-next-line @next/next/no-img-element */
  }
                  <img src={A.blueSoda} alt="Zero Lime" style={{ filter: "brightness(0.7)" }} />
                  <div className="card-info">
                    <span>Zero Lime</span>
                    <span>$2.99</span>
                  </div>
                </div>
              </div>
              <div className="carousel-nav">
                <button className="nav-arrow">←</button>
                <button className="nav-arrow">→</button>
              </div>
            </div>
            <h2 className="side-title large-animation-1">
              <span className="outline">Refreshingly</span>
              <br />
              Clean
            </h2>
          </div>
        </div>
      </main>

      <svg style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}>
        <filter id="frosted">
          <feTurbulence type="fractalNoise" baseFrequency="0.0125" numOctaves={3} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="80" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {
    /* Preload berry models */
  }
      <div style={{ display: "none" }}>
        <model-viewer src={A.blueberry} />
        <model-viewer src={A.cherry} />
      </div>
    </div>;
}