import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

export const VIDYORA_AI_MODEL = 'gemini-4-hydrogen';

export const AI_DISCLAIMER =
  'AI answers sirf learning aur revision support ke liye hain — 100% accuracy ki guarantee nahi hai. Exams ya assignments ke liye apni textbook ya teacher se zaroor verify karein.';

const BASE_SAFETY_SYSTEM = `You are VIDYORA AI Tutor — a warm, patient, age-appropriate educational mentor for students from Class 1-12, College, and Competitive Exams in India.
Language style: Simple, friendly Hinglish (Hindi written in Roman script mixed naturally with accurate English academic terminology such as Photosynthesis, Newton's Second Law, Quadratic Equation, Binary Search Tree, Constitution of India).
Strict Educational Safety & Honesty Rules:
1. Encourage genuine conceptual understanding instead of blind copying or cheating. Explain the "why" behind each step so the student actually learns.
2. Explain uncertainty honestly whenever a question is ambiguous, incomplete, or depends on missing context. Never claim an AI answer is 100% guaranteed error-free.
3. NEVER invent textbook references, page numbers, chapter editions, author quotes, or URLs. If you are not sure of a specific textbook citation, do not fabricate one.
4. Keep every response strictly educational, respectful, and age-appropriate for young students and learners. Politely refuse harmful, dangerous, violent, self-harm, or inappropriate requests and gently guide back to safe learning topics.
5. Protect student privacy: never ask for or store personal information (phone number, email, home address, full name, school name, roll number).
6. Format mathematical equations cleanly and readably using Unicode math symbols (e.g., F = m × a, x = (-b ± √(b² - 4ac)) / (2a), sin²θ + cos²θ = 1, ⇒). Put important standalone equations on their own line wrapped in $$...$$ and inline formulas in single backticks.`;

export class AIServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = 'AI_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key === 'MY_GEMINI_API_KEY' || key.length < 10) {
    return false;
  }
  return true;
}

function getClient(): GoogleGenAI {
  if (!isGeminiConfigured()) {
    throw new AIServiceError(
      'AI Tutor abhi disabled hai kyunki secure server API configuration complete nahi hui hai.',
      503,
      'AI_NOT_CONFIGURED'
    );
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const AI_REQUEST_TIMEOUT_MS = 40_000;

async function withRetry<T>(fn: (signal: AbortSignal) => Promise<T>, maxRetries = 1): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);
    try {
      const result = await fn(controller.signal);
      clearTimeout(timer);
      return result;
    } catch (err: unknown) {
      clearTimeout(timer);
      lastError = err;
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: number }).status)
          : undefined;
      const retryable = status === 500 || status === 503 || status === 504;
      if (!retryable || attempt === maxRetries) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * Math.pow(2, attempt)));
    }
  }

  const errName = lastError instanceof Error ? lastError.name : '';
  const rawMessage = lastError instanceof Error ? lastError.message : 'Unknown Gemini API error';
  if (errName === 'AbortError' || errName === 'TimeoutError' || rawMessage.toLowerCase().includes('aborted')) {
    throw new AIServiceError(
      'AI response lene mein zyada time lag gaya. Kripya thodi der baad dobara try karein.',
      504,
      'AI_TIMEOUT'
    );
  }
  if (rawMessage.includes('429') || rawMessage.includes('RESOURCE_EXHAUSTED')) {
    throw new AIServiceError(
      'Free-tier AI usage quota temporarily exhausted hai. Thodi der baad dobara try karein — tab tak aap Video Lessons aur Free Notes se padhai continue kar sakte hain.',
      429,
      'QUOTA_EXHAUSTED'
    );
  }
  if (rawMessage.includes('403') || rawMessage.includes('400') || rawMessage.includes('API_KEY')) {
    throw new AIServiceError(
      'AI service configuration mein issue aaya hai. Please secure backend API settings verify karein.',
      503,
      'API_CONFIG_ERROR'
    );
  }
  throw new AIServiceError(
    'AI response generate karne mein problem aayi. Please thodi der baad retry karein.',
    502,
    'UPSTREAM_ERROR'
  );
}

export type StudyBuddyModeParam =
  | 'simple'
  | 'step-by-step'
  | 'real-life'
  | 'short-summary'
  | 'teacher';

export interface StudyBuddyPayload {
  question: string;
  level: string;
  subject?: string;
  mode?: StudyBuddyModeParam;
  language?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const MODE_INSTRUCTIONS: Record<StudyBuddyModeParam, string> = {
  simple:
    'Explain simply: Use very clear, beginner-friendly language with short paragraphs, zero unnecessary jargon, and 1 crisp takeaway at the end.',
  'step-by-step':
    'Explain step by step: Break the concept or problem into clean numbered steps (1., 2., 3. ...) showing formulas clearly on their own lines ($$...$$) and why each step works.',
  'real-life':
    'Give real-life examples: Explain the concept using 2-3 vivid, relatable everyday real-life examples so the student can immediately visualize how it works.',
  'short-summary':
    'Give a short summary: Provide a crisp, exam-revision friendly bullet summary (max 150 words) with key terms bolded and essential formula highlighted.',
  teacher:
    'Explain like a supportive classroom teacher: Start with a warm intuitive hook, walk through the core concept clearly, warn about 1 common student mistake, and end with 1 short thinking question to check understanding.',
};

export async function askStudyBuddy(payload: StudyBuddyPayload): Promise<{ answer: string }> {
  const ai = getClient();

  const safeMode: StudyBuddyModeParam =
    payload.mode && payload.mode in MODE_INSTRUCTIONS ? payload.mode : 'step-by-step';
  const modeInstruction = MODE_INSTRUCTIONS[safeMode];
  const subjectLabel = payload.subject?.trim() || 'General Knowledge';
  const preferredLang = payload.language?.trim();
  const languageDirective =
    preferredLang && preferredLang.toLowerCase() !== 'english'
      ? `Respond primarily in ${preferredLang} using simple, clear student-friendly words while preserving accurate standard scientific, mathematical, and technical terms in parentheses or standard notation where helpful.`
      : 'Respond in clear, friendly English/Hinglish with accurate academic terminology.';

  const historyContext = (payload.history ?? [])
    .slice(-12)
    .map((m) => {
      const content = String(m.content || '').slice(0, 1500);
      return `${m.role === 'user' ? 'Student' : 'VIDYORA Tutor'}: ${content}`;
    })
    .join('\n');

  const prompt = `${historyContext ? `Previous conversation context (maintain continuity and refer back naturally):\n${historyContext}\n\n` : ''}Selected Subject: ${subjectLabel}
Student Learning Level: ${payload.level}
Preferred Response Language: ${languageDirective}
Explanation Mode: ${modeInstruction}
Current Student Question: ${payload.question}`;

  const response = await withRetry((abortSignal) =>
    ai.models.generateContent({
      model: VIDYORA_AI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: `${BASE_SAFETY_SYSTEM}\nAdapt depth and vocabulary strictly to the Student Learning Level (${payload.level}) and Selected Subject (${subjectLabel}). Keep formatting scannable with headings/bullets where helpful, and keep answers concise (around 120–360 words unless a derivation needs slightly more space).`,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal,
      },
    })
  );

