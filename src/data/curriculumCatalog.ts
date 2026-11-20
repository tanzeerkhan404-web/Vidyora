import type {
  CurriculumChapter,
  CurriculumClass,
  LearningCategory,
} from '../types/vidyora';

const PRIMARY_SUBJECTS = [
  { name: 'Mathematics', shortDesc: 'Numbers, fractions, shapes & basic operations' },
  { name: 'Environmental Studies (EVS)', shortDesc: 'Plants, animals, water & our surroundings' },
  { name: 'English', shortDesc: 'Reading stories, grammar & vocabulary' },
  { name: 'Hindi', shortDesc: 'Vyakaran, kahaniyan aur lekhan' },
  { name: 'General Science', shortDesc: 'Everyday science discoveries & experiments' },
];

const MIDDLE_SUBJECTS = [
  { name: 'Mathematics', shortDesc: 'Integers, algebra, geometry & mensuration' },
  { name: 'Science', shortDesc: 'Light, sound, cells, acids & force basics' },
  { name: 'English', shortDesc: 'Literature, comprehension & writing skills' },
  { name: 'History', shortDesc: 'Ancient, medieval & modern India stories' },
  { name: 'Geography', shortDesc: 'Earth, landforms, climate & maps' },
  { name: 'Civics', shortDesc: 'Democracy, local government & rights' },
  { name: 'Computer Science', shortDesc: 'Logic, flowcharts & coding fundamentals' },
];

const SECONDARY_SUBJECTS = [
  { name: 'Mathematics', shortDesc: 'Real numbers, quadratic equations, trigonometry & statistics' },
  { name: 'Science', shortDesc: 'Physics, Chemistry & Biology NCERT board core' },
  { name: 'English', shortDesc: 'Board grammar, prose, poetry & formal writing' },
  { name: 'History', shortDesc: 'Nationalism, world revolutions & print culture' },
  { name: 'Geography', shortDesc: 'Resources, agriculture, minerals & lifelines' },
  { name: 'Economics', shortDesc: 'Development, sectors of Indian economy & money' },
  { name: 'Political Science', shortDesc: 'Power sharing, federalism & democracy' },
];

const SENIOR_SECONDARY_SUBJECTS = [
  { name: 'Mathematics', shortDesc: 'Calculus, vectors, matrices & probability' },
  { name: 'Physics', shortDesc: 'Mechanics, waves, electrostatics & modern physics' },
  { name: 'Chemistry', shortDesc: 'Atomic structure, bonding, organic & physical chemistry' },
  { name: 'Biology', shortDesc: 'Genetics, reproduction, human physiology & biotech' },
  { name: 'Computer Science', shortDesc: 'Python, SQL, data structures & networking' },
  { name: 'English', shortDesc: 'Core literature, reading & analytical writing' },
  { name: 'History', shortDesc: 'World themes & Indian historical sources' },
  { name: 'Geography', shortDesc: 'Physical geography & human settlements' },
  { name: 'Economics', shortDesc: 'Microeconomics, macroeconomics & Indian economy' },
];

