import { useState } from 'react';
import { X } from 'lucide-react';
import type { AIToolTab, PageView } from '../types/vidyora';

interface FooterProps {
  onNavigate: (view: PageView, sectionId?: string) => void;
  onOpenAITool: (tool: AIToolTab) => void;
}

type InfoDocKey = 'about' | 'contact' | 'privacy' | 'terms' | 'disclaimer';

const INFO_DOCS: Record<InfoDocKey, { title: string; paragraphs: string[] }> = {
  about: {
    title: 'About VIDYORA',
    paragraphs: [
      'VIDYORA ka mission hai education ko simple, visual, affordable aur enjoyable banana — har student ke liye, chahe wo Class 1–12 mein ho, college mein ho ya competitive exams ki taiyari kar raha ho.',
      'Hum difficult concepts ko clear Hinglish, interactive animations, digital whiteboards aur responsible AI study tools ke zariye samjhate hain taaki students sirf ratne ke bajay concept ki gehrai samjhein.',
    ],
  },
  contact: {
    title: 'Contact & Student Support',
    paragraphs: [
      'Academic feedback, content suggestions ya technical support ke liye aap humse support@vidyora.edu (sample educational contact) par connect kar sakte hain.',
      'Kripya support messages mein apna phone number, home address ya koi sensitive personal information share na karein.',
    ],
  },
  privacy: {
    title: 'Privacy Policy & Student Safety',
    paragraphs: [
      'VIDYORA students ki privacy ko top priority deta hai. Hum koi unnecessary personal data (email, phone number, date of birth, location) collect nahi karte.',
      'Local profile mein sirf aapka optional first name/nickname aur selected class level aapke hi browser mein store hota hai, jise aap kabhi bhi ek click mein clear kar sakte hain.',
      'AI Study Buddy aur Doubt Solver ke requests secure backend server se process hote hain — frontend mein kabhi bhi API keys expose nahi hoti.',
    ],
  },
  terms: {
    title: 'Terms of Educational Use',
    paragraphs: [
      'VIDYORA par available free notes, interactive lessons aur AI tools sirf self-study aur conceptual learning ke liye design kiye gaye hain.',
      'Interface sabhi age groups (Class 1–12 aur above) ke liye safe aur age-appropriate rakha gaya hai. Fair-usage rate limits apply hoti hain taaki sabhi students ko smooth access mil sake.',
    ],
  },
  disclaimer: {
    title: 'Educational & AI Accuracy Disclaimer',
    paragraphs: [
      'VIDYORA ke AI features (Study Buddy, Doubt Solver, Notes Generator, Quiz Generator, Study Planner) modern AI models ki madad se learning support provide karte hain.',
      'AI-generated answers kabhi-kabhi galti kar sakte hain aur unki 100% accuracy ki guarantee nahi di jaati. Board exams, college exams ya competitive tests ke liye hamesha apni official NCERT / textbook aur teachers se verify karein.',
    ],
  },
};

export function Footer({ onNavigate, onOpenAITool }: FooterProps) {
  const [activeDoc, setActiveDoc] = useState<InfoDocKey | null>(null);

  return (
    <footer className="bg-[#0B1221] text-slate-300 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-3">
            <p className="font-display text-xl font-extrabold text-white tracking-tight">
              VIDYORA
            </p>
            <p className="text-sm font-medium text-blue-200">
              Learning Beyond Textbooks.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Education ko simple, visual, affordable aur enjoyable banana — school students (Class 1–12), college learners aur exam aspirants ke liye.
            </p>
          </div>

          {/* Explore Links */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-display text-sm font-semibold text-white">
              Platform
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home', 'top')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('explore')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Explore Classes (1–12)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('video-lessons')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Video Lessons
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('free-notes')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Free Notes
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('admin-cms')}
                  className="text-purple-300 hover:text-purple-200 transition-colors cursor-pointer"
                >
                  Admin Video Studio
                </button>
              </li>
            </ul>
          </div>

          {/* AI Suite Links */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-display text-sm font-semibold text-white">
              AI Study Tools
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAITool('study-buddy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  AI Study Buddy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAITool('doubt-solver')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  AI Doubt Solver (Image)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAITool('notes')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  AI Notes Generator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAITool('quiz')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  AI Quiz Generator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAITool('planner')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  AI Study Planner
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-display text-sm font-semibold text-white">
              About & Policies
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveDoc('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveDoc('contact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Contact
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveDoc('privacy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveDoc('terms')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Terms of Use
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveDoc('disclaimer')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Educational Disclaimers
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Educational Disclaimer Strip */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <p className="max-w-2xl leading-relaxed">
            Educational Disclaimer: AI Study Buddy aur AI tools conceptual support ke liye hain aur 100% accuracy ki guarantee nahi dete. Important exams ke liye apni NCERT / textbook aur teachers se verify karein.
          </p>
          <p className="shrink-0 text-slate-500">
            © {new Date().getFullYear()} VIDYORA Education
          </p>
        </div>
      </div>

      {/* Info Modal */}
      {activeDoc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="footer-doc-title"
          className="fixed inset-0 z-50 bg-[#070C18]/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white text-[#0B1221] rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#0B1221] text-white flex items-center justify-between">
              <h3 id="footer-doc-title" className="font-display text-lg font-bold">
                {INFO_DOCS[activeDoc].title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveDoc(null)}
                aria-label="Close policy dialog"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3.5 text-sm text-slate-700 leading-relaxed">
              {INFO_DOCS[activeDoc].paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveDoc(null)}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#1E2E4D] rounded-lg cursor-pointer"
              >
                Samajh Gaya
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
