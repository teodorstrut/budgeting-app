import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from './ThemeProvider';

export const Header: React.FC = () => {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    }}>
      <Text style={{
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.primaryContainer,
      }}>
        Ledger
      </Text>
      <TouchableOpacity
        style={{
          padding: 8,
        }}
        onPress={() => {}}
      >
        <Text style={{
          fontSize: 24,
          color: theme.colors.primaryContainer,
        }}>
          ⚙️
        </Text>
      </TouchableOpacity>
    </View>
  );
};