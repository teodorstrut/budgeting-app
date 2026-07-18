import { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent } from 'react-native';

interface UseAnimatedSheetResult {
  translateY: Animated.Value;
  backdropOpacity: Animated.Value;
  onLayout: (event: LayoutChangeEvent) => void;
}

/**
 * Shared bottom-sheet slide/backdrop-fade animation used by every animated
 * modal in the app (280ms parallel slide-up + fade). Keeps the hidden resting
 * position in sync with the sheet's measured height on every layout while
 * closed, so a modal instance reused for differently-sized content (e.g.
 * switching category lists) never leaves the sheet partially visible above
 * the screen bottom.
 */
export function useAnimatedSheet(
  visible: boolean,
  onHeightChange?: (height: number) => void
): UseAnimatedSheetResult {
  const [translateY] = useState(() => new Animated.Value(visible ? 0 : 600));
  const [backdropOpacity] = useState(() => new Animated.Value(visible ? 1 : 0));
  const heightRef = useRef(0);
  const hasLaidOut = useRef(false);

  useEffect(() => {
    if (!hasLaidOut.current) return;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: visible ? 0 : heightRef.current,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const onLayout = (event: LayoutChangeEvent) => {
    const h = event.nativeEvent.layout.height;
    heightRef.current = h;
    hasLaidOut.current = true;
    onHeightChange?.(h);
    if (!visible) {
      translateY.setValue(h);
      backdropOpacity.setValue(0);
    }
  };

  return { translateY, backdropOpacity, onLayout };
}
