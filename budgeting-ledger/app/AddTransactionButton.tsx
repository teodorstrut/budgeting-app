import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from './ThemeProvider';

export const AddTransactionButton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={{
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 80,
      borderRadius: 28,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surfaceContainerHigh,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 6,
    }}>
      <View style={{
        flex: 1,
        marginRight: 12,
        alignItems: 'flex-start',
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: 'bold',
          textAlign: 'left',
          color: theme.colors.onSurfaceVariant,
        }}>
          Add Transaction
        </Text>
        <Text style={{
          fontSize: 12,
          marginTop: 4,
          textAlign: 'left',
          color: theme.colors.onSurfaceVariant,
        }}>
          Record expense or income
        </Text>
      </View>
      <TouchableOpacity style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
      }} onPress={() => {}}>
        <Text style={{
          fontSize: 22,
          fontWeight: 'bold',
          color: '#1f2937',
        }}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
};