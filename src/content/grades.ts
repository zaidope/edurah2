import { Grade } from '@/types';

export const GRADES: Grade[] = [
  {
    id: 'grade-1',
    name: 'Grade 1',
    tier: 'junior',
    order: 1,
    ageRange: 'Ages 6–7',
    description: 'Foundational literacy, primary arithmetic, world curiosity, and interactive phonics.',
    color: '#38bdf8'
  },
  {
    id: 'grade-2',
    name: 'Grade 2',
    tier: 'junior',
    order: 2,
    ageRange: 'Ages 7–8',
    description: 'Addition, subtraction, reading comprehension, discovery of natural sciences and animals.',
    color: '#34d399'
  },
  {
    id: 'grade-3',
    name: 'Grade 3',
    tier: 'junior',
    order: 3,
    ageRange: 'Ages 8–9',
    description: 'Multiplication basics, reading fluency, community environments, and introductory earth science.',
    color: '#fbbf24'
  },
  {
    id: 'grade-4',
    name: 'Grade 4',
    tier: 'junior',
    order: 4,
    ageRange: 'Ages 9–10',
    description: 'Fractions, expressive creative writing, regional geography, and living ecosystems.',
    color: '#f87171'
  },
  {
    id: 'grade-5',
    name: 'Grade 5',
    tier: 'middle',
    order: 5,
    ageRange: 'Ages 10–11',
    description: 'Pre-algebraic thinking, literary analysis, physical science properties, and world cultures.',
    color: '#818cf8'
  },
  {
    id: 'grade-6',
    name: 'Grade 6',
    tier: 'middle',
    order: 6,
    ageRange: 'Ages 11–12',
    description: 'Ratios & proportions, earth systems, ancient civilisations, and introductory logic.',
    color: '#6366f1'
  },
  {
    id: 'grade-7',
    name: 'Grade 7',
    tier: 'middle',
    order: 7,
    ageRange: 'Ages 12–13',
    description: 'Linear equations, cellular biology, medieval & modern history, and structured debate.',
    color: '#06b6d4'
  },
  {
    id: 'grade-8',
    name: 'Grade 8',
    tier: 'middle',
    order: 8,
    ageRange: 'Ages 13–14',
    description: 'Algebra fundamentals, chemical reactions, physical motion, and introductory Python programming.',
    color: '#0d9488'
  },
  {
    id: 'grade-9',
    name: 'Grade 9',
    tier: 'senior',
    order: 9,
    ageRange: 'Ages 14–15',
    description: 'Coordinate geometry, classical mechanics, global economics, and algorithmic problem solving.',
    color: '#475569'
  },
  {
    id: 'grade-10',
    name: 'Grade 10',
    tier: 'senior',
    order: 10,
    ageRange: 'Ages 15–16',
    description: 'Trigonometry, advanced physics, organic chemistry, computational theory, and academic rigor.',
    color: '#1e293b'
  }
];

export function getGradeById(id: string): Grade | undefined {
  return GRADES.find(g => g.id === id);
}

export function getGradeByName(name: string): Grade | undefined {
  return GRADES.find(g => g.name.toLowerCase() === name.toLowerCase());
}

export function getGradesByTier(tier: 'junior' | 'middle' | 'senior'): Grade[] {
  return GRADES.filter(g => g.tier === tier);
}
