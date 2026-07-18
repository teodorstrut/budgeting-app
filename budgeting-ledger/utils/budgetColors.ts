/**
 * Returns the bar/text color for a budget-usage ratio: red when over budget,
 * the theme's secondary color when near the limit, primary otherwise.
 */
export const getBudgetRatioColor = (ratio: number, primary: string, secondary: string): string => {
  if (ratio >= 1) return '#ef4444';
  if (ratio >= 0.8) return secondary;
  return primary;
};
