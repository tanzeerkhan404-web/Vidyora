export interface ConceptModelHotspot {
  id: string;
  label: string;
  x: number;
  y: number;
  explanation: string;
}

export interface ConceptModelItem {
  id: string;
  title: string;
  subject: 'Biology' | 'Physics' | 'Chemistry' | 'Astronomy';
  level: string;
  summary: string;
  hotspots: ConceptModelHotspot[];
}

export const CONCEPT_MODELS: ConceptModelItem[] = [
  {
    id: 'human-heart',
    title: 'Human Heart — Four Chambers & Double Circulation',
    subject: 'Biology',
    level: 'Class 10–12',
    summary:
      'Explore how oxygen-poor blood travels to the lungs and oxygen-rich blood is pumped to the entire body without mixing.',
    hotspots: [
      { id: 'ra', label: 'Right Atrium', x: 34, y: 34, explanation: 'Receives deoxygenated blood from the body via the vena cava and sends it to the right ventricle.' },
      { id: 'rv', label: 'Right Ventricle', x: 36, y: 66, explanation: 'Pumps deoxygenated blood to the lungs via the pulmonary artery for oxygenation.' },
      { id: 'la', label: 'Left Atrium', x: 66, y: 34, explanation: 'Receives oxygen-rich blood returning from the lungs through the pulmonary veins.' },
      { id: 'lv', label: 'Left Ventricle', x: 64, y: 68, explanation: 'Has the thickest muscular wall; pumps oxygenated blood through the aorta to the whole body.' },
    ],
  },
  {
    id: 'plant-cell',
    title: 'Eukaryotic Plant Cell Structure',
    subject: 'Biology',
    level: 'Class 8–11',
    summary:
      'Inspect the key organelles that distinguish a plant cell, including the rigid cellulose cell wall, central vacuole, and chloroplasts.',
    hotspots: [
      { id: 'wall', label: 'Cell Wall', x: 16, y: 50, explanation: 'Rigid cellulose outer layer giving structural support and protection against osmotic bursting.' },
      { id: 'nucleus', label: 'Nucleus', x: 38, y: 36, explanation: 'Stores DNA and coordinates cellular growth, metabolism, and protein synthesis.' },
      { id: 'chloroplast', label: 'Chloroplast', x: 68, y: 32, explanation: 'Contains chlorophyll pigment that captures sunlight to synthesize glucose via photosynthesis.' },
      { id: 'vacuole', label: 'Central Vacuole', x: 62, y: 66, explanation: 'Large fluid-filled sac maintaining turgor pressure and storing water, ions, and nutrients.' },
    ],
  },
  {
    id: 'em-spectrum',
    title: 'Electromagnetic Spectrum (Radio to Gamma)',
    subject: 'Physics',
    level: 'Class 11–12 / JEE',
    summary:
      'All electromagnetic waves travel at c ≈ 3 × 10⁸ m/s in vacuum, differing in wavelength (λ) and frequency (ν = c / λ).',
    hotspots: [
      { id: 'radio', label: 'Radio & Microwaves', x: 18, y: 50, explanation: 'Longest wavelengths (mm to km); used for broadcasting, Wi-Fi, radar, and satellite links.' },
      { id: 'visible', label: 'Visible Light (400–700 nm)', x: 50, y: 50, explanation: 'Narrow band perceived by the human eye from Violet (high frequency) to Red (lower frequency).' },
      { id: 'xray', label: 'X-Rays & Gamma Rays', x: 82, y: 50, explanation: 'Shortest wavelengths and highest photon energy (E = hν); used in medical imaging and astrophysics.' },
    ],
  },
];

