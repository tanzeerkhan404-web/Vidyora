export interface ExamArenaPaper {
  id: string;
  title: string;
  format: 'Subject-wise' | 'Chapter-wise' | 'Full-Length Mock';
  examTrack: 'Class 10 Board' | 'JEE Main' | 'NEET-UG' | 'SSC / Reasoning';
  subject: string;
  durationMinutes: number;
  questions: Array<{
    id: string;
    topic: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

export const EXAM_ARENA_PAPERS: ExamArenaPaper[] = [
  {
    id: 'exam-class10-science',
    title: 'Class 10 Science — Core Concepts Practice Test',
    format: 'Subject-wise',
    examTrack: 'Class 10 Board',
    subject: 'Science',
    durationMinutes: 10,
    questions: [
      {
        id: 'q1',
        topic: 'Electricity',
        question: 'If a resistor of 10 Ω carries a current of 2 A, what is the potential difference across its ends?',
        options: ['5 V', '12 V', '20 V', '0.2 V'],
        correctIndex: 2,
        explanation: "By Ohm's Law, V = I × R = 2 A × 10 Ω = 20 V.",
      },
      {
        id: 'q2',
        topic: 'Acids & Bases',
        question: 'What happens to the pH of pure water (pH 7) when a small amount of HCl is dissolved in it?',
        options: ['Increases above 7', 'Decreases below 7', 'Stays exactly 7', 'Becomes 14'],
        correctIndex: 1,
        explanation: 'HCl increases H⁺ ion concentration, lowering pH below 7 (acidic).',
      },
      {
        id: 'q3',
        topic: 'Life Processes',
        question: 'Which vessel carries oxygenated blood from the lungs to the left atrium of the human heart?',
        options: ['Pulmonary artery', 'Vena cava', 'Pulmonary vein', 'Aorta'],
        correctIndex: 2,
        explanation: 'Pulmonary veins bring oxygenated blood from the lungs into the left atrium.',
      },
      {
        id: 'q4',
        topic: 'Optics',
        question: 'Which mirror is used as a rear-view mirror in vehicles to give a wider field of view?',
        options: ['Plane mirror', 'Concave mirror', 'Convex mirror', 'Parabolic mirror'],
        correctIndex: 2,
        explanation: 'Convex mirrors always form erect, diminished images providing a wider field of view.',
      },
      {
        id: 'q5',
        topic: 'Chemical Reactions',
        question: 'Rusting of iron is an example of which type of chemical reaction?',
        options: ['Thermal decomposition', 'Redox (Oxidation) reaction', 'Neutralization', 'Displacement only'],
        correctIndex: 1,
        explanation: 'Iron is oxidised in the presence of oxygen and moisture to form hydrated iron(III) oxide.',
      },
    ],
  },
  {
    id: 'exam-jee-kinematics',
    title: 'JEE Foundation — Kinematics & Algebra Sprint',
    format: 'Chapter-wise',
    examTrack: 'JEE Main',
    subject: 'Physics & Maths',
    durationMinutes: 12,
    questions: [
      {
        id: 'jq1',
        topic: 'Kinematics',
        question: 'A ball is thrown vertically upward with speed 20 m/s (take g = 10 m/s²). Maximum height reached is:',
        options: ['10 m', '20 m', '40 m', '5 m'],
        correctIndex: 1,
        explanation: 'H = u² / (2g) = (20 × 20) / (2 × 10) = 400 / 20 = 20 m.',
      },
      {
        id: 'jq2',
        topic: 'Quadratic Equations',
        question: 'For x² − 5x + 6 = 0, what is the sum of the roots?',
        options: ['-5', '5', '6', '-6'],
        correctIndex: 1,
        explanation: 'For ax² + bx + c = 0, sum of roots = -b/a = -(-5)/1 = 5 (roots are 2 and 3).',
      },
      {
        id: 'jq3',
        topic: 'Calculus',
        question: 'What is the derivative d/dx of f(x) = 3x² + 4x − 7?',
        options: ['6x + 4', '3x + 4', '6x² + 4', '6x − 7'],
        correctIndex: 0,
        explanation: 'Using the power rule: d/dx(3x²) = 6x, d/dx(4x) = 4, d/dx(-7) = 0.',
      },
      {
        id: 'jq4',
        topic: 'Work & Energy',
        question: 'Kinetic energy of a 2 kg mass moving at 3 m/s is:',
        options: ['6 J', '9 J', '12 J', '18 J'],
        correctIndex: 1,
        explanation: 'KE = ½ m v² = 0.5 × 2 × 9 = 9 J.',
      },
    ],
  },
  {
    id: 'exam-neet-bio-mock',
    title: 'NEET-UG Starter Mock — Cell & Human Physiology',
    format: 'Full-Length Mock',
    examTrack: 'NEET-UG',
    subject: 'Biology',
    durationMinutes: 15,
    questions: [
      {
        id: 'nq1',
        topic: 'Cell Biology',
        question: 'Which organelle is known as the powerhouse of the cell due to ATP synthesis via oxidative phosphorylation?',
        options: ['Ribosome', 'Mitochondrion', 'Golgi apparatus', 'Lysosome'],
        correctIndex: 1,
        explanation: 'Mitochondria generate most cellular ATP through aerobic respiration.',
      },
      {
        id: 'nq2',
        topic: 'Genetics',
        question: 'In DNA, Adenine (A) always pairs with which nitrogenous base via two hydrogen bonds?',
        options: ['Guanine (G)', 'Cytosine (C)', 'Thymine (T)', 'Uracil (U)'],
        correctIndex: 2,
        explanation: 'In double-stranded DNA, A pairs with T (2 H-bonds) and G pairs with C (3 H-bonds).',
      },
      {
        id: 'nq3',
        topic: 'Human Physiology',
        question: 'Which hormone lowers blood glucose levels by promoting cellular glucose uptake?',
        options: ['Glucagon', 'Insulin', 'Adrenaline', 'Thyroxine'],
        correctIndex: 1,
        explanation: 'Insulin secreted by pancreatic beta cells stimulates glucose uptake and glycogen storage.',
      },
      {
        id: 'nq4',
        topic: 'Plant Physiology',
        question: 'Stomatal opening and closing in leaves is directly regulated by:',
        options: ['Xylem vessels', 'Guard cells', 'Sieve tubes', 'Root hairs'],
        correctIndex: 1,
        explanation: 'Changes in turgor pressure of guard cells control stomatal pore aperture.',
      },
    ],
  },
];

export interface AdmissionProfile {
  id: string;
  institutionGroup: string;
  location: string;
  courses: string[];
  entranceExam: string;
  eligibilitySummary: string;
  processSummary: string;
  officialPortalUrl: string;
  lastUpdated: string;
}

export const ADMISSION_PROFILES: AdmissionProfile[] = [
  {
    id: 'adm-iits',
    institutionGroup: 'Indian Institutes of Technology (IITs)',
    location: 'Pan-India (23 Campuses)',
    courses: ['B.Tech', 'B.S.', 'Dual Degree Engineering'],
    entranceExam: 'JEE Main → JEE Advanced',
    eligibilitySummary: 'Qualify Class 12 (PCM) & meet official JEE Main/Advanced cutoff and JoSAA criteria.',
    processSummary: 'Appear in JEE Main, qualify in top rank pool for JEE Advanced, participate in JoSAA centralised counselling.',
    officialPortalUrl: 'https://jeeadv.ac.in/',
    lastUpdated: '2026-11-01',
  },
  {
    id: 'adm-nits',
    institutionGroup: 'NITs, IIITs & GFTIs',
    location: 'Pan-India (31+ Campuses)',
    courses: ['B.Tech', 'B.Arch', 'B.Plan'],
    entranceExam: 'JEE Main (NTA)',
    eligibilitySummary: 'Class 12 with Physics, Mathematics & required subject per NTA/JoSAA brochure.',
    processSummary: 'Register on NTA JEE Main portal, appear for Session 1/2, apply via JoSAA / CSAB counselling.',
    officialPortalUrl: 'https://jeemain.nta.nic.in/',
    lastUpdated: '2026-11-01',
  },
  {
    id: 'adm-aiims-mbbs',
    institutionGroup: 'AIIMS & Government Medical Colleges',
    location: 'Pan-India',
    courses: ['MBBS', 'BDS', 'AYUSH'],
    entranceExam: 'NEET-UG (NTA)',
    eligibilitySummary: 'Class 12 with Physics, Chemistry, Biology/Biotechnology & English meeting NMC/NTA rules.',
    processSummary: 'Appear in NEET-UG conducted by NTA; apply via MCC (All India Quota) and respective State counselling portals.',
    officialPortalUrl: 'https://exams.nta.ac.in/NEET/',
    lastUpdated: '2026-11-01',
  },
  {
    id: 'adm-cuet',
    institutionGroup: 'Central Universities (DU, BHU, JNU, Hyderabad Univ & more)',
    location: 'Delhi, Varanasi, Hyderabad & Pan-India',
    courses: ['B.A.', 'B.Sc.', 'B.Com', 'Integrated Programmes'],
    entranceExam: 'CUET-UG (NTA)',
    eligibilitySummary: 'Class 12 pass + specific domain subjects required by each target university programme.',
    processSummary: 'Take CUET-UG domain & language tests, then apply separately on individual university admission portals (e.g. DU CSAS).',
    officialPortalUrl: 'https://exams.nta.ac.in/CUET-UG/',
    lastUpdated: '2026-11-01',
  },
  {
    id: 'adm-iisc',
    institutionGroup: 'Indian Institute of Science (IISc Bengaluru)',
    location: 'Bengaluru, Karnataka',
    courses: ['B.Sc. (Research)', 'B.Tech in Mathematics & Computing'],
    entranceExam: 'IAT (IISER Aptitude Test) / JEE Advanced',
    eligibilitySummary: 'Class 12 with Science/Mathematics meeting official IISc UG eligibility brochure.',
    processSummary: 'Apply on IISc Admissions portal and submit valid IAT or JEE Advanced score per course.',
    officialPortalUrl: 'https://iisc.ac.in/admissions/',
    lastUpdated: '2026-11-01',
  },
];

export interface SkillTrack {
  id: string;
  category:
    | 'Programming'
    | 'Communication'
    | 'Graphic Design'
    | 'Digital Literacy'
    | 'Financial Literacy'
    | 'Entrepreneurship'
    | 'Problem Solving';
  tagline: string;
  levels: Array<{
    id: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    title: string;
    assignment: string;
  }>;
}

export const SKILLVERSE_TRACKS: SkillTrack[] = [
  {
    id: 'sk-prog',
    category: 'Programming',
    tagline: 'Build logical thinking with Python, Web HTML/CSS/JS, and algorithmic problem solving.',
    levels: [
      { id: 'prog-1', level: 'Beginner', title: 'Variables, Loops & Functions', assignment: 'Write a grade calculator that converts marks into letter grades.' },
      { id: 'prog-2', level: 'Intermediate', title: 'Interactive Web Page (HTML/CSS/JS)', assignment: 'Build a clean responsive flashcard study web page.' },
      { id: 'prog-3', level: 'Advanced', title: 'Data Structures & Mini Project', assignment: 'Create a student expense & study-goal tracker app.' },
    ],
  },
  {
    id: 'sk-comm',
    category: 'Communication',
    tagline: 'Speak clearly, structure essays, and present science/business ideas with confidence.',
    levels: [
      { id: 'comm-1', level: 'Beginner', title: 'Active Listening & Clear Paragraph Writing', assignment: 'Summarise any science chapter in 5 crisp sentences.' },
      { id: 'comm-2', level: 'Intermediate', title: 'Structured 3-Minute Presentations', assignment: 'Prepare a 3-slide explanation of a real-life problem in your town.' },
      { id: 'comm-3', level: 'Advanced', title: 'Debate, Persuasion & Interview Readiness', assignment: 'Draft balanced arguments for and against AI in classrooms.' },
    ],
  },
  {
    id: 'sk-design',
    category: 'Graphic Design',
    tagline: 'Visual hierarchy, typography, colour contrast, and educational infographic layout.',
    levels: [
      { id: 'des-1', level: 'Beginner', title: 'Colour Contrast & Clean Alignment', assignment: 'Design a readable study poster using at most 3 colours.' },
      { id: 'des-2', level: 'Intermediate', title: 'Infographic Storytelling', assignment: 'Turn the Water Cycle into a 4-panel visual diagram.' },
      { id: 'des-3', level: 'Advanced', title: 'Accessible UI Wireframing', assignment: 'Sketch a mobile screen accessible for low-vision learners.' },
    ],
  },
  {
    id: 'sk-digital',
    category: 'Digital Literacy',
    tagline: 'Online safety, fact-checking sources, spreadsheets, and cyber hygiene for students.',
    levels: [
      { id: 'dig-1', level: 'Beginner', title: 'Password Safety & Phishing Detection', assignment: 'Checklist 5 warning signs of a fake scholarship website.' },
      { id: 'dig-2', level: 'Intermediate', title: 'Spreadsheets & Data Charts', assignment: 'Plot your weekly quiz accuracy chart in a spreadsheet.' },
      { id: 'dig-3', level: 'Advanced', title: 'Responsible AI & Source Verification', assignment: 'Fact-check 3 AI-generated statements against NCERT textbooks.' },
    ],
  },
  {
    id: 'sk-finance',
    category: 'Financial Literacy',
    tagline: 'Budgeting, compound interest, UPI safety, and understanding inflation & savings.',
    levels: [
      { id: 'fin-1', level: 'Beginner', title: 'Needs vs Wants & Pocket Money Budget', assignment: 'Draft a balanced ₹1,000 monthly student budget.' },
      { id: 'fin-2', level: 'Intermediate', title: 'Simple vs Compound Interest', assignment: 'Compare ₹5,000 saved at 7% simple vs compound interest over 5 years.' },
      { id: 'fin-3', level: 'Advanced', title: 'Digital Banking & Scam Prevention', assignment: 'Write a 1-page family guide on safe UPI & OTP hygiene.' },
    ],
  },
  {
    id: 'sk-entre',
    category: 'Entrepreneurship',
    tagline: 'Identify community problems, validate ideas, budget responsibly, and pitch clearly.',
    levels: [
      { id: 'ent-1', level: 'Beginner', title: 'Problem Discovery Interviews', assignment: 'Interview 3 classmates about a daily school difficulty.' },
      { id: 'ent-2', level: 'Intermediate', title: 'Unit Economics & Break-Even Basics', assignment: 'Calculate cost per item and break-even quantity for a school craft stall.' },
      { id: 'ent-3', level: 'Advanced', title: 'Ethical Social Enterprise Pitch', assignment: 'Write a 1-page social impact plan using the Young Entrepreneur Studio.' },
    ],
  },
  {
    id: 'sk-prob',
    category: 'Problem Solving',
    tagline: 'First-principles reasoning, Fermi estimation, and structured root-cause analysis.',
    levels: [
      { id: 'prb-1', level: 'Beginner', title: 'Breaking Big Problems into Sub-Steps', assignment: 'Decompose a complex math word problem into 4 atomic steps.' },
      { id: 'prb-2', level: 'Intermediate', title: 'Root-Cause Analysis (5 Whys)', assignment: 'Apply "5 Whys" to understand why exam revision gets rushed.' },
      { id: 'prb-3', level: 'Advanced', title: 'Fermi Estimation Challenge', assignment: 'Estimate the number of notebook pages used by your school in a year.' },
    ],
  },
];