  const answer = response.text?.trim();
  if (!answer) {
    throw new AIServiceError('Empty response received from AI service.', 502, 'EMPTY_RESPONSE');
  }
  return { answer };
}

export interface DoubtSolverPayload {
  imageBase64: string;
  mimeType: string;
  note?: string;
  level: string;
  subject?: string;
  solveStyle?: 'standard' | 'simpler' | 'alternative-method';
}

export async function solveDoubtFromImage(payload: DoubtSolverPayload) {
  const ai = getClient();

  const imagePart = {
    inlineData: {
      mimeType: payload.mimeType,
      data: payload.imageBase64,
    },
  };

  const subjectHint =
    payload.subject && payload.subject !== 'Auto Detect'
      ? `Student selected subject: ${payload.subject}. Use accurate ${payload.subject} terminology.`
      : 'Auto-detect the subject from: Mathematics, Physics, Chemistry, Biology, English, History, Geography, Computer Science.';

  const styleInstruction =
    payload.solveStyle === 'simpler'
      ? 'Explain MUCH MORE SIMPLY than usual — use very easy everyday Hinglish, tiny atomic steps, and zero skipped algebra or reasoning.'
      : payload.solveStyle === 'alternative-method'
      ? 'Solve this question using a DIFFERENT / ALTERNATIVE valid method than the standard first method (for example: graphical/factorization vs quadratic formula, energy method vs kinematics, or an intuitive conceptual approach) and note why this alternative method is helpful.'
      : 'Solve clearly step-by-step with complete mathematical and conceptual accuracy.';

  const textPart = {
    text: `Carefully inspect this uploaded student question image.
${subjectHint}
Student Learning Level: ${payload.level}.
Solving Style: ${styleInstruction}
Additional student note/follow-up request: ${payload.note?.trim() || 'None provided.'}

CRITICAL HONESTY & VISION INSTRUCTIONS:
1. First verify whether the image actually contains a legible educational question, equation, or diagram.
2. If the image is too blurry, dark, cropped, unreadable, blank, or NOT an educational question, you MUST set "readable": false, explain honestly in "unreadableReason" what is wrong (e.g., blurry text, cut-off equation) and how to capture a clearer photo, and do NOT invent or guess a fake question or fake answer.
3. If the image IS readable, set "readable": true and fill every structured field accurately in friendly Hinglish + accurate English subject terms:
   - Identify any printed/handwritten equations, labels, or diagrams in "diagramObservations".
   - List all given values/facts in "givenInformation".
   - State clearly what needs to be found in "requiredAnswer".
   - List the relevant formulas or rules in "relevantFormulas" (using readable Unicode math like x², √, ×, ÷, θ).
   - Provide numbered clear steps in "steps".
   - Provide "finalAnswer" and a brief "finalAnswerExplanation" explaining why the answer makes sense.
   - Provide one crisp "importantLearningPoint" so the student remembers the concept (not just copies the answer).
   - Provide one original "similarPracticeQuestion" (with question, hint, and answer) so the student can test themselves.
4. Never fabricate textbook page numbers or fake citations.`,
  };

  const response = await withRetry((abortSignal) =>
    ai.models.generateContent({
      model: VIDYORA_AI_MODEL,
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: BASE_SAFETY_SYSTEM,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            readable: {
              type: Type.BOOLEAN,
              description: 'True only if an educational question can actually be read clearly from the image.',
            },
            unreadableReason: {
              type: Type.STRING,
              description: 'If readable is false, friendly Hinglish explanation of why the image could not be read and tips to retake.',
            },
            detectedSubject: {
              type: Type.STRING,
              description: 'Detected subject (Mathematics, Physics, Chemistry, Biology, English, History, Geography, or Computer Science).',
            },
            subjectTopic: {
              type: Type.STRING,
              description: 'Detected chapter or topic name.',
            },
            extractedQuestion: {
              type: Type.STRING,
              description: 'The exact question understood from the uploaded image.',
            },
            diagramObservations: {
              type: Type.STRING,
              description: 'Any equations, figures, circuits, triangles, or diagrams observed in the image (empty string if none).',
            },
            givenInformation: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of given values, conditions, or facts from the question.',
            },
            requiredAnswer: {
              type: Type.STRING,
              description: 'What the question asks to find, prove, or explain.',
            },
            relevantFormulas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Relevant formulas, identities, or principles used.',
            },
            conceptUsed: {
              type: Type.STRING,
              description: 'Short summary of the core concept used.',
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
              },
            },
            finalAnswer: {
              type: Type.STRING,
              description: 'Clear final answer with proper units where applicable.',
            },
            finalAnswerExplanation: {
              type: Type.STRING,
              description: 'Brief Hinglish explanation verifying why the final answer is logical.',
            },
            importantLearningPoint: {
              type: Type.STRING,
              description: 'Key conceptual takeaway or mistake to avoid in exams.',
            },
            practiceTip: {
              type: Type.STRING,
              description: 'One short Hinglish tip for mastering similar questions.',
            },
            similarPracticeQuestion: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                hint: { type: Type.STRING },
                answer: { type: Type.STRING },
              },
            },
          },
        },
      },
    })
  );

  const jsonStr = (response.text ?? '').trim();
  const parsed = JSON.parse(jsonStr);
  return {
    readable: parsed.readable !== false,
    unreadableReason: parsed.unreadableReason || '',
    detectedSubject: parsed.detectedSubject || (payload.subject !== 'Auto Detect' ? payload.subject : 'General'),
    subjectTopic: parsed.subjectTopic || 'Conceptual Problem',
    extractedQuestion: parsed.extractedQuestion || '',
    diagramObservations: parsed.diagramObservations || '',
    givenInformation: Array.isArray(parsed.givenInformation) ? parsed.givenInformation : [],
    requiredAnswer: parsed.requiredAnswer || '',
    relevantFormulas: Array.isArray(parsed.relevantFormulas) ? parsed.relevantFormulas : [],
    conceptUsed: parsed.conceptUsed || (Array.isArray(parsed.relevantFormulas) ? parsed.relevantFormulas[0] || '' : ''),
    steps: Array.isArray(parsed.steps) ? parsed.steps : [],
    finalAnswer: parsed.finalAnswer || '',
    finalAnswerExplanation: parsed.finalAnswerExplanation || '',
    importantLearningPoint: parsed.importantLearningPoint || parsed.practiceTip || '',
    practiceTip: parsed.practiceTip || parsed.importantLearningPoint || '',
    similarPracticeQuestion: parsed.similarPracticeQuestion?.question
      ? parsed.similarPracticeQuestion
      : undefined,
  };
}

