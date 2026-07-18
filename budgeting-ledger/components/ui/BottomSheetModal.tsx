import React, { ReactNode } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackdrop } from './AnimatedBackdrop';
import { useAnimatedSheet } from '../../hooks/useAnimatedSheet';
import { useTheme } from '../../providers/ThemeProvider';
import { useSharedStyles } from '../../theme/styles';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  sheetStyle?: StyleProp<ViewStyle>;
  onHeightChange?: (height: number) => void;
  minBottomInset?: number;
  /** Extra bottom padding on top of the safe-area inset, e.g. to clear an open keyboard. */
  extraBottomPadding?: number;
}

/**
 * Shared bottom-sheet shell: animated backdrop + slide-up sheet container.
 * Composes `shared.modal.sheet` for the base radius/maxHeight/background, so
 * callers only supply their unique content and any style overrides.
 */
export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  visible,
  onClose,
  children,
  sheetStyle,
  onHeightChange,
  minBottomInset = 16,
  extraBottomPadding = 0,
}) => {
  const { theme } = useTheme();
  const shared = useSharedStyles();
  const insets = useSafeAreaInsets();
  const { translateY, backdropOpacity, onLayout } = useAnimatedSheet(visible, onHeightChange);

  return (
    <>
      <AnimatedBackdrop opacity={backdropOpacity} visible={visible} onPress={onClose} />

      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[
          shared.modal.sheet,
          styles.sheet,
          {
            backgroundColor: theme.colors.surfaceContainerLow,
            paddingBottom: Math.max(insets.bottom, minBottomInset) + 16 + extraBottomPadding,
            transform: [{ translateY }],
          },
          sheetStyle,
        ]}
        onLayout={onLayout}
      >
        {children}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 11,
  },
});
