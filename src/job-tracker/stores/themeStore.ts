import { create } from 'zustand';

export type ThemeName = 'beige' | 'coffee';

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  primary: string;
  bgContainer: string;
  bgPage: string;
  border: string;
  text: string;
  textSecondary: string;
  cardBg: string;
  sidebarBg: string;
  sidebarBorder: string;
  headerText: string;
  accent: string;
  fontFamily: string;
}

const themes: Record<ThemeName, ThemeConfig> = {
  beige: {
    name: 'beige',
    label: '浅米色',
    primary: '#E07A5F',
    bgContainer: '#FDF8F3',
    bgPage: '#FAF7F4',
    border: '#E8E0D5',
    text: '#3D405B',
    textSecondary: '#9B9285',
    cardBg: '#FDF8F3',
    sidebarBg: '#FAF7F4',
    sidebarBorder: '#EBE6DF',
    headerText: '#5D5348',
    accent: '#D4A574',
    fontFamily: 'Noto Serif SC, serif',
  },
  coffee: {
    name: 'coffee',
    label: '咖啡棕',
    primary: '#A67B5B',
    bgContainer: '#FAF5F0',
    bgPage: '#F5EDE5',
    border: '#D9C8B8',
    text: '#4A3728',
    textSecondary: '#9A8B7A',
    cardBg: '#FDF8F3',
    sidebarBg: '#F5EDE5',
    sidebarBorder: '#D9C8B8',
    headerText: '#6B4E3D',
    accent: '#C49A6C',
    fontFamily: 'Noto Serif SC, serif',
  },
};

interface ThemeState {
  currentTheme: ThemeName;
  themeConfig: ThemeConfig;
  setTheme: (theme: ThemeName) => void;
}

const STORAGE_KEY = 'jobtracker-theme';

const getStoredTheme = (): ThemeName => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeName;
    if (stored && themes[stored]) return stored;
  } catch {
    // ignore
  }
  return 'beige';
};

export const useThemeStore = create<ThemeState>((set) => ({
  currentTheme: getStoredTheme(),
  themeConfig: themes[getStoredTheme()],
  setTheme: (theme: ThemeName) => {
    localStorage.setItem(STORAGE_KEY, theme);
    set({ currentTheme: theme, themeConfig: themes[theme] });
  },
}));

export { themes };
