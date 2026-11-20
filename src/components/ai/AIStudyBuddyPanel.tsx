import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Bot,
  Check,
  Cloud,
  Copy,
  Eraser,
  History,
  Lock,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type {
  AIStatusResponse,
  FirebaseAuthUser,
  LearningLevel,
  StudyBuddyLevel,
  StudyBuddyMessage,
  StudyBuddyMode,
  StudyBuddySession,
  StudyBuddySubject,
} from '../../types/vidyora';
import { APIRequestError, requestStudyBuddy } from '../../utils/aiClient';
import {
  deriveSessionTitle,
  parseInlineSegments,
  validateStudyBuddyInput,
} from '../../utils/eduLogic';
import {
  STUDY_BUDDY_LEVELS,
  STUDY_BUDDY_MODES,
  STUDY_BUDDY_SUBJECTS,
  SUBJECT_SUGGESTED_QUESTIONS,
  deleteStudySessionById,
  formatMathUnicode,
  mapProfileLevelToBuddyLevel,
  parseMessageBlocks,
  prepareTextForSpeech,
  sanitizeChatTextForStorage,
} from '../../utils/studyBuddyLogic';
import {
  clearAllUserStudyChatsInDb,
  deleteStudyChatFromDb,
  saveStudyChatToDb,
  subscribeUserStudyChats,
} from '../../services/studyChatRepository';

const LOCAL_SESSIONS_KEY = 'vidyora_study_buddy_sessions_v2';

const FOLLOW_UP_CHIPS: Array<{
  label: string;
  prompt: string;
  mode?: StudyBuddyMode;
}> = [
  {
    label: 'Real-life example do',
    prompt: 'Iska ek aasaan real-life example do jisse yeh hamesha yaad rahe.',
    mode: 'real-life',
  },
  {
    label: 'Step-by-step breakdown',
    prompt: 'Isse aur zyada clearly step-by-step break karke samjhao.',
    mode: 'step-by-step',
  },
  {
    label: 'Short revision summary',
    prompt: 'Ab iska 4–5 bullet points mein crisp exam revision summary de do.',
    mode: 'short-summary',
  },
  {
    label: 'Teacher style mein samjhao',
    prompt: 'Ek supportive teacher ki tarah samjhao aur end mein 1 chhota check question pucho.',
    mode: 'teacher',
  },
  {
    label: 'Practice question pucho',
    prompt: 'Isi concept par mujhse 1 practice question pucho, answer pehle mat batana.',
  },
];

function loadLocalSessions(): StudyBuddySession[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StudyBuddySession[]) : [];
  } catch {
    return [];
  }
}

function saveLocalSessions(sessions: StudyBuddySession[]) {
  try {
    const sanitized = sessions.slice(0, 15).map((s) => ({
      ...s,
      title: sanitizeChatTextForStorage(s.title),
      messages: s.messages.slice(-40).map((m) => ({
        ...m,
        content: sanitizeChatTextForStorage(m.content),
      })),
    }));
    window.localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(sanitized));
  } catch {
    // Ignore storage quota errors in restricted browsing modes
  }
}

function createSessionId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function renderInlineFormatted(text: string, isUser: boolean) {
  const segments = parseInlineSegments(text);
  return segments.map((seg, idx) => {
    if (seg.bold) {
      return (
        <strong
          key={idx}
          className={isUser ? 'font-semibold text-white' : 'font-semibold text-[#0B1221]'}
        >
          {formatMathUnicode(seg.text)}
        </strong>
      );
    }
    if (seg.code) {
      return (
        <code
          key={idx}
          className={
            isUser
              ? 'px-1.5 py-0.5 rounded bg-white/15 font-mono text-[0.88em] text-blue-100'
              : 'px-1.5 py-0.5 rounded bg-[#EFF6FF] border border-blue-200/80 font-mono text-[0.88em] text-[#1E3A8A]'
          }
        >
          {formatMathUnicode(seg.text)}
        </code>
      );
    }
    return <span key={idx}>{formatMathUnicode(seg.text)}</span>;
  });
}

