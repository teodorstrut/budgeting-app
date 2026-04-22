import React from 'react';
import { Text, View } from 'react-native';
import { useSharedStyles } from '../../theme/styles';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  /** Optional emoji or short text icon rendered above the title */
  icon?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle, icon }) => {
  const shared = useSharedStyles();

  return (
    <View style={shared.emptyState.container}>
      {icon ? <Text style={{ fontSize: 32 }}>{icon}</Text> : null}
      <Text style={shared.emptyState.title}>{title}</Text>
      {subtitle ? <Text style={shared.emptyState.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};
