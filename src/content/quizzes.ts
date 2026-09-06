import { Quiz } from '@/types';

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'quiz-cs-1',
    title: 'Computer Science Memory & Execution Quiz',
    description: 'Test your knowledge on stack vs heap allocation, CPU instruction execution, and memory addressing.',
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
      },
      {
        id: 'q-cs-1-4',
        question: 'Why are CPU L1/L2 cache accesses significantly faster than fetching data directly from main RAM?',
        options: [
          'Caches are physically integrated directly on the CPU die with high-speed SRAM circuitry',
          'Main RAM requires optic fiber bus lines',
          'RAM stores data in virtual hexadecimal strings',
          'Cache memory bypasses binary encoding'
        ],
        correctAnswerIndex: 0,
        explanation: 'CPU caches use Static RAM (SRAM) fabricated directly on the processor silicon chip, operating at CPU clock frequencies compared to external DRAM.'
      }
    ]
  },
  {
    id: 'quiz-cs-2',
    title: 'Big-O & Algorithmic Complexity Quiz',
    description: 'Verify your proficiency in asymptotic analysis, worst-case time complexity, and space trade-offs.',
    subjectId: 'sub-cs',
    courseId: 'course-cs-101',
    lessonId: 'les-cs-2',
    passingScore: 75,
    questions: [
      {
        id: 'q-cs-2-1',
        question: 'What is the worst-case time complexity of accessing an element by index in a contiguous array?',
        options: [
          'O(n)',
          'O(log n)',
          'O(1)',
          'O(n²)'
        ],
        correctAnswerIndex: 2,
        explanation: 'Array access by index uses constant-time offset arithmetic: `Address = BaseAddress + (Index * ElementSize)`, achieving O(1) time.'
      },
      {
        id: 'q-cs-2-2',
        question: 'If an algorithm divides the problem size by half in every step (such as Binary Search), what is its asymptotic time complexity?',
        options: [
          'O(n)',
          'O(n log n)',
          'O(log n)',
          'O(2^n)'
        ],
        correctAnswerIndex: 2,
        explanation: 'Repeatedly halving the search space of n elements takes log₂(n) steps, yielding logarithmic time complexity O(log n).'
      },
      {
        id: 'q-cs-2-3',
        question: 'Which of the following complexity classes grows fastest as n increases to infinity?',
        options: [
          'O(n log n)',
          'O(n²)',
          'O(2ⁿ)',
          'O(n³)'
        ],
        correctAnswerIndex: 2,
        explanation: 'Exponential complexity O(2ⁿ) dominates polynomial complexities like O(n²) or O(n³) for large values of n.'
      }
    ]
  },
  {
    id: 'quiz-web-1',
    title: 'React Server Components & Next.js App Router Quiz',
    description: 'Evaluate your grasp of Server Component boundaries, hydration cost, and App Router layout paradigms.',
    subjectId: 'sub-web',
    courseId: 'course-web-201',
    lessonId: 'les-web-1',
    passingScore: 70,
    questions: [
      {
        id: 'q-web-1-1',
        question: 'By default in the Next.js App Router, components created inside the `app/` directory are:',
        options: [
          'Client Components',
          'Server Components',
          'Single Page Application routes',
          'Web Components'
        ],
        correctAnswerIndex: 1,
        explanation: 'In the Next.js App Router, all components inside the `app/` directory are Server Components by default unless explicitly tagged with `"use client"`.`'
      },
      {
        id: 'q-web-1-2',
        question: 'Which hook or directive allows client-side interactivity like `useState` or `useEffect` inside a file?',
        options: [
          'The `"use client"` directive at the top of the file',
          '`import { client } from "next/server"`',
          '`export const revalidate = 0`',
          '`"use server"`'
        ],
        correctAnswerIndex: 0,
        explanation: 'Declaring `"use client"` at the very top of a component file establishes a boundary that sends JavaScript to the browser for client hydration.'
      },
      {
        id: 'q-web-1-3',
        question: 'What is the chief advantage of React Server Components over traditional client-side rendering?',
        options: [
          'Direct access to server databases and secrets with zero added JavaScript bundle sent to the client',
          'RSC converts all React JSX into Web Assembly binary files',
          'RSC eliminates CSS stylesheet loading',
          'RSC disables HTML parsing in browsers'
        ],
        correctAnswerIndex: 0,
        explanation: 'RSC code executes exclusively on the server, allowing direct database access and zero JS payload for server-rendered code.'
      }
    ]
  }
];