export const AUDIO_CHAPTER_SUMMARIES = [
  {
    id: 'audio-newton',
    title: "Newton's Three Laws of Motion — 2-Minute Revision",
    subject: 'Physics',
    level: 'Class 9–11',
    transcript:
      "Newton's First Law, the Law of Inertia, states that an object remains at rest or in uniform straight-line motion unless acted upon by an unbalanced external force. The Second Law quantifies force as the rate of change of momentum, written as F equals m times a for constant mass. The Third Law explains that every action force has an equal and opposite reaction force acting on two different bodies, which is why rockets push exhaust gases downward to accelerate upward.",
  },
  {
    id: 'audio-photosynthesis',
    title: 'Photosynthesis Light & Calvin Reactions Summary',
    subject: 'Biology',
    level: 'Class 10–12',
    transcript:
      'Photosynthesis converts solar energy into chemical energy inside plant chloroplasts. In the light-dependent reactions on thylakoid membranes, chlorophyll absorbs light, splits water molecules, releases oxygen gas, and produces ATP and NADPH. Next, in the stroma, the light-independent Calvin Cycle uses ATP and NADPH to fix carbon dioxide into glucose.',
  },
  {
    id: 'audio-constitution',
    title: 'Fundamental Rights of the Indian Constitution',
    subject: 'Civics / UPSC',
    level: 'Class 9–12 / UPSC',
    transcript:
      'Part III of the Constitution of India guarantees six Fundamental Rights: Right to Equality (Articles 14 to 18), Right to Freedom (Articles 19 to 22), Right against Exploitation (Articles 23 to 24), Right to Freedom of Religion (Articles 25 to 28), Cultural and Educational Rights (Articles 29 to 30), and Right to Constitutional Remedies under Article 32.',
  },
];

export const SIGNATURE_EXPERIENCES = {
  curiosityVault: [
    {
      title: 'Why does the sky look blue during the day and red at sunset?',
      subject: 'Physics',
      answer:
        'Rayleigh scattering! Shorter blue wavelengths scatter much more strongly off air molecules than red wavelengths. At sunset, sunlight travels through a much thicker slice of atmosphere, scattering away most blue light before reaching your eyes.',
    },
    {
      title: 'How can ships made of heavy steel float on water?',
      subject: 'Physics',
      answer:
        'Archimedes Principle! A steel ship is hollow, so its average density (steel + trapped air inside the hull) is lower than water. It displaces a weight of water equal to its own weight before sinking.',
    },
    {
      title: 'Why do onions make your eyes water?',
      subject: 'Chemistry',
      answer:
        'Cutting an onion breaks cells and releases enzymes that convert sulfur compounds into a volatile gas called syn-propanethial-S-oxide. When it reaches your eye moisture, it forms a mild irritant that triggers protective tears.',
    },
  ],
  wrongAnswerMuseum: [
    {
      myth: 'Heavier objects always fall faster than lighter objects.',
      whyPeopleThink: 'In everyday air, a stone hits the ground faster than a feather.',
      truth:
        'In vacuum (no air resistance), all objects accelerate equally at g ≈ 9.8 m/s² regardless of mass. Air drag slows the feather because of its large surface area relative to weight.',
    },
    {
      myth: 'Summer is hotter because Earth is closer to the Sun.',
      whyPeopleThink: 'Being closer to a fire feels warmer.',
      truth:
        'Seasons are caused by Earth’s 23.5° axial tilt, not distance! When the Northern Hemisphere tilts toward the Sun, sunlight hits more directly and days are longer.',
    },
    {
      myth: 'Plants only photosynthesize and never respire.',
      whyPeopleThink: 'Textbooks highlight that plants release oxygen.',
      truth:
        'Plants perform cellular respiration 24 hours a day to release energy from glucose—taking in O₂ and releasing CO₂. During daytime, photosynthesis produces far more O₂ than respiration consumes.',
    },
  ],
  whatIfPrompts: [
    {
      question: 'What if friction suddenly disappeared across Earth for 10 seconds?',
      scientificAnalysis:
        'Walking, braking vehicles, holding a pen, and even knots in shoelaces rely on friction. Moving cars would keep gliding at constant velocity (Newton’s First Law), nails would slip out of wood, and nothing could start moving by pushing against the ground.',
    },
    {
      question: 'What if Earth’s atmosphere had zero greenhouse gases?',
      scientificAnalysis:
        'Without natural greenhouse gases (water vapour, CO₂, methane), Earth’s average surface temperature would plunge from about +15°C to around -18°C, freezing most surface oceans. The modern climate problem is rapid excess greenhouse warming, not their mere existence.',
    },
  ],
  knowledgeDetective: [
    {
      id: 'kd-1',
      title: 'The Mystery Element',
      clues: [
        'Clue 1: At room temperature, I am a colourless, odourless gas making up about 78% of Earth’s atmosphere.',
        'Clue 2: My two atoms are joined by a very strong triple covalent bond (N≡N).',
        'Clue 3: Rhizobium bacteria in legume root nodules convert me into compounds plants can absorb.',
      ],
      options: ['Oxygen (O₂)', 'Nitrogen (N₂)', 'Carbon Dioxide (CO₂)', 'Argon (Ar)'],
      correctIndex: 1,
      explanation: 'Nitrogen (N₂) makes up ~78% of air and requires nitrogen fixation due to its strong triple bond.',
    },
    {
      id: 'kd-2',
      title: 'The Hidden Force',
      clues: [
        'Clue 1: I always act toward the centre of a curved circular path.',
        'Clue 2: For a satellite orbiting Earth, gravity plays my role.',
        'Clue 3: My magnitude equals mv² / r.',
      ],
      options: ['Centripetal Force', 'Buoyant Force', 'Electrostatic Repulsion', 'Magnetic Flux'],
      correctIndex: 0,
      explanation: 'Centripetal force (F = mv²/r) keeps an object moving in a circular path by continuously changing its velocity direction.',
    },
  ],
  realLifeClassroom: [
    {
      topic: 'Quadratic Equations & Parabolas',
      everydayUse: 'Satellite dish antennas, car headlight reflectors, and cricket ball trajectories.',
      insight: 'Parabolic reflectors focus incoming parallel signals straight to one receiver focal point.',
    },
    {
      topic: 'Electrochemistry & Redox Reactions',
      everydayUse: 'Lithium-ion smartphone batteries, EV charging, and galvanised iron roofs preventing rust.',
      insight: 'Controlled electron flow between anode and cathode stores and delivers electrical energy.',
    },
    {
      topic: 'Percentage & Compound Interest',
      everydayUse: 'UPI cashback comparisons, education loans, and long-term savings.',
      insight: 'Understanding A = P(1 + r/n)^(nt) protects families from deceptive high-interest debt.',
    },
  ],
};

