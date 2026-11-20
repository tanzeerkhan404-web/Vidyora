import type {
  LearningPackage,
  MembershipPlan,
} from '../types/vidyora';

export const DEFAULT_MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    tagline: 'Har student ke liye hamesha free learning start.',
    priceInr: 0,
    billingCycle: 'forever',
    badge: 'Always Free',
    recommended: false,
    aiDailyLimit: 40,
    features: [
      'School (Class 1–12), College & Competitive sample video lessons',
      'AI Study Buddy, Doubt Solver, Notes, Quiz & Study Planner access',
      'Free revision notes, definitions aur formula sheets',
      'Android PWA install & offline cached app shell',
    ],
    benefits: [
      'Zero cost — koi card ya payment details zaroori nahi',
      'Simple Hinglish explanations aur visual animations',
      'Local + optional Google cloud progress sync',
    ],
    usageLimits: [
      'Up to 40 AI requests / day (fair student quota)',
      '15 AI requests per 15-minute safety window',
      'Standard PDF & image upload limits (4 MB image / 6 MB PDF)',
    ],
    offer: {
      active: false,
      label: '',
      discountPercent: 0,
      note: '',
    },
    active: true,
  },
  {
    id: 'student',
    name: 'Student Plan',
    tagline: 'Daily school, board aur semester preparation ke liye best value.',
    priceInr: 49,
    billingCycle: 'month',
    badge: 'Most Popular',
    recommended: true,
    aiDailyLimit: 120,
    features: [
      'Free Plan ke saare features included',
      'Higher planned daily AI allowance (120 requests/day)',
      'Full chapter-wise board & semester revision note sets',
      'Detailed quiz weak-topic tracking aur chapter practice packs',
    ],
    benefits: [
      'Pocket-friendly ₹49/month student pricing',
      'School (Class 1–12) aur College dono ke liye ideal',
      'Faster exam revision with printable formula sheets',
    ],
    usageLimits: [
      'Planned 120 AI requests / day (after verified payment activation)',
      'Priority AI Study Buddy & Notes generation queue',
      'Save & organize unlimited study notes in cloud sync',
    ],
    offer: {
      active: false,
      label: 'Exam Season Offer',
      discountPercent: 0,
      note: 'Limited-time student discount',
    },
    active: true,
  },
  {
    id: 'pro',
    name: 'Pro Learner Plan',
    tagline: 'Serious board toppers aur competitive exam aspirants ke liye.',
    priceInr: 99,
    billingCycle: 'month',
    badge: 'Best for Exams',
    recommended: false,
    aiDailyLimit: 250,
    features: [
      'Student Plan ke saare features included',
      'Maximum planned daily AI allowance (250 requests/day)',
      'JEE, NEET, UPSC, SSC & Banking mock test drills',
      'Deep step-by-step doubt solving aur custom study timetables',
    ],
    benefits: [
      'Complete School + College + Competitive Exam coverage',
      'High-volume practice quizzes with full explanations',
      'Priority support & early access to new visual modules',
    ],
    usageLimits: [
      'Planned 250 AI requests / day (after verified payment activation)',
      'Extended mock tests & multi-chapter revision generators',
      'Cloud sync across devices with full performance history',
    ],
    offer: {
      active: false,
      label: 'Launch Special',
      discountPercent: 0,
      note: 'Introductory competitive exam offer',
    },
    active: true,
  },
];

