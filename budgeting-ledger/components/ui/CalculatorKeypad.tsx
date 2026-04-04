import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';

interface CalculatorKeypadProps {
  visible: boolean;
  initialValue: string;
  onConfirm: (value: string) => void;
  onDismiss: () => void;
}

export const CalculatorKeypad: React.FC<CalculatorKeypadProps> = ({
  visible,
  initialValue,
  onConfirm,
  onDismiss,
}) => {
  const { theme } = useTheme();
  const [display, setDisplay] = useState(initialValue || '');

  useEffect(() => {
    if (visible) {
      setDisplay(initialValue || '');
    }
  }, [visible, initialValue]);

  const handleKey = (key: string) => {
    if (key === 'backspace') {
      setDisplay((prev) => prev.slice(0, -1));
      return;
    }

    if (key === 'done') {
      onConfirm(evaluate(display));
      return;
    }

    if (key === '+' || key === '-') {
      if (display === '' || display.slice(-1) === '+' || display.slice(-1) === '-') return;
      setDisplay((prev) => prev + key);
      return;
    }

    if (key === '.') {
      const segments = display.split(/[+\-]/);
      const last = segments[segments.length - 1];
      if (last.includes('.')) return;
    }

    setDisplay((prev) => prev + key);
  };

  const evaluate = (expr: string): string => {
    if (!expr) return '';
    try {
      if (!/^[\d.+\-]+$/.test(expr)) return '';
      // Split keeping sign, accumulate
      const parts = expr.match(/[+\-]?[\d.]+/g) ?? [];
      const result = parts.reduce<number>((acc, part) => acc + parseFloat(part), 0);
      if (isNaN(result)) return '';
      // Trim trailing .00
      return result % 1 === 0 ? String(result) : result.toFixed(2);
    } catch {
      return '';
    }
  };

  const displayValue = display || '0';

  const keyStyle = (flex = 1) => [
    styles.key,
    { backgroundColor: theme.colors.surfaceContainerHigh, flex },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.modalRoot}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss} />

        <View style={[styles.sheet, { backgroundColor: theme.colors.surfaceContainerLow }]}> 
          {/* Display */}
          <Text
            style={[styles.displayValue, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {displayValue}
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
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 36,
    gap: 12,
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