export const CAREER_PATHWAYS = [
  {
    track: 'Science (PCM) → Engineering, Data Science & Architecture',
    exams: 'JEE Main, JEE Advanced, NATA, State CETs, CUET-UG',
    skills: 'Calculus, Physics problem-solving, Programming, Design Thinking',
    note: 'Suitable for students who enjoy quantitative modelling, technology, or building systems.',
  },
  {
    track: 'Science (PCB) → Medicine, Biotechnology & Life Sciences',
    exams: 'NEET-UG, IISER IAT, CUET-UG (Biotech/Microbiology)',
    skills: 'Human Biology, Organic Chemistry, Empathy, Clinical Observation',
    note: 'Includes MBBS, BDS, Nursing, Pharmacy, Genetics, and Biomedical Research.',
  },
  {
    track: 'Commerce & Humanities → Finance, Law, Civil Services & Design',
    exams: 'CLAT, CA Foundation, CUET-UG, UPSC CSE (after graduation), NID/UCEED',
    skills: 'Analytical writing, Economics, Constitutional Literacy, Communication',
    note: 'Offers broad careers in public policy, law, chartered accountancy, journalism, and entrepreneurship.',
  },
];

export const OFFICIAL_SCHOLARSHIP_PORTALS = [
  {
    name: 'National Scholarship Portal (NSP) — Government of India',
    authority: 'Ministry of Electronics & IT / Central & State Ministries',
    eligibilitySummary: 'Pre-Matric, Post-Matric, and Merit-cum-Means scholarships for eligible Indian school & college students.',
    officialUrl: 'https://scholarships.gov.in/',
    deadlineStatus: 'Verify current academic-year open dates directly on scholarships.gov.in',
  },
  {
    name: 'DST INSPIRE Scholarship for Higher Education (SHE)',
    authority: 'Department of Science & Technology (DST), Govt. of India',
    eligibilitySummary: 'Supports meritorious students pursuing natural and basic sciences at B.Sc. / Integrated M.Sc. level.',
    officialUrl: 'https://online-inspire.gov.in/',
    deadlineStatus: 'Verify current cycle notification & cutoff on online-inspire.gov.in',
  },
  {
    name: 'AICTE Pragati & Saksham Scholarship Schemes',
    authority: 'All India Council for Technical Education (AICTE)',
    eligibilitySummary: 'Supports girl students (Pragati) and specially-abled students (Saksham) in AICTE-approved technical diploma/degree courses.',
    officialUrl: 'https://www.aicte-india.org/schemes/students-development-schemes',
    deadlineStatus: 'Verify current application window on AICTE / NSP official portal',
  },
];
