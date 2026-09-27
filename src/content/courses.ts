import { Course } from '@/types';

export const INITIAL_COURSES: Course[] = [
  // ==========================================
  // JUNIOR TIER: GRADES 1–4
  // ==========================================
  {
    id: 'course-g1-math',
    title: 'Grade 1 Mathematics: Fun Numbers & Shapes',
    slug: 'grade-1-fun-numbers-shapes',
    gradeId: 'grade-1',
    subjectId: 'sub-math',
    subjectName: 'Mathematics',
    shortDescription: 'Discover counting, basic addition, shapes, patterns, and everyday math puzzles.',
    description: 'A cheerful and engaging introduction to numbers for Grade 1 learners! Students learn how to count to 100, recognize 2D and 3D shapes, understand number bonds, and solve fun real-life counting puzzles through visual stories.',
    thumbnail: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80',
    level: 'Beginner',
    duration: '2h 15m',
    lessonCount: 3,
    rating: 4.95,
    studentsEnrolled: 840,
    featured: true,
    updatedAt: '2026-09-01',
    instructor: {
      name: 'Ms. Clara Bloom',
      role: 'Early Childhood Mathematics Specialist',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      bio: 'Over 10 years of experience making foundational mathematics intuitive and joyful for early learners.'
    },
    chapters: [
      {
        id: 'chap-g1-1',
        title: 'Unit 1: Number Magic & Counting',
        description: 'Explore numbers 1 to 20, grouping items, and comparing quantities.',
        order: 1,
        lessons: [
          {
            id: 'les-g1-1',
            title: 'Counting 1 to 20 with Animals',
            slug: 'counting-1-to-20-with-animals',
            description: 'Count animal friends in the safari, group them by color, and practice writing numerals.',
            duration: '12:30',
            videoId: '0VLxWIHRD4E',
            videoUrl: 'https://www.youtube.com/watch?v=0VLxWIHRD4E',
            chapterId: 'chap-g1-1',
            order: 1,
            quizId: 'quiz-g1-1',
            learningObjectives: [
              'Count objects up to 20 with one-to-one correspondence',
              'Recognize numerals 1 through 20',
              'Identify whether a group has more, fewer, or equal items'
            ],
            keyConcepts: [
              { title: 'One-to-One Counting', detail: 'Touching and counting each animal exactly once in sequence.' }
            ],
            resources: []
          },
          {
            id: 'les-g1-2',
            title: 'Adding Friendly Numbers Together',
            slug: 'adding-friendly-numbers',
            description: 'Learn what addition means using apples, balloons, and toy blocks.',
            duration: '14:10',
            videoId: 'AuX7nPBqDts',
            videoUrl: 'https://www.youtube.com/watch?v=AuX7nPBqDts',
            chapterId: 'chap-g1-1',
            order: 2,
            learningObjectives: [
              'Understand addition as putting groups together',
              'Use the plus (+) and equals (=) signs'
            ],
            keyConcepts: [
              { title: 'Sum & Addends', detail: 'The two parts that combine to make the whole sum.' }
            ],
            resources: []
          },
          {
            id: 'les-g1-3',
            title: 'Shapes in the World Around Us',
            slug: 'shapes-in-our-world',
            description: 'Spot circles, triangles, rectangles, and squares in everyday objects.',
            duration: '11:45',
            videoId: 'w6e3qgH_J38',
            videoUrl: 'https://www.youtube.com/watch?v=w6e3qgH_J38',
            chapterId: 'chap-g1-1',
            order: 3,
            learningObjectives: [
              'Identify circles, squares, triangles, and rectangles',
              'Count sides and corners of standard 2D shapes'
            ],
            keyConcepts: [
              { title: 'Sides and Vertices', detail: 'Straight edges and pointed corners that define shapes.' }
            ],
            resources: []
          }
        ]
      }
    ]
  },

  {
    id: 'course-g2-sci',
    title: 'Grade 2 Science: Wonderful World of Animals & Plants',
    slug: 'grade-2-animals-and-plants',
    gradeId: 'grade-2',
    subjectId: 'sub-sci',
    subjectName: 'Natural Sciences',
    shortDescription: 'Explore habitats, how seeds grow into giant trees, and animal classifications.',
    description: 'Join an interactive adventure into nature! Grade 2 students discover what plants need to grow, how animals adapt to hot deserts and icy poles, and how every living thing works together.',
    thumbnail: 'https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?auto=format&fit=crop&w=800&q=80',
    level: 'Beginner',
    duration: '2h 40m',
    lessonCount: 2,
    rating: 4.92,
    studentsEnrolled: 620,
    featured: true,
    updatedAt: '2026-09-02',
    instructor: {
      name: 'Oliver Vance',
      role: 'Wildlife Biologist & Science Storyteller',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      bio: 'Dedicated to inspiring young minds through visual nature expeditions and outdoor discoveries.'
    },
    chapters: [
      {
        id: 'chap-g2-1',
        title: 'Unit 1: Plant Life & Growth',
        description: 'From tiny seeds to tall flowers.',
        order: 1,
        lessons: [
          {
            id: 'les-g2-1',
            title: 'What Do Plants Need to Grow?',
            slug: 'what-do-plants-need',
            description: 'Learn how sunlight, soil, water, and air help seedlings sprout and bloom.',
            duration: '15:20',
            videoId: 'dUBIQ1fTRzI',
            videoUrl: 'https://www.youtube.com/watch?v=dUBIQ1fTRzI',
            chapterId: 'chap-g2-1',
            order: 1,
            quizId: 'quiz-g2-1',
            learningObjectives: [
              'Identify the 4 key ingredients plants need for healthy growth',
              'Trace the lifecycle from seed to flower'
            ],
            keyConcepts: [
              { title: 'Photosynthesis Basics', detail: 'Plants using sunlight and green leaves to make their own food.' }
            ],
            resources: []
          },
          {
            id: 'les-g2-2',
            title: 'Animal Habitats: Deserts, Oceans, and Jungles',
            slug: 'animal-habitats',
            description: 'Discover how camels stay cool in deserts and polar bears keep warm in snow.',
            duration: '16:00',
            videoId: 'byvf7jwdvOI',
            videoUrl: 'https://www.youtube.com/watch?v=byvf7jwdvOI',
            chapterId: 'chap-g2-1',
            order: 2,
            learningObjectives: [
              'Define what a habitat is',
              'Match animals to their natural environment'
            ],
            keyConcepts: [
              { title: 'Adaptation', detail: 'Special traits animals develop to thrive in their home habitat.' }
            ],
            resources: []
          }
        ]
      }
    ]
  },

  {
    id: 'course-g3-math',
    title: 'Grade 3 Mathematics: Multiplication & Division Journeys',
    slug: 'grade-3-multiplication-division',
    gradeId: 'grade-3',
    subjectId: 'sub-math',
    subjectName: 'Mathematics',
    shortDescription: 'Master multiplication arrays, equal sharing division, and fast mental math strategies.',
    description: 'Turn times tables into an exciting adventure! Grade 3 students master equal groups, visual grid arrays, division as sharing, and solve multi-step story problems with confidence.',
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
    level: 'Beginner',
    duration: '3h 10m',
    lessonCount: 2,
    rating: 4.88,
    studentsEnrolled: 710,
    featured: true,
    updatedAt: '2026-09-03',
    instructor: {
      name: 'Ms. Clara Bloom',
      role: 'Early Childhood Mathematics Specialist',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      bio: 'Over 10 years of experience making foundational mathematics intuitive and joyful for early learners.'
    },
    chapters: [
      {
        id: 'chap-g3-1',
        title: 'Unit 1: Understanding Multiplication',
        description: 'Equal groups and times tables made simple.',
        order: 1,
        lessons: [
          {
            id: 'les-g3-1',
            title: 'Repeated Addition & The Power of Arrays',
            slug: 'repeated-addition-and-arrays',
            description: 'See how rows and columns make counting large groups of objects fast and effortless.',
            duration: '17:15',
            videoId: 'mvOkMYCQgCo',
            videoUrl: 'https://www.youtube.com/watch?v=mvOkMYCQgCo',
            chapterId: 'chap-g3-1',
            order: 1,
            quizId: 'quiz-g3-1',
            learningObjectives: [
              'Model multiplication using rows and columns in an array',
              'Convert repeated addition expressions into multiplication equations'
            ],
            keyConcepts: [
              { title: 'Commutative Property', detail: '3 groups of 4 is equal to 4 groups of 3 (3 x 4 = 4 x 3 = 12).' }
            ],
            resources: []
          },
          {
            id: 'les-g3-2',
            title: 'Division as Fair Sharing',
            slug: 'division-as-fair-sharing',
            description: 'Dividing cookies, marbles, and cards equally among friends.',
            duration: '18:00',
            videoId: 'FBbHmg_7tL4',
            videoUrl: 'https://www.youtube.com/watch?v=FBbHmg_7tL4',
            chapterId: 'chap-g3-1',
            order: 2,
            learningObjectives: [
              'Understand division as equal sharing and partitioning',
              'Connect division directly to multiplication inverse facts'
            ],
            keyConcepts: [
              { title: 'Inverse Operations', detail: 'If 4 x 5 = 20, then 20 ÷ 5 = 4.' }
            ],
            resources: []
          }
        ]
      }
    ]
  },

  {
    id: 'course-g4-math',
    title: 'Grade 4 Mathematics: Fractions, Decimals & Geometry',
    slug: 'grade-4-fractions-decimals-geometry',
    gradeId: 'grade-4',
    subjectId: 'sub-math',
    subjectName: 'Mathematics',
    shortDescription: 'Conquer equivalent fractions, tenths and hundredths, perimeter, and angle measurements.',
    description: 'Step into upper-elementary math mastery! Grade 4 students learn how pizza slices turn into fractions, compare decimal numbers, measure angles with protractors, and calculate area and perimeter.',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
    level: 'Intermediate',
    duration: '3h 30m',
    lessonCount: 2,
    rating: 4.9,
    studentsEnrolled: 950,
    featured: true,
    updatedAt: '2026-09-04',
    instructor: {
      name: 'Ms. Clara Bloom',
      role: 'Early Childhood Mathematics Specialist',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      bio: 'Over 10 years of experience making foundational mathematics intuitive and joyful for early learners.'
    },
    chapters: [
      {
        id: 'chap-g4-1',
        title: 'Unit 1: Fractions in Action',
        description: 'Numerator, denominator, and equivalent fraction families.',
        order: 1,
        lessons: [
          {
            id: 'les-g4-1',
            title: 'Equivalent Fractions: Seeing Equal Parts',
            slug: 'equivalent-fractions',
            description: 'Why 1/2 is the same as 2/4 and 4/8 using fraction bars and number lines.',
            duration: '19:40',
            videoId: 'qcHHhd6H67s',
            videoUrl: 'https://www.youtube.com/watch?v=qcHHhd6H67s',
            chapterId: 'chap-g4-1',
            order: 1,
            quizId: 'quiz-g4-1',
            learningObjectives: [
              'Generate equivalent fractions by multiplying or dividing numerator and denominator by same factor',
              'Plot and compare fractions on a number line'
            ],
            keyConcepts: [
              { title: 'Equivalent Value', detail: 'Fractions that represent the exact same portion of a whole.' }
            ],
            resources: []
          },
          {
            id: 'les-g4-2',
            title: 'Perimeter and Area of Polygons',
            slug: 'perimeter-and-area',
            description: 'Calculate the fence around a garden (perimeter) and the grass inside (area).',
            duration: '16:50',
            videoId: 'rSVMrPu0__U',
            videoUrl: 'https://www.youtube.com/watch?v=rSVMrPu0__U',
            chapterId: 'chap-g4-1',
            order: 2,
            learningObjectives: [
              'Differentiate between linear perimeter and square unit area',
              'Apply length x width formula for rectangles'
            ],
            keyConcepts: [
              { title: 'Square Units', detail: 'Area measures the two-dimensional surface space covered.' }
            ],
            resources: []
          }
        ]
      }
    ]
  },

  // ==========================================
  // MIDDLE TIER: GRADES 5–8
  // ==========================================
  {
    id: 'course-g5-math',
    title: 'Grade 5 Mathematics: Pre-Algebra & Decimals',
    slug: 'grade-5-prealgebra-decimals',
    gradeId: 'grade-5',
    subjectId: 'sub-math',
    subjectName: 'Mathematics',
    shortDescription: 'Master orders of operations (PEMDAS), multi-digit decimal operations, and volume.',
    description: 'Bridge elementary arithmetic and algebraic reasoning. Grade 5 students explore numerical expressions, parenthetical grouping, multi-step division, coordinate planes, and 3D volume calculations.',
    thumbnail: 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?auto=format&fit=crop&w=800&q=80',
    level: 'Intermediate',
    duration: '3h 40m',
    lessonCount: 2,
    rating: 4.91,
    studentsEnrolled: 1100,
    featured: true,
    updatedAt: '2026-09-05',
    instructor: {
      name: 'David Sterling',
      role: 'Middle School STEM Coordinator',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      bio: 'Passionate about preparing middle school learners for high school mathematics and analytical thinking.'
    },
    chapters: [
      {
        id: 'chap-g5-1',
        title: 'Unit 1: Order of Operations & Expressions',
        description: 'Parentheses, brackets, and evaluating algebraic phrases.',
        order: 1,
        lessons: [
          {
            id: 'les-g5-1',
            title: 'PEMDAS Order of Operations Decoded',
            slug: 'pemdas-order-of-operations',
            description: 'Why order matters when evaluating expressions like 4 + 3 x (5 - 2).',
            duration: '21:10',
            videoId: 'ClYdw4d4OmA',
            videoUrl: 'https://www.youtube.com/watch?v=ClYdw4d4OmA',
            chapterId: 'chap-g5-1',
            order: 1,
            quizId: 'quiz-g5-1',
            learningObjectives: [
              'Apply standard order of operations: Parentheses, Exponents, Multiply/Divide, Add/Subtract',
              'Write simple mathematical expressions recording calculations with numbers'
            ],
            keyConcepts: [
              { title: 'Precedence', detail: 'Multiplication and division take precedence over addition and subtraction, evaluated left to right.' }
            ],
            resources: []
          },
          {
            id: 'les-g5-2',
            title: 'Calculating Volume of Rectangular Prisms',
            slug: 'calculating-volume',
            description: 'Understand 3-dimensional cubic units: length x width x height.',
            duration: '18:30',
            videoId: 'u1nWI2b0fT4',
            videoUrl: 'https://www.youtube.com/watch?v=u1nWI2b0fT4',
            chapterId: 'chap-g5-1',
            order: 2,
            learningObjectives: [
              'Measure volume by counting unit cubes of 1 cubic cm/inch',
              'Use V = l x w x h to solve practical container challenges'
            ],
            keyConcepts: [
              { title: 'Cubic Units', detail: 'Volume measures the space enclosed inside a 3D solid.' }
            ],
            resources: []
          }
        ]
      }
    ]
  },

  {
    id: 'course-g6-sci',
    title: 'Grade 6 Science: Earth Systems & Astronomy',
    slug: 'grade-6-earth-systems-astronomy',
    gradeId: 'grade-6',
    subjectId: 'sub-sci',
    subjectName: 'Earth & Space Sciences',
    shortDescription: 'Explore plate tectonics, rock cycles, atmospheric layers, and the solar system.',
    description: 'Embark on a voyage from Earth core to distant galaxies. Grade 6 students analyze seismic waves, volcanic forces, climate patterns, gravitational tides, and planetary motion.',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    level: 'Intermediate',
    duration: '3h 25m',
    lessonCount: 2,
    rating: 4.87,
    studentsEnrolled: 980,
    featured: true,
    updatedAt: '2026-09-06',
    instructor: {
      name: 'Oliver Vance',
      role: 'Earth & Planetary Scientist',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      bio: 'NASA educational partner and planetary science researcher.'
    },
    chapters: [
      {
        id: 'chap-g6-1',
        title: 'Unit 1: Dynamic Earth & Plate Tectonics',
        description: 'The moving crust, earthquakes, and continental drift.',
        order: 1,
        lessons: [
          {
            id: 'les-g6-1',
            title: 'Plate Boundaries: Collisions, Rifts, and Faults',
            slug: 'plate-boundaries-and-tectonics',
            description: 'Examine convergent, divergent, and transform boundaries and the formation of mountain ranges.',
            duration: '22:40',
            videoId: 'tcPghqnnTvA',
            videoUrl: 'https://www.youtube.com/watch?v=tcPghqnnTvA',
            chapterId: 'chap-g6-1',
            order: 1,
            quizId: 'quiz-g6-1',
            learningObjectives: [
              'Identify the three primary types of tectonic plate boundaries',
              'Explain the mantle convection currents driving continental drift'
            ],
            keyConcepts: [
              { title: 'Subduction Zones', detail: 'Dense oceanic plates sinking beneath continental plates, fueling volcanic arcs.' }
            ],
            resources: []
          },
          {
            id: 'les-g6-2',
            title: 'Our Solar System & Planetary Orbits',
            slug: 'solar-system-orbits',
            description: 'Why planets stay in elliptical orbits around the sun under gravitational attraction.',
            duration: '20:15',
            videoId: 'libKPrv0Z-c',
            videoUrl: 'https://www.youtube.com/watch?v=libKPrv0Z-c',
            chapterId: 'chap-g6-1',
            order: 2,
            prerequisiteLessonId: 'les-g6-1',
            learningObjectives: [
              'Understand Keplerian elliptical orbits and gravitational equilibrium',
              'Distinguish between terrestrial inner planets and gas giants'
            ],
            keyConcepts: [
              { title: 'Gravity and Inertia', detail: 'The twin forces that keep planets locked in stable orbits.' }
            ],
            resources: []
          }
        ]
      }
    ]
  },

  {
    id: 'course-g7-math',
    title: 'Grade 7 Mathematics: Linear Equations & Proportions',
    slug: 'grade-7-linear-equations-proportions',
    gradeId: 'grade-7',
    subjectId: 'sub-math',
    subjectName: 'Mathematics',
    shortDescription: 'Solve two-step equations, unit rates, percentage changes, and geometric transformations.',
    description: 'Master algebraic fluency! Grade 7 students learn how to isolate variables across equality signs, model real-world financial rates, graph proportional relationships, and understand scale drawings.',
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
    level: 'Intermediate',
    duration: '3h 50m',
    lessonCount: 2,
    rating: 4.89,
    studentsEnrolled: 1240,
    featured: true,
    updatedAt: '2026-09-07',
    instructor: {
      name: 'David Sterling',
      role: 'Middle School STEM Coordinator',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      bio: 'Passionate about preparing middle school learners for high school mathematics and analytical thinking.'
    },
    chapters: [
      {
        id: 'chap-g7-1',
        title: 'Unit 1: Solving Two-Step Equations',
        description: 'Balance scale method and inverse operations.',
        order: 1,
        lessons: [
          {
            id: 'les-g7-1',
            title: 'Isolating the Variable with Inverse Operations',
            slug: 'isolating-the-variable',
            description: 'Systematically solve 3x + 7 = 22 by undoing addition and multiplication in reverse.',
            duration: '23:30',
            videoId: 'LDIiYKYvvdA',
            videoUrl: 'https://www.youtube.com/watch?v=LDIiYKYvvdA',
            chapterId: 'chap-g7-1',
            order: 1,
            quizId: 'quiz-g7-1',
            learningObjectives: [
              'Solve equations of the form ax + b = c fluently',
              'Check solutions by substituting back into original expressions'
            ],
            keyConcepts: [
              { title: 'Balancing Equations', detail: 'Whatever operation is performed on one side must be performed identically on the other.' }
            ],
            resources: []
          },
          {
            id: 'les-g7-2',
            title: 'Unit Rates and Constant of Proportionality (k)',
            slug: 'unit-rates-and-proportionality',
            description: 'Compare miles per gallon, unit prices, and compute y = kx equations.',
            duration: '21:10',
            videoId: 'V1m_2n-8sXQ',
            videoUrl: 'https://www.youtube.com/watch?v=V1m_2n-8sXQ',
            chapterId: 'chap-g7-1',
            order: 2,
            learningObjectives: [
              'Calculate constant of proportionality from tables, graphs, and word problems',
              'Graph proportional lines passing through the origin (0,0)'
            ],
            keyConcepts: [
              { title: 'Constant of Proportionality', detail: 'The ratio k = y / x which remains constant across all data pairs.' }
            ],
            resources: []
          }
        ]
      }
    ]
  },

  {
    id: 'course-g8-cs',
    title: 'Grade 8 Computer Science: Python Programming Foundations',
    slug: 'grade-8-python-programming-foundations',
    gradeId: 'grade-8',
    subjectId: 'sub-cs',
    subjectName: 'Computer Science',
    shortDescription: 'Write your first Python scripts: variables, loops, conditional logic, and simple text games.',
    description: 'Step into real coding! Grade 8 students learn fundamental computational thinking using Python 3. Build interactive terminal games, automate calculations, and explore Boolean logic with clean syntax.',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    level: 'Beginner',
    duration: '4h 00m',
    lessonCount: 2,
    rating: 4.96,
    studentsEnrolled: 1850,
    featured: true,
    updatedAt: '2026-09-08',
    instructor: {
      name: 'Dr. Elena Rostova',
      role: 'Principal Computer Scientist & Educator',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      bio: 'Former MIT Senior Researcher specializing in computational complexity and distributed systems.'
    },
    chapters: [
      {
        id: 'chap-g8-1',
        title: 'Unit 1: Python Core Syntax & Control Flow',
        description: 'Variables, loops, and decision making in code.',
        order: 1,
        lessons: [
          {
            id: 'les-g8-1',
            title: 'Variables, Data Types, and User Input in Python',
            slug: 'python-variables-and-input',
            description: 'Learn strings, integers, floats, and interactive terminal input using input().',
            duration: '22:15',
            videoId: 'kqtD5dpn9C8',
            videoUrl: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
            chapterId: 'chap-g8-1',
            order: 1,
            quizId: 'quiz-g8-1',
            learningObjectives: [
              'Declare and manipulate Python variables',
              'Convert strings to integers with int() casting',
              'Construct f-strings for clean console output'
            ],
            keyConcepts: [
              { title: 'Dynamic Typing', detail: 'Python automatically infers variable types at runtime.' }
            ],
            resources: []
          },
          {
            id: 'les-g8-2',
            title: 'If Statements, Elif, and Boolean Logic',
            slug: 'python-if-else-logic',
            description: 'Building a choose-your-own-adventure game using branching logic and comparisons.',
            duration: '25:00',
            videoId: 'DZwmZ8Usvnk',
            videoUrl: 'https://www.youtube.com/watch?v=DZwmZ8Usvnk',
            chapterId: 'chap-g8-1',
            order: 2,
            learningObjectives: [
              'Implement if/elif/else decision trees',
              'Combine conditions using and, or, and not'
            ],
            keyConcepts: [
              { title: 'Indentation Scope', detail: 'Python uses whitespace tabs to define execution blocks.' }
            ],
            resources: []
          }
        ]
      }
    ]
  },

  // ==========================================
  // SENIOR TIER: GRADES 9–10
  // ==========================================
  {
    id: 'course-cs-101',
    title: 'Grade 9 Computer Science: Data Structures & Algorithms',
    slug: 'grade-9-cs-algorithm-essentials',
    gradeId: 'grade-9',
    subjectId: 'sub-cs',
    subjectName: 'Computer Science',
    shortDescription: 'Master fundamental data structures, asymptotic notation, sorting algorithms, and complexity theory.',
    description: 'An authoritative introduction to computer science foundations for Grade 9 students preparing for serious technical studies. Learn memory allocation, Big-O computational limits, and key data structures.',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    level: 'Intermediate',
    duration: '3h 45m',
    lessonCount: 3,
    rating: 4.93,
    studentsEnrolled: 3420,
    featured: true,
    updatedAt: '2026-08-15',
    instructor: {
      name: 'Dr. Elena Rostova',
      role: 'Principal Computer Scientist & Educator',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      bio: 'Former MIT Senior Researcher specializing in computational complexity and distributed systems.'
    },
    chapters: [
      {
        id: 'chap-101-1',
        title: 'Module 1: Foundations of Computation',
        description: 'Introduction to how computers process instructions and evaluate algorithmic efficiency.',
        order: 1,
        lessons: [
          {
            id: 'les-cs-1',
            title: 'How Computers Think: Memory, Registers, and Execution',
            slug: 'how-computers-think',
            description: 'Dive beneath high-level languages to understand RAM layouts, CPU registers, stack vs. heap allocation, and machine instruction cycles.',
            duration: '18:40',
            videoId: 'zOjov-2OZ0E',
            videoUrl: 'https://www.youtube.com/watch?v=zOjov-2OZ0E',
            chapterId: 'chap-101-1',
            order: 1,
            quizId: 'quiz-cs-1',
            learningObjectives: [
              'Understand the distinction between Stack and Heap memory allocation',
              'Trace CPU instruction execution cycles from RAM to registers',
              'Analyze how primitive data types are represented in 64-bit binary memory'
            ],
            keyConcepts: [
              {
                title: 'Stack vs Heap',
                detail: 'Stack memory stores synchronous function calls and primitive variables with static lifetimes, while Heap memory manages dynamically allocated references.'
              },
              {
                title: 'Instruction Cycle',
                detail: 'Fetch, Decode, Execute: the fundamental loop executed by the CPU control unit billions of times per second.'
              }
            ],
            resources: []
          },
          {
            id: 'les-cs-2',
            title: 'Algorithmic Complexity & Big-O Notation',
            slug: 'algorithmic-complexity-big-o',
            description: 'Learn how to measure algorithmic efficiency across time and space domains using asymptotic upper bounds.',
            duration: '22:15',
            videoId: 'g2o22C3CRfU',
            videoUrl: 'https://www.youtube.com/watch?v=g2o22C3CRfU',
            chapterId: 'chap-101-1',
            order: 2,
            learningObjectives: [
              'Calculate worst-case, best-case, and average-case time complexities',
              'Differentiate between O(1), O(log n), O(n), O(n log n), and O(n²)',
              'Evaluate space complexity overheads in recursive algorithms'
            ],
            keyConcepts: [
              {
                title: 'Asymptotic Analysis',
                detail: 'Analyzing algorithm performance as input size approaches infinity, ignoring lower-order terms and constant factors.'
              }
            ],
            resources: []
          },
          {
            id: 'les-cs-3',
            title: 'Hash Tables, Collisions, and Map Implementations',
            slug: 'hash-tables-and-collisions',
            description: 'Understand how O(1) lookup works in hash maps, load factor dynamics, and collision resolution techniques.',
            duration: '26:00',
            videoId: 'shs0KM3wKv8',
            videoUrl: 'https://www.youtube.com/watch?v=shs0KM3wKv8',
            chapterId: 'chap-101-1',
            order: 3,
            learningObjectives: [
              'Calculate hash bucket addresses with modulo hashing',
              'Implement linear probing and chaining for collisions'
            ],
            keyConcepts: [
              { title: 'Load Factor', detail: 'Threshold determining when an underlying hash array must be doubled in size.' }
            ],
            resources: []
          }
        ]
      }
    ]
  },

  {
    id: 'course-web-201',
    title: 'Grade 10 Software Engineering: Full-Stack Web Architecture',
    slug: 'grade-10-full-stack-web-architecture',
    gradeId: 'grade-10',
    subjectId: 'sub-web',
    subjectName: 'Modern Web Development',
    shortDescription: 'Build modern server-side rendered apps with React Server Components, Next.js, and TypeScript.',
    description: 'A pre-college production curriculum for Grade 10 students. Master React Server Components (RSC), hydration boundaries, Server Actions, edge routing, state management, and production cloud architecture.',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    level: 'Advanced',
    duration: '4h 15m',
    lessonCount: 2,
    rating: 4.97,
    studentsEnrolled: 5120,
    featured: true,
    updatedAt: '2026-08-28',
    instructor: {
      name: 'Marcus Vance',
      role: 'Staff Frontend Architect',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      bio: 'Leading UI architecture consultant and author of scalable web systems.'
    },
    chapters: [
      {
        id: 'chap-web-1',
        title: 'Module 1: React Server Components & App Router',
        description: 'Deep dive into server-first rendering paradigms, streaming, and bundle reduction.',
        order: 1,
        lessons: [
          {
            id: 'les-web-1',
            title: 'Understanding React Server Components (RSC)',
            slug: 'understanding-react-server-components',
            description: 'Why RSC changes everything: zero-bundle-size server execution, server-to-client props serialization, and security.',
            duration: '24:10',
            videoId: 'SqcY0GlETPk',
            videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
            chapterId: 'chap-web-1',
            order: 1,
            quizId: 'quiz-web-1',
            learningObjectives: [
              'Differentiate between Client Components ("use client") and Server Components',
              'Understand RSC payload streaming over HTTP',
              'Eliminate client-side JS bundle overhead for static and database-fetching components'
            ],
            keyConcepts: [
              {
                title: 'RSC Boundary',
                detail: 'Server components execute exclusively on the server and emit an RSC wire format string to the browser.'
              }
            ],
            resources: []
          },
          {
            id: 'les-web-2',
            title: 'Mastering Next.js Layouts, Templates, & Parallel Routes',
            slug: 'nextjs-layouts-and-routes',
            description: 'Design composable layouts, preserve client component state across navigations, and leverage parallel route slots.',
            duration: '21:30',
            videoId: 'rfscVS0vtbw',
            videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
            chapterId: 'chap-web-1',
            order: 2,
            learningObjectives: [
              'Implement root and nested layouts without re-rendering headers/navbars',
              'Utilize loading.tsx skeletons and error.tsx boundaries for high UX resilience'
            ],
            keyConcepts: [
              {
                title: 'Nested Layouts',
                detail: 'Layouts encapsulate sub-route pages, maintaining UI state across child page route switches.'
              }
            ],
            resources: []
          }
        ]
      }
    ]
  }
];
