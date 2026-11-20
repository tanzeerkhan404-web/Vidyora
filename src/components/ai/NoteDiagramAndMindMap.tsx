import { ArrowDown, ArrowRight, GitBranch, RefreshCw } from 'lucide-react';
import type {
  NoteDesignStyle,
  NoteDiagramSpec,
  NoteMindMapSpec,
} from '../../types/vidyora';
import { formatMathUnicode } from '../../utils/studyBuddyLogic';

const INFOGRAPHIC_NODE_STYLES = [
  'bg-[#F5F3FF] border-purple-300 text-[#4C1D95]',
  'bg-[#EFF6FF] border-blue-300 text-[#1E3A8A]',
  'bg-emerald-50 border-emerald-300 text-emerald-900',
  'bg-amber-50 border-amber-300 text-amber-900',
  'bg-indigo-50 border-indigo-300 text-indigo-900',
  'bg-rose-50 border-rose-300 text-rose-900',
];

const INFOGRAPHIC_BRANCH_STYLES = [
  { border: 'border-purple-300', header: 'bg-[#6D28D9] text-white', dot: 'bg-[#6D28D9]' },
  { border: 'border-blue-300', header: 'bg-[#2563EB] text-white', dot: 'bg-[#2563EB]' },
  { border: 'border-emerald-300', header: 'bg-emerald-700 text-white', dot: 'bg-emerald-600' },
  { border: 'border-indigo-300', header: 'bg-[#0B1221] text-white', dot: 'bg-[#0B1221]' },
  { border: 'border-amber-300', header: 'bg-amber-600 text-white', dot: 'bg-amber-600' },
  { border: 'border-cyan-300', header: 'bg-cyan-700 text-white', dot: 'bg-cyan-600' },
];

