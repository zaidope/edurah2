import { Subject } from '@/types';

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub-cs',
    name: 'Computer Science',
    slug: 'computer-science',
    description: 'Master core computing principles, algorithms, data structures, and software architecture designed for modern engineering.',
    shortDescription: 'Algorithms, data structures, and core computing foundations.',
    icon: 'Code2',
    color: 'from-blue-600 to-indigo-600',
    category: 'Engineering',
    courseCount: 4,
    lessonCount: 36,
    featured: true,
    bannerImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sub-ai',
    name: 'Artificial Intelligence & ML',
    slug: 'artificial-intelligence',
    description: 'Explore neural networks, machine learning algorithms, natural language processing, and modern LLM application building.',
    shortDescription: 'Deep learning, neural networks, LLMs, and predictive models.',
    icon: 'BrainCircuit',
    color: 'from-purple-600 to-pink-600',
    category: 'Data & AI',
    courseCount: 3,
    lessonCount: 28,
    featured: true,
    bannerImage: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sub-web',
    name: 'Modern Web Development',
    slug: 'web-development',
    description: 'Build full-stack web applications using React, Next.js, TypeScript, Tailwind CSS, and scalable server architecture.',
    shortDescription: 'Full-stack React, Next.js, APIs, and modern frontend tools.',
    icon: 'Globe',
    color: 'from-cyan-500 to-blue-600',
    category: 'Development',
    courseCount: 5,
    lessonCount: 42,
    featured: true,
    bannerImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sub-math',
    name: 'Mathematics & Logic',
    slug: 'mathematics',
    description: 'Develop rigorous analytical problem-solving skills through linear algebra, calculus, discrete math, and probability.',
    shortDescription: 'Linear algebra, calculus, probability, and discrete logic.',
    icon: 'Binary',
    color: 'from-emerald-500 to-teal-600',
    category: 'Sciences',
    courseCount: 3,
    lessonCount: 24,
    featured: true,
    bannerImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sub-design',
    name: 'UX & Product Design',
    slug: 'ux-design',
    description: 'Learn modern UI/UX design, visual systems, design tokens, responsive layouts, and user research methodologies.',
    shortDescription: 'Design systems, visual hierarchy, Figma, and UX patterns.',
    icon: 'Palette',
    color: 'from-amber-500 to-rose-600',
    category: 'Design',
    courseCount: 2,
    lessonCount: 18,
    featured: false,
    bannerImage: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sub-ds',
    name: 'Data Engineering & Analytics',
    slug: 'data-engineering',
    description: 'Design data pipelines, SQL databases, distributed computing models, and business intelligence dashboards.',
    shortDescription: 'SQL, ETL pipelines, analytics, and big data architectures.',
    icon: 'Database',
    color: 'from-violet-600 to-indigo-700',
    category: 'Data & AI',
    courseCount: 2,
    lessonCount: 20,
    featured: false,
    bannerImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
  }
];
