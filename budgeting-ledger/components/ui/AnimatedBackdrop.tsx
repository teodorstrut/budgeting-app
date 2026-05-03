import React from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { useSharedStyles } from '../../theme/styles';

interface AnimatedBackdropProps {
  opacity: Animated.Value;
  visible: boolean;
  onPress: () => void;
  zIndex?: number;
}

export const AnimatedBackdrop: React.FC<AnimatedBackdropProps> = ({
  opacity,
  visible,
  onPress,
  zIndex = 10,
}) => {
  const shared = useSharedStyles();

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        shared.modal.backdrop,
        styles.backdrop,
        { opacity, zIndex },
      ]}
    >
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onPress} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
