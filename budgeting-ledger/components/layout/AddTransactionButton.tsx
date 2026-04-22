import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../providers/ThemeProvider';
import { FontAwesome } from '@expo/vector-icons';

export const AddTransactionButton: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [expanded, progress]);

  const expandedHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 76],
  });

  const expandedOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const plusRotation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View
      style={[
        styles.container,
        {
          bottom: insets.bottom + 72,
          backgroundColor: theme.colors.surfaceContainerHigh,
          shadowColor: theme.colors.outline,
        },
      ]}
    >
      <View style={styles.mainRow}>
        <TouchableOpacity
          style={styles.labelArea}
          onPress={() => router.push('/add')}
          activeOpacity={0.8}
        >
          <Text style={[styles.mainTitle, { color: theme.colors.onSurfaceVariant }]}>
            Add Transaction
          </Text>
          <Text style={[styles.mainSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Record expense or income
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setExpanded((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Animated.Text
            style={[
              styles.plusText,
              { color: theme.colors.onPrimary, transform: [{ rotate: plusRotation }] },
            ]}
          >
            +
          </Animated.Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.expandedArea, { height: expandedHeight, opacity: expandedOpacity }]}>
        <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
        <TouchableOpacity
          style={styles.secondaryRow}
          onPress={() => router.push('/bill-splitter')}
          activeOpacity={0.75}
        >
          <View style={styles.secondaryLabel}>
            <Text style={[styles.secondaryTitle, { color: theme.colors.onSurfaceVariant }]}>
              Split Bill
            </Text>
            <Text style={[styles.secondarySubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Split across categories
            </Text>
          </View>
          <View style={[styles.iconButton, { backgroundColor: theme.colors.primary }]}>
            <FontAwesome name="scissors" size={18} color={theme.colors.onPrimary} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'column',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 6,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelArea: {
    flex: 1,
    marginRight: 12,
    alignItems: 'flex-start',
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mainSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  expandedArea: {
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    marginVertical: 10,
    opacity: 0.4,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secondaryLabel: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  secondaryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  secondarySubtitle: {
    fontSize: 12,
  },
});