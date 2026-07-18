import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router/react-navigation';
import { settingsService } from '../services/settingsService';
import { monthUtils } from '../utils/monthUtils';
import { formatMonthLabel } from '../utils/formatting';

const anchorFromPeriodStart = (startStr: string): Date => {
  const [y, m] = startStr.split('-').map(Number);
  return new Date(y, m - 1, 1);
};

const dateInMonth = (anchorMonth: Date): string => {
  const y = anchorMonth.getFullYear();
  const m = String(anchorMonth.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-15`;
};

export interface UseMonthAnchorResult {
  anchorMonth: Date;
  monthStartDay: number;
  periodStart: string;
  periodEnd: string;
  monthLabel: string;
  moveMonth: (direction: -1 | 1) => void;
  focusTick: number;
}

/**
 * Navigable billing-period state: tracks an anchor month the user can step
 * forward/back through, re-aligning to the current period on every screen
 * focus unless the user has manually navigated away. For screens that only
 * need the current period with no prev/next navigation, see
 * `useCurrentMonthPeriod`.
 */
export function useMonthAnchor(): UseMonthAnchorResult {
  const hasManuallyNavigated = useRef(false);
  const [monthStartDay, setMonthStartDay] = useState(() => settingsService.getMonthStartDay());
  const [anchorMonth, setAnchorMonth] = useState<Date>(() =>
    anchorFromPeriodStart(monthUtils.getCurrentMonthStart(settingsService.getMonthStartDay()))
  );
  const [focusTick, setFocusTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const day = settingsService.getMonthStartDay();
      setMonthStartDay(day);
      if (!hasManuallyNavigated.current) {
        setAnchorMonth(anchorFromPeriodStart(monthUtils.getCurrentMonthStart(day)));
      }
      setFocusTick((current) => current + 1);
    }, [])
  );

  const { periodStart, periodEnd, monthLabel } = useMemo(() => {
    const [start, end] = monthUtils.getMonthPeriodForDate(monthStartDay, dateInMonth(anchorMonth));
    return { periodStart: start, periodEnd: end, monthLabel: formatMonthLabel(start) };
  }, [anchorMonth, monthStartDay]);

  const moveMonth = (direction: -1 | 1) => {
    hasManuallyNavigated.current = true;
    setAnchorMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  return { anchorMonth, monthStartDay, periodStart, periodEnd, monthLabel, moveMonth, focusTick };
}
