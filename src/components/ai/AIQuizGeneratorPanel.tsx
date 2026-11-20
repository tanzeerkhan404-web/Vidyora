import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { LEARNING_LEVELS } from '../../data/educationalContent';
import type {
  AIStatusResponse,
  GeneratedQuiz,
  LearningLevel,
  QuizAttemptRecord,
} from '../../types/vidyora';
import {
  calculateQuizScore,
  validateNotesOrQuizTopic,
} from '../../utils/eduLogic';
import { APIRequestError, requestQuizGenerator } from '../../utils/aiClient';

interface AIQuizGeneratorPanelProps {
  aiStatus: AIStatusResponse | null;
  defaultLevel: LearningLevel;
  prefillTopic?: string;
  onConsumePrefillTopic?: () => void;
  onRemainingUpdate: (remaining: number, dailyRemaining?: number) => void;
  onSaveQuizAttempt: (record: QuizAttemptRecord) => void;
}

export function AIQuizGeneratorPanel({
  aiStatus,
  defaultLevel,
  prefillTopic,
  onConsumePrefillTopic,
  onRemainingUpdate,
  onSaveQuizAttempt,
}: AIQuizGeneratorPanelProps) {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<LearningLevel>(defaultLevel);
  const [count, setCount] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const isConfigured = aiStatus?.configured ?? false;

  useEffect(() => {
    if (prefillTopic) {
      setTopic(prefillTopic);
      onConsumePrefillTopic?.();
    }
  }, [prefillTopic, onConsumePrefillTopic]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErr = validateNotesOrQuizTopic(topic);
    if (validationErr) {
      setError(validationErr);
      return;
    }
    if (!isConfigured) {
      setError(
        'AI Quiz Generator abhi setup mode mein hai — secure server API configuration complete hone par practice tests generate honge.'
      );
      return;
    }

    setError(null);
    setLoading(true);
    setQuiz(null);
    setSelectedAnswers({});
    setSubmitted(false);

    try {
      const res = await requestQuizGenerator({
        topic: topic.trim(),
        level,
        count,
      });
      onRemainingUpdate(res.remaining, res.dailyRemaining);
      setQuiz(res.quiz);
    } catch (err) {
      setError(
        err instanceof APIRequestError
          ? err.message
          : 'Quiz generate karne mein problem aayi. Dobara try karein.'
      );
    } finally {
      setLoading(false);
    }
  };

  const scoreSummary = quiz
    ? calculateQuizScore(quiz.questions, selectedAnswers)
    : null;

  const handleSubmitQuiz = () => {
    if (!quiz || !scoreSummary) return;
    setSubmitted(true);
    onSaveQuizAttempt({
      id: `quiz-${Date.now()}`,
      topic: quiz.topic,
      score: scoreSummary.correct,
      total: scoreSummary.total,
      percentage: scoreSummary.percentage,
      completedAt: new Date().toLocaleDateString(),
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-[#F8FAFC]">
        <h3 className="font-display text-xl font-bold text-[#0B1221]">
          AI Quiz Generator (MCQs & Score)
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Apne chapter ka instant practice test banao, answers submit karo aur explanations ke saath apna score check karo.
        </p>

        <form onSubmit={handleGenerate} className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <label htmlFor="quiz-topic-input" className="sr-only">
              Quiz topic
            </label>
            <input
              id="quiz-topic-input"
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Quiz topic likhein (jaise: Light Reflection, Indian Polity)"
              className="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-xl text-[#0B1221] focus:outline-none focus:border-[#6D28D9]"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="quiz-level-select" className="sr-only">
              Quiz level
            </label>
            <select
              id="quiz-level-select"
              value={level}
              onChange={(e) => setLevel(e.target.value as LearningLevel)}
              className="w-full px-3.5 py-3 text-sm bg-white border border-slate-300 rounded-xl text-[#0B1221]"
            >
              {LEARNING_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="quiz-count-select" className="sr-only">
              Number of questions
            </label>
            <select
              id="quiz-count-select"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full px-3.5 py-3 text-sm bg-white border border-slate-300 rounded-xl text-[#0B1221]"
            >
              <option value={3}>3 MCQs</option>
              <option value={5}>5 MCQs</option>
              <option value={8}>8 MCQs</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading || !isConfigured}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] text-sm font-semibold text-white bg-[#6D28D9] hover:bg-[#7C3AED] disabled:bg-slate-300 disabled:text-slate-600 rounded-xl transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <span>Start Quiz</span>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6">
        {!quiz && !loading && (
          <div className="py-10 text-center space-y-2">
            <ClipboardCheck className="w-8 h-8 text-slate-400 mx-auto" aria-hidden="true" />
            <p className="font-display text-base font-bold text-[#0B1221]">
              Interactive Practice Test
            </p>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Topic select karo, MCQs attempt karo aur instant score + har question ka clear Hinglish explanation dekho.
            </p>
          </div>
        )}

        {loading && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#6D28D9] mx-auto" aria-hidden="true" />
            <p className="text-sm text-slate-600">
              {count} conceptual MCQs taiyar ho rahe hain...
            </p>
          </div>
        )}

        {quiz && !loading && (
          <div className="space-y-6">
            {submitted && scoreSummary && (
              <div className="p-5 rounded-2xl bg-[#0B1221] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-blue-200">
                    Quiz Result · {quiz.topic}
                  </p>
                  <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">
                    {scoreSummary.correct} / {scoreSummary.total} ({scoreSummary.percentage}%)
                  </p>
                  <p className="mt-1 text-sm text-slate-200">{scoreSummary.feedback}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnswers({});
                    setSubmitted(false);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#0B1221] bg-white hover:bg-slate-100 rounded-xl shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span>Retry Quiz</span>
                </button>
              </div>
            )}

            <div className="space-y-5">
              {quiz.questions.map((q, qIdx) => {
                const chosen = selectedAnswers[q.id];
                const isCorrect = submitted && chosen === q.correctIndex;
                const isWrong = submitted && chosen !== q.correctIndex;

                return (
                  <fieldset
                    key={q.id}
                    className="p-5 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-3.5"
                  >
                    <legend className="font-display text-base font-bold text-[#0B1221] leading-snug">
                      <span className="font-mono text-[#6D28D9] mr-2 tabular-nums">
                        Q{qIdx + 1}.
                      </span>
                      {q.question}
                    </legend>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isPicked = chosen === optIdx;
                        const isRightOption = submitted && optIdx === q.correctIndex;
                        const isWrongPick = submitted && isPicked && optIdx !== q.correctIndex;

                        let styleClass =
                          'bg-white border-slate-200 text-[#0B1221] hover:border-[#6D28D9]/50';
                        if (isRightOption) {
                          styleClass =
                            'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold';
                        } else if (isWrongPick) {
                          styleClass = 'bg-red-50 border-red-400 text-red-900';
                        } else if (isPicked) {
                          styleClass =
                            'bg-[#EDE9FE] border-[#6D28D9] text-[#0B1221] font-semibold';
                        }

                        return (
                          <button
                            key={`${q.id}-${optIdx}`}
                            type="button"
                            disabled={submitted}
                            onClick={() =>
                              setSelectedAnswers((prev) => ({
                                ...prev,
                                [q.id]: optIdx,
                              }))
                            }
                            className={`text-left px-4 py-3 rounded-xl border text-sm transition-colors cursor-pointer disabled:cursor-default ${styleClass}`}
                          >
                            <span className="font-mono text-xs mr-2 opacity-70">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {submitted && (
                      <div
                        className={`p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 ${
                          isCorrect
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-950'
                            : isWrong
                            ? 'bg-amber-50 border border-amber-200 text-amber-950'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2
                            className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                        ) : (
                          <XCircle
                            className="w-4 h-4 text-amber-700 shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                        )}
                        <div>
                          <span className="font-bold mr-1.5">
                            {isCorrect ? 'Correct:' : 'Incorrect — Explanation:'}
                          </span>
                          <span>{q.explanation}</span>
                        </div>
                      </div>
                    )}
                  </fieldset>
                );
              })}
            </div>

            {!submitted && (
              <div className="flex items-center justify-between gap-4 pt-2">
                <p className="text-xs sm:text-sm text-slate-600 tabular-nums">
                  Answered: {Object.keys(selectedAnswers).length} / {quiz.questions.length}
                </p>
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="px-6 py-3 text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#6D28D9] rounded-xl transition-colors cursor-pointer"
                >
                  Submit Quiz & Check Score
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
