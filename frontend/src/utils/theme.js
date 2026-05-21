export const colors = {
  primary: '#2E7D32',
  secondary: '#4CAF50',
  lightGreen: '#A5D6A7',
  background: '#F9FBF9',
  white: '#FFFFFF',
  black: '#000000',
  card: '#FFFFFF',
  text: '#1B2D1B',
  textLight: '#5A7A5A',
  textSecondary: '#5A7A5A',
  border: '#DDE8DD',
  warning: '#FF8F00',
  danger: '#C62828',
  error: '#C62828',
  success: '#43A047',
  gray: '#9E9E9E',
};

export const COLORS = colors;

export const sizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
};

export const SIZES = sizes;

export const shadow = {
  elevation: 4,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
};

export const SHADOW = shadow;

const theme = {
  colors,
  COLORS: colors,
  sizes,
  SIZES: sizes,
  shadow,
  SHADOW: shadow,
};

export default theme;