export type NoteTypeParam =
  | 'Detailed Notes'
  | 'Short Notes'
  | 'Quick Revision'
  | 'Formula Sheets'
  | 'Important Definitions'
  | 'Mind Maps'
  | 'One-page Infographics'
  | 'Question and Answer Notes';

export type NoteRegeneratableSectionParam =
  | 'overview'
  | 'sections'
  | 'definitions'
  | 'formulas'
  | 'examples'
  | 'tables'
  | 'diagram'
  | 'mindMap'
  | 'qaPairs'
  | 'commonMistakes'
  | 'revisionSummary';

export interface NotesPayload {
  topic?: string;
  chapterName?: string;
  className?: string;
  subject?: string;
  level?: string;
  noteType?: NoteTypeParam;
  pastedText?: string;
  attachment?: {
    base64: string;
    mimeType: 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp';
    fileName?: string;
  };
}

const NOTE_TYPE_GUIDANCE: Record<NoteTypeParam, string> = {
  'Detailed Notes':
    'Generate comprehensive, well-structured chapter notes covering every core concept, 4-5 rich sections, definitions, key formulas, examples, comparison table, conceptual diagram, common mistakes, and revision summary.',
  'Short Notes':
    'Generate concise, crisp short notes (3 compact sections, 3-4 bullets per section), essential definitions, core formulas, and tight revision takeaways.',
  'Quick Revision':
    'Generate rapid last-minute exam revision notes: high-yield bullet points, must-remember formulas, common exam mistakes, and a super-crisp revision summary.',
  'Formula Sheets':
    'Focus heavily on "formulas": list every relevant formula accurately with variable meanings and when to use each formula, plus quick solved examples, units table, and common calculation mistakes.',
  'Important Definitions':
    'Focus heavily on "definitions" (8-12 crisp exam-ready definitions with Hinglish explanations), key distinctions table, examples, and common conceptual mistakes.',
  'Mind Maps':
    'Focus heavily on "mindMap" (a rich centralTopic with 4-6 clear branches and 3-5 subtopics each) plus a visual diagram and compact summary sections.',
  'One-page Infographics':
    'Design tight, punchy visual infographic notes: short high-impact overview, 3-4 crisp scannable concept blocks, 1 clear visual diagram, 1 comparison/summary table, key formulas, and exam highlights.',
  'Question and Answer Notes':
    'Focus heavily on "qaPairs" (6-8 structured exam questions with clear Hinglish answers and marksHint like "2 Marks", "3 Marks", "5 Marks") alongside concise concept headings and common mistakes.',
};

