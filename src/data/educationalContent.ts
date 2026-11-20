import type {
  FreeResource,
  LearningCategory,
  LearningLevel,
  VideoLesson,
} from '../types/vidyora';

export const HERO_ILLUSTRATION =
  '/src/assets/images/vidyora_hero_learning_1795140260991.jpg';

export const BUILTIN_THUMBNAILS = [
  {
    label: 'Physics & Motion Visual',
    url: '/src/assets/images/thumb_physics_motion_1795140262578.jpg',
  },
  {
    label: 'Biology & Life Science Visual',
    url: '/src/assets/images/thumb_biology_cell_1795140269849.jpg',
  },
  {
    label: 'Mathematics & Graphs Visual',
    url: '/src/assets/images/thumb_math_calculus_1795140284494.jpg',
  },
  {
    label: 'Computer Science & Logic Visual',
    url: '/src/assets/images/thumb_cs_algorithms_1795140268192.jpg',
  },
  {
    label: 'Space & General Science Visual',
    url: '/src/assets/images/vidyora_hero_learning_1795140260991.jpg',
  },
];

export interface ExploreTrack {
  id: Exclude<LearningCategory, 'all'>;
  title: string;
  subtitle: string;
  audience: string;
  subjects: string;
  lessonCount: string;
}

export const EXPLORE_TRACKS: ExploreTrack[] = [
  {
    id: 'school',
    title: 'School Classes',
    subtitle: 'Class 1–12 NCERT aur State Boards ke concepts visual stories, chapters aur demo lessons se samjho.',
    audience: 'Class 1–12',
    subjects: 'Maths · Physics · Chemistry · Biology · English',
    lessonCount: 'Class 1 to 12 Tracks',
  },
  {
    id: 'college',
    title: 'College Learning',
    subtitle: 'Engineering, Science aur Commerce ke core subjects practical diagrams aur code flow ke saath.',
    audience: 'B.Tech · B.Sc · B.Com',
    subjects: 'DSA · Calculus · Economics · Electronics',
    lessonCount: 'Core Degree Modules',
  },
  {
    id: 'competitive',
    title: 'Competitive Exams',
    subtitle: 'JEE, NEET, UPSC aur SSC ke tricky concepts, shortcuts aur high-yield revision drills.',
    audience: 'JEE · NEET · UPSC · SSC',
    subjects: 'Physics · Chemistry · Polity · Aptitude',
    lessonCount: 'Entrance & Exam Prep',
  },
  {
    id: 'gk',
    title: 'General Knowledge',
    subtitle: 'Space missions, Indian Constitution, personal finance aur everyday science aasaan Hinglish mein.',
    audience: 'Curious Learners',
    subjects: 'Space · Finance · World Affairs · History',
    lessonCount: 'Visual Explainers',
  },
];

export const LEARNING_LEVELS: LearningLevel[] = [
  'Class 1-5',
  'Class 6-8',
  'Class 9-10',
  'Class 11-12',
  'College',
  'Competitive Exams',
];

