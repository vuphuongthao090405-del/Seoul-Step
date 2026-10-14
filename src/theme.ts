export interface ThemeConfig {
  id: string;
  name: Record<'vi' | 'ko' | 'en', string>;
  dotColor: string;
  bgPage: string;
  cardBg: string;
  cardBorder: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  textPrimary: string;
  accentBadge: string;
  accentRing: string;
}

// Brand Identity: Navy + White + Gray (Thương hiệu chuẩn mực: Navy, Trắng, Xám Slate)
export const NAVY_THEME: ThemeConfig = {
  id: 'navy',
  name: { vi: 'Navy & Trắng & Xám', ko: '네이비 & 화이트 & 그레이', en: 'Navy & White & Slate' },
  dotColor: '#0f172a', // Navy slate-900
  bgPage: 'bg-[#f8fafc]',
  cardBg: 'bg-white',
  cardBorder: 'border-slate-200',
  primary: 'bg-[#0f172a] text-white',
  primaryHover: 'hover:bg-[#1e293b]',
  primaryLight: 'bg-slate-100 text-slate-900 border-slate-300',
  textPrimary: 'text-slate-900',
  accentBadge: 'bg-slate-100 text-slate-800 border-slate-200',
  accentRing: 'focus:ring-slate-400',
};

export const PASTEL_THEMES: Record<string, ThemeConfig> = {
  navy: NAVY_THEME,
  blue: NAVY_THEME,
  gray: NAVY_THEME,
  white: NAVY_THEME,
  yellow: NAVY_THEME,
  purple: NAVY_THEME,
  pink: NAVY_THEME,
  green: NAVY_THEME,
};