function FormattedMessageBody({
  content,
  isUser,
}: {
  content: string;
  isUser: boolean;
}) {
  const blocks = useMemo(() => parseMessageBlocks(content), [content]);

  return (
    <div className="space-y-2 text-sm leading-relaxed break-words">
      {blocks.map((block, index) => {
        if (block.type === 'spacer') {
          return <div key={index} className="h-1" />;
        }

        if (block.type === 'equation') {
          return (
            <div
              key={index}
              className={
                isUser
                  ? 'my-2 px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 font-mono text-sm text-blue-100 overflow-x-auto'
                  : 'my-2 px-3.5 py-2.5 rounded-xl bg-[#F5F3FF] border border-purple-200/80 font-mono text-sm font-semibold text-[#0B1221] overflow-x-auto'
              }
            >
              {block.text}
            </div>
          );
        }

        if (block.type === 'heading') {
          return (
            <p
              key={index}
              className={
                isUser
                  ? 'font-display font-bold text-white pt-1'
                  : 'font-display font-bold text-[#0B1221] pt-1.5 text-[15px]'
              }
            >
              {renderInlineFormatted(block.text, isUser)}
            </p>
          );
        }

        if (block.type === 'numbered') {
          return (
            <div key={index} className="flex items-start gap-2.5">
              <span
                className={
                  isUser
                    ? 'w-5 h-5 rounded-md bg-white/15 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums'
                    : 'w-5 h-5 rounded-md bg-[#6D28D9]/12 text-[#6D28D9] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums'
                }
              >
                {block.marker}
              </span>
              <p className="flex-1 min-w-0">
                {renderInlineFormatted(block.text, isUser)}
              </p>
            </div>
          );
        }

        if (block.type === 'bullet') {
          return (
            <div key={index} className="flex items-start gap-2 pl-0.5">
              <span
                className={
                  isUser
                    ? 'w-1.5 h-1.5 rounded-full bg-purple-300 shrink-0 mt-2'
                    : 'w-1.5 h-1.5 rounded-full bg-[#6D28D9] shrink-0 mt-2'
                }
                aria-hidden="true"
              />
              <p className="flex-1 min-w-0">
                {renderInlineFormatted(block.text, isUser)}
              </p>
            </div>
          );
        }

        return (
          <p key={index} className="whitespace-pre-wrap">
            {renderInlineFormatted(block.text, isUser)}
          </p>
        );
      })}
    </div>
  );
}

interface AIStudyBuddyPanelProps {
  aiStatus: AIStatusResponse | null;
  defaultLevel: LearningLevel;
  authUser: FirebaseAuthUser | null;
  onOpenSignIn: () => void;
  prefillPrompt?: string;
  prefillSubject?: StudyBuddySubject;
  onConsumePrefill?: () => void;
  onRemainingUpdate: (remaining: number, dailyRemaining?: number) => void;
}

