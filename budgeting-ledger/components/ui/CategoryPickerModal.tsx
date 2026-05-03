import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { AnimatedBackdrop } from './AnimatedBackdrop';
import { useTheme } from '../../providers/ThemeProvider';
import { useSharedStyles } from '../../theme/styles';
import { Category } from '../../database/repositories/categoryRepository';

interface CategoryPickerModalProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  onSelectCategory: (cat: Category) => void;
  selectedCategoryId?: number | null;
  selectedColor?: string;
  emptyMessage?: string;
  title?: string;
  onManageCategories?: () => void;
  /** When true, renders an "All Categories" chip above the category list. */
  showAllOption?: boolean;
  /** Called when the user taps the "All Categories" chip. */
  onSelectAll?: () => void;
}

export const CategoryPickerModal: React.FC<CategoryPickerModalProps> = ({
  visible,
  onClose,
  categories,
  onSelectCategory,
  selectedCategoryId,
  selectedColor,
  emptyMessage = 'No categories available.',
  title = 'Choose Category',
  onManageCategories,
  showAllOption = false,
  onSelectAll,
}) => {
  const { theme } = useTheme();
  const shared = useSharedStyles();
  const insets = useSafeAreaInsets();
  const onSurface = theme.colors.onSurface ?? theme.colors.onSurfaceVariant;
  const accentColor = selectedColor ?? theme.colors.primary;

  const translateY = useRef(new Animated.Value(visible ? 0 : 600)).current;
  const backdropOpacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const heightRef = useRef(0);
  const hasLaidOut = useRef(false);

  useEffect(() => {
    if (!hasLaidOut.current) return;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: visible ? 0 : heightRef.current,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  return (
    <>
      {/* Backdrop */}
      <AnimatedBackdrop opacity={backdropOpacity} visible={visible} onPress={onClose} />

      {/* Sheet */}
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colors.surfaceContainerLow,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
            transform: [{ translateY }],
          },
        ]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          heightRef.current = h;
          if (!hasLaidOut.current) {
            hasLaidOut.current = true;
            if (!visible) {
              translateY.setValue(h);
              backdropOpacity.setValue(0);
            }
          }
        }}
      >
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: onSurface }]}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <FontAwesome name="times" size={18} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {categories.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            {emptyMessage}
          </Text>
        ) : (
          <ScrollView contentContainerStyle={styles.chipGrid} keyboardShouldPersistTaps="handled">
            {showAllOption && (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategoryId == null ? accentColor : theme.colors.surfaceContainerHigh,
                    borderColor:
                      selectedCategoryId == null ? accentColor : theme.colors.outlineVariant,
                  },
                ]}
                onPress={() => { onSelectAll?.(); onClose(); }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        selectedCategoryId == null
                          ? theme.colors.onPrimary
                          : onSurface,
                    },
                  ]}
                >
                  All Categories
                </Text>
              </TouchableOpacity>
            )}
            {categories.map((cat) => {
              const isSelected = selectedCategoryId != null && cat.id === selectedCategoryId;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isSelected ? accentColor : theme.colors.surfaceContainerHigh,
                      borderColor: isSelected ? accentColor : theme.colors.outlineVariant,
                    },
                  ]}
                  onPress={() => onSelectCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, { color: isSelected ? theme.colors.onPrimary : onSurface }]}>
                    {cat.emoji ? `${cat.emoji} ` : ''}{cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {onManageCategories && (
          <TouchableOpacity
            style={[styles.manageCategoriesButton, { borderColor: theme.colors.outlineVariant }]}
            onPress={onManageCategories}
          >
            <Text style={[styles.manageCategoriesText, { color: theme.colors.primary }]}>
              + Manage Categories
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({

  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 11,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    padding: 24,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8 },
  categoryChip: { borderWidth: 1, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  manageCategoriesButton: { marginTop: 16, borderTopWidth: 1, paddingTop: 16, alignItems: 'center' },
  manageCategoriesText: { fontSize: 14, fontWeight: '600' },
});