export const VIDEO_LESSONS: VideoLesson[] = [
  // =========================================================================
  // CLASS 10 MATHEMATICS (Demonstration Sample Content)
  // =========================================================================
  {
    id: 'c10-math-real-numbers',
    title: 'Real Numbers — Fundamental Theorem of Arithmetic & HCF/LCM',
    subject: 'Mathematics',
    className: 'Class 10',
    chapterNumber: 1,
    chapterName: 'Real Numbers',
    chapter: 'Chapter 1 · Real Numbers',
    category: 'school',
    level: 'Class 10',
    difficulty: 'Beginner',
    duration: '11:20',
    durationMinutes: 11,
    animationMode: 'Digital Whiteboard',
    thumbnail: '/src/assets/images/thumb_math_calculus_1795140284494.jpg',
    summary:
      'Har composite number ko unique prime factors mein kaise toda jata hai? Prime factorization method se HCF × LCM = a × b rule aur √2 irrationality proof samjho.',
    notesContent:
      'Class 10 Maths — Ch. 1 Real Numbers (Demo Revision Notes)\n- Fundamental Theorem of Arithmetic: Every composite number can be expressed uniquely as a product of primes (ignoring order).\n- For any two positive integers a and b: HCF(a, b) × LCM(a, b) = a × b.\n- HCF uses the smallest power of each common prime factor; LCM uses the greatest power of each prime factor involved.',
    keyTakeaways: [
      'Composite number = unique product of prime numbers (order ko chhod kar).',
      'Do positive integers a aur b ke liye hamesha HCF(a,b) × LCM(a,b) = a × b hota hai.',
      'Proof by contradiction method se √2, √3 aur √5 ko irrational prove kiya jata hai.',
    ],
    realLifeExamples: [
      {
        title: 'Digital Encryption & Online Banking Security',
        explanation:
          'RSA internet security bade numbers ko prime factors mein todne ki mushkilat (Prime Factorization) par kaam karti hai.',
      },
      {
        title: 'Traffic Lights & Bus Schedule Sync',
        explanation:
          'Agar do buses har 12 min aur 18 min mein aati hain, toh wo agli baar ek saath LCM(12, 18) = 36 minutes baad milengi.',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-c10-m1-1',
        question: 'Agar HCF(306, 657) = 9 hai, toh LCM(306, 657) kitna hoga?',
        options: ['22,338', '18,450', '20,106', '9,855'],
        correctIndex: 0,
        explanation:
          'Rule: LCM × HCF = a × b ⇒ LCM = (306 × 657) / 9 = 34 × 657 = 22,338.',
      },
      {
        id: 'q-c10-m1-2',
        question: '140 ka prime factorization kya hota hai?',
        options: ['2 × 5 × 7', '2² × 5 × 7', '2² × 3 × 7', '2³ × 5 × 7'],
        correctIndex: 1,
        explanation: '140 = 4 × 35 = 2 × 2 × 5 × 7 = 2² × 5 × 7.',
      },
    ],
    steps: [
      {
        title: '1. Prime Factor Tree Method',
        caption:
          'Kisi bhi composite number (jaise 140) ko tab tak prime numbers se divide karo jab tak sirf prime factors na bach jayein: 140 = 2² × 5 × 7.',
        formula: '140 = 2² × 5¹ × 7¹',
        visualType: 'parabola',
        highlightValue: 'Unique Prime DNA of Every Number',
      },
      {
        title: '2. HCF & LCM Relation',
        caption:
          'Common prime factors ki smallest power se HCF milta hai, aur sabhi prime factors ki highest power se LCM milta hai.',
        formula: 'HCF(a, b) × LCM(a, b) = a × b',
        visualType: 'parabola',
        highlightValue: 'Board Exam Guaranteed Formula',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },
  {
    id: 'maths-quadratic-curves',
    title: 'Quadratic Equations & Parabola Intuition',
    subject: 'Mathematics',
    className: 'Class 10',
    chapterNumber: 4,
    chapterName: 'Quadratic Equations',
    chapter: 'Chapter 4 · Quadratic Equations',
    category: 'school',
    level: 'Class 10',
    difficulty: 'Intermediate',
    duration: '14:20',
    durationMinutes: 14,
    animationMode: 'Digital Whiteboard',
    thumbnail: '/src/assets/images/thumb_math_calculus_1795140284494.jpg',
    summary:
      'Sirf formula ratna band karo! Dekho kaise ax² + bx + c = 0 ka discriminant (b² − 4ac) graph par parabola aur x-axis ke intersection points decide karta hai.',
    notesContent:
      'Class 10 Maths — Ch. 4 Quadratic Equations (Demo Revision Notes)\n- Standard Form: ax² + bx + c = 0 where a ≠ 0.\n- Quadratic Formula: x = (−b ± √(b² − 4ac)) / (2a).\n- Nature of Roots via Discriminant D = b² − 4ac:\n  • D > 0: Two distinct real roots\n  • D = 0: Two equal real roots\n  • D < 0: No real roots',
    keyTakeaways: [
      'Standard form: ax² + bx + c = 0 jahan a ≠ 0.',
      'Discriminant D = b² − 4ac batata hai ki roots real & distinct (D > 0), equal (D = 0), ya no real roots (D < 0) honge.',
      'Vertex ka x-coordinate hamesha −b / (2a) par hota hai.',
    ],
    realLifeExamples: [
      {
        title: 'Basketball Shot & Cricket Six Trajectory',
        explanation:
          'Jab ball hawa mein phenki jaati hai, gravity ki wajah se uska path exact downward parabola (a < 0) follow karta hai.',
      },
      {
        title: 'Satellite Dish Reflector',
        explanation:
          'DTH dish ka parabolic shape saare incoming signals ko ek single focus point par reflect karta hai.',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-c10-m4-1',
        question: 'Quadratic equation 2x² − 4x + 2 = 0 ke discriminant D ki value kya hogi?',
        options: ['D = 16 (2 distinct roots)', 'D = 0 (2 equal real roots)', 'D = −8 (No real roots)', 'D = 4'],
        correctIndex: 1,
        explanation: 'D = b² − 4ac = (−4)² − 4(2)(2) = 16 − 16 = 0, isliye roots real aur equal hain (x = 1, 1).',
      },
      {
        id: 'q-c10-m4-2',
        question: 'Equation x² − 5x + 6 = 0 ke roots kya hain?',
        options: ['x = 2 aur x = 3', 'x = −2 aur x = −3', 'x = 1 aur x = 6', 'x = −1 aur x = 6'],
        correctIndex: 0,
        explanation: 'Factorizing: (x − 2)(x − 3) = 0 ⇒ x = 2 ya x = 3.',
      },
    ],
    steps: [
      {
        title: '1. Parabola ka Shape aur Vertex',
        caption:
          'Agar a > 0 hai toh parabola upar ki taraf khulta hai (U-shape). Agar a < 0 hai toh neeche ki taraf khulta hai.',
        formula: 'y = ax² + bx + c,   Vertex x = −b / 2a',
        visualType: 'parabola',
        highlightValue: 'a > 0 ⇒ Upward Parabola',
      },
      {
        title: '2. Discriminant ka Magic',
        caption:
          'D = b² − 4ac decide karta hai ki curve x-axis ko kitni baar touch karega: 2 baar, 1 baar, ya bilkul nahi.',
        formula: 'D = b² − 4ac',
        visualType: 'parabola',
        highlightValue: 'D > 0 ⇒ 2 Real Distinct Roots',
      },
      {
        title: '3. Quadratic Formula',
        caption:
          'Completing the square method se direct formula milta hai jo kisi bhi quadratic equation ke roots nikal sakta hai.',
        formula: 'x = (−b ± √(b² − 4ac)) / 2a',
        visualType: 'parabola',
        highlightValue: 'Works for Every Quadratic',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },
  {
    id: 'c10-math-trigonometry',
    title: 'Trigonometric Ratios (sin, cos, tan) & Standard Angle Table',
    subject: 'Mathematics',
    className: 'Class 10',
    chapterNumber: 8,
    chapterName: 'Introduction to Trigonometry',
    chapter: 'Chapter 8 · Introduction to Trigonometry',
    category: 'school',
    level: 'Class 10',
    difficulty: 'Intermediate',
    duration: '13:15',
    durationMinutes: 13,
    animationMode: '2D Animation',
    thumbnail: '/src/assets/images/thumb_math_calculus_1795140284494.jpg',
    summary:
      'Right-angled triangle ke Perpendicular, Base aur Hypotenuse se sin, cos, tan ratios aur sin²θ + cos²θ = 1 identity ko bina ratte yaad rakho.',
    notesContent:
      'Class 10 Maths — Ch. 8 Trigonometry (Demo Revision Notes)\n- sin θ = Opposite / Hypotenuse | cos θ = Adjacent / Hypotenuse | tan θ = Opposite / Adjacent\n- Core Identities:\n  • sin²θ + cos²θ = 1\n  • 1 + tan²θ = sec²θ\n  • 1 + cot²θ = cosec²θ',
    keyTakeaways: [
      'sin θ = P/H, cos θ = B/H, tan θ = P/B — angle θ ke saamne wali side hamesha Perpendicular (Opposite) hoti hai.',
      'sin 30° = 1/2, sin 45° = 1/√2, sin 60° = √3/2.',
      'Pythagoras theorem ko H² se divide karne par direct sin²θ + cos²θ = 1 milta hai.',
    ],
    realLifeExamples: [
      {
        title: 'Building ya Mountain ki Height Naapna',
        explanation:
          'Surveyors bina chhat par chadhe sirf angle of elevation aur distance se tan θ = Height / Distance use karke tower ki height nikal lete hain.',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-c10-m8-1',
        question: 'sin²(45°) + cos²(45°) ki value kitni hoti hai?',
        options: ['0', '1/2', '1', '√2'],
        correctIndex: 2,
        explanation: 'Fundamental identity sin²θ + cos²θ = 1 har angle θ ke liye true hoti hai.',
      },
    ],
    steps: [
      {
        title: '1. Right Triangle Sides & Ratios',
        caption:
          '90° ke saamne sabse lambi side Hypotenuse (H) hoti hai. Jis acute angle θ ki baat ho rahi hai, uske saamne Opposite (P) aur bagal mein Adjacent (B).',
        formula: 'sin θ = P/H  |  cos θ = B/H  |  tan θ = P/B',
        visualType: 'parabola',
        highlightValue: 'SOH · CAH · TOA',
      },
      {
        title: '2. Fundamental Pythagorean Identity',
        caption:
          'P² + B² = H² ko dono taraf H² se divide karo — turant (P/H)² + (B/H)² = 1 yaani sin²θ + cos²θ = 1 aa jata hai!',
        formula: 'sin²θ + cos²θ = 1',
        visualType: 'parabola',
        highlightValue: 'Derived Directly from Pythagoras',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },

  // =========================================================================
  // CLASS 10 SCIENCE (Demonstration Sample Content)
  // =========================================================================
  {
    id: 'c10-sci-chemical-reactions',
    title: 'Chemical Reactions & Balancing Equations Step-by-Step',
    subject: 'Science',
    className: 'Class 10',
    chapterNumber: 1,
    chapterName: 'Chemical Reactions and Equations',
    chapter: 'Chapter 1 · Chemical Reactions and Equations',
    category: 'school',
    level: 'Class 10',
    difficulty: 'Beginner',
    duration: '11:40',
    durationMinutes: 12,
    animationMode: '2D Animation',
    thumbnail: '/src/assets/images/thumb_biology_cell_1795140269849.jpg',
    summary:
      'Law of Conservation of Mass ke hisaab se chemical equations ko balance kaise karein? Combination, Decomposition, Displacement aur Redox reactions live examples ke saath.',
    notesContent:
      'Class 10 Science — Ch. 1 Chemical Reactions (Demo Revision Notes)\n- Law of Conservation of Mass: Total atoms of each element must be equal on Reactants and Products sides.\n- 5 Major Reaction Types: Combination, Decomposition, Displacement, Double Displacement, Oxidation-Reduction (Redox).\n- Oxidation = Gain of Oxygen / Loss of Hydrogen; Reduction = Loss of Oxygen / Gain of Hydrogen.',
    keyTakeaways: [
      'Equation balance karte waqt sirf coefficients (aage ke numbers) change karte hain, formula subscripts kabhi nahi badalte.',
      'More reactive metal (jaise Iron) kam reactive metal (Copper) ko uske salt solution se displace kar deta hai.',
      'Oxidation aur Reduction ek saath hone par Redox Reaction kehlata hai.',
    ],
    realLifeExamples: [
      {
        title: 'Iron Nails ka Rusting (Jang Lagna)',
        explanation:
          'Moisture aur oxygen ke contact mein Iron oxidize hokar hydrated iron oxide (Fe₂O₃·xH₂O) bana leta hai — ye slow oxidation reaction hai.',
      },
      {
        title: 'Chips Packet mein Nitrogen Gas',
        explanation:
          'Oily snacks ko rancidity (oxidation) se bachane ke liye packets mein unreactive Nitrogen gas flush ki jaati hai.',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-c10-s1-1',
        question: 'Reaction Fe + CuSO₄ → FeSO₄ + Cu kis type ka reaction hai?',
        options: ['Combination Reaction', 'Displacement Reaction', 'Decomposition Reaction', 'Neutralization'],
        correctIndex: 1,
        explanation: 'Iron (Fe) Copper (Cu) se zyada reactive hai, isliye wo CuSO₄ se Cu ko displace kar deta hai.',
      },
      {
        id: 'q-c10-s1-2',
        question: 'Balanced equation 2Mg + O₂ → 2MgO kis law ko follow karti hai?',
        options: ['Law of Conservation of Mass', 'Ohm’s Law', 'Boyle’s Law', 'Newton’s Third Law'],
        correctIndex: 0,
        explanation: 'Dono taraf 2 Mg atoms aur 2 O atoms equal hain — mass na create hota hai na destroy.',
      },
    ],
    steps: [
      {
        title: '1. Atom Count Table Banao',
        caption:
          'LHS (Reactants) aur RHS (Products) par har element ke atoms count karo aur sabse zyada atoms wale compound se balancing start karo.',
        formula: '3Fe + 4H₂O → Fe₃O₄ + 4H₂',
        visualType: 'cell',
        highlightValue: 'LHS Atoms = RHS Atoms',
      },
      {
        title: '2. Oxidation vs Reduction (Redox)',
        caption:
          'CuO + H₂ → Cu + H₂O mein CuO ne Oxygen khoya (Reduced) aur H₂ ne Oxygen paaya (Oxidised).',
        formula: 'CuO + H₂ —(Heat)→ Cu + H₂O',
        visualType: 'cell',
        highlightValue: 'OIL RIG · Redox Pair',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },
  {
    id: 'biology-photosynthesis',
    title: 'Photosynthesis — Light Reaction se Glucose tak',
    subject: 'Science',
    className: 'Class 10',
    chapterNumber: 6,
    chapterName: 'Life Processes',
    chapter: 'Chapter 6 · Life Processes',
    category: 'school',
    level: 'Class 10',
    difficulty: 'Intermediate',
    duration: '10:15',
    durationMinutes: 10,
    animationMode: '3D Animation',
    thumbnail: '/src/assets/images/thumb_biology_cell_1795140269849.jpg',
    summary:
      'Plant ki leaf ek natural solar kitchen hai! Chloroplasts ke andar sunlight, CO₂ aur paani milkar glucose aur oxygen kaise banate hain, 3D cross-section mein dekho.',
    notesContent:
      'Class 10 Science — Ch. 6 Life Processes: Photosynthesis (Demo Notes)\n- Balanced Equation: 6CO₂ + 6H₂O —(Sunlight, Chlorophyll)→ C₆H₁₂O₆ + 6O₂\n- 3 Key Events: (1) Absorption of light energy by chlorophyll, (2) Splitting of water into H₂ & O₂, (3) Reduction of CO₂ to carbohydrates.',
    keyTakeaways: [
      'Chlorophyll sunlight ki energy absorb karta hai jo thylakoid membranes mein hota hai.',
      'Stomata ke through CO₂ andar aati hai aur O₂ bahar release hoti hai.',
      'Calvin Cycle (Dark Reaction) stroma mein glucose synthesize karta hai.',
    ],
    realLifeExamples: [
      {
        title: 'Indoor Plants Window ki Taraf Kyun Mudte Hain?',
        explanation:
          'Plants ko Light Reaction ke liye sunlight chahiye hoti hai, isliye phototropism ki wajah se unki leaves roshni ki direction mein grow karti hain.',
      },
      {
        title: 'Aloo (Potato) mein Starch Storage',
        explanation:
          'Leaves mein jo extra glucose banta hai wo starch mein convert hokar roots aur tubers (jaise potato) mein future energy ke liye store ho jata hai.',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-c10-s6-1',
        question: 'Photosynthesis ke dauraan release hone wali Oxygen (O₂) kahan se aati hai?',
        options: ['Carbon Dioxide (CO₂)', 'Water (H₂O) splitting se', 'Glucose breakdown se', 'Soil minerals se'],
        correctIndex: 1,
        explanation: 'Light reaction mein sunlight energy water molecules (H₂O) ko photolysis se split karti hai aur O₂ release hoti hai.',
      },
    ],
    steps: [
      {
        title: '1. Sunlight & Water Absorption',
        caption:
          'Roots se Xylem ke through H₂O leaf tak pahunchta hai, aur palisade cells mein chlorophyll sunlight capture karta hai.',
        formula: '2H₂O + Light → 4H⁺ + 4e⁻ + O₂↑',
        visualType: 'cell',
        highlightValue: 'Site: Chloroplast Grana',
      },
      {
        title: '2. Stomata se CO₂ Entry',
        caption:
          'Leaf ki lower epidermis par chhote pores (Stomata) guard cells ki help se open hote hain aur atmosphere se CO₂ andar lete hain.',
        formula: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
        visualType: 'cell',
        highlightValue: 'Gas Exchange via Guard Cells',
      },
      {
        title: '3. Calvin Cycle & Glucose Storage',
        caption:
          'ATP aur NADPH ki energy use karke CO₂ ko glucose (C₆H₁₂O₆) mein convert kiya jata hai, jo Phloem ke through poore plant mein supply hota hai.',
        formula: 'Glucose → Starch (Stored Energy)',
        visualType: 'cell',
        highlightValue: 'Site: Chloroplast Stroma',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },
  {
    id: 'c10-sci-light-reflection',
    title: 'Light — Concave/Convex Mirrors & Mirror Formula',
    subject: 'Science',
    className: 'Class 10',
    chapterNumber: 10,
    chapterName: 'Light — Reflection and Refraction',
    chapter: 'Chapter 10 · Light — Reflection and Refraction',
    category: 'school',
    level: 'Class 10',
    difficulty: 'Intermediate',
    duration: '12:05',
    durationMinutes: 12,
    animationMode: '2D Animation',
    thumbnail: '/src/assets/images/thumb_physics_motion_1795140262578.jpg',
    summary:
      'Car side mirror convex kyun hota hai aur dentist concave mirror kyun use karte hain? Ray diagrams, Sign Convention aur 1/f = 1/v + 1/u formula samjho.',
    notesContent:
      'Class 10 Science — Ch. 10 Light (Demo Revision Notes)\n- Mirror Formula: 1/f = 1/v + 1/u\n- Magnification: m = h\'/h = −v/u\n- Convex mirror always forms a virtual, erect, and diminished image with a wider field of view.',
    keyTakeaways: [
      'Mirror formula: 1/f = 1/v + 1/u aur Magnification m = −v/u.',
      'New Cartesian Sign Convention mein object distance (u) hamesha negative liya jata hai.',
      'Convex mirror wide field of view deta hai, isliye vehicles ke rear-view mirrors mein use hota hai.',
    ],
    realLifeExamples: [
      {
        title: 'Vehicle Rear-View Convex Mirror',
        explanation:
          'Convex mirror hamesha seedhi (erect) aur chhoti image banata hai, jisse driver peeche ki zyada sadak ek saath dekh pata hai.',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-c10-s10-1',
        question: 'Dentists daanton ki badi (magnified) aur erect image dekhne ke liye kaunsa mirror use karte hain?',
        options: ['Plane Mirror', 'Convex Mirror', 'Concave Mirror', 'Cylindrical Mirror'],
        correctIndex: 2,
        explanation: 'Jab object Concave Mirror ke Pole (P) aur Focus (F) ke beech hota hai, toh virtual, erect aur magnified image banti hai.',
      },
    ],
    steps: [
      {
        title: '1. Principal Focus & Ray Rules',
        caption:
          'Principal axis ke parallel aane wali light ray reflection ke baad Concave mirror ke Focus (F) se guzarti hai.',
        formula: 'f = R / 2',
        visualType: 'vector',
        highlightValue: 'Focal Length = Half of Radius',
      },
      {
        title: '2. Mirror Formula & Sign Convention',
        caption:
          'Mirror ke pole ko origin maano: left side distances negative aur right side distances positive.',
        formula: '1/f = 1/v + 1/u  |  m = −v/u',
        visualType: 'vector',
        highlightValue: 'u is Always Negative',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },

  // =========================================================================
  // CLASS 11 PHYSICS (Demonstration Sample Content)
  // =========================================================================
  {
    id: 'c11-phy-motion-straight-line',
    title: 'Motion in a Straight Line — v-t Graphs & Kinematic Equations',
    subject: 'Physics',
    className: 'Class 11',
    chapterNumber: 3,
    chapterName: 'Motion in a Straight Line',
    chapter: 'Chapter 3 · Motion in a Straight Line',
    category: 'school',
    level: 'Class 11',
    difficulty: 'Intermediate',
    duration: '13:30',
    durationMinutes: 14,
    animationMode: '2D Animation',
    thumbnail: '/src/assets/images/thumb_physics_motion_1795140262578.jpg',
    summary:
      'Velocity-Time (v-t) graph ka slope acceleration aur area displacement kaise deta hai? Teeno equations of motion ka visual derivation samjho.',
    notesContent:
      'Class 11 Physics — Ch. 3 Motion in a Straight Line (Demo Notes)\n- Slope of x-t graph = Velocity; Slope of v-t graph = Acceleration.\n- Area under v-t graph = Displacement.\n- Uniform acceleration equations: v = u + at, s = ut + ½at², v² − u² = 2as.',
    keyTakeaways: [
      'v-t graph ka slope acceleration (a = dv/dt) batata hai.',
      'v-t graph ke neeche ka area total displacement deta hai.',
      'Kinematic equations sirf constant (uniform) acceleration ke liye valid hoti hain.',
    ],
    realLifeExamples: [
      {
        title: 'Metro Train Acceleration & Braking',
        explanation:
          'Station se nikalte waqt uniform positive acceleration, beech mein constant cruise speed, aur agle station par uniform retardation v-t graph par trapezoid banata hai.',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-c11-p3-1',
        question: 'Velocity-Time (v-t) graph ke neeche ka area kya represent karta hai?',
        options: ['Acceleration', 'Displacement', 'Force', 'Momentum'],
        correctIndex: 1,
        explanation: 'v = dx/dt ⇒ ∫v dt = Δx, isliye v-t graph ka area displacement deta hai.',
      },
    ],
    steps: [
      {
        title: '1. Reading Slope & Area Visually',
        caption:
          'Agar v-t graph ek horizontal line hai, toh velocity constant aur acceleration zero hai. Inclined line ka slope constant acceleration dikhata hai.',
        formula: 'a = (v − u) / t  ⇒  v = u + at',
        visualType: 'vector',
        highlightValue: 'Slope = Acceleration · Area = Displacement',
      },
      {
        title: '2. Area of Trapezium = Displacement',
        caption:
          'v-t graph ke neeche rectangle (u × t) + triangle (½ × t × at) ka sum seedha s = ut + ½at² deta hai!',
        formula: 's = ut + ½at²  |  v² − u² = 2as',
        visualType: 'vector',
        highlightValue: 'Valid for Constant Acceleration',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },
  {
    id: 'physics-newtons-laws',
    title: "Newton's Laws of Motion — Force & Inertia Visualized",
    subject: 'Physics',
    className: 'Class 11',
    chapterNumber: 5,
    chapterName: 'Laws of Motion',
    chapter: 'Chapter 5 · Laws of Motion',
    category: 'school',
    level: 'Class 11',
    difficulty: 'Intermediate',
    duration: '12:40',
    durationMinutes: 13,
    animationMode: '2D Animation',
    thumbnail: '/src/assets/images/thumb_physics_motion_1795140262578.jpg',
    summary:
      'Bus achanak rukne par aap aage kyun jhukte hain? Inertia, Force aur Acceleration (F = m × a) ko real-life motion vectors ke saath step-by-step samjho.',
    notesContent:
      'Class 11 Physics — Ch. 5 Laws of Motion (Demo Notes)\n- 1st Law (Inertia): ΣF = 0 ⇒ constant velocity.\n- 2nd Law: F = dp/dt = ma (for constant mass).\n- 3rd Law: Action and reaction forces act on two DIFFERENT bodies simultaneously.',
    keyTakeaways: [
      'First Law (Inertia): Jab tak external unbalanced force na lage, object apni state of rest ya uniform motion mein rehta hai.',
      'Second Law: Force mass aur acceleration ka product hota hai (F = m × a).',
      'Third Law: Har action ka equal aur opposite reaction hota hai — par do alag objects par.',
    ],
    realLifeExamples: [
      {
        title: 'Cricket Catch lete waqt Haath Peeche Kheenchna',
        explanation:
          'Fielder catch pakadte waqt haath peeche le jata hai taaki ball rukne ka time (Δt) badh jaye — isse haath par lagne wala force (F = Δp / Δt) kam ho jata hai.',
      },
      {
        title: 'Car Seatbelt aur Inertia',
        explanation:
          'Sudden braking ke time seatbelt external opposing force laga kar aapki body ke inertia of motion ko safely rok leti hai.',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-c11-p5-1',
        question: '4 kg mass ke block par 20 N net force lagane se uska acceleration kitna hoga?',
        options: ['2 m/s²', '4 m/s²', '5 m/s²', '80 m/s²'],
        correctIndex: 2,
        explanation: 'Newton’s Second Law: a = F / m = 20 N / 4 kg = 5 m/s².',
      },
    ],
    steps: [
      {
        title: '1. Inertia kya hota hai?',
        caption:
          'Socho aap bus mein khade ho aur driver achanak brake lagata hai. Aapke pair floor ke saath ruk jaate hain, lekin upper body inertia ki wajah se aage badhna chahti hai.',
        formula: 'ΣF = 0  ⇒  v = constant',
        visualType: 'vector',
        highlightValue: 'Inertia = Resistance to Change',
      },
      {
        title: '2. Force aur Acceleration ka relation',
        caption:
          'Zyada mass wale box ko dhakka dene ke liye zyada force chahiye. Agar force double karoge toh same mass par acceleration bhi double ho jayega.',
        formula: 'F = m × a   (Unit: Newton, N)',
        visualType: 'vector',
        highlightValue: 'F = 20 N, m = 4 kg ⇒ a = 5 m/s²',
      },
      {
        title: '3. Action–Reaction Pairs',
        caption:
          'Rocket neeche ki taraf hot gases push karta hai (Action), aur gases rocket ko upar ki taraf thrust deti hain (Reaction).',
        formula: 'F₁₂ = −F₂₁',
        visualType: 'vector',
        highlightValue: 'Equal Magnitude · Opposite Direction',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },

  // =========================================================================
  // CLASS 11 CHEMISTRY (Demonstration Sample Content)
  // =========================================================================
  {
    id: 'c11-chem-atomic-structure',
    title: 'Structure of Atom — Bohr Model & 4 Quantum Numbers',
    subject: 'Chemistry',
    className: 'Class 11',
    chapterNumber: 2,
    chapterName: 'Structure of Atom',
    chapter: 'Chapter 2 · Structure of Atom',
    category: 'school',
    level: 'Class 11',
    difficulty: 'Intermediate',
    duration: '14:10',
    durationMinutes: 14,
    animationMode: '3D Animation',
    thumbnail: '/src/assets/images/vidyora_hero_learning_1795140260991.jpg',
    summary:
      'Electron ka exact address kaise likhte hain? Principal (n), Azimuthal (l), Magnetic (m) aur Spin (s) quantum numbers ko hostel room address analogy se samjho.',
    notesContent:
      'Class 11 Chemistry — Ch. 2 Structure of Atom (Demo Notes)\n- Bohr’s Energy of nth orbit (H-atom): E_n = −13.6 / n² eV.\n- 4 Quantum Numbers:\n  • n (Principal): Shell size & energy (1, 2, 3...)\n  • l (Azimuthal): Subshell shape (0=s, 1=p, 2=d, 3=f)\n  • m_l (Magnetic): Orbital orientation (−l to +l)\n  • m_s (Spin): +½ or −½',
    keyTakeaways: [
      'n = Building floor (Shell), l = Wing shape (s, p, d, f), m = Exact room (Orbital), s = Bed spin (+½ / −½).',
      'Pauli Exclusion Principle: Ek atom mein do electrons ke chaaron quantum numbers kabhi identical nahi ho sakte.',
      'Hydrogen atom mein electron jump karne par quantized photon (ΔE = hν) emit ya absorb hota hai.',
    ],
    realLifeExamples: [
      {
        title: 'Fireworks & Neon Sign Board Colors',
        explanation:
          'Alag-alag elements ke electrons jab excited state se ground state mein wapas girte hain, toh specific wavelength (color) ki light emit karte hain (jaise Sodium ka bright yellow).',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-c11-c2-1',
        question: 'Agar Principal Quantum Number n = 3 hai, toh Azimuthal Quantum Number (l) ki kaunsi values possible hain?',
        options: ['1, 2, 3', '0, 1, 2 (3s, 3p, 3d)', '0, 1, 2, 3', '−1, 0, +1'],
        correctIndex: 1,
        explanation: 'l hamesha 0 se (n − 1) tak hota hai. n = 3 ke liye l = 0 (s), 1 (p), 2 (d).',
      },
    ],
    steps: [
      {
        title: '1. Quantized Orbits & Photon Jumps',
        caption:
          'Bohr ne bataya ki electrons sirf fixed energy levels mein ghoomte hain; jump karne par hi ΔE = hν energy exchange hoti hai.',
        formula: 'E_n = −13.6 / n² eV   |   ΔE = hν',
        visualType: 'orbit',
        highlightValue: 'Quantized Energy Levels',
      },
      {
        title: '2. 4 Quantum Numbers = Electron Address',
        caption:
          'Har electron ko uniquely identify karne ke liye 4 numbers (n, l, m_l, m_s) chahiye — ek orbital mein max 2 opposite-spin electrons aa sakte hain.',
        formula: 'Max electrons in shell n = 2n²',
        visualType: 'orbit',
        highlightValue: 's(2) · p(6) · d(10) · f(14)',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },
  {
    id: 'c11-chem-bonding-vsepr',
    title: 'Chemical Bonding — Ionic, Covalent & VSEPR Molecular Shapes',
    subject: 'Chemistry',
    className: 'Class 11',
    chapterNumber: 4,
    chapterName: 'Chemical Bonding and Molecular Structure',
    chapter: 'Chapter 4 · Chemical Bonding and Molecular Structure',
    category: 'school',
    level: 'Class 11',
    difficulty: 'Intermediate',
    duration: '12:55',
    durationMinutes: 13,
    animationMode: '3D Animation',
    thumbnail: '/src/assets/images/thumb_biology_cell_1795140269849.jpg',
    summary:
      'Water (H₂O) straight line ke bajaye bent (104.5°) kyun hota hai? VSEPR theory, lone pair repulsion aur sp³ hybridization ko 3D geometry intuition se samjho.',
    notesContent:
      'Class 11 Chemistry — Ch. 4 Chemical Bonding (Demo Notes)\n- Repulsion Order (VSEPR): Lone Pair–Lone Pair > Lone Pair–Bond Pair > Bond Pair–Bond Pair.\n- CH₄ (Tetrahedral, 109.5°) → NH₃ (Pyramidal, 107°) → H₂O (Bent, 104.5°).',
    keyTakeaways: [
      'Atoms octet complete karne ke liye electrons transfer (Ionic) ya share (Covalent) karte hain.',
      'Lone pairs zyada space gherte hain aur bond pairs ko daba dete hain (LP–LP > LP–BP > BP–BP).',
      'Isi lone-pair push ki wajah se CH₄ (109.5°) se H₂O ka angle kam hokar 104.5° ho jata hai.',
    ],
    realLifeExamples: [
      {
        title: 'Ice Water par Kyun Tairti Hai?',
        explanation:
          'H₂O ke bent polar shape ki wajah se strong Hydrogen Bonding hoti hai, jo ice mein open cage structure banati hai (kam density = ice floats!).',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-c11-c4-1',
        question: 'VSEPR theory ke according sabse zyada repulsion kin electron pairs ke beech hoti hai?',
        options: ['Bond Pair – Bond Pair', 'Lone Pair – Bond Pair', 'Lone Pair – Lone Pair', 'Sabhi equal hote hain'],
        correctIndex: 2,
        explanation: 'Lone pairs sirf ek nucleus se bound hote hain, isliye wo zyada spread hokar sabse zyada repulsion (LP–LP) lagate hain.',
      },
    ],
    steps: [
      {
        title: '1. Electron Sharing vs Transfer',
        caption:
          'NaCl mein Sodium apna 1 electron Chlorine ko de deta hai (Ionic), jabki CH₄ mein Carbon aur Hydrogen electrons share karte hain (Covalent).',
        formula: 'Repulsion: LP–LP > LP–BP > BP–BP',
        visualType: 'cell',
        highlightValue: 'Octet Stability Drives Bonding',
      },
      {
        title: '2. Why Water is Bent (104.5°)',
        caption:
          'Oxygen par 2 lone pairs aur 2 bond pairs (sp³) hote hain. Do lone pairs ke push se H–O–H bond angle 109.5° se ghat kar 104.5° ho jata hai.',
        formula: 'H₂O: 2 Bond Pairs + 2 Lone Pairs ⇒ Bent',
        visualType: 'cell',
        highlightValue: 'Molecular Shape Controls Properties',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },

  // =========================================================================
  // CLASS 12 BIOLOGY (Demonstration Sample Content)
  // =========================================================================
  {
    id: 'c12-bio-flowering-plants',
    title: 'Sexual Reproduction in Flowering Plants — Double Fertilization',
    subject: 'Biology',
    className: 'Class 12',
    chapterNumber: 2,
    chapterName: 'Sexual Reproduction in Flowering Plants',
    chapter: 'Chapter 2 · Sexual Reproduction in Flowering Plants',
    category: 'school',
    level: 'Class 12',
    difficulty: 'Intermediate',
    duration: '12:30',
    durationMinutes: 13,
    animationMode: '3D Animation',
    thumbnail: '/src/assets/images/thumb_biology_cell_1795140269849.jpg',
    summary:
      'Angiosperms ka sabse unique feature Double Fertilization (Syngamy + Triple Fusion) kaise hota hai? Embryo sac (7-celled, 8-nucleate) aur endosperm formation samjho.',
    notesContent:
      'Class 12 Biology — Ch. 2 Flowering Plants (Demo Notes)\n- Typical Angiosperm Embryo Sac: 7-celled, 8-nucleate structure.\n- Double Fertilization = Syngamy (Male gamete + Egg → 2n Zygote) + Triple Fusion (Male gamete + 2 Polar nuclei → 3n PEN/Endosperm).',
    keyTakeaways: [
      'Pollen tube ovule ke micropylar end se enter karke 2 male gametes release karti hai.',
      'Syngamy: 1st male gamete (n) + Egg cell (n) → Diploid Zygote (2n) → Embryo.',
      'Triple Fusion: 2nd male gamete (n) + 2 Polar nuclei (n + n) → Triploid Primary Endosperm Nucleus (3n) jo nutrition deta hai.',
    ],
    realLifeExamples: [
      {
        title: 'Coconut Water = Free-Nuclear Endosperm',
        explanation:
          'Kachche nariyal (tender coconut) ka paani actually liquid free-nuclear endosperm (3n) hai jo growing embryo ko nutrition dene ke liye bana hota hai!',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-c12-b2-1',
        question: 'Angiosperms mein Triple Fusion ke baad Primary Endosperm Nucleus (PEN) ki ploidy kya hoti hai?',
        options: ['Haploid (n)', 'Diploid (2n)', 'Triploid (3n)', 'Tetraploid (4n)'],
        correctIndex: 2,
        explanation: '1 haploid male gamete (n) + 2 haploid polar nuclei (n + n) milkar Triploid (3n) PEN banate hain.',
      },
    ],
    steps: [
      {
        title: '1. 7-Celled, 8-Nucleate Embryo Sac',
        caption:
          'Micropylar end par Egg Apparatus (1 egg + 2 synergids), chalazal end par 3 antipodals, aur center mein 1 large central cell with 2 polar nuclei.',
        formula: 'Embryo Sac = 7 Cells · 8 Nuclei',
        visualType: 'cell',
        highlightValue: 'NCERT Board & NEET Favorite',
      },
      {
        title: '2. Double Fertilization (Syngamy + Triple Fusion)',
        caption:
          'Ek male gamete egg se milkar embryo (2n) banata hai aur doosra polar nuclei se milkar endosperm (3n) food reserve banata hai.',
        formula: 'Syngamy (2n) + Triple Fusion (3n)',
        visualType: 'cell',
        highlightValue: 'Unique to Angiosperms',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },
  {
    id: 'c12-bio-dna-inheritance',
    title: 'Molecular Basis of Inheritance — DNA Double Helix & Replication',
    subject: 'Biology',
    className: 'Class 12',
    chapterNumber: 6,
    chapterName: 'Molecular Basis of Inheritance',
    chapter: 'Chapter 6 · Molecular Basis of Inheritance',
    category: 'school',
    level: 'Class 12',
    difficulty: 'Advanced',
    duration: '15:00',
    durationMinutes: 15,
    animationMode: '3D Animation',
    thumbnail: '/src/assets/images/thumb_biology_cell_1795140269849.jpg',
    summary:
      'Watson & Crick ka DNA Double Helix model, Chargaff’s Base Pairing Rule (A=T, G≡C) aur semi-conservative DNA replication (Leading vs Lagging strand) ko visualize karo.',
    notesContent:
      'Class 12 Biology — Ch. 6 Molecular Basis of Inheritance (Demo Notes)\n- Antiparallel strands: One runs 5′ → 3′, complementary runs 3′ → 5′.\n- Base Pairing: Adenine pairs with Thymine via 2 H-bonds (A=T); Guanine with Cytosine via 3 H-bonds (G≡C).\n- DNA Polymerase catalyzes polymerization ONLY in 5′ → 3′ direction.',
    keyTakeaways: [
      'DNA ke dono strands antiparallel (5′→3′ aur 3′→5′) hote hain aur sugar-phosphate backbone banate hain.',
      'Chargaff Rule: A = T (2 hydrogen bonds) aur G = C (3 hydrogen bonds).',
      'DNA Polymerase sirf 5′ → 3′ direction mein naya strand banata hai — isliye ek Leading (continuous) aur ek Lagging (Okazaki fragments) strand banta hai.',
    ],
    realLifeExamples: [
      {
        title: 'DNA Fingerprinting & Forensics',
        explanation:
          'Har insaan ke DNA mein VNTR (Variable Number of Tandem Repeats) sequences unique hote hain, jisse forensic science mein accurate identification hoti hai.',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-c12-b6-1',
        question: 'DNA-dependent DNA Polymerase naye DNA strand ka polymerization kis direction mein karta hai?',
        options: ['3′ → 5′ direction', '5′ → 3′ direction', 'Dono directions mein', 'Random direction'],
        correctIndex: 1,
        explanation: 'DNA Polymerase hamesha 5′ → 3′ direction mein nucleotides add karta hai.',
      },
      {
        id: 'q-c12-b6-2',
        question: 'Agar double-stranded DNA mein Adenine (A) 22% hai, toh Guanine (G) kitna percent hoga?',
        options: ['22%', '28%', '44%', '56%'],
        correctIndex: 1,
        explanation: 'Chargaff Rule: A = T = 22% (Total A+T = 44%). Bacha hua G+C = 56%, isliye G = 56/2 = 28%.',
      },
    ],
    steps: [
      {
        title: '1. Complementary Base Pairing & Helix',
        caption:
          'Purine hamesha Pyrimidine ke saath pair karta hai (A=T aur G≡C), jisse DNA helix ki uniform diameter (2 nm) bani rehti hai.',
        formula: 'A = T (2 H-bonds)  |  G ≡ C (3 H-bonds)',
        visualType: 'cell',
        highlightValue: 'Pitch = 3.4 nm · 10 bp per Turn',
      },
      {
        title: '2. Semi-Conservative Replication Fork',
        caption:
          'Helicase DNA zip kholta hai; DNA Polymerase 5′→3′ direction mein copy banata hai, aur DNA Ligase lagging strand ke Okazaki fragments ko jod deta hai.',
        formula: '1 Parent DNA → 2 Hybrid (1 Old + 1 New) DNAs',
        visualType: 'cell',
        highlightValue: 'Proved by Meselson & Stahl (¹⁵N)',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },

  // =========================================================================
  // ADDITIONAL MULTI-CLASS, COLLEGE, COMPETITIVE & GK DEMO LESSONS
  // =========================================================================
  {
    id: 'maths-fractions-visual',
    title: 'Fractions & Equivalent Ratios — Visual Slice Method',
    subject: 'Mathematics',
    className: 'Class 5',
    chapterNumber: 7,
    chapterName: 'Fractions',
    chapter: 'Chapter 7 · Fractions',
    category: 'school',
    level: 'Class 5',
    difficulty: 'Beginner',
    duration: '08:25',
    durationMinutes: 8,
    animationMode: '2D Animation',
    thumbnail: '/src/assets/images/thumb_math_calculus_1795140284494.jpg',
    summary:
      'Numerator aur Denominator kya hote hain? Pizza slices aur chocolate bars ke saath 1/2, 2/4 aur 3/6 barabar kyun hote hain, easily samjho.',
    notesContent:
      'Class 5 Maths — Ch. 7 Fractions (Demo Notes)\n- Fraction = Numerator (selected parts) / Denominator (total equal parts).\n- Equivalent fractions represent the same portion: 1/2 = 2/4 = 3/6.',
    keyTakeaways: [
      'Denominator batata hai poori cheez kitne equal tukdon mein banti hai.',
      'Numerator batata hai unmein se kitne parts humne choose kiye hain.',
      'Equivalent fractions ka value same hota hai (jaise 1/2 = 2/4 = 4/8).',
    ],
    realLifeExamples: [
      {
        title: 'Pizza Sharing at a Birthday',
        explanation:
          'Agar 8 slices wale pizza mein se aap 4 slices lete ho (4/8), toh wo bilkul aadhe pizza (1/2) ke barabar hota hai.',
      },
      {
        title: 'Clock & Half an Hour',
        explanation:
          'Ek ghante mein 60 minutes hote hain — 30 minutes ka matlab hai 30/60 = 1/2 hour, aur 15 minutes = 1/4 (quarter) hour.',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-c5-m7-1',
        question: 'Inmein se kaunsa fraction 1/2 ke equivalent hai?',
        options: ['2/5', '3/6', '4/9', '1/4'],
        correctIndex: 1,
        explanation: '3/6 ko 3 se divide karne par (3÷3)/(6÷3) = 1/2 milta hai.',
      },
    ],
    steps: [
      {
        title: '1. Whole ko Equal Parts mein Baanto',
        caption:
          'Fraction tabhi valid hota hai jab sabhi parts exact equal size ke hon. Agar ek roti ko 4 barabar hisson mein kaatein, har tukda 1/4 kehlata hai.',
        formula: 'Fraction = Numerator / Denominator',
        visualType: 'parabola',
        highlightValue: 'Equal Parts = True Fraction',
      },
      {
        title: '2. Equivalent Fractions ka Rule',
        caption:
          'Numerator aur Denominator dono ko same non-zero number se multiply ya divide karne par fraction ki value change nahi hoti.',
        formula: '1/2 = (1×2)/(2×2) = 2/4 = 3/6',
        visualType: 'parabola',
        highlightValue: 'Same Portion · Different Cut Size',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },
  {
    id: 'science-sound-waves',
    title: 'Sound Waves — Vibrations, Pitch & Amplitude',
    subject: 'Science',
    className: 'Class 8',
    chapterNumber: 13,
    chapterName: 'Sound',
    chapter: 'Chapter 13 · Sound',
    category: 'school',
    level: 'Class 8',
    difficulty: 'Beginner',
    duration: '09:45',
    durationMinutes: 10,
    animationMode: '2D Animation',
    thumbnail: '/src/assets/images/thumb_physics_motion_1795140262578.jpg',
    summary:
      'Guitar ki taar bajane par awaaz kaise banti hai? Frequency se pitch aur amplitude se loudness kaise change hoti hai, live wave visual se dekho.',
    notesContent:
      'Class 8 Science — Ch. 13 Sound (Demo Notes)\n- Sound requires a material medium (solid, liquid, or gas) to travel.\n- Pitch depends on Frequency (Hz); Loudness depends on Amplitude².',
    keyTakeaways: [
      'Sound hamesha vibrating objects se produce hota hai aur travel karne ke liye medium (solid, liquid ya gas) chahiye.',
      'Frequency (Hz) jitni zyada hogi, awaaz utni patli (high pitch) hogi.',
      'Amplitude jitna bada hoga, sound utna tez (loud) sunai dega.',
    ],
    realLifeExamples: [
      {
        title: 'Tabla vs Whistle',
        explanation:
          'Tabla ki bass sound low frequency (low pitch) hoti hai, jabki seeti (whistle) ki awaaz high frequency (high pitch) hoti hai.',
      },
      {
        title: 'Space mein Silence Kyun Hai?',
        explanation:
          'Outer space mein hawa (medium) nahi hoti, isliye astronauts direct baat nahi kar sakte aur radio waves use karte hain.',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-c8-s13-1',
        question: 'Sound ki loudness kis quantity par depend karti hai?',
        options: ['Amplitude', 'Time Period', 'Color', 'Temperature only'],
        correctIndex: 0,
        explanation: 'Loudness amplitude ke square (Amplitude²) ke directly proportional hoti hai.',
      },
    ],
    steps: [
      {
        title: '1. Vibration se Sound Banta Hai',
        caption:
          'Jab school ki bell par hammer lagta hai, metal tezi se aage-peeche vibrate karta hai aur aas-paas ki air particles ko push karta hai.',
        formula: 'Frequency (f) = Oscillations / Time (Hz)',
        visualType: 'vector',
        highlightValue: 'Human Hearing: 20 Hz – 20,000 Hz',
      },
      {
        title: '2. Loudness vs Pitch',
        caption:
          'Drum ko zor se bajaoge toh vibration ka amplitude badhega (louder sound), lekin uski frequency same rahegi.',
        formula: 'Loudness ∝ (Amplitude)²',
        visualType: 'vector',
        highlightValue: 'Amplitude = Volume · Frequency = Pitch',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },
  {
    id: 'cs-binary-trees',
    title: 'Binary Search Trees & Time Complexity',
    subject: 'Computer Science',
    className: 'B.Tech / B.Sc CS',
    chapterNumber: 3,
    chapterName: 'Data Structures & Trees',
    chapter: 'Chapter 3 · Data Structures & Trees',
    category: 'college',
    level: 'B.Tech / B.Sc CS',
    difficulty: 'Advanced',
    duration: '16:05',
    durationMinutes: 16,
    animationMode: '3D Animation',
    thumbnail: '/src/assets/images/thumb_cs_algorithms_1795140268192.jpg',
    summary:
      'Millions of records mein data milliseconds mein kaise milta hai? Binary Search Tree (BST) ka left-smaller / right-larger rule aur O(log n) search visualize karo.',
    notesContent:
      'College CS — Binary Search Trees (Demo Notes)\n- Invariant: Left Subtree < Root < Right Subtree.\n- In-order traversal produces sorted output.\n- Average search/insert/delete: O(log n); Worst-case skewed tree: O(n).',
    keyTakeaways: [
      'Har node ke left subtree mein chhoti values aur right subtree mein badi values hoti hain.',
      'Balanced BST mein search, insert aur delete average O(log n) time mein hota hai.',
      'In-order traversal (Left → Root → Right) hamesha sorted order deta hai.',
    ],
    realLifeExamples: [
      {
        title: 'Database Indexes (SQL B-Trees)',
        explanation:
          'Jab aap e-commerce app par product ID search karte ho, tree-based index 10 lakh records ko sirf ~20 comparisons mein dhoondh leta hai.',
      },
      {
        title: 'Dictionary Word Lookup',
        explanation:
          'Dictionary ko beech se kholkar left ya right half choose karna exact Binary Search logic hai.',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-col-cs-1',
        question: 'BST ka kaunsa traversal hamesha ascending sorted order deta hai?',
        options: ['Pre-order', 'In-order (L → Root → R)', 'Post-order', 'Level-order'],
        correctIndex: 1,
        explanation: 'In-order traversal pehle left (chhote) elements, phir root, aur phir right (bade) elements visit karta hai.',
      },
    ],
    steps: [
      {
        title: '1. BST Invariant Rule',
        caption:
          'Root node se compare karo: target chhota hai toh Left jao, bada hai toh Right jao. Har step par aadha search space eliminate ho jata hai!',
        formula: 'Left < Root < Right',
        visualType: 'tree',
        highlightValue: 'Halves Search Space per Step',
      },
      {
        title: '2. In-Order Traversal',
        caption:
          'Left child, phir Root, phir Right child visit karne par BST ke saare elements ascending order mein print ho jaate hain.',
        formula: 'Traversal: L → N → R',
        visualType: 'tree',
        highlightValue: 'Output: Sorted Sequence',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },
  {
    id: 'competitive-electrostatics',
    title: "Coulomb's Law & Electric Field Lines",
    subject: 'Physics',
    className: 'JEE / NEET',
    chapterNumber: 1,
    chapterName: 'Electrostatics',
    chapter: 'Chapter 1 · Electrostatics',
    category: 'competitive',
    level: 'JEE / NEET',
    difficulty: 'Advanced',
    duration: '15:10',
    durationMinutes: 15,
    animationMode: '2D Animation',
    thumbnail: '/src/assets/images/thumb_physics_motion_1795140262578.jpg',
    summary:
      'Point charges ke beech electrostatic force aur electric field lines kabhi intersect kyun nahi karti? High-yield JEE & NEET visual problems ke saath.',
    notesContent:
      'JEE/NEET Physics — Electrostatics (Demo Notes)\n- Coulomb’s Law: F = k |q₁q₂| / r² where k = 9 × 10⁹ N·m²/C².\n- Electric field lines never intersect because two field directions at a single point are impossible.',
    keyTakeaways: [
      'Inverse square law: Distance double karne par force 1/4th ho jata hai.',
      'Electric field lines positive charge se nikalti hain aur negative par end hoti hain.',
      'Do electric field lines kabhi cross nahi kar sakti kyunki ek point par do directions impossible hain.',
    ],
    realLifeExamples: [
      {
        title: 'Laser Printer & Photocopier Drum',
        explanation:
          'Photocopier mein electrostatic charge toner powder ko paper ke exact spots par attract karke sharp text print karta hai.',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-comp-p1-1',
        question: 'Agar do point charges ke beech ki distance double kar di jaye, toh unke beech ka electrostatic force kitna ho jayega?',
        options: ['Double (2F)', 'Half (F/2)', 'One-fourth (F/4)', 'Four times (4F)'],
        correctIndex: 2,
        explanation: 'Coulomb’s Law mein F ∝ 1/r², isliye r → 2r hone par F → F / (2²) = F/4.',
      },
    ],
    steps: [
      {
        title: '1. Inverse Square Force',
        caption:
          'Do charges q₁ aur q₂ ke beech force unke product ke proportional aur distance ke square ke inversely proportional hota hai.',
        formula: 'F = k · |q₁q₂| / r²',
        visualType: 'vector',
        highlightValue: 'k = 9 × 10⁹ N·m²/C²',
      },
      {
        title: '2. Electric Field Intensity',
        caption:
          'Unit positive test charge par lagne wala force hi Electric Field hai. Ye ek vector quantity hai.',
        formula: 'E = F / q₀ = k·Q / r²',
        visualType: 'vector',
        highlightValue: 'Unit: N/C or V/m',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },
  {
    id: 'gk-orbital-mechanics',
    title: 'ISRO Orbits — Satellite Earth ke Chaaron Taraf Kaise Ghoomta Hai?',
    subject: 'Space Science',
    className: 'All Learners',
    chapterNumber: 1,
    chapterName: 'ISRO Missions & Orbits',
    chapter: 'Chapter 1 · ISRO Missions & Orbits',
    category: 'gk',
    level: 'All Learners',
    difficulty: 'Beginner',
    duration: '09:30',
    durationMinutes: 10,
    animationMode: 'Storytelling',
    thumbnail: '/src/assets/images/vidyora_hero_learning_1795140260991.jpg',
    summary:
      'Satellite neeche kyun nahi girta? Chandrayaan aur Aditya-L1 ke slingshot orbit maneuvers ko aasaan Hinglish storytelling aur orbit diagram se samjho.',
    notesContent:
      'GK Space Science — ISRO Orbits (Demo Notes)\n- Orbital velocity v = √(GM / r).\n- Low Earth Orbit (LEO): ~400 km; Geostationary Orbit (GEO): ~35,786 km (24-hour period).',
    keyTakeaways: [
      'Satellite lagatar Earth ki taraf gir raha hota hai, par uski horizontal speed itni zyada hoti hai ki Earth ki curve uske neeche mud jaati hai.',
      'Low Earth Orbit (LEO) ~400 km par aur Geostationary Orbit ~35,786 km par hoti hai.',
      'Orbital velocity v = √(GM / r) altitude badhne ke saath kam hoti hai.',
    ],
    realLifeExamples: [
      {
        title: 'GPS Navigation & Weather Forecasting',
        explanation:
          'INSAT weather satellites geostationary orbit se India ke upar lagatar clouds aur cyclones track karte hain.',
      },
    ],
    practiceQuestions: [
      {
        id: 'q-gk-1',
        question: 'Geostationary communication satellite ko Earth ka ek chakkar poora karne mein kitna samay lagta hai?',
        options: ['90 minutes', '12 hours', '24 hours', '365 days'],
        correctIndex: 2,
        explanation: 'Geostationary orbit Earth ki rotation period (24 hours) ke saath sync rehti hai.',
      },
    ],
    steps: [
      {
        title: '1. Newton ka Cannonball Thought Experiment',
        caption:
          'Agar aap pahad se ball ko bahut tez horizontal speed (~7.9 km/s) se phenko, toh wo Earth ke curvature ke saath match karke orbit mein aa jayegi.',
        formula: 'v_orbital = √(GM / r)',
        visualType: 'orbit',
        highlightValue: 'LEO Speed ≈ 7.8 km/s',
      },
      {
        title: '2. Geostationary Orbit',
        caption:
          '35,786 km ki height par satellite ka 1 chakkar exact 24 hours mein poora hota hai — isliye wo Earth ke ek hi spot ke upar fixed dikhta hai.',
        formula: 'T = 24 hrs  ⇒  h ≈ 35,786 km',
        visualType: 'orbit',
        highlightValue: 'Synced with Earth Rotation',
      },
    ],
    published: true,
    isDemo: true,
    source: 'demo',
  },
];

export const FREE_RESOURCES: FreeResource[] = [
  {
    id: 'res-physics-formula-sheet',
    title: 'Class 11 & 12 Physics Complete Formula Sheet',
    subject: 'Physics',
    category: 'school',
    level: 'Class 11–12 & JEE',
    format: 'Revision Sheet',
    pages: 8,
    summary:
      'Mechanics, Thermodynamics, Electrostatics aur Optics ke sabhi board-important formulas ek hi crisp sheet mein.',
    definitions: [
      {
        term: 'Impulse (J)',
        meaning: 'Chhote time interval mein lagne wala bada force: J = F × Δt = Δp (Change in Momentum).',
      },
      {
        term: "Ohm's Law",
        meaning: 'Constant temperature par conductor ka voltage current ke directly proportional hota hai (V = IR).',
      },
      {
        term: 'Work-Energy Theorem',
        meaning: 'Net force dwara kiya gaya work object ki kinetic energy ke change ke barabar hota hai.',
      },
    ],
    formulas: [
      'v = u + at  |  s = ut + ½at²  |  v² − u² = 2as',
      'F = ma  |  p = mv  |  KE = ½mv²',
      'F_elec = k·q₁q₂ / r²  |  V = IR  |  P = VI',
      '1/f = 1/v − 1/u  (Lens Formula)',
    ],
    importantPoints: [
      'Numerical solve karte waqt sabhi quantities ko pehle SI Units (kg, m, s) mein convert karo.',
      'Vector quantities mein direction (+/- sign convention) clearly define karo.',
      'Graphs mein slope aur area ka physical meaning yaad rakho (v-t graph ka area = displacement).',
    ],
  },
  {
    id: 'res-biology-life-processes',
    title: 'Class 10 Biology — Life Processes Quick Notes',
    subject: 'Biology',
    category: 'school',
    level: 'Class 10 NCERT',
    format: 'Chapter Notes',
    pages: 6,
    summary:
      'Nutrition, Respiration, Transportation (Heart & Xylem/Phloem) aur Excretion ke diagram-ready Hinglish revision notes.',
    definitions: [
      {
        term: 'Autotrophic Nutrition',
        meaning: 'Green plants sunlight, CO₂ aur water se apna khud ka food (glucose) banate hain.',
      },
      {
        term: 'Double Circulation',
        meaning: 'Human heart mein blood ek complete cycle mein do baar pass hota hai — oxygenated aur deoxygenated blood mix nahi hota.',
      },
      {
        term: 'Nephron',
        meaning: 'Kidney ki basic filtration unit jo blood se urea aur extra water filter karke urine banati hai.',
      },
    ],
    formulas: [
      'Photosynthesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
      'Aerobic Respiration: Glucose → Pyruvate → CO₂ + H₂O + 38 ATP',
      'Anaerobic (Muscles): Glucose → Lactic Acid + 2 ATP',
    ],
    importantPoints: [
      'Xylem sirf upward direction mein water & minerals transport karta hai (transpiration pull).',
      'Phloem food (sucrose) ko dono directions (up & down) mein translocate karta hai.',
      'Board exams mein Human Heart aur Nephron ka labeled diagram practice zaroor karein.',
    ],
  },
  {
    id: 'res-dsa-cheat-sheet',
    title: 'Data Structures & Big-O Complexity Guide',
    subject: 'Computer Science',
    category: 'college',
    level: 'B.Tech / Placements',
    format: 'Cheat Sheet',
    pages: 5,
    summary:
      'Arrays, Linked Lists, Stacks, Queues, Trees, Hash Maps aur Sorting algorithms ki time & space complexity comparison table.',
    definitions: [
      {
        term: 'Time Complexity (Big-O)',
        meaning: 'Input size (n) badhne par algorithm ke operations kitni tezi se badhte hain, uska upper bound.',
      },
      {
        term: 'Hash Collision',
        meaning: 'Jab do alag keys ek hi hash index par map ho jayein — Chaining ya Open Addressing se solve karte hain.',
      },
    ],
    formulas: [
      'Binary Search: Time O(log n), Space O(1)',
      'Merge Sort: Time O(n log n), Space O(n) — Stable',
      'Hash Map Lookup: Average O(1), Worst O(n)',
      'BFS / DFS on Graph: Time O(V + E)',
    ],
    importantPoints: [
      'Agar data sorted hai, hamesha Binary Search ya Two Pointers approach check karo.',
      'Recursion tree ki maximum depth space complexity decide karti hai.',
      'Constraints dekho: n ≤ 10⁵ ke liye O(n log n) ya O(n) solution chahiye, O(n²) TLE dega.',
    ],
  },
  {
    id: 'res-indian-polity-articles',
    title: 'Indian Constitution — High-Yield Articles Summary',
    subject: 'Indian Polity',
    category: 'competitive',
    level: 'UPSC / SSC / CLAT',
    format: 'Exam Capsule',
    pages: 10,
    summary:
      'Fundamental Rights (Articles 12–35), DPSP, Fundamental Duties aur key Constitutional Amendments ka concise summary.',
    definitions: [
      {
        term: 'Article 14 (Right to Equality)',
        meaning: 'Equality before Law aur Equal Protection of Laws — sabhi log kanoon ke saamne barabar hain.',
      },
      {
        term: 'Article 21 (Right to Life)',
        meaning: 'Protection of Life and Personal Liberty — isme dignity, privacy aur clean environment ka right bhi shamil hai.',
      },
      {
        term: 'Article 32 (Constitutional Remedies)',
        meaning: 'Dr. B.R. Ambedkar ne ise "Heart and Soul of the Constitution" kaha — Supreme Court writs issue kar sakta hai.',
      },
    ],
    formulas: [
      'Fundamental Rights: Part III (Articles 12–35)',
      'DPSP: Part IV (Articles 36–51) — Non-justiciable',
      'Fundamental Duties: Part IV-A (Article 51A, 42nd Amendment 1976)',
    ],
    importantPoints: [
      '5 Writs yaad rakho: Habeas Corpus, Mandamus, Prohibition, Certiorari, Quo Warranto.',
      '42nd Amendment (1976) ko "Mini Constitution" kaha jata hai — Socialist, Secular, Integrity add hue.',
      '73rd & 74th Amendments ne Panchayati Raj aur Municipalities ko constitutional status diya.',
    ],
  },
  {
    id: 'res-maths-trigonometry',
    title: 'Trigonometry & Quadratic Identities Pack',
    subject: 'Mathematics',
    category: 'competitive',
    level: 'Class 10–12 & JEE',
    format: 'Formula Pack',
    pages: 4,
    summary:
      'Standard angle tables, Pythagorean identities, compound angle formulas aur quadratic roots shortcuts.',
    definitions: [
      {
        term: 'Trigonometric Identity',
        meaning: 'Aisi equation jo angle θ ke har valid value ke liye hamesha true hoti hai.',
      },
      {
        term: 'Sum & Product of Roots',
        meaning: 'ax² + bx + c = 0 ke roots α, β ke liye: α + β = −b/a aur αβ = c/a.',
      },
    ],
    formulas: [
      'sin²θ + cos²θ = 1  |  1 + tan²θ = sec²θ  |  1 + cot²θ = csc²θ',
      'sin(A ± B) = sinA·cosB ± cosA·sinB',
      'cos(2θ) = cos²θ − sin²θ = 2cos²θ − 1 = 1 − 2sin²θ',
    ],
    importantPoints: [
      'Quadrant sign rule: "All Silver Tea Cups" (Q1 All+, Q2 Sin+, Q3 Tan+, Q4 Cos+).',
      'Complementary angles: sin(90° − θ) = cosθ, tan(90° − θ) = cotθ.',
    ],
  },
  {
    id: 'res-personal-finance-gk',
    title: 'Everyday Finance & Compounding Basics for Students',
    subject: 'General Knowledge',
    category: 'gk',
    level: 'Students & Youth',
    format: 'Starter Guide',
    pages: 4,
    summary:
      'Simple vs Compound Interest, Inflation aur Rule of 72 ko real numbers aur daily life examples se samjho.',
    definitions: [
      {
        term: 'Compound Interest',
        meaning: 'Interest par bhi interest milna — long term mein paise exponentially grow karte hain.',
      },
      {
        term: 'Inflation',
        meaning: 'Samay ke saath cheezon ke daam badhna, jisse same ₹100 ki buying power kam hoti hai.',
      },
    ],
    formulas: [
      'Compound Amount: A = P(1 + r/n)^(nt)',
      'Rule of 72: Doubling Time (years) ≈ 72 / Annual Interest Rate (%)',
    ],
    importantPoints: [
      'Agar annual return 12% hai, toh Rule of 72 ke hisaab se paisa lagbhag 72/12 = 6 saal mein double hota hai.',
      'Simple Interest linear grow karta hai, Compound Interest curve upar ki taraf accelerate hoti hai.',
    ],
  },
];

export const STUDY_BUDDY_PROMPTS = [
  'Newton ka Second Law real-life example ke saath samjhao',
  'Photosynthesis aur Cellular Respiration mein kya difference hai?',
  'Quadratic equation x² − 5x + 6 = 0 step-by-step solve karo',
  'Binary Search O(log n) kyun hota hai? Simple Hinglish mein batao',
];

export const STORYTELLING_SCENES = [
  {
    chapter: 'Scene 01 · 1666, Woolsthorpe',
    title: 'Seb Neeche Gira — Par Chand Kyun Nahi Gira?',
    story:
      'Young Isaac Newton bagiche mein baithe the jab ek apple seedha zameen par gira. Unhone socha: agar Earth ki gravity apple ko kheench rahi hai, toh kya wahi force upar Moon ko bhi kheench rahi hai?',
    concept: 'Universal Gravitation: Har mass doosre mass ko attract karta hai (F = G·m₁m₂ / r²).',
  },
  {
    chapter: 'Scene 02 · Thought Experiment',
    title: 'Pahad ki Choti par Ek Cannon',
    story:
      'Newton ne imagine kiya ki ek bahut oonche pahad se cannonball fire ki jaye. Dheere fire karoge toh paas giregi. Bahut tez (~7.9 km/s) fire karoge toh jaise-jaise wo neeche giregi, Earth ka gol surface bhi neeche mudta jayega!',
    concept: 'Orbit = Continuous Free Fall with High Horizontal Velocity.',
  },
  {
    chapter: 'Scene 03 · Modern Spaceflight',
    title: 'Apple se ISRO ke Satellites tak',
    story:
      'Aaj weather satellites, GPS aur Chandrayaan missions exact isi principle par kaam karte hain. Gravity unhe space mein bhatakne nahi deti, aur speed unhe zameen par girne nahi deti.',
    concept: 'Balance of Centripetal Force and Gravitational Pull keeps satellites in orbit.',
  },
];
