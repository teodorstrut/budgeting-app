import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
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
    <View style={{
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: insets.bottom + 72,
      borderRadius: 28,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: 'column',
      backgroundColor: theme.colors.surfaceContainerHigh,
      shadowColor: theme.colors.outline,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 6,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity
          style={{
            flex: 1,
            marginRight: 12,
            alignItems: 'flex-start',
          }}
          onPress={() => router.push('/add')}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.onSurfaceVariant }}>
            Add Transaction
          </Text>
          <Text style={{ fontSize: 12, marginTop: 4, color: theme.colors.onSurfaceVariant }}>
            Record expense or income
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.primary,
          }}
          onPress={() => setExpanded((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Animated.Text
            style={{
              fontSize: 22,
              fontWeight: 'bold',
              color: theme.colors.onPrimary,
              transform: [{ rotate: plusRotation }],
            }}
          >
            +
          </Animated.Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={{
          height: expandedHeight,
          opacity: expandedOpacity,
          overflow: 'hidden',
        }}
      >
        <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant, marginVertical: 10, opacity: 0.4 }} />
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          onPress={() => router.push('/bill-splitter')}
          activeOpacity={0.75}
        >
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: theme.colors.onSurfaceVariant }}>Split Bill</Text>
              <Text style={{ fontSize: 12, marginTop: 2, color: theme.colors.onSurfaceVariant }}>Split across categories</Text>
            </View>
          </View>
          <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary }}>
            <FontAwesome name="scissors" size={18} color={theme.colors.onPrimary} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};