import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useSharedStyles } from '../../theme/styles';

interface ProgressBarProps {
  /** Progress from 0 to 1 */
  progress: number;
  height?: number;
  color: string;
  trackColor: string;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color,
  trackColor,
  style,
}) => {
  const shared = useSharedStyles();
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View
      style={[
        shared.progress.track,
        { height, backgroundColor: trackColor },
        style,
      ]}
    >
      <View
        style={[
          shared.progress.fill,
          {
            backgroundColor: color,
            width: `${clampedProgress * 100}%`,
          },
        ]}
      />
    </View>
  );
};