export async function generateStructuredNotes(payload: NotesPayload) {
  const ai = getClient();
  const safeNoteType: NoteTypeParam =
    payload.noteType && payload.noteType in NOTE_TYPE_GUIDANCE
      ? payload.noteType
      : 'Detailed Notes';
  const classLabel = payload.className?.trim() || payload.level?.trim() || 'Class 10';
  const subjectLabel = payload.subject?.trim() || 'General Studies';
  const chapterLabel = payload.chapterName?.trim() || '';
  const topicLabel = payload.topic?.trim() || chapterLabel || payload.attachment?.fileName || 'Uploaded Study Material';
  const hasPasted = Boolean(payload.pastedText && payload.pastedText.trim().length > 0);
  const hasAttachment = Boolean(payload.attachment?.base64);
  const hasSource = hasPasted || hasAttachment;

  const sourcePrompt = hasSource
    ? `STRICT SOURCE GROUNDING & ACCURACY RULES:
- The student provided study material (${hasAttachment ? `attached ${payload.attachment?.mimeType === 'application/pdf' ? 'PDF document' : 'study image'}: ${payload.attachment?.fileName || 'uploaded file'}` : ''}${hasAttachment && hasPasted ? ' + ' : ''}${hasPasted ? 'pasted study text' : ''}).
- Use the provided study material as the PRIMARY source of facts, definitions, and concepts.
- Set "sourceUsed": true and summarize what source was read in "sourceSummary".
- For each item in "sections", set "sourceTag": "From Source" if directly grounded in the uploaded material, or "Additional Explanation" if added for clarity.
- Put any helpful extra intuition, analogies, or background explanations NOT present in the uploaded source into "additionalExplanations" so the student can clearly tell source facts apart from extra AI explanations.
- If any portion of the PDF/image/text is blurry, cut off, incomplete, or uncertain, explicitly list that in "uncertaintyFlags" instead of guessing or fabricating details.`
    : `Set "sourceUsed": false, "sourceSummary": "", and leave "additionalExplanations" empty unless adding optional bonus intuition. If the topic is broad or has syllabus-dependent variations, mention that briefly in "uncertaintyFlags".`;

  const promptText = `Create high-quality VIDYORA study notes in simple, clear Hinglish with accurate English academic terminology.
Topic: "${topicLabel}"
${chapterLabel ? `Chapter Name: "${chapterLabel}"\n` : ''}Class / Track: "${classLabel}"
Subject: "${subjectLabel}"
Requested Note Type: "${safeNoteType}"
Note Type Instructions: ${NOTE_TYPE_GUIDANCE[safeNoteType]}

${sourcePrompt}

${hasPasted ? `--- STUDENT PASTED STUDY MATERIAL (PRIMARY SOURCE) ---\n${payload.pastedText!.trim().slice(0, 14000)}\n--- END OF PASTED MATERIAL ---\n\n` : ''}QUALITY & SAFETY RULES:
1. NEVER invent textbook page numbers, book editions, or fake URLs.
2. Keep all mathematical and scientific formulas 100% accurate using readable Unicode symbols (², ³, √, ×, ÷, θ, π, Δ, Ω, →, ⇒).
3. Include "tables" wherever a comparison, units chart, or classification table helps understanding (at least 1 concise table when appropriate).
4. Include "diagram" with 3 to 5 clear nodes (diagramType: flowchart, cycle, hierarchy, or comparison) whenever a visual process or structure helps learning.
5. Include "mindMap" (centralTopic + 4-5 branches) especially for Mind Maps, Detailed Notes, and One-page Infographics.
6. Include 2-4 realistic "commonMistakes" (mistake + correction) so students avoid losing marks in exams.
7. Include "qaPairs" (especially for Question and Answer Notes, and 2-3 exam Q&As for Detailed/Quick Revision notes).`;

  const contents = payload.attachment?.base64
    ? {
        parts: [
          {
            inlineData: {
              mimeType: payload.attachment.mimeType,
              data: payload.attachment.base64,
            },
          },
          { text: promptText },
        ],
      }
    : promptText;

  const response = await withRetry((abortSignal) =>
    ai.models.generateContent({
      model: VIDYORA_AI_MODEL,
      contents,
      config: {
        systemInstruction: BASE_SAFETY_SYSTEM,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal,
        responseMimeType: 'application/json',
        maxOutputTokens: 4096,
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'title',
            'level',
            'className',
            'subject',
            'noteType',
            'sourceUsed',
            'overview',
            'sections',
            'definitions',
            'formulas',
            'examples',
            'tables',
            'diagram',
            'mindMap',
            'qaPairs',
            'commonMistakes',
            'importantPoints',
            'revisionSummary',
          ],
          properties: {
            title: { type: Type.STRING },
            level: { type: Type.STRING },
            className: { type: Type.STRING },
            subject: { type: Type.STRING },
            chapterName: { type: Type.STRING },
            noteType: { type: Type.STRING },
            sourceUsed: { type: Type.BOOLEAN },
            sourceSummary: { type: Type.STRING },
            uncertaintyFlags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            overview: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['heading', 'points'],
                properties: {
                  heading: { type: Type.STRING },
                  sourceTag: { type: Type.STRING },
                  points: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
              },
            },
            definitions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['term', 'definition'],
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
              },
            },
            formulas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['name', 'expression', 'variables'],
                properties: {
                  name: { type: Type.STRING },
                  expression: { type: Type.STRING },
                  variables: { type: Type.STRING },
                  usage: { type: Type.STRING },
                },
              },
            },
            examples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['title', 'explanation'],
                properties: {
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
              },
            },
            tables: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['title', 'headers', 'rows'],
                properties: {
                  title: { type: Type.STRING },
                  headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  rows: {
                    type: Type.ARRAY,
                    items: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                },
              },
            },
            diagram: {
              type: Type.OBJECT,
              required: ['title', 'diagramType', 'nodes', 'caption'],
              properties: {
                title: { type: Type.STRING },
                diagramType: { type: Type.STRING },
                nodes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ['id', 'label'],
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      detail: { type: Type.STRING },
                    },
                  },
                },
                caption: { type: Type.STRING },
              },
            },
            mindMap: {
              type: Type.OBJECT,
              required: ['centralTopic', 'branches'],
              properties: {
                centralTopic: { type: Type.STRING },
                branches: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ['title', 'subtopics'],
                    properties: {
                      title: { type: Type.STRING },
                      subtopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                  },
                },
              },
            },
            qaPairs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['question', 'answer'],
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  marksHint: { type: Type.STRING },
                },
              },
            },
            commonMistakes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['mistake', 'correction'],
                properties: {
                  mistake: { type: Type.STRING },
                  correction: { type: Type.STRING },
                },
              },
            },
            additionalExplanations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['title', 'explanation'],
                properties: {
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
              },
            },
            importantPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            revisionSummary: { type: Type.STRING },
          },
        },
      },
    })
  );

  const jsonStr = (response.text ?? '').trim();
  const parsed = JSON.parse(jsonStr);

  const validDiagramTypes = ['flowchart', 'cycle', 'hierarchy', 'comparison'];
  const parsedDiagram =
    parsed.diagram &&
    Array.isArray(parsed.diagram.nodes) &&
    parsed.diagram.nodes.length >= 2
      ? {
          title: String(parsed.diagram.title || 'Concept Visual Flow'),
          diagramType: validDiagramTypes.includes(parsed.diagram.diagramType)
            ? parsed.diagram.diagramType
            : 'flowchart',
          nodes: parsed.diagram.nodes.slice(0, 6).map((n: Record<string, unknown>, idx: number) => ({
            id: String(n.id || `n-${idx + 1}`),
            label: String(n.label || ''),
            detail: n.detail ? String(n.detail) : undefined,
          })),
          caption: String(parsed.diagram.caption || ''),
        }
      : undefined;

  const parsedMindMap =
    parsed.mindMap &&
    Array.isArray(parsed.mindMap.branches) &&
    parsed.mindMap.branches.length > 0
      ? {
          centralTopic: String(parsed.mindMap.centralTopic || parsed.title || topicLabel),
          branches: parsed.mindMap.branches.slice(0, 8).map((b: Record<string, unknown>) => ({
            title: String(b.title || 'Branch'),
            subtopics: Array.isArray(b.subtopics)
              ? b.subtopics.map((st) => String(st)).slice(0, 6)
              : [],
          })),
        }
      : undefined;

  const result = {
    title: String(parsed.title || topicLabel),
    level: String(parsed.level || classLabel),
    className: String(parsed.className || classLabel),
    subject: String(parsed.subject || subjectLabel),
    chapterName: parsed.chapterName ? String(parsed.chapterName) : chapterLabel || undefined,
    noteType: safeNoteType,
    sourceUsed: hasSource ? parsed.sourceUsed !== false : Boolean(parsed.sourceUsed),
    sourceSummary: parsed.sourceSummary ? String(parsed.sourceSummary) : undefined,
    uncertaintyFlags: Array.isArray(parsed.uncertaintyFlags)
      ? parsed.uncertaintyFlags.filter((f: unknown) => typeof f === 'string' && f.trim().length > 0)
      : [],
    overview: String(parsed.overview || ''),
    sections: Array.isArray(parsed.sections)
      ? parsed.sections.map((s: Record<string, unknown>) => ({
          heading: String(s.heading || 'Key Concept'),
          points: Array.isArray(s.points) ? s.points.map(String) : [],
          sourceTag:
            s.sourceTag === 'From Source' || s.sourceTag === 'Additional Explanation'
              ? s.sourceTag
              : undefined,
        }))
      : [],
    definitions: Array.isArray(parsed.definitions) ? parsed.definitions : [],
    formulas: Array.isArray(parsed.formulas) ? parsed.formulas : [],
    examples: Array.isArray(parsed.examples) ? parsed.examples : [],
    tables: Array.isArray(parsed.tables)
      ? parsed.tables.filter(
          (t: Record<string, unknown>) =>
            Array.isArray(t.headers) && t.headers.length > 0 && Array.isArray(t.rows)
        )
      : [],
    diagram: parsedDiagram,
    mindMap: parsedMindMap,
    qaPairs: Array.isArray(parsed.qaPairs) ? parsed.qaPairs : [],
    commonMistakes: Array.isArray(parsed.commonMistakes) ? parsed.commonMistakes : [],
    additionalExplanations: Array.isArray(parsed.additionalExplanations)
      ? parsed.additionalExplanations
      : [],
    importantPoints: Array.isArray(parsed.importantPoints) ? parsed.importantPoints : [],
    revisionSummary: String(parsed.revisionSummary || ''),
  };

  const hasSubstantiveBody =
    result.overview.trim().length > 10 ||
    result.sections.length > 0 ||
    result.definitions.length > 0 ||
    result.formulas.length > 0 ||
    result.qaPairs.length > 0 ||
    Boolean(result.mindMap && result.mindMap.branches.length > 0);

  if (!hasSubstantiveBody) {
    throw new AIServiceError(
      'AI notes incomplete generate huye the. Kripya dobara Generate Notes par click karein.',
      502,
      'AI_INCOMPLETE_RESPONSE'
    );
  }

  return result;
}

export interface RegenerateNoteSectionPayload {
  sectionKey: NoteRegeneratableSectionParam;
  title: string;
  className: string;
  subject: string;
  noteType: string;
  contextSummary: string;
  instruction?: string;
}

export async function regenerateNoteSection(payload: RegenerateNoteSectionPayload) {
  const ai = getClient();
  const key = payload.sectionKey;

  const schemaByKey: Record<NoteRegeneratableSectionParam, Record<string, unknown>> = {
    overview: {
      type: Type.OBJECT,
      required: ['overview'],
      properties: { overview: { type: Type.STRING } },
    },
    revisionSummary: {
      type: Type.OBJECT,
      required: ['revisionSummary'],
      properties: { revisionSummary: { type: Type.STRING } },
    },
    sections: {
      type: Type.OBJECT,
      required: ['sections'],
      properties: {
        sections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['heading', 'points'],
            properties: {
              heading: { type: Type.STRING },
              sourceTag: { type: Type.STRING },
              points: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
      },
    },
    definitions: {
      type: Type.OBJECT,
      required: ['definitions'],
      properties: {
        definitions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['term', 'definition'],
            properties: {
              term: { type: Type.STRING },
              definition: { type: Type.STRING },
            },
          },
        },
      },
    },
    formulas: {
      type: Type.OBJECT,
      required: ['formulas'],
      properties: {
        formulas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['name', 'expression', 'variables'],
            properties: {
              name: { type: Type.STRING },
              expression: { type: Type.STRING },
              variables: { type: Type.STRING },
              usage: { type: Type.STRING },
            },
          },
        },
      },
    },
    examples: {
      type: Type.OBJECT,
      required: ['examples'],
      properties: {
        examples: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['title', 'explanation'],
            properties: {
              title: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
          },
        },
      },
    },
    tables: {
      type: Type.OBJECT,
      required: ['tables'],
      properties: {
        tables: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['title', 'headers', 'rows'],
            properties: {
              title: { type: Type.STRING },
              headers: { type: Type.ARRAY, items: { type: Type.STRING } },
              rows: {
                type: Type.ARRAY,
                items: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
          },
        },
      },
    },
    diagram: {
      type: Type.OBJECT,
      required: ['diagram'],
      properties: {
        diagram: {
          type: Type.OBJECT,
          required: ['title', 'diagramType', 'nodes', 'caption'],
          properties: {
            title: { type: Type.STRING },
            diagramType: { type: Type.STRING },
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['id', 'label'],
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  detail: { type: Type.STRING },
                },
              },
            },
            caption: { type: Type.STRING },
          },
        },
      },
    },
    mindMap: {
      type: Type.OBJECT,
      required: ['mindMap'],
      properties: {
        mindMap: {
          type: Type.OBJECT,
          required: ['centralTopic', 'branches'],
          properties: {
            centralTopic: { type: Type.STRING },
            branches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['title', 'subtopics'],
                properties: {
                  title: { type: Type.STRING },
                  subtopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
            },
          },
        },
      },
    },
    qaPairs: {
      type: Type.OBJECT,
      required: ['qaPairs'],
      properties: {
        qaPairs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['question', 'answer'],
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
              marksHint: { type: Type.STRING },
            },
          },
        },
      },
    },
    commonMistakes: {
      type: Type.OBJECT,
      required: ['commonMistakes'],
      properties: {
        commonMistakes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['mistake', 'correction'],
            properties: {
              mistake: { type: Type.STRING },
              correction: { type: Type.STRING },
            },
          },
        },
      },
    },
  };

  const response = await withRetry((abortSignal) =>
    ai.models.generateContent({
      model: VIDYORA_AI_MODEL,
      contents: `Regenerate ONLY the "${key}" section for these VIDYORA study notes in fresh, clearer, exam-ready Hinglish.
Note Title: "${payload.title}"
Class: "${payload.className}" | Subject: "${payload.subject}" | Note Type: "${payload.noteType}"
Existing Notes Context: ${payload.contextSummary.slice(0, 2000)}
Student Refinement Request: ${payload.instruction?.trim() || 'Make it clearer, sharper, and easier to revise with accurate formulas and zero fabricated textbook page references.'}`,
      config: {
        systemInstruction: BASE_SAFETY_SYSTEM,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal,
        responseMimeType: 'application/json',
        maxOutputTokens: 2048,
        responseSchema: schemaByKey[key],
      },
    })
  );

  const jsonStr = (response.text ?? '').trim();
  return JSON.parse(jsonStr);
}

