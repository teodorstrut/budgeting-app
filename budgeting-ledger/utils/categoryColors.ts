const ACCENT_COLORS = ['#4fd1c5', '#ffb866', '#ffa2c5', '#5adace'];
const CONTAINER_BG_COLORS = ['#4fd1c528', '#ffb86628', '#ffa2c528', '#5adace28'];

export const getCategoryAccentColor = (index: number): string =>
  ACCENT_COLORS[index % ACCENT_COLORS.length];

export const getCategoryAccentBg = (index: number): string =>
  CONTAINER_BG_COLORS[index % CONTAINER_BG_COLORS.length];
