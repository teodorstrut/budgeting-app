import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';

interface HeaderProps {
  title: string;
  titleColor?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightIconName?: React.ComponentProps<typeof FontAwesome>['name'];
  onRightPress?: () => void;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  titleColor,
  showBackButton = false,
  onBackPress,
  rightIconName,
  onRightPress,
  containerStyle,
  titleStyle,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.headerRow,
        {
          marginTop: 24,
          backgroundColor: theme.colors.surfaceContainerHigh,
          borderColor: theme.colors.outlineVariant,
          borderRadius: 24,
          borderWidth: 1,
          paddingHorizontal: 8,
          paddingVertical: 8,
          shadowColor: theme.colors.outline,
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 3 },
          shadowRadius: 6,
          elevation: 6,
        },
        containerStyle,
      ]}
    >
      <View style={styles.headerLeft}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <FontAwesome name="angle-left" size={26} color={titleColor ?? theme.colors.primary} />
          </TouchableOpacity>
        )}
        <Text
          style={[
            styles.title,
            {
              color: titleColor ?? theme.colors.primaryContainer,
              fontSize: 26,
              fontWeight: '800',
            },
            titleStyle,
          ]}
        >
          {title}
        </Text>
      </View>

      {rightIconName ? (
        <TouchableOpacity style={styles.rightButton} onPress={onRightPress}>
          <FontAwesome
            name={rightIconName}
            size={22}
            color={titleColor ?? theme.colors.primaryContainer}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.rightSpacer} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginLeft: 4,
    lineHeight: 30,
    includeFontPadding: false,
  },
  rightButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSpacer: {
    width: 40,
    height: 40,
  },
});