export type QuizTrackParam = 'school' | 'college' | 'competitive';
export type QuizDifficultyParam = 'Easy' | 'Medium' | 'Hard' | 'Mixed';
export type QuizQuestionTypeParam =
  | 'mcq'
  | 'true-false'
  | 'fill-blank'
  | 'short-answer'
  | 'numerical'
  | 'assertion-reason'
  | 'match-following';

export interface QuizPayload {
  topic: string;
  chapterName?: string;
  subject?: string;
  track?: QuizTrackParam;
  level: string;
  count: number;
  difficulty?: QuizDifficultyParam;
  questionTypes?: QuizQuestionTypeParam[];
  timerMinutes?: number;
}

const STANDARD_AR_OPTIONS = [
  'Both Assertion (A) and Reason (R) are true, and R is the correct explanation of A.',
  'Both Assertion (A) and Reason (R) are true, but R is NOT the correct explanation of A.',
  'Assertion (A) is true, but Reason (R) is false.',
  'Assertion (A) is false, but Reason (R) is true.',
];

const TYPE_FORMAT_INSTRUCTIONS: Record<QuizQuestionTypeParam, string> = {
  mcq: 'type="mcq": 4 distinct clear options in "options", valid 0-based "correctIndex" (0..3), and "correctAnswerText" matching options[correctIndex].',
  'true-false':
    'type="true-false": unambiguous factual/conceptual statement in "question", options=["True","False"], correctIndex=0 for True or 1 for False, correctAnswerText="True" or "False".',
  'fill-blank':
    'type="fill-blank": put "______" in "question", options=[], correctIndex=0, exact concise answer in "correctAnswerText", plus 1-3 valid synonyms/spellings in "acceptedAnswers".',
  'short-answer':
    'type="short-answer": concise 1-line conceptual question, options=[], correctIndex=0, model 1-2 line Hinglish/English answer in "correctAnswerText", plus 3-5 core conceptual keywords in "acceptedAnswers".',
  numerical:
    'type="numerical": clear calculation problem with all required constants/given values stated cleanly, options=[], correctIndex=0, exact numeric answer in "correctAnswerText" (e.g. "12.5"), SI unit in "unit", numeric tolerance in "tolerance" (e.g. 0.05), and verify arithmetic carefully!',
  'assertion-reason':
    'type="assertion-reason": clear "assertion" statement and "reason" statement, options=the 4 standard A/R options, valid 0-based "correctIndex" (0..3). Double-check whether R truly explains A.',
  'match-following':
    'type="match-following": concise instruction in "question", options=[], correctIndex=0, and 3-4 distinct unambiguous pairs in "matchPairs" ([{left, right}]) where each left item matches ONLY its corresponding right item.',
};