export const DEFAULT_LEARNING_PACKAGES: LearningPackage[] = [
  {
    id: 'school',
    name: 'School Package',
    shortLabel: 'School (1–12)',
    tagline: 'Classes 1–12 NCERT-aligned visual learning aur board exam tayari.',
    description:
      'Class 1 se Class 12 ke sabhi major subjects — chapter-wise animated video lessons, easy Hinglish revision notes, practice quizzes aur Class 10/12 board preparation ek hi jagah.',
    targetAudience: 'Class 1–12 Students (CBSE, ICSE & State Boards)',
    categoryLink: 'school',
    subjects: [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'English',
      'History',
      'Geography',
      'Computer Science',
    ],
    includedResources: [
      'Classes 1–12 chapter-wise video lessons & visual diagrams',
      'NCERT-style short notes, formula sheets & definitions',
      'Chapter-end MCQs, numericals & assertion-reason quizzes',
      'Class 10 & 12 Board Exam revision strategy & sample practice',
    ],
    featuredModules: [
      'Class 10 Maths: Real Numbers, Quadratic Equations & Trigonometry',
      'Class 10 Science: Light, Electricity, Chemical Reactions & Life Processes',
      'Class 12 Physics & Chemistry: Electrostatics, Optics & Organic Concepts',
      'Class 6–9 Foundation: Fractions, Cell Biology, Motion & Indian History',
    ],
    active: true,
  },
  {
    id: 'college',
    name: 'College Package',
    shortLabel: 'College',
    tagline: 'Semester subjects, core concept clarity aur smart assignment learning.',
    description:
      'B.Tech, B.Sc, B.Com aur B.A students ke liye core subjects ke deep concept explanations, semester exam revision sheets, concept quizzes aur ethical assignment understanding support.',
    targetAudience: 'Undergraduate & Diploma College Learners',
    categoryLink: 'college',
    subjects: [
      'Data Structures & Algorithms',
      'Engineering Mathematics',
      'Operating Systems & DBMS',
      'Physics & Electronics',
      'Economics & Accounting',
      'Organic & Physical Chemistry',
    ],
    includedResources: [
      'Deep conceptual explanations with real-world engineering & business examples',
      'Semester quick-revision packs & one-page formula sheets',
      'Topic-wise quizzes to test viva & university exam readiness',
      'Step-by-step assignment concept guidance via AI Study Buddy',
    ],
    featuredModules: [
      'DSA Mastery: Arrays, Trees, Graphs & Time Complexity Analysis',
      'Engineering Maths: Matrices, Calculus, Differential Equations & Probability',
      'Core CS: OS Scheduling, Normalization in DBMS & Computer Networks',
      'Commerce & Econ: Micro/Macroeconomics, Financial Ratios & Accounting',
    ],
    active: true,
  },
  {
    id: 'competitive',
    name: 'Competitive Exam Package',
    shortLabel: 'Competitive Exams',
    tagline: 'JEE, NEET, UPSC, SSC, Banking aur other exams ke liye structured prep.',
    description:
      'India ke top competitive exams ke liye exam-wise subjects, high-yield concept lessons, daily practice questions, PYQ-style drills aur timed mock tests.',
    targetAudience: 'JEE, NEET, UPSC, SSC, Banking & State Exam Aspirants',
    categoryLink: 'competitive',
    subjects: [
      'Physics (JEE / NEET)',
      'Chemistry (Organic, Inorganic, Physical)',
      'Mathematics & Quantitative Aptitude',
      'Biology (NEET NCERT Mastery)',
      'Indian Polity, History & Economy',
      'Logical Reasoning & English Comprehension',
    ],
    includedResources: [
      'Exam-wise subject tracks & high-weightage concept breakdowns',
      'Timed AI mock tests with detailed step-by-step explanations',
      'Formula & shortcut revision sheets for speed & accuracy',
      'Weak-topic diagnostics & custom daily exam study timetables',
    ],
    examGroups: [
      {
        name: 'JEE (Main & Advanced)',
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        highlights: [
          'Mechanics, Electrostatics, Calculus & Coordinate Geometry',
          'Multi-concept numericals & timed mock practice',
        ],
      },
      {
        name: 'NEET UG',
        subjects: ['Biology (Botany & Zoology)', 'Physics', 'Chemistry'],
        highlights: [
          'Line-by-line NCERT Biology focus & Assertion-Reason drills',
          'High-yield Physics formulas & Organic mechanisms',
        ],
      },
      {
        name: 'UPSC CSE',
        subjects: ['Indian Polity', 'Modern History', 'Geography', 'Economy', 'CSAT'],
        highlights: [
          'Constitutional articles, governance & static GS foundations',
          'Prelims-style analytical MCQs & structured revision notes',
        ],
      },
      {
        name: 'SSC (CGL / CHSL)',
        subjects: ['Quantitative Aptitude', 'General Intelligence', 'English', 'General Awareness'],
        highlights: [
          'Speed-math tricks, grammar rules & static GK capsules',
          'Timed tier-wise mixed mock quizzes',
        ],
      },
      {
        name: 'Banking (IBPS / SBI PO & Clerk)',
        subjects: ['Reasoning Ability', 'Data Interpretation & Quant', 'English', 'Banking Awareness'],
        highlights: [
          'Puzzles, syllogisms, DI sets & banking terminology',
          'Accuracy-focused timed speed drills',
        ],
      },
    ],
    featuredModules: [
      'JEE Physics & Maths Numerical Mastery',
      'NEET Biology NCERT Diagrams & Assertion-Reason Practice',
      'UPSC Indian Polity & Modern History Foundation',
      'SSC & Banking Quantitative Aptitude + Reasoning Speed Drills',
    ],
    active: true,
  },
];
