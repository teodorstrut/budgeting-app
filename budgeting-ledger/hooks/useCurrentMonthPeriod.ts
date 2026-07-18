import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router/react-navigation';
import { settingsService } from '../services/settingsService';
import { monthUtils } from '../utils/monthUtils';

export interface UseCurrentMonthPeriodResult {
  monthStartDay: number;
  periodStart: string;
  periodEnd: string;
  focusTick: number;
}

/**
 * Current billing-period bounds, refreshed on every screen focus — for
 * screens that only need the current period with no prev/next navigation.
 * See `useMonthAnchor` for the navigable variant.
 */
export function useCurrentMonthPeriod(): UseCurrentMonthPeriodResult {
  const [monthStartDay, setMonthStartDay] = useState(() => settingsService.getMonthStartDay());
  const [periodStart, setPeriodStart] = useState(() => monthUtils.getCurrentMonthStart(monthStartDay));
  const [periodEnd, setPeriodEnd] = useState(() => monthUtils.getCurrentMonthEnd(monthStartDay));
  const [focusTick, setFocusTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const day = settingsService.getMonthStartDay();
      setMonthStartDay(day);
      setPeriodStart(monthUtils.getCurrentMonthStart(day));
      setPeriodEnd(monthUtils.getCurrentMonthEnd(day));
      setFocusTick((current) => current + 1);
    }, [])
  );

  return { monthStartDay, periodStart, periodEnd, focusTick };
}