export async function generateQuiz(payload: QuizPayload) {
  const ai = getClient();
  const safeCount = Math.min(15, Math.max(3, Math.round(payload.count || 5)));
  const safeDifficulty: QuizDifficultyParam =
    payload.difficulty && ['Easy', 'Medium', 'Hard', 'Mixed'].includes(payload.difficulty)
      ? payload.difficulty
      : 'Mixed';
  const safeTrack: QuizTrackParam =
    payload.track && ['school', 'college', 'competitive'].includes(payload.track)
      ? payload.track
      : 'school';

  const requestedTypes: QuizQuestionTypeParam[] =
    Array.isArray(payload.questionTypes) && payload.questionTypes.length > 0
      ? Array.from(new Set(payload.questionTypes))
      : ['mcq'];

  const typeGuides = requestedTypes
    .map((t) => `- ${TYPE_FORMAT_INSTRUCTIONS[t]}`)
    .join('\n');

  const topicLabel = payload.topic.trim() || payload.chapterName?.trim() || 'General Practice';
  const subjectLabel = payload.subject?.trim() || 'General Studies';
  const chapterLine = payload.chapterName?.trim()
    ? `Chapter: "${payload.chapterName.trim()}"\n`
    : '';

  const prompt = `Generate EXACTLY ${safeCount} high-quality, exam-accurate VIDYORA quiz questions in simple, clear Hinglish with accurate English subject terminology.
Track: "${safeTrack}"
Level / Class / Exam: "${payload.level}"
Subject: "${subjectLabel}"
${chapterLine}Topic: "${topicLabel}"
Difficulty: "${safeDifficulty}" ${safeDifficulty === 'Mixed' ? '(mix Easy, Medium, and Hard questions proportionally)' : `(keep all questions at ${safeDifficulty} difficulty)`}
Allowed Question Types (distribute across these types ONLY): ${requestedTypes.join(', ')}

STRICT FORMAT RULES BY QUESTION TYPE:
${typeGuides}

CRITICAL ACCURACY & QUALITY RULES:
1. NEVER repeat or duplicate any question or test the exact same fact twice.
2. VERIFY EVERY ANSWER KEY and arithmetic step before writing the JSON — zero wrong answer keys, zero ambiguous or trick-worded questions.
3. Keep difficulty, vocabulary, and syllabus strictly appropriate for "${payload.level}".
4. For EVERY question include a crisp "subtopic" (2-5 words, e.g. "Ohm's Law", "Series Circuits", "Discriminant Formula") so VIDYORA can analyze weak topics.
5. For EVERY question provide a clear Hinglish "explanation" explaining why the verified answer is right.
6. Use clean Unicode math symbols (², ³, √, ×, ÷, π, θ, Ω, ρ, Δ, →) and NEVER wrap formulas in markdown backticks (\`).`;

  const response = await withRetry((abortSignal) =>
    ai.models.generateContent({
      model: VIDYORA_AI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: BASE_SAFETY_SYSTEM,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal,
        responseMimeType: 'application/json',
        maxOutputTokens: 4096,
        responseSchema: {
          type: Type.OBJECT,
          required: ['title', 'topic', 'level', 'subject', 'difficulty', 'questions'],
          properties: {
            title: { type: Type.STRING },
            topic: { type: Type.STRING },
            level: { type: Type.STRING },
            subject: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: [
                  'id',
                  'type',
                  'difficulty',
                  'subtopic',
                  'question',
                  'options',
                  'correctIndex',
                  'correctAnswerText',
                  'explanation',
                ],
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  subtopic: { type: Type.STRING },
                  question: { type: Type.STRING },
                  assertion: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  correctAnswerText: { type: Type.STRING },
                  acceptedAnswers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  unit: { type: Type.STRING },
                  tolerance: { type: Type.NUMBER },
                  matchPairs: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ['left', 'right'],
                      properties: {
                        left: { type: Type.STRING },
                        right: { type: Type.STRING },
                      },
                    },
                  },
                  explanation: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    })
  );

  const jsonStr = (response.text ?? '').trim();
  const parsed = JSON.parse(jsonStr) as {
    title?: string;
    topic?: string;
    level?: string;
    subject?: string;
    difficulty?: string;
    questions?: Array<Record<string, unknown>>;
  };

  const allowedTypesSet = new Set<string>(requestedTypes);
  const seenStems = new Set<string>();
  const verifiedQuestions: Array<Record<string, unknown>> = [];

  for (let i = 0; i < (parsed.questions || []).length; i++) {
    const raw = parsed.questions![i];
    if (!raw || typeof raw.question !== 'string' || raw.question.trim().length < 4) continue;

    const stemKey = `${raw.question} ${raw.assertion || ''} ${raw.reason || ''}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    if (!stemKey || seenStems.has(stemKey)) continue;

    let qType = String(raw.type || requestedTypes[0]) as QuizQuestionTypeParam;
    if (!allowedTypesSet.has(qType)) {
      qType = requestedTypes[0];
    }

    const qDiff =
      raw.difficulty === 'Easy' || raw.difficulty === 'Medium' || raw.difficulty === 'Hard'
        ? raw.difficulty
        : safeDifficulty === 'Mixed'
          ? 'Medium'
          : safeDifficulty;

    const subtopic =
      typeof raw.subtopic === 'string' && raw.subtopic.trim().length > 0
        ? raw.subtopic.trim().slice(0, 80)
        : topicLabel;
    const explanation =
      typeof raw.explanation === 'string' && raw.explanation.trim().length > 0
        ? raw.explanation.trim()
        : 'Is question ka concept aur formula apni textbook se revise karein.';

    if (qType === 'true-false') {
      const idx =
        raw.correctIndex === 1 || String(raw.correctAnswerText || '').toLowerCase() === 'false'
          ? 1
          : 0;
      verifiedQuestions.push({
        id: `q-${verifiedQuestions.length + 1}`,
        type: 'true-false',
        difficulty: qDiff,
        subtopic,
        question: raw.question.trim(),
        options: ['True', 'False'],
        correctIndex: idx,
        correctAnswerText: idx === 0 ? 'True' : 'False',
        explanation,
      });
      seenStems.add(stemKey);
    } else if (qType === 'assertion-reason') {
      const opts =
        Array.isArray(raw.options) && raw.options.length === 4
          ? raw.options.map((o) => String(o).trim())
          : [...STANDARD_AR_OPTIONS];
      const idx =
        typeof raw.correctIndex === 'number' && raw.correctIndex >= 0 && raw.correctIndex < 4
          ? Math.floor(raw.correctIndex)
          : 0;
      verifiedQuestions.push({
        id: `q-${verifiedQuestions.length + 1}`,
        type: 'assertion-reason',
        difficulty: qDiff,
        subtopic,
        question: raw.question.trim(),
        assertion: String(raw.assertion || '').trim() || raw.question.trim(),
        reason: String(raw.reason || '').trim(),
        options: opts,
        correctIndex: idx,
        correctAnswerText: opts[idx],
        explanation,
      });
      seenStems.add(stemKey);
    } else if (qType === 'match-following') {
      const pairs = Array.isArray(raw.matchPairs)
        ? (raw.matchPairs as Array<Record<string, unknown>>)
            .filter(
              (p) =>
                p &&
                typeof p.left === 'string' &&
                p.left.trim().length > 0 &&
                typeof p.right === 'string' &&
                p.right.trim().length > 0
            )
            .slice(0, 5)
            .map((p) => ({ left: String(p.left).trim(), right: String(p.right).trim() }))
        : [];
      if (pairs.length < 2) continue;
      verifiedQuestions.push({
        id: `q-${verifiedQuestions.length + 1}`,
        type: 'match-following',
        difficulty: qDiff,
        subtopic,
        question: raw.question.trim(),
        options: [],
        correctIndex: 0,
        matchPairs: pairs,
        correctAnswerText: pairs.map((p) => `${p.left} → ${p.right}`).join('; '),
        explanation,
      });
      seenStems.add(stemKey);
    } else if (qType === 'fill-blank' || qType === 'short-answer' || qType === 'numerical') {
      const ans = String(raw.correctAnswerText || '').trim();
      if (!ans) continue;
      const accepted = Array.isArray(raw.acceptedAnswers)
        ? raw.acceptedAnswers.map((a) => String(a).trim()).filter(Boolean)
        : [ans];
      if (!accepted.includes(ans)) accepted.unshift(ans);
      verifiedQuestions.push({
        id: `q-${verifiedQuestions.length + 1}`,
        type: qType,
        difficulty: qDiff,
        subtopic,
        question: raw.question.trim(),
        options: [],
        correctIndex: 0,
        correctAnswerText: ans,
        acceptedAnswers: accepted.slice(0, 8),
        unit: typeof raw.unit === 'string' && raw.unit.trim() ? raw.unit.trim().slice(0, 24) : undefined,
        tolerance:
          qType === 'numerical'
            ? typeof raw.tolerance === 'number' && raw.tolerance >= 0
              ? raw.tolerance
              : 0.05
            : undefined,
        explanation,
      });
      seenStems.add(stemKey);
    } else {
      const opts = Array.isArray(raw.options)
        ? raw.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 4)
        : [];
      if (opts.length < 2) continue;
      const idx =
        typeof raw.correctIndex === 'number' &&
        raw.correctIndex >= 0 &&
        raw.correctIndex < opts.length
          ? Math.floor(raw.correctIndex)
          : 0;
      verifiedQuestions.push({
        id: `q-${verifiedQuestions.length + 1}`,
        type: 'mcq',
        difficulty: qDiff,
        subtopic,
        question: raw.question.trim(),
        options: opts,
        correctIndex: idx,
        correctAnswerText: opts[idx],
        explanation,
      });
      seenStems.add(stemKey);
    }

    if (verifiedQuestions.length >= safeCount) break;
  }

  if (verifiedQuestions.length === 0) {
    throw new AIServiceError(
      'Quiz questions incomplete generate huye the. Kripya dobara Generate Quiz par click karein.',
      502,
      'AI_INCOMPLETE_RESPONSE'
    );
  }

  return {
    id: `ai-quiz-${Date.now()}`,
    title: String(parsed.title || `${topicLabel} (${safeDifficulty} Practice Quiz)`),
    topic: String(parsed.topic || topicLabel),
    chapterName: payload.chapterName?.trim() || undefined,
    subject: String(parsed.subject || subjectLabel),
    track: safeTrack,
    level: String(parsed.level || payload.level),
    difficulty: safeDifficulty,
    questionTypes: requestedTypes,
    timerMinutes: typeof payload.timerMinutes === 'number' ? payload.timerMinutes : 0,
    source: 'ai',
    questions: verifiedQuestions,
  };
}

export interface StudyPlannerPayload {
  goal: string;
  level: string;
  timelineDays: number;
  dailyHours: number;
  focusSubjects?: string;
}

export async function generateStudyPlan(payload: StudyPlannerPayload) {
  const ai = getClient();
  const safeHours = Math.min(10, Math.max(1, Number(payload.dailyHours) || 3));
  const safeDays = Math.min(180, Math.max(3, Number(payload.timelineDays) || 30));

  const response = await withRetry((abortSignal) =>
    ai.models.generateContent({
      model: VIDYORA_AI_MODEL,
      contents: `Design a realistic, healthy, stress-free daily study plan in simple Hinglish for a student.
Goal: "${payload.goal}"
Level: "${payload.level}"
Timeline: ${safeDays} days
Daily study capacity: ${safeHours} hours/day
Priority focus subjects: "${payload.focusSubjects?.trim() || 'Balanced across core subjects'}"
Include short breaks, concept learning, active practice, and revision blocks. Avoid burnout schedules.`,
      config: {
        systemInstruction: BASE_SAFETY_SYSTEM,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            goal: { type: Type.STRING },
            timelineDays: { type: Type.INTEGER },
            dailyHours: { type: Type.NUMBER },
            strategySummary: { type: Type.STRING },
            dailyBlocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  timeSlot: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  subject: { type: Type.STRING },
                  activityType: { type: Type.STRING },
                  task: { type: Type.STRING },
                  tip: { type: Type.STRING },
                },
              },
            },
            weeklyMilestones: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    })
  );

  const jsonStr = (response.text ?? '').trim();
  return JSON.parse(jsonStr);
}
