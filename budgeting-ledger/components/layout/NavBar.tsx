import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../providers/ThemeProvider';

type NavItem = {
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  route: '/' | '/history' | '/reports' | '/budgets';
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Ledger', icon: 'book', route: '/' },
  { label: 'History', icon: 'history', route: '/history' },
  { label: 'Reports', icon: 'bar-chart', route: '/reports' },
  { label: 'Budget', icon: 'money', route: '/budgets' },
];

export const NavBar: React.FC = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceContainerHigh,
          paddingBottom: insets.bottom - 8,
        },
      ]}
    >
      <View
        style={[
          styles.row,
          {
            shadowColor: theme.colors.outline,
          },
        ]}
      >
        {NAV_ITEMS.map(({ label, icon, route }) => {
          const active = pathname === route;
          const color = active ? theme.colors.onPrimary : theme.colors.onSurfaceVariant;
          return (
            <TouchableOpacity
              key={route}
              style={[
                styles.tab,
                { backgroundColor: active ? theme.colors.primary : 'transparent' },
              ]}
              onPress={() => { if (!active) router.replace(route); }}
              activeOpacity={0.8}
            >
              <FontAwesome name={icon} size={14} color={color} style={styles.icon} />
              <Text style={[styles.label, { color }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingVertical: 8,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});