export function NoteDiagramView({
  diagram,
  designStyle,
}: {
  diagram: NoteDiagramSpec;
  designStyle: NoteDesignStyle;
}) {
  const isHandwritten = designStyle === 'handwritten';
  const isInfographic = designStyle === 'infographic';
  const isMinimal = designStyle === 'minimal';

  const getNodeClass = (idx: number) => {
    if (isInfographic) {
      return INFOGRAPHIC_NODE_STYLES[idx % INFOGRAPHIC_NODE_STYLES.length];
    }
    if (isHandwritten) {
      return 'bg-[#FFFBEB] border-[#1E3A8A]/40 border-dashed text-[#1E3A8A]';
    }
    if (isMinimal) {
      return 'bg-white border-slate-900 text-slate-900';
    }
    return 'bg-white border-purple-200 text-[#0B1221]';
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={
            isHandwritten
              ? 'font-handwriting text-2xl font-bold text-[#1E3A8A]'
              : 'font-display text-sm sm:text-base font-bold text-[#0B1221]'
          }
        >
          {formatMathUnicode(diagram.title)}
        </p>
        <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
          {diagram.diagramType}
        </span>
      </div>

      {diagram.diagramType === 'comparison' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {diagram.nodes.map((node, idx) => (
            <div
              key={node.id || idx}
              className={`p-3.5 rounded-xl border ${getNodeClass(idx)}`}
            >
              <p className="text-xs sm:text-sm font-bold">
                {formatMathUnicode(node.label)}
              </p>
              {node.detail && (
                <p className="mt-1 text-xs opacity-85 leading-relaxed">
                  {formatMathUnicode(node.detail)}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : diagram.diagramType === 'hierarchy' ? (
        <div className="space-y-3">
          {/* Root Node */}
          <div className="flex justify-center">
            <div
              className={`px-4 py-2.5 rounded-xl border-2 text-center max-w-sm ${
                isMinimal
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-[#0B1221] text-white border-[#6D28D9]'
              }`}
            >
              <p className="text-xs sm:text-sm font-bold">
                {formatMathUnicode(diagram.nodes[0]?.label || '')}
              </p>
              {diagram.nodes[0]?.detail && (
                <p className="mt-0.5 text-[11px] text-blue-200">
                  {formatMathUnicode(diagram.nodes[0].detail)}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-center text-slate-400" aria-hidden="true">
            <ArrowDown className="w-4 h-4" />
          </div>

          {/* Child Nodes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {diagram.nodes.slice(1).map((node, idx) => (
              <div
                key={node.id || idx}
                className={`p-3 rounded-xl border ${getNodeClass(idx + 1)}`}
              >
                <p className="text-xs sm:text-sm font-bold">
                  {formatMathUnicode(node.label)}
                </p>
                {node.detail && (
                  <p className="mt-1 text-xs opacity-85 leading-relaxed">
                    {formatMathUnicode(node.detail)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Flowchart & Cycle Layout */
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
          {diagram.nodes.map((node, idx) => (
            <div
              key={node.id || idx}
              className="flex flex-col sm:flex-row items-center gap-2 flex-1 min-w-[140px]"
            >
              <div
                className={`w-full p-3 rounded-xl border ${getNodeClass(idx)} text-left`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-black/10 text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                    {idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm font-bold leading-snug">
                    {formatMathUnicode(node.label)}
                  </p>
                </div>
                {node.detail && (
                  <p className="mt-1.5 text-[11px] sm:text-xs opacity-85 leading-relaxed">
                    {formatMathUnicode(node.detail)}
                  </p>
                )}
              </div>
              {idx < diagram.nodes.length - 1 ? (
                <span className="text-[#6D28D9] shrink-0" aria-hidden="true">
                  <ArrowRight className="w-4 h-4 hidden sm:block" />
                  <ArrowDown className="w-4 h-4 sm:hidden" />
                </span>
              ) : diagram.diagramType === 'cycle' ? (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6D28D9] shrink-0"
                  title="Repeats in cycle"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="sm:hidden">Cycle repeats</span>
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {diagram.caption && (
        <p className="text-xs text-slate-600 italic leading-relaxed">
          {formatMathUnicode(diagram.caption)}
        </p>
      )}
    </div>
  );
}

export function NoteMindMapView({
  mindMap,
  designStyle,
}: {
  mindMap: NoteMindMapSpec;
  designStyle: NoteDesignStyle;
}) {
  const isHandwritten = designStyle === 'handwritten';
  const isMinimal = designStyle === 'minimal';
  const isInfographic = designStyle === 'infographic';

  return (
    <div className="space-y-4">
      {/* Central Topic Hub */}
      <div className="flex flex-col items-center">
        <div
          className={`px-5 py-3 rounded-2xl border-2 text-center shadow-xs ${
            isMinimal
              ? 'bg-slate-900 text-white border-slate-900'
              : isHandwritten
                ? 'bg-[#FEF08A] text-[#1E3A8A] border-[#1E3A8A] border-dashed'
                : 'bg-gradient-to-r from-[#0B1221] to-[#6D28D9] text-white border-purple-300'
          }`}
        >
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-85">
            <GitBranch className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Central Concept</span>
          </div>
          <p
            className={
              isHandwritten
                ? 'font-handwriting text-2xl font-bold mt-0.5'
                : 'font-display text-base sm:text-lg font-bold mt-0.5'
            }
          >
            {formatMathUnicode(mindMap.centralTopic)}
          </p>
        </div>
        <div className="w-0.5 h-4 bg-slate-300" aria-hidden="true" />
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {mindMap.branches.map((branch, idx) => {
          const palette = INFOGRAPHIC_BRANCH_STYLES[idx % INFOGRAPHIC_BRANCH_STYLES.length];
          const cardBorder = isMinimal
            ? 'border-slate-800 bg-white'
            : isHandwritten
              ? 'border-[#1E3A8A]/40 border-dashed bg-[#FFFBEB]/80'
              : isInfographic
                ? `${palette.border} bg-white`
                : 'border-slate-200 bg-white';

          const headerClass = isMinimal
            ? 'bg-slate-100 text-slate-900 border-b border-slate-300'
            : isHandwritten
              ? 'bg-[#EFF6FF] text-[#1E3A8A] border-b border-[#1E3A8A]/20'
              : isInfographic
                ? palette.header
                : 'bg-[#0B1221] text-white';

          return (
            <div
              key={`${branch.title}-${idx}`}
              className={`rounded-xl border overflow-hidden ${cardBorder}`}
            >
              <div className={`px-3.5 py-2 text-xs sm:text-sm font-bold ${headerClass}`}>
                {formatMathUnicode(branch.title)}
              </div>
              <ul className="p-3 space-y-1.5 text-xs text-slate-700">
                {branch.subtopics.map((sub, sIdx) => (
                  <li key={sIdx} className="flex items-start gap-2 leading-snug">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                        isMinimal ? 'bg-slate-800' : palette.dot
                      }`}
                      aria-hidden="true"
                    />
                    <span>{formatMathUnicode(sub)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
