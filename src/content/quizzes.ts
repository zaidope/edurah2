import { Quiz } from '@/types';

export const INITIAL_QUIZZES: Quiz[] = [
  // Grade 1 Quiz
  {
    id: 'quiz-g1-1',
    title: 'Grade 1: Animals, Counting & Addition Fun',
    description: 'Check how well you can count animal safari friends and add numbers together!',
    gradeId: 'grade-1',
    subjectId: 'sub-math',
    courseId: 'course-g1-math',
    lessonId: 'les-g1-1',
    passingScore: 70,
    questions: [
      {
        id: 'q-g1-1',
        question: 'How many apples are there if you have 3 red apples and 2 green apples?',
        options: ['4 apples', '5 apples', '6 apples', '3 apples'],
        correctAnswerIndex: 1,
        explanation: '3 + 2 = 5 apples altogether!'
      },
      {
        id: 'q-g1-2',
        question: 'Which shape has 3 straight sides and 3 pointy corners?',
        options: ['Square', 'Circle', 'Triangle', 'Rectangle'],
        correctAnswerIndex: 2,
        explanation: 'A triangle always has 3 sides and 3 corners.'
      },
      {
        id: 'q-g1-3',
        question: 'What number comes right after 9 when counting?',
        options: ['8', '10', '11', '7'],
        correctAnswerIndex: 1,
        explanation: 'When counting: 8, 9, 10! The answer is 10.'
      }
    ]
  },

  // Grade 2 Quiz
  {
    id: 'quiz-g2-1',
    title: 'Grade 2: Plant Life & Animals Challenge',
    description: 'Fun questions on plant seeds, sunlight, water, and animal habitats.',
    gradeId: 'grade-2',
    subjectId: 'sub-sci',
    courseId: 'course-g2-sci',
    lessonId: 'les-g2-1',
    passingScore: 70,
    questions: [
      {
        id: 'q-g2-1',
        question: 'What do green leaves use to make their own food?',
        options: ['Candle light', 'Sunlight and water', 'Cold snow', 'Sugar water'],
        correctAnswerIndex: 1,
        explanation: 'Plants use sunlight, water, and air (carbon dioxide) to make their own food through photosynthesis.'
      },
      {
        id: 'q-g2-2',
        question: 'Which habitat is home to polar bears and arctic foxes?',
        options: ['Hot Sandy Desert', 'Icy Tundra / Arctic', 'Tropical Rainforest', 'Grassland'],
        correctAnswerIndex: 1,
        explanation: 'Polar bears have thick blubber and white fur adapted specifically for freezing arctic snow.'
      }
    ]
  },

  // Grade 3 Quiz
  {
    id: 'quiz-g3-1',
    title: 'Grade 3: Multiplication & Arrays Quiz',
    description: 'Test your understanding of equal groups, repeated addition, and multiplication arrays.',
    gradeId: 'grade-3',
    subjectId: 'sub-math',
    courseId: 'course-g3-math',
    lessonId: 'les-g3-1',
    passingScore: 75,
    questions: [
      {
        id: 'q-g3-1',
        question: 'If an egg carton has 3 rows with 4 eggs in each row, how many eggs are there in total?',
        options: ['7 eggs', '12 eggs', '14 eggs', '10 eggs'],
        correctAnswerIndex: 1,
        explanation: '3 rows of 4 = 3 x 4 = 12 eggs.'
      },
      {
        id: 'q-g3-2',
        question: 'What is 20 divided equally into 4 groups?',
        options: ['4', '5', '6', '10'],
        correctAnswerIndex: 1,
        explanation: '20 ÷ 4 = 5 because 5 x 4 = 20.'
      }
    ]
  },

  // Grade 4 Quiz
  {
    id: 'quiz-g4-1',
    title: 'Grade 4: Fractions and Geometry Quiz',
    description: 'Equivalent fractions, perimeter, and polygon properties.',
    gradeId: 'grade-4',
    subjectId: 'sub-math',
    courseId: 'course-g4-math',
    lessonId: 'les-g4-1',
    passingScore: 75,
    questions: [
      {
        id: 'q-g4-1',
        question: 'Which fraction is equivalent to 1/2?',
        options: ['2/3', '3/6', '2/5', '1/4'],
        correctAnswerIndex: 1,
        explanation: '3/6 simplifies to 1/2 because dividing both numerator and denominator by 3 yields 1/2.'
      },
      {
        id: 'q-g4-2',
        question: 'A garden is 6 meters long and 4 meters wide. What is its perimeter?',
        options: ['24 meters', '20 meters', '10 meters', '16 meters'],
        correctAnswerIndex: 1,
        explanation: 'Perimeter = 2 x (length + width) = 2 x (6 + 4) = 2 x 10 = 20 meters.'
      }
    ]
  },

  // Grade 5 Quiz
  {
    id: 'quiz-g5-1',
    title: 'Grade 5: Pre-Algebra & Order of Operations',
    description: 'Evaluate PEMDAS expressions and rectangular prism volume.',
    gradeId: 'grade-5',
    subjectId: 'sub-math',
    courseId: 'course-g5-math',
    lessonId: 'les-g5-1',
    passingScore: 75,
    questions: [
      {
        id: 'q-g5-1',
        question: 'What is the value of 5 + 3 x 4?',
        options: ['32', '17', '20', '12'],
        correctAnswerIndex: 1,
        explanation: 'According to PEMDAS, multiplication comes before addition: 3 x 4 = 12, then 5 + 12 = 17.'
      },
      {
        id: 'q-g5-2',
        question: 'What is the volume of a box measuring 4 cm by 3 cm by 5 cm?',
        options: ['12 cm³', '60 cm³', '30 cm³', '20 cm³'],
        correctAnswerIndex: 1,
        explanation: 'Volume = length x width x height = 4 x 3 x 5 = 60 cubic centimeters.'
      }
    ]
  },

  // Grade 6 Quiz
  {
    id: 'quiz-g6-1',
    title: 'Grade 6: Plate Tectonics & Astronomy',
    description: 'Assess understanding of plate boundaries, continental drift, and planetary orbits.',
    gradeId: 'grade-6',
    subjectId: 'sub-sci',
    courseId: 'course-g6-sci',
    lessonId: 'les-g6-1',
    passingScore: 75,
    questions: [
      {
        id: 'q-g6-1',
        question: 'What type of plate boundary occurs when two tectonic plates slide past each other horizontally?',
        options: ['Convergent Boundary', 'Divergent Boundary', 'Transform Boundary', 'Subduction Zone'],
        correctAnswerIndex: 2,
        explanation: 'Transform boundaries (such as the San Andreas Fault) occur when plates slide horizontally alongside each other.'
      }
    ]
  },

  // Grade 7 Quiz
  {
    id: 'quiz-g7-1',
    title: 'Grade 7: Linear Equations & Proportions',
    description: 'Two-step equation solving and unit rate analysis.',
    gradeId: 'grade-7',
    subjectId: 'sub-math',
    courseId: 'course-g7-math',
    lessonId: 'les-g7-1',
    passingScore: 75,
    questions: [
      {
        id: 'q-g7-1',
        question: 'Solve for x: 3x + 7 = 22',
        options: ['x = 3', 'x = 5', 'x = 7', 'x = 15'],
        correctAnswerIndex: 1,
        explanation: 'Subtract 7 from both sides: 3x = 15. Then divide by 3: x = 5.'
      }
    ]
  },

  // Grade 8 Quiz
  {
    id: 'quiz-g8-1',
    title: 'Grade 8: Python Logic & Variables',
    description: 'Assess Python fundamentals: variables, typing, and conditional branches.',
    gradeId: 'grade-8',
    subjectId: 'sub-cs',
    courseId: 'course-g8-cs',
    lessonId: 'les-g8-1',
    passingScore: 75,
    questions: [
      {
        id: 'q-g8-1',
        question: 'Which built-in Python function converts a string representation of digits into an integer?',
        options: ['str()', 'int()', 'float()', 'parse()'],
        correctAnswerIndex: 1,
        explanation: '`int()` parses and converts numeric string representations (e.g. `int("42")`) into actual integer values.'
      }
    ]
  },

  // Grade 9 Quiz
  {
    id: 'quiz-cs-1',
    title: 'Grade 9: Computer Science Memory & Execution',
    description: 'Test your knowledge on stack vs heap allocation, CPU instruction execution, and memory addressing.',
    gradeId: 'grade-9',
    subjectId: 'sub-cs',
    courseId: 'course-cs-101',
    lessonId: 'les-cs-1',
    passingScore: 75,
    questions: [
      {
        id: 'q-cs-1-1',
        question: 'Which region of memory is responsible for managing dynamic allocations whose lifetime is unconstrained by function scope?',
        options: [
          'Stack Memory',
          'Heap Memory',
          'CPU Register File',
          'Instruction Cache (L1)'
        ],
        correctAnswerIndex: 1,
        explanation: 'Heap memory is allocated dynamically at runtime (e.g. using `malloc` or `new`) and persists until explicitly deallocated or garbage-collected, whereas Stack memory stores fixed synchronous stack frames.'
      },
      {
        id: 'q-cs-1-2',
        question: 'What happens when a recursive function lacks a base case or exceeds the stack memory allocation limit?',
        options: [
          'Memory leak error',
          'Stack Overflow exception',
          'Heap Fragmentation crash',
          'Cache miss deadlock'
        ],
        correctAnswerIndex: 1,
        explanation: 'Each recursive call pushes a new call frame onto the Stack. Unbounded recursion fills the reserved call stack size, triggering a Stack Overflow.'
      },
      {
        id: 'q-cs-1-3',
        question: 'What is the primary role of the CPU Program Counter (PC) register?',
        options: [
          'Stores the result of the Arithmetic Logic Unit (ALU) output',
          'Holds the memory address of the next instruction to be fetched',
          'Contains the system clock multiplier index',
          'Buffers incoming RAM memory data lines'
        ],
        correctAnswerIndex: 1,
        explanation: 'The Program Counter holds the RAM byte address of the instruction about to be fetched into the CPU instruction register.'
      }
    ]
  },

  // Grade 10 Quiz
  {
    id: 'quiz-web-1',
    title: 'Grade 10: React Server Components & Full-Stack Web Architecture',
    description: 'Evaluate knowledge on React Server Components, hydration boundaries, and App Router architectures.',
    gradeId: 'grade-10',
    subjectId: 'sub-web',
    courseId: 'course-web-201',
    lessonId: 'les-web-1',
    passingScore: 80,
    questions: [
      {
        id: 'q-web-1-1',
        question: 'What is the primary architectural difference between React Server Components (RSC) and traditional SSR?',
        options: [
          'Traditional SSR only executes on Apache servers',
          'RSCs execute exclusively on the server and do not ship JavaScript bundles to the browser for client execution',
          'SSR cannot render HTML markup',
          'RSCs require WebSocket connections for every component render'
        ],
        correctAnswerIndex: 1,
        explanation: 'Unlike traditional SSR which renders HTML but still downloads full JS bundles for browser hydration, RSCs never ship their component JS to the client, drastically shrinking bundle sizes.'
      },
      {
        id: 'q-web-1-2',
        question: 'Which directive instructs the Next.js bundler that a component requires browser-side state hooks (useState, useEffect) or DOM listeners?',
        options: ['"use client"', '"use server"', '"use browser"', '"use dom"'],
        correctAnswerIndex: 0,
        explanation: '`"use client"` declares the boundary between server execution and client hydration, enabling interactive hooks.'
      }
    ]
  }
];