export const SCHOOL_CLASSES: CurriculumClass[] = [
  {
    id: 'class-1',
    category: 'school',
    name: 'Class 1',
    groupLabel: 'Primary',
    subtitle: 'Foundational numbers, phonics & nature',
    subjects: PRIMARY_SUBJECTS,
  },
  {
    id: 'class-2',
    category: 'school',
    name: 'Class 2',
    groupLabel: 'Primary',
    subtitle: 'Addition, subtraction, stories & surroundings',
    subjects: PRIMARY_SUBJECTS,
  },
  {
    id: 'class-3',
    category: 'school',
    name: 'Class 3',
    groupLabel: 'Primary',
    subtitle: 'Multiplication, measurement & living world',
    subjects: PRIMARY_SUBJECTS,
  },
  {
    id: 'class-4',
    category: 'school',
    name: 'Class 4',
    groupLabel: 'Primary',
    subtitle: 'Division, factors, ecosystems & grammar',
    subjects: PRIMARY_SUBJECTS,
  },
  {
    id: 'class-5',
    category: 'school',
    name: 'Class 5',
    groupLabel: 'Primary',
    subtitle: 'Fractions, decimals, maps & science basics',
    subjects: PRIMARY_SUBJECTS,
  },
  {
    id: 'class-6',
    category: 'school',
    name: 'Class 6',
    groupLabel: 'Middle School',
    subtitle: 'Ratios, magnets, ancient history & earth',
    subjects: MIDDLE_SUBJECTS,
  },
  {
    id: 'class-7',
    category: 'school',
    name: 'Class 7',
    groupLabel: 'Middle School',
    subtitle: 'Integers, heat, nutrition & medieval India',
    subjects: MIDDLE_SUBJECTS,
  },
  {
    id: 'class-8',
    category: 'school',
    name: 'Class 8',
    groupLabel: 'Middle School',
    subtitle: 'Linear equations, sound, force & modern history',
    subjects: MIDDLE_SUBJECTS,
  },
  {
    id: 'class-9',
    category: 'school',
    name: 'Class 9',
    groupLabel: 'Secondary',
    subtitle: 'Polynomials, motion, tissues & democracy',
    subjects: SECONDARY_SUBJECTS,
  },
  {
    id: 'class-10',
    category: 'school',
    name: 'Class 10',
    groupLabel: 'Board Exam',
    subtitle: 'NCERT Board Maths, Science & Social Studies',
    subjects: SECONDARY_SUBJECTS,
  },
  {
    id: 'class-11',
    category: 'school',
    name: 'Class 11',
    groupLabel: 'Senior Secondary',
    subtitle: 'Core Physics, Chemistry, Maths & Biology foundations',
    subjects: SENIOR_SECONDARY_SUBJECTS,
  },
  {
    id: 'class-12',
    category: 'school',
    name: 'Class 12',
    groupLabel: 'Board Exam',
    subtitle: 'Board & Entrance mastery in Science, Maths & Humanities',
    subjects: SENIOR_SECONDARY_SUBJECTS,
  },
];

export const NON_SCHOOL_TRACKS: CurriculumClass[] = [
  {
    id: 'college-cs',
    category: 'college',
    name: 'B.Tech / B.Sc CS',
    groupLabel: 'College',
    subtitle: 'Data Structures, Algorithms, OS & DBMS',
    subjects: [
      { name: 'Computer Science', shortDesc: 'DSA, Trees, Graphs & Time Complexity' },
      { name: 'Engineering Mathematics', shortDesc: 'Linear Algebra, Calculus & Discrete Math' },
      { name: 'Electronics', shortDesc: 'Digital Logic, Signals & Microcontrollers' },
    ],
  },
  {
    id: 'college-commerce',
    category: 'college',
    name: 'B.Com / Economics',
    groupLabel: 'College',
    subtitle: 'Accounting, Macroeconomics & Business Analytics',
    subjects: [
      { name: 'Economics', shortDesc: 'GDP, Monetary Policy & Market Equilibrium' },
      { name: 'Accounting', shortDesc: 'Balance Sheets, Cash Flow & Ratios' },
    ],
  },
  {
    id: 'comp-jee-neet',
    category: 'competitive',
    name: 'JEE / NEET',
    groupLabel: 'Entrance',
    subtitle: 'High-yield Physics, Chemistry, Maths & Biology drills',
    subjects: [
      { name: 'Physics', shortDesc: 'Electrostatics, Mechanics, Optics & Modern Physics' },
      { name: 'Chemistry', shortDesc: 'Organic Mechanisms, Thermodynamics & Equilibrium' },
      { name: 'Mathematics', shortDesc: 'Calculus, Coordinate Geometry & Algebra' },
      { name: 'Biology', shortDesc: 'NCERT Line-by-Line Genetics & Physiology' },
    ],
  },
  {
    id: 'comp-upsc-ssc',
    category: 'competitive',
    name: 'UPSC / SSC',
    groupLabel: 'Civil Services',
    subtitle: 'Indian Polity, Modern History, Economy & Reasoning',
    subjects: [
      { name: 'Indian Polity', shortDesc: 'Constitution, Fundamental Rights & Parliament' },
      { name: 'History', shortDesc: 'Indian Freedom Movement & Art & Culture' },
      { name: 'Quantitative Aptitude', shortDesc: 'Speed Maths, Ratios & Data Interpretation' },
    ],
  },
  {
    id: 'gk-curious',
    category: 'gk',
    name: 'All Learners',
    groupLabel: 'General Knowledge',
    subtitle: 'Space Science, Everyday Finance & World Affairs',
    subjects: [
      { name: 'Space Science', shortDesc: 'ISRO Missions, Orbits & Astronomy' },
      { name: 'Personal Finance', shortDesc: 'Compounding, Budgeting & Inflation' },
      { name: 'World Affairs', shortDesc: 'Global Geography, Science & Innovations' },
    ],
  },
];

