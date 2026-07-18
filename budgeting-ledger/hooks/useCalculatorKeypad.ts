import { useState } from 'react';

export interface UseCalculatorKeypadResult<T> {
  visible: boolean;
  target: T | null;
  height: number;
  open: (target?: T) => void;
  close: () => void;
  onHeightChange: (height: number) => void;
}

/**
 * Calculator keypad open/close/height/target bookkeeping shared across
 * screens that embed `CalculatorKeypad`. `T` is the shape of "what the
 * calculator is currently editing" — void for a single amount field (add.tsx),
 * an index or union for a row in a list (bill-splitter.tsx, budgets.tsx).
 * Screens own the actual confirm/parse logic, since that differs per screen.
 */
export function useCalculatorKeypad<T = void>(
  initialVisible: boolean = false,
  initialTarget: T | null = null
): UseCalculatorKeypadResult<T> {
  const [visible, setVisible] = useState(initialVisible);
  const [target, setTarget] = useState<T | null>(initialTarget);
  const [height, setHeight] = useState(0);

  const open = (nextTarget?: T) => {
    if (nextTarget !== undefined) {
      setTarget(nextTarget);
    }
    setVisible(true);
  };

  const close = () => setVisible(false);

  return { visible, target, height, open, close, onHeightChange: setHeight };
}
