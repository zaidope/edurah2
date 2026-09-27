import { GradeTier } from '@/types';
import { getGradeById } from '@/content/grades';

export interface GradeThemeConfig {
  tier: GradeTier;
  gradeLabel: string;
  themeTitle: string;
  themeSubtitle: string;
  cardRadius: string;
  cardSurface: string;
  heroSurface: string;
  accentBadge: string;
  tierTag: string;
  accentText: string;
  isDark: boolean;
}

export const THEME_CONFIGS: Record<GradeTier, GradeThemeConfig> = {
  junior: {
    tier: 'junior',
    gradeLabel: 'Primary Tier (Grades 1–4)',
    themeTitle: 'Primary Learning World',
    themeSubtitle: 'Foundational arithmetic, natural science exploration, and creative language.',
    cardRadius: 'rounded-xl',
    cardSurface: 'bg-[#ffffff] border border-[#d8d0c2]',
    heroSurface: 'bg-gradient-to-br from-[#faf4e6] via-[#f5e7ce] to-[#ebd2b3] text-[#171819] border border-[#d8a471]/50 shadow-sm',
    accentBadge: 'bg-[#f3e5d4] text-[#81512f] border border-[#d8a471]/40',
    tierTag: 'Primary Exploration · Grades 1–4',
    accentText: 'text-[#81512f]',
    isDark: false,
  },
  middle: {
    tier: 'middle',
    gradeLabel: 'Middle School (Grades 5–8)',
    themeTitle: 'Middle School Academic Core',
    themeSubtitle: 'Algebraic reasoning, earth and planetary sciences, and introductory computing.',
    cardRadius: 'rounded-lg',
    cardSurface: 'bg-[#ffffff] border border-[#d8d0c2]',
    heroSurface: 'bg-gradient-to-br from-[#1b2729] via-[#152124] to-[#0f1718] text-[#e9e4d7] border border-[#d8a471]/30 shadow-md',
    accentBadge: 'bg-[#1e2e30] text-[#e6b981] border border-[#d8a471]/30',
    tierTag: 'Middle School Scholar · Grades 5–8',
    accentText: 'text-[#81512f]',
    isDark: false,
  },
  senior: {
    tier: 'senior',
    gradeLabel: 'High School Preparatory (Grades 9–10)',
    themeTitle: 'Senior Academy & Rigor',
    themeSubtitle: 'Advanced algorithmic theory, coordinate geometry, mechanics, and computational depth.',
    cardRadius: 'rounded-md',
    cardSurface: 'bg-[#101719] border border-[#d8a471]/25 text-[#e9e4d7]',
    heroSurface: 'bg-gradient-to-r from-[#0b0d0e] via-[#101719] to-[#152125] text-[#ede7db] border border-[#d8a471]/40 shadow-xl',
    accentBadge: 'bg-[#172022] text-[#dca66c] border border-[#d8a471]/40',
    tierTag: 'Senior Academy · Grades 9–10',
    accentText: 'text-[#e6b981]',
    isDark: true,
  },
};

export function getThemeForGrade(gradeId?: string): GradeThemeConfig {
  if (!gradeId) return THEME_CONFIGS.middle;

  const grade = getGradeById(gradeId);
  if (grade) {
    return THEME_CONFIGS[grade.tier];
  }

  // Fallback check based on numeric grade ID
  const num = parseInt(gradeId.replace(/[^0-9]/g, ''), 10);
  if (!isNaN(num)) {
    if (num <= 4) return THEME_CONFIGS.junior;
    if (num <= 8) return THEME_CONFIGS.middle;
    return THEME_CONFIGS.senior;
  }

  return THEME_CONFIGS.middle;
}
