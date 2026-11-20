import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eraser,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { STORYTELLING_SCENES } from '../data/educationalContent';

type AnimationModeId = '2d' | '3d' | 'whiteboard' | 'storytelling';

const ANIMATION_MODES: Array<{
  id: AnimationModeId;
  label: string;
  tagline: string;
}> = [
  { id: '2d', label: '2D Animation', tagline: 'Force, motion & physics vectors' },
  { id: '3d', label: '3D Animation', tagline: '3D spatial orbits & atomic models' },
  { id: 'whiteboard', label: 'Digital Whiteboard', tagline: 'Step-by-step math & live sketch' },
  { id: 'storytelling', label: 'Storytelling Lessons', tagline: 'Concepts through memorable stories' },
];

const WHITEBOARD_STEPS = [
  {
    step: 'Step 1 · Standard Form',
    equation: 'x² − 5x + 6 = 0',
    note: 'Yahan a = 1, b = −5, aur c = 6 identify karo.',
  },
  {
    step: 'Step 2 · Discriminant (D)',
    equation: 'D = b² − 4ac = (−5)² − 4(1)(6) = 25 − 24 = 1',
    note: 'Kyunki D > 0 hai, is equation ke 2 distinct real roots honge.',
  },
  {
    step: 'Step 3 · Apply Formula',
    equation: 'x = (5 ± √1) / 2  ⇒  x = 3  or  x = 2',
    note: 'Dono values original equation mein put karke verify kar sakte ho!',
  },
];

