import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Brain,
  Compass,
  ExternalLink,
  FlaskConical,
  Headphones,
  Lightbulb,
  Mic,
  MicOff,
  Network,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Square,
  Trash2,
  Volume2,
} from 'lucide-react';
import {
  AUDIO_CHAPTER_SUMMARIES,
  CAREER_PATHWAYS,
  CONCEPT_MODELS,
  OFFICIAL_SCHOLARSHIP_PORTALS,
  SIGNATURE_EXPERIENCES,
} from '../data/innovationsCatalog';
import { askStudyBuddyApi } from '../utils/aiClient';
import { getLanguageMeta, type AppLanguage } from '../utils/i18n';
import type { LearningLevel } from '../types/vidyora';

interface InnovationsHubPageProps {
  currentLanguage: AppLanguage;
  defaultLevel: LearningLevel;
}

type InnovationTab =
  | 'science-lab'
  | 'visualizer'
  | 'mind-map'
  | 'voice-audio'
  | 'signature'
  | 'career-scholarships';

export function InnovationsHubPage({
  currentLanguage,
  defaultLevel,
}: InnovationsHubPageProps) {
  const [tab, setTab] = useState<InnovationTab>('science-lab');

  // --- Virtual Science Lab states ---
  const [labSubject, setLabSubject] = useState<'physics' | 'chemistry' | 'biology'>('physics');
  // Physics: Simple Pendulum T = 2*pi*sqrt(L/g)
  const [pendulumLengthM, setPendulumLengthM] = useState(1.0);
  const [gravityMs2, setGravityMs2] = useState(9.8);
  const pendulumPeriod = useMemo(
    () => 2 * Math.PI * Math.sqrt(pendulumLengthM / gravityMs2),
    [pendulumLengthM, gravityMs2]
  );
  // Chemistry: Acid-Base pH Neutralization
  const [acidDrops, setAcidDrops] = useState(5);
  const [baseDrops, setBaseDrops] = useState(5);
  const simulatedPh = useMemo(() => {
    const diff = baseDrops - acidDrops;
    return Math.max(1, Math.min(13, Number((7 + diff * 0.6).toFixed(1))));
  }, [acidDrops, baseDrops]);
  // Biology: Photosynthesis rate
  const [lightIntensity, setLightIntensity] = useState(70);
  const [co2Level, setCo2Level] = useState(65);
  const oxygenBubblesPerMin = useMemo(
    () => Math.round(Math.min(lightIntensity, co2Level) * 0.6),
    [lightIntensity, co2Level]
  );

  // --- Concept Visualizer ---
  const [modelSearch, setModelSearch] = useState('');
  const [selectedModelId, setSelectedModelId] = useState(CONCEPT_MODELS[0].id);
  const [activeHotspotId, setActiveHotspotId] = useState(CONCEPT_MODELS[0].hotspots[0].id);
  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    return CONCEPT_MODELS.filter(
      (m) =>
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q)
    );
  }, [modelSearch]);
  const activeModel =
    CONCEPT_MODELS.find((m) => m.id === selectedModelId) || CONCEPT_MODELS[0];
  const activeHotspot =
    activeModel.hotspots.find((h) => h.id === activeHotspotId) || activeModel.hotspots[0];

  // --- Mind Map Builder ---
  const [centralConcept, setCentralConcept] = useState('Photosynthesis');
  const [branches, setBranches] = useState<Array<{ id: string; title: string; notes: string }>>([
    { id: 'b1', title: 'Inputs', notes: 'Sunlight, Water (H₂O), Carbon Dioxide (CO₂)' },
    { id: 'b2', title: 'Site', notes: 'Chloroplast (Thylakoid & Stroma)' },
    { id: 'b3', title: 'Outputs', notes: 'Glucose (C₆H₁₂O₆) + Oxygen (O₂)' },
  ]);
  const [newBranchTitle, setNewBranchTitle] = useState('');
  const [newBranchNotes, setNewBranchNotes] = useState('');

  // --- Voice AI & Audio Learning ---
  const langMeta = getLanguageMeta(currentLanguage);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [voiceInput, setVoiceInput] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceAnswer, setVoiceAnswer] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // --- Knowledge Detective ---
  const [detectiveIdx, setDetectiveIdx] = useState(0);
  const [detectivePick, setDetectivePick] = useState<number | null>(null);

  const speechSynthesisSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (id: string, text: string) => {
    if (!speechSynthesisSupported) {
      setVoiceError('Text-to-speech is unavailable in this browser. Read the transcript below.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langMeta.speechLang;
    utterance.rate = speechRate;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesisSupported) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
  };

  const startVoiceRecognition = () => {
    setVoiceError(null);
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
    };
    const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError(
        'Browser microphone speech recognition is not supported on this device/browser. Type your question manually below — Voice AI will still speak the explanation!'
      );
      return;
    }
    const rec = new Recognition();
    rec.lang = langMeta.speechLang;
    rec.interimResults = false;
    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) setVoiceInput(transcript);
    };
    rec.onerror = () => {
      setListening(false);
      setVoiceError('Microphone capture failed or permission denied. You can type your question manually below.');
    };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };

  const handleAskVoiceAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceInput.trim()) return;
    setVoiceLoading(true);
    setVoiceError(null);
    try {
      const resp = await askStudyBuddyApi({
        question: voiceInput.trim(),
        level: defaultLevel,
        mode: 'simple',
        subject: 'General Knowledge',
        language: langMeta.name,
      });
      setVoiceAnswer(resp.answer);
      if (speechSynthesisSupported) {
        speakText('voice-ai-answer', resp.answer.replace(/[*#$`]/g, ''));
      }
    } catch (err) {
      setVoiceError(
        err instanceof Error
          ? err.message
          : 'AI backend temporarily unavailable. Try again or use Audio Chapter Summaries.'
      );
    } finally {
      setVoiceLoading(false);
    }
  };

  const detectiveCase = SIGNATURE_EXPERIENCES.knowledgeDetective[detectiveIdx];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0B1221] via-[#131E35] to-[#2E1065] text-white p-6 sm:p-8 border border-white/10 shadow-xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-purple-200">
          <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
          <span>VIDYORA Labs, Voice AI &amp; Signature Experiences</span>
        </span>
        <h1 className="mt-2.5 font-display text-2xl sm:text-3xl font-extrabold">
          Explore Concepts Visually, Interactively &amp; By Voice
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Browser-based science simulations, interactive concept models, mind mapping, multilingual Voice AI &amp; audio summaries, our 5 curiosity experiences, and official scholarship portals.
        </p>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="VIDYORA Innovations Sections"
        className="flex items-center gap-1.5 p-1.5 bg-slate-200/75 rounded-xl overflow-x-auto"
      >
        {(
          [
            { id: 'science-lab', label: 'Virtual Science Lab', icon: FlaskConical },
            { id: 'visualizer', label: 'Concept Visualizer', icon: Brain },
            { id: 'mind-map', label: 'Mind Map Builder', icon: Network },
            { id: 'voice-audio', label: 'Voice AI & Audio', icon: Headphones },
            { id: 'signature', label: '5 Curious Experiences', icon: Sparkles },
            { id: 'career-scholarships', label: 'Careers & Scholarships', icon: Compass },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-white text-[#0B1221] shadow-xs'
                  : 'text-slate-600 hover:text-[#0B1221]'
              }`}
            >
              <Icon className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: VIRTUAL SCIENCE LAB */}
      {tab === 'science-lab' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>Simulation Limitation &amp; Safety Notice:</strong> These lightweight browser-based simulations demonstrate scientific relationships visually for conceptual learning. They are NOT replacements for supervised physical school laboratories—always wear goggles and follow teacher safety rules in real labs.
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'physics', label: 'Physics: Simple Pendulum' },
                { id: 'chemistry', label: 'Chemistry: Acid-Base pH Lab' },
                { id: 'biology', label: 'Biology: Photosynthesis Rate' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setLabSubject(s.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  labSubject === s.id
                    ? 'bg-[#6D28D9] text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {labSubject === 'physics' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-white rounded-2xl border border-slate-200 p-6">
              <div className="lg:col-span-5 space-y-4">
                <h2 className="font-display text-lg font-bold text-[#0B1221]">
                  Simple Pendulum Time Period Lab
                </h2>
                <p className="text-xs font-mono bg-[#F5F3FF] text-[#6D28D9] px-3 py-2 rounded-lg">
                  Formula: T = 2π × √(L / g)
                </p>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    String Length (L): {pendulumLengthM.toFixed(2)} m
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="4.0"
                    step="0.1"
                    value={pendulumLengthM}
                    onChange={(e) => setPendulumLengthM(Number(e.target.value))}
                    className="w-full accent-[#6D28D9]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Gravity (g): {gravityMs2.toFixed(1)} m/s² ({gravityMs2 === 1.6 ? 'Moon' : gravityMs2 === 9.8 ? 'Earth' : 'Custom'})
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGravityMs2(9.8)}
                      className="px-2.5 py-1 rounded bg-slate-100 text-xs font-semibold cursor-pointer"
                    >
                      Earth (9.8)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGravityMs2(1.6)}
                      className="px-2.5 py-1 rounded bg-slate-100 text-xs font-semibold cursor-pointer"
                    >
                      Moon (1.6)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGravityMs2(3.7)}
                      className="px-2.5 py-1 rounded bg-slate-100 text-xs font-semibold cursor-pointer"
                    >
                      Mars (3.7)
                    </button>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#0B1221] text-white">
                  <p className="text-xs text-blue-200">Calculated Oscillation Period (T)</p>
                  <p className="font-display text-2xl font-extrabold tabular-nums">
                    {pendulumPeriod.toFixed(2)} seconds
                  </p>
                </div>
              </div>
              <div className="lg:col-span-7 flex flex-col justify-between bg-slate-50 rounded-2xl border border-slate-200 p-5">
                <svg viewBox="0 0 320 220" className="w-full max-h-56" aria-label="Pendulum diagram">
                  <line x1="80" y1="20" x2="240" y2="20" stroke="#0B1221" strokeWidth="6" strokeLinecap="round" />
                  <line
                    x1="160"
                    y1="20"
                    x2={160 + Math.sin(0.35) * (40 + pendulumLengthM * 32)}
                    y2={20 + Math.cos(0.35) * (40 + pendulumLengthM * 32)}
                    stroke="#6D28D9"
                    strokeWidth="3"
                  />
                  <circle
                    cx={160 + Math.sin(0.35) * (40 + pendulumLengthM * 32)}
                    cy={20 + Math.cos(0.35) * (40 + pendulumLengthM * 32)}
                    r="16"
                    fill="#2563EB"
                  />
                  <text x="16" y="205" fontSize="12" fill="#475569">
                    Observation: Increasing L increases T as √L; lower gravity slows the swing.
                  </text>
                </svg>
              </div>
            </div>
          )}

          {labSubject === 'chemistry' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-white rounded-2xl border border-slate-200 p-6">
              <div className="lg:col-span-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-[#0B1221]">
                  Acid-Base Neutralization &amp; Universal Indicator Lab
                </h2>
                <p className="text-xs font-mono bg-[#F5F3FF] text-[#6D28D9] px-3 py-2 rounded-lg">
                  HCl (Acid) + NaOH (Base) → NaCl (Salt) + H₂O (Water)
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Dilute Acid Drops (HCl): {acidDrops}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={acidDrops}
                    onChange={(e) => setAcidDrops(Number(e.target.value))}
                    className="w-full accent-rose-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Dilute Base Drops (NaOH): {baseDrops}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={baseDrops}
                    onChange={(e) => setBaseDrops(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
              <div className="lg:col-span-6 p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-center items-center text-center space-y-3">
                <div
                  className="w-28 h-28 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-display text-2xl font-extrabold"
                  style={{
                    backgroundColor:
                      simulatedPh < 6.5
                        ? '#DC2626'
                        : simulatedPh > 7.5
                        ? '#2563EB'
                        : '#16A34A',
                  }}
                >
                  pH {simulatedPh}
                </div>
                <p className="text-sm font-bold text-[#0B1221]">
                  {simulatedPh < 6.5
                    ? 'Acidic Solution (Red/Orange Indicator)'
                    : simulatedPh > 7.5
                    ? 'Basic / Alkaline Solution (Blue/Violet Indicator)'
                    : 'Neutral Solution (Green Indicator — Neutralized!)'}
                </p>
                <p className="text-xs text-slate-600">
                  Safety: Never add water to concentrated acid; always dilute carefully under supervision.
                </p>
              </div>
            </div>
          )}

          {labSubject === 'biology' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-white rounded-2xl border border-slate-200 p-6">
              <div className="lg:col-span-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-[#0B1221]">
                  Photosynthesis Limiting Factors Simulation
                </h2>
                <p className="text-xs font-mono bg-emerald-50 text-emerald-800 px-3 py-2 rounded-lg">
                  6CO₂ + 6H₂O + Sunlight → C₆H₁₂O₆ + 6O₂
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Light Intensity: {lightIntensity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={lightIntensity}
                    onChange={(e) => setLightIntensity(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Dissolved CO₂ Availability: {co2Level}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={co2Level}
                    onChange={(e) => setCo2Level(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>
              </div>
              <div className="lg:col-span-6 p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-center space-y-2">
                <p className="text-xs font-semibold text-emerald-800 uppercase">
                  Simulated Oxygen Evolution Rate
                </p>
                <p className="font-display text-3xl font-extrabold text-[#0B1221] tabular-nums">
                  {oxygenBubblesPerMin} O₂ bubbles / min
                </p>
                <p className="text-xs text-slate-700">
                  <strong>Limiting Factor:</strong>{' '}
                  {lightIntensity < co2Level
                    ? 'Light intensity is currently limiting the rate (Blackman’s Law).'
                    : co2Level < lightIntensity
                    ? 'CO₂ availability is currently limiting the rate.'
                    : 'Light and CO₂ are balanced at this setting.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONCEPT VISUALIZER */}
      {tab === 'visualizer' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                placeholder="Search interactive models (Heart, Cell, Electromagnetic)..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs"
              />
            </div>
            <span className="text-[11px] text-slate-500">
              Lightweight browser SVG interactive models (fast on low-bandwidth Android devices)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 space-y-2.5">
              {filteredModels.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedModelId(m.id);
                    setActiveHotspotId(m.hotspots[0].id);
                  }}
                  className={`w-full p-4 rounded-2xl border text-left cursor-pointer ${
                    activeModel.id === m.id
                      ? 'bg-[#F5F3FF] border-[#6D28D9]'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-[11px] font-semibold text-[#6D28D9]">
                    {m.subject} • {m.level}
                  </p>
                  <p className="font-display text-sm font-bold text-[#0B1221] mt-0.5">
                    {m.title}
                  </p>
                </button>
              ))}
            </div>

            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B1221]">
                  {activeModel.title}
                </h2>
                <p className="text-xs text-slate-600 mt-1">{activeModel.summary}</p>
              </div>

              <div className="relative rounded-2xl bg-[#0B1221] h-64 overflow-hidden border border-slate-800">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#8B5CF6_0%,_transparent_70%)]" />
                {activeModel.hotspots.map((spot) => {
                  const selected = activeHotspot.id === spot.id;
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => setActiveHotspotId(spot.id)}
                      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full text-xs font-bold transition-transform cursor-pointer ${
                        selected
                          ? 'bg-[#6D28D9] text-white scale-105 ring-4 ring-purple-400/40'
                          : 'bg-white text-[#0B1221] hover:bg-blue-50'
                      }`}
                    >
                      {spot.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-[#EFF6FF] border border-blue-200">
                <p className="text-xs font-bold text-[#2563EB]">{activeHotspot.label}</p>
                <p className="text-sm text-[#0B1221] mt-1">{activeHotspot.explanation}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MIND MAP BUILDER */}
      {tab === 'mind-map' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0B1221]">
                Interactive Visual Mind Map Studio
              </h2>
              <p className="text-xs text-slate-600">
                Organise any chapter visually into a central concept and connected sub-branches.
              </p>
            </div>
            <input
              type="text"
              value={centralConcept}
              onChange={(e) => setCentralConcept(e.target.value)}
              aria-label="Central mind map concept"
              className="px-3.5 py-2 rounded-xl border border-purple-300 bg-[#F5F3FF] text-sm font-bold text-[#0B1221]"
            />
          </div>

          <div className="flex flex-col items-center py-4">
            <div className="px-6 py-3 rounded-2xl bg-[#0B1221] text-white font-display text-base font-extrabold shadow-md">
              {centralConcept || 'Central Concept'}
            </div>
            <div className="w-0.5 h-6 bg-purple-300" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              {branches.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-sm font-bold text-[#6D28D9]">{b.title}</p>
                    <button
                      type="button"
                      onClick={() => setBranches((prev) => prev.filter((x) => x.id !== b.id))}
                      aria-label={`Remove branch ${b.title}`}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{b.notes}</p>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newBranchTitle.trim()) return;
              setBranches((prev) => [
                ...prev,
                { id: `b-${Date.now()}`, title: newBranchTitle.trim(), notes: newBranchNotes.trim() },
              ]);
              setNewBranchTitle('');
              setNewBranchNotes('');
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-200"
          >
            <input
              type="text"
              required
              value={newBranchTitle}
              onChange={(e) => setNewBranchTitle(e.target.value)}
              placeholder="New branch title (e.g. Formulas)"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
            <input
              type="text"
              value={newBranchNotes}
              onChange={(e) => setNewBranchNotes(e.target.value)}
              placeholder="Key sub-points..."
              className="px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#6D28D9] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add Mind Map Branch</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: VIDYORA VOICE AI & LEARN THROUGH AUDIO */}
      {tab === 'voice-audio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Voice AI Assistant */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-bold text-[#0B1221] flex items-center gap-2">
                  <Mic className="w-5 h-5 text-[#6D28D9]" aria-hidden="true" />
                  <span>VIDYORA Voice AI ({langMeta.nativeName})</span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Ask via microphone or type manually — receives multilingual AI explanation &amp; speaks aloud using free browser Speech Synthesis.
                </p>
              </div>
              <select
                value={speechRate}
                onChange={(e) => setSpeechRate(Number(e.target.value))}
                aria-label="Audio playback speed"
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value={0.8}>0.8x</option>
                <option value={1}>1.0x</option>
                <option value={1.25}>1.25x</option>
              </select>
            </div>

            <form onSubmit={handleAskVoiceAI} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startVoiceRecognition}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shrink-0 ${
                    listening
                      ? 'bg-red-600 text-white'
                      : 'bg-[#F5F3FF] text-[#6D28D9] border border-purple-200'
                  }`}
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{listening ? 'Listening...' : 'Speak'}</span>
                </button>
                <input
                  type="text"
                  value={voiceInput}
                  onChange={(e) => setVoiceInput(e.target.value)}
                  placeholder={`Ask a question in ${langMeta.name} (manual fallback always works)...`}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
              <button
                type="submit"
                disabled={voiceLoading}
                className="w-full py-2.5 rounded-xl bg-[#0B1221] hover:bg-[#1E2E4D] text-white text-xs font-semibold cursor-pointer"
              >
                {voiceLoading ? 'Thinking & preparing explanation...' : 'Ask VIDYORA Voice AI'}
              </button>
            </form>

            {voiceError && (
              <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                {voiceError}
              </p>
            )}

            {voiceAnswer && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#6D28D9]">Spoken Explanation</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => speakText('voice-ai-answer', voiceAnswer.replace(/[*#$`]/g, ''))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-[11px] font-semibold cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Repeat
                    </button>
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-[11px] font-semibold cursor-pointer"
                    >
                      <Square className="w-3 h-3" /> Stop
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {voiceAnswer}
                </p>
              </div>
            )}

            <p className="text-[11px] text-slate-500">
              Cost Transparency: Uses zero-cost browser Web Speech API + existing backend Gemini route (no extra paid TTS/STT service activated). Optional neural cloud voices (Google Cloud TTS/STT) require paid billing if enabled later.
            </p>
          </div>

          {/* Learn Through Audio Summaries */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-[#0B1221] flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
              <span>Learn Through Audio — Chapter Revision Summaries</span>
            </h2>
            <div className="space-y-3">
              {AUDIO_CHAPTER_SUMMARIES.map((item) => {
                const isPlaying = speakingId === item.id;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold text-[#6D28D9]">
                          {item.subject} • {item.level}
                        </p>
                        <h3 className="text-sm font-bold text-[#0B1221]">{item.title}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          isPlaying ? stopSpeaking() : speakText(item.id, item.transcript)
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#6D28D9] text-white text-xs font-semibold shrink-0 cursor-pointer"
                      >
                        {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isPlaying ? 'Stop' : 'Listen'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.transcript}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ALL 5 VIDYORA SIGNATURE EXPERIENCES */}
      {tab === 'signature' && (
        <div className="space-y-6">
          {/* 1. Curiosity Vault & 2. Wrong Answer Museum */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h2 className="font-display text-base font-bold text-[#0B1221] flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" aria-hidden="true" />
                <span>1. Curiosity Vault</span>
              </h2>
              {SIGNATURE_EXPERIENCES.curiosityVault.map((c) => (
                <div key={c.title} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <p className="text-xs font-bold text-[#0B1221]">{c.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{c.answer}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h2 className="font-display text-base font-bold text-[#0B1221]">
                2. Wrong Answer Museum (Busting Common Myths)
              </h2>
              {SIGNATURE_EXPERIENCES.wrongAnswerMuseum.map((m) => (
                <div key={m.myth} className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-200/70 space-y-1">
                  <p className="text-xs font-bold text-rose-900">Myth: “{m.myth}”</p>
                  <p className="text-xs text-emerald-900">
                    <strong>Scientific Truth:</strong> {m.truth}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. What If? & 4. Knowledge Detective */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h2 className="font-display text-base font-bold text-[#0B1221]">
                3. VIDYORA What If?
              </h2>
              {SIGNATURE_EXPERIENCES.whatIfPrompts.map((w) => (
                <div key={w.question} className="p-3.5 rounded-xl bg-[#F5F3FF] border border-purple-200 space-y-1">
                  <p className="text-xs font-bold text-[#6D28D9]">{w.question}</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{w.scientificAnalysis}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-[#0B1221]">
                  4. Knowledge Detective
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setDetectiveIdx((i) => (i + 1) % SIGNATURE_EXPERIENCES.knowledgeDetective.length);
                    setDetectivePick(null);
                  }}
                  className="text-xs font-semibold text-[#6D28D9] hover:underline cursor-pointer"
                >
                  Next Mystery →
                </button>
              </div>
              <p className="text-sm font-bold text-[#0B1221]">{detectiveCase.title}</p>
              <ul className="space-y-1 text-xs text-slate-700 list-disc pl-4">
                {detectiveCase.clues.map((clue) => (
                  <li key={clue}>{clue}</li>
                ))}
              </ul>
              <div className="grid grid-cols-2 gap-2">
                {detectiveCase.options.map((opt, idx) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setDetectivePick(idx)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                      detectivePick === idx
                        ? idx === detectiveCase.correctIndex
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                          : 'bg-red-50 border-red-300 text-red-900'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {detectivePick !== null && (
                <p className="text-xs font-medium text-[#2563EB]">{detectiveCase.explanation}</p>
              )}
            </div>
          </div>

          {/* 5. Real Life Classroom */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-[#0B1221]">
              5. Real Life Classroom — Where Textbook Concepts Power Everyday Life
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SIGNATURE_EXPERIENCES.realLifeClassroom.map((r) => (
                <div key={r.topic} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <p className="text-xs font-bold text-[#2563EB]">{r.topic}</p>
                  <p className="text-xs font-semibold text-[#0B1221]">{r.everydayUse}</p>
                  <p className="text-xs text-slate-600">{r.insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CAREER GUIDANCE & OFFICIAL SCHOLARSHIP HUB */}
      {tab === 'career-scholarships' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0B1221]">
                Career Guidance Overview
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Informational overview of major Indian academic pathways. This is general educational guidance—not personalised career counselling or an admission/job guarantee.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CAREER_PATHWAYS.map((c) => (
                <div key={c.track} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="font-display text-sm font-bold text-[#0B1221]">{c.track}</h3>
                  <p className="text-xs text-[#6D28D9] font-semibold">Key Exams: {c.exams}</p>
                  <p className="text-xs text-slate-700">Core Skills: {c.skills}</p>
                  <p className="text-xs text-slate-600">{c.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0B1221]">
                Official Indian Scholarship Hub
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Verified official government portals only. Always verify current academic-year eligibility rules and deadlines directly on the official portal—VIDYORA never invents scholarship deadlines.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {OFFICIAL_SCHOLARSHIP_PORTALS.map((s) => (
                <div
                  key={s.name}
                  className="p-4 rounded-xl bg-[#EFF6FF]/60 border border-blue-200 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <h3 className="font-display text-sm font-bold text-[#0B1221]">{s.name}</h3>
                    <p className="text-[11px] font-semibold text-[#2563EB]">{s.authority}</p>
                    <p className="text-xs text-slate-700">{s.eligibilitySummary}</p>
                    <p className="text-[11px] text-amber-900 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                      {s.deadlineStatus}
                    </p>
                  </div>
                  <a
                    href={s.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1221] text-white text-xs font-semibold"
                  >
                    <span>Visit Official Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
