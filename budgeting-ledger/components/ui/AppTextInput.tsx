import React from 'react';
import { TextInput, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { useSharedStyles } from '../../theme/styles';

interface AppTextInputProps extends TextInputProps {
  containerStyle?: ViewStyle;
}

export const AppTextInput = React.forwardRef<TextInput, AppTextInputProps>(
  ({ style, containerStyle: _containerStyle, ...props }, ref) => {
    const { theme } = useTheme();
    const shared = useSharedStyles();
    return (
      <TextInput
        ref={ref}
        placeholderTextColor={props.placeholderTextColor ?? theme.colors.outline}
        {...props}
        style={[
          shared.inputs.base,
          { fontSize: 15, color: theme.colors.onSurface ?? theme.colors.onSurfaceVariant },
          style,
        ]}
      />
    );
  }
);