export function AnimationShowcaseSection() {
  const [mode, setMode] = useState<AnimationModeId>('2d');

  // 2D Physics Simulation State
  const [forceN, setForceN] = useState(24);
  const [massKg, setMassKg] = useState(4);
  const [simPlaying, setSimPlaying] = useState(true);
  const [blockX, setBlockX] = useState(12);

  const acceleration = Number((forceN / massKg).toFixed(2));

  const blockWidth = 42 + massKg * 3.5;
  const arrowTotalWidth = 34 + forceN * 1.1;
  const maxTranslateX = Math.max(120, 470 - blockWidth - arrowTotalWidth);

  useEffect(() => {
    if (mode !== '2d' || !simPlaying) return;
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      setBlockX((prev) => {
        const next = prev + acceleration * dt * 28;
        return next > maxTranslateX ? 20 : next;
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mode, simPlaying, acceleration, maxTranslateX]);

  // 3D Atom / Orbit Canvas State
  const canvas3dRef = useRef<HTMLCanvasElement | null>(null);
  const [orbitTilt, setOrbitTilt] = useState(28);
  const [orbitSpeed, setOrbitSpeed] = useState(1.2);
  const [orbitPlaying, setOrbitPlaying] = useState(true);

  useEffect(() => {
    if (mode !== '3d') return;
    const canvas = canvas3dRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let angle = 0;

    const drawFrame = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const tiltRad = (orbitTilt * Math.PI) / 180;

      ctx.clearRect(0, 0, w, h);

      // Subtle coordinate grid
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      for (let gx = 40; gx < w; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 40; gy < h; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      const orbits = [
        { rx: 135, ry: 52, rot: -tiltRad, color: '#60A5FA', phase: 0, speed: 1 },
        { rx: 135, ry: 52, rot: tiltRad, color: '#A78BFA', phase: 2.1, speed: 1.35 },
        { rx: 110, ry: 40, rot: 0, color: '#38BDF8', phase: 4.2, speed: 0.85 },
      ];

      // Draw orbital ellipses
      for (const orb of orbits) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(orb.rot);
        ctx.strokeStyle = `${orb.color}55`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, orb.rx, orb.ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Nucleus
      const grad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 20);
      grad.addColorStop(0, '#DDD6FE');
      grad.addColorStop(0.5, '#7C3AED');
      grad.addColorStop(1, '#3B0764');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fill();

      // Draw electrons with pseudo-3D depth scaling
      for (const orb of orbits) {
        const theta = angle * orb.speed + orb.phase;
        const lx = Math.cos(theta) * orb.rx;
        const ly = Math.sin(theta) * orb.ry;
        const cosR = Math.cos(orb.rot);
        const sinR = Math.sin(orb.rot);
        const px = cx + lx * cosR - ly * sinR;
        const py = cy + lx * sinR + ly * cosR;
        const depthScale = 0.75 + 0.45 * ((Math.sin(theta) + 1) / 2);

        ctx.fillStyle = orb.color;
        ctx.beginPath();
        ctx.arc(px, py, 6.5 * depthScale, 0, Math.PI * 2);
        ctx.fill();
      }

      if (orbitPlaying) {
        angle += 0.02 * orbitSpeed;
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    drawFrame();
    return () => cancelAnimationFrame(rafId);
  }, [mode, orbitTilt, orbitSpeed, orbitPlaying]);

  // Digital Whiteboard State
  const boardRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [wbStep, setWbStep] = useState(0);
  const [penColor, setPenColor] = useState('#6D28D9');

  const getBoardCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = boardRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handleBoardDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = boardRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const { x, y } = getBoardCoords(e);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleBoardMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = boardRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { x, y } = getBoardCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleBoardUp = () => {
    isDrawingRef.current = false;
  };

  const clearWhiteboard = () => {
    const canvas = boardRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Storytelling State
  const [storyIndex, setStoryIndex] = useState(0);
  const currentStory = STORYTELLING_SCENES[storyIndex];

  return (
    <section
      id="animations"
      className="py-16 lg:py-20 bg-white border-y border-slate-200/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#6D28D9]">
            Learn Through Animation
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1221] [text-wrap:balance]">
            Interactive animations ke saath khud try karke samjho.
          </h2>
          <p className="mt-2.5 text-base text-slate-600">
            Sirf padhna kaafi nahi hota — values change karo, 3D model ghumaao, whiteboard par solve karo aur stories dekho.
          </p>
        </div>

        {/* 4 Mode Segmented Tabs */}
        <div
          role="tablist"
          aria-label="Animation teaching styles"
          className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {ANIMATION_MODES.map((item) => {
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setMode(item.id)}
                className={`text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                  active
                    ? 'bg-[#0B1221] text-white border-[#0B1221] shadow-sm'
                    : 'bg-[#F8FAFC] text-[#0B1221] border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <p className="font-display text-sm sm:text-base font-bold whitespace-nowrap">
                  {item.label}
                </p>
                <p
                  className={`mt-1 text-xs leading-snug ${
                    active ? 'text-blue-200' : 'text-slate-500'
                  }`}
                >
                  {item.tagline}
                </p>
              </button>
            );
          })}
        </div>

        {/* Two-Zone Educational Sandbox */}
        <div className="mt-6 rounded-2xl border border-slate-200 overflow-hidden bg-[#F8FAFC] grid grid-cols-1 lg:grid-cols-12">
          {/* Left Zone: Interactive Visual Stage (7 cols) */}
          <div className="lg:col-span-7 bg-[#0B1221] text-white p-6 flex flex-col justify-between min-h-[340px]">
            {mode === '2d' && (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-blue-200 font-medium">
                      2D Physics Lab · Newton's Second Law
                    </p>
                    <h3 className="font-display text-xl font-bold">
                      Force, Mass & Acceleration (F = m × a)
                    </h3>
                  </div>
                  <span
                    data-testid="physics-acceleration-readout"
                    className="font-mono tabular-nums text-sm sm:text-base font-semibold text-purple-200 bg-white/10 px-3 py-1.5 rounded-lg"
                  >
                    a = {acceleration} m/s²
                  </span>
                </div>

                {/* Animated Track */}
                <div className="my-6 relative h-44 rounded-xl bg-[#131E35] border border-white/10 overflow-hidden p-4 flex flex-col justify-end">
                  {/* Vector Force Indicator */}
                  <svg
                    viewBox="0 0 500 130"
                    className="w-full h-full"
                    role="img"
                    aria-label={`Animated block of mass ${massKg} kg pushed by ${forceN} Newtons accelerating at ${acceleration} meters per second squared`}
                  >
                    {/* Track Ground */}
                    <line
                      x1="16"
                      y1="106"
                      x2="484"
                      y2="106"
                      stroke="#334155"
                      strokeWidth="2"
                    />
                    {[60, 140, 220, 300, 380, 460].map((tick) => (
                      <line
                        key={tick}
                        x1={tick}
                        y1="106"
                        x2={tick}
                        y2="114"
                        stroke="#475569"
                        strokeWidth="1.5"
                      />
                    ))}

                    {/* Moving Block */}
                    <g transform={`translate(${blockX * 4.2}, 48)`}>
                      <rect
                        x="0"
                        y="6"
                        width={42 + massKg * 3.5}
                        height="50"
                        rx="8"
                        fill="#2563EB"
                        stroke="#93C5FD"
                        strokeWidth="1.5"
                      />
                      <text
                        x={(42 + massKg * 3.5) / 2}
                        y="36"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="13"
                        fontFamily="IBM Plex Mono, monospace"
                        fontWeight="600"
                      >
                        {massKg}kg
                      </text>

                      {/* Force Arrow */}
                      <line
                        x1={46 + massKg * 3.5}
                        y1="31"
                        x2={64 + massKg * 3.5 + forceN * 1.3}
                        y2="31"
                        stroke="#A78BFA"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                      <polygon
                        points={`${64 + massKg * 3.5 + forceN * 1.3},24 ${76 + massKg * 3.5 + forceN * 1.3},31 ${64 + massKg * 3.5 + forceN * 1.3},38`}
                        fill="#A78BFA"
                      />
                      <text
                        x={58 + massKg * 3.5 + forceN * 0.65}
                        y="19"
                        textAnchor="middle"
                        fill="#DDD6FE"
                        fontSize="12"
                        fontFamily="IBM Plex Mono, monospace"
                      >
                        F = {forceN}N
                      </text>
                    </g>
                  </svg>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 font-mono tabular-nums">
                  <span>Force: {forceN} N</span>
                  <span>Mass: {massKg} kg</span>
                  <span>Formula: a = F / m = {forceN} / {massKg}</span>
                </div>
              </>
            )}

            {mode === '3d' && (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-blue-200 font-medium">
                      3D Spatial Model · Atomic Orbitals
                    </p>
                    <h3 className="font-display text-xl font-bold">
                      3D Electron Shell & Nucleus Visualization
                    </h3>
                  </div>
                  <span className="font-mono tabular-nums text-xs text-blue-200">
                    Tilt {orbitTilt}° · {orbitSpeed.toFixed(1)}x
                  </span>
                </div>

                <div className="my-4 rounded-xl bg-[#070C18] border border-white/10 overflow-hidden flex items-center justify-center">
                  <canvas
                    ref={canvas3dRef}
                    width={520}
                    height={230}
                    data-testid="atom-3d-canvas"
                    className="w-full h-[230px] block"
                  />
                </div>

                <p className="text-xs text-slate-300">
                  Electrons alag-alag 3D planes mein nucleus ke chaaron taraf high speed par move karte hain.
                </p>
              </>
            )}

            {mode === 'whiteboard' && (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-blue-200 font-medium">
                      Interactive Digital Whiteboard · Quadratic Equations
                    </p>
                    <h3 className="font-display text-xl font-bold">
                      {WHITEBOARD_STEPS[wbStep].step}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={clearWhiteboard}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
                  >
                    <Eraser className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Clear Sketch</span>
                  </button>
                </div>

                <div className="my-4 relative rounded-xl bg-white border border-slate-300 overflow-hidden">
                  <div className="px-4 py-3 bg-[#EFF6FF] border-b border-slate-200 text-[#0B1221]">
                    <p className="font-mono text-sm sm:text-base font-semibold text-[#4C1D95]">
                      {WHITEBOARD_STEPS[wbStep].equation}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {WHITEBOARD_STEPS[wbStep].note}
                    </p>
                  </div>
                  <div className="relative h-44 bg-white">
                    <span className="pointer-events-none absolute top-2.5 right-3 text-[11px] text-slate-400">
                      Draw or practice here with mouse / touch
                    </span>
                    <canvas
                      ref={boardRef}
                      width={560}
                      height={180}
                      onPointerDown={handleBoardDown}
                      onPointerMove={handleBoardMove}
                      onPointerUp={handleBoardUp}
                      onPointerLeave={handleBoardUp}
                      className="w-full h-full touch-none cursor-crosshair block"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span>Pen:</span>
                    {['#6D28D9', '#0B1221', '#2563EB'].map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        aria-label={`Select pen color ${hex}`}
                        onClick={() => setPenColor(hex)}
                        style={{ backgroundColor: hex }}
                        className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                          penColor === hex ? 'border-white scale-110' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                  <span>Interactive Practice Canvas</span>
                </div>
              </>
            )}

            {mode === 'storytelling' && (
              <>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-mono text-blue-200 tabular-nums">
                    {currentStory.chapter}
                  </p>
                  <span className="text-xs font-mono text-purple-200 tabular-nums">
                    {storyIndex + 1} / {STORYTELLING_SCENES.length}
                  </span>
                </div>

                <div className="my-5 p-6 rounded-xl bg-gradient-to-br from-[#131E35] to-[#1E2E4D] border border-white/10 space-y-4">
                  <h3 className="font-display text-2xl font-bold text-white leading-snug">
                    {currentStory.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                    {currentStory.story}
                  </p>
                  <div className="pt-3 border-t border-white/15">
                    <p className="text-xs font-semibold text-blue-200">
                      Core Science Principle
                    </p>
                    <p className="mt-1 font-mono text-xs sm:text-sm text-white">
                      {currentStory.concept}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setStoryIndex(
                        (prev) =>
                          (prev - 1 + STORYTELLING_SCENES.length) %
                          STORYTELLING_SCENES.length
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    <span>Previous Scene</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStoryIndex((prev) => (prev + 1) % STORYTELLING_SCENES.length)
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#6D28D9] hover:bg-[#7C3AED] text-xs font-semibold cursor-pointer"
                  >
                    <span>Next Scene</span>
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Zone: Control & Concept Deck (5 cols) */}
          <div className="lg:col-span-5 p-6 flex flex-col justify-between bg-white">
            {mode === '2d' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-display text-lg font-bold text-[#0B1221]">
                    Live Controls — Khud Test Karo
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Force badhao ya mass kam karo aur dekho block ka acceleration turant kaise badalta hai.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <label htmlFor="slider-force" className="font-medium text-[#0B1221]">
                        Applied Force (F)
                      </label>
                      <span className="font-mono tabular-nums font-semibold text-[#6D28D9]">
                        {forceN} N
                      </span>
                    </div>
                    <input
                      id="slider-force"
                      type="range"
                      min={5}
                      max={60}
                      step={1}
                      value={forceN}
                      onChange={(e) => setForceN(Number(e.target.value))}
                      className="mt-2 w-full accent-[#6D28D9] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <label htmlFor="slider-mass" className="font-medium text-[#0B1221]">
                        Object Mass (m)
                      </label>
                      <span className="font-mono tabular-nums font-semibold text-[#2563EB]">
                        {massKg} kg
                      </span>
                    </div>
                    <input
                      id="slider-mass"
                      type="range"
                      min={1}
                      max={12}
                      step={1}
                      value={massKg}
                      onChange={(e) => setMassKg(Number(e.target.value))}
                      className="mt-2 w-full accent-[#2563EB] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSimPlaying((p) => !p)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#1E2E4D] rounded-xl cursor-pointer"
                  >
                    {simPlaying ? (
                      <>
                        <Pause className="w-4 h-4" aria-hidden="true" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" aria-hidden="true" />
                        <span>Play</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForceN(24);
                      setMassKg(4);
                      setBlockX(12);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            )}

            {mode === '3d' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-display text-lg font-bold text-[#0B1221]">
                    3D Model Parameters
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Chemistry aur Physics ke 3D atomic shapes aur planetary orbits ko alag angles se dekho.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <label htmlFor="slider-tilt" className="font-medium text-[#0B1221]">
                        Orbital Plane Tilt
                      </label>
                      <span className="font-mono tabular-nums font-semibold text-[#6D28D9]">
                        {orbitTilt}°
                      </span>
                    </div>
                    <input
                      id="slider-tilt"
                      type="range"
                      min={0}
                      max={75}
                      value={orbitTilt}
                      onChange={(e) => setOrbitTilt(Number(e.target.value))}
                      className="mt-2 w-full accent-[#6D28D9] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <label htmlFor="slider-speed" className="font-medium text-[#0B1221]">
                        Rotation Speed
                      </label>
                      <span className="font-mono tabular-nums font-semibold text-[#2563EB]">
                        {orbitSpeed.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      id="slider-speed"
                      type="range"
                      min={0.4}
                      max={3}
                      step={0.2}
                      value={orbitSpeed}
                      onChange={(e) => setOrbitSpeed(Number(e.target.value))}
                      className="mt-2 w-full accent-[#2563EB] cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOrbitPlaying((p) => !p)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#1E2E4D] rounded-xl cursor-pointer w-fit"
                >
                  {orbitPlaying ? (
                    <>
                      <Pause className="w-4 h-4" aria-hidden="true" />
                      <span>Pause Orbit</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" aria-hidden="true" />
                      <span>Resume Orbit</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {mode === 'whiteboard' && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-display text-lg font-bold text-[#0B1221]">
                    Step-by-Step Board Derivation
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Har maths problem ko step-by-step likh kar aur draw karke solve karne ki practice karo.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {WHITEBOARD_STEPS.map((item, idx) => (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => setWbStep(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                        wbStep === idx
                          ? 'bg-[#EFF6FF] border-[#6D28D9]'
                          : 'bg-[#F8FAFC] border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-xs font-semibold text-[#6D28D9]">{item.step}</p>
                      <p className="mt-0.5 font-mono text-xs text-[#0B1221]">{item.equation}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'storytelling' && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-display text-lg font-bold text-[#0B1221]">
                    Storytelling se Long-Term Memory
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Facts bhool jaate hain, par kahaniyan yaad rehti hain! VIDYORA complex scientific discoveries ko real stories mein badalta hai.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {STORYTELLING_SCENES.map((scene, idx) => (
                    <button
                      key={scene.chapter}
                      type="button"
                      onClick={() => setStoryIndex(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                        storyIndex === idx
                          ? 'bg-[#EFF6FF] border-[#6D28D9]'
                          : 'bg-[#F8FAFC] border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-xs font-mono text-slate-500">{scene.chapter}</p>
                      <p className="mt-0.5 text-sm font-semibold text-[#0B1221]">
                        {scene.title}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 leading-relaxed">
              Visual learning se conceptual clarity badhti hai — formulas yaad karna natural ban jata hai.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