export function AIStudyBuddyPanel({
  aiStatus,
  defaultLevel,
  authUser,
  onOpenSignIn,
  prefillPrompt,
  prefillSubject,
  onConsumePrefill,
  onRemainingUpdate,
}: AIStudyBuddyPanelProps) {
  const isCloudSignedIn = Boolean(authUser?.emailVerified);

  const [subject, setSubject] = useState<StudyBuddySubject>('Mathematics');
  const [buddyLevel, setBuddyLevel] = useState<StudyBuddyLevel>(() =>
    mapProfileLevelToBuddyLevel(defaultLevel)
  );
  const [mode, setMode] = useState<StudyBuddyMode>('step-by-step');

  const [localSessions, setLocalSessions] = useState<StudyBuddySession[]>(() =>
    loadLocalSessions()
  );
  const [cloudSessions, setCloudSessions] = useState<StudyBuddySession[]>([]);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);

  const [activeSessionId, setActiveSessionId] = useState<string>(() => createSessionId());
  const [messages, setMessages] = useState<StudyBuddyMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const ttsSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  const isConfigured = aiStatus?.configured ?? false;
  const sessions = isCloudSignedIn ? cloudSessions : localSessions;

  // Sync default profile level if student profile changes while chat is empty
  useEffect(() => {
    if (messages.length === 0) {
      setBuddyLevel(mapProfileLevelToBuddyLevel(defaultLevel));
    }
  }, [defaultLevel, messages.length]);

  // Subscribe to private Firestore chats when signed in with verified account
  useEffect(() => {
    if (!authUser?.emailVerified) {
      setCloudSessions([]);
      setCloudSyncError(null);
      return;
    }

    const unsubscribe = subscribeUserStudyChats(
      authUser.uid,
      (next) => {
        setCloudSessions(next);
        setCloudSyncError(null);
      },
      () => {
        setCloudSyncError(
          'Cloud chat sync temporarily unavailable. Local session smoothly chal rahi hai.'
        );
      }
    );

    return () => unsubscribe();
  }, [authUser?.uid, authUser?.emailVerified]);

  // Handle incoming prefill prompt (e.g., from Video Lesson or AI Doubt Solver follow-up)
  useEffect(() => {
    if (prefillPrompt && prefillPrompt.trim()) {
      setInput(prefillPrompt);
      if (prefillSubject && STUDY_BUDDY_SUBJECTS.includes(prefillSubject)) {
        setSubject(prefillSubject);
      }
      onConsumePrefill?.();
      window.setTimeout(() => textareaRef.current?.focus(), 60);
    }
  }, [prefillPrompt, prefillSubject, onConsumePrefill]);

  // Auto-scroll chat feed when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length, loading]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSpeech = () => {
    if (ttsSupported) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
  };

  const handleToggleSpeech = (msg: StudyBuddyMessage) => {
    if (!ttsSupported) return;
    if (speakingId === msg.id) {
      stopSpeech();
      return;
    }

    window.speechSynthesis.cancel();
    const spokenText = prepareTextForSpeech(msg.content);
    if (!spokenText) return;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.toLowerCase() === 'en-in') ||
      voices.find((v) => v.lang.toLowerCase() === 'hi-in') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    } else {
      utterance.lang = 'en-IN';
    }
    utterance.rate = 0.98;
    utterance.onend = () => setSpeakingId((cur) => (cur === msg.id ? null : cur));
    utterance.onerror = () => setSpeakingId((cur) => (cur === msg.id ? null : cur));

    setSpeakingId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  const persistSessionUpdate = (
    sessionId: string,
    nextMessages: StudyBuddyMessage[],
    nextSubject: StudyBuddySubject,
    nextLevel: StudyBuddyLevel,
    nextMode: StudyBuddyMode
  ) => {
    if (nextMessages.length === 0) return;

    const title = deriveSessionTitle(nextMessages);
    const updatedSession: StudyBuddySession = {
      id: sessionId,
      title,
      level: defaultLevel,
      buddyLevel: nextLevel,
      subject: nextSubject,
      mode: nextMode,
      updatedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      messages: nextMessages,
      source: isCloudSignedIn ? 'cloud' : 'local',
    };

    if (isCloudSignedIn && authUser) {
      const existsInCloud = cloudSessions.some((s) => s.id === sessionId);
      saveStudyChatToDb(
        authUser.uid,
        {
          id: sessionId,
          title,
          subject: nextSubject,
          buddyLevel: nextLevel,
          mode: nextMode,
          messages: nextMessages,
        },
        existsInCloud
      ).catch(() => {
        // Fallback smoothly without interrupting chat UX
      });
    } else {
      setLocalSessions((prev) => {
        const next = [updatedSession, ...prev.filter((s) => s.id !== sessionId)].slice(
          0,
          15
        );
        saveLocalSessions(next);
        return next;
      });
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(formatMathUnicode(text));
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2000);
    } catch {
      setError('Clipboard copy nahi ho paya. Text manually select karke copy karein.');
    }
  };

  const handleNewChat = () => {
    stopSpeech();
    setActiveSessionId(createSessionId());
    setMessages([]);
    setInput('');
    setError(null);
    setConfirmClearAll(false);
    setMobileHistoryOpen(false);
    window.setTimeout(() => textareaRef.current?.focus(), 40);
  };

  const handleClearCurrentChat = () => {
    stopSpeech();
    if (isCloudSignedIn && cloudSessions.some((s) => s.id === activeSessionId)) {
      deleteStudyChatFromDb(activeSessionId).catch(() => {});
    } else {
      setLocalSessions((prev) => {
        const next = deleteStudySessionById(prev, activeSessionId);
        saveLocalSessions(next);
        return next;
      });
    }
    setActiveSessionId(createSessionId());
    setMessages([]);
    setError(null);
  };

  const handleSelectSession = (session: StudyBuddySession) => {
    stopSpeech();
    setActiveSessionId(session.id);
    setMessages(session.messages);
    if (session.subject && STUDY_BUDDY_SUBJECTS.includes(session.subject)) {
      setSubject(session.subject);
    }
    if (session.buddyLevel && STUDY_BUDDY_LEVELS.includes(session.buddyLevel)) {
      setBuddyLevel(session.buddyLevel);
    }
    if (session.mode) {
      setMode(session.mode);
    }
    setError(null);
    setMobileHistoryOpen(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    stopSpeech();
    if (isCloudSignedIn) {
      try {
        await deleteStudyChatFromDb(sessionId);
      } catch {
        setError('Conversation delete nahi ho payi. Dobara try karein.');
        return;
      }
    } else {
      setLocalSessions((prev) => {
        const next = deleteStudySessionById(prev, sessionId);
        saveLocalSessions(next);
        return next;
      });
    }

    if (sessionId === activeSessionId) {
      setActiveSessionId(createSessionId());
      setMessages([]);
    }
  };

  const handleClearAllHistory = async () => {
    stopSpeech();
    if (isCloudSignedIn) {
      try {
        await clearAllUserStudyChatsInDb(cloudSessions.map((s) => s.id));
      } catch {
        setError('Sabhi chats delete nahi ho payi. Dobara try karein.');
        return;
      }
    } else {
      setLocalSessions([]);
      saveLocalSessions([]);
    }
    setActiveSessionId(createSessionId());
    setMessages([]);
    setConfirmClearAll(false);
    setMobileHistoryOpen(false);
  };

  const sendQuestion = async (
    rawQuestion: string,
    overrideMode?: StudyBuddyMode
  ) => {
    setError(null);
    const validationError = validateStudyBuddyInput(rawQuestion);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isConfigured) {
      setError(
        'AI Study Buddy abhi active nahi hai kyunki server par AI configuration pending hai. Fake response show nahi kiya jayega.'
      );
      return;
    }

    const activeMode = overrideMode || mode;
    if (overrideMode) {
      setMode(overrideMode);
    }

    const cleanQuestion = rawQuestion.trim();
    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: StudyBuddyMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: cleanQuestion,
      timestamp: nowTime,
      buddyLevel,
      subject,
      mode: activeMode,
    };

    const nextMessagesWithUser = [...messages, userMsg];
    setMessages(nextMessagesWithUser);
    setInput('');
    setLoading(true);
    stopSpeech();

    try {
      const historyPayload = messages.slice(-12).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await requestStudyBuddy({
        question: cleanQuestion,
        level: buddyLevel,
        mode: activeMode,
        subject,
        history: historyPayload,
      });

      const assistantMsg: StudyBuddyMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        buddyLevel,
        subject,
        mode: activeMode,
      };

      const finalMessages = [...nextMessagesWithUser, assistantMsg];
      setMessages(finalMessages);
      persistSessionUpdate(activeSessionId, finalMessages, subject, buddyLevel, activeMode);
      onRemainingUpdate(res.remaining, res.dailyRemaining);
    } catch (err) {
      if (err instanceof APIRequestError) {
        setError(err.message);
      } else {
        setError(
          'Network error: AI Study Buddy tak request nahi pahunchi. Internet check karke dobara try karein.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (assistantIndex: number) => {
    if (loading || regeneratingId) return;
    if (!isConfigured) {
      setError('AI backend abhi configured nahi hai.');
      return;
    }

    // Find the closest preceding user message
    let userIndex = -1;
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userIndex = i;
        break;
      }
    }
    if (userIndex === -1) return;

    const targetAssistant = messages[assistantIndex];
    const targetQuestion = messages[userIndex].content;
    const historyBefore = messages.slice(0, userIndex).slice(-12).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setError(null);
    setRegeneratingId(targetAssistant.id);
    stopSpeech();

    try {
      const res = await requestStudyBuddy({
        question: targetQuestion,
        level: buddyLevel,
        mode,
        subject,
        history: historyBefore,
      });

      const updatedAssistant: StudyBuddyMessage = {
        ...targetAssistant,
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        buddyLevel,
        subject,
        mode,
      };

      const updatedMessages = messages.map((m, idx) =>
        idx === assistantIndex ? updatedAssistant : m
      );
      setMessages(updatedMessages);
      persistSessionUpdate(activeSessionId, updatedMessages, subject, buddyLevel, mode);
      onRemainingUpdate(res.remaining, res.dailyRemaining);
    } catch (err) {
      if (err instanceof APIRequestError) {
        setError(err.message);
      } else {
        setError('Answer regenerate nahi ho paya. Thodi der baad try karein.');
      }
    } finally {
      setRegeneratingId(null);
    }
  };

  const activeModeLabel =
    STUDY_BUDDY_MODES.find((m) => m.id === mode)?.label ?? 'Step by step';
  const suggestedQuestions = SUBJECT_SUGGESTED_QUESTIONS[subject];

  const renderHistoryList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <History className="w-4 h-4 text-[#6D28D9] shrink-0" aria-hidden="true" />
          <h3 className="font-display text-sm font-bold text-[#0B1221] truncate">
            Saved Chats
          </h3>
        </div>
        <button
          type="button"
          onClick={handleNewChat}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] text-xs font-semibold text-white bg-[#0B1221] hover:bg-[#1E293B] rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>New</span>
        </button>
      </div>

      {/* Sync status banner */}
      <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-b border-slate-200/80">
        {isCloudSignedIn ? (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
            <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>Private Cloud Sync On</span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-600">Saved on this device</span>
            <button
              type="button"
              onClick={onOpenSignIn}
              className="text-[11px] font-semibold text-[#6D28D9] hover:text-[#5B21B6] cursor-pointer whitespace-nowrap"
            >
              Sign in to sync
            </button>
          </div>
        )}
        {cloudSyncError && (
          <p className="mt-1 text-[11px] text-amber-700">{cloudSyncError}</p>
        )}
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {sessions.length === 0 ? (
          <div className="p-4 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70">
            <p className="text-xs font-medium text-slate-600">
              Abhi koi saved chat nahi hai.
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Pehla sawal puchte hi aapki study history yahan safely save hogi.
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                className={`group flex items-start justify-between gap-1.5 p-2.5 rounded-xl border transition-colors ${
                  isActive
                    ? 'bg-[#F5F3FF] border-[#6D28D9]/40'
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectSession(session)}
                  className="flex-1 min-w-0 text-left cursor-pointer"
                >
                  <p className="text-xs font-semibold text-[#0B1221] truncate">
                    {session.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                    {session.subject || 'General'} · {session.updatedAt}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSession(session.id)}
                  aria-label={`Delete conversation ${session.title}`}
                  title="Delete conversation"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Clear All History Footer */}
      {sessions.length > 0 && (
        <div className="p-3 border-t border-slate-200 bg-slate-50/60">
          {confirmClearAll ? (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-rose-700">
                Sabhi {sessions.length} saved chats permanently delete karein?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearAllHistory}
                  className="flex-1 py-1.5 px-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                >
                  Delete All
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="flex-1 py-1.5 px-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClearAll(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear All History</span>
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
        {/* Desktop History Sidebar */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col border-r border-slate-200 bg-[#FAFCFF]">
          {renderHistoryList()}
        </aside>

        {/* Main AI Chat Workspace */}
        <div className="lg:col-span-9 flex flex-col min-w-0">
          {/* Premium Deep Navy Tutor Header */}
          <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-[#0B1221] via-[#131F3A] to-[#1D1B4B] text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#6D28D9] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
                    VIDYORA AI Study Buddy
                  </h2>
                  <p className="text-xs text-blue-200/90 truncate">
                    Simple Hinglish · Step-by-step concepts · Follow-up context
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileHistoryOpen(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Chats ({sessions.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-semibold text-white bg-[#6D28D9] hover:bg-[#7C3AED] rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>New Chat</span>
                </button>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCurrentChat}
                    title="Clear current chat"
                    className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl transition-colors cursor-pointer"
                  >
                    <Eraser className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Clear Chat</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Learning Controls Bar: Subject, Learning Level & Explanation Mode */}
          <div className="px-4 sm:px-6 py-3.5 bg-[#F8FAFC] border-b border-slate-200 space-y-3">
            {/* Subject Strip */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#6D28D9]" aria-hidden="true" />
                  Subject
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  9 core subjects supported
                </span>
              </div>
              <div
                role="radiogroup"
                aria-label="Select subject"
                className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap sm:overflow-visible max-w-full"
              >
                {STUDY_BUDDY_SUBJECTS.map((subj) => {
                  const active = subject === subj;
                  return (
                    <button
                      key={subj}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSubject(subj)}
                      className={`px-2.5 py-1.5 min-h-[32px] text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-[#0B1221] text-white border-[#0B1221]'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-[#6D28D9]/50 hover:text-[#0B1221]'
                      }`}
                    >
                      {subj}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Level + Explanation Mode Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
              <div className="md:col-span-4">
                <label
                  htmlFor="study-buddy-level"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Learning Level
                </label>
                <select
                  id="study-buddy-level"
                  value={buddyLevel}
                  onChange={(e) => setBuddyLevel(e.target.value as StudyBuddyLevel)}
                  className="w-full px-3 py-2 min-h-[38px] text-xs sm:text-sm font-semibold text-[#0B1221] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/30 focus:border-[#6D28D9]"
                >
                  {STUDY_BUDDY_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-8">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Explanation Mode
                </span>
                <div
                  role="radiogroup"
                  aria-label="Explanation mode"
                  className="flex flex-wrap items-center gap-1.5"
                >
                  {STUDY_BUDDY_MODES.map((m) => {
                    const active = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        title={m.shortDesc}
                        onClick={() => setMode(m.id)}
                        className={`px-2.5 py-1.5 min-h-[36px] text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#6D28D9] text-white border-[#6D28D9] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-[#6D28D9]/50 hover:text-[#6D28D9]'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Conversation Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 bg-gradient-to-b from-white to-[#F8FAFC] min-h-[250px] max-h-[520px]">
            {messages.length === 0 ? (
              <div className="max-w-2xl mx-auto py-1 space-y-3.5">
                <div className="text-center space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] border border-purple-200 text-[#6D28D9] flex items-center justify-center mx-auto">
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#0B1221]">
                    Namaste! Aaj {subject} mein kya samajhna hai?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                    Main aapko <strong className="text-[#0B1221]">{buddyLevel}</strong> ke hisaab se{' '}
                    <strong className="text-[#6D28D9]">{activeModeLabel}</strong> style mein simple Hinglish mein samjhaunga.
                  </p>
                </div>

                {/* Subject-tailored Suggested Questions */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Suggested {subject} Questions
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => {
                          if (isConfigured) {
                            void sendQuestion(q);
                          } else {
                            setInput(q);
                            textareaRef.current?.focus();
                          }
                        }}
                        className="text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-[#6D28D9] hover:bg-[#FAF8FF] transition-all text-xs sm:text-sm font-medium text-[#0B1221] leading-snug cursor-pointer shadow-2xs"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  const isRegenerating = regeneratingId === msg.id;
                  const isSpeaking = speakingId === msg.id;
                  const modeLabel =
                    STUDY_BUDDY_MODES.find((m) => m.id === msg.mode)?.label || activeModeLabel;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 sm:gap-3 ${
                        isUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-xl bg-[#6D28D9] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Bot className="w-4 h-4" aria-hidden="true" />
                        </div>
                      )}

                      <div
                        className={`max-w-[90%] sm:max-w-[82%] min-w-0 ${
                          isUser
                            ? 'rounded-2xl rounded-tr-sm bg-[#0B1221] text-white px-4 py-3 shadow-xs'
                            : 'rounded-2xl rounded-tl-sm bg-white border border-slate-200/90 text-slate-800 px-4 py-3.5 shadow-xs'
                        }`}
                      >
                        {/* Meta Row */}
                        <div
                          className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] mb-2 ${
                            isUser ? 'text-blue-200/80' : 'text-slate-500'
                          }`}
                        >
                          <span className="font-semibold">
                            {isUser ? 'You' : 'VIDYORA Tutor'}
                          </span>
                          {msg.subject && <span>· {msg.subject}</span>}
                          {!isUser && msg.buddyLevel && <span>· {msg.buddyLevel}</span>}
                          {!isUser && <span>· {modeLabel}</span>}
                          {msg.timestamp && <span className="ml-auto">{msg.timestamp}</span>}
                        </div>

                        {isRegenerating ? (
                          <div className="flex items-center gap-2 py-2 text-xs font-medium text-[#6D28D9]">
                            <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                            <span>Naye explanation ke saath regenerate kar raha hoon...</span>
                          </div>
                        ) : (
                          <FormattedMessageBody content={msg.content} isUser={isUser} />
                        )}

                        {/* Student Action Toolbar on Assistant Messages */}
                        {!isUser && !isRegenerating && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[32px] text-xs font-semibold text-slate-600 hover:text-[#0B1221] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                                  <span className="text-emerald-700">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={loading || Boolean(regeneratingId) || !isConfigured}
                              onClick={() => handleRegenerate(idx)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[32px] text-xs font-semibold text-slate-600 hover:text-[#6D28D9] hover:bg-[#F5F3FF] rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Regenerate</span>
                            </button>

                            {ttsSupported && (
                              <button
                                type="button"
                                onClick={() => handleToggleSpeech(msg)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[32px] text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                                  isSpeaking
                                    ? 'bg-[#6D28D9] text-white'
                                    : 'text-slate-600 hover:text-[#2563EB] hover:bg-[#EFF6FF]'
                                }`}
                              >
                                {isSpeaking ? (
                                  <>
                                    <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Stop</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Listen</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-blue-200 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-4 h-4" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading / Thinking Bubble */}
                {loading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#6D28D9] text-white flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white border border-purple-200/80 px-4 py-3.5 shadow-xs flex items-center gap-3">
                      <div className="flex items-center gap-1" aria-hidden="true">
                        <span className="w-2 h-2 rounded-full bg-[#6D28D9] animate-bounce [animation-delay:-0.25s]" />
                        <span className="w-2 h-2 rounded-full bg-[#6D28D9] animate-bounce [animation-delay:-0.12s]" />
                        <span className="w-2 h-2 rounded-full bg-[#6D28D9] animate-bounce" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-slate-700">
                        VIDYORA Tutor simple Hinglish explanation tayar kar raha hai...
                      </span>
                    </div>
                  </div>
                )}

                {/* Contextual Follow-up Chips after latest assistant reply */}
                {!loading &&
                  messages.length > 0 &&
                  messages[messages.length - 1].role === 'assistant' && (
                    <div className="pt-1 pl-0 sm:pl-11 space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Ask a Follow-up
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {FOLLOW_UP_CHIPS.map((chip) => (
                          <button
                            key={chip.label}
                            type="button"
                            disabled={loading || !isConfigured}
                            onClick={() => void sendQuestion(chip.prompt, chip.mode)}
                            className="px-3 py-1.5 min-h-[34px] text-xs font-semibold text-[#6D28D9] bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-purple-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="mx-4 sm:mx-6 mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-2.5"
            >
              <AlertCircle
                className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label="Dismiss error"
                className="p-0.5 text-rose-500 hover:text-rose-800 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Composer Footer */}
          <div className="p-4 sm:p-5 bg-white border-t border-slate-200 space-y-2.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendQuestion(input);
              }}
              className="flex items-end gap-2.5"
            >
              <div className="flex-1 min-w-0">
                <label htmlFor="study-buddy-input" className="sr-only">
                  Ask your educational question
                </label>
                <textarea
                  ref={textareaRef}
                  id="study-buddy-input"
                  rows={2}
                  value={input}
                  maxLength={1200}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!loading) {
                        void sendQuestion(input);
                      }
                    }
                  }}
                  placeholder={`Apna ${subject} sawal likhein... (Enter to send, Shift+Enter new line)`}
                  className="w-full px-3.5 py-2.5 text-sm text-[#0B1221] placeholder:text-slate-400 bg-[#F8FAFC] border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/30 focus:border-[#6D28D9] focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                aria-label="Send question"
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 min-h-[48px] text-sm font-semibold text-white bg-[#6D28D9] hover:bg-[#5B21B6] disabled:bg-slate-300 rounded-xl transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{loading ? 'Thinking...' : 'Ask AI'}</span>
              </button>
            </form>

            {/* Educational Safety & Privacy Footnote */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>
                  Concept samajhne ke liye design kiya gaya hai — copy karne ke liye nahi.
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span>Personal phone/email chat mein share na karein.</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Saved Chats Drawer */}
      {mobileHistoryOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Saved study chats"
        >
          <div
            className="fixed inset-0 bg-[#0B1221]/60 backdrop-blur-xs"
            onClick={() => setMobileHistoryOpen(false)}
          />
          <div className="relative z-10 w-[85%] max-w-xs bg-white h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-end p-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setMobileHistoryOpen(false)}
                aria-label="Close chat history"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 min-h-0">{renderHistoryList()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
