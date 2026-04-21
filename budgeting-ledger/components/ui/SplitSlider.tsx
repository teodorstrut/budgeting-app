import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

export interface SplitSliderProps {
  percentage: number;
  maximumValue: number;
  trackColor: string;
  surfaceColor: string;
  onValueChange: (v: number) => void;
}

/**
 * Isolated slider that keeps its own local value during drag so that
 * sibling sliders updating parent state don't reset this thumb position.
 */
export const SplitSlider = React.memo(
  ({ percentage, maximumValue, trackColor, surfaceColor, onValueChange }: SplitSliderProps) => {
    const [localVal, setLocalVal] = useState(percentage);
    const dragging = useRef(false);

    // Sync from parent only when the user is not actively dragging this slider
    useEffect(() => {
      if (!dragging.current) {
        setLocalVal(percentage);
      }
    }, [percentage]);

    return (
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={Math.max(maximumValue, localVal)}
        value={localVal}
        onSlidingStart={() => {
          dragging.current = true;
        }}
        onValueChange={(v: number) => {
          setLocalVal(v);
          onValueChange(v);
        }}
        onSlidingComplete={() => {
          dragging.current = false;
        }}
        minimumTrackTintColor={trackColor}
        maximumTrackTintColor={surfaceColor}
        thumbTintColor={trackColor}
      />
    );
  },
  (prev, next) =>
    prev.percentage === next.percentage &&
    prev.maximumValue === next.maximumValue &&
    prev.trackColor === next.trackColor &&
    prev.surfaceColor === next.surfaceColor &&
    prev.onValueChange === next.onValueChange,
);

const styles = StyleSheet.create({
  slider: { width: '100%', height: 36 },
});
