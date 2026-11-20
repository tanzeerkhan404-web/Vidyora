import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Eye,
  EyeOff,
  FileImage,
  HelpCircle,
  ImagePlus,
  Lightbulb,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  AIStatusResponse,
  DoubtSolution,
  DoubtSolverSubject,
  DoubtSolveStyle,
  LearningLevel,
  StudyBuddyLevel,
  StudyBuddySubject,
} from '../../types/vidyora';
import { APIRequestError, requestDoubtSolver } from '../../utils/aiClient';
import {
  DOUBT_SOLVER_SUBJECTS,
  STUDY_BUDDY_LEVELS,
  STUDY_BUDDY_SUBJECTS,
  formatDoubtSolutionForCopy,
  formatMathUnicode,
  mapProfileLevelToBuddyLevel,
  validateDoubtImageFile,
} from '../../utils/studyBuddyLogic';

interface AIDoubtSolverPanelProps {
  aiStatus: AIStatusResponse | null;
  defaultLevel: LearningLevel;
  onRemainingUpdate: (remaining: number, dailyRemaining?: number) => void;
  onAskFollowUpInBuddy: (prompt: string, subject?: StudyBuddySubject) => void;
  onGeneratePracticeQuiz: (topic: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function createSampleMathQuestionImage(): {
  dataUrl: string;
  base64: string;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle notebook lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let y = 76; y < 500; y += 44) {
      ctx.beginPath();
      ctx.moveTo(48, y);
      ctx.lineTo(912, y);
      ctx.stroke();
    }

    // Margin line
    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(110, 28);
    ctx.lineTo(110, 512);
    ctx.stroke();

    ctx.fillStyle = '#6D28D9';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Class 10 Mathematics — Sample Practice Question', 136, 64);

    ctx.fillStyle = '#0B1221';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('Q. Solve the quadratic equation by factorization:', 136, 152);

    ctx.fillStyle = '#1E3A8A';
    ctx.font = 'bold 46px monospace';
    ctx.fillText('2x² - 7x + 3 = 0', 190, 246);

    ctx.fillStyle = '#334155';
    ctx.font = '26px sans-serif';
    ctx.fillText('Also verify the sum and product of its roots.', 136, 336);
  }

  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1] || '';
  return {
    dataUrl,
    base64,
    mimeType: 'image/png',
    fileName: 'sample-quadratic-question.png',
    sizeBytes: Math.round((base64.length * 3) / 4),
  };
}