export const ALL_CURRICULUM_CLASSES: CurriculumClass[] = [
  ...SCHOOL_CLASSES,
  ...NON_SCHOOL_TRACKS,
];

export function getClassesForCategory(
  category: Exclude<LearningCategory, 'all'>
): CurriculumClass[] {
  return ALL_CURRICULUM_CLASSES.filter((c) => c.category === category);
}

export function getSubjectsForClass(className: string): CurriculumClass['subjects'] {
  const match = ALL_CURRICULUM_CLASSES.find((c) => c.name === className);
  return match ? match.subjects : SECONDARY_SUBJECTS;
}

export const CURRICULUM_CHAPTERS: CurriculumChapter[] = [
  // Class 5 Mathematics
  {
    id: 'ch-c5-math-7',
    category: 'school',
    className: 'Class 5',
    subject: 'Mathematics',
    chapterNumber: 7,
    chapterName: 'Fractions',
    description: 'Equal parts, numerator-denominator basics aur equivalent ratios visual slices ke saath.',
  },
  // Class 8 Science
  {
    id: 'ch-c8-sci-13',
    category: 'school',
    className: 'Class 8',
    subject: 'Science',
    chapterNumber: 13,
    chapterName: 'Sound',
    description: 'Vibrations se sound waves kaise banti hain, frequency (pitch) aur amplitude (loudness).',
  },

  // Class 10 Mathematics (Requested Sample Content)
  {
    id: 'ch-c10-math-1',
    category: 'school',
    className: 'Class 10',
    subject: 'Mathematics',
    chapterNumber: 1,
    chapterName: 'Real Numbers',
    description: 'Fundamental Theorem of Arithmetic, HCF/LCM prime factorization aur irrational numbers ke proofs.',
  },
  {
    id: 'ch-c10-math-4',
    category: 'school',
    className: 'Class 10',
    subject: 'Mathematics',
    chapterNumber: 4,
    chapterName: 'Quadratic Equations',
    description: 'Standard form ax² + bx + c = 0, factorization, quadratic formula aur discriminant se nature of roots.',
  },
  {
    id: 'ch-c10-math-8',
    category: 'school',
    className: 'Class 10',
    subject: 'Mathematics',
    chapterNumber: 8,
    chapterName: 'Introduction to Trigonometry',
    description: 'Right-angled triangle ke sin, cos, tan ratios, standard angle values aur core trigonometric identities.',
  },

  // Class 10 Science (Requested Sample Content)
  {
    id: 'ch-c10-sci-1',
    category: 'school',
    className: 'Class 10',
    subject: 'Science',
    chapterNumber: 1,
    chapterName: 'Chemical Reactions and Equations',
    description: 'Chemical equations ko balance karna, combination, decomposition, displacement aur redox reactions.',
  },
  {
    id: 'ch-c10-sci-6',
    category: 'school',
    className: 'Class 10',
    subject: 'Science',
    chapterNumber: 6,
    chapterName: 'Life Processes',
    description: 'Photosynthesis, human digestion, respiration, circulation aur excretion step-by-step.',
  },
  {
    id: 'ch-c10-sci-10',
    category: 'school',
    className: 'Class 10',
    subject: 'Science',
    chapterNumber: 10,
    chapterName: 'Light — Reflection and Refraction',
    description: 'Concave/Convex mirrors, ray diagrams, mirror formula aur Snell’s Law of Refraction.',
  },

  // Class 11 Physics (Requested Sample Content)
  {
    id: 'ch-c11-phy-3',
    category: 'school',
    className: 'Class 11',
    subject: 'Physics',
    chapterNumber: 3,
    chapterName: 'Motion in a Straight Line',
    description: 'Displacement vs distance, instantaneous velocity, acceleration aur v-t graphs se kinematic equations.',
  },
  {
    id: 'ch-c11-phy-5',
    category: 'school',
    className: 'Class 11',
    subject: 'Physics',
    chapterNumber: 5,
    chapterName: 'Laws of Motion',
    description: 'Newton ke teeno laws, inertia, momentum (p = mv), free-body diagrams aur friction.',
  },

  // Class 11 Chemistry (Requested Sample Content)
  {
    id: 'ch-c11-chem-2',
    category: 'school',
    className: 'Class 11',
    subject: 'Chemistry',
    chapterNumber: 2,
    chapterName: 'Structure of Atom',
    description: 'Bohr’s atomic model, de Broglie wavelength, Heisenberg principle aur 4 quantum numbers (n, l, m, s).',
  },
  {
    id: 'ch-c11-chem-4',
    category: 'school',
    className: 'Class 11',
    subject: 'Chemistry',
    chapterNumber: 4,
    chapterName: 'Chemical Bonding and Molecular Structure',
    description: 'Ionic vs covalent bonds, Lewis dot structures, hybridization aur VSEPR molecular geometry.',
  },

  // Class 12 Biology (Requested Sample Content)
  {
    id: 'ch-c12-bio-2',
    category: 'school',
    className: 'Class 12',
    subject: 'Biology',
    chapterNumber: 2,
    chapterName: 'Sexual Reproduction in Flowering Plants',
    description: 'Flower structure, microsporogenesis, pollination agents aur angiosperms mein double fertilization.',
  },
  {
    id: 'ch-c12-bio-6',
    category: 'school',
    className: 'Class 12',
    subject: 'Biology',
    chapterNumber: 6,
    chapterName: 'Molecular Basis of Inheritance',
    description: 'DNA double helix structure, semi-conservative replication, transcription aur genetic code.',
  },

  // College, Competitive & GK chapters
  {
    id: 'ch-col-cs-3',
    category: 'college',
    className: 'B.Tech / B.Sc CS',
    subject: 'Computer Science',
    chapterNumber: 3,
    chapterName: 'Data Structures & Trees',
    description: 'Binary Search Trees, recursion, traversal orders aur O(log n) search efficiency.',
  },
  {
    id: 'ch-comp-phy-1',
    category: 'competitive',
    className: 'JEE / NEET',
    subject: 'Physics',
    chapterNumber: 1,
    chapterName: 'Electrostatics',
    description: 'Coulomb’s Law, superposition principle, electric field lines aur Gauss’s law intuition.',
  },
  {
    id: 'ch-gk-space-1',
    category: 'gk',
    className: 'All Learners',
    subject: 'Space Science',
    chapterNumber: 1,
    chapterName: 'ISRO Missions & Orbits',
    description: 'Satellite orbits, escape velocity aur Chandrayaan / Aditya-L1 slingshot trajectories.',
  },
];

export function getChaptersForClassAndSubject(
  className: string,
  subject: string
): CurriculumChapter[] {
  return CURRICULUM_CHAPTERS.filter(
    (ch) => ch.className === className && ch.subject === subject
  ).sort((a, b) => a.chapterNumber - b.chapterNumber);
}
