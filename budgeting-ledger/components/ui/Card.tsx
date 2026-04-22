import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useSharedStyles } from '../../theme/styles';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  const shared = useSharedStyles();
  return (
    <View style={[shared.card.base, style]}>
      {children}
    </View>
  );
};
