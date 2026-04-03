import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from './ThemeProvider';

export const NavBar: React.FC = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surfaceContainerHigh,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 6,
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
      }}>
        <TouchableOpacity
          style={{
            borderRadius: 12,
            paddingVertical: 8,
            paddingHorizontal: 12,
            flex: 1,
            marginHorizontal: 2,
            backgroundColor: pathname === '/' ? theme.colors.primary : 'transparent',
          }}
          onPress={() => router.push('/')}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              textAlign: 'center',
              color: pathname === '/' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
            }}
          >
            🏠 Ledger
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            borderRadius: 12,
            paddingVertical: 8,
            paddingHorizontal: 12,
            flex: 1,
            marginHorizontal: 2,
            backgroundColor: pathname === '/history' ? theme.colors.primary : 'transparent',
          }}
          onPress={() => router.push('/history')}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              textAlign: 'center',
              color: pathname === '/history' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
            }}
          >
            📅 History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            borderRadius: 12,
            paddingVertical: 8,
            paddingHorizontal: 12,
            flex: 1,
            marginHorizontal: 2,
            backgroundColor: pathname === '/reports' ? theme.colors.primary : 'transparent',
          }}
          onPress={() => router.push('/reports')}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              textAlign: 'center',
              color: pathname === '/reports' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
            }}
          >
            📈 Reports
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            borderRadius: 12,
            paddingVertical: 8,
            paddingHorizontal: 12,
            flex: 1,
            marginHorizontal: 2,
            backgroundColor: pathname === '/budgets' ? theme.colors.primary : 'transparent',
          }}
          onPress={() => router.push('/budgets')}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              textAlign: 'center',
              color: pathname === '/budgets' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
            }}
          >
            💰 Budget
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};