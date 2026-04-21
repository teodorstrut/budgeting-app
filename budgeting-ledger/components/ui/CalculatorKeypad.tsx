import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../providers/ThemeProvider';

interface CalculatorKeypadProps {
  visible: boolean;
  initialValue: string;
  onConfirm: (value: string) => void;
  onDismiss: () => void;
  onHeightChange?: (height: number) => void;
}

const fmt = (n: number): string => (n % 1 === 0 ? String(n) : n.toFixed(2));

export const CalculatorKeypad: React.FC<CalculatorKeypadProps> = ({
  visible,
  initialValue,
  onConfirm,
  onDismiss,
  onHeightChange,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const onSurface = theme.colors.onSurface ?? theme.colors.onSurfaceVariant;

  // Current number being typed
  const [input, setInput] = useState(initialValue || '');
  // Secondary tape line showing accumulated expression (e.g. "250 +")
  const [tape, setTape] = useState('');
  // Accumulated running value from previous steps
  const [runningVal, setRunningVal] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<'+' | '-' | null>(null);
  // Resets input on the very first digit/dot key after the calculator opens
  const isFirstInputRef = useRef(true);

  // Slide animation — start at the initial visibility state to avoid a flash
  const translateY = useRef(new Animated.Value(visible ? 0 : 600)).current;
  const backdropOpacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const heightRef = useRef(0);
  const hasLaidOut = useRef(false);

  useEffect(() => {
    if (visible) {
      setInput(initialValue || '');
      setTape('');
      setRunningVal(null);
      setPendingOp(null);
      isFirstInputRef.current = true;
    }
  }, [visible, initialValue]);

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
  }, [visible]);

  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const handleKey = (key: string) => {
    haptic();

    if (key === 'backspace') {
      isFirstInputRef.current = false;
      setInput((prev) => prev.slice(0, -1));
      return;
    }

    if (key === 'done') {
      let result: number;
      if (runningVal !== null && pendingOp !== null && input !== '') {
        const inputVal = parseFloat(input);
        result = pendingOp === '+' ? runningVal + inputVal : runningVal - inputVal;
      } else if (runningVal !== null) {
        result = runningVal;
      } else {
        result = parseFloat(input) || 0;
      }
      onConfirm(fmt(result));
      return;
    }

    if (key === '+' || key === '-') {
      // No new input typed yet — just swap the pending operator
      if (input === '' && pendingOp !== null) {
        setPendingOp(key);
        setTape((prev) => prev.trimEnd().slice(0, -1) + key);
        return;
      }

      const inputVal = input !== '' ? parseFloat(input) : 0;
      isFirstInputRef.current = false;

      if (runningVal === null) {
        // First operator press
        setRunningVal(inputVal);
        setPendingOp(key);
        setTape(`${fmt(inputVal)} ${key}`);
        setInput('');
      } else {
        // Subsequent operator press — evaluate previous step, show result in tape
        const newVal = pendingOp === '+' ? runningVal + inputVal : runningVal - inputVal;
        setRunningVal(newVal);
        setPendingOp(key);
        setTape(`${fmt(newVal)} ${key}`);
        setInput('');
      }
      return;
    }

    // Digit or dot
    if (key === '.') {
      if (input.includes('.')) return;
    }

    if (isFirstInputRef.current) {
      isFirstInputRef.current = false;
      setInput(key);
      return;
    }

    if (input.length >= 14) return;
    setInput((prev) => prev + key);
  };

  const keyStyle = (flex = 1) => [
    styles.key,
    { backgroundColor: theme.colors.surfaceContainerHigh, flex },
  ];

  return (
    <>
      {/* Backdrop — fades in/out, dismisses on tap */}
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onDismiss} />
      </Animated.View>

      {/* Keypad sheet — slides up from bottom */}
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colors.surfaceContainerLow,
            paddingBottom: Math.max(insets.bottom, 32) + 16,
            transform: [{ translateY }],
          },
        ]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          heightRef.current = h;
          onHeightChange?.(h);
          if (!hasLaidOut.current) {
            hasLaidOut.current = true;
            // Snap to correct off-screen position after first measurement
            if (!visible) {
              translateY.setValue(h);
            }
          }
        }}
      >
        {/* Tape: accumulated expression above the main number */}
        <Text
          style={[styles.tapeValue, { color: theme.colors.onSurfaceVariant }]}
          numberOfLines={1}
        >
          {tape}
        </Text>

        {/* Main display */}
        <Text
          style={[styles.displayValue, { color: onSurface }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {input || '0'}
        </Text>

        {/* Grid */}
        <View style={styles.grid}>
          {/* Row 1 */}
          <View style={styles.row}>
            {['1', '2', '3'].map((k) => (
              <TouchableOpacity key={k} style={keyStyle()} onPress={() => handleKey(k)} activeOpacity={0.7}>
                <Text style={[styles.keyText, { color: theme.colors.onSurfaceVariant }]}>{k}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={keyStyle()} onPress={() => handleKey('backspace')} activeOpacity={0.7}>
              <FontAwesome name="long-arrow-left" size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.row}>
            {['4', '5', '6'].map((k) => (
              <TouchableOpacity key={k} style={keyStyle()} onPress={() => handleKey(k)} activeOpacity={0.7}>
                <Text style={[styles.keyText, { color: theme.colors.onSurfaceVariant }]}>{k}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={keyStyle()} onPress={() => handleKey('+')} activeOpacity={0.7}>
              <Text style={[styles.operatorText, { color: theme.colors.primary }]}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Row 3 */}
          <View style={styles.row}>
            {['7', '8', '9'].map((k) => (
              <TouchableOpacity key={k} style={keyStyle()} onPress={() => handleKey(k)} activeOpacity={0.7}>
                <Text style={[styles.keyText, { color: theme.colors.onSurfaceVariant }]}>{k}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={keyStyle()} onPress={() => handleKey('-')} activeOpacity={0.7}>
              <Text style={[styles.operatorText, { color: theme.colors.primary }]}>−</Text>
            </TouchableOpacity>
          </View>

          {/* Row 4 */}
          <View style={styles.row}>
            <TouchableOpacity style={keyStyle()} onPress={() => handleKey('.')} activeOpacity={0.7}>
              <Text style={[styles.keyText, { color: theme.colors.onSurfaceVariant }]}>.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={keyStyle()} onPress={() => handleKey('0')} activeOpacity={0.7}>
              <Text style={[styles.keyText, { color: theme.colors.onSurfaceVariant }]}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.key, { backgroundColor: theme.colors.primary, flex: 2 }]}
              onPress={() => handleKey('done')}
              activeOpacity={0.85}
            >
              <Text style={[styles.doneText, { color: theme.colors.onPrimary }]}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 11,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  tapeValue: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'right',
    paddingHorizontal: 8,
    minHeight: 24,
    opacity: 0.6,
  },
  displayValue: {
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'right',
    paddingHorizontal: 8,
    marginBottom: 4,
    letterSpacing: -1,
  },
  grid: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  key: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 22,
    fontWeight: '700',
  },
  operatorText: {
    fontSize: 26,
    fontWeight: '500',
  },
  doneText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