export function AIDoubtSolverPanel({
  aiStatus,
  defaultLevel,
  onRemainingUpdate,
  onAskFollowUpInBuddy,
  onGeneratePracticeQuiz,
}: AIDoubtSolverPanelProps) {
  const [subject, setSubject] = useState<DoubtSolverSubject>('Auto Detect');
  const [buddyLevel, setBuddyLevel] = useState<StudyBuddyLevel>(() =>
    mapProfileLevelToBuddyLevel(defaultLevel)
  );
  const [note, setNote] = useState('');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [dragActive, setDragActive] = useState(false);

  // Live Camera Modal State
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Solve State
  const [loading, setLoading] = useState(false);
  const [activeStyle, setActiveStyle] = useState<DoubtSolveStyle>('standard');
  const [error, setError] = useState<string | null>(null);
  const [solution, setSolution] = useState<DoubtSolution | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPracticeHint, setShowPracticeHint] = useState(false);
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const isConfigured = aiStatus?.configured ?? false;

  useEffect(() => {
    setBuddyLevel(mapProfileLevelToBuddyLevel(defaultLevel));
  }, [defaultLevel]);

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraReady(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const processSelectedFile = (file: File) => {
    setError(null);
    const validationErr = validateDoubtImageFile({
      type: file.type,
      size: file.size,
    });
    if (validationErr) {
      setError(validationErr);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64Part = result.split(',')[1] || '';
      if (!base64Part) {
        setError('Image read nahi ho payi. Kripya koi doosri photo choose karein.');
        return;
      }
      setPreviewUrl(result);
      setImageBase64(base64Part);
      setMimeType(file.type);
      setFileName(file.name);
      setFileSize(file.size);
      setSolution(null);
      setActiveStyle('standard');
      setShowPracticeHint(false);
      setShowPracticeAnswer(false);
    };
    reader.onerror = () => {
      setError('Image load karte waqt error aaya. Dobara try karein.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setImageBase64(null);
    setFileName('');
    setFileSize(0);
    setSolution(null);
    setError(null);
    setShowPracticeHint(false);
    setShowPracticeAnswer(false);
  };

  const handleOpenCamera = async () => {
    setCameraError(null);
    setError(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      // Fallback smoothly to native mobile camera picker
      nativeCameraInputRef.current?.click();
      return;
    }

    setCameraOpen(true);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraReady(true);
    } catch {
      stopCameraStream();
      setCameraError(
        'Camera access nahi mil paya (permission denied ya camera available nahi hai). Neeche se directly phone camera / gallery picker use kar sakte hain.'
      );
    }
  };

  const handleCloseCamera = () => {
    stopCameraStream();
    setCameraOpen(false);
    setCameraError(null);
  };

  const handleCaptureFromCamera = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('Camera frame ready nahi hua. Ek second ruk kar capture karein.');
      return;
    }

    const canvas = document.createElement('canvas');
    const maxWidth = 1400;
    const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    const base64Part = dataUrl.split(',')[1] || '';
    const estimatedBytes = Math.round((base64Part.length * 3) / 4);

    const validationErr = validateDoubtImageFile({
      type: 'image/jpeg',
      size: estimatedBytes,
    });
    if (validationErr) {
      setCameraError(validationErr);
      return;
    }

    setPreviewUrl(dataUrl);
    setImageBase64(base64Part);
    setMimeType('image/jpeg');
    setFileName(`camera-question-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.jpg`);
    setFileSize(estimatedBytes);
    setSolution(null);
    setActiveStyle('standard');
    setShowPracticeHint(false);
    setShowPracticeAnswer(false);
    handleCloseCamera();
  };

  const handleLoadSampleQuestion = () => {
    setError(null);
    const sample = createSampleMathQuestionImage();
    setPreviewUrl(sample.dataUrl);
    setImageBase64(sample.base64);
    setMimeType(sample.mimeType);
    setFileName(sample.fileName);
    setFileSize(sample.sizeBytes);
    setSubject('Mathematics');
    setSolution(null);
    setActiveStyle('standard');
    setShowPracticeHint(false);
    setShowPracticeAnswer(false);
  };

  const solveWithStyle = async (solveStyle: DoubtSolveStyle) => {
    setError(null);
    if (!imageBase64) {
      setError('Pehle apne question ki clear photo upload ya capture karein.');
      return;
    }
    if (!isConfigured) {
      setError(
        'AI Doubt Solver abhi active nahi hai kyunki secure backend AI setup pending hai. Fake solution show nahi kiya jayega.'
      );
      return;
    }

    setLoading(true);
    setActiveStyle(solveStyle);
    setShowPracticeHint(false);
    setShowPracticeAnswer(false);

    try {
      const res = await requestDoubtSolver({
        imageBase64,
        mimeType,
        note: note.trim() || undefined,
        level: buddyLevel,
        subject,
        solveStyle,
      });

      setSolution(res.solution);
      onRemainingUpdate(res.remaining, res.dailyRemaining);
    } catch (err) {
      if (err instanceof APIRequestError) {
        setError(err.message);
      } else {
        setError(
          'Network error: Question analyze nahi ho paya. Internet check karke dobara try karein.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopySolution = async () => {
    if (!solution) return;
    try {
      await navigator.clipboard.writeText(formatDoubtSolutionForCopy(solution));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Solution copy nahi ho paya. Text manually copy karein.');
    }
  };

  const handleAskFollowUp = () => {
    if (!solution) return;
    const matchedSubject = STUDY_BUDDY_SUBJECTS.find(
      (s) => s.toLowerCase() === solution.detectedSubject.toLowerCase()
    );
    const prompt = `Maine abhi AI Doubt Solver mein yeh question solve karwaya:\n"${solution.extractedQuestion}"\nFinal answer mila: ${solution.finalAnswer}\n\nIske step-by-step logic ko aur detail mein samjhao aur mujhe batao kaunsi common mistake avoid karni chahiye.`;
    onAskFollowUpInBuddy(prompt, matchedSubject);
  };

  const handleGeneratePractice = () => {
    if (!solution) return;
    const topic =
      solution.subjectTopic?.trim() ||
      solution.detectedSubject?.trim() ||
      'Practice Topic';
    onGeneratePracticeQuiz(topic);
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Inputs */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload question image from gallery"
      />
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Capture question photo using device camera"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Upload, Camera Capture & Subject/Level Controls */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-[#0B1221] via-[#131F3A] to-[#1D1B4B] text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6D28D9] text-white flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-white">
                  AI Doubt Solver
                </h2>
                <p className="text-xs text-blue-200/90">
                  Photo upload ya camera capture karo — step-by-step solution pao
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Image Upload / Preview Area */}
            {!previewUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-[#6D28D9] bg-[#F5F3FF]'
                    : 'border-slate-300 bg-[#F8FAFC] hover:border-[#6D28D9]/60'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-blue-200 text-[#2563EB] flex items-center justify-center mx-auto">
                  <ImagePlus className="w-6 h-6" aria-hidden="true" />
                </div>
                <p className="mt-3 font-display text-sm sm:text-base font-bold text-[#0B1221]">
                  Question ki Photo Upload ya Click Karein
                </p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Textbook, notebook ya worksheet ka clear photo daalein (PNG, JPG, WebP · Max 4 MB)
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#1E293B] rounded-xl transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    <span>Upload from Gallery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleOpenCamera()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold text-[#6D28D9] bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-purple-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" aria-hidden="true" />
                    <span>Capture with Camera</span>
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={handleLoadSampleQuestion}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
                  >
                    <FileImage className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Try Sample Math Question Image</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] overflow-hidden">
                <div className="relative bg-[#0B1221]/5 flex items-center justify-center p-3">
                  <img
                    src={previewUrl}
                    alt="Uploaded question preview"
                    className="max-h-64 w-auto object-contain rounded-xl border border-slate-200 bg-white shadow-2xs"
                  />
                </div>
                <div className="px-4 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#0B1221] truncate max-w-[200px]">
                      {fileName || 'question-image'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatFileSize(fileSize)} · Ready for Vision AI
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[34px] text-xs font-semibold text-[#0B1221] bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Replace</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[34px] text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Subject Selection (Auto Detect + 8 Core Subjects) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="doubt-subject"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
                >
                  Subject
                </label>
                <select
                  id="doubt-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as DoubtSolverSubject)}
                  className="w-full px-3 py-2.5 min-h-[42px] text-sm font-semibold text-[#0B1221] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/30 focus:border-[#6D28D9]"
                >
                  {DOUBT_SOLVER_SUBJECTS.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj === 'Auto Detect' ? 'Auto Detect Subject' : subj}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="doubt-level"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
                >
                  Learning Level
                </label>
                <select
                  id="doubt-level"
                  value={buddyLevel}
                  onChange={(e) => setBuddyLevel(e.target.value as StudyBuddyLevel)}
                  className="w-full px-3 py-2.5 min-h-[42px] text-sm font-semibold text-[#0B1221] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/30 focus:border-[#6D28D9]"
                >
                  {STUDY_BUDDY_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Note */}
            <div>
              <label
                htmlFor="doubt-note"
                className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
              >
                Optional Note (e.g. sirf Q2 solve karo)
              </label>
              <input
                id="doubt-note"
                type="text"
                maxLength={250}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Jaise: Sirf part (b) step-by-step samjhao..."
                className="w-full px-3.5 py-2.5 min-h-[42px] text-sm text-[#0B1221] placeholder:text-slate-400 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/30 focus:border-[#6D28D9] focus:bg-white"
              />
            </div>

            {/* Validation / Network / Quota Error */}
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-2.5"
              >
                <AlertCircle
                  className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span className="flex-1 leading-relaxed">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              disabled={loading || !imageBase64}
              onClick={() => void solveWithStyle('standard')}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] text-sm font-bold text-white bg-[#6D28D9] hover:bg-[#5B21B6] disabled:bg-slate-300 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              {loading && activeStyle === 'standard' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Analyzing Image & Solving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  <span>Solve Question Step by Step</span>
                </>
              )}
            </button>

            {/* Privacy & Security Guarantee */}
            <div className="p-3 rounded-xl bg-[#EFF6FF]/70 border border-blue-200/70 flex items-start gap-2 text-[11px] text-slate-700 leading-relaxed">
              <ShieldCheck
                className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>
                <strong>Privacy Protected:</strong> Uploaded photos sirf turant doubt solve karne ke liye securely analyze hoti hain — permanently save nahi ki jaati.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Structured Step-by-Step Solution */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 min-h-[540px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] border border-purple-200 text-[#6D28D9] flex items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin" aria-hidden="true" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="font-display text-lg font-bold text-[#0B1221]">
                  {activeStyle === 'simpler'
                    ? 'Aur zyada simple Hinglish mein samjha raha hoon...'
                    : activeStyle === 'alternative-method'
                      ? 'Second / alternative method tayar kar raha hoon...'
                      : 'Vision AI question aur equations read kar raha hai...'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Given data, formulas aur step-by-step calculation verify karke structured answer banaya ja raha hai.
                </p>
              </div>
            </div>
          ) : !solution ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 px-4 space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] border border-purple-200 text-[#6D28D9] flex items-center justify-center">
                <BookOpen className="w-7 h-7" aria-hidden="true" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#0B1221]">
                  Structured Step-by-Step Solution Yahan Dikhega
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Image upload karne ke baad VIDYORA Vision AI question read karega aur aapko har detail clearly dega:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg text-left">
                {[
                  'Question Understood & Diagrams',
                  'Given Info & Required Answer',
                  'Relevant Formulas & Equations',
                  'Numbered Step-by-Step Solution',
                  'Final Answer + Explanation',
                  'Important Point & Similar Practice Q',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 text-xs font-medium text-slate-700"
                  >
                    <CheckCircle2
                      className="w-4 h-4 text-[#6D28D9] shrink-0"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : !solution.readable ? (
            /* Unreadable / Blurry Photo Honest Guard */
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7" aria-hidden="true" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="font-display text-lg font-bold text-[#0B1221]">
                  Photo Clear Nahi Hai — Question Read Nahi Ho Paya
                </h3>
                <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3.5 leading-relaxed">
                  {solution.unreadableReason ||
                    'Uploaded image blurry, dark ya cropped lag rahi hai. Galat answer guess karne ke bajay, kripya ek clear photo upload karein.'}
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 text-left max-w-sm">
                <li>• Question par achhi light rakhein aur shadow avoid karein.</li>
                <li>• Camera ko page ke bilkul seedha (parallel) pakdein.</li>
                <li>• Sirf ek question ko frame mein clear focus ke saath click karein.</li>
              </ul>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-xs sm:text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#1E293B] rounded-xl cursor-pointer"
                >
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  <span>Upload Clearer Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleOpenCamera()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-xs sm:text-sm font-semibold text-[#6D28D9] bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-purple-200 rounded-xl cursor-pointer"
                >
                  <Camera className="w-4 h-4" aria-hidden="true" />
                  <span>Retake with Camera</span>
                </button>
              </div>
            </div>
          ) : (
            /* Complete Structured Solution View */
            <div className="space-y-5">
              {/* Top Meta & Mode Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 text-xs font-bold bg-[#0B1221] text-white rounded-lg">
                    {solution.detectedSubject}
                  </span>
                  <span className="px-3 py-1 text-xs font-semibold bg-[#EFF6FF] text-[#1E3A8A] border border-blue-200 rounded-lg">
                    {solution.subjectTopic}
                  </span>
                  {activeStyle !== 'standard' && (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-[#F5F3FF] text-[#6D28D9] border border-purple-200 rounded-lg">
                      {activeStyle === 'simpler' ? 'Simpler Explanation' : 'Alternative Method'}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCopySolution}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      <span className="text-emerald-700">Solution Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copy Solution</span>
                    </>
                  )}
                </button>
              </div>

              {/* 1. Question Understood */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  1. Question Understood
                </p>
                <p className="text-sm sm:text-base font-semibold text-[#0B1221] leading-relaxed">
                  {formatMathUnicode(solution.extractedQuestion)}
                </p>
                {solution.diagramObservations && (
                  <p className="text-xs text-slate-600 pt-1">
                    <strong>Diagram / Visual Note:</strong>{' '}
                    {formatMathUnicode(solution.diagramObservations)}
                  </p>
                )}
              </div>

              {/* 2 & 3. Given Information + Required Answer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                    2. Given Information
                  </p>
                  {solution.givenInformation.length > 0 ? (
                    <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                      {solution.givenInformation.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0 mt-2" />
                          <span>{formatMathUnicode(item)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-600">
                      Direct question statement (no separate numerical values listed).
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#6D28D9]">
                    3. Required Answer
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-[#0B1221] leading-relaxed">
                    {formatMathUnicode(solution.requiredAnswer)}
                  </p>
                </div>
              </div>

              {/* 4. Relevant Formula */}
              <div className="p-4 rounded-xl bg-[#F5F3FF] border border-purple-200/80 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#6D28D9]">
                  4. Relevant Formula / Concept
                </p>
                {solution.relevantFormulas.length > 0 ? (
                  <div className="space-y-1.5">
                    {solution.relevantFormulas.map((formula, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 rounded-lg bg-white border border-purple-200 font-mono text-xs sm:text-sm font-semibold text-[#0B1221] overflow-x-auto"
                      >
                        {formatMathUnicode(formula)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-[#0B1221]">
                    {formatMathUnicode(solution.conceptUsed)}
                  </p>
                )}
              </div>

              {/* 5. Step-by-Step Solution */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  5. Step-by-Step Solution
                </p>
                <div className="space-y-2.5">
                  {solution.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3"
                    >
                      <span className="w-7 h-7 rounded-lg bg-[#6D28D9] text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                        {step.stepNumber}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-display text-sm font-bold text-[#0B1221]">
                          {formatMathUnicode(step.title)}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {formatMathUnicode(step.explanation)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Final Answer */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0B1221] to-[#1A2747] text-white space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  6. Final Answer
                </p>
                <p className="font-display text-base sm:text-lg font-bold text-white">
                  {formatMathUnicode(solution.finalAnswer)}
                </p>
                {solution.finalAnswerExplanation && (
                  <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
                    {formatMathUnicode(solution.finalAnswerExplanation)}
                  </p>
                )}
              </div>

              {/* 7. Important Learning Point */}
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
                <Lightbulb
                  className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    7. Important Learning Point
                  </p>
                  <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                    {formatMathUnicode(
                      solution.importantLearningPoint || solution.practiceTip
                    )}
                  </p>
                </div>
              </div>

              {/* 8. Similar Practice Question */}
              {solution.similarPracticeQuestion?.question && (
                <div className="p-4 rounded-xl bg-[#EFF6FF]/75 border border-blue-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle
                      className="w-4 h-4 text-[#2563EB] shrink-0"
                      aria-hidden="true"
                    />
                    <p className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
                      Similar Practice Question (Khud Try Karo!)
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#0B1221] leading-relaxed">
                    {formatMathUnicode(solution.similarPracticeQuestion.question)}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPracticeHint((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] text-xs font-semibold text-[#1E3A8A] bg-white hover:bg-blue-50 border border-blue-200 rounded-lg cursor-pointer"
                    >
                      {showPracticeHint ? (
                        <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>{showPracticeHint ? 'Hide Hint' : 'Show Hint'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPracticeAnswer((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] text-xs font-semibold text-[#6D28D9] bg-white hover:bg-purple-50 border border-purple-200 rounded-lg cursor-pointer"
                    >
                      {showPracticeAnswer ? (
                        <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>{showPracticeAnswer ? 'Hide Answer' : 'Show Answer'}</span>
                    </button>
                  </div>

                  {showPracticeHint && solution.similarPracticeQuestion.hint && (
                    <p className="text-xs text-slate-700 bg-white/90 p-3 rounded-lg border border-blue-200/80">
                      <strong>Hint:</strong>{' '}
                      {formatMathUnicode(solution.similarPracticeQuestion.hint)}
                    </p>
                  )}

                  {showPracticeAnswer && solution.similarPracticeQuestion.answer && (
                    <p className="text-xs font-semibold text-emerald-900 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                      <strong>Answer:</strong>{' '}
                      {formatMathUnicode(solution.similarPracticeQuestion.answer)}
                    </p>
                  )}
                </div>
              )}

              {/* Extra Student Actions Toolbar */}
              <div className="pt-3 border-t border-slate-200 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Extra Options
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void solveWithStyle('simpler')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold text-[#6D28D9] bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-purple-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Explain more simply</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void solveWithStyle('alternative-method')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold text-[#0B1221] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Give another method</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGeneratePractice}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold text-[#1E3A8A] bg-[#EFF6FF] hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Generate practice questions</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAskFollowUp}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold text-white bg-[#0B1221] hover:bg-[#1E293B] rounded-xl transition-colors cursor-pointer"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Ask a follow-up question</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Camera Capture Modal */}
      {cameraOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1221]/75 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Capture question photo with camera"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 bg-[#0B1221] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-purple-300" aria-hidden="true" />
                <h3 className="font-display text-sm sm:text-base font-bold">
                  Capture Question Photo
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseCamera}
                aria-label="Close camera"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {cameraError ? (
                <div className="space-y-3 text-center py-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{cameraError}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseCamera();
                        nativeCameraInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-xs sm:text-sm font-semibold text-white bg-[#6D28D9] hover:bg-[#5B21B6] rounded-xl cursor-pointer"
                    >
                      <Camera className="w-4 h-4" aria-hidden="true" />
                      <span>Use Device Camera Picker</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseCamera();
                        galleryInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-xs sm:text-sm font-semibold text-[#0B1221] bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                    >
                      <Upload className="w-4 h-4" aria-hidden="true" />
                      <span>Choose from Gallery</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative aspect-video bg-[#0B1221] rounded-xl overflow-hidden flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {!cameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0B1221]/80 text-white text-xs gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Starting camera...</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 text-center">
                    Question ko clear focus aur achhi roshni mein frame karein, phir Capture dabayein.
                  </p>
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={handleCloseCamera}
                      className="px-4 py-2.5 min-h-[42px] text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!cameraReady}
                      onClick={handleCaptureFromCamera}
                      className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] text-xs sm:text-sm font-bold text-white bg-[#6D28D9] hover:bg-[#5B21B6] disabled:bg-slate-300 rounded-xl cursor-pointer"
                    >
                      <Camera className="w-4 h-4" aria-hidden="true" />
                      <span>Capture Photo</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
