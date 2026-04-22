import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';
import { useSharedStyles } from '../../theme/styles';

interface AppSelectorFieldProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const AppSelectorField: React.FC<AppSelectorFieldProps> = ({ children, style, ...props }) => {
  const shared = useSharedStyles();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      {...props}
      style={[
        shared.inputs.base,
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        style,
      ]}
    >
      {children}
    </TouchableOpacity>
  );
};
