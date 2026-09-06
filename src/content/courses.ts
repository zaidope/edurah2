import { Course } from '@/types';

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-cs-101',
    title: 'Computer Science & Algorithm Essentials',
    slug: 'cs-algorithm-essentials',
    subjectId: 'sub-cs',
    subjectName: 'Computer Science',
    shortDescription: 'Master fundamental data structures, asymptotic notation, sorting algorithms, and complexity theory.',
    description: 'An authoritative introduction to computer science foundations. Learn how software executes at the hardware boundary, understand Big-O computational limits, and master key data structures like dynamic arrays, trees, graphs, and hash tables.',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    level: 'Beginner',
    duration: '3h 45m',
    lessonCount: 6,
    rating: 4.9,
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
            videoId: 'zOjov-2OZ0E', // Real Computer Science tutorial
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
            resources: [
              {
                id: 'res-cs-1',
                title: 'Memory Architecture Cheat Sheet (PDF)',
                type: 'pdf',
                url: '#',
                size: '2.4 MB'
              },
              {
                id: 'res-cs-2',
                title: 'C Memory Simulator Sample Code',
                type: 'code',
                url: '#',
                size: '18 KB'
              }
            ]
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
            quizId: 'quiz-cs-2',
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
            resources: [
              {
                id: 'res-cs-3',
                title: 'Big-O Cheat Sheet & Comparison Chart',
                type: 'pdf',
                url: '#',
                size: '1.8 MB'
              }
            ]
          }
        ]
      },
      {
        id: 'chap-101-2',
        title: 'Module 2: Essential Data Structures',
        description: 'Implementing arrays, linked lists, hash tables, and binary search trees.',
        order: 2,
        lessons: [
          {
            id: 'les-cs-3',
            title: 'Arrays vs Linked Lists: Trade-offs & Cache Locality',
            slug: 'arrays-vs-linked-lists',
            description: 'Explore physical contiguous memory vs pointer reference nodes, spatial cache locality, and indexing performance.',
            duration: '20:05',
            videoId: 'WwfhLC16bis',
            videoUrl: 'https://www.youtube.com/watch?v=WwfhLC16bis',
            chapterId: 'chap-101-2',
            order: 1,
            learningObjectives: [
              'Understand CPU cache line prefetching and contiguous array memory benefits',
              'Implement singly and doubly linked list pointer updates safely',
              'Choose between O(1) array index lookup vs O(1) linked list insert operations'
            ],
            keyConcepts: [
              {
                title: 'Spatial Locality',
                detail: 'CPUs fetch contiguous memory blocks into L1/L2 cache lines, making array iterations significantly faster than pointer traversal.'
              }
            ],
            resources: []
          },
          {
            id: 'les-cs-4',
            title: 'Hash Tables & Collision Resolution Strategies',
            slug: 'hash-tables-and-collisions',
            description: 'Master hash functions, load factors, separate chaining, open addressing, and constant-time key lookups.',
            duration: '25:50',
            videoId: 'shs0KM3w0zs',
            videoUrl: 'https://www.youtube.com/watch?v=shs0KM3w0zs',
            chapterId: 'chap-101-2',
            order: 2,
            learningObjectives: [
              'Design uniform distribution hash functions minimizing collisions',
              'Compare separate chaining vs linear probing performance under high load factors'
            ],
            keyConcepts: [
              {
                title: 'Load Factor',
                detail: 'The ratio of entries to bucket slots; exceeding 0.75 triggers array resizing to maintain O(1) performance.'
              }
            ],
            resources: []
          }
        ]
      }
    ]
  },

  {
    id: 'course-web-201',
    title: 'Full-Stack Next.js 15 & React Architecture',
    slug: 'nextjs-react-architecture',
    subjectId: 'sub-web',
    subjectName: 'Modern Web Development',
    shortDescription: 'Build modern server-side rendered apps with React Server Components, App Router, and TypeScript.',
    description: 'Step into modern full-stack web architecture. Master React Server Components (RSC), hydration boundaries, Server Actions, edge routing, state management, and production UI component design.',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    level: 'Intermediate',
    duration: '4h 15m',
    lessonCount: 8,
    rating: 4.95,
    studentsEnrolled: 5120,
    featured: true,
    updatedAt: '2026-08-28',
    instructor: {
      name: 'Marcus Vance',
      role: 'Staff Frontend Architect',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      bio: 'Leading UI architecture consultant and author of scalable React systems.'
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
            resources: [
              {
                id: 'res-web-1',
                title: 'RSC Architecture Diagram (PDF)',
                type: 'pdf',
                url: '#',
                size: '1.2 MB'
              }
            ]
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
  },

  {
    id: 'course-ai-301',
    title: 'Neural Networks & Deep Learning Essentials',
    slug: 'neural-networks-deep-learning',
    subjectId: 'sub-ai',
    subjectName: 'Artificial Intelligence & ML',
    shortDescription: 'Build neural networks from mathematical equations up to PyTorch backpropagation models.',
    description: 'Understand the mathematical foundations of artificial neural networks. Calculate gradient descent vectors, derive forward and backpropagation matrix calculations, and train deep models.',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
    level: 'Advanced',
    duration: '5h 10m',
    lessonCount: 10,
    rating: 4.88,
    studentsEnrolled: 2890,
    featured: true,
    updatedAt: '2026-08-20',
    instructor: {
      name: 'Dr. Aris Thorne',
      role: 'Head of AI Research',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      bio: 'AI Specialist researching multi-modal transformer architectures and gradient optimization.'
    },
    chapters: [
      {
        id: 'chap-ai-1',
        title: 'Module 1: Perceptrons & Forward Propagation',
        description: 'Mathematical intuition behind biological vs artificial neurons.',
        order: 1,
        lessons: [
          {
            id: 'les-ai-1',
            title: 'The Mathematics of Perceptrons & Activation Functions',
            slug: 'math-of-perceptrons',
            description: 'Linear weights, biases, ReLU, Sigmoid, and GELU non-linearities explained with matrix operations.',
            duration: '26:45',
            videoId: 'aircAruvnKk',
            videoUrl: 'https://www.youtube.com/watch?v=aircAruvnKk',
            chapterId: 'chap-ai-1',
            order: 1,
            learningObjectives: [
              'Calculate dot products of input vectors and weight matrices',
              'Select optimal activation functions (ReLU, Sigmoid, Softmax) for neural layers',
              'Understand why non-linearity enables neural networks to approximate universal functions'
            ],
            keyConcepts: [
              {
                title: 'Activation Function',
                detail: 'Applies non-linear transformations to dot product scalar values, allowing networks to model non-linear data distributions.'
              }
            ],
            resources: []
          }
        ]
      }
    ]
  },

  {
    id: 'course-math-102',
    title: 'Linear Algebra for Engineers & Data Scientists',
    slug: 'linear-algebra-for-engineers',
    subjectId: 'sub-math',
    subjectName: 'Mathematics & Logic',
    shortDescription: 'Vector spaces, matrix transformations, eigenvalues, and singular value decomposition.',
    description: 'Develop intuitive visual understanding of high-dimensional vector spaces, dot products, cross products, linear transformations, matrix inverses, and Eigen decomposition.',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
    level: 'Beginner',
    duration: '3h 30m',
    lessonCount: 6,
    rating: 4.92,
    studentsEnrolled: 1950,
    featured: false,
    updatedAt: '2026-07-19',
    instructor: {
      name: 'Prof. Sarah Jenkins',
      role: 'Mathematics Chair',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      bio: 'Award-winning professor focusing on applied linear algebra and visual mathematical intuition.'
    },
    chapters: [
      {
        id: 'chap-math-1',
        title: 'Module 1: Vectors & Linear Transformations',
        description: 'Geometric interpretation of matrices as space transformations.',
        order: 1,
        lessons: [
          {
            id: 'les-math-1',
            title: 'Vectors: Linear Combinations, Span, and Basis Vectors',
            slug: 'vectors-span-basis',
            description: 'Visualize 2D and 3D vectors, basis transformations, linear dependence, and span boundaries.',
            duration: '19:15',
            videoId: 'k7RM-ot2NWY',
            videoUrl: 'https://www.youtube.com/watch?v=k7RM-ot2NWY',
            chapterId: 'chap-math-1',
            order: 1,
            learningObjectives: [
              'Understand basis vectors (i-hat, j-hat) and vector span',
              'Determine linear dependence and independence across vector sets'
            ],
            keyConcepts: [
              {
                title: 'Vector Span',
                detail: 'The set of all possible linear combinations achievable by scaling and adding a set of vectors.'
              }
            ],
            resources: []
          }
        ]
      }
    ]
  }
];
