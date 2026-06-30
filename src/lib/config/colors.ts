export const COLORS = {
  red: '#f44336',
  pink: '#e91e63',
  purple: '#9c27b0',
  'deep purple': '#673ab7',
  indigo: '#3f51b5',
  blue: '#2196f3',
  'light blue': '#03a9f4',
  cyan: '#00bcd4',
  teal: '#009688',
  green: '#4caf50',
  'light green': '#8bc34a',
  lime: '#cddc39',
  yellow: '#ffc107',
  amber: '#ff9800',
  orange: '#ff5722',
  brown: '#795548',
  gray: '#9e9e9e',
  'blue gray': '#607d8b',
} as const

export type ColorName = keyof typeof COLORS
export const COLOR_NAMES = Object.keys(COLORS) as ColorName[]

export function isPresetColor(hex: string): boolean {
  return Object.values(COLORS).includes(hex as (typeof COLORS)[ColorName])